import type { CampusId, DayCode } from '../types';

export interface PeakWindow {
  id: string;
  label: string;
  days: DayCode[];
  campus: CampusId | 'both';
  startMin: number;
  endMin: number;
  body: string;
}

export const PEAK_WINDOWS: readonly PeakWindow[] = [
  {
    id: 'tu-th-class-change',
    label: 'Tue/Thu class-change peak',
    days: ['T', 'R'],
    campus: 'both',
    startMin: 540,
    endMin: 660,
    body: 'KSU advises extra travel time on Tuesdays and Thursdays.',
  },
  {
    id: 'midterm-review',
    label: 'Midterm review surge · Sturgis & The Commons',
    days: ['M', 'W'],
    campus: 'kennesaw',
    startMin: 660,
    endMin: 780,
    body: 'Simulated review traffic is elevated near Sturgis Library and The Commons.',
  },
  {
    id: 'convocation-event',
    label: 'Convocation Center event peak',
    days: ['T', 'R'],
    campus: 'kennesaw',
    startMin: 1080,
    endMin: 1260,
    body: 'Simulated evening event traffic is elevated near the Convocation Center.',
  },
];
