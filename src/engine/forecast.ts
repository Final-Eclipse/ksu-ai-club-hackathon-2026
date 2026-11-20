import { findBuilding, findLot, getCampus, getPrimaryPlace } from '../data/campuses';
import { seeded } from './random';
import type {
  AvailabilityStatus,
  Campus,
  CvOverride,
  CvOverrides,
  Deck,
  DeckReading,
  LevelReading,
  LotForecast,
  MapPoint,
  OccupancyStatus,
  ParkingLotDefinition,
  ParkingRecommendation,
  ParkingReport,
  PlannerState,
  Scenario,
  WeatherSnapshot,
} from '../types';

export const OCCUPANCY = { filling: 0.8, full: 0.95 } as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function statusFor(occupancy: number): OccupancyStatus {
  if (occupancy < OCCUPANCY.filling) return 'open';
  if (occupancy <= OCCUPANCY.full) return 'filling';
  return 'full';
}

export function predictOccupancy(deck: Deck, minute: number, scenario: Scenario): number {
  const peakCurve = Math.exp(-Math.pow((minute - 690) / 150, 2));
  let value = deck.baseOccupancy + deck.peakBoost * peakCurve + scenario.occupancyDelta;
  if (scenario.occupancyFloor !== null) {
    const floor = scenario.occupancyFloor + seeded(`${deck.id}|floor`)() * 0.015;
    value = Math.max(value, floor);
  }
  return Math.max(0.05, Math.min(0.995, value));
}

export function readDeck(deck: Deck, minute: number, scenario: Scenario): DeckReading {
  const predictedOccupancy = predictOccupancy(deck, minute, scenario);
  const spread = Math.min(0.1, 1 - predictedOccupancy, predictedOccupancy);
  const random = seeded(`${deck.id}|${scenario.id}|${Math.floor(minute / 15)}`);
  const totalBayCount = deck.levels * deck.baysPerLevel;
  const baseBayCapacity = Math.floor(deck.capacity / totalBayCount);
  const capacityRemainder = deck.capacity - baseBayCapacity * totalBayCount;
  const levels: LevelReading[] = [];

  for (let levelIndex = 0; levelIndex < deck.levels; levelIndex += 1) {
    const levelNumber = levelIndex + 1;
    const levelProgress = deck.levels === 1 ? 0 : levelIndex / (deck.levels - 1);
    const levelOccupancy = clamp01(predictedOccupancy + spread * (1 - 2 * levelProgress));
    const rawJitters = Array.from(
      { length: deck.baysPerLevel },
      () => random() * 0.08 - 0.04,
    );
    const jitterMean = rawJitters.reduce((total, jitter) => total + jitter, 0) / rawJitters.length;
    const bays = rawJitters.map((jitter, bayIndex) => {
      const globalBayIndex = levelIndex * deck.baysPerLevel + bayIndex;
      const isLastBay = globalBayIndex === totalBayCount - 1;
      const capacity = baseBayCapacity + (isLastBay ? capacityRemainder : 0);
      const bayOccupancy = clamp01(levelOccupancy + jitter - jitterMean);
      const open = Math.round(capacity * (1 - bayOccupancy));
      const label = String.fromCharCode(65 + bayIndex);
      return {
        id: `${deck.id}-l${levelNumber}-${label.toLowerCase()}`,
        label,
        capacity,
        open,
        status: statusFor(1 - open / capacity),
      };
    });
    const capacity = bays.reduce((total, bay) => total + bay.capacity, 0);
    const open = bays.reduce((total, bay) => total + bay.open, 0);
    levels.push({
      level: levelNumber,
      capacity,
      open,
      status: statusFor(1 - open / capacity),
      bays,
    });
  }

  const open = levels.reduce((total, level) => total + level.open, 0);
  const occupancy = 1 - open / deck.capacity;
  const bestLevelReading = levels.reduce((best, level) => (level.open > best.open ? level : best));

  return {
    deckId: deck.id,
    predictedOccupancy,
    occupancy,
    open,
    status: statusFor(occupancy),
    levels,
    bestLevel: bestLevelReading.level,
    cvConfidence: 0.9 + random() * 0.08,
  };
}

export function readDecks(campus: Campus, minute: number, scenario: Scenario): DeckReading[] {
  return campus.decks.map((deck) => readDeck(deck, minute, scenario));
}

function applyLevelOverride(level: LevelReading, override: CvOverride): LevelReading {
  if (override.total <= 0 || level.capacity <= 0) return level;
  const openRatio = clamp01(override.open / override.total);
  let cumulativeCapacity = 0;
  let allocatedOpen = 0;
  const bays = level.bays.map((bay) => {
    cumulativeCapacity += bay.capacity;
    const cumulativeOpen = Math.round(cumulativeCapacity * openRatio);
    const open = cumulativeOpen - allocatedOpen;
    allocatedOpen = cumulativeOpen;
    return { ...bay, open, status: statusFor(1 - open / bay.capacity) };
  });
  const open = bays.reduce((sum, bay) => sum + bay.open, 0);
  return { ...level, open, status: statusFor(1 - open / level.capacity), bays };
}

export function applyCvOverrides(
  readings: readonly DeckReading[],
  overrides: CvOverrides,
): DeckReading[] {
  return readings.map((reading) => {
    const deckOverrides = overrides[reading.deckId];
    if (!deckOverrides || !Object.keys(deckOverrides).length) return reading;
    const levels = reading.levels.map((level) => {
      const override = deckOverrides[level.level];
      return override ? applyLevelOverride(level, override) : level;
    });
    const totalCapacity = levels.reduce((sum, level) => sum + level.capacity, 0);
    const open = levels.reduce((sum, level) => sum + level.open, 0);
    if (totalCapacity <= 0) return reading;
    const firstLevel = levels[0];
    if (!firstLevel) return reading;
    const bestLevel = levels.slice(1).reduce(
      (best, level) => level.open > best.open ? level : best,
      firstLevel,
    );
    const occupancy = 1 - open / totalCapacity;
    return {
      ...reading,
      occupancy,
      open,
      status: statusFor(occupancy),
      levels,
      bestLevel: bestLevel.level,
    };
  });
}

export function searchMinutes(occupancy: number): number {
  if (occupancy <= OCCUPANCY.filling) return 2;
  if (occupancy <= OCCUPANCY.full) return 2 + (occupancy - OCCUPANCY.filling) * 40;
  return 8 + (occupancy - OCCUPANCY.full) * 300;
}

// Compatibility exports retained for the original OwlPark utility surface.
export const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  open: 'Room available',
  filling: 'Filling up',
  tight: 'Almost full',
  full: 'Likely full',
};

export function toLocalDateTimeValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function getDefaultArrival(): string {
  const arrival = new Date();
  arrival.setMinutes(arrival.getMinutes() + 60 - (arrival.getMinutes() % 15), 0, 0);
  return toLocalDateTimeValue(arrival);
}

function legacyStatus(occupancy: number): AvailabilityStatus {
  if (occupancy < 0.55) return 'open';
  if (occupancy < 0.8) return 'filling';
  if (occupancy <= 0.95) return 'tight';
  return 'full';
}

export function forecastLot(
  lot: ParkingLotDefinition,
  state: PlannerState,
  reports: ParkingReport[],
  weather?: WeatherSnapshot,
): LotForecast {
  const arrival = new Date(state.arrival);
  const hour = Number.isNaN(arrival.getTime()) ? 11 : arrival.getHours() + arrival.getMinutes() / 60;
  const peak = Math.exp(-Math.pow((hour * 60 - 690) / 150, 2));
  const rainAdjustment = weather && weather.precipitationProbability >= 50 ? 0.04 : 0;
  const relevantReports = reports.filter((report) => report.lotId === lot.id);
  const reportAdjustment = relevantReports.length ? Math.min(0.12, relevantReports.length * 0.03) : 0;
  const occupancy = Math.max(0.05, Math.min(0.995, lot.baseDemand + peak * 0.25 + rainAdjustment + reportAdjustment));
  return {
    occupancy,
    status: legacyStatus(occupancy),
    confidence: Math.min(0.92, 0.62 + relevantReports.length * 0.08),
    activeReportCount: relevantReports.length,
    searchMinutes: Math.round(searchMinutes(occupancy)),
    factors: ['OwlFlow compatibility forecast'],
  };
}

function pointDistance(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function estimateWalkMinutes(lot: ParkingLotDefinition, destination: MapPoint): number {
  return Math.max(1, Math.round(pointDistance(lot.point, destination) * 0.13));
}

export function buildRecommendations(
  state: PlannerState,
  reports: ParkingReport[],
  weather?: WeatherSnapshot,
): ParkingRecommendation[] {
  const campus = getCampus(state.campusId);
  const primaryPlace = getPrimaryPlace(campus);
  const building = findBuilding(state.destinationId) ?? findBuilding(primaryPlace.id);
  if (!building) return [];

  return campus.decks
    .map((deck) => findLot(deck.id))
    .filter((lot): lot is ParkingLotDefinition => Boolean(lot))
    .map((lot) => {
      const forecast = forecastLot(lot, state, reports, weather);
      const walkMinutes = estimateWalkMinutes(lot, building.point);
      const parkingToDoorMinutes = forecast.searchMinutes + walkMinutes;
      return {
        lot,
        forecast,
        walkMinutes,
        parkingToDoorMinutes,
        totalTripMinutes: state.commuteMinutes + parkingToDoorMinutes,
        score: Math.max(0, Math.min(1, 1 - forecast.occupancy * 0.5 - walkMinutes / 100)),
        reasons: ['Compatibility recommendation from the OwlFlow model'],
        warnings: [],
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function calculateLeaveTime(arrival: string, totalTripMinutes: number): Date {
  const target = new Date(arrival);
  return new Date(target.getTime() - totalTripMinutes * 60_000);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function activeReportCount(reports: ParkingReport[]): number {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  return reports.filter((report) => report.createdAt >= cutoff).length;
}
