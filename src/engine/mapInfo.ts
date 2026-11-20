import { EV_CHARGERS } from '../data/evChargers';
import { walkMinutes } from './geo';
import { facilitySpotDots } from './mapLayout';
import type {
  Campus,
  DeckReading,
  EvChargerReading,
  GeoPoint,
  MapFocus,
  Place,
} from '../types';

export interface MapInfo {
  kind: MapFocus['kind'];
  title: string;
  detail: string;
  geo: GeoPoint;
  walkMin: number;
  approx: boolean;
  lines: string[];
}

export function resolveMapInfo(
  focus: MapFocus | null,
  campus: Campus,
  target: Place,
  readings: readonly DeckReading[],
  evReadings: readonly EvChargerReading[],
): MapInfo | null {
  if (!focus) return null;

  if (focus.kind === 'ev') {
    const charger = EV_CHARGERS.find((candidate) => candidate.id === focus.id && candidate.campusId === campus.id);
    const reading = evReadings.find((candidate) => candidate.chargerId === focus.id);
    if (!charger || !reading) return null;
    return {
      kind: 'ev',
      title: charger.name,
      detail: `${reading.free} of ${reading.ports} ports free (SIM)`,
      geo: charger.geo,
      walkMin: walkMinutes(charger.geo, target.geo),
      approx: charger.approx,
      lines: [`Level ${charger.level}`, `${reading.status === 'available' ? 'Charging available' : 'All ports busy'} (SIM)`],
    };
  }

  const deck = campus.decks.find((candidate) => candidate.id === focus.id || focus.id.startsWith(`${candidate.id}-spot-`));
  if (!deck) return null;
  const reading = readings.find((candidate) => candidate.deckId === deck.id);
  if (!reading) return null;

  if (focus.kind === 'spot') {
    const spot = facilitySpotDots(deck, reading).find((candidate) => candidate.id === focus.id);
    if (!spot) return null;
    return {
      kind: 'spot',
      title: `${deck.name} · representative spot`,
      detail: `${spot.open ? 'Open' : 'Occupied'} stall sample (SIM)`,
      geo: spot.geo,
      walkMin: walkMinutes(spot.geo, target.geo),
      approx: true,
      lines: [`${reading.open} facility spaces open`, `Best available level L${reading.bestLevel}`],
    };
  }

  return {
    kind: 'deck',
    title: deck.name,
    detail: `${reading.open} of ${deck.capacity} spaces open (SIM)`,
    geo: deck.geo,
    walkMin: walkMinutes(deck.geo, target.geo),
    approx: Boolean(deck.geoApprox),
    lines: reading.levels.map((level) => `Level ${level.level}: ${level.open} open of ${level.capacity}`),
  };
}
