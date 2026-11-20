import { resolveOrigin } from '../data/origins';
import { busLoadForScenario } from './intel';
import { searchMinutes } from './forecast';
import { walkMinutes } from './geo';
import { formatClock } from './time';
import type {
  Campus,
  CommuteDecision,
  CommuteMode,
  CommuteOption,
  CommuteProfile,
  DeckReading,
  DropOffPin,
  GeoPoint,
  Scenario,
  UberTripDetails,
} from '../types';

export const FARE = { base: 2.55, perMile: 1.15, perMin: 0.3, booking: 2.75 } as const;
export const COST_WEIGHT = 0.5;
export const LATE_PENALTY = 60;
export const CONGESTION_MIN = { low: 0, medium: 2, high: 4 } as const;

export interface CommuteInput {
  campus: Campus;
  target: { name: string; geo: GeoPoint };
  classStartMin: number;
  arrivalMin: number;
  profile: CommuteProfile;
  scenario: Scenario;
  readings: DeckReading[];
  downstreamMin?: number;
}

function lowest<T>(items: readonly T[], score: (item: T) => number): T {
  const first = items[0];
  if (!first) throw new Error('OwlFlow requires at least one mobility candidate.');
  return items.slice(1).reduce((best, item) => (score(item) < score(best) ? item : best), first);
}

function roundedLeg(label: string, minutes: number) {
  return { label, minutes: Math.round(minutes) };
}

export interface UberPickup {
  label: string;
  geo: GeoPoint | null;
  address?: string;
}

function uberParams(dropoff: DropOffPin, pickup: UberPickup): Record<string, string> {
  const params: Record<string, string> = { action: 'setPickup' };
  if (pickup.geo) {
    params['pickup[latitude]'] = pickup.geo.lat.toFixed(6);
    params['pickup[longitude]'] = pickup.geo.lng.toFixed(6);
    params['pickup[nickname]'] = pickup.label;
    params['pickup[formatted_address]'] = pickup.address ?? pickup.label;
  } else {
    params.pickup = 'my_location';
    params['pickup[nickname]'] = pickup.label;
  }
  params['dropoff[latitude]'] = dropoff.geo.lat.toFixed(6);
  params['dropoff[longitude]'] = dropoff.geo.lng.toFixed(6);
  params['dropoff[nickname]'] = dropoff.name;
  params['dropoff[formatted_address]'] = dropoff.address;
  return params;
}

export function buildUberDeepLink(dropoff: DropOffPin, pickup: UberPickup): string {
  const params = uberParams(dropoff, pickup);
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `https://m.uber.com/ul/?${query}`;
}

function explanationFor(
  winner: CommuteOption,
  runnerUp: CommuteOption,
  driveOption: CommuteOption,
  uberOption: CommuteOption,
  fallback: CommuteDecision['fallback'],
  targetName: string,
): string {
  let sentence: string;

  if (winner.mode === 'drive' && winner.deck) {
    const occupancy = Math.round(winner.deck.reading.occupancy * 100);
    const advantage = Math.max(1, Math.round(runnerUp.score - winner.score));
    sentence = `${winner.deck.deck.name} is ${occupancy}% full with ${winner.deck.reading.open} open spots on camera, so Drive + Park reaches ${targetName} by ${formatClock(winner.arriveMin)}, ${advantage} min ahead of ${runnerUp.title}`;
  } else if (fallback === 'deckFull' && winner.mode === 'uber' && winner.uber) {
    const occupancy = driveOption.deck ? Math.round(driveOption.deck.reading.occupancy * 100) : 98;
    const search = driveOption.deck ? Math.round(driveOption.deck.searchMin) : 17;
    const deckName = driveOption.deck?.deck.name ?? 'The closest deck';
    sentence = `${deckName} is ${occupancy}% full, so OwlFlow skips the ~${search}-min deck hunt and drops you at ${winner.uber.pin.name} to reach ${targetName} by ${formatClock(winner.arriveMin)}`;
  } else if (fallback === 'deckFull' && winner.mode === 'shuttle' && winner.shuttle) {
    const occupancy = driveOption.deck ? Math.round(driveOption.deck.reading.occupancy * 100) : 98;
    const deckName = driveOption.deck?.deck.name ?? 'The closest deck';
    sentence = `${deckName} is ${occupancy}% full, so OwlFlow routes you through Big Owl Bus from ${winner.shuttle.route.remoteLot} to reach ${targetName} by ${formatClock(winner.arriveMin)} at no cost`;
  } else if (fallback === 'weather' && winner.mode === 'shuttle') {
    const fare = uberOption.fareUsd ? Math.round((uberOption.fareUsd.low + uberOption.fareUsd.high) / 2) : 0;
    sentence = `Rain and heavy traffic triggered the fallback rule, and with Uber surging to ~$${fare} Big Owl Bus gets you to ${targetName} by ${formatClock(winner.arriveMin)} for $0`;
  } else if (fallback === 'weather' && winner.mode === 'uber' && winner.uber) {
    sentence = `Rain and heavy traffic triggered the fallback rule, so an Uber drop-off at ${winner.uber.pin.name} gets you to ${targetName} by ${formatClock(winner.arriveMin)}`;
  } else {
    const advantage = Math.max(1, Math.round(runnerUp.totalMin - winner.totalMin));
    sentence = `${winner.title} beats driving by ${advantage} min today, reaching ${targetName} by ${formatClock(winner.arriveMin)}`;
  }

  if (winner.slackMin < 0) {
    return `${winner.title} is the fastest eligible route to ${targetName} by ${formatClock(winner.arriveMin)}; every option is late, so leave ${-winner.slackMin + 5} min earlier.`;
  }
  return `${sentence}.`;
}

export function getCommuteOption(
  decision: CommuteDecision,
  mode: CommuteMode,
): CommuteOption {
  const option = decision.options.find((candidate) => candidate.mode === mode);
  if (!option) throw new Error(`Commute decision is missing ${mode}.`);
  return option;
}

export function decideCommute(input: CommuteInput): CommuteDecision {
  const { campus, target, classStartMin, arrivalMin, profile, scenario, readings } = input;
  const downstreamMin = input.downstreamMin ?? 0;
  const departMin = arrivalMin - profile.driveMin;
  const driveDuration = profile.driveMin * scenario.trafficMult;

  const deckCandidates = campus.decks.flatMap((deck) => {
    const reading = readings.find((candidate) => candidate.deckId === deck.id);
    if (!reading) return [];
    return [{
      deck,
      reading,
      walkMin: walkMinutes(deck.geo, target.geo, scenario.walkMult),
      searchMin: searchMinutes(reading.occupancy),
    }];
  });
  const driveDeck = lowest(deckCandidates, (candidate) => candidate.searchMin + candidate.walkMin);
  const driveTotalRaw = driveDuration + driveDeck.searchMin + 2 + driveDeck.walkMin;
  const driveArriveRaw = departMin + driveTotalRaw;
  const driveSlackRaw = classStartMin - (driveArriveRaw + downstreamMin);
  const deckIsFull = driveDeck.reading.occupancy > 0.95;
  const weatherFallback = scenario.weather === 'rain' || scenario.traffic === 'heavy';
  const driveEligible = !deckIsFull && !weatherFallback;
  const driveOption: CommuteOption = {
    mode: 'drive',
    title: 'Drive + Park',
    totalMin: Math.round(driveTotalRaw),
    arriveMin: Math.round(driveArriveRaw),
    slackMin: Math.round(driveSlackRaw),
    legs: [
      roundedLeg(`Drive from ${profile.originLabel}`, driveDuration),
      roundedLeg('Find a spot (CV-guided)', driveDeck.searchMin),
      roundedLeg('Park & exit', 2),
      roundedLeg(`Walk to ${target.name}`, driveDeck.walkMin),
    ],
    walkMin: driveDeck.walkMin,
    fareUsd: null,
    arrivalPoint: { name: driveDeck.deck.name, geo: driveDeck.deck.geo },
    deck: driveDeck,
    eligible: driveEligible,
    score: driveTotalRaw + (driveSlackRaw < 5 ? LATE_PENALTY : 0),
  };

  const pinCandidates = campus.pins.map((pin) => ({
    pin,
    walkMin: walkMinutes(pin.geo, target.geo, scenario.walkMult),
    congestionMin: CONGESTION_MIN[pin.congestion],
  }));
  const uberPin = lowest(pinCandidates, (candidate) => candidate.congestionMin + candidate.walkMin);
  const uberWaitRaw = 4 + scenario.uberExtraWaitMin;
  const uberRideRaw = driveDuration * 0.95;
  const uberTotalRaw = uberWaitRaw + uberRideRaw + uberPin.congestionMin + uberPin.walkMin;
  const uberFareRaw =
    (FARE.base +
      FARE.perMile * profile.distanceMi +
      FARE.perMin * uberRideRaw +
      FARE.booking) *
    scenario.uberSurge;
  const uberArriveRaw = departMin + uberTotalRaw;
  const uberSlackRaw = classStartMin - (uberArriveRaw + downstreamMin);
  const originPreset = resolveOrigin(profile.originLabel);
  const originGeo = profile.originGeo === undefined ? originPreset?.geo ?? null : profile.originGeo;
  const originAddress = profile.originAddress ?? originPreset?.label;
  const uberPickup: UberPickup = {
    label: originAddress ?? profile.originLabel,
    geo: originGeo,
    ...(originAddress ? { address: originAddress } : {}),
  };
  const deepLink = buildUberDeepLink(uberPin.pin, uberPickup);
  const tripDetails: UberTripDetails = {
    pickupLabel: uberPickup.label,
    pickupGeo: uberPickup.geo,
    dropoffLabel: uberPin.pin.name,
    dropoffAddress: uberPin.pin.address,
    dropoffGeo: uberPin.pin.geo,
    distanceMi: profile.distanceMi,
    rideMin: Math.round(uberRideRaw),
    deepLink,
    params: uberParams(uberPin.pin, uberPickup),
  };
  const uberOption: CommuteOption = {
    mode: 'uber',
    title: 'Uber Campus Drop-Off',
    totalMin: Math.round(uberTotalRaw),
    arriveMin: Math.round(uberArriveRaw),
    slackMin: Math.round(uberSlackRaw),
    legs: [
      roundedLeg('Wait for pickup', uberWaitRaw),
      roundedLeg(`Ride from ${profile.originLabel}`, uberRideRaw),
      roundedLeg('Curb congestion buffer', uberPin.congestionMin),
      roundedLeg(`Walk to ${target.name}`, uberPin.walkMin),
    ],
    walkMin: uberPin.walkMin,
    fareUsd: {
      low: Math.round(uberFareRaw * 0.9),
      high: Math.round(uberFareRaw * 1.1),
    },
    arrivalPoint: { name: uberPin.pin.name, geo: uberPin.pin.geo },
    uber: {
      pin: uberPin.pin,
      deepLink,
      waitMin: Math.round(uberWaitRaw),
      tripDetails,
    },
    tripDetails,
    eligible: true,
    score: uberTotalRaw + COST_WEIGHT * uberFareRaw + (uberSlackRaw < 5 ? LATE_PENALTY : 0),
  };

  const shuttleRoute = campus.shuttle;
  const shuttleLotDriveRaw = driveDuration * 0.85;
  const shuttleWaitRaw = shuttleRoute.headwayMin / 2 + scenario.shuttleDelayMin;
  const shuttleRideRaw = shuttleRoute.rideMin * (1 + (scenario.trafficMult - 1) * 0.5);
  const shuttleWalkMin = walkMinutes(shuttleRoute.stopGeo, target.geo, scenario.walkMult);
  const shuttleTotalRaw = shuttleLotDriveRaw + 2 + shuttleWaitRaw + shuttleRideRaw + shuttleWalkMin;
  const shuttleArriveRaw = departMin + shuttleTotalRaw;
  const shuttleSlackRaw = classStartMin - (shuttleArriveRaw + downstreamMin);
  const shuttleOption: CommuteOption = {
    mode: 'shuttle',
    title: 'Big Owl Bus',
    totalMin: Math.round(shuttleTotalRaw),
    arriveMin: Math.round(shuttleArriveRaw),
    slackMin: Math.round(shuttleSlackRaw),
    legs: [
      roundedLeg(`Drive to ${shuttleRoute.remoteLot}`, shuttleLotDriveRaw),
      roundedLeg('Park & board', 2),
      roundedLeg('Expected bus wait', shuttleWaitRaw),
      roundedLeg('Big Owl Bus ride', shuttleRideRaw),
      roundedLeg(`Walk to ${target.name}`, shuttleWalkMin),
    ],
    walkMin: shuttleWalkMin,
    fareUsd: null,
    arrivalPoint: { name: shuttleRoute.stopName, geo: shuttleRoute.stopGeo },
    shuttle: {
      route: shuttleRoute,
      waitMin: Math.round(shuttleWaitRaw),
      loadPct: busLoadForScenario(scenario, campus.id, arrivalMin),
    },
    eligible: true,
    score: shuttleTotalRaw + (shuttleSlackRaw < 5 ? LATE_PENALTY : 0),
  };

  const options = [driveOption, uberOption, shuttleOption];
  const eligibleOptions = options.filter((option) => option.eligible);
  const winnerOption = lowest(eligibleOptions, (option) => option.score);
  const runnerUp = lowest(
    eligibleOptions.filter((option) => option.mode !== winnerOption.mode),
    (option) => option.score,
  );
  const fallback: CommuteDecision['fallback'] = deckIsFull
    ? 'deckFull'
    : weatherFallback
      ? 'weather'
      : null;
  const winner: CommuteMode = winnerOption.mode;

  return {
    options,
    winner,
    fallback,
    explanation: explanationFor(
      winnerOption,
      runnerUp,
      driveOption,
      uberOption,
      fallback,
      target.name,
    ),
    targetName: target.name,
  };
}
