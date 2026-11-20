import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CloudRain,
  Database,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  LockKeyhole,
  MapPinned,
  Radio,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { DATA_SOURCES } from '../data/campuses';
import type { ViewId } from '../types';

interface GuideProps {
  reportCount: number;
  classCount: number;
  onNavigate: (view: ViewId) => void;
}

export function Guide({ reportCount, classCount, onNavigate }: GuideProps) {
  return (
    <section className="guide-view page-enter" aria-labelledby="guide-title">
      <div className="guide-hero">
        <div>
          <span className="eyebrow"><BrainCircuit size={15} /> Transparent by design</span>
          <h1 id="guide-title">A forecast you can question.</h1>
          <p>
            OwlPark does not invent real-time space counts. It combines published campus patterns,
            permit rules, decaying community reports, weather, and trip preferences, then exposes
            the reasons behind every ranking.
          </p>
          <div className="guide-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate('plan')}>Try the planner <ArrowRight size={17} /></button>
            <button className="secondary-button" type="button" onClick={() => onNavigate('scanner')}><ScanLine size={17} /> Scan a sign</button>
          </div>
        </div>
        <div className="model-orbit" aria-label="OwlPark model inputs">
          <div className="orbit-core"><Sparkles size={28} /><strong>Best lot</strong><span>for this trip</span></div>
          <span className="orbit-item item-one"><Filter size={17} /> Permit</span>
          <span className="orbit-item item-two"><Gauge size={17} /> Demand</span>
          <span className="orbit-item item-three"><Radio size={17} /> Reports</span>
          <span className="orbit-item item-four"><CloudRain size={17} /> Weather</span>
          <span className="orbit-item item-five"><MapPinned size={17} /> Route</span>
        </div>
      </div>

      <div className="method-section">
        <div className="section-heading">
          <div><span className="step-kicker">The decision pipeline</span><h2>Four understandable steps</h2></div>
          <p>A hard safety constraint comes before any predictive or community signal.</p>
        </div>
        <div className="method-grid">
          <article><span>01</span><Filter size={24} /><h3>Filter</h3><p>Remove lots that do not match the selected permit, campus, or required EV charging.</p><small>Hard constraint</small></article>
          <article><span>02</span><Database size={24} /><h3>Forecast</h3><p>Estimate demand from lot priors, weekday, arrival time, semester phase, and weather.</p><small>Explainable model</small></article>
          <article><span>03</span><Radio size={24} /><h3>Update</h3><p>Blend fresh student observations by age. Every report continuously loses influence.</p><small>Recency weighting</small></article>
          <article><span>04</span><Gauge size={24} /><h3>Rank</h3><p>Score room, route, search time, confidence, and the driver&apos;s chosen priority.</p><small>Personalized result</small></article>
        </div>
      </div>

      <div className="trust-layout">
        <article className="trust-card">
          <span className="eyebrow"><ShieldCheck size={15} /> Responsible defaults</span>
          <h2>Useful without pretending.</h2>
          <ul className="trust-list">
            <li><CheckCircle2 size={18} /><div><strong>Permit rules are filters</strong><span>A high availability estimate can never override an incompatible permit.</span></div></li>
            <li><CheckCircle2 size={18} /><div><strong>Estimates are visibly labeled</strong><span>The interface says “modeled occupancy,” never “live spaces.”</span></div></li>
            <li><CheckCircle2 size={18} /><div><strong>Uncertainty is part of the answer</strong><span>Confidence falls for distant arrival times and rises with fresh observations.</span></div></li>
            <li><CheckCircle2 size={18} /><div><strong>Official sources stay one click away</strong><span>Maps, rules, permit equivalencies, and updates link directly to KSU.</span></div></li>
          </ul>
        </article>

        <article className="trust-card privacy-card">
          <span className="eyebrow"><LockKeyhole size={15} /> Privacy boundary</span>
          <h2>No identity needed.</h2>
          <div className="privacy-metrics">
            <div><strong>0</strong><span>accounts</span></div>
            <div><strong>0</strong><span>plate numbers</span></div>
            <div><strong>0</strong><span>location trails</span></div>
          </div>
          <p>Schedules and prototype crowd reports stay in browser storage. Parking-sign photographs are processed locally by OCR and are not stored by OwlPark.</p>
          <div className="local-activity"><Eye size={17} /><span><strong>On this device:</strong> {reportCount} reports · {classCount} imported classes</span></div>
        </article>
      </div>

      <div className="limitations-card">
        <TriangleAlert size={24} />
        <div>
          <span className="step-kicker">Known limits</span>
          <h2>What production still needs</h2>
          <p>This hackathon version uses modeled lot demand and same-browser community data. A KSU pilot should validate walking routes, connect moderated anonymous reports, calibrate the model with approved occupancy history, add closure alerts, and complete an accessibility review.</p>
        </div>
      </div>

      <div className="sources-section">
        <div className="section-heading">
          <div><span className="step-kicker">Data provenance</span><h2>Primary sources</h2></div>
          <p>Source facts are summarized in the app; linked pages remain authoritative.</p>
        </div>
        <div className="source-grid">
          {DATA_SOURCES.map((source) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>
              <span><strong>{source.label}</strong><small>{source.detail}</small></span>
              <ExternalLink size={17} />
            </a>
          ))}
        </div>
      </div>

      <div className="demo-script">
        <span className="step-kicker">90-second demo path</span>
        <h2>Show the decision changing.</h2>
        <ol>
          <li><span>00:00</span><p>Plan a Tuesday noon arrival at ETC with a Central permit.</p></li>
          <li><span>00:20</span><p>Show the ranked lots and open the explanation behind the winner.</p></li>
          <li><span>00:40</span><p>Add an “almost full” crowd report. Watch the ranking and leave time update.</p></li>
          <li><span>01:00</span><p>Import a class schedule, then convert the next class into a trip.</p></li>
          <li><span>01:15</span><p>Scan the demo sign and show permit-aware reasoning with uncertainty.</p></li>
        </ol>
        <button className="primary-button" type="button" onClick={() => onNavigate('plan')}>Start the demo <ArrowRight size={17} /></button>
      </div>
    </section>
  );
}
