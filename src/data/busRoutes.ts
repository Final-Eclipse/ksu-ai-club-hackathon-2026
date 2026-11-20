import type { BusTrackerRoute } from '../types';

export const BUS_ROUTES: readonly BusTrackerRoute[] = [
  {
    id: 'ksu-express',
    name: 'Kennesaw–Marietta Express',
    color: '#FDBB30',
    headwayMin: 18,
    paths: [
      {
        campusId: 'kennesaw',
        points: [
          { lat: 34.03967, lng: -84.58246 },
          { lat: 34.03849, lng: -84.58301 },
          { lat: 34.03771, lng: -84.58597 },
          { lat: 34.03472, lng: -84.5892 },
          { lat: 34.03771, lng: -84.58597 },
          { lat: 34.03849, lng: -84.58301 },
          { lat: 34.03967, lng: -84.58246 },
        ],
      },
      {
        campusId: 'marietta',
        points: [
          { lat: 33.9422, lng: -84.51862 },
          { lat: 33.94054, lng: -84.52041 },
          { lat: 33.9398, lng: -84.5212 },
          { lat: 33.93785, lng: -84.52278 },
          { lat: 33.9398, lng: -84.5212 },
          { lat: 33.94054, lng: -84.52041 },
          { lat: 33.9422, lng: -84.51862 },
        ],
      },
    ],
    stops: [
      { id: 'express-commons', name: 'The Commons', campusId: 'kennesaw', geo: { lat: 34.0399, lng: -84.58182 } },
      { id: 'express-center', name: 'Carmichael Student Center', campusId: 'kennesaw', geo: { lat: 34.03849, lng: -84.58301 } },
      { id: 'express-west', name: 'West Deck', campusId: 'kennesaw', geo: { lat: 34.03771, lng: -84.58597 } },
      { id: 'express-wilson', name: 'Joe Mack Wilson Student Center', campusId: 'marietta', geo: { lat: 33.94054, lng: -84.52041 } },
      { id: 'express-mwest', name: 'Marietta West Deck', campusId: 'marietta', geo: { lat: 33.93785, lng: -84.52278 } },
    ],
    buses: [
      { id: 'express-1', label: 'Express 01', speed: 0.000014 },
      { id: 'express-2', label: 'Express 02', speed: 0.000012 },
    ],
  },
  {
    id: 'marietta-loop',
    name: 'Marietta Campus Loop',
    color: '#10B981',
    headwayMin: 8,
    paths: [
      {
        campusId: 'marietta',
        points: [
          { lat: 33.94054, lng: -84.52041 },
          { lat: 33.94111, lng: -84.52006 },
          { lat: 33.93912, lng: -84.52017 },
          { lat: 33.93764, lng: -84.5202 },
          { lat: 33.93738, lng: -84.5223 },
          { lat: 33.93785, lng: -84.52278 },
          { lat: 33.9398, lng: -84.5212 },
          { lat: 33.94054, lng: -84.52041 },
        ],
      },
    ],
    stops: [
      { id: 'mloop-wilson', name: 'Joe Mack Wilson Student Center', campusId: 'marietta', geo: { lat: 33.94054, lng: -84.52041 } },
      { id: 'mloop-johnson', name: 'Johnson Library', campusId: 'marietta', geo: { lat: 33.93912, lng: -84.52017 } },
      { id: 'mloop-stingers', name: 'Stingers', campusId: 'marietta', geo: { lat: 33.93738, lng: -84.5223 } },
      { id: 'mloop-hornet', name: 'Hornet Village', campusId: 'marietta', geo: { lat: 33.9361, lng: -84.5213 } },
      { id: 'mloop-west', name: 'West Deck', campusId: 'marietta', geo: { lat: 33.93785, lng: -84.52278 } },
    ],
    buses: [
      { id: 'mloop-1', label: 'Marietta 11', speed: 0.000019 },
      { id: 'mloop-2', label: 'Marietta 12', speed: 0.000017 },
    ],
  },
  {
    id: 'chastain-loop',
    name: 'Chastain Pointe / Rec Center',
    color: '#22D3EE',
    headwayMin: 12,
    paths: [
      {
        campusId: 'kennesaw',
        points: [
          { lat: 34.04372, lng: -84.58476 },
          { lat: 34.04201, lng: -84.58363 },
          { lat: 34.0399, lng: -84.58182 },
          { lat: 34.03849, lng: -84.58301 },
          { lat: 34.04166, lng: -84.58154 },
          { lat: 34.04372, lng: -84.58476 },
        ],
      },
    ],
    stops: [
      { id: 'chastain-point', name: 'Chastain Pointe', campusId: 'kennesaw', geo: { lat: 34.04372, lng: -84.58476 } },
      { id: 'chastain-rec', name: 'Rec Center', campusId: 'kennesaw', geo: { lat: 34.04201, lng: -84.58363 } },
      { id: 'chastain-commons', name: 'The Commons', campusId: 'kennesaw', geo: { lat: 34.0399, lng: -84.58182 } },
      { id: 'chastain-center', name: 'Carmichael Student Center', campusId: 'kennesaw', geo: { lat: 34.03849, lng: -84.58301 } },
    ],
    buses: [
      { id: 'chastain-1', label: 'Chastain 21', speed: 0.000018 },
      { id: 'chastain-2', label: 'Chastain 22', speed: 0.000016 },
    ],
  },
  {
    id: 'west-shuttle',
    name: 'West Campus / Economy Shuttle Lot',
    color: '#F59E0B',
    headwayMin: 10,
    paths: [
      {
        campusId: 'kennesaw',
        points: [
          { lat: 34.03771, lng: -84.58597 },
          { lat: 34.0388, lng: -84.58556 },
          { lat: 34.04126, lng: -84.58662 },
          { lat: 34.04372, lng: -84.58476 },
          { lat: 34.04201, lng: -84.58363 },
          { lat: 34.03967, lng: -84.58246 },
          { lat: 34.03831, lng: -84.58396 },
          { lat: 34.03771, lng: -84.58597 },
        ],
      },
    ],
    stops: [
      { id: 'west-deck', name: 'West Deck', campusId: 'kennesaw', geo: { lat: 34.03771, lng: -84.58597 } },
      { id: 'west-shuttle-lot', name: 'Shuttle Lot', campusId: 'kennesaw', geo: { lat: 34.04126, lng: -84.58662 } },
      { id: 'west-north', name: 'North Deck', campusId: 'kennesaw', geo: { lat: 34.04372, lng: -84.58476 } },
      { id: 'west-owl', name: 'Owl Dr / The Commons', campusId: 'kennesaw', geo: { lat: 34.03967, lng: -84.58246 } },
    ],
    buses: [
      { id: 'west-1', label: 'West 31', speed: 0.00002 },
      { id: 'west-2', label: 'West 32', speed: 0.000017 },
    ],
  },
];

export function getBusRoute(routeId?: string): BusTrackerRoute {
  const route = routeId ? BUS_ROUTES.find((candidate) => candidate.id === routeId) : undefined;
  const fallback = BUS_ROUTES[0];
  if (!fallback) throw new Error('OwlFlow requires at least one bus route.');
  return route ?? fallback;
}
