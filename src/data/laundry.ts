import type { CampusId, LaundryRoom, LostFoundItem } from '../types';

export const LAUNDRY_ROOMS: readonly LaundryRoom[] = [
  {
    id: 'k-uv-laundry',
    campusId: 'kennesaw',
    dormId: 'k-uv',
    name: 'University Village Laundry',
    geo: { lat: 34.045, lng: -84.583 },
    washerCount: 8,
    dryerCount: 8,
    washerCycleMin: 34,
    dryerCycleMin: 48,
  },
  {
    id: 'k-austin-laundry',
    campusId: 'kennesaw',
    dormId: 'k-austin',
    name: 'Austin Residence Laundry',
    geo: { lat: 34.035, lng: -84.5848 },
    washerCount: 6,
    dryerCount: 6,
    washerCycleMin: 34,
    dryerCycleMin: 48,
  },
  {
    id: 'm-hornet-laundry',
    campusId: 'marietta',
    dormId: 'm-hornet',
    name: 'Hornet Village Laundry',
    geo: { lat: 33.9361, lng: -84.5213 },
    washerCount: 8,
    dryerCount: 8,
    washerCycleMin: 36,
    dryerCycleMin: 50,
  },
  {
    id: 'm-howell-laundry',
    campusId: 'marietta',
    dormId: 'm-howell',
    name: 'Howell Hall Laundry',
    geo: { lat: 33.938, lng: -84.5172 },
    washerCount: 6,
    dryerCount: 6,
    washerCycleMin: 36,
    dryerCycleMin: 50,
  },
];

export function getLaundryRoom(dormId: string | null, campusId: CampusId): LaundryRoom {
  const room =
    LAUNDRY_ROOMS.find((candidate) => candidate.dormId === dormId && candidate.campusId === campusId) ??
    LAUNDRY_ROOMS.find((candidate) => candidate.campusId === campusId);
  if (!room) throw new Error(`No laundry room configured for ${campusId}.`);
  return room;
}

export function findLaundryRoomByDorm(dormId: string | null): LaundryRoom | null {
  if (!dormId) return null;
  return LAUNDRY_ROOMS.find((room) => room.dormId === dormId) ?? null;
}

export const LOST_AND_FOUND: readonly LostFoundItem[] = [
  { id: 'uv-gray-hoodie', roomId: 'k-uv-laundry', text: 'Unclaimed gray KSU hoodie detected on Folding Table 2', sinceDay: 'Nov 17', sinceMin: 855, confidence: 0.96 },
  { id: 'uv-blue-basket', roomId: 'k-uv-laundry', text: 'Blue laundry basket left near Dryer 4', sinceDay: 'Nov 17', sinceMin: 1000, confidence: 0.94 },
  { id: 'austin-water-bottle', roomId: 'k-austin-laundry', text: 'Black insulated bottle detected beside Washer 2', sinceDay: 'Nov 18', sinceMin: 610, confidence: 0.91 },
  { id: 'hornet-towel', roomId: 'm-hornet-laundry', text: 'Gold bath towel left on the folding counter', sinceDay: 'Nov 18', sinceMin: 730, confidence: 0.93 },
  { id: 'howell-bag', roomId: 'm-howell-laundry', text: 'Canvas laundry bag detected near Dryer 1', sinceDay: 'Nov 18', sinceMin: 815, confidence: 0.9 },
];
