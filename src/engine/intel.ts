import { CAMPUSES } from '../data/campuses';
import { PEAK_WINDOWS } from '../data/ksuCalendar';
import { walkMinutes } from './geo';
import { seeded } from './random';
import { classesForDay } from './schedule';
import { formatClock } from './time';
import type {
  Campus,
  CampusAlert,
  CampusId,
  ClassSession,
  DayCode,
  Scenario,
} from '../types';

const EXPRESS_STOPS = {
  kennesaw: {
    name: 'The Commons',
    geo: { lat: 34.0396658, lng: -84.5824647 },
  },
  marietta: {
    name: 'Joe Mack Wilson Student Center',
    geo: { lat: 33.940537, lng: -84.5204129 },
  },
} as const;

export interface CampusIntelInput {
  campus: Campus;
  day: DayCode;
  classes: readonly ClassSession[];
  arrivalMin: number;
  classStartMin: number;
  scenario: Scenario;
  uberUrl: string;
}

function clampedPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function busLoadForScenario(
  scenario: Scenario,
  campusId: CampusId,
  minute: number,
): number {
  const jitter = seeded(`bus-load|${scenario.id}|${campusId}|${Math.floor(minute / 15)}`)() * 10 - 5;
  return clampedPercent(scenario.shuttleLoadPct + jitter);
}

function sessionPlace(session: ClassSession) {
  return CAMPUSES[session.campusId].places.find((place) => place.id === session.buildingId);
}

function passUpAlert(input: CampusIntelInput): CampusAlert | null {
  const load = busLoadForScenario(input.scenario, input.campus.id, input.arrivalMin);
  if (load <= 85) return null;
  return {
    id: `pass-up-${input.scenario.id}-${input.campus.id}`,
    severity: load >= 95 ? 'critical' : 'warn',
    title: 'High Pass-Up Risk on Big Owl Bus',
    body: 'High Pass-Up Risk on Big Owl Bus (bus full at stop) — switch to Uber Drop-Off or leave 15 min earlier',
    actions: [
      { id: 'leave-earlier-pass-up', label: 'Leave 15 min earlier', kind: 'setArrival', arrivalMin: Math.max(0, input.arrivalMin - 15) },
      { id: 'uber-pass-up', label: 'Open in Uber →', kind: 'openUrl', url: input.uberUrl },
    ],
  };
}

function crossCampusAlerts(input: CampusIntelInput): CampusAlert[] {
  const sessions = classesForDay(input.classes, input.day);
  const alerts: CampusAlert[] = [];
  for (let index = 0; index < sessions.length - 1; index += 1) {
    const from = sessions[index];
    const to = sessions[index + 1];
    if (!from || !to || from.campusId === to.campusId) continue;
    const fromPlace = sessionPlace(from);
    const toPlace = sessionPlace(to);
    if (!fromPlace || !toPlace) continue;
    const originStop = EXPRESS_STOPS[from.campusId];
    const destinationStop = EXPRESS_STOPS[to.campusId];
    const firstWalk = walkMinutes(fromPlace.geo, originStop.geo, input.scenario.walkMult);
    const atStopMin = from.endMin + firstWalk;
    const departureMin = Math.ceil(atStopMin / 20) * 20;
    const rideMin = 25 * (1 + (input.scenario.trafficMult - 1) * 0.5);
    const finalWalk = walkMinutes(destinationStop.geo, toPlace.geo, input.scenario.walkMult);
    const slack = to.startMin - (departureMin + rideMin + finalWalk);
    const title = slack >= 10
      ? `Campus jump: catch the ${formatClock(departureMin)} Kennesaw–Marietta Express from ${originStop.name}`
      : slack >= 0
        ? 'Tight campus jump'
        : 'Not reachable by bus in time — take Uber or leave class early';
    alerts.push({
      id: `campus-jump-${from.id}-${to.id}`,
      severity: slack < 0 ? 'critical' : 'warn',
      title,
      body: `${from.course} → ${to.course}: ${firstWalk} min to ${originStop.name}, ${Math.round(rideMin)} min ride, ${finalWalk} min final walk, ${Math.round(slack)} min slack (SIM).`,
      actions: [
        { id: `bus-map-${from.id}-${to.id}`, label: 'Go to Bus Map', kind: 'openMap', mode: 'bus' },
      ],
    });
  }
  return alerts;
}

function peakAlerts(input: CampusIntelInput): CampusAlert[] {
  const intervalStart = input.arrivalMin - 30;
  return PEAK_WINDOWS
    .filter((window) =>
      window.days.includes(input.day) &&
      (window.campus === 'both' || window.campus === input.campus.id) &&
      window.startMin <= input.classStartMin &&
      window.endMin >= intervalStart,
    )
    .map((window) => ({
      id: `peak-${window.id}-${input.day}`,
      severity: 'info' as const,
      title: window.label,
      body: `${window.body} Arrive 10 min early and head to upper deck levels (SIM).`,
      actions: [
        { id: `peak-early-${window.id}`, label: 'Arrive 10 min early', kind: 'setArrival' as const, arrivalMin: Math.max(0, input.arrivalMin - 10) },
      ],
    }));
}

export function buildCampusAlerts(input: CampusIntelInput): CampusAlert[] {
  const alert = passUpAlert(input);
  const severityRank = { critical: 0, warn: 1, info: 2 } as const;
  return [
    ...(alert ? [alert] : []),
    ...crossCampusAlerts(input),
    ...peakAlerts(input),
  ].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
