'use client';

import React, { useState } from 'react';
import {
  Menu,
  Network,
  Layers,
  Settings2,
  HelpCircle,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { ParserOptions } from '@/lib/parser';

interface ToolsMenuProps {
  onOpenTree: () => void;
  onOpenManifest: () => void;
  onOpenHelp: () => void;
  onClear: () => void;
  options: ParserOptions;
  onChangeOptions: (opts: ParserOptions) => void;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({
  onOpenTree,
  onOpenManifest,
  onOpenHelp,
  onClear,
  options,
  onChangeOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsSubmenu, setShowSettingsSubmenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors uppercase cursor-pointer"
        title="Tools & Secondary Overlays"
      >
        <Menu className="w-3.5 h-3.5 text-white" />
        <span className="hidden sm:inline">Tools</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 bg-black border border-white shadow-2xl z-50 p-1 font-mono text-xs">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 px-2 py-1 border-b border-neutral-900 font-bold">
              Workspace Tools & Views
            </div>

            <button
              onClick={() => {
                onOpenTree();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-900 text-white flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-neutral-400" />
                <span>Structure Tree Matcher</span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
            </button>

            <button
              onClick={() => {
                onOpenManifest();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-900 text-white flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Code Blocks Manifest</span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
            </button>

            <div className="border-t border-neutral-900 my-1" />

            {/* Parser Settings Submenu */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsSubmenu(!showSettingsSubmenu)}
                className="w-full text-left px-2 py-1.5 hover:bg-neutral-900 text-white flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Parser Heuristic Rules</span>
                </div>
                <span className="text-[10px] text-neutral-500">{showSettingsSubmenu ? '▲' : '▼'}</span>
              </button>

              {showSettingsSubmenu && (
                <div className="bg-neutral-950 border border-neutral-800 p-2 my-1 space-y-2 text-[11px]">
                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.stripCommonRoot ?? true}
                      onChange={(e) =>
                        onChangeOptions({ ...options, stripCommonRoot: e.target.checked })
                      }
                      className="accent-white"
                    />
                    <span>Strip root directory prefix</span>
                  </label>

                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.detectTruncations ?? true}
                      onChange={(e) =>
                        onChangeOptions({ ...options, detectTruncations: e.target.checked })
                      }
                      className="accent-white"
                    />
                    <span>Detect code truncations</span>
                  </label>

                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.cleanFirstLinePathComment ?? true}
                      onChange={(e) =>
                        onChangeOptions({ ...options, cleanFirstLinePathComment: e.target.checked })
                      }
                      className="accent-white"
                    />
                    <span>Clean header comments</span>
                  </label>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-900 my-1" />

            <button
              onClick={() => {
                onOpenHelp();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-900 text-white flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Specs & Architecture</span>
            </button>

            <button
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Workspace</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
