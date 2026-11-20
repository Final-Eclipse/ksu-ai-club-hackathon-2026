import { useState, type ComponentType } from 'react';
import {
  CalendarDays,
  CircleHelp,
  CloudRain,
  Contrast,
  Map,
  Menu,
  Navigation,
  Radio,
  ScanLine,
  SunMedium,
  X,
} from 'lucide-react';
import type { CampusDefinition, ViewId, WeatherSnapshot } from '../types';

interface AppHeaderProps {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  campus: CampusDefinition;
  weather?: WeatherSnapshot;
  weatherLoading: boolean;
  activeReports: number;
  highContrast: boolean;
  onToggleContrast: () => void;
}

const NAV_ITEMS: Array<{ id: ViewId; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'plan', label: 'Plan', icon: Navigation },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'reports', label: 'Live reports', icon: Radio },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'scanner', label: 'Scan a sign', icon: ScanLine },
  { id: 'guide', label: 'How it works', icon: CircleHelp },
];

export function AppHeader({
  activeView,
  onViewChange,
  campus,
  weather,
  weatherLoading,
  activeReports,
  highContrast,
  onToggleContrast,
}: AppHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (view: ViewId) => {
    onViewChange(view);
    setMobileOpen(false);
  };

  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={() => navigate('plan')} aria-label="Open OwlPark planner">
        <span className="brand-mark" aria-hidden="true">P</span>
        <span>
          <strong>OwlPark</strong>
          <small>Parking, predicted</small>
        </span>
      </button>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={activeView === id ? 'nav-button active' : 'nav-button'}
            onClick={() => navigate(id)}
            aria-label={label}
            aria-current={activeView === id ? 'page' : undefined}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="header-status">
        <div className="status-item weather-status" title="Weather supplied by Open-Meteo">
          {weather?.precipitationProbability && weather.precipitationProbability >= 40 ? (
            <CloudRain size={17} />
          ) : (
            <SunMedium size={17} />
          )}
          <span>
            {weatherLoading ? 'Loading weather' : weather ? `${weather.temperatureF}° · ${weather.precipitationProbability}% rain` : 'Weather offline'}
          </span>
        </div>
        <div className="status-item signal-status">
          <span className="live-dot" aria-hidden="true" />
          <span>{activeReports} fresh {activeReports === 1 ? 'report' : 'reports'}</span>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleContrast}
          aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast`}
          aria-pressed={highContrast}
        >
          <Contrast size={19} />
        </button>
        <button
          className="menu-button"
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
          <div className="mobile-nav-context">
            <span>Planning for</span>
            <strong>{campus.name}</strong>
          </div>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={activeView === id ? 'nav-button active' : 'nav-button'}
              onClick={() => navigate(id)}
              aria-label={label}
            aria-current={activeView === id ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
