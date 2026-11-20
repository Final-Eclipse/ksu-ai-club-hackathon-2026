import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';
import type { CampusAlert, OwlAction } from '../types';

interface CampusIntelligenceProps {
  alerts: readonly CampusAlert[];
  onDismiss: (alertId: string) => void;
  onAction: (action: OwlAction) => void;
}

export function CampusIntelligence({ alerts, onDismiss, onAction }: CampusIntelligenceProps) {
  return (
    <section className="ps-intel-strip" aria-labelledby="ps-intel-title">
      <div className="ps-intel-strip__head">
        <div><span>KSU</span><strong id="ps-intel-title">KSU Campus Intelligence</strong><small>Advisory only · recommendations unchanged · SIM</small></div>
        <span>{alerts.length} active</span>
      </div>
      {alerts.length ? (
        <div className="ps-intel-alerts">
          {alerts.slice(0, 3).map((alert) => {
            const Icon = alert.severity === 'critical' ? ShieldAlert : alert.severity === 'warn' ? AlertTriangle : Info;
            const category = alert.id.startsWith('pass-up')
              ? 'PASS-UP RISK'
              : alert.id.startsWith('campus-jump')
                ? 'CAMPUS JUMP'
                : 'PEAK SURGE';
            return (
              <article key={alert.id} className={`ps-intel-alert ps-intel-alert--${alert.severity}`}>
                <Icon size={16} />
                <div><span className="ps-intel-severity">{category}</span><strong>{alert.title}</strong><p>{alert.body}</p><span className="ps-intel-actions">{alert.actions.map((action) => action.kind === 'openUrl' ? <a key={action.id} href={action.url} target="_blank" rel="noopener noreferrer">{action.label}</a> : <button key={action.id} type="button" onClick={() => onAction(action)}>{action.label}</button>)}</span></div>
                <button type="button" aria-label={`Dismiss ${alert.title}`} onClick={() => onDismiss(alert.id)}><X size={14} /></button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="ps-intel-clear">No active campus intelligence alerts for this arrival window.</p>
      )}
    </section>
  );
}
