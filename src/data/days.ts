import type { DayCode } from '../types';

export const DAY_OPTIONS: readonly { code: DayCode; short: string; label: string }[] = [
  { code: 'M', short: 'M', label: 'Monday' },
  { code: 'T', short: 'T', label: 'Tuesday' },
  { code: 'W', short: 'W', label: 'Wednesday' },
  { code: 'R', short: 'R', label: 'Thursday' },
  { code: 'F', short: 'F', label: 'Friday' },
];
