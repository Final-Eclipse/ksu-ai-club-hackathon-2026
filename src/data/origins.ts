import type { GeoPoint } from '../types';

export interface OriginPreset {
  label: string;
  geo: GeoPoint;
}

export const ORIGIN_PRESETS: Readonly<Record<string, OriginPreset>> = {
  acworth: { label: 'Acworth, GA', geo: { lat: 34.065933, lng: -84.67688 } },
  marietta: { label: 'Marietta, GA', geo: { lat: 33.952602, lng: -84.549933 } },
  smyrna: { label: 'Smyrna, GA', geo: { lat: 33.883991, lng: -84.514376 } },
  kennesaw: { label: 'Kennesaw, GA', geo: { lat: 34.023433, lng: -84.61549 } },
  alpharetta: { label: 'Alpharetta, GA', geo: { lat: 34.075376, lng: -84.29409 } },
  woodstock: { label: 'Woodstock, GA', geo: { lat: 34.101487, lng: -84.519376 } },
  roswell: { label: 'Roswell, GA', geo: { lat: 34.023243, lng: -84.361556 } },
  'downtown atlanta': { label: 'Downtown Atlanta, GA', geo: { lat: 33.749, lng: -84.388 } },
  atlanta: { label: 'Atlanta, GA', geo: { lat: 33.749, lng: -84.388 } },
};

function normalizedOrigin(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/,?\s+ga(?:\s+\d{5})?$/, '')
    .replace(/\s+/g, ' ');
}

export function resolveOrigin(value: string): OriginPreset | null {
  return ORIGIN_PRESETS[normalizedOrigin(value)] ?? null;
}
