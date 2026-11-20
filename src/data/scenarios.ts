import type { Scenario, ScenarioId } from '../types';

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'normal',
    label: 'Normal Morning',
    occupancyDelta: 0,
    occupancyFloor: null,
    trafficMult: 1,
    walkMult: 1,
    uberSurge: 1,
    uberExtraWaitMin: 0,
    shuttleDelayMin: 0,
    shuttleLoadPct: 55,
    weather: 'clear',
    traffic: 'normal',
    crowdMult: 1,
  },
  {
    id: 'decksFull',
    label: 'Simulate: Decks Hit 98% Full',
    occupancyDelta: 0,
    occupancyFloor: 0.98,
    trafficMult: 1.1,
    walkMult: 1,
    uberSurge: 1.2,
    uberExtraWaitMin: 1,
    shuttleDelayMin: 9,
    shuttleLoadPct: 98,
    weather: 'clear',
    traffic: 'normal',
    crowdMult: 1.1,
  },
  {
    id: 'rainSurge',
    label: 'Simulate: Rain & Traffic Surge',
    occupancyDelta: 0.08,
    occupancyFloor: null,
    trafficMult: 1.6,
    walkMult: 1.25,
    uberSurge: 2,
    uberExtraWaitMin: 7,
    shuttleDelayMin: 3,
    shuttleLoadPct: 92,
    weather: 'rain',
    traffic: 'heavy',
    crowdMult: 1.3,
  },
];

export function getScenario(id: ScenarioId): Scenario {
  const scenario = SCENARIOS.find((candidate) => candidate.id === id);
  const fallback = SCENARIOS[0];
  if (!fallback) throw new Error('OwlFlow requires at least one scenario.');
  return scenario ?? fallback;
}
