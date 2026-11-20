import type { WorkspaceTabId } from '../types';

export const WORKSPACE_TABS: readonly {
  id: WorkspaceTabId;
  number: string;
  label: string;
  shortLabel: string;
}[] = [
  { id: 'commute', number: '01', label: 'Commute & Schedule', shortLabel: 'Commute' },
  { id: 'dining', number: '02', label: 'Dining & Menu', shortLabel: 'Dining' },
  { id: 'laundry', number: '03', label: 'Dorm Laundry', shortLabel: 'Laundry' },
  { id: 'campus', number: '04', label: 'Campus Map & Live CV', shortLabel: 'Campus' },
];
