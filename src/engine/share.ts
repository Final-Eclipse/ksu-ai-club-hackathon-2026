import { CAMPUSES, findBuilding, getPrimaryPlace, OFFICIAL_MAP_URLS } from '../data/campuses';
import { calculateLeaveTime } from './forecast';
import type {
  CampusId,
  MobilityMode,
  ParkingRecommendation,
  PermitId,
  PlannerState,
  Priority,
  SemesterPhase,
} from '../types';

const campusIds: CampusId[] = ['marietta', 'kennesaw'];
const permitIds: PermitId[] = [
  'central',
  'east',
  'west',
  'north',
  'south',
  'east-economy',
  'town-point-economy',
  'gutenberg-economy',
  'shuttle',
  'hourly',
];
const priorities: Priority[] = ['balanced', 'fastest', 'closest', 'availability'];
const phases: SemesterPhase[] = ['normal', 'opening-weeks', 'event'];
const mobilityModes: MobilityMode[] = ['standard', 'step-free'];

export function stateFromUrl(fallback: PlannerState): PlannerState {
  const params = new URLSearchParams(window.location.search);
  const campusParam = params.get('campus') as CampusId | null;
  const campusId = campusParam && campusIds.includes(campusParam) ? campusParam : fallback.campusId;
  const campus = CAMPUSES[campusId];
  const destinationParam = params.get('destination');
  const destinationId = campus.places.some((place) => place.id === destinationParam)
    ? (destinationParam as string)
    : getPrimaryPlace(campus).id;
  const permitParam = params.get('permit') as PermitId | null;
  const priorityParam = params.get('priority') as Priority | null;
  const phaseParam = params.get('phase') as SemesterPhase | null;
  const mobilityParam = params.get('mobility') as MobilityMode | null;
  const arrivalParam = params.get('arrival');
  const commuteValue = params.get('commute');
  const commuteParam = commuteValue === null ? Number.NaN : Number(commuteValue);

  return {
    ...fallback,
    campusId,
    destinationId,
    permitId: permitParam && permitIds.includes(permitParam) ? permitParam : fallback.permitId,
    priority: priorityParam && priorities.includes(priorityParam) ? priorityParam : fallback.priority,
    semesterPhase: phaseParam && phases.includes(phaseParam) ? phaseParam : fallback.semesterPhase,
    mobilityMode: mobilityParam && mobilityModes.includes(mobilityParam) ? mobilityParam : fallback.mobilityMode,
    arrival: arrivalParam && !Number.isNaN(new Date(arrivalParam).getTime()) ? arrivalParam : fallback.arrival,
    commuteMinutes: Number.isFinite(commuteParam) && commuteParam >= 0 ? commuteParam : fallback.commuteMinutes,
    preferCovered: params.get('covered') === '1',
    needsEv: params.get('ev') === '1',
  };
}

export function buildShareUrl(state: PlannerState): string {
  const params = new URLSearchParams({
    campus: state.campusId,
    destination: state.destinationId,
    permit: state.permitId,
    arrival: state.arrival,
    priority: state.priority,
    commute: String(state.commuteMinutes),
    mobility: state.mobilityMode,
    phase: state.semesterPhase,
  });
  if (state.preferCovered) params.set('covered', '1');
  if (state.needsEv) params.set('ev', '1');
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export async function shareTrip(state: PlannerState, recommendation?: ParkingRecommendation): Promise<'shared' | 'copied'> {
  const url = buildShareUrl(state);
  const destination = findBuilding(state.destinationId);
  const text = recommendation
    ? `OwlPark suggests ${recommendation.lot.name} for ${destination?.shortName ?? 'my destination'} with about ${recommendation.parkingToDoorMinutes} minutes from arrival to the door.`
    : `Here is my OwlPark plan for ${destination?.shortName ?? 'campus'}.`;

  if (navigator.share) {
    await navigator.share({ title: 'My OwlPark plan', text, url });
    return 'shared';
  }

  await navigator.clipboard.writeText(`${text} ${url}`);
  return 'copied';
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcs(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');
}

export function downloadCalendarPlan(state: PlannerState, recommendation: ParkingRecommendation): void {
  const destination = findBuilding(state.destinationId);
  const arrival = new Date(state.arrival);
  const leave = calculateLeaveTime(state.arrival, recommendation.totalTripMinutes);
  const end = new Date(arrival.getTime() + 15 * 60_000);
  const campus = CAMPUSES[state.campusId];
  const description = [
    `Leave by ${leave.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
    `Park at ${recommendation.lot.name}`,
    `Modeled search: ${recommendation.forecast.searchMinutes} min`,
    `Route to destination: ${recommendation.walkMinutes} min`,
    `Forecast: ${Math.round(recommendation.forecast.occupancy * 100)}% occupied (${Math.round(recommendation.forecast.confidence * 100)}% confidence)`,
    'Prototype estimate. Verify posted signs and official KSU information.',
    OFFICIAL_MAP_URLS[state.campusId],
  ].join('\n');
  const uid = `owlpark-${Date.now()}@local`;
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OwlPark//Parking Plan//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(leave)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(`Leave for ${destination?.shortName ?? campus.name}`)}`,
    `LOCATION:${escapeIcs(`${recommendation.lot.name}, ${campus.name}`)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'owlpark-plan.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
