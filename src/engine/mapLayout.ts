import { seeded } from './random';
import type { CameraAngle, Campus, Deck, DeckReading, Footprint, GeoPoint } from '../types';

export interface ProjectedPoint {
  x: number;
  y: number;
}

export interface ProjectedFootprint {
  width: number;
  depth: number;
}

export interface LocalPoint {
  east: number;
  north: number;
}

export function toLocal(origin: GeoPoint, point: GeoPoint): LocalPoint {
  const latitudeRadians = origin.lat * Math.PI / 180;
  return {
    east: (point.lng - origin.lng) * 111_320 * Math.cos(latitudeRadians),
    north: (point.lat - origin.lat) * 111_320,
  };
}

export function fromLocal(origin: GeoPoint, point: LocalPoint): GeoPoint {
  const latitudeRadians = origin.lat * Math.PI / 180;
  return {
    lat: origin.lat + point.north / 111_320,
    lng: origin.lng + point.east / (111_320 * Math.cos(latitudeRadians)),
  };
}

export function projectGeo2d(campus: Campus, geo: GeoPoint): ProjectedPoint {
  const local = toLocal(campus.center, geo);
  return { x: 500 + local.east * 0.42, y: 300 - local.north * 0.42 };
}

export function projectFootprint(footprint: Footprint): ProjectedFootprint {
  return {
    width: Math.max(32, footprint.w * 0.8),
    depth: Math.max(22, footprint.d * 0.62),
  };
}

export function routePath(from: ProjectedPoint, to: ProjectedPoint): string {
  const bendX = (from.x + to.x) / 2;
  const bendY = Math.min(from.y, to.y) - 42;
  return `M ${from.x} ${from.y} Q ${bendX} ${bendY} ${to.x} ${to.y}`;
}

export function sequence(count: number): number[] {
  const values: number[] = [];
  for (let index = 0; index < count; index += 1) values.push(index);
  return values;
}

export interface MapParkingBay {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  open: boolean;
}

export function cameraPinPoint(point: ProjectedPoint, angle: CameraAngle): ProjectedPoint {
  const offsets: Record<CameraAngle, ProjectedPoint> = {
    NE: { x: 34, y: -29 },
    NW: { x: -34, y: -29 },
    SE: { x: 34, y: 29 },
    SW: { x: -34, y: 29 },
  };
  const offset = offsets[angle];
  return { x: point.x + offset.x, y: point.y + offset.y };
}

export function parkingBayCells(
  deck: Deck,
  reading: DeckReading,
  point: ProjectedPoint,
): MapParkingBay[] {
  const columns = 6;
  const rows = 4;
  const count = columns * rows;
  const openRatio = reading.levels.reduce((sum, level) => sum + level.capacity, 0) > 0
    ? reading.open / reading.levels.reduce((sum, level) => sum + level.capacity, 0)
    : 0;
  const random = seeded(`${deck.id}|map-bays|${reading.open}`);
  const ranks = sequence(count).map((index) => ({ index, rank: random() }));
  const openIndexes = new Set(
    ranks
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .slice(0, Math.round(count * openRatio))
      .map((item) => item.index),
  );
  const footprint = projectFootprint(deck.footprint);
  const cellWidth = footprint.width / columns;
  const cellHeight = footprint.depth / rows;
  return ranks.map(({ index }) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      id: `${deck.id}-map-bay-${index}`,
      x: point.x - footprint.width / 2 + column * cellWidth + 1,
      y: point.y - footprint.depth / 2 + row * cellHeight + 1,
      width: Math.max(2, cellWidth - 2),
      height: Math.max(2, cellHeight - 2),
      open: openIndexes.has(index),
    };
  });
}

export interface FacilitySpotDot {
  id: string;
  deckId: string;
  geo: GeoPoint;
  open: boolean;
}

export function facilitySpotDots(
  deck: Deck,
  reading: DeckReading,
): FacilitySpotDot[] {
  const count = Math.min(40, Math.max(16, deck.baysPerLevel * 8));
  const columns = 8;
  const rows = Math.ceil(count / columns);
  const capacity = reading.levels.reduce((sum, level) => sum + level.capacity, 0);
  const openRatio = capacity > 0 ? reading.open / capacity : 0;
  const random = seeded(`${deck.id}|spot-dots|${reading.open}`);
  const ranked = sequence(count).map((index) => ({ index, rank: random() }));
  const openIndexes = new Set(
    ranked
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .slice(0, Math.round(count * openRatio))
      .map((item) => item.index),
  );
  return ranked.map(({ index }) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const east = (column - (columns - 1) / 2) * (deck.footprint.w / columns);
    const north = ((rows - 1) / 2 - row) * (deck.footprint.d / rows);
    return {
      id: `${deck.id}-spot-${index + 1}`,
      deckId: deck.id,
      geo: fromLocal(deck.geo, { east, north }),
      open: openIndexes.has(index),
    };
  });
}
