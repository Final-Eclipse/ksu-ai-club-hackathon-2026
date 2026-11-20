import { Activity, Camera, Radio, ShieldCheck, UsersRound } from 'lucide-react';
import type { Campus, DeckReading, Scenario } from '../types';
import { StatusBadge } from './StatusBadge';

interface CommunityReportsProps {
  campus: Campus;
  readings: DeckReading[];
  scenario: Scenario;
}

export function CommunityReports({ campus, readings, scenario }: CommunityReportsProps) {
  const totalOpen = readings.reduce((total, reading) => total + reading.open, 0);
  const totalCapacity = campus.decks.reduce((total, deck) => total + deck.capacity, 0);

  return (
    <section className="ps-pulse" aria-labelledby="ps-pulse-title">
      <div className="ps-section-label"><span>03</span> Live Campus Pulse</div>
      <div className="ps-section-heading">
        <div>
          <p className="ps-kicker">Camera + crowd simulation</p>
          <h2 id="ps-pulse-title">Every bay becomes a flow signal.</h2>
        </div>
        <p>All values shown here are seeded simulations for the hackathon demo—not claims of current KSU occupancy.</p>
      </div>

      <div className="ps-pulse-summary">
        <div><Camera size={20} /><span><strong>{readings.length}</strong> simulated camera nodes</span></div>
        <div><Activity size={20} /><span><strong>{totalOpen.toLocaleString()}</strong> modeled open of {totalCapacity.toLocaleString()}</span></div>
        <div><UsersRound size={20} /><span><strong>{Math.round(scenario.crowdMult * 100)}%</strong> pedestrian flow multiplier</span></div>
        <div><ShieldCheck size={20} /><span><strong>Seeded</strong> reproducible demo frame</span></div>
      </div>

      <div className="ps-sensor-grid">
        {campus.decks.map((deck) => {
          const reading = readings.find((candidate) => candidate.deckId === deck.id);
          if (!reading) return null;
          const bestLevel = reading.levels.find((level) => level.level === reading.bestLevel);
          return (
            <article key={deck.id} className="ps-sensor-card">
              <div className="ps-sensor-card__head">
                <div><Radio size={16} /><span><strong>{deck.short} sensor</strong><small>CV-{deck.id.toUpperCase()}</small></span></div>
                <StatusBadge status={reading.status} occupancy={reading.occupancy} />
              </div>
              <div className="ps-sensor-card__metric">
                <strong>{reading.open}</strong>
                <span>open spaces</span>
                <small>Best: Level {reading.bestLevel} with {bestLevel?.open ?? 0} open</small>
              </div>
              <div className="ps-bay-grid">
                {reading.levels.flatMap((level) =>
                  level.bays.map((bay) => (
                    <div key={bay.id} className={`ps-bay ps-bay--${bay.status}`}>
                      <span>L{level.level}{bay.label}</span>
                      <strong>{bay.open}</strong>
                      <small>open</small>
                    </div>
                  )),
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="ps-pulse-note">
        <Radio size={17} />
        <p><strong>Production bridge:</strong> replace seeded bay frames with privacy-preserving aggregate counts from approved KSU cameras, then calibrate predictions against anonymous arrival patterns.</p>
      </div>
    </section>
  );
}
