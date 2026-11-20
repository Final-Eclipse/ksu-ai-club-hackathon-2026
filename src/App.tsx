import { useMemo, useReducer, useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { AppTabs } from './components/AppTabs';
import { CampusIntelligence } from './components/CampusIntelligence';
import { CampusMap } from './components/CampusMap';
import { CommunityReports } from './components/CommunityReports';
import { DemoBar } from './components/DemoBar';
import { DiningMenu } from './components/DiningMenu';
import { JourneyTimeline } from './components/JourneyTimeline';
import { LaundryBoard } from './components/LaundryBoard';
import { OwlCopilotLauncher } from './components/OwlCopilotLauncher';
import { Planner } from './components/Planner';
import { RecommendationList } from './components/RecommendationList';
import { CAMPUSES, getCampus, getPrimaryPlace } from './data/campuses';
import { getDiningHall } from './data/dining';
import { readEvChargers } from './engine/ev';
import { findLaundryRoomByDorm, getLaundryRoom, LAUNDRY_ROOMS } from './data/laundry';
import { getScenario } from './data/scenarios';
import { decideCommute, getCommuteOption } from './engine/commute';
import { readDiningHall } from './engine/dining';
import { applyCvOverrides, readDecks } from './engine/forecast';
import { planJourney } from './engine/journey';
import { readLaundryRoom } from './engine/laundry';
import { pickNextClass } from './engine/schedule';
import { createCvOverride } from './engine/vision';
import { INITIAL_PLAN_STATE, planReducer } from './state/plan';
import type { OwlContext } from './engine/copilot';
import type {
  CameraSelection,
  CampusMapMode,
  MapFocus,
  OwlAction,
  VisionResult,
  WorkspaceTabId,
} from './types';

export default function App() {
  const [state, dispatch] = useReducer(planReducer, INITIAL_PLAN_STATE);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>('commute');
  const [mapMode, setMapMode] = useState<CampusMapMode>('parking');
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [camera, setCamera] = useState<CameraSelection | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const campus = getCampus(state.campusId);
  const scenario = getScenario(state.scenarioId);
  const nextClass =
    state.classes.find((session) => session.id === state.selectedClassId) ??
    pickNextClass(state.classes, state.arrivalMin, state.selectedDay);
  const target =
    campus.places.find((place) => place.id === nextClass?.buildingId) ??
    getPrimaryPlace(campus);
  const diningHall = getDiningHall(state.campusId);
  const diningReadings = useMemo(
    () => readDiningHall(diningHall, state.arrivalMin, scenario),
    [diningHall, scenario, state.arrivalMin],
  );
  const campusLaundryRooms = LAUNDRY_ROOMS.filter((room) => room.campusId === state.campusId);
  const laundryRoom = getLaundryRoom(state.dormId, state.campusId);
  const journeyLaundryRoom = findLaundryRoomByDorm(state.dormId) ?? laundryRoom;

  const allReadings = useMemo(
    () => applyCvOverrides(
      Object.values(CAMPUSES).flatMap((candidate) => readDecks(candidate, state.arrivalMin, scenario)),
      state.cvOverrides,
    ),
    [scenario, state.arrivalMin, state.cvOverrides],
  );
  const readings = useMemo(
    () => allReadings.filter((reading) => campus.decks.some((deck) => deck.id === reading.deckId)),
    [allReadings, campus.decks],
  );
  const decision = useMemo(
    () => decideCommute({
      campus,
      target: { name: target.name, geo: target.geo },
      classStartMin: nextClass?.startMin ?? state.arrivalMin + 60,
      arrivalMin: state.arrivalMin,
      profile: state.profile,
      scenario,
      readings,
    }),
    [campus, nextClass?.startMin, readings, scenario, state.arrivalMin, state.profile, target.geo, target.name],
  );
  const winner = getCommuteOption(decision, decision.winner);
  const uber = getCommuteOption(decision, 'uber');
  const journeyLaundryReadings = useMemo(
    () => readLaundryRoom(journeyLaundryRoom, 0),
    [journeyLaundryRoom],
  );
  const journey = useMemo(
    () => planJourney({
      campus,
      classes: state.classes,
      selectedClassId: state.selectedClassId,
      day: state.selectedDay,
      arrivalMin: winner.arriveMin,
      arrivalGeo: winner.arrivalPoint.geo,
      scenario,
      diningHall,
      laundryRoom: journeyLaundryRoom,
      laundryReadings: journeyLaundryReadings,
      diningEnabled: state.diningEnabled,
      laundryEnabled: state.laundryEnabled,
      dietaryTags: state.dietaryTags,
      uberUrl: uber.uber?.deepLink ?? '',
    }),
    [campus, diningHall, journeyLaundryReadings, journeyLaundryRoom, scenario, state.classes, state.dietaryTags, state.diningEnabled, state.laundryEnabled, state.selectedClassId, state.selectedDay, uber.uber?.deepLink, winner.arrivalPoint.geo, winner.arriveMin],
  );
  const evReadings = useMemo(
    () => readEvChargers(state.arrivalMin, scenario),
    [scenario, state.arrivalMin],
  );
  const owlLaundryReadings = useMemo(
    () => readLaundryRoom(laundryRoom, 0),
    [laundryRoom],
  );
  const activeAlerts = journey.alerts.filter((alert) => !dismissedAlertIds.includes(alert.id)).slice(0, 3);
  const owlContext: OwlContext = {
    campus,
    day: state.selectedDay,
    arrivalMin: state.arrivalMin,
    scenario,
    profile: state.profile,
    nextClass,
    target,
    decision,
    readings,
    allReadings,
    cvOverrides: state.cvOverrides,
    evReadings,
    diningHall,
    diningReadings,
    laundryRoom,
    laundryReadings: owlLaundryReadings,
    alerts: activeAlerts,
    classes: state.classes,
  };

  const openParkingMap = (focus: MapFocus) => {
    setMapMode('parking');
    setMapFocus(focus);
    setCamera(null);
    setActiveTab('campus');
  };

  const runOwlAction = (action: OwlAction) => {
    switch (action.kind) {
      case 'openTab':
        setActiveTab(action.tab);
        return;
      case 'openMap':
        setMapMode(action.mode);
        setMapFocus(action.focus ?? null);
        setCamera(null);
        if (action.focus?.id.startsWith('m-')) dispatch({ type: 'setCampus', campusId: 'marietta' });
        if (action.focus?.id.startsWith('k-')) dispatch({ type: 'setCampus', campusId: 'kennesaw' });
        setActiveTab('campus');
        return;
      case 'setArrival':
        dispatch({ type: 'setArrival', arrivalMin: action.arrivalMin });
        return;
      case 'applyPlan':
        dispatch({ type: 'applyCopilot', intent: action.intent });
        return;
      case 'openUrl':
        return;
      default: {
        const exhaustiveAction: never = action;
        return exhaustiveAction;
      }
    }
  };

  const applyVisionResult = (deckId: string, level: number, result: VisionResult) => {
    dispatch({ type: 'applyCvOverride', deckId, level, override: createCvOverride(result) });
    setMapFocus({ kind: 'deck', id: deckId });
  };

  return (
    <div className="ps-app ps-app--bottom-chrome">
      <header className="ps-header ps-header--tabs">
        <a className="ps-wordmark" href="#top" aria-label="OwlFlow home"><span className="ps-wordmark__mark">O</span><span className="ps-wordmark__copy"><strong>OwlFlow</strong><small>KSU Campus Intelligence</small></span></a>
        <AppTabs activeTab={activeTab} onChange={setActiveTab} />
      </header>

      <main id="top" className="ps-workspace">
        <div id="ps-panel-commute" role="tabpanel" aria-labelledby="ps-tab-commute" hidden={activeTab !== 'commute'}>
          <CampusIntelligence alerts={activeAlerts} onDismiss={(alertId) => setDismissedAlertIds((current) => [...current, alertId])} onAction={runOwlAction} />
          <Planner state={state} dispatch={dispatch} campus={campus} />
          <RecommendationList
            decision={decision}
            cvOverrides={state.cvOverrides}
            onViewDeckOnMap={(deckId) => openParkingMap({ kind: 'deck', id: deckId })}
            onOpenBusMap={() => { setMapMode('bus'); setCamera(null); setActiveTab('campus'); }}
            onClearCvOverride={(deckId) => dispatch({ type: 'clearCvOverride', deckId })}
          />
          <JourneyTimeline
            journey={journey}
            slackMin={winner.slackMin}
            diningEnabled={state.diningEnabled}
            laundryEnabled={state.laundryEnabled}
            onDiningChange={(enabled) => dispatch({ type: 'setDiningEnabled', enabled })}
            onLaundryChange={(enabled) => dispatch({ type: 'setLaundryEnabled', enabled })}
          />
        </div>

        <div id="ps-panel-dining" role="tabpanel" aria-labelledby="ps-tab-dining" hidden={activeTab !== 'dining'}>
          <DiningMenu hall={diningHall} scenario={scenario} minute={state.arrivalMin} selectedTags={state.dietaryTags} {...(journey.dining ? { pitStop: journey.dining } : {})} onTagsChange={(tags) => dispatch({ type: 'setDietaryTags', tags })} />
        </div>

        <div id="ps-panel-laundry" role="tabpanel" aria-labelledby="ps-tab-laundry" hidden={activeTab !== 'laundry'}>
          <LaundryBoard rooms={campusLaundryRooms} room={laundryRoom} currentMinute={state.arrivalMin} classStartMin={nextClass?.startMin ?? state.arrivalMin + 60} onRoomChange={(dormId) => dispatch({ type: 'setDorm', dormId })} />
        </div>

        <div id="ps-panel-campus" role="tabpanel" aria-labelledby="ps-tab-campus" hidden={activeTab !== 'campus'}>
          <CampusMap
            campus={campus}
            target={target}
            readings={readings}
            allReadings={allReadings}
            evReadings={evReadings}
            decision={decision}
            journey={journey}
            scenario={scenario}
            minute={state.arrivalMin}
            mode={mapMode}
            focus={mapFocus}
            camera={camera}
            cvOverrides={state.cvOverrides}
            onModeChange={(mode) => { setMapMode(mode); setCamera(null); }}
            onFocusChange={setMapFocus}
            onCameraChange={setCamera}
            onApplyCvOverride={applyVisionResult}
            onClearCvOverride={(deckId, level) => dispatch({ type: 'clearCvOverride', deckId, ...(level === undefined ? {} : { level }) })}
          />
          <CommunityReports campus={campus} readings={readings} scenario={scenario} />
        </div>
      </main>

      <footer className="ps-footer">
        <div className="ps-wordmark ps-wordmark--footer"><span>O</span><strong>OwlFlow</strong></div>
        <p><BrainCircuit size={14} /> KSU campus intelligence &amp; mobility engine</p>
        <small>Hackathon simulation · Not an official KSU, Uber, dining, laundry, or Big Owl Bus service</small>
      </footer>

      <OwlCopilotLauncher context={owlContext} alertCount={activeAlerts.length} onAction={runOwlAction} />
      <DemoBar scenarioId={state.scenarioId} onChange={(scenarioId) => dispatch({ type: 'setScenario', scenarioId })} />
    </div>
  );
}
