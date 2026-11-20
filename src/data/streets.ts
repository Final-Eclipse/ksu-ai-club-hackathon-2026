import type { CampusId, StreetSegment } from '../types';

export const STREETS: readonly StreetSegment[] = [
  { id: 'k-campus-loop', campusId: 'kennesaw', name: 'Campus Loop Rd', approx: true, points: [{ lat: 34.03771, lng: -84.58597 }, { lat: 34.03858, lng: -84.58704 }, { lat: 34.04126, lng: -84.58662 }, { lat: 34.04201, lng: -84.58363 }] },
  { id: 'k-frey', campusId: 'kennesaw', name: 'Frey Rd', approx: true, points: [{ lat: 34.03468, lng: -84.57966 }, { lat: 34.03718, lng: -84.57991 }, { lat: 34.04046, lng: -84.58018 }, { lat: 34.04366, lng: -84.58054 }] },
  { id: 'k-big-shanty', campusId: 'kennesaw', name: 'Big Shanty Rd', approx: true, points: [{ lat: 34.03472, lng: -84.5892 }, { lat: 34.0347, lng: -84.5841 }, { lat: 34.03466, lng: -84.5778 }] },
  { id: 'k-canton', campusId: 'kennesaw', name: 'Canton Pl', approx: true, points: [{ lat: 34.04372, lng: -84.58476 }, { lat: 34.0451, lng: -84.58515 }] },
  { id: 'k-parliament', campusId: 'kennesaw', name: 'Parliament Garden Way', approx: true, points: [{ lat: 34.04166, lng: -84.58154 }, { lat: 34.0399, lng: -84.58182 }] },
  { id: 'k-owl', campusId: 'kennesaw', name: 'Owl Dr', approx: true, points: [{ lat: 34.04061, lng: -84.58253 }, { lat: 34.03967, lng: -84.58246 }] },
  { id: 'k-hopkins', campusId: 'kennesaw', name: 'Hopkins Dr', approx: true, points: [{ lat: 34.03585, lng: -84.58085 }, { lat: 34.03465, lng: -84.5802 }] },
  { id: 'k-paulding', campusId: 'kennesaw', name: 'Paulding Ave', approx: true, points: [{ lat: 34.03607, lng: -84.58432 }, { lat: 34.03475, lng: -84.5846 }] },
  { id: 'k-cobb', campusId: 'kennesaw', name: 'Cobb Ave', approx: true, points: [{ lat: 34.03831, lng: -84.58396 }, { lat: 34.03849, lng: -84.58301 }] },
  { id: 'k-bartow', campusId: 'kennesaw', name: 'Bartow Ave', approx: true, points: [{ lat: 34.0388, lng: -84.58556 }, { lat: 34.03935, lng: -84.58705 }] },
  { id: 'm-marietta-pkwy', campusId: 'marietta', name: 'S Marietta Pkwy', approx: true, points: [{ lat: 33.94166, lng: -84.52271 }, { lat: 33.94167, lng: -84.52231 }, { lat: 33.9422, lng: -84.51862 }, { lat: 33.94244, lng: -84.51592 }] },
  { id: 'm-rossbacher', campusId: 'marietta', name: 'Rossbacher Way', approx: true, points: [{ lat: 33.94167, lng: -84.52231 }, { lat: 33.94111, lng: -84.52006 }, { lat: 33.94054, lng: -84.52041 }] },
  { id: 'm-polytechnic', campusId: 'marietta', name: 'Polytechnic Ln', approx: true, points: [{ lat: 33.93837, lng: -84.52273 }, { lat: 33.93738, lng: -84.5223 }] },
  { id: 'm-arntson', campusId: 'marietta', name: 'Arntson Dr', approx: true, points: [{ lat: 33.93764, lng: -84.5202 }, { lat: 33.9369, lng: -84.51935 }] },
  { id: 'm-hornet-loop', campusId: 'marietta', name: 'Hornet Loop', approx: true, points: [{ lat: 33.93912, lng: -84.52017 }, { lat: 33.93612, lng: -84.52133 }] },
];

export function getCampusStreets(campusId: CampusId): StreetSegment[] {
  return STREETS.filter((street) => street.campusId === campusId);
}
