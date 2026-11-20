import { walkMinutes } from './geo';
import { seeded } from './random';
import type {
  DietaryTag,
  DiningHall,
  DiningStation,
  DiningStationReading,
  GeoPoint,
  MenuItem,
  PitStopPlan,
  Scenario,
} from '../types';

function clampPercent(value: number): number {
  return Math.max(5, Math.min(100, Math.round(value)));
}

export function readDiningHall(
  hall: DiningHall,
  minute: number,
  scenario: Scenario,
): DiningStationReading[] {
  const lunchPeak = Math.exp(-Math.pow((minute - 750) / 105, 2));
  const dinnerPeak = 0.65 * Math.exp(-Math.pow((minute - 1080) / 120, 2));
  const mealDemand = Math.max(lunchPeak, dinnerPeak);

  return hall.stations.map((station) => {
    const random = seeded(`${hall.id}|${station.id}|${scenario.id}|${Math.floor(minute / 15)}`);
    const queueMin = Math.max(
      1,
      Math.round((station.baseQueue + station.perMin * mealDemand) * scenario.crowdMult + random() * 2),
    );
    const crowdPct = clampPercent(
      (28 + mealDemand * 58) * scenario.crowdMult + (random() - 0.5) * 10,
    );
    return { stationId: station.id, queueMin, crowdPct };
  });
}

export function menuMatches(item: MenuItem, tags: readonly DietaryTag[]): boolean {
  return tags.every((tag) => item.tags.includes(tag));
}

function matchingItems(station: DiningStation, tags: readonly DietaryTag[]): MenuItem[] {
  if (!tags.length) return station.menuItems;
  return station.menuItems.filter((item) => menuMatches(item, tags));
}

export function planDining(
  hall: DiningHall,
  minute: number,
  scenario: Scenario,
  dietaryTags: readonly DietaryTag[],
  originGeo: GeoPoint,
  classGeo: GeoPoint,
  classStartMin: number,
): PitStopPlan {
  const readings = readDiningHall(hall, minute, scenario);
  const candidates = hall.stations.flatMap((station) => {
    const items = matchingItems(station, dietaryTags);
    const reading = readings.find((candidate) => candidate.stationId === station.id);
    if (!items.length || !reading) return [];
    return [{ station, items, reading }];
  });
  const fallbackStation = hall.stations[0];
  if (!fallbackStation) throw new Error(`${hall.name} requires at least one station.`);
  const fallbackReading = readings.find((reading) => reading.stationId === fallbackStation.id);
  if (!fallbackReading) throw new Error(`${fallbackStation.name} requires a queue reading.`);
  const fallbackItem = fallbackStation.menuItems[0];
  if (!fallbackItem) throw new Error(`${fallbackStation.name} requires at least one menu item.`);

  const best = candidates.reduce(
    (winner, candidate) => candidate.reading.queueMin < winner.reading.queueMin ? candidate : winner,
    candidates[0] ?? { station: fallbackStation, items: [fallbackItem], reading: fallbackReading },
  );
  const random = seeded(`${hall.id}|menu|${best.station.id}|${dietaryTags.join('-')}|${Math.floor(minute / 15)}`);
  const itemIndex = Math.min(best.items.length - 1, Math.floor(random() * best.items.length));
  const menuItem = best.items[itemIndex] ?? best.items[0] ?? fallbackItem;
  const walkMin = walkMinutes(originGeo, hall.geo, scenario.walkMult);
  const startMin = minute + walkMin + best.reading.queueMin;
  const endMin = startMin + 20;
  const onwardWalk = walkMinutes(hall.geo, classGeo, scenario.walkMult);

  return {
    hallId: hall.id,
    hallName: hall.name,
    stationId: best.station.id,
    stationName: best.station.name,
    menuItem,
    queueMin: best.reading.queueMin,
    crowdPct: best.reading.crowdPct,
    walkMin,
    startMin,
    endMin,
    fitsBeforeClass: endMin + onwardWalk <= classStartMin,
  };
}
