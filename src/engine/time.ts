function normalizedMinute(minute: number): number {
  const rounded = Math.round(minute);
  return ((rounded % 1440) + 1440) % 1440;
}

export function formatClock(minute: number): string {
  const normalized = normalizedMinute(minute);
  const hour24 = Math.floor(normalized / 60);
  const minutePart = normalized % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minutePart).padStart(2, '0')} ${suffix}`;
}

export function parseClock(text: string): number | null {
  const normalized = text.trim().toLowerCase();
  if (normalized === 'noon') return 720;

  const twelveHour = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (twelveHour) {
    const hourText = twelveHour[1];
    const minuteText = twelveHour[2] ?? '0';
    const meridiem = twelveHour[3];
    if (!hourText || !meridiem) return null;
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    return (hour % 12) * 60 + minute + (meridiem === 'pm' ? 720 : 0);
  }

  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hourText = twentyFourHour[1];
    const minuteText = twentyFourHour[2];
    if (!hourText || !minuteText) return null;
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  }

  return null;
}

export function toHHMM(minute: number): string {
  const normalized = normalizedMinute(minute);
  const hour = Math.floor(normalized / 60);
  const minutePart = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minutePart).padStart(2, '0')}`;
}

export function formatClockWithSeconds(totalSeconds: number): string {
  const normalized = ((Math.floor(totalSeconds) % 86400) + 86400) % 86400;
  const minute = Math.floor(normalized / 60);
  const seconds = normalized % 60;
  return `${formatClock(minute).replace(/ (AM|PM)$/, `:${String(seconds).padStart(2, '0')} $1`)}`;
}
