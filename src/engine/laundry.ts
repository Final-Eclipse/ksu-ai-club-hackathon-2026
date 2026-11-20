import { seeded } from './random';
import type {
  LaundryPlan,
  LaundryRoom,
  MachineReading,
  MachineState,
  MachineType,
} from '../types';

function machineReading(
  room: LaundryRoom,
  type: MachineType,
  number: number,
  nowSeconds: number,
): MachineReading {
  const id = `${room.id}-${type === 'washer' ? 'w' : 'd'}${number}`;
  const stateRandom = seeded(`${id}|state`)();
  const offsetRandom = seeded(`${id}|offset`)();
  const cycleMinutes = type === 'washer' ? room.washerCycleMin : room.dryerCycleMin;
  const cycleSeconds = cycleMinutes * 60;
  const phase = ((nowSeconds + Math.floor(offsetRandom * cycleSeconds)) % cycleSeconds + cycleSeconds) % cycleSeconds;
  let state: MachineState;
  let remainingSec = 0;

  if (stateRandom < 0.07) {
    state = 'out-of-order';
  } else if (stateRandom < 0.28) {
    state = 'free';
  } else if (stateRandom < 0.35) {
    state = 'done';
    remainingSec = 180 - (phase % 180);
  } else {
    state = 'running';
    remainingSec = cycleSeconds - phase;
  }

  return { id, roomId: room.id, type, number, state, remainingSec };
}

export function readLaundryRoom(room: LaundryRoom, nowSeconds: number): MachineReading[] {
  const readings: MachineReading[] = [];
  for (let number = 1; number <= room.washerCount; number += 1) {
    readings.push(machineReading(room, 'washer', number, nowSeconds));
  }
  for (let number = 1; number <= room.dryerCount; number += 1) {
    readings.push(machineReading(room, 'dryer', number, nowSeconds));
  }
  if (!readings.some((reading) => reading.state === 'out-of-order')) {
    const first = readings[0];
    if (first) readings[0] = { ...first, state: 'out-of-order', remainingSec: 0 };
  }
  return readings;
}

export function formatCountdown(remainingSec: number): string {
  const safe = Math.max(0, Math.round(remainingSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function planLaundry(
  room: LaundryRoom,
  readings: readonly MachineReading[],
  currentMin: number,
  classStartMin: number,
): LaundryPlan {
  const washers = readings.filter(
    (reading) => reading.type === 'washer' && reading.state !== 'out-of-order',
  );
  const freeWasher = washers.find((reading) => reading.state === 'free');
  const doneWasher = washers.find((reading) => reading.state === 'done');
  const soonest = washers
    .filter((reading) => reading.state === 'running')
    .slice()
    .sort((a, b) => a.remainingSec - b.remainingSec)[0];
  const selected = freeWasher ?? doneWasher ?? soonest ?? readings.find((reading) => reading.type === 'washer');
  if (!selected) throw new Error(`${room.name} requires at least one washer.`);

  const waitMin = selected.state === 'free'
    ? 0
    : selected.state === 'done'
      ? 1
      : selected.state === 'running'
        ? Math.ceil(selected.remainingSec / 60)
        : 10;
  const startMin = currentMin + waitMin;
  const finishMin = startMin + room.washerCycleMin;
  const finishesBeforeClass = finishMin <= classStartMin;

  return {
    roomId: room.id,
    roomName: room.name,
    machineId: selected.id,
    machineLabel: `Washer ${selected.number}`,
    waitMin,
    cycleMin: room.washerCycleMin,
    startMin,
    finishMin,
    finishesBeforeClass,
    explanation: finishesBeforeClass
      ? `${selected.state === 'free' ? 'A free' : 'The soonest'} washer finishes before class.`
      : `The earliest washer finishes after class begins.`,
  };
}
