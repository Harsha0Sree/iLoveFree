'use client';

import React, { useState } from 'react';
import { ParserOptions } from '@/lib/parser';
import {
  X,
  Settings,
  Search,
  Sliders,
  Type,
  FileArchive,
  Sparkles,
  RotateCcw,
  Check,
  Code2,
  FolderTree,
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
  | 'files'
  | 'parser'
  | 'bundler';

// Custom toggle component for uniform alignment and spacing
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
  label: string;
}> = ({ checked, onChange, id, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    id={id}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-white' : 'bg-[#2f2f35]'
    }`}
    title={label}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5 bg-black' : 'translate-x-0 bg-neutral-400'
      }`}
    />
  </button>
);

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
    { id: 'files' as SettingsCategory, label: 'Files & Workspace', icon: FolderTree },
    { id: 'parser' as SettingsCategory, label: 'Parser & Extractor', icon: Sliders },
    { id: 'bundler' as SettingsCategory, label: 'Export & Bundler', icon: FileArchive },
  ];

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
      <div className="bg-[#18181b] border border-[#2b2b32] w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl rounded-2xl text-xs overflow-hidden text-neutral-200">
        {/* 1. VS Code Settings Header */}
        <div className="h-14 border-b border-[#26262e] px-5 flex items-center justify-between gap-4 bg-[#141416] shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-white" />
            <span className="font-semibold text-white text-sm tracking-tight">Settings</span>
          </div>

          {/* Search bar matching VS Code */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings (e.g. font, wrap, parser, save)"
              className="w-full h-8 bg-[#1e1e24] border border-[#2e2e38] focus:border-white focus:outline-none rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-neutral-500 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close Settings (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. User & Workspace Subheader Tab Navigation */}
        <div className="h-10 border-b border-[#26262e] bg-[#121214] px-5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('user')}
              className={`h-10 flex items-center gap-1.5 font-medium border-b-2 transition-colors cursor-pointer text-xs ${
                activeTab === 'user'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>User</span>
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className={`h-10 flex items-center gap-1.5 font-medium border-b-2 transition-colors cursor-pointer text-xs ${
                activeTab === 'workspace'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>Workspace</span>
            </button>
          </div>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Reset all settings to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* 3. Main Body: Left Category Sidebar & Right Settings Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Category Sidebar */}
          <div className="w-56 bg-[#131316] border-r border-[#26262e] p-3 flex flex-col gap-1 shrink-0 select-none overflow-y-auto">
            <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
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
                  className={`w-full h-9 px-3 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Main Settings Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#18181b]">
            {/* Breadcrumb Navigation */}
            <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono pb-2 border-b border-[#26262e]">
              <span className="capitalize">{activeTab}</span>
              <span>&gt;</span>
              <span className="text-white font-medium capitalize">
                {searchQuery ? `Search Results: "${searchQuery}"` : activeCategory}
              </span>
            </div>

            {/* 1. TEXT EDITOR SETTINGS */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'editor') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider pb-1 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-white" />
                  <span>Text Editor</span>
                </div>

                {/* Font Family */}
                {matchesSearch('font family font') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Font Family</div>
                      <div className="text-xs text-neutral-400">
                        Controls the monospace font family for code blocks and active editor panes.
                      </div>
                    </div>
                    <select
                      value={currentFont}
                      onChange={(e) => updateEditor({ fontFamily: e.target.value })}
                      className="h-8 w-full sm:w-60 bg-[#141416] border border-[#33333d] text-white rounded-lg px-3 text-xs focus:border-white focus:outline-none cursor-pointer font-mono shrink-0"
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
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Font Size</div>
                      <div className="text-xs text-neutral-400">
                        Controls the font size in pixels for the code viewer.
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['11px', '12px', '13px', '14px', '16px'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => updateEditor({ fontSize: sz })}
                          className={`h-8 px-3 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                            settings.editorSettings.fontSize === sz
                              ? 'bg-white text-black font-semibold shadow-xs'
                              : 'bg-[#141416] text-neutral-300 border border-[#33333d] hover:text-white hover:border-neutral-500'
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
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Tab Size</div>
                      <div className="text-xs text-neutral-400">
                        The number of spaces a tab is equal to for code indentation.
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {[2, 4, 8].map((size) => (
                        <button
                          key={size}
                          onClick={() => updateEditor({ tabSize: size })}
                          className={`h-8 px-3.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                            currentTabSize === size
                              ? 'bg-white text-black font-semibold shadow-xs'
                              : 'bg-[#141416] text-neutral-300 border border-[#33333d] hover:text-white hover:border-neutral-500'
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
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Word Wrap</div>
                      <div className="text-xs text-neutral-400">
                        Controls whether code lines should wrap around the viewport or scroll horizontally.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.editorSettings.wordWrap}
                      onChange={(val) => updateEditor({ wordWrap: val })}
                      id="wordWrap"
                      label="Editor Word Wrap"
                    />
                  </div>
                )}

                {/* Line Numbers */}
                {matchesSearch('line numbers gutter') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Line Numbers</div>
                      <div className="text-xs text-neutral-400">
                        Controls the display of line numbers in the code editor left gutter.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.editorSettings.showLineNumbers}
                      onChange={(val) => updateEditor({ showLineNumbers: val })}
                      id="showLineNumbers"
                      label="Editor Line Numbers"
                    />
                  </div>
                )}

                {/* Minimap */}
                {matchesSearch('minimap code outline') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Editor: Minimap Navigation</div>
                      <div className="text-xs text-neutral-400">
                        Controls whether the minimap overview is displayed on the right edge of the editor.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.editorSettings.showMinimap ?? true}
                      onChange={(val) => updateEditor({ showMinimap: val })}
                      id="showMinimap"
                      label="Editor Minimap"
                    />
                  </div>
                )}

                {/* Bracket Pair Colorization */}
                {matchesSearch('bracket pair colorization colors') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Editor: Bracket Pair Colorization
                      </div>
                      <div className="text-xs text-neutral-400">
                        Highlights matching brackets with distinct visual levels.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.editorSettings.bracketPairColorization ?? true}
                      onChange={(val) => updateEditor({ bracketPairColorization: val })}
                      id="bracketColors"
                      label="Bracket Pair Colorization"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. FILES & WORKSPACE */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'files') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider pb-1 flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-white" />
                  <span>Files & Workspace</span>
                </div>

                {/* Auto Save */}
                {matchesSearch('auto save save delay files') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Files: Auto Save Strategy</div>
                      <div className="text-xs text-neutral-400">
                        Controls automatic saving of modified source transcripts and edits.
                      </div>
                    </div>
                    <select
                      value={currentAutoSave}
                      onChange={(e) => updateSetting('autoSave', e.target.value as 'off' | 'afterDelay' | 'onFocusChange')}
                      className="h-8 w-full sm:w-60 bg-[#141416] border border-[#33333d] text-white rounded-lg px-3 text-xs focus:border-white focus:outline-none cursor-pointer shrink-0"
                    >
                      <option value="afterDelay">afterDelay (Automatic 1000ms debounce)</option>
                      <option value="onFocusChange">onFocusChange (Save when switching tabs)</option>
                      <option value="off">off (Manual save only)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* 3. PARSER & EXTRACTOR */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'parser') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider pb-1 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-white" />
                  <span>Parser & Extractor Engine</span>
                </div>

                {/* Strip Common Root */}
                {matchesSearch('strip common root folder directory parser') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Parser: Strip Common Root Folder
                      </div>
                      <div className="text-xs text-neutral-400">
                        Automatically strips redundant enclosing root directories (e.g. project-name/src/... becomes src/...).
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.parserOptions.stripCommonRoot ?? true}
                      onChange={(val) => updateParser({ stripCommonRoot: val })}
                      id="stripCommonRoot"
                      label="Strip Common Root"
                    />
                  </div>
                )}

                {/* Clean First Line Path Comments */}
                {matchesSearch('clean path comments parser') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Parser: Clean First-Line Path Annotations
                      </div>
                      <div className="text-xs text-neutral-400">
                        Removes initial comment lines specifying filenames (e.g. // filename.ts) from file content.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.parserOptions.cleanFirstLinePathComment ?? true}
                      onChange={(val) => updateParser({ cleanFirstLinePathComment: val })}
                      id="cleanFirstLine"
                      label="Clean First-Line Path Annotations"
                    />
                  </div>
                )}

                {/* Detect Truncations */}
                {matchesSearch('truncation warnings placeholder ellipsis') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Parser: Audit Code Truncations & Missing Snippets
                      </div>
                      <div className="text-xs text-neutral-400">
                        Detects comments like &quot;// ... rest of code ...&quot; or omitted logic and highlights diagnostics.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.parserOptions.detectTruncations ?? true}
                      onChange={(val) => updateParser({ detectTruncations: val })}
                      id="detectTruncations"
                      label="Audit Code Truncations"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. EXPORT & BUNDLER */}
            {(searchQuery || activeCategory === 'commonlyUsed' || activeCategory === 'bundler') && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider pb-1 flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-white" />
                  <span>Export & Bundler</span>
                </div>

                {/* Compression Level */}
                {matchesSearch('zip compression export speed level') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">Bundler: ZIP Compression Level</div>
                      <div className="text-xs text-neutral-400">
                        Balances between packaging speed and final archive file size.
                      </div>
                    </div>
                    <select
                      value={currentCompression}
                      onChange={(e) => updateSetting('zipCompression', e.target.value as 'store' | 'fast' | 'optimal')}
                      className="h-8 w-full sm:w-60 bg-[#141416] border border-[#33333d] text-white rounded-lg px-3 text-xs focus:border-white focus:outline-none cursor-pointer shrink-0"
                    >
                      <option value="optimal">Optimal (Level 6 - Recommended)</option>
                      <option value="fast">Fast (Level 1 - Instant packaging)</option>
                      <option value="store">Store (No compression - Raw archive)</option>
                    </select>
                  </div>
                )}

                {/* Include Audit Report */}
                {matchesSearch('include audit report diagnostics zip') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Bundler: Include AUDIT_REPORT.md in ZIP
                      </div>
                      <div className="text-xs text-neutral-400">
                        Embeds a complete markdown diagnostics report into the exported archive with tree matching results and block references.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.includeAuditReport}
                      onChange={(val) => updateSetting('includeAuditReport', val)}
                      id="includeAuditReport"
                      label="Include Audit Report"
                    />
                  </div>
                )}

                {/* Include Missing Placeholders */}
                {matchesSearch('include placeholders missing files skeleton') && (
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-white text-xs">
                        Bundler: Generate Stubs for Tree References Missing Content
                      </div>
                      <div className="text-xs text-neutral-400">
                        Generates placeholder stubs with descriptive comments for files listed in the directory tree but omitted from code blocks.
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={settings.includeMissingPlaceholders}
                      onChange={(val) => updateSetting('includeMissingPlaceholders', val)}
                      id="includeMissingPlaceholders"
                      label="Generate Missing Stubs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer */}
        <div className="h-12 border-t border-[#26262e] bg-[#141416] px-5 flex items-center justify-between text-xs shrink-0 text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-neutral-300">Settings automatically saved and applied</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 px-5 bg-white text-black hover:bg-neutral-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
