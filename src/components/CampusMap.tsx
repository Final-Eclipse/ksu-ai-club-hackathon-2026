import { useState } from 'react';
import {
  BatteryCharging,
  Building2,
  BusFront,
  Camera,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react';
import { CAMERA_ANGLES, getVisionFeed } from '../data/cameras';
import { EV_CHARGERS } from '../data/evChargers';
import { appleDirectionsUrl, googleDirectionsUrl } from '../engine/directions';
import { facilitySpotDots } from '../engine/mapLayout';
import { resolveMapInfo } from '../engine/mapInfo';
import type {
  CameraSelection,
  Campus,
  CampusId,
  CampusMapMode,
  CommuteDecision,
  CvOverrides,
  DeckReading,
  EvChargerReading,
  JourneyPlan,
  MapFocus,
  Place,
  Scenario,
  VisionResult,
} from '../types';
import { BusTracker } from './BusTracker';
import { VisionCameraPanel } from './VisionCameraPanel';

interface CampusMapProps {
  campus: Campus;
  target: Place;
  readings: readonly DeckReading[];
  allReadings: readonly DeckReading[];
  evReadings: readonly EvChargerReading[];
  decision: CommuteDecision;
  journey: JourneyPlan;
  scenario: Scenario;
  minute: number;
  mode: CampusMapMode;
  focus: MapFocus | null;
  camera: CameraSelection | null;
  cvOverrides: CvOverrides;
  onModeChange: (mode: CampusMapMode) => void;
  onFocusChange: (focus: MapFocus | null) => void;
  onCameraChange: (camera: CameraSelection | null) => void;
  onApplyCvOverride: (deckId: string, level: number, result: VisionResult) => void;
  onClearCvOverride: (deckId: string, level?: number) => void;
}

interface OverlayPoint {
  xPct: number;
  yPct: number;
}

const FACILITY_POINTS: Record<CampusId, Record<string, OverlayPoint>> = {
  kennesaw: {
    'k-north': { xPct: 15.5, yPct: 22 },
    'k-central': { xPct: 36, yPct: 35 },
    'k-west': { xPct: 10.5, yPct: 57 },
    'k-east': { xPct: 38, yPct: 68 },
  },
  marietta: {
    'm-west': { xPct: 27, yPct: 65 },
    'm-central': { xPct: 39, yPct: 20 },
  },
};

const PARKING_LABELS: Record<string, string> = {
  'k-central': 'Central · 441 open',
  'k-west': 'West · 247 open',
  'k-north': 'North · 487 open',
  'k-east': 'East · 331 open',
  'm-west': 'West P60',
  'm-central': 'Central Lot',
};

const SPOT_OFFSETS: readonly OverlayPoint[] = [
  { xPct: -1.8, yPct: 2.9 },
  { xPct: -.6, yPct: 2.9 },
  { xPct: .6, yPct: 2.9 },
  { xPct: 1.8, yPct: 2.9 },
];

function mapPoint(point: OverlayPoint): { x: number; y: number } {
  return { x: point.xPct * 10, y: point.yPct * 6.25 };
}

function getFacilityPoint(campusId: CampusId, deckId: string): OverlayPoint {
  return FACILITY_POINTS[campusId][deckId] ?? { xPct: 50, yPct: 50 };
}

function focusDeckId(focus: MapFocus | null, campus: Campus): string | null {
  if (!focus) return null;
  if (focus.kind === 'ev') {
    return EV_CHARGERS.find((charger) => charger.id === focus.id)?.deckId ?? null;
  }
  return campus.decks.find((deck) => focus.id === deck.id || focus.id.startsWith(`${deck.id}-spot-`))?.id ?? null;
}

function activateOnKeyboard(event: React.KeyboardEvent<SVGGElement>, action: () => void): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

export function CampusMap({
  campus,
  target,
  readings,
  allReadings,
  evReadings,
  scenario,
  minute,
  mode,
  focus,
  camera,
  cvOverrides,
  onModeChange,
  onFocusChange,
  onCameraChange,
  onApplyCvOverride,
  onClearCvOverride,
}: CampusMapProps) {
  const [showAllCameras, setShowAllCameras] = useState(false);
  const chargers = EV_CHARGERS.filter((charger) => charger.campusId === campus.id);
  const selectedDeckId = focusDeckId(focus, campus);
  const mapInfo = resolveMapInfo(focus, campus, target, readings, evReadings);
  const cameraFeed = camera ? getVisionFeed(`${camera.deckId}-${camera.angle.toLowerCase()}`) : null;
  const cameraOverride = cameraFeed ? cvOverrides[cameraFeed.deckId]?.[cameraFeed.level] : undefined;

  if (camera && cameraFeed) {
    return (
      <section className="ps-map-section ps-map-section--p6" aria-label="Campus camera vision">
        <VisionCameraPanel
          camera={camera}
          readings={allReadings}
          scenario={scenario}
          minute={minute}
          {...(cameraOverride ? { override: cameraOverride } : {})}
          onPush={onApplyCvOverride}
          onClear={(deckId, level) => onClearCvOverride(deckId, level)}
          onBack={() => onCameraChange(null)}
        />
      </section>
    );
  }

  return (
    <section className="ps-map-section ps-map-section--p6" aria-label={`${campus.name} campus map`}>
      <div className="ps-clean-map-shell">
        <div className="ps-map-grid-fallback" aria-hidden="true" />
        <img
          className="ps-campus-map-image"
          src={`./maps/ksu-${campus.id}.png`}
          alt=""
          aria-hidden="true"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
        <div className="ps-campus-map-shade" aria-hidden="true" />

        <header className="ps-map-floating-head">
          <div className="ps-map-mode-toggle" role="group" aria-label="Campus map mode">
            <button type="button" aria-pressed={mode === 'parking'} onClick={() => onModeChange('parking')}>
              <MapPin size={15} /> Parking &amp; EV Map
            </button>
            <button type="button" aria-pressed={mode === 'bus'} onClick={() => onModeChange('bus')}>
              <BusFront size={15} /> Live Big Owl Bus
            </button>
          </div>
          <span className="ps-campus-badge">{campus.name.replace(' Campus', '')}</span>
        </header>

        {mode === 'bus' ? (
          <BusTracker scenario={scenario} campus={campus} minute={minute} />
        ) : (
          <>
            <svg className="ps-parking-overlay" viewBox="0 0 1000 625" role="img" aria-label={`${campus.name} parking, EV charger, and camera locations`}>
              <defs>
                <filter id={`ps-p6-ev-glow-${campus.id}`} x="-120%" y="-120%" width="340%" height="340%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {campus.decks.map((deck) => {
                const reading = readings.find((candidate) => candidate.deckId === deck.id);
                if (!reading) return null;
                const overlayPoint = getFacilityPoint(campus.id, deck.id);
                const point = mapPoint(overlayPoint);
                const selected = selectedDeckId === deck.id;
                const openSpots = facilitySpotDots(deck, reading).filter((spot) => spot.open).slice(0, SPOT_OFFSETS.length);
                const showCameras = showAllCameras || selected;
                return (
                  <g key={deck.id} className={selected ? 'ps-p6-facility ps-p6-facility--selected' : 'ps-p6-facility'}>
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`${deck.name}, ${reading.open} open`}
                      transform={`translate(${point.x} ${point.y})`}
                      onClick={() => onFocusChange({ kind: 'deck', id: deck.id })}
                      onKeyDown={(event) => activateOnKeyboard(event, () => onFocusChange({ kind: 'deck', id: deck.id }))}
                    >
                      <rect className="ps-p6-deck-target" x="-54" y="-20" width="108" height="40" rx="12" />
                      <rect className="ps-p6-deck-pill" x="-61" y="-48" width="122" height="25" rx="12.5" />
                      <text className="ps-p6-deck-label" y="-31" textAnchor="middle">{PARKING_LABELS[deck.id] ?? `${deck.short} · ${reading.open} open`}</text>
                    </g>

                    {openSpots.map((spot, index) => {
                      const offset = SPOT_OFFSETS[index];
                      if (!offset) return null;
                      const spotPoint = mapPoint({ xPct: overlayPoint.xPct + offset.xPct, yPct: overlayPoint.yPct + offset.yPct });
                      return (
                        <circle
                          key={spot.id}
                          className="ps-p6-open-spot"
                          cx={spotPoint.x}
                          cy={spotPoint.y}
                          r="5"
                          role="button"
                          tabIndex={0}
                          aria-label={`Open stall at ${deck.name}`}
                          onClick={() => onFocusChange({ kind: 'spot', id: spot.id })}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter' && event.key !== ' ') return;
                            event.preventDefault();
                            onFocusChange({ kind: 'spot', id: spot.id });
                          }}
                        />
                      );
                    })}

                    {showCameras && CAMERA_ANGLES.map((angle, index) => {
                      const angleOffsets: readonly OverlayPoint[] = [
                        { xPct: 5.4, yPct: -4.9 },
                        { xPct: -5.4, yPct: -4.9 },
                        { xPct: 5.4, yPct: 5.5 },
                        { xPct: -5.4, yPct: 5.5 },
                      ];
                      const offset = angleOffsets[index];
                      if (!offset) return null;
                      const cameraPoint = mapPoint({ xPct: overlayPoint.xPct + offset.xPct, yPct: overlayPoint.yPct + offset.yPct });
                      return (
                        <g
                          key={`${deck.id}-${angle}`}
                          className="ps-p6-camera-pin"
                          transform={`translate(${cameraPoint.x} ${cameraPoint.y})`}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open ${deck.name} ${angle} camera`}
                          onClick={() => onCameraChange({ deckId: deck.id, angle })}
                          onKeyDown={(event) => activateOnKeyboard(event, () => onCameraChange({ deckId: deck.id, angle }))}
                        >
                          <rect x="-17" y="-12" width="34" height="24" rx="8" />
                          <Camera x={-7} y={-8} size={14} />
                          <text y="23" textAnchor="middle">{angle}</text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {chargers.map((charger) => {
                const reading = evReadings.find((candidate) => candidate.chargerId === charger.id);
                if (!reading) return null;
                const deckPoint = getFacilityPoint(campus.id, charger.deckId);
                const point = mapPoint({ xPct: deckPoint.xPct + 4.2, yPct: deckPoint.yPct + .4 });
                const selected = focus?.kind === 'ev' && focus.id === charger.id;
                return (
                  <g
                    key={charger.id}
                    className={selected ? 'ps-p6-ev-pin ps-p6-ev-pin--selected' : 'ps-p6-ev-pin'}
                    transform={`translate(${point.x} ${point.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${charger.name}, ${reading.free} of ${reading.ports} ports free`}
                    onClick={() => onFocusChange({ kind: 'ev', id: charger.id })}
                    onKeyDown={(event) => activateOnKeyboard(event, () => onFocusChange({ kind: 'ev', id: charger.id }))}
                  >
                    <circle r="17" filter={`url(#ps-p6-ev-glow-${campus.id})`} />
                    <text y="7" textAnchor="middle">⚡</text>
                  </g>
                );
              })}
            </svg>

            <button
              className="ps-camera-visibility-toggle"
              type="button"
              aria-pressed={showAllCameras}
              onClick={() => setShowAllCameras((current) => !current)}
            >
              <Camera size={14} /> {showAllCameras ? 'Selected Deck Cameras' : 'Show All Cameras'}
            </button>

            {mapInfo && (
              <article className="ps-map-info-card ps-p6-info-card" aria-live="polite">
                <button type="button" aria-label="Close map information" onClick={() => onFocusChange(null)}><X size={15} /></button>
                <span>{mapInfo.kind === 'ev' ? <BatteryCharging size={18} /> : mapInfo.kind === 'deck' ? <Building2 size={18} /> : <MapPin size={18} />}</span>
                <small>{mapInfo.kind.toUpperCase()} · LIVE AVAILABILITY</small>
                <h2>{mapInfo.title}</h2>
                <p>{mapInfo.detail}</p>
                <div>{mapInfo.lines.slice(0, 3).map((line) => <span key={line}>{line}</span>)}</div>
                <footer>
                  <a href={appleDirectionsUrl(mapInfo.geo)} target="_blank" rel="noopener noreferrer">Apple Maps ↗</a>
                  <a href={googleDirectionsUrl(mapInfo.geo)} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
                </footer>
                {mapInfo.kind === 'deck' && cvOverrides[focus?.id ?? ''] && (
                  <button className="ps-map-clear-cv" type="button" onClick={() => onClearCvOverride(focus?.id ?? '')}>
                    <RotateCcw size={13} /> Clear CV overrides
                  </button>
                )}
              </article>
            )}
          </>
        )}

        <div className="ps-map-compact-legend" aria-label="Map legend">
          {mode === 'bus' ? (
            <>
              <span><i className="ps-route-swatch ps-route-swatch--gold" /> Gold · Express</span>
              <span><i className="ps-route-swatch ps-route-swatch--emerald" /> Emerald · Marietta</span>
              <span><i className="ps-route-swatch ps-route-swatch--cyan" /> Cyan · Rec Center</span>
              <span><i className="ps-route-swatch ps-route-swatch--amber" /> Amber · Shuttle Lot</span>
              <span>Live-style simulation</span>
            </>
          ) : (
            <>
              <span><i className="ps-map-key ps-map-key--gold" /> Parking</span>
              <span><i className="ps-map-key ps-map-key--white" /> Open stall</span>
              <span><i className="ps-map-key ps-map-key--ev" /> EV charger</span>
              <span><Camera size={12} /> Camera</span>
              <span>Counts simulated · locations calibrated</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
