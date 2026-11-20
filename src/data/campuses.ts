import type {
  BuildingDefinition,
  Campus,
  CampusId,
  Deck,
  ParkingLotDefinition,
  PermitDefinition,
  PermitId,
  Place,
  ReportLevel,
  SourceLink,
} from '../types';

export const DEFAULT_CAMPUS_ID: CampusId = 'kennesaw';

const kennesawPlaces: Place[] = [
  {
    id: 'k-science',
    campusId: 'kennesaw',
    kind: 'academic',
    name: 'Science Building',
    short: 'Science',
    geo: { lat: 34.0360661, lng: -84.5843153 },
    footprint: { w: 62, d: 42, h: 21 },
    aliases: ['science building', 'science'],
  },
  {
    id: 'k-socsci',
    campusId: 'kennesaw',
    kind: 'academic',
    name: 'Social Sciences Building',
    short: 'Social Sciences',
    geo: { lat: 34.0388022, lng: -84.5855612 },
    footprint: { w: 66, d: 42, h: 22 },
    aliases: ['social sciences', 'soc sci'],
  },
  {
    id: 'k-commons',
    campusId: 'kennesaw',
    kind: 'dining',
    name: 'The Commons',
    short: 'The Commons',
    geo: { lat: 34.039901, lng: -84.5818194 },
    footprint: { w: 52, d: 41, h: 12 },
    aliases: ['the commons', 'commons'],
  },
  {
    id: 'k-sturgis',
    campusId: 'kennesaw',
    kind: 'library',
    name: 'Sturgis Library',
    short: 'Sturgis Library',
    geo: { lat: 34.0383142, lng: -84.5839574 },
    footprint: { w: 52, d: 45, h: 18 },
    aliases: ['sturgis'],
  },
  {
    id: 'k-carmichael',
    campusId: 'kennesaw',
    kind: 'student-center',
    name: 'Carmichael Student Center',
    short: 'Student Center',
    geo: { lat: 34.038492, lng: -84.5830088 },
    footprint: { w: 65, d: 46, h: 15 },
    aliases: ['carmichael student center', 'student center'],
  },
  {
    id: 'k-uv',
    campusId: 'kennesaw',
    kind: 'dorm',
    name: 'University Village',
    short: 'University Village',
    geo: { lat: 34.045, lng: -84.583 },
    footprint: { w: 72, d: 36, h: 16 },
    aliases: ['university village', 'uv'],
    geoApprox: true,
  },
  {
    id: 'k-austin',
    campusId: 'kennesaw',
    kind: 'dorm',
    name: 'Austin Residence Complex',
    short: 'Austin Complex',
    geo: { lat: 34.035, lng: -84.5848 },
    footprint: { w: 70, d: 35, h: 15 },
    aliases: ['austin', 'austin complex'],
    geoApprox: true,
  },
];

const kennesawDecks: Deck[] = [
  {
    id: 'k-central',
    campusId: 'kennesaw',
    kind: 'deck',
    name: 'Central Deck',
    short: 'Central',
    geo: { lat: 34.0416623, lng: -84.5815352 },
    footprint: { w: 80, d: 49, h: 22 },
    capacity: 1500,
    levels: 6,
    baysPerLevel: 4,
    baseOccupancy: 0.45,
    peakBoost: 0.42,
  },
  {
    id: 'k-north',
    campusId: 'kennesaw',
    kind: 'deck',
    name: 'North Deck',
    short: 'North',
    geo: { lat: 34.0437155, lng: -84.5847559 },
    footprint: { w: 76, d: 47, h: 19 },
    capacity: 1200,
    levels: 5,
    baysPerLevel: 4,
    baseOccupancy: 0.35,
    peakBoost: 0.4,
  },
  {
    id: 'k-east',
    campusId: 'kennesaw',
    kind: 'deck',
    name: 'East Deck',
    short: 'East',
    geo: { lat: 34.0358523, lng: -84.5808528 },
    footprint: { w: 79, d: 48, h: 22 },
    capacity: 1400,
    levels: 6,
    baysPerLevel: 4,
    baseOccupancy: 0.5,
    peakBoost: 0.43,
  },
  {
    id: 'k-west',
    campusId: 'kennesaw',
    kind: 'deck',
    name: 'West Deck',
    short: 'West',
    geo: { lat: 34.0377117, lng: -84.5859681 },
    footprint: { w: 74, d: 46, h: 19 },
    capacity: 1100,
    levels: 5,
    baysPerLevel: 4,
    baseOccupancy: 0.52,
    peakBoost: 0.42,
  },
];

const mariettaPlaces: Place[] = [
  {
    id: 'm-atrium',
    campusId: 'marietta',
    kind: 'academic',
    name: 'Atrium Building (J)',
    short: 'Atrium',
    geo: { lat: 33.9376438, lng: -84.5201975 },
    footprint: { w: 63, d: 42, h: 20 },
    aliases: ['atrium', 'j building'],
  },
  {
    id: 'm-etc',
    campusId: 'marietta',
    kind: 'academic',
    name: 'Engineering Technology Center (Q)',
    short: 'ETC',
    geo: { lat: 33.9383727, lng: -84.5227262 },
    footprint: { w: 65, d: 40, h: 21 },
    aliases: ['etc', 'engineering technology center', 'q building'],
  },
  {
    id: 'm-stingers',
    campusId: 'marietta',
    kind: 'dining',
    name: 'Stingers',
    short: 'Stingers',
    geo: { lat: 33.9373825, lng: -84.5222994 },
    footprint: { w: 50, d: 40, h: 12 },
    aliases: ['stingers'],
  },
  {
    id: 'm-johnson',
    campusId: 'marietta',
    kind: 'library',
    name: 'Johnson Library',
    short: 'Johnson Library',
    geo: { lat: 33.9391245, lng: -84.5201702 },
    footprint: { w: 50, d: 45, h: 18 },
    aliases: ['johnson library'],
  },
  {
    id: 'm-wilson',
    campusId: 'marietta',
    kind: 'student-center',
    name: 'Joe Mack Wilson Student Center',
    short: 'Wilson Center',
    geo: { lat: 33.940537, lng: -84.5204129 },
    footprint: { w: 64, d: 45, h: 15 },
    aliases: ['joe mack wilson student center', 'wilson student center'],
  },
  {
    id: 'm-hornet',
    campusId: 'marietta',
    kind: 'dorm',
    name: 'Hornet Village',
    short: 'Hornet Village',
    geo: { lat: 33.9361, lng: -84.5213 },
    footprint: { w: 70, d: 35, h: 15 },
    aliases: ['hornet village'],
    geoApprox: true,
  },
  {
    id: 'm-howell',
    campusId: 'marietta',
    kind: 'dorm',
    name: 'Howell Hall',
    short: 'Howell Hall',
    geo: { lat: 33.938, lng: -84.5172 },
    footprint: { w: 70, d: 35, h: 15 },
    aliases: ['howell hall', 'howell'],
    geoApprox: true,
  },
];

const mariettaDecks: Deck[] = [
  {
    id: 'm-west',
    campusId: 'marietta',
    kind: 'deck',
    name: 'West Deck (P60)',
    short: 'West Deck',
    geo: { lat: 33.937848, lng: -84.52278 },
    footprint: { w: 74, d: 47, h: 16 },
    capacity: 900,
    levels: 4,
    baysPerLevel: 4,
    baseOccupancy: 0.45,
    peakBoost: 0.45,
  },
  {
    id: 'm-central',
    campusId: 'marietta',
    kind: 'lot',
    name: 'Central Lot',
    short: 'Central Lot',
    geo: { lat: 33.9398, lng: -84.5212 },
    footprint: { w: 72, d: 45, h: 0.4 },
    capacity: 350,
    levels: 1,
    baysPerLevel: 6,
    baseOccupancy: 0.5,
    peakBoost: 0.45,
    geoApprox: true,
  },
];

export const CAMPUSES: Record<CampusId, Campus> = {
  kennesaw: {
    id: 'kennesaw',
    name: 'Kennesaw Campus',
    center: { lat: 34.039, lng: -84.5835 },
    places: kennesawPlaces,
    decks: kennesawDecks,
    pins: [
      {
        id: 'k-pin-loop',
        campusId: 'kennesaw',
        name: 'Campus Loop Rd · West Deck curb',
        address: '3510 Campus Loop Rd, Kennesaw, GA 30144',
        geo: { lat: 34.0377117, lng: -84.5859681 },
        congestion: 'low',
      },
      {
        id: 'k-pin-hopkins',
        campusId: 'kennesaw',
        name: 'Hopkins Dr · East Deck curb',
        address: '305 Hopkins Dr, Kennesaw, GA 30144',
        geo: { lat: 34.0358523, lng: -84.5808528 },
        congestion: 'low',
      },
      {
        id: 'k-pin-owl',
        campusId: 'kennesaw',
        name: 'Owl Dr · The Commons loop',
        address: 'Owl Dr, Kennesaw, GA 30144',
        geo: { lat: 34.0396658, lng: -84.5824647 },
        congestion: 'medium',
      },
      {
        id: 'k-pin-canton',
        campusId: 'kennesaw',
        name: 'Canton Pl · North Deck curb',
        address: '1085 Canton Pl NW, Kennesaw, GA 30144',
        geo: { lat: 34.0437155, lng: -84.5847559 },
        congestion: 'low',
      },
    ],
    shuttle: {
      id: 'k-bob',
      campusId: 'kennesaw',
      name: 'Big Owl Bus · Shuttle Lot → The Commons',
      remoteLot: 'Shuttle Lot',
      headwayMin: 10,
      rideMin: 8,
      stopName: 'The Commons stop (Owl Dr)',
      stopGeo: { lat: 34.0396658, lng: -84.5824647 },
    },
  },
  marietta: {
    id: 'marietta',
    name: 'Marietta Campus',
    center: { lat: 33.9387, lng: -84.521 },
    places: mariettaPlaces,
    decks: mariettaDecks,
    pins: [
      {
        id: 'm-pin-poly',
        campusId: 'marietta',
        name: 'Polytechnic Ln · ETC curb',
        address: '840 Polytechnic Ln, Marietta, GA 30060',
        geo: { lat: 33.9383727, lng: -84.5227262 },
        congestion: 'low',
      },
      {
        id: 'm-pin-arntson',
        campusId: 'marietta',
        name: 'Arntson Dr · Atrium curb',
        address: '680 Arntson Dr, Marietta, GA 30060',
        geo: { lat: 33.9376438, lng: -84.5201975 },
        congestion: 'low',
      },
      {
        id: 'm-pin-rossbacher',
        campusId: 'marietta',
        name: 'Rossbacher Way · Student Center',
        address: 'Rossbacher Way SE, Marietta, GA 30060',
        geo: { lat: 33.941041, lng: -84.519901 },
        congestion: 'medium',
      },
    ],
    shuttle: {
      id: 'm-bob',
      campusId: 'marietta',
      name: 'Big Owl Bus · Marietta Loop',
      remoteLot: 'Shuttle Lot',
      headwayMin: 8,
      rideMin: 6,
      stopName: 'Joe Mack Wilson Student Center',
      stopGeo: { lat: 33.940537, lng: -84.5204129 },
    },
  },
};

export const OFFICIAL_MAP_URLS: Record<CampusId, string> = {
  kennesaw: 'https://campus.kennesaw.edu/offices-services/parking/docs/kennesaw-parking-map.pdf',
  marietta: 'https://campus.kennesaw.edu/offices-services/parking/docs/marietta-parking-map.pdf',
};

export function getCampus(id: CampusId): Campus {
  return CAMPUSES[id];
}

export function getPrimaryPlace(campus: Campus): Place {
  const place = campus.places[0];
  if (!place) throw new Error(`${campus.name} requires at least one place.`);
  return place;
}

// Compatibility exports used by the original scanner, guide, and utility modules.
export const PERMITS: PermitDefinition[] = [
  { id: 'central', label: 'Central Deck / Lots', shortLabel: 'Central', description: 'Central parking selection.', color: '#6B7280' },
  { id: 'east', label: 'East Deck / Lots', shortLabel: 'East', description: 'East parking selection.', color: '#D97706' },
  { id: 'west', label: 'West Deck / Lots', shortLabel: 'West', description: 'West parking selection.', color: '#2563EB' },
  { id: 'north', label: 'North Deck', shortLabel: 'North', description: 'North parking selection.', color: '#7C3AED' },
  { id: 'south', label: 'South Lot', shortLabel: 'South', description: 'South parking selection.', color: '#DC2626' },
  { id: 'east-economy', label: 'East Economy', shortLabel: 'East economy', description: 'East Economy selection.', color: '#059669' },
  { id: 'town-point-economy', label: 'Town Point Economy', shortLabel: 'Town Point', description: 'Town Point selection.', color: '#0F766E' },
  { id: 'gutenberg-economy', label: 'Gutenberg Economy', shortLabel: 'Gutenberg', description: 'Gutenberg selection.', color: '#4D7C0F' },
  { id: 'shuttle', label: 'Shuttle Lot', shortLabel: 'Shuttle', description: 'Shuttle Lot selection.', color: '#475569' },
  { id: 'hourly', label: 'No permit / Hourly paid', shortLabel: 'Hourly paid', description: 'Pay-by-plate hourly parking.', color: '#111827' },
];

export const DATA_SOURCES: SourceLink[] = [
  {
    label: 'KSU parking information',
    detail: 'Official parking rules, permits, and maps.',
    url: 'https://campus.kennesaw.edu/offices-services/parking/parking-information/',
  },
  {
    label: 'KSU shuttle routes',
    detail: 'Official Big Owl Bus route information.',
    url: 'https://campus.kennesaw.edu/offices-services/parking/big-owl-bus/',
  },
];

export const REPORT_LABELS: Record<ReportLevel, string> = {
  plenty: 'Plenty of room',
  filling: 'Filling up',
  'near-full': 'Almost full',
  full: 'Full / turning around',
};

export function getPermit(id: PermitId): PermitDefinition {
  const permit = PERMITS.find((candidate) => candidate.id === id);
  const fallback = PERMITS[0];
  if (!fallback) throw new Error('OwlFlow requires at least one permit definition.');
  return permit ?? fallback;
}

function legacyPoint(campus: Campus, geo: { lat: number; lng: number }): { x: number; y: number } {
  const x = 50 + (geo.lng - campus.center.lng) * 7000;
  const y = 50 - (geo.lat - campus.center.lat) * 7000;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

export function findBuilding(id: string): BuildingDefinition | undefined {
  for (const campus of Object.values(CAMPUSES)) {
    const place = campus.places.find((candidate) => candidate.id === id);
    if (place) {
      const category = place.kind === 'student-center' || place.kind === 'dorm' ? 'student-life' : place.kind;
      return {
        id: place.id,
        campusId: place.campusId,
        name: place.name,
        shortName: place.short,
        aliases: place.aliases,
        point: legacyPoint(campus, place.geo),
        category,
      };
    }
  }
  return undefined;
}

const legacyDeckIds: Record<string, string> = {
  'k-central-deck': 'k-central',
  'k-north-deck': 'k-north',
  'k-east-deck': 'k-east',
  'k-west-deck': 'k-west',
  'm-west-deck': 'm-west',
  'm-central-1': 'm-central',
  'm-central-2': 'm-central',
};

export function findLot(id: string): ParkingLotDefinition | undefined {
  const resolvedId = legacyDeckIds[id] ?? id;
  for (const campus of Object.values(CAMPUSES)) {
    const deck = campus.decks.find((candidate) => candidate.id === resolvedId);
    if (deck) {
      return {
        id: deck.id,
        campusId: deck.campusId,
        name: deck.name,
        shortName: deck.short,
        kind: deck.kind === 'deck' ? 'deck' : 'surface',
        size: deck.capacity >= 1000 ? 'large' : deck.capacity >= 500 ? 'medium' : 'small',
        point: legacyPoint(campus, deck.geo),
        acceptedPermits: ['central', 'east', 'west', 'north', 'south', 'east-economy', 'town-point-economy', 'gutenberg-economy', 'shuttle', 'hourly'],
        baseDemand: deck.baseOccupancy,
        covered: deck.kind === 'deck',
        evCharging: deck.kind === 'deck',
        accessibleSpaces: true,
        note: 'Compatibility view of the OwlFlow deck model.',
      };
    }
  }
  return undefined;
}
