import { planDining } from './dining';
import { walkMinutes } from './geo';
import { buildCampusAlerts } from './intel';
import { planLaundry } from './laundry';
import { classesForDay, pickNextClass } from './schedule';
import type {
  Campus,
  ClassSession,
  DayCode,
  DietaryTag,
  DiningHall,
  GeoPoint,
  JourneyPlan,
  JourneyStop,
  LaundryPlan,
  LaundryRoom,
  MachineReading,
  PitStopPlan,
  Scenario,
} from '../types';

export interface JourneyInput {
  campus: Campus;
  classes: readonly ClassSession[];
  selectedClassId: string | null;
  day: DayCode;
  arrivalMin: number;
  arrivalGeo: GeoPoint;
  scenario: Scenario;
  diningHall: DiningHall;
  laundryRoom: LaundryRoom;
  laundryReadings: readonly MachineReading[];
  diningEnabled: boolean;
  laundryEnabled: boolean;
  dietaryTags: readonly DietaryTag[];
  uberUrl: string;
}

export function planJourney(input: JourneyInput): JourneyPlan {
  const dayClasses = classesForDay(input.classes, input.day);
  const targetClass =
    dayClasses.find((session) => session.id === input.selectedClassId) ??
    pickNextClass(dayClasses, input.arrivalMin, input.day);
  const fallbackPlace = input.campus.places[0];
  if (!fallbackPlace) throw new Error(`${input.campus.name} requires at least one journey place.`);
  const targetPlace =
    input.campus.places.find((place) => place.id === targetClass?.buildingId) ??
    fallbackPlace;
  const classStartMin = targetClass?.startMin ?? input.arrivalMin + 60;
  const stops: JourneyStop[] = [
    {
      id: `arrival-${input.day}-${input.arrivalMin}`,
      kind: 'arrival',
      label: 'Campus arrival',
      detail: 'Mobility handoff point',
      startMin: input.arrivalMin,
      endMin: input.arrivalMin + 2,
      geo: input.arrivalGeo,
    },
  ];
  let cursorMin = input.arrivalMin + 2;
  let cursorGeo = input.arrivalGeo;
  let laundry: LaundryPlan | undefined;
  let dining: PitStopPlan | undefined;
  const laundryAvailable = input.laundryEnabled && input.laundryRoom.campusId === input.campus.id;

  if (laundryAvailable) {
    const walkToLaundry = walkMinutes(cursorGeo, input.laundryRoom.geo, input.scenario.walkMult);
    cursorMin += walkToLaundry;
    laundry = planLaundry(input.laundryRoom, input.laundryReadings, cursorMin, classStartMin);
    stops.push({
      id: `laundry-${input.laundryRoom.id}-${input.day}`,
      kind: 'laundry',
      label: `Start ${laundry.machineLabel}`,
      detail: `${walkToLaundry} min walk · ${laundry.cycleMin} min cycle runs in background`,
      startMin: laundry.startMin,
      endMin: laundry.startMin + 4,
      geo: input.laundryRoom.geo,
    });
    cursorMin = laundry.startMin + 4;
    cursorGeo = input.laundryRoom.geo;
  }

  if (input.diningEnabled) {
    dining = planDining(
      input.diningHall,
      cursorMin,
      input.scenario,
      input.dietaryTags,
      cursorGeo,
      targetPlace.geo,
      classStartMin,
    );
    stops.push({
      id: `dining-${input.diningHall.id}-${input.day}`,
      kind: 'dining',
      label: `${dining.stationName} · ${dining.menuItem.name}`,
      detail: `${dining.walkMin} min walk · ${dining.queueMin} min queue · ${dining.menuItem.calories} cal`,
      startMin: dining.startMin,
      endMin: dining.endMin,
      geo: input.diningHall.geo,
    });
    cursorMin = dining.endMin;
    cursorGeo = input.diningHall.geo;
  }

  const finalWalk = walkMinutes(cursorGeo, targetPlace.geo, input.scenario.walkMult);
  stops.push({
    id: `class-${targetClass?.id ?? targetPlace.id}-${input.day}`,
    kind: 'class',
    label: targetClass?.course ?? 'Next class',
    detail: `${targetPlace.short}${targetClass?.room ? ` · ${targetClass.room}` : ''} · ${finalWalk} min final walk`,
    startMin: classStartMin,
    endMin: targetClass?.endMin ?? classStartMin + 75,
    geo: targetPlace.geo,
  });

  const explanation = input.laundryEnabled && !laundryAvailable
    ? 'Laundry skipped — dorm is on the other campus.'
    : laundryAvailable && input.diningEnabled
    ? `Laundry starts before dining so the washer runs while you eat, then OwlFlow routes you to ${targetPlace.short}.`
    : input.diningEnabled
      ? `OwlFlow inserts the shortest matching dining queue before ${targetPlace.short}.`
      : input.laundryEnabled
        ? `OwlFlow selects the soonest washer and checks its cycle against class time.`
        : `OwlFlow routes directly from campus arrival to ${targetPlace.short}.`;

  return {
    day: input.day,
    stops,
    totalMin: Math.max(0, classStartMin - input.arrivalMin),
    hasDining: input.diningEnabled,
    hasLaundry: laundryAvailable,
    explanation,
    alerts: buildCampusAlerts({
      campus: input.campus,
      day: input.day,
      classes: input.classes,
      arrivalMin: input.arrivalMin,
      classStartMin,
      scenario: input.scenario,
      uberUrl: input.uberUrl,
    }),
    ...(dining ? { dining } : {}),
    ...(laundry ? { laundry } : {}),
  };
}
