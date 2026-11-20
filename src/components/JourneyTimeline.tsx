import { BookOpen, Check, MapPin, Shirt, Sparkles, Utensils } from 'lucide-react';
import { formatClock } from '../engine/time';
import type { JourneyPlan } from '../types';

interface JourneyTimelineProps {
  journey: JourneyPlan;
  slackMin: number;
  diningEnabled: boolean;
  laundryEnabled: boolean;
  onDiningChange: (enabled: boolean) => void;
  onLaundryChange: (enabled: boolean) => void;
}

export function JourneyTimeline({
  journey,
  slackMin,
  diningEnabled,
  laundryEnabled,
  onDiningChange,
  onLaundryChange,
}: JourneyTimelineProps) {
  return (
    <section className="ps-flow-stepper" aria-labelledby="ps-flow-title">
      <div className="ps-flow-stepper__head">
        <div><span>Campus Flow</span><strong id="ps-flow-title">After-arrival steps</strong></div>
        <span className={slackMin < 5 ? 'ps-slack ps-slack--tight' : 'ps-slack'}>{slackMin} min slack</span>
        <div className="ps-pitstop-toggles" role="group" aria-label="Journey pit stops">
          <button type="button" aria-pressed={laundryEnabled} onClick={() => onLaundryChange(!laundryEnabled)}><Shirt size={14} /> Laundry {laundryEnabled && <Check size={12} />}</button>
          <button type="button" aria-pressed={diningEnabled} onClick={() => onDiningChange(!diningEnabled)}><Utensils size={14} /> Pit Stop {diningEnabled && <Check size={12} />}</button>
        </div>
      </div>

      <div className="ps-flow-steps">
        {journey.stops.map((stop, index) => {
          const Icon = stop.kind === 'dining' ? Utensils : stop.kind === 'laundry' ? Shirt : stop.kind === 'class' ? BookOpen : MapPin;
          const label = stop.kind === 'arrival'
            ? 'Campus Arrival'
            : stop.kind === 'laundry'
              ? 'Start Washer'
              : stop.kind === 'dining'
                ? stop.startMin >= 630 && stop.startMin <= 870 ? 'Lunch' : 'Pit Stop'
                : `Class · ${stop.label}`;
          return (
            <div className={`ps-flow-step ps-flow-step--${stop.kind}`} key={stop.id}>
              <span><Icon size={15} /></span>
              <div><strong>{label}</strong><time>{formatClock(stop.startMin)}</time><small>{stop.detail}</small></div>
              {index < journey.stops.length - 1 && <i aria-hidden="true">→</i>}
            </div>
          );
        })}
      </div>
      <p><Sparkles size={13} /> {journey.explanation}</p>
    </section>
  );
}
