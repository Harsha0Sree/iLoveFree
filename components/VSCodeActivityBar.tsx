'use client';

import React from 'react';
import {
  Files,
  FileText,
  History,
  AlertTriangle,
  Settings,
  LayoutGrid,
} from 'lucide-react';

export type ActivityTab = 'explorer' | 'source' | 'projects' | 'checkpoints' | 'audits';

interface VSCodeActivityBarProps {
  activeTab: ActivityTab;
  sidebarOpen: boolean;
  onSelectTab: (tab: ActivityTab) => void;
  errorCount: number;
  warningCount: number;
  checkpointCount: number;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onToggleProjectsView: () => void;
}

export const VSCodeActivityBar: React.FC<VSCodeActivityBarProps> = ({
  activeTab,
  sidebarOpen,
  onSelectTab,
  errorCount,
  warningCount,
  checkpointCount,
  onOpenSettings,
  onOpenHelp,
  onToggleProjectsView,
}) => {
  const topButtons = [
    {
      id: 'projects' as ActivityTab,
      label: 'Home / Projects',
      icon: LayoutGrid,
      badge: null,
      customAction: onToggleProjectsView,
    },
    {
      id: 'explorer' as ActivityTab,
      label: 'Explorer (Project Files)',
      icon: Files,
      badge: null,
      customAction: undefined,
    },
    {
      id: 'source' as ActivityTab,
      label: 'Source Transcript',
      icon: FileText,
      badge: null,
      customAction: undefined,
    },
    {
      id: 'checkpoints' as ActivityTab,
      label: 'Version History & Saves',
      icon: History,
      badge: checkpointCount > 0 ? checkpointCount : null,
      customAction: undefined,
    },
    {
      id: 'audits' as ActivityTab,
      label: 'Diagnostics & Audits',
      icon: AlertTriangle,
      badge: errorCount > 0 ? errorCount : warningCount > 0 ? warningCount : null,
      badgeColor: errorCount > 0 ? 'bg-white text-black' : 'bg-neutral-800 text-white',
      customAction: undefined,
    },
  ];

  return (
    <aside className="w-12 h-full bg-[#121216] border border-[#24242c] rounded-xl flex flex-col justify-between items-center py-2 shrink-0 select-none z-20 shadow-xs">
      {/* Top Activity Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {topButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id && sidebarOpen;

          return (
            <button
              key={btn.id}
              onClick={() => {
                if (btn.customAction) {
                  btn.customAction();
                } else {
                  onSelectTab(btn.id);
                }
              }}
              className={`relative w-full h-10 flex items-center justify-center transition-colors group cursor-pointer rounded-lg ${
                isActive
                  ? 'text-white bg-white/10'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={btn.label}
            >
              {/* VS Code active left bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[2.5px] bg-[#3b82f6] rounded-r" />
              )}
              <Icon className="w-4 h-4" />

              {/* Badge */}
              {btn.badge !== null && (
                <span
                  className={`absolute top-1 right-1 min-w-[14px] h-[14px] text-[9px] font-mono font-bold flex items-center justify-center px-0.5 rounded-full border border-black ${
                    btn.badgeColor || 'bg-white text-black'
                  }`}
                >
                  {btn.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Activity Icons */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        <button
          onClick={onOpenSettings}
          className="w-full h-10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          title="Preferences & Settings (Ctrl+,)"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
