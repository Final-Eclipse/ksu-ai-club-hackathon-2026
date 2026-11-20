import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BusFront,
  CarFront,
  Check,
  Clock3,
  Copy,
  Footprints,
  Gauge,
  MapPin,
  RotateCcw,
  ScanLine,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { KSU_PARKING_URL, PASSIO_GO_URL } from '../data/ksuKnowledge';
import { copyText } from '../engine/clipboard';
import { formatClock } from '../engine/time';
import type { CommuteDecision, CvOverrides } from '../types';
import { StatusBadge } from './StatusBadge';

interface RecommendationListProps {
  decision: CommuteDecision;
  cvOverrides: CvOverrides;
  onViewDeckOnMap: (deckId: string) => void;
  onOpenBusMap: () => void;
  onClearCvOverride: (deckId: string) => void;
}

export function RecommendationList({
  decision,
  cvOverrides,
  onViewDeckOnMap,
  onOpenBusMap,
  onClearCvOverride,
}: RecommendationListProps) {
  const [copied, setCopied] = useState(false);
  const winnerTitle = decision.options.find((option) => option.mode === decision.winner)?.title ?? decision.winner;

  return (
    <section className="ps-arrival ps-arrival--compact" aria-labelledby="ps-arrival-title">
      <div className="ps-decision-banner">
        <div className="ps-decision-banner__icon"><Sparkles size={22} /></div>
        <div><span>AI Decision Engine → {winnerTitle}</span><h2 id="ps-arrival-title">{decision.explanation}</h2>{decision.fallback && <small><TriangleAlert size={13} /> Fallback rule: deck &gt; 95% or rain/traffic</small>}</div>
        <div className="ps-decision-banner__target"><span>Target</span><strong>{decision.targetName}</strong></div>
      </div>

      <div className="ps-option-grid">
        {decision.options.map((option) => {
          const isWinner = option.mode === decision.winner;
          const ModeIcon = option.mode === 'drive' ? CarFront : option.mode === 'uber' ? MapPin : BusFront;
          const deckOption = option.deck;
          const deckOverrides = deckOption ? cvOverrides[deckOption.deck.id] : undefined;
          const overrideCount = deckOverrides ? Object.values(deckOverrides).filter(Boolean).length : 0;
          const uberTrip = option.uber?.tripDetails;
          return (
            <article key={`${option.mode}-${decision.winner}-${decision.fallback ?? 'normal'}`} className={`ps-option-card ps-option-card--static ${isWinner ? 'ps-option-card--winner ps-pop' : ''} ${!option.eligible ? 'ps-option-card--ineligible' : ''}`}>
              {isWinner && <span className="ps-ai-ribbon"><Sparkles size={12} /> AI PICK</span>}
              {!option.eligible && <span className="ps-fallback-ribbon">Fallback: {decision.fallback === 'deckFull' ? 'deck > 95%' : 'rain/traffic'}</span>}

              <div className="ps-option-card__content">
                <span className="ps-option-card__heading"><span className="ps-mode-icon"><ModeIcon size={20} /></span><span><small>{option.mode === 'drive' ? 'Personal vehicle' : option.mode === 'uber' ? 'Direct curb access' : 'Campus transit'}</small><strong>{option.title}</strong></span>{isWinner && <Check size={18} />}</span>
                <span className="ps-option-time"><strong>{option.totalMin}</strong><span>min total</span><small><Clock3 size={12} /> Arrive {formatClock(option.arriveMin)} · {option.slackMin} min slack</small></span>

                {deckOption && <span className="ps-mode-detail"><span className="ps-detail-topline"><span><strong>{deckOption.deck.name}</strong><small>{deckOption.deck.levels} {deckOption.deck.levels === 1 ? 'level' : 'levels'} · {deckOption.deck.capacity.toLocaleString()} spaces</small></span><StatusBadge status={deckOption.reading.status} occupancy={deckOption.reading.occupancy} /></span><span className="ps-camera-reading"><Gauge size={14} /> Predicted {Math.round(deckOption.reading.predictedOccupancy * 100)}% · CV cam: {deckOption.reading.open} open (best L{deckOption.reading.bestLevel}) · {Math.round(deckOption.reading.cvConfidence * 100)}% conf</span>{overrideCount > 0 && <span className="ps-cv-override-chip"><ScanLine size={13} /> Overridden by CV · {overrideCount} {overrideCount === 1 ? 'level' : 'levels'}</span>}<span className="ps-detail-line"><Footprints size={14} /> Walk {option.walkMin} min to building</span></span>}

                {option.uber && option.fareUsd && uberTrip && <span className="ps-mode-detail"><span className="ps-detail-topline"><span><strong>${option.fareUsd.low}–${option.fareUsd.high} <i>(SIM)</i></strong><small>Estimated one-way fare</small></span><span className={`ps-congestion ps-congestion--${option.uber.pin.congestion}`}>{option.uber.pin.congestion} curb flow</span></span><span className="ps-uber-summary">Pickup: {uberTrip.pickupGeo ? uberTrip.pickupLabel : 'your current location'} <b>→</b> Drop-off: {uberTrip.dropoffLabel}, {uberTrip.dropoffAddress}</span><span className="ps-detail-line"><Footprints size={14} /> {uberTrip.distanceMi} mi · {uberTrip.rideMin} min ride · {option.walkMin} min walk</span></span>}

                {option.shuttle && <span className="ps-mode-detail"><span className="ps-detail-topline"><span><strong>$0 · free shuttle lot</strong><small>{option.shuttle.route.name}</small></span><span className={`ps-load-pill ${option.shuttle.loadPct >= 95 ? 'ps-load-pill--full' : ''}`}>{option.shuttle.loadPct}% load · SIM</span></span>{option.shuttle.loadPct > 85 && <span className={option.shuttle.loadPct >= 95 ? 'ps-pass-risk ps-pass-risk--critical' : 'ps-pass-risk'}>Pass-up risk · {option.shuttle.loadPct >= 95 ? 'critical' : 'high'}</span>}<span className="ps-shuttle-flow">{option.shuttle.route.remoteLot} <b>→</b> every {option.shuttle.route.headwayMin} min <b>→</b> {option.shuttle.route.stopName} <b>→</b> walk {option.walkMin} min</span></span>}

                <span className="ps-leg-list">{option.legs.map((leg) => <span key={leg.label}><i /><span>{leg.label}</span><strong>{leg.minutes}m</strong></span>)}</span>
              </div>

              {deckOption && <div className="ps-drive-actions">{option.eligible && deckOption.reading.open > 0 ? <button type="button" onClick={() => onViewDeckOnMap(deckOption.deck.id)}>View Open Spots on Map <ArrowRight size={15} /></button> : <span className="ps-no-spots">No open spots</span>}{overrideCount > 0 && <button type="button" className="ps-clear-cv" onClick={() => onClearCvOverride(deckOption.deck.id)}><RotateCcw size={13} /> Clear CV override</button>}<a className="ps-card-footnote" href={KSU_PARKING_URL} target="_blank" rel="noopener noreferrer">Permit cost excluded ↗</a></div>}

              {uberTrip && <div className="ps-uber-actions"><button type="button" onClick={() => { copyText(uberTrip.deepLink).then(setCopied).catch(() => setCopied(false)); }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Link'}</button><a className="ps-uber-link" href={uberTrip.deepLink} target="_blank" rel="noopener noreferrer">Open in Uber <ArrowUpRight size={15} /></a></div>}

              {option.shuttle && <div className="ps-bus-card-actions"><button type="button" onClick={onOpenBusMap}><BusFront size={14} /> Go to Bus Map</button><a href={PASSIO_GO_URL} target="_blank" rel="noopener noreferrer">Passio GO! ↗</a></div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
