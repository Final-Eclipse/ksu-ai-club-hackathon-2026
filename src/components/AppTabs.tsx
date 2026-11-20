import { BusFront, Map, Shirt, Utensils } from 'lucide-react';
import { WORKSPACE_TABS } from '../data/workspace';
import type { WorkspaceTabId } from '../types';

interface AppTabsProps {
  activeTab: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
}

export function AppTabs({ activeTab, onChange }: AppTabsProps) {
  return (
    <nav className="ps-workspace-tabs" aria-label="OwlFlow workspace">
      <div role="tablist" aria-label="Campus mobility tools">
        {WORKSPACE_TABS.map((tab, index) => {
          const Icon = tab.id === 'commute' ? BusFront : tab.id === 'dining' ? Utensils : tab.id === 'laundry' ? Shirt : Map;
          return (
            <button
              type="button"
              role="tab"
              id={`ps-tab-${tab.id}`}
              key={tab.id}
              aria-selected={activeTab === tab.id}
              aria-controls={`ps-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                const offset = event.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (index + offset + WORKSPACE_TABS.length) % WORKSPACE_TABS.length;
                const next = WORKSPACE_TABS[nextIndex];
                if (!next) return;
                onChange(next.id);
                document.getElementById(`ps-tab-${next.id}`)?.focus();
              }}
            >
              <span>{tab.number}</span>
              <Icon size={18} />
              <strong>{tab.label}</strong>
              <small>{tab.shortLabel}</small>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
