import { busLoadForScenario } from './intel';
import { seeded } from './random';
import type {
  BusTelemetry,
  BusTrackerRoute,
  BusTrackerVehicle,
  CampusId,
  Scenario,
} from '../types';

export interface BusPoint {
  x: number;
  y: number;
  angle: number;
}

export interface BusPathPoint {
  x: number;
  y: number;
}

function routePhase(bus: BusTrackerVehicle, elapsedMs: number): number {
  const phase = seeded(`${bus.id}|phase`)();
  return (phase + elapsedMs * bus.speed) % 1;
}

export function pointAlongRoute(
  points: readonly BusPathPoint[],
  progress: number,
): BusPoint {
  const first = points[0];
  if (!first) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { x: first.x, y: first.y, angle: 0 };

  const segments = points.slice(1).map((point, index) => {
    const start = points[index] ?? first;
    return { start, end: point, length: Math.hypot(point.x - start.x, point.y - start.y) };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  let target = Math.max(0, Math.min(1, progress)) * totalLength;

  for (const segment of segments) {
    if (target <= segment.length) {
      const ratio = segment.length > 0 ? target / segment.length : 0;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
        angle: Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) * 180 / Math.PI,
      };
    }
    target -= segment.length;
  }

  const last = points[points.length - 1] ?? first;
  return { x: last.x, y: last.y, angle: 0 };
}

export function busPoint(
  points: readonly BusPathPoint[],
  bus: BusTrackerVehicle,
  elapsedMs: number,
): BusPoint {
  return pointAlongRoute(points, routePhase(bus, elapsedMs));
}

export function routePolyline(points: readonly BusPathPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

export function busTelemetry(
  route: BusTrackerRoute,
  bus: BusTrackerVehicle,
  scenario: Scenario,
  nowSeconds: number,
  campusId: CampusId,
  minute: number,
): BusTelemetry {
  const random = seeded(`${route.id}|${bus.id}|telemetry|${Math.floor(nowSeconds / 30)}`);
  const loadPct = Math.min(100, Math.max(0, busLoadForScenario(scenario, campusId, minute) + Math.round(random() * 8 - 4)));
  const delayMin = scenario.traffic === 'heavy'
    ? Math.max(1, scenario.shuttleDelayMin)
    : scenario.shuttleDelayMin > 3
      ? scenario.shuttleDelayMin
      : 0;
  const localStops = route.stops.filter((stop) => stop.campusId === campusId);
  const candidateStops = localStops.length > 0 ? localStops : route.stops;
  const stopIndex = Math.min(candidateStops.length - 1, Math.floor(random() * candidateStops.length));
  const stop = candidateStops[stopIndex] ?? candidateStops[0];

  return {
    busId: bus.id,
    loadPct,
    delayMin,
    nextStop: stop?.name ?? 'Next campus stop',
    etaMin: Math.max(1, Math.round(route.headwayMin * (0.2 + random() * 0.65) + delayMin)),
  };
}
