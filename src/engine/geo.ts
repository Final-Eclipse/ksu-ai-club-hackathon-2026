import type { GeoPoint } from '../types';

const EARTH_RADIUS_METERS = 6_371_000;

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lng - a.lng);
  const startLatitude = radians(a.lat);
  const endLatitude = radians(b.lat);
  const halfLatitude = Math.sin(latitudeDelta / 2);
  const halfLongitude = Math.sin(longitudeDelta / 2);
  const chord =
    halfLatitude * halfLatitude +
    Math.cos(startLatitude) * Math.cos(endLatitude) * halfLongitude * halfLongitude;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(chord));
}

export function walkMinutes(a: GeoPoint, b: GeoPoint, walkMult = 1): number {
  return Math.max(1, Math.round((haversineMeters(a, b) * 1.3 * walkMult) / 80));
}
