import type { EvCharger } from '../types';

export const EV_CHARGERS: readonly EvCharger[] = [
  { id: 'ev-k-north', campusId: 'kennesaw', deckId: 'k-north', name: 'North Deck L1 EV', level: 1, ports: 4, geo: { lat: 34.043895, lng: -84.584756 }, approx: true },
  { id: 'ev-k-central', campusId: 'kennesaw', deckId: 'k-central', name: 'Central Deck L1 EV', level: 1, ports: 6, geo: { lat: 34.041662, lng: -84.58132 }, approx: true },
  { id: 'ev-k-east', campusId: 'kennesaw', deckId: 'k-east', name: 'East Deck L1 EV', level: 1, ports: 4, geo: { lat: 34.035852, lng: -84.580635 }, approx: true },
  { id: 'ev-k-west', campusId: 'kennesaw', deckId: 'k-west', name: 'West Deck L1 EV', level: 1, ports: 2, geo: { lat: 34.037712, lng: -84.586185 }, approx: true },
  { id: 'ev-m-west', campusId: 'marietta', deckId: 'm-west', name: 'West Deck (P60) L1 EV', level: 1, ports: 4, geo: { lat: 33.937848, lng: -84.522996 }, approx: true },
  { id: 'ev-m-central', campusId: 'marietta', deckId: 'm-central', name: 'Central Lot EV', level: 1, ports: 2, geo: { lat: 33.93998, lng: -84.5212 }, approx: true },
];
