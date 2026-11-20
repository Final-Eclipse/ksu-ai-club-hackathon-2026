import { CloudRain, Radio, TriangleAlert } from 'lucide-react';
import { SCENARIOS } from '../data/scenarios';
import type { ScenarioId } from '../types';

interface DemoBarProps {
  scenarioId: ScenarioId;
  onChange: (scenarioId: ScenarioId) => void;
}

export function DemoBar({ scenarioId, onChange }: DemoBarProps) {
  return (
    <aside className="ps-demo-bar ps-demobar--docked" aria-label="Live demonstration scenarios">
      <div className="ps-demo-bar__inner">
        <span className="ps-live-label"><Radio size={14} /> LIVE DEMO</span>
        <span className="ps-demo-bar__hint">Trigger the AI decision flip:</span>
        <div className="ps-scenario-tabs" role="group" aria-label="Scenario">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={scenario.id === scenarioId}
              onClick={() => onChange(scenario.id)}
            >
              {scenario.id === 'decksFull' && <TriangleAlert size={14} />}
              {scenario.id === 'rainSurge' && <CloudRain size={14} />}
              {scenario.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
