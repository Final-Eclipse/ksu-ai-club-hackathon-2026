import { useEffect, useMemo, useRef, useState } from 'react';
import { BusFront, Clock3, MapPin, Navigation, UsersRound } from 'lucide-react';
import { BUS_ROUTES } from '../data/busRoutes';
import { getCampusStreets } from '../data/streets';
import { busPoint, busTelemetry, routePolyline } from '../engine/bus';
import { projectFootprint, projectGeo2d } from '../engine/mapLayout';
import { useNowSeconds } from '../hooks/useNowSeconds';
import type {
  BusTrackerRoute,
  BusTrackerStop,
  Campus,
  Place,
  Scenario,
} from '../types';
import type { BusPathPoint } from '../engine/bus';

interface BusTrackerProps {
  scenario: Scenario;
  campus: Campus;
  target: Place;
  minute: number;
}

interface ProjectedStop {
  stop: BusTrackerStop;
  point: BusPathPoint;
}

interface ProjectedRoute {
  route: BusTrackerRoute;
  points: BusPathPoint[];
  stops: ProjectedStop[];
}

function requireFirstRoute(routes: readonly ProjectedRoute[], campusName: string): ProjectedRoute {
  const first = routes[0];
  if (!first) throw new Error(`${campusName} requires at least one local Big Owl Bus route.`);
  return first;
}

export function BusTracker({ scenario, campus, target, minute }: BusTrackerProps) {
  const routeLayers = useMemo<ProjectedRoute[]>(() => BUS_ROUTES.flatMap((route) => {
    const campusPath = route.paths.find((path) => path.campusId === campus.id);
    if (!campusPath) return [];
    return [{
      route,
      points: campusPath.points.map((point) => projectGeo2d(campus, point)),
      stops: route.stops
        .filter((stop) => stop.campusId === campus.id)
        .map((stop) => ({ stop, point: projectGeo2d(campus, stop.geo) })),
    }];
  }), [campus]);
  const firstLayer = requireFirstRoute(routeLayers, campus.name);

  const [selectedRouteId, setSelectedRouteId] = useState(firstLayer.route.id);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const busRefs = useRef<Record<string, SVGGElement | null>>({});
  const animationRef = useRef<number | null>(null);
  const nowSeconds = useNowSeconds();
  const selectedLayer = routeLayers.find((layer) => layer.route.id === selectedRouteId) ?? firstLayer;
  const selectedBus = selectedBusId
    ? selectedLayer.route.buses.find((bus) => bus.id === selectedBusId)
    : undefined;
  const telemetry = useMemo(
    () => selectedBus
      ? busTelemetry(selectedLayer.route, selectedBus, scenario, nowSeconds, campus.id, minute)
      : null,
    [campus.id, minute, nowSeconds, scenario, selectedBus, selectedLayer.route],
  );
  const streets = getCampusStreets(campus.id);

  useEffect(() => {
    if (routeLayers.some((layer) => layer.route.id === selectedRouteId)) return;
    setSelectedRouteId(firstLayer.route.id);
    setSelectedBusId(null);
  }, [firstLayer.route.id, routeLayers, selectedRouteId]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update = (elapsedMs: number) => {
      for (const layer of routeLayers) {
        for (const bus of layer.route.buses) {
          const element = busRefs.current[bus.id];
          if (!element) continue;
          const point = busPoint(layer.points, bus, reducedMotion ? 0 : elapsedMs);
          element.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${point.angle})`);
        }
      }
      if (!reducedMotion) animationRef.current = window.requestAnimationFrame(update);
    };
    animationRef.current = window.requestAnimationFrame(update);
    return () => {
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [routeLayers]);

  return (
    <section className="ps-bus-tracker" aria-labelledby="ps-bus-title">
      <div className="ps-bus-toolbar">
        <div><span><BusFront size={20} /></span><div><small>PASSIO GO!-STYLE LIVE SIMULATION</small><h2 id="ps-bus-title">Live Big Owl Bus · {campus.name}</h2></div></div>
        <p>North-up campus layer · smooth vehicle telemetry · SIM</p>
      </div>

      <div className="ps-bus-route-tabs" role="group" aria-label={`${campus.name} bus routes`}>
        {routeLayers.map(({ route }) => (
          <button
            type="button"
            key={route.id}
            aria-pressed={route.id === selectedLayer.route.id}
            onClick={() => {
              setSelectedRouteId(route.id);
              setSelectedBusId(null);
            }}
          >
            <i style={{ background: route.color }} />
            <span><strong>{route.name}</strong><small>Every {route.headwayMin} min · SIM</small></span>
          </button>
        ))}
      </div>

      <div className="ps-bus-vehicle-picker" role="group" aria-label={`${selectedLayer.route.name} buses`}>
        <span>Vehicles on selected route</span>
        {selectedLayer.route.buses.map((bus) => (
          <button
            type="button"
            key={bus.id}
            aria-pressed={bus.id === selectedBusId}
            onClick={() => setSelectedBusId(bus.id)}
          >
            <BusFront size={14} /> {bus.label}
          </button>
        ))}
      </div>

      <div className="ps-bus-layout">
        <div className="ps-bus-map-shell">
          <svg viewBox="0 0 1000 600" role="img" aria-label={`Animated Big Owl Bus routes over the ${campus.name} map`}>
            <defs>
              <pattern id={`ps-bus-grain-${campus.id}`} width="42" height="42" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="9" r="1" className="ps-satellite-grain" />
                <circle cx="31" cy="25" r=".8" className="ps-satellite-grain" />
              </pattern>
            </defs>
            <rect width="1000" height="600" rx="18" className="ps-map2d-bg" />
            <path d="M55 92L294 50L512 78L747 48L947 115L925 512L720 552L476 524L250 558L70 502Z" className="ps-map2d-campus" />
            <rect width="1000" height="600" rx="18" fill={`url(#ps-bus-grain-${campus.id})`} />
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
            {campus.places.map((place) => {
              const point = projectGeo2d(campus, place.geo);
              const footprint = projectFootprint(place.footprint);
              const selected = place.id === target.id;
              return (
                <g key={place.id} className={selected ? 'ps-map2d-building ps-map2d-building--target' : 'ps-map2d-building'}>
                  <rect x={point.x - footprint.width / 2} y={point.y - footprint.depth / 2} width={footprint.width} height={footprint.depth} rx="4" />
                  <text x={point.x} y={point.y + footprint.depth / 2 + 14} textAnchor="middle">{place.short}</text>
                </g>
              );
            })}
            {routeLayers.map((layer) => (
              <g key={layer.route.id} className={layer.route.id === selectedLayer.route.id ? 'ps-bus-route ps-bus-route--selected' : 'ps-bus-route'}>
                <polyline className="ps-bus-route-glow" points={routePolyline(layer.points)} fill="none" stroke={layer.route.color} />
                <polyline points={routePolyline(layer.points)} fill="none" stroke={layer.route.color} />
                {layer.stops.map(({ stop, point }) => (
                  <g key={stop.id} transform={`translate(${point.x} ${point.y})`} className="ps-bus-stop">
                    <circle r="8" style={{ stroke: layer.route.color }} />
                    {layer.route.id === selectedLayer.route.id && <text y="-14" textAnchor="middle">{stop.name}</text>}
                  </g>
                ))}
                {layer.route.buses.map((bus) => (
                  <g
                    key={bus.id}
                    ref={(element) => { busRefs.current[bus.id] = element; }}
                    className={bus.id === selectedBusId ? 'ps-bus-marker ps-bus-marker--selected' : 'ps-bus-marker'}
                    role="button"
                    tabIndex={0}
                    aria-label={`${bus.label} on ${layer.route.name}`}
                    onClick={() => {
                      setSelectedRouteId(layer.route.id);
                      setSelectedBusId(bus.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      setSelectedRouteId(layer.route.id);
                      setSelectedBusId(bus.id);
                    }}
                  >
                    <rect x="-18" y="-11" width="36" height="22" rx="6" style={{ fill: layer.route.color }} />
                    <path d="M-10-4h20v8h-20z" fill="#0B1017" opacity=".84" />
                    <circle cx="-10" cy="12" r="4" fill="#F8FAFC" />
                    <circle cx="10" cy="12" r="4" fill="#F8FAFC" />
                  </g>
                ))}
              </g>
            ))}
          </svg>
          <div className="ps-bus-map-legend"><span><i /> Moving bus</span><span><i /> Selected route</span><span>requestAnimationFrame · SIM</span></div>
        </div>

        <aside className="ps-bus-detail" aria-live="polite">
          {selectedBus && telemetry ? (
            <>
              <div className="ps-bus-detail__eyebrow">
                <span className="ps-bus-detail__label">LIVE VEHICLE · SIM</span>
                {telemetry.loadPct > 85 && <strong>Pass-Up Risk</strong>}
              </div>
              <h3>{selectedBus.label}</h3>
              <p>{selectedLayer.route.name}</p>
              <div className="ps-bus-load">
                <UsersRound size={18} />
                <span><strong>{telemetry.loadPct}% passenger load</strong><small>{telemetry.loadPct > 85 ? 'Standing room / pass-up possible' : telemetry.loadPct > 70 ? 'Busy' : 'Seats likely available'} · SIM</small></span>
              </div>
              <dl>
                <div><dt><Navigation size={15} /> Status</dt><dd>{telemetry.delayMin ? `Delayed +${telemetry.delayMin} min` : 'On time'}</dd></div>
                <div><dt><MapPin size={15} /> Next stop</dt><dd>{telemetry.nextStop}</dd></div>
                <div><dt><Clock3 size={15} /> Next-stop ETA</dt><dd>{telemetry.etaMin} min</dd></div>
              </dl>
              <a className="ps-passio-link" href="https://kennesawstate.passiogo.com/" target="_blank" rel="noopener noreferrer">Open Official Passio GO! ↗</a>
            </>
          ) : (
            <div className="ps-bus-detail__empty"><BusFront size={37} /><h3>Choose a moving bus</h3><p>Open live-style route, load, status, next-stop ETA, and pass-up risk telemetry.</p></div>
          )}
          <div className="ps-route-stops">
            <span>Route stops</span>
            {selectedLayer.stops.map(({ stop }, index) => <p key={stop.id}><i>{index + 1}</i>{stop.name}</p>)}
          </div>
        </aside>
      </div>
    </section>
  );
}
