import { CAMPUSES } from '../data/campuses';
import { parseClock } from './time';
import type {
  Campus,
  CampusId,
  ClassMeeting,
  ClassSession,
  DayCode,
  Place,
  ScheduleParseResult,
} from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LETTERS: Record<number, string> = {
  0: 'U',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'R',
  5: 'F',
  6: 'S',
};

function parseDays(line: string): number[] {
  const lower = line.toLowerCase();
  const days = new Set<number>();
  const words: Array<[RegExp, number]> = [
    [/\bsundays?\b/, 0],
    [/\bmondays?\b|\bmon\b/, 1],
    [/\btuesdays?\b|\btues?\b/, 2],
    [/\bwednesdays?\b|\bwed\b/, 3],
    [/\bthursdays?\b|\bthurs?\b|\bthu\b/, 4],
    [/\bfridays?\b|\bfri\b/, 5],
    [/\bsaturdays?\b|\bsat\b/, 6],
  ];

  for (const [pattern, day] of words) {
    if (pattern.test(lower)) days.add(day);
  }

  const upper = line.toUpperCase();
  const compact = upper.replaceAll(' ', '');
  if (/\bMWF\b/.test(upper) || compact.includes('M/W/F')) days.add(1).add(3).add(5);
  if (/\bMW\b/.test(upper) || compact.includes('M/W')) days.add(1).add(3);
  if (/\bTR\b|\bTTH\b|\bTUTH\b/.test(upper) || compact.includes('T/R') || compact.includes('TU/TH')) days.add(2).add(4);
  return [...days].sort((a, b) => a - b);
}

function to24Hour(hourText: string, minuteText: string | undefined, meridiem: string): string {
  let hour = Number(hourText);
  const minute = Number(minuteText ?? '00');
  if (meridiem.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function allPlaces(): Place[] {
  return Object.values(CAMPUSES).flatMap((campus) => campus.places);
}

function placeInLine(line: string): Place | undefined {
  const normalized = line.toLowerCase();
  return allPlaces()
    .slice()
    .sort((a, b) => Math.max(...b.aliases.map((alias) => alias.length)) - Math.max(...a.aliases.map((alias) => alias.length)))
    .find((place) =>
      [place.name, place.short, ...place.aliases].some((candidate) => normalized.includes(candidate.toLowerCase())),
    );
}

function inferCourse(line: string, timeIndex: number): string {
  const firstSegment = line.split(/[|•]/)[0]?.trim();
  const candidate = firstSegment && firstSegment.length < 55 ? firstSegment : line.slice(0, timeIndex).trim();
  return candidate.replace(/[-–—,:]+$/, '').trim() || 'Imported class';
}

export function parseSchedule(text: string): ScheduleParseResult {
  const meetings: ClassMeeting[] = [];
  const ignoredLines: string[] = [];

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const place = placeInLine(line);
      const timeMatch = line.match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
      const hourText = timeMatch?.[1];
      const minuteText = timeMatch?.[2];
      const meridiem = timeMatch?.[3];
      const days = parseDays(line);
      if (!place || !timeMatch || !hourText || !meridiem || !days.length) {
        ignoredLines.push(line);
        return;
      }

      meetings.push({
        id: `import-${index}-${place.id}`,
        name: inferCourse(line, timeMatch.index ?? line.length),
        campusId: place.campusId,
        destinationId: place.id,
        days,
        startTime: to24Hour(hourText, minuteText, meridiem),
        sourceLine: line,
      });
    });

  return { meetings, ignoredLines };
}

export function resolveBuildingId(name: string, campus: Campus): string | null {
  const normalized = name.trim().toLowerCase();
  const place = campus.places.find((candidate) =>
    candidate.id.toLowerCase() === normalized ||
    candidate.name.toLowerCase() === normalized ||
    candidate.short.toLowerCase() === normalized ||
    candidate.aliases.some((alias) => alias.toLowerCase() === normalized),
  );
  return place?.id ?? null;
}

function compactDays(days: number[]): string {
  return days.map((day) => DAY_LETTERS[day] ?? '').join('');
}

export function toClassSessions(
  imported: readonly ClassMeeting[],
): { classes: ClassSession[]; notes: string[] } {
  const classes: ClassSession[] = [];
  const notes: string[] = [];

  for (const meeting of imported) {
    const sourcePlace = allPlaces().find((place) => place.id === meeting.destinationId);
    const startMin = parseClock(meeting.startTime);
    if (!sourcePlace) {
      notes.push(`${meeting.name}: building could not be resolved on either KSU campus.`);
      continue;
    }
    if (startMin === null) {
      notes.push(`${meeting.name}: start time could not be parsed.`);
      continue;
    }

    const roomMatch = meeting.sourceLine.match(/\b(?:ROOM|RM)\s*([A-Z0-9-]+)/i);
    classes.push({
      id: meeting.id,
      campusId: sourcePlace.campusId,
      course: meeting.name,
      buildingId: sourcePlace.id,
      room: roomMatch?.[1] ?? 'TBD',
      days: compactDays(meeting.days),
      startMin,
      endMin: Math.min(1439, startMin + 75),
    });
  }

  return { classes, notes };
}

export function classesForDay(
  classes: readonly ClassSession[],
  day: DayCode,
): ClassSession[] {
  return classes
    .filter((session) => session.days.includes(day))
    .slice()
    .sort((a, b) => a.startMin - b.startMin);
}

export interface ScheduleGap {
  id: string;
  startMin: number;
  endMin: number;
  durationMin: number;
  fitLabel: string;
}

export function findScheduleGaps(
  classes: readonly ClassSession[],
  day: DayCode,
  dayStartMin = 480,
  dayEndMin = 1080,
): ScheduleGap[] {
  const sessions = classesForDay(classes, day);
  const boundaries = [dayStartMin, ...sessions.flatMap((session) => [session.startMin, session.endMin]), dayEndMin];
  const gaps: ScheduleGap[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 2) {
    const startMin = boundaries[index];
    const endMin = boundaries[index + 1];
    if (startMin === undefined || endMin === undefined) continue;
    const durationMin = endMin - startMin;
    if (durationMin < 25) continue;
    const fitLabel = durationMin >= 65
      ? 'Lunch + Laundry fit'
      : durationMin >= 40
        ? 'Lunch fits'
        : 'Quick reset';
    gaps.push({
      id: `${day}-${startMin}-${endMin}`,
      startMin,
      endMin,
      durationMin,
      fitLabel,
    });
  }
  return gaps;
}

export function pickNextClass(
  classes: readonly ClassSession[],
  arrivalMin: number,
  day?: DayCode,
): ClassSession | null {
  const eligible = day ? classesForDay(classes, day) : [...classes].sort((a, b) => a.startMin - b.startMin);
  if (!eligible.length) return null;
  return eligible.find((session) => session.startMin >= arrivalMin + 10) ?? eligible[0] ?? null;
}

export function getNextOccurrence(meeting: ClassMeeting, from = new Date()): Date {
  const start = parseClock(meeting.startTime) ?? 0;
  const hour = Math.floor(start / 60);
  const minute = start % 60;
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);
    if (meeting.days.includes(candidate.getDay()) && candidate.getTime() > from.getTime()) return candidate;
  }
  const fallback = new Date(from);
  fallback.setDate(from.getDate() + 7);
  fallback.setHours(hour, minute, 0, 0);
  return fallback;
}

export function formatMeetingDays(days: number[]): string {
  return days.map((day) => DAY_NAMES[day] ?? '').filter(Boolean).join(' · ');
}

export const SCHEDULE_EXAMPLES: Record<CampusId, string> = {
  kennesaw: `BIOL 2108 | Mon/Wed/Fri 12:30 PM - 1:20 PM | Science Building | Room SC 109\nPSYC 1101 | Mon/Wed/Fri 2:00 PM - 2:50 PM | Social Sciences\nCS 3305 | Mon/Wed/Fri 3:45 PM - 5:00 PM | Engineering Technology Center | Room Q 104`,
  marietta: `EE 2301 | Mon/Wed 10:00 AM - 11:15 AM | Atrium | Room J 202\nENGR 1000 | Mon/Wed 1:00 PM - 2:15 PM | ETC | Room Q 110`,
};

export const SCHEDULE_EXAMPLE = SCHEDULE_EXAMPLES.kennesaw;
