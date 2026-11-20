import type { GeoPoint } from '../types';

export function appleDirectionsUrl(point: GeoPoint): string {
  return `https://maps.apple.com/?daddr=${point.lat.toFixed(6)},${point.lng.toFixed(6)}&dirflg=d`;
}

export function googleDirectionsUrl(point: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.lat.toFixed(6)},${point.lng.toFixed(6)}&travelmode=driving`;
}
