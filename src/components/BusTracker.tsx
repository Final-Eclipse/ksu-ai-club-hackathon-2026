import { useEffect, useMemo, useRef, useState } from 'react';
import { BusFront, Clock3, MapPin, Navigation, UsersRound, X } from 'lucide-react';
import { BUS_ROUTES } from '../data/busRoutes';
import { busPoint, busTelemetry, routePolyline } from '../engine/bus';
import { useNowSeconds } from '../hooks/useNowSeconds';
import type {
  BusTrackerRoute,
  BusTrackerStop,
  Campus,
  Scenario,
} from '../types';
import type { BusPathPoint } from '../engine/bus';

interface BusTrackerProps {
  scenario: Scenario;
  campus: Campus;
  minute: number;
}

interface SchematicStop {
  stop: BusTrackerStop;
  point: BusPathPoint;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'end';
}

interface SchematicRoute {
  route: BusTrackerRoute;
  points: BusPathPoint[];
  stops: SchematicStop[];
}

interface RouteGeometry {
  points: readonly BusPathPoint[];
  stopPoints: Record<string, BusPathPoint>;
}

const CORE_LABEL_STOP_IDS = new Set([
  'express-commons',
  'chastain-rec',
  'west-shuttle-lot',
  'mloop-wilson',
  'mloop-hornet',
]);

const KENNESAW_GEOMETRY: Record<string, RouteGeometry> = {
  'ksu-express': {
    points: [
      { x: 145, y: 520 }, { x: 215, y: 450 }, { x: 215, y: 365 },
      { x: 305, y: 275 }, { x: 430, y: 275 }, { x: 520, y: 185 }, { x: 675, y: 185 },
    ],
    stopPoints: {
      'express-west': { x: 145, y: 520 },
      'express-center': { x: 305, y: 275 },
      'express-commons': { x: 520, y: 185 },
    },
  },
  'chastain-loop': {
    points: [
      { x: 150, y: 130 }, { x: 265, y: 130 }, { x: 345, y: 210 },
      { x: 520, y: 210 }, { x: 575, y: 155 }, { x: 680, y: 155 },
      { x: 575, y: 155 }, { x: 520, y: 210 }, { x: 345, y: 210 }, { x: 265, y: 130 }, { x: 150, y: 130 },
    ],
    stopPoints: {
      'chastain-point': { x: 150, y: 130 },
      'chastain-rec': { x: 265, y: 130 },
      'chastain-center': { x: 345, y: 210 },
      'chastain-commons': { x: 575, y: 155 },
    },
  },
  'west-shuttle': {
    points: [
      { x: 145, y: 520 }, { x: 145, y: 425 }, { x: 85, y: 365 },
      { x: 145, y: 305 }, { x: 145, y: 220 }, { x: 235, y: 130 },
      { x: 400, y: 130 }, { x: 455, y: 185 }, { x: 575, y: 185 },
    ],
    stopPoints: {
      'west-deck': { x: 145, y: 520 },
      'west-shuttle-lot': { x: 85, y: 365 },
      'west-north': { x: 235, y: 130 },
      'west-owl': { x: 575, y: 185 },
    },
  },
};

const MARIETTA_GEOMETRY: Record<string, RouteGeometry> = {
  'ksu-express': {
    points: [
      { x: 150, y: 140 }, { x: 245, y: 140 }, { x: 325, y: 220 },
      { x: 455, y: 220 }, { x: 540, y: 305 }, { x: 650, y: 305 },
      { x: 735, y: 390 }, { x: 735, y: 510 },
    ],
    stopPoints: {
      'express-wilson': { x: 150, y: 140 },
      'express-mwest': { x: 735, y: 510 },
    },
  },
  'marietta-loop': {
    points: [
      { x: 150, y: 140 }, { x: 325, y: 140 }, { x: 405, y: 220 },
      { x: 575, y: 220 }, { x: 690, y: 335 }, { x: 690, y: 470 },
      { x: 620, y: 540 }, { x: 445, y: 540 }, { x: 360, y: 455 },
      { x: 230, y: 455 }, { x: 150, y: 375 }, { x: 150, y: 140 },
    ],
    stopPoints: {
      'mloop-wilson': { x: 150, y: 140 },
      'mloop-johnson': { x: 405, y: 220 },
      'mloop-stingers': { x: 360, y: 455 },
      'mloop-hornet': { x: 620, y: 540 },
      'mloop-west': { x: 690, y: 470 },
    },
  },
};

function stopLabelPosition(point: BusPathPoint): Pick<SchematicStop, 'labelX' | 'labelY' | 'anchor'> {
  const anchor = point.x > 610 ? 'end' : 'start';
  return {
    labelX: point.x + (anchor === 'end' ? -14 : 14),
    labelY: point.y - 12,
    anchor,
  };
}

function createSchematicRoutes(campus: Campus): SchematicRoute[] {
  const geometries = campus.id === 'kennesaw' ? KENNESAW_GEOMETRY : MARIETTA_GEOMETRY;
  return BUS_ROUTES.flatMap((route) => {
    const geometry = geometries[route.id];
    if (!geometry) return [];
    const stops = route.stops
      .filter((stop) => stop.campusId === campus.id)
      .flatMap((stop) => {
        const point = geometry.stopPoints[stop.id];
        if (!point) return [];
        return [{ stop, point, ...stopLabelPosition(point) }];
      });
    return [{ route, points: [...geometry.points], stops }];
  });
}

export function BusTracker({ scenario, campus, minute }: BusTrackerProps) {
  const routeLayers = useMemo(() => createSchematicRoutes(campus), [campus]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const busRefs = useRef<Record<string, SVGGElement | null>>({});
  const animationRef = useRef<number | null>(null);
  const nowSeconds = useNowSeconds();
  const selectedLayer = selectedBusId
    ? routeLayers.find((layer) => layer.route.buses.some((bus) => bus.id === selectedBusId))
    : undefined;
  const selectedBus = selectedBusId && selectedLayer
    ? selectedLayer.route.buses.find((bus) => bus.id === selectedBusId)
    : undefined;
  const telemetry = useMemo(
    () => selectedLayer && selectedBus
      ? busTelemetry(selectedLayer.route, selectedBus, scenario, nowSeconds, campus.id, minute)
      : null,
    [campus.id, minute, nowSeconds, scenario, selectedBus, selectedLayer],
  );

  useEffect(() => {
    setSelectedBusId(null);
  }, [campus.id]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update = (elapsedMs: number) => {
      for (const layer of routeLayers) {
        for (const bus of layer.route.buses) {
          const element = busRefs.current[bus.id];
          if (!element) continue;
          const point = busPoint(layer.points, bus, reducedMotion ? 0 : elapsedMs);
          element.setAttribute('transform', `translate(${point.x} ${point.y})`);
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
    <div className="ps-p6-bus-layer">
      <svg className="ps-p6-transit-map" viewBox="0 0 1000 625" role="img" aria-label={`Animated MARTA-style Big Owl Bus routes at ${campus.name}`}>
        {routeLayers.map((layer) => (
          <g key={layer.route.id} className="ps-p6-transit-route">
            <polyline className="ps-p6-route-casing" points={routePolyline(layer.points)} />
            <polyline points={routePolyline(layer.points)} fill="none" stroke={layer.route.color} />
            {layer.stops.map(({ stop, point, labelX, labelY, anchor }) => (
              <g key={stop.id} className="ps-p6-transit-stop">
                <circle cx={point.x} cy={point.y} r="8" />
                {CORE_LABEL_STOP_IDS.has(stop.id) && <text x={labelX} y={labelY} textAnchor={anchor}>{stop.name}</text>}
              </g>
            ))}
            {layer.route.buses.map((bus) => (
              <g
                key={bus.id}
                ref={(element) => { busRefs.current[bus.id] = element; }}
                className={bus.id === selectedBusId ? 'ps-p6-bus-pill ps-p6-bus-pill--selected' : 'ps-p6-bus-pill'}
                role="button"
                tabIndex={0}
                aria-label={`${bus.label} on ${layer.route.name}`}
                onClick={() => setSelectedBusId(bus.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  setSelectedBusId(bus.id);
                }}
              >
                <rect x="-24" y="-13" width="48" height="26" rx="13" style={{ fill: layer.route.color }} />
                <BusFront x={-8} y={-8} size={16} />
              </g>
            ))}
          </g>
        ))}
      </svg>

      {selectedLayer && selectedBus && telemetry && (
        <aside className="ps-p6-bus-card" aria-live="polite">
          <button type="button" aria-label="Close bus details" onClick={() => setSelectedBusId(null)}><X size={15} /></button>
          <div className="ps-p6-bus-card__eyebrow">
            <span>LIVE VEHICLE · SIM</span>
            {telemetry.loadPct > 85 && <strong>Pass-Up Risk</strong>}
          </div>
          <h2>{selectedBus.label}</h2>
          <p>{selectedLayer.route.name}</p>
          <div className="ps-p6-bus-load">
            <UsersRound size={18} />
            <span><strong>{telemetry.loadPct}% load</strong><small>{telemetry.loadPct > 85 ? 'Standing room / pass-up possible' : 'Boarding available'}</small></span>
          </div>
          <dl>
            <div><dt><Navigation size={14} /> Status</dt><dd>{telemetry.delayMin ? `+${telemetry.delayMin} min` : 'On time'}</dd></div>
            <div><dt><MapPin size={14} /> Next stop</dt><dd>{telemetry.nextStop}</dd></div>
            <div><dt><Clock3 size={14} /> ETA</dt><dd>{telemetry.etaMin} min</dd></div>
          </dl>
          <a href="https://kennesawstate.passiogo.com/" target="_blank" rel="noopener noreferrer">Open Passio GO! ↗</a>
        </aside>
      )}
    </div>
  );
}
