import type { OccupancyStatus } from '../types';

interface StatusBadgeProps {
  status: OccupancyStatus;
  occupancy: number;
}

export function StatusBadge({ status, occupancy }: StatusBadgeProps) {
  const label = status === 'open' ? 'Open' : status === 'filling' ? 'Filling' : 'Full';
  return (
    <span className={`ps-status ps-status--${status}`}>
      <span aria-hidden="true" />
      {label} {Math.round(occupancy * 100)}%
    </span>
  );
}
