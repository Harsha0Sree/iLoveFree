'use client';

import React, { useState, useMemo } from 'react';
import { ParserOptions } from '@/lib/parser';
import {
  X,
  Settings,
  Search,
  Sliders,
  Type,
  FileArchive,
  Palette,
  Sparkles,
  RotateCcw,
  Check,
  Code2,
  FolderTree,
  Terminal,
  Layers,
  ChevronRight,
} from 'lucide-react';

export interface EditorSettings {
  showLineNumbers: boolean;
  wordWrap: boolean;
  fontSize: '11px' | '12px' | '13px' | '14px' | '16px';
  fontFamily?: string;
  tabSize?: number;
  showMinimap?: boolean;
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'solid';
  bracketPairColorization?: boolean;
}

export interface AppSettings {
  parserOptions: ParserOptions;
  editorSettings: EditorSettings;
  includeAuditReport: boolean;
  includeMissingPlaceholders: boolean;
  theme?: string;
  autoSave?: 'off' | 'afterDelay' | 'onFocusChange';
  zipCompression?: 'store' | 'fast' | 'optimal';
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  parserOptions: {
    stripCommonRoot: true,
    detectTruncations: true,
    cleanFirstLinePathComment: true,
    duplicateResolution: 'use_latest',
  },
  editorSettings: {
    showLineNumbers: true,
    wordWrap: false,
    fontSize: '12px',
    fontFamily: 'JetBrains Mono',
    tabSize: 2,
    showMinimap: true,
    cursorBlinking: 'blink',
    bracketPairColorization: true,
  },
  includeAuditReport: true,
  includeMissingPlaceholders: true,
  theme: 'Dark Modern',
  autoSave: 'afterDelay',
  zipCompression: 'optimal',
};

type SettingsTab = 'user' | 'workspace';
type SettingsCategory =
  | 'commonlyUsed'
  | 'editor'
  | 'workbench'
  | 'files'
  | 'parser'
  | 'bundler';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('user');
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('commonlyUsed');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const updateParser = (patch: Partial<ParserOptions>) => {
    onUpdateSettings({
      ...settings,
      parserOptions: {
        ...settings.parserOptions,
        ...patch,
      },
    });
  };

  const updateEditor = (patch: Partial<EditorSettings>) => {
    onUpdateSettings({
      ...settings,
      editorSettings: {
        ...settings.editorSettings,
        ...patch,
      },
    });
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleResetToDefault = () => {
    onUpdateSettings(DEFAULT_APP_SETTINGS);
  };

  const categories = [
    { id: 'commonlyUsed' as SettingsCategory, label: 'Commonly Used', icon: Sparkles },
    { id: 'editor' as SettingsCategory, label: 'Text Editor', icon: Type },
    { id: 'workbench' as SettingsCategory, label: 'Workbench', icon: Palette },
    { id: 'files' as SettingsCategory, label: 'Files', icon: FolderTree },
    { id: 'parser' as SettingsCategory, label: 'Parser & Extractor', icon: Sliders },
    { id: 'bundler' as SettingsCategory, label: 'Export & Bundler', icon: FileArchive },
  ];

  const currentTheme = settings.theme || 'Dark Modern';
  const currentFont = settings.editorSettings.fontFamily || 'JetBrains Mono';
  const currentTabSize = settings.editorSettings.tabSize || 2;
  const currentAutoSave = settings.autoSave || 'afterDelay';
  const currentCompression = settings.zipCompression || 'optimal';

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-6 font-sans select-none animate-in fade-in duration-100">
      <div className="bg-[#181818] border border-[#2b2b2b] w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl rounded-xl text-xs overflow-hidden text-neutral-200">
        {/* 1. VS Code Settings Header */}
        <div className="h-12 border-b border-[#2b2b2b] px-4 flex items-center justify-between gap-4 bg-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#cccccc]" />
            <span className="font-semibold text-white text-xs">Settings</span>
          </div>

          {/* Search bar matching VS Code */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings (e.g. font, wrap, parser, theme)"
              className="w-full h-7 bg-[#141414] border border-[#3c3c3c] focus:border-[#007fd4] focus:outline-none rounded pl-8 pr-7 text-xs text-white placeholder:text-neutral-500 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            title="Close Settings (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. User & Workspace Subheader Tab Navigation */}
        <div className="h-9 border-b border-[#262626] bg-[#161616] px-4 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('user')}
              className={`h-9 flex items-center gap-1.5 font-medium border-b-2 transition-colors cursor-pointer text-xs ${
                activeTab === 'user'
                  ? 'border-[#007fd4] text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>User</span>
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`h-9 flex items-center gap-1.5 font-medium border-b-2 transition-colors cursor-pointer text-xs ${
                activeTab === 'workspace'
                  ? 'border-[#007fd4] text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Workspace</span>
            </button>
          </div>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white hover:bg-[#252525] px-2 py-1 rounded transition-colors cursor-pointer"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* 3. Main Body: Left Category Sidebar & Right Settings Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Category Sidebar */}
          <div className="w-56 bg-[#141414] border-r border-[#262626] p-2 flex flex-col gap-0.5 shrink-0 select-none overflow-y-auto">
            <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
              Preferences
            </div>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = !searchQuery && activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`w-full h-8 px-2.5 rounded flex items-center justify-between text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#2b2b2b] text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#1c1c1c]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 text-neutral-400" />}
                </button>
              );
            })}
          </div>

          {/* Right Main Settings Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#181818]">
            {/* Breadcrumb Navigation */}
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
              <span className="capitalize">{activeTab}</span>
              <span>&gt;</span>
              <span className="text-white font-medium capitalize">
                {searchQuery ? `Search Results: "${searchQuery}"` : activeCategory}
              </span>
            </div>

            {/* 1. TEXT EDITOR SETTINGS */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'editor') && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#292929] pb-1.5 flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-[#007fd4]" />
                  <span>Text Editor</span>
                </div>

                {/* Font Family */}
                {matchesSearch('font family font') && (
                  <div className="p-3 bg-[#1e1e1e] border-l-2 border-l-[#007fd4] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Editor: Font Family</div>
                    <div className="text-[11px] text-neutral-400">
                      Controls the font family for code blocks and active file editor.
                    </div>
                    <select
                      value={currentFont}
                      onChange={(e) => updateEditor({ fontFamily: e.target.value })}
                      className="h-7 w-64 bg-[#141414] border border-[#3c3c3c] text-white rounded px-2 text-xs focus:border-[#007fd4] focus:outline-none cursor-pointer font-mono"
                    >
                      <option value="JetBrains Mono">JetBrains Mono (Default)</option>
                      <option value="Fira Code">Fira Code</option>
                      <option value="Menlo">Menlo</option>
                      <option value="Consolas">Consolas</option>
                      <option value="Monaco">Monaco</option>
                      <option value="monospace">Standard Monospace</option>
                    </select>
                  </div>
                )}

                {/* Font Size */}
                {matchesSearch('font size zoom editor') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Editor: Font Size</div>
                    <div className="text-[11px] text-neutral-400">
                      Controls the font size in pixels for the code viewer.
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['11px', '12px', '13px', '14px', '16px'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => updateEditor({ fontSize: sz })}
                          className={`h-7 px-3 rounded text-xs font-mono transition-colors cursor-pointer ${
                            settings.editorSettings.fontSize === sz
                              ? 'bg-white text-black font-semibold'
                              : 'bg-[#141414] text-neutral-300 border border-[#333333] hover:text-white hover:border-neutral-500'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Size */}
                {matchesSearch('tab size indent spaces') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Editor: Tab Size</div>
                    <div className="text-[11px] text-neutral-400">
                      The number of spaces a tab is equal to.
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[2, 4, 8].map((size) => (
                        <button
                          key={size}
                          onClick={() => updateEditor({ tabSize: size })}
                          className={`h-7 px-3 rounded text-xs font-mono transition-colors cursor-pointer ${
                            currentTabSize === size
                              ? 'bg-white text-black font-semibold'
                              : 'bg-[#141414] text-neutral-300 border border-[#333333] hover:text-white hover:border-neutral-500'
                          }`}
                        >
                          {size} spaces
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Wrap */}
                {matchesSearch('word wrap lines') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="wordWrap"
                      checked={settings.editorSettings.wordWrap}
                      onChange={(e) => updateEditor({ wordWrap: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="wordWrap" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">Editor: Word Wrap</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Controls whether lines should wrap around the viewport or scroll horizontally.
                      </div>
                    </label>
                  </div>
                )}

                {/* Line Numbers */}
                {matchesSearch('line numbers gutter') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="showLineNumbers"
                      checked={settings.editorSettings.showLineNumbers}
                      onChange={(e) => updateEditor({ showLineNumbers: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="showLineNumbers" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">Editor: Line Numbers</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Controls the display of line numbers in the code editor gutter.
                      </div>
                    </label>
                  </div>
                )}

                {/* Minimap */}
                {matchesSearch('minimap code outline') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="showMinimap"
                      checked={settings.editorSettings.showMinimap ?? true}
                      onChange={(e) => updateEditor({ showMinimap: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="showMinimap" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">Editor &gt; Minimap: Enabled</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Controls whether the minimap is shown on the right side of the editor.
                      </div>
                    </label>
                  </div>
                )}

                {/* Bracket Pair Colorization */}
                {matchesSearch('bracket pair colorization colors') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bracketColors"
                      checked={settings.editorSettings.bracketPairColorization ?? true}
                      onChange={(e) => updateEditor({ bracketPairColorization: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="bracketColors" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Editor &gt; Bracket Pair Colorization: Enabled
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Controls whether bracket pair colorization is enabled.
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 2. WORKBENCH & APPEARANCE */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'workbench') && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#292929] pb-1.5 flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5 text-[#007fd4]" />
                  <span>Workbench & Appearance</span>
                </div>

                {/* Theme Selector */}
                {matchesSearch('theme color dark light contrast') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Workbench: Color Theme</div>
                    <div className="text-[11px] text-neutral-400">
                      Specifies the color theme used in the workbench.
                    </div>
                    <select
                      value={currentTheme}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="h-7 w-64 bg-[#141414] border border-[#3c3c3c] text-white rounded px-2 text-xs focus:border-[#007fd4] focus:outline-none cursor-pointer"
                    >
                      <option value="Dark Modern">Dark Modern (VS Code Default)</option>
                      <option value="Dark+">Dark+ (Default Dark)</option>
                      <option value="Monokai">Monokai</option>
                      <option value="One Dark Pro">One Dark Pro</option>
                      <option value="Dracula">Dracula Official</option>
                      <option value="High Contrast">High Contrast Dark</option>
                      <option value="Light Modern">Light Modern</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 3. FILES & WORKSPACE */}
            {(searchQuery || activeCategory === 'files') && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#292929] pb-1.5 flex items-center gap-2">
                  <FolderTree className="w-3.5 h-3.5 text-[#007fd4]" />
                  <span>Files & Workspace</span>
                </div>

                {/* Auto Save */}
                {matchesSearch('auto save save delay files') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Files: Auto Save</div>
                    <div className="text-[11px] text-neutral-400">
                      Controls auto save of modified source transcripts and edits.
                    </div>
                    <select
                      value={currentAutoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.value as 'off' | 'afterDelay' | 'onFocusChange')}
                      className="h-7 w-64 bg-[#141414] border border-[#3c3c3c] text-white rounded px-2 text-xs focus:border-[#007fd4] focus:outline-none cursor-pointer"
                    >
                      <option value="afterDelay">afterDelay (Automatic 1000ms debounce)</option>
                      <option value="onFocusChange">onFocusChange (Save when switching tabs)</option>
                      <option value="off">off (Manual save only)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 4. PARSER & EXTRACTOR */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'parser') && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#292929] pb-1.5 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#007fd4]" />
                  <span>Parser & Extractor (iLoveFree Engine)</span>
                </div>

                {/* Strip Common Root */}
                {matchesSearch('strip common root folder directory parser') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="stripCommonRoot"
                      checked={settings.parserOptions.stripCommonRoot ?? true}
                      onChange={(e) => updateParser({ stripCommonRoot: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="stripCommonRoot" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Parser: Strip Common Root Folder
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Automatically strips redundant enclosing root directories (e.g. <code>project-name/src/...</code> becomes <code>src/...</code>).
                      </div>
                    </label>
                  </div>
                )}

                {/* Clean First Line Path Comments */}
                {matchesSearch('clean path comments parser') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="cleanFirstLine"
                      checked={settings.parserOptions.cleanFirstLinePathComment ?? true}
                      onChange={(e) => updateParser({ cleanFirstLinePathComment: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="cleanFirstLine" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Parser: Clean First-Line Path Annotations
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Removes initial comment lines specifying filenames (e.g. <code>{'// filename.ts'}</code>) from file content.
                      </div>
                    </label>
                  </div>
                )}

                {/* Detect Truncations */}
                {matchesSearch('truncation warnings placeholder ellipsis') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="detectTruncations"
                      checked={settings.parserOptions.detectTruncations ?? true}
                      onChange={(e) => updateParser({ detectTruncations: e.target.checked })}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="detectTruncations" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Parser: Audit Code Truncations &amp; Missing Snippets
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Detects comments like <code>{'// ... rest of the code ...'}</code> or omitted logic and highlights diagnostics.
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* 5. EXPORT & BUNDLER */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'bundler') && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#292929] pb-1.5 flex items-center gap-2">
                  <FileArchive className="w-3.5 h-3.5 text-[#007fd4]" />
                  <span>Export & Bundler</span>
                </div>

                {/* Compression Level */}
                {matchesSearch('zip compression export speed level') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded space-y-2">
                    <div className="font-semibold text-white text-xs">Bundler: ZIP Compression Level</div>
                    <div className="text-[11px] text-neutral-400">
                      Balances between packaging speed and final archive file size.
                    </div>
                    <select
                      value={currentCompression}
                      onChange={(e) => updateSetting('zipCompression', e.target.value as 'store' | 'fast' | 'optimal')}
                      className="h-7 w-64 bg-[#141414] border border-[#3c3c3c] text-white rounded px-2 text-xs focus:border-[#007fd4] focus:outline-none cursor-pointer"
                    >
                      <option value="optimal">Optimal (Level 6 - Recommended)</option>
                      <option value="fast">Fast (Level 1 - Instant packaging)</option>
                      <option value="store">Store (No compression - Raw archive)</option>
                    </select>
                  </div>
                )}

                {/* Include Audit Report */}
                {matchesSearch('include audit report diagnostics zip') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="includeAuditReport"
                      checked={settings.includeAuditReport}
                      onChange={(e) => updateSetting('includeAuditReport', e.target.checked)}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="includeAuditReport" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Bundler: Include AUDIT_REPORT.md in ZIP
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Embeds a complete markdown diagnostics report into the exported archive with tree matching results and block references.
                      </div>
                    </label>
                  </div>
                )}

                {/* Include Missing Placeholders */}
                {matchesSearch('include placeholders missing files skeleton') && (
                  <div className="p-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="includeMissingPlaceholders"
                      checked={settings.includeMissingPlaceholders}
                      onChange={(e) => updateSetting('includeMissingPlaceholders', e.target.checked)}
                      className="mt-0.5 accent-white h-4 w-4 rounded cursor-pointer"
                    />
                    <label htmlFor="includeMissingPlaceholders" className="cursor-pointer">
                      <div className="font-semibold text-white text-xs">
                        Bundler: Generate Stubs for Tree References Missing Content
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Generates placeholder files with descriptive comments for files listed in the directory tree but omitted from code blocks.
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer */}
        <div className="h-10 border-t border-[#262626] bg-[#161616] px-4 flex items-center justify-between text-xs shrink-0 text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px]">Settings synced to local workspace</span>
          </div>
          <button
            onClick={onClose}
            className="h-7 px-4 bg-white text-black hover:bg-neutral-200 font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
