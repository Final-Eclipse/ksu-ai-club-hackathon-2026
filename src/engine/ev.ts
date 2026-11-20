import { EV_CHARGERS } from '../data/evChargers';
import { seeded } from './random';
import type { CampusId, EvChargerReading, Scenario } from '../types';

export function readEvChargers(
  minute: number,
  scenario: Scenario,
): EvChargerReading[] {
  const readings = EV_CHARGERS.map((charger) => {
    const random = seeded(`${charger.id}|${scenario.id}|${Math.floor(minute / 15)}`);
    const pressure = scenario.id === 'decksFull' ? 0.82 : scenario.id === 'rainSurge' ? 0.68 : 0.42;
    const busyPorts = Math.min(charger.ports, Math.floor((pressure + random() * 0.35) * charger.ports));
    const free = Math.max(0, charger.ports - busyPorts);
    return {
      chargerId: charger.id,
      free,
      ports: charger.ports,
      status: free > 0 ? 'available' as const : 'busy' as const,
    };
  });

  for (const campusId of ['kennesaw', 'marietta'] as const) {
    const campusChargers = EV_CHARGERS.filter((charger) => charger.campusId === campusId);
    if (campusChargers.some((charger) => readings.find((reading) => reading.chargerId === charger.id)?.free)) continue;
    const fallback = campusChargers[0];
    if (!fallback) continue;
    const index = readings.findIndex((reading) => reading.chargerId === fallback.id);
    const reading = readings[index];
    if (reading) readings[index] = { ...reading, free: 1, status: 'available' };
  }

  return readings;
}

export function campusEvReadings(
  readings: readonly EvChargerReading[],
  campusId: CampusId,
): EvChargerReading[] {
  const chargerIds = new Set(EV_CHARGERS.filter((charger) => charger.campusId === campusId).map((charger) => charger.id));
  return readings.filter((reading) => chargerIds.has(reading.chargerId));
}
