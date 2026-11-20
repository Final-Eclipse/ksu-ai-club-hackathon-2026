import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, ExternalLink, Flame, Leaf, MapPin, Sparkles, Utensils } from 'lucide-react';
import { DINING_HALLS, NUTRISLICE_MENU_URL } from '../data/dining';
import { menuMatches, readDiningHall } from '../engine/dining';
import type {
  DietaryTag,
  DiningHall,
  PitStopPlan,
  Scenario,
} from '../types';

interface DiningMenuProps {
  hall: DiningHall;
  scenario: Scenario;
  minute: number;
  selectedTags: DietaryTag[];
  pitStop?: PitStopPlan;
  onTagsChange: (tags: DietaryTag[]) => void;
}

export function DiningMenu({
  hall,
  scenario,
  minute,
  selectedTags,
  pitStop,
  onTagsChange,
}: DiningMenuProps) {
  const [selectedHallId, setSelectedHallId] = useState(hall.id);

  useEffect(() => setSelectedHallId(hall.id), [hall.id]);

  const displayedHall = DINING_HALLS.find((candidate) => candidate.id === selectedHallId) ?? hall;
  const readings = useMemo(
    () => readDiningHall(displayedHall, minute, scenario),
    [displayedHall, minute, scenario],
  );
  const displayedPitStop = pitStop?.hallId === displayedHall.id ? pitStop : undefined;

  return (
    <section className="ps-dining" aria-labelledby="ps-dining-title">
      <div className="ps-dining-topbar">
        <div className="ps-dining-switcher" role="group" aria-label="Dining hall">
          {DINING_HALLS.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              aria-pressed={displayedHall.id === candidate.id}
              onClick={() => setSelectedHallId(candidate.id)}
            >
              <MapPin size={14} /> {candidate.short}
            </button>
          ))}
        </div>
        <a href={NUTRISLICE_MENU_URL} target="_blank" rel="noopener noreferrer">
          View Full Daily Menu on Nutrislice <ExternalLink size={15} />
        </a>
      </div>

      <div className="ps-tab-hero ps-dining-hero">
        <div>
          <p className="ps-kicker">Authentic KSU dining stations · queue data SIM</p>
          <h1 id="ps-dining-title">Eat for the schedule, not the line.</h1>
          <p>Browse signature station items, dietary matches, calorie counts, and simulated queue pressure without changing your schedule campus.</p>
        </div>
        <div className="ps-dining-hall-badge"><Utensils size={21} /><span><small>Viewing dining hall</small><strong>{displayedHall.name}</strong></span></div>
      </div>

      <div className="ps-dietary-filter">
        <span><Leaf size={16} /> Dietary filters</span>
        <div role="group" aria-label="Dietary filters">
          {(['vegetarian', 'vegan', 'halal', 'gluten-free'] as const).map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                aria-pressed={selected}
                onClick={() => onTagsChange(selected ? selectedTags.filter((candidate) => candidate !== tag) : [...selectedTags, tag])}
              >
                {selected && <Check size={13} />}{tag}
              </button>
            );
          })}
        </div>
      </div>

      {displayedPitStop && (
        <article className="ps-meal-pick">
          <span className="ps-meal-pick__icon"><Sparkles size={21} /></span>
          <div><small>AI PIT STOP</small><h2>{displayedPitStop.menuItem.name}</h2><p>{displayedPitStop.stationName} · {displayedPitStop.queueMin} min queue · {displayedPitStop.menuItem.calories} calories</p></div>
          <span className={displayedPitStop.fitsBeforeClass ? 'ps-fit-chip' : 'ps-fit-chip ps-fit-chip--warn'}>{displayedPitStop.fitsBeforeClass ? 'Fits before class' : 'Tight before class'}</span>
        </article>
      )}

      <div className="ps-station-grid ps-station-grid--authentic">
        {displayedHall.stations.map((station) => {
          const reading = readings.find((candidate) => candidate.stationId === station.id);
          const items = station.menuItems.filter((item) => menuMatches(item, selectedTags));
          return (
            <article className="ps-station-card" key={station.id}>
              <div className="ps-station-card__head">
                <div><small>KSU STATION · LIVE QUEUE SIM</small><h2>{station.name}</h2></div>
                <span className="ps-wait-badge"><Clock3 size={13} /> {reading?.queueMin ?? 0} min</span>
              </div>
              <div className="ps-crowd-meter">
                <span><strong>Crowd load · SIM</strong><small>{reading?.crowdPct ?? 0}%</small></span>
                <i><b style={{ width: `${reading?.crowdPct ?? 0}%` }} /></i>
              </div>
              <div className="ps-menu-list">
                <span>Signature items</span>
                {items.length ? items.map((item) => (
                  <div key={item.name}>
                    <span><strong>{item.name}</strong><small>{item.tags.length ? item.tags.join(' · ') : 'standard menu'}</small></span>
                    <span><Flame size={12} /> {item.calories}</span>
                  </div>
                )) : (
                  <p>No item at this station matches every selected filter.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="ps-sim-disclosure">Station and signature-item names are shown for the OwlFlow demo. Queue and crowd values are SIM. Check Nutrislice and KSU Dining for the current daily menu, ingredients, and allergen details.</p>
    </section>
  );
}
