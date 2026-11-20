import { PRESETS } from '../data/presets';
import { pickNextClass } from '../engine/schedule';
import type {
  CampusId,
  ClassSession,
  CommuteProfile,
  CopilotIntent,
  CvOverride,
  CvOverrides,
  DayCode,
  DietaryTag,
  GeoPoint,
  ScenarioId,
  SchedulePreset,
  ScheduleView,
} from '../types';

export interface PlanState {
  campusId: CampusId;
  presetId: string | null;
  classes: ClassSession[];
  selectedClassId: string | null;
  selectedDay: DayCode;
  scheduleView: ScheduleView;
  arrivalMin: number;
  profile: CommuteProfile;
  dormId: string | null;
  diningEnabled: boolean;
  laundryEnabled: boolean;
  dietaryTags: DietaryTag[];
  scenarioId: ScenarioId;
  importNotes: string[];
  cvOverrides: CvOverrides;
}

export type PlanAction =
  | { type: 'setCampus'; campusId: CampusId }
  | { type: 'applyPreset'; presetId: string }
  | { type: 'importClasses'; classes: ClassSession[]; notes: string[] }
  | { type: 'selectClass'; classId: string }
  | { type: 'setDay'; day: DayCode }
  | { type: 'setScheduleView'; view: ScheduleView }
  | { type: 'setArrival'; arrivalMin: number }
  | { type: 'setScenario'; scenarioId: ScenarioId }
  | { type: 'setOrigin'; label: string; geo: GeoPoint | null }
  | { type: 'setDorm'; dormId: string }
  | { type: 'applyCvOverride'; deckId: string; level: number; override: CvOverride }
  | { type: 'clearCvOverride'; deckId: string; level?: number }
  | { type: 'setDiningEnabled'; enabled: boolean }
  | { type: 'setLaundryEnabled'; enabled: boolean }
  | { type: 'setDietaryTags'; tags: DietaryTag[] }
  | { type: 'applyCopilot'; intent: CopilotIntent };

function findPreset(presetId: string): SchedulePreset | undefined {
  return PRESETS.find((preset) => preset.id === presetId);
}

function stateFromPreset(preset: SchedulePreset, scenarioId: ScenarioId): PlanState {
  const classes = preset.classes.map((session) => ({ ...session }));
  const nextClass = pickNextClass(classes, preset.arrivalMin, preset.defaultDay);
  return {
    campusId: preset.campusId,
    presetId: preset.id,
    classes,
    selectedClassId: nextClass?.id ?? null,
    selectedDay: preset.defaultDay,
    scheduleView: 'day',
    arrivalMin: preset.arrivalMin,
    profile: { ...preset.profile },
    dormId: preset.dormId ?? null,
    diningEnabled: false,
    laundryEnabled: false,
    dietaryTags: [],
    scenarioId,
    importNotes: [],
    cvOverrides: {},
  };
}

function presetForIntent(intent: CopilotIntent): SchedulePreset | undefined {
  if (intent.campusId === 'marietta') return findPreset('m-eng');
  if (intent.buildingId === 'k-socsci') return findPreset('k-psy');
  return findPreset('k-bio');
}

function stateFromIntent(state: PlanState, intent: CopilotIntent): PlanState {
  const preset = presetForIntent(intent);
  if (!preset) return state;
  const base = stateFromPreset(preset, intent.scenarioId);
  const arrivalMin = intent.arrivalMin ?? base.arrivalMin;
  const matchingClasses = base.classes.filter((session) =>
    !intent.buildingId || session.buildingId === intent.buildingId,
  );
  const requestedClassStart = intent.classStartMin;
  const closestClass = requestedClassStart === null
    ? pickNextClass(matchingClasses, arrivalMin, intent.day)
    : matchingClasses
        .filter((session) => session.days.includes(intent.day))
        .slice()
        .sort((a, b) => Math.abs(a.startMin - requestedClassStart) - Math.abs(b.startMin - requestedClassStart))[0];

  let classes = base.classes;
  let selectedClassId = closestClass?.id ?? null;
  const needsSyntheticClass = Boolean(
    intent.buildingId &&
    requestedClassStart !== null &&
    (!closestClass || Math.abs(closestClass.startMin - requestedClassStart) > 30),
  );
  if (needsSyntheticClass && intent.buildingId && requestedClassStart !== null) {
    const synthetic: ClassSession = {
      id: `copilot-${intent.campusId}-${intent.buildingId}-${requestedClassStart}`,
      campusId: intent.campusId,
      course: 'Next class',
      buildingId: intent.buildingId,
      room: 'TBD',
      days: intent.day,
      startMin: requestedClassStart,
      endMin: Math.min(1439, requestedClassStart + 75),
    };
    classes = [...base.classes, synthetic];
    selectedClassId = synthetic.id;
  }

  return {
    ...base,
    classes,
    selectedClassId,
    selectedDay: intent.day,
    arrivalMin,
    dormId: intent.dormId ?? base.dormId,
    diningEnabled: intent.needsDining,
    laundryEnabled: intent.needsLaundry,
    dietaryTags: intent.dietaryTags,
    scenarioId: intent.scenarioId,
    cvOverrides: state.cvOverrides,
  };
}

const initialPreset = findPreset('k-bio');
if (!initialPreset) throw new Error('OwlFlow requires the k-bio preset.');

export const INITIAL_PLAN_STATE: PlanState = stateFromPreset(initialPreset, 'normal');

export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case 'setCampus': {
      const campusClasses = state.classes.filter((session) => session.campusId === action.campusId);
      const nextClass = pickNextClass(campusClasses, state.arrivalMin, state.selectedDay);
      return {
        ...state,
        campusId: action.campusId,
        selectedClassId: nextClass?.id ?? state.selectedClassId,
      };
    }
    case 'applyPreset': {
      const preset = findPreset(action.presetId);
      return preset ? { ...stateFromPreset(preset, state.scenarioId), cvOverrides: state.cvOverrides } : state;
    }
    case 'importClasses': {
      const nextClass = pickNextClass(action.classes, state.arrivalMin, state.selectedDay);
      return {
        ...state,
        presetId: null,
        classes: action.classes,
        selectedClassId: nextClass?.id ?? null,
        campusId: nextClass?.campusId ?? state.campusId,
        importNotes: action.notes,
      };
    }
    case 'selectClass': {
      const selectedClass = state.classes.find((session) => session.id === action.classId);
      return selectedClass
        ? { ...state, selectedClassId: selectedClass.id, campusId: selectedClass.campusId }
        : state;
    }
    case 'setDay': {
      const nextClass = pickNextClass(state.classes, state.arrivalMin, action.day);
      return {
        ...state,
        selectedDay: action.day,
        selectedClassId: nextClass?.id ?? null,
        campusId: nextClass?.campusId ?? state.campusId,
      };
    }
    case 'setScheduleView':
      return { ...state, scheduleView: action.view };
    case 'setArrival': {
      const arrivalMin = Math.max(300, Math.min(1320, action.arrivalMin));
      const nextClass = pickNextClass(state.classes, arrivalMin, state.selectedDay);
      return {
        ...state,
        arrivalMin,
        selectedClassId: nextClass?.id ?? state.selectedClassId,
        campusId: nextClass?.campusId ?? state.campusId,
      };
    }
    case 'setScenario':
      return { ...state, scenarioId: action.scenarioId };
    case 'setOrigin':
      return {
        ...state,
        profile: {
          originLabel: action.label,
          originGeo: action.geo,
          driveMin: state.profile.driveMin,
          distanceMi: state.profile.distanceMi,
        },
      };
    case 'setDorm':
      return { ...state, dormId: action.dormId };
    case 'applyCvOverride': {
      const deckOverrides = state.cvOverrides[action.deckId] ?? {};
      return {
        ...state,
        cvOverrides: {
          ...state.cvOverrides,
          [action.deckId]: { ...deckOverrides, [action.level]: action.override },
        },
      };
    }
    case 'clearCvOverride': {
      const cvOverrides = { ...state.cvOverrides };
      if (action.level === undefined) {
        delete cvOverrides[action.deckId];
      } else {
        const deckOverrides = { ...(cvOverrides[action.deckId] ?? {}) };
        delete deckOverrides[action.level];
        if (Object.keys(deckOverrides).length) cvOverrides[action.deckId] = deckOverrides;
        else delete cvOverrides[action.deckId];
      }
      return { ...state, cvOverrides };
    }
    case 'setDiningEnabled':
      return { ...state, diningEnabled: action.enabled };
    case 'setLaundryEnabled':
      return { ...state, laundryEnabled: action.enabled };
    case 'setDietaryTags':
      return { ...state, dietaryTags: action.tags };
    case 'applyCopilot':
      return stateFromIntent(state, action.intent);
    default: {
      const exhaustiveAction: never = action;
      return exhaustiveAction;
    }
  }
}
