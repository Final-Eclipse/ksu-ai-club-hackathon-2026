import {
  BatteryCharging,
  Building2,
  BusFront,
  Camera,
  MapPin,
  Navigation,
  RotateCcw,
  ScanLine,
  X,
} from 'lucide-react';
import { CAMERA_ANGLES, getVisionFeed } from '../data/cameras';
import { EV_CHARGERS } from '../data/evChargers';
import { getCampusStreets } from '../data/streets';
import { getCommuteOption } from '../engine/commute';
import { appleDirectionsUrl, googleDirectionsUrl } from '../engine/directions';
import {
  cameraPinPoint,
  facilitySpotDots,
  parkingBayCells,
  projectFootprint,
  projectGeo2d,
  routePath,
} from '../engine/mapLayout';
import { resolveMapInfo } from '../engine/mapInfo';
import type {
  CameraSelection,
  Campus,
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
import { StatusBadge } from './StatusBadge';
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

export function CampusMap({
  campus,
  target,
  readings,
  allReadings,
  evReadings,
  decision,
  journey,
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
  const selectedOption = getCommuteOption(decision, decision.winner);
  const targetPoint = projectGeo2d(campus, target.geo);
  const arrivalPoint = projectGeo2d(campus, selectedOption.arrivalPoint.geo);
  const streets = getCampusStreets(campus.id);
  const chargers = EV_CHARGERS.filter((charger) => charger.campusId === campus.id);
  const mapInfo = resolveMapInfo(focus, campus, target, readings, evReadings);
  const cameraFeed = camera ? getVisionFeed(`${camera.deckId}-${camera.angle.toLowerCase()}`) : null;
  const cameraOverride = cameraFeed ? cvOverrides[cameraFeed.deckId]?.[cameraFeed.level] : undefined;
  const journeyPoints = journey.stops
    .map((stop) => projectGeo2d(campus, stop.geo))
    .map((point) => `${point.x},${point.y}`)
    .join(' ');

  return (
    <section className="ps-map-section ps-map-section--p3" aria-labelledby="ps-map-title">
      <div className="ps-section-label"><span>04</span> Campus Map &amp; Live CV</div>
      <div className="ps-map-mode-head">
        <div>
          <p className="ps-kicker">2D campus intelligence</p>
          <h1 id="ps-map-title">Know where to move next.</h1>
          <p>North-up dark satellite mapping with live-style parking, EV, bundled camera CV, and Big Owl Bus telemetry.</p>
        </div>
        {!camera && (
          <div className="ps-map-mode-toggle" role="group" aria-label="Campus map mode">
            <button type="button" aria-pressed={mode === 'parking'} onClick={() => onModeChange('parking')}><MapPin size={15} /> Parking &amp; EV Map</button>
            <button type="button" aria-pressed={mode === 'bus'} onClick={() => onModeChange('bus')}><BusFront size={15} /> Live Big Owl Bus</button>
          </div>
        )}
      </div>

      {camera && cameraFeed ? (
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
      ) : mode === 'bus' ? (
        <BusTracker scenario={scenario} campus={campus} target={target} minute={minute} />
      ) : (
        <div className="ps-map-p4b-layout">
          <div className="ps-map-shell ps-map-shell--satellite">
            <div className="ps-map-toolbar">
              <span><MapPin size={14} /> {campus.name} · north up</span>
              <span><Navigation size={14} /> Active class: {target.short}</span>
              <span className="ps-sim-chip">LIVE-STYLE · SIM</span>
            </div>
            <div className="ps-map-scroll ps-map-scroll--2d">
              <svg className="ps-campus-map ps-campus-map--2d" viewBox="0 0 1000 600" role="img" aria-label={`${campus.name} north-up two-dimensional parking and EV map`}>
                <defs>
                  <pattern id={`ps-satellite-${campus.id}`} width="46" height="46" patternUnits="userSpaceOnUse">
                    <circle cx="6" cy="12" r="1" className="ps-satellite-grain" />
                    <circle cx="34" cy="29" r=".8" className="ps-satellite-grain" />
                  </pattern>
                  <filter id={`ps-ev-glow-${campus.id}`} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <rect width="1000" height="600" rx="18" className="ps-map2d-bg" />
                <path d="M55 92L294 50L512 78L747 48L947 115L925 512L720 552L476 524L250 558L70 502Z" className="ps-map2d-campus" />
                <path d="M85 125L228 72L318 102L282 214L139 237Z" className="ps-map2d-green" />
                <path d="M694 78L913 126L895 246L746 218Z" className="ps-map2d-green" />
                <path d="M110 414L263 367L370 459L239 535L89 493Z" className="ps-map2d-green" />
                <rect width="1000" height="600" rx="18" fill={`url(#ps-satellite-${campus.id})`} />

                {streets.map((street) => {
                  const points = street.points.map((point) => projectGeo2d(campus, point));
                  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
                  const labelPoint = points[Math.floor(points.length / 2)];
                  return (
                    <g key={street.id} className="ps-map2d-street">
                      <polyline className="ps-map2d-road-casing" points={polyline} />
                      <polyline className="ps-map2d-road" points={polyline} />
                      <polyline className="ps-map2d-road-lane" points={polyline} />
                      {labelPoint && <text x={labelPoint.x} y={labelPoint.y - 10}>{street.name}</text>}
                    </g>
                  );
                })}

                {journeyPoints
                  ? <polyline className="ps-map2d-journey" points={journeyPoints} />
                  : <path className="ps-map2d-journey" d={routePath(arrivalPoint, targetPoint)} />}

                {campus.places.map((place) => {
                  const point = projectGeo2d(campus, place.geo);
                  const footprint = projectFootprint(place.footprint);
                  const selected = place.id === target.id;
                  return (
                    <g key={place.id} className={selected ? 'ps-map2d-building ps-map2d-building--target' : 'ps-map2d-building'}>
                      <rect x={point.x - footprint.width / 2} y={point.y - footprint.depth / 2} width={footprint.width} height={footprint.depth} rx="4" />
                      <path d={`M${point.x - footprint.width / 2 + 5} ${point.y - footprint.depth / 2 + 6}H${point.x + footprint.width / 2 - 5}`} />
                      <text x={point.x} y={point.y + footprint.depth / 2 + 14} textAnchor="middle">{place.short}</text>
                    </g>
                  );
                })}

                {campus.decks.map((deck) => {
                  const reading = readings.find((candidate) => candidate.deckId === deck.id);
                  if (!reading) return null;
                  const point = projectGeo2d(campus, deck.geo);
                  const footprint = projectFootprint(deck.footprint);
                  const selected = focus?.kind === 'deck' && focus.id === deck.id;
                  const deckOverrides = cvOverrides[deck.id];
                  const levelMax = Math.max(1, ...reading.levels.map((level) => level.open / Math.max(1, level.capacity)));
                  const spots = facilitySpotDots(deck, reading);
                  const facilityClass = [
                    'ps-map2d-deck',
                    deck.kind === 'lot' ? 'ps-map2d-deck--lot' : 'ps-map2d-deck--garage',
                    selected ? 'ps-map2d-deck--selected' : '',
                  ].filter(Boolean).join(' ');
                  return (
                    <g
                      key={deck.id}
                      className={facilityClass}
                      role="button"
                      tabIndex={0}
                      aria-label={`${deck.name}, ${reading.open} open`}
                      onClick={() => onFocusChange({ kind: 'deck', id: deck.id })}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        onFocusChange({ kind: 'deck', id: deck.id });
                      }}
                    >
                      <rect className="ps-map2d-facility" x={point.x - footprint.width / 2 - 5} y={point.y - footprint.depth / 2 - 5} width={footprint.width + 10} height={footprint.depth + 10} rx="8" />
                      {deck.kind === 'lot' && parkingBayCells(deck, reading, point).map((bay) => (
                        <rect key={bay.id} className={bay.open ? 'ps-map2d-bay ps-map2d-bay--open' : 'ps-map2d-bay'} x={bay.x} y={bay.y} width={bay.width} height={bay.height} rx="1" />
                      ))}
                      {spots.map((spot) => {
                        const spotPoint = projectGeo2d(campus, spot.geo);
                        return (
                          <circle
                            key={spot.id}
                            className={spot.open ? 'ps-map2d-spot ps-map2d-spot--open' : 'ps-map2d-spot'}
                            cx={spotPoint.x}
                            cy={spotPoint.y}
                            r={spot.open ? 4.5 : 2.4}
                            role={spot.open ? 'button' : undefined}
                            tabIndex={spot.open ? 0 : undefined}
                            onClick={spot.open ? (event) => {
                              event.stopPropagation();
                              onFocusChange({ kind: 'spot', id: spot.id });
                            } : undefined}
                            onKeyDown={spot.open ? (event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;
                              event.preventDefault();
                              event.stopPropagation();
                              onFocusChange({ kind: 'spot', id: spot.id });
                            } : undefined}
                          >
                            <title>{spot.open ? 'Open parking stall' : 'Occupied parking stall'} · live-style SIM</title>
                          </circle>
                        );
                      })}
                      <g className="ps-map2d-deck-pill" transform={`translate(${point.x - Math.max(112, footprint.width) / 2} ${point.y - footprint.depth / 2 - 28})`}>
                        <rect width={Math.max(112, footprint.width)} height="21" rx="10" />
                        <text x={Math.max(112, footprint.width) / 2} y="14" textAnchor="middle">{deck.short} · {reading.open} OPEN</text>
                      </g>
                      {deck.kind === 'deck' && (
                        <g className="ps-map2d-levelbar" transform={`translate(${point.x - footprint.width / 2} ${point.y + footprint.depth / 2 + 8})`}>
                          {reading.levels.map((level, index) => (
                            <rect key={level.level} x={index * (footprint.width / reading.levels.length)} width={Math.max(3, footprint.width / reading.levels.length - 2)} height="5" rx="2" opacity={0.25 + 0.75 * ((level.open / Math.max(1, level.capacity)) / levelMax)} />
                          ))}
                        </g>
                      )}
                      {deckOverrides && Object.keys(deckOverrides).length > 0 && <text className="ps-svg-cv-chip" x={point.x} y={point.y - footprint.depth / 2 - 34} textAnchor="middle">LIVE CV</text>}
                      {CAMERA_ANGLES.map((angle) => {
                        const pin = cameraPinPoint(point, angle);
                        return (
                          <g
                            key={`${deck.id}-${angle}`}
                            className="ps-camera-pin"
                            transform={`translate(${pin.x} ${pin.y})`}
                            role="button"
                            tabIndex={0}
                            aria-label={`Open ${deck.name} ${angle} bundled camera`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onCameraChange({ deckId: deck.id, angle });
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;
                              event.preventDefault();
                              event.stopPropagation();
                              onCameraChange({ deckId: deck.id, angle });
                            }}
                          >
                            <circle r="10" />
                            <Camera x={-6} y={-6} size={12} />
                            <text y="20" textAnchor="middle">{angle}</text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {chargers.map((charger) => {
                  const reading = evReadings.find((candidate) => candidate.chargerId === charger.id);
                  if (!reading) return null;
                  const point = projectGeo2d(campus, charger.geo);
                  const selected = focus?.kind === 'ev' && focus.id === charger.id;
                  return (
                    <g
                      key={charger.id}
                      className={selected ? 'ps-ev-marker ps-ev-marker--selected' : 'ps-ev-marker'}
                      role="button"
                      tabIndex={0}
                      aria-label={`${charger.name}, ${reading.free} of ${reading.ports} ports free`}
                      transform={`translate(${point.x} ${point.y})`}
                      onClick={() => onFocusChange({ kind: 'ev', id: charger.id })}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        onFocusChange({ kind: 'ev', id: charger.id });
                      }}
                    >
                      <circle r="15" className={reading.free ? 'ps-ev-dot ps-ev-dot--free' : 'ps-ev-dot ps-ev-dot--busy'} filter={`url(#ps-ev-glow-${campus.id})`} />
                      <text textAnchor="middle" y="6">⚡</text>
                      <title>{reading.free} of {reading.ports} EV ports free · SIM</title>
                    </g>
                  );
                })}

                <g className="ps-map-north" transform="translate(42 48)"><path d="M0 22L10 0L20 22L10 17Z" /><text x="10" y="36" textAnchor="middle">N</text></g>
                <g className="ps-arrival-marker" transform={`translate(${arrivalPoint.x} ${arrivalPoint.y})`}><circle r="11" /><Navigation size={14} x={-7} y={-7} /></g>
              </svg>
            </div>

            {mapInfo && (
              <article className="ps-map-info-card ps-map-floating-card" aria-live="polite">
                <button type="button" aria-label="Close map information" onClick={() => onFocusChange(null)}><X size={15} /></button>
                <span>{mapInfo.kind === 'ev' ? <BatteryCharging size={19} /> : mapInfo.kind === 'spot' ? <MapPin size={19} /> : <Building2 size={19} />}</span>
                <small>{mapInfo.kind.toUpperCase()} · LIVE AVAILABILITY</small>
                <h2>{mapInfo.title}</h2>
                <p>{mapInfo.detail}</p>
                <div>{mapInfo.lines.map((line) => <span key={line}>{line}</span>)}</div>
                <p><strong>{mapInfo.walkMin} min walk</strong> to active class at {target.short}</p>
                {mapInfo.approx && <em>Location approximate · availability simulated</em>}
                <footer>
                  <a href={appleDirectionsUrl(mapInfo.geo)} target="_blank" rel="noopener noreferrer">Apple Maps ↗</a>
                  <a href={googleDirectionsUrl(mapInfo.geo)} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
                </footer>
              </article>
            )}

            <div className="ps-map-caption">
              <span><i className="ps-map-key ps-map-key--gold" /> Active class</span>
              <span><i className="ps-map-key ps-map-key--white" /> Open stall</span>
              <span><i className="ps-map-key ps-map-key--ev" /> EV charger</span>
              <span><Camera size={12} /> Bundled video CV</span>
              <span>Dark campus schematic · coordinates approximate · counts SIM</span>
            </div>
          </div>

          <div className="ps-map-facility-strip" aria-label="Parking facilities">
            <div><ScanLine size={18} /><span><strong>Live parking facilities</strong><small>Select a garage, lot, white stall, EV pin, or camera.</small></span></div>
            {campus.decks.map((deck) => {
              const reading = readings.find((candidate) => candidate.deckId === deck.id);
              return reading ? (
                <button type="button" key={deck.id} onClick={() => onFocusChange({ kind: 'deck', id: deck.id })}>
                  <span><strong>{deck.short}</strong><small>{reading.open} open · best L{reading.bestLevel}</small></span>
                  <StatusBadge status={reading.status} occupancy={reading.occupancy} />
                </button>
              ) : null;
            })}
            {focus?.kind === 'deck' && cvOverrides[focus.id] && (
              <button className="ps-map-clear-cv" type="button" onClick={() => onClearCvOverride(focus.id)}><RotateCcw size={13} /> Clear all CV overrides</button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
