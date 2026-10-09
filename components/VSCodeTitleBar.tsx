'use client';

import React, { useState, useRef } from 'react';
import {
  Search,
  Download,
  Columns2,
  PanelBottom,
  PanelLeft,
  Menu,
  LogIn,
  LogOut,
  FolderPlus,
  Save,
  FolderUp,
  FileUp,
  Code2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { UserProfileDropdown } from './UserProfileDropdown';

interface VSCodeTitleBarProps {
  splitView: boolean;
  onToggleSplitView: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  bottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
  onOpenExport: () => void;
  onOpenSearch: () => void;
  onClear: () => void;
  onOpenCheckpoints: () => void;
  onOpenHelp: () => void;
  onOpenManifest: () => void;
  onOpenTree: () => void;
  onOpenSettings: () => void;
  onToggleMobileDrawer: () => void;
  onNewProjectPrompt: () => void;
  onUploadFolder?: (files: FileList) => void;
  onUploadFiles?: (files: FileList) => void;
  currentProjectTitle?: string;
  filesCount: number;
}

interface MenuItem {
  label: string;
  actionId: string;
  shortcut?: string;
}

const MENU_ITEMS: Record<string, MenuItem[]> = {
  File: [
    { label: 'New Project', actionId: 'new', shortcut: 'Ctrl+N' },
    { label: 'Upload Folder...', actionId: 'upload_folder' },
    { label: 'Upload Files...', actionId: 'upload_files' },
    { label: 'Save Version', actionId: 'save', shortcut: 'Ctrl+S' },
    { label: 'Version History', actionId: 'history' },
    { label: 'Export ZIP', actionId: 'export', shortcut: 'Ctrl+Shift+D' },
    { label: 'Clear Workspace', actionId: 'clear' },
  ],
  Edit: [
    { label: 'Find in Files', actionId: 'search', shortcut: 'Ctrl+Shift+F' },
    { label: 'Settings', actionId: 'settings', shortcut: 'Ctrl+,' },
  ],
  View: [
    { label: 'Toggle Split Editor', actionId: 'split', shortcut: 'Ctrl+\\' },
    { label: 'Toggle Sidebar', actionId: 'sidebar', shortcut: 'Ctrl+B' },
    { label: 'Toggle Problems', actionId: 'bottomPanel', shortcut: 'Ctrl+J' },
    { label: 'Code Blocks Manifest', actionId: 'manifest' },
    { label: 'Structure Tree', actionId: 'tree' },
  ],
  Versions: [
    { label: 'Version History', actionId: 'history' },
    { label: 'Save Version', actionId: 'save' },
  ],
  Help: [
    { label: 'Documentation', actionId: 'help' },
  ],
};

export const VSCodeTitleBar: React.FC<VSCodeTitleBarProps> = ({
  splitView,
  onToggleSplitView,
  sidebarOpen,
  onToggleSidebar,
  bottomPanelOpen,
  onToggleBottomPanel,
  onOpenExport,
  onOpenSearch,
  onClear,
  onOpenCheckpoints,
  onOpenHelp,
  onOpenManifest,
  onOpenTree,
  onOpenSettings,
  onToggleMobileDrawer,
  onNewProjectPrompt,
  onUploadFolder,
  onUploadFiles,
  currentProjectTitle,
  filesCount,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, signInWithGoogle, loading: authLoading, signingIn } = useAuth();

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const handleMenuAction = (actionId: string) => {
    setActiveMenu(null);
    switch (actionId) {
      case 'new':
        onNewProjectPrompt();
        break;
      case 'upload_folder':
        folderInputRef.current?.click();
        break;
      case 'upload_files':
        filesInputRef.current?.click();
        break;
      case 'save':
      case 'history':
        onOpenCheckpoints();
        break;
      case 'export':
        onOpenExport();
        break;
      case 'clear':
        onClear();
        break;
      case 'search':
        onOpenSearch();
        break;
      case 'settings':
        onOpenSettings();
        break;
      case 'split':
        onToggleSplitView();
        break;
      case 'sidebar':
        onToggleSidebar();
        break;
      case 'bottomPanel':
        onToggleBottomPanel();
        break;
      case 'manifest':
        onOpenManifest();
        break;
      case 'tree':
        onOpenTree();
        break;
      case 'help':
        onOpenHelp();
        break;
      default:
        break;
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="h-10 bg-[#09090b] border-none flex items-center justify-between px-3 text-xs font-mono select-none z-30 shrink-0 gap-2 w-full max-w-full relative">
      {/* Hidden file & folder inputs */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in modern browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && onUploadFolder) {
            onUploadFolder(e.target.files);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={filesInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && onUploadFiles) {
            onUploadFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      {/* Mobile Drawer Trigger (Visible only on mobile) */}
      <button
        onClick={onToggleMobileDrawer}
        className="md:hidden h-7 w-7 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        title="Open Navigation Menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Left: New Project & Window Menus (No VS Code logo in top left corner) */}
      <div className="hidden md:flex items-center gap-1.5 shrink-0">
        <button
          onClick={onNewProjectPrompt}
          className="h-7 px-2.5 bg-[#1c1c22] hover:bg-[#25252e] border border-neutral-700/80 rounded-md text-white transition-colors cursor-pointer text-xs font-semibold flex items-center whitespace-nowrap shrink-0"
          title="Create New Project"
        >
          <span>New Project</span>
        </button>

        <span className="text-xs text-neutral-300 font-medium max-w-[140px] truncate px-1.5 whitespace-nowrap">
          {currentProjectTitle || 'Project'}
        </span>

        {/* Top Dropdown Menus */}
        <div className="flex items-center gap-0.5 shrink-0">
          {Object.keys(MENU_ITEMS).map((menuKey) => (
            <div key={menuKey} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                onMouseEnter={() => {
                  if (activeMenu) setActiveMenu(menuKey);
                }}
                className={`h-7 px-2 rounded-md transition-colors cursor-pointer text-xs flex items-center whitespace-nowrap ${
                  activeMenu === menuKey
                    ? 'bg-[#222222] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {menuKey}
              </button>

              {activeMenu === menuKey && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                  <div className="absolute left-0 mt-1 min-w-[210px] w-auto max-w-xs bg-[#141418] border border-[#27272e] shadow-2xl py-1 z-50 text-xs rounded-md overflow-hidden animate-in fade-in duration-100">
                    {MENU_ITEMS[menuKey].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMenuAction(item.actionId)}
                        className="w-full px-3 py-1.5 text-left text-neutral-300 hover:bg-white/10 hover:text-white flex items-center justify-between gap-6 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <span className="font-normal">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-neutral-500 font-mono tracking-wide">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Search & Command Palette */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 min-w-0 flex items-center">
        <button
          onClick={onOpenSearch}
          className="h-7 w-full bg-[#16161a] border border-[#27272e] hover:border-neutral-500 text-neutral-400 px-2.5 rounded-md text-xs flex items-center justify-between cursor-pointer transition-colors whitespace-nowrap overflow-hidden shadow-xs"
          title="Search in files (Ctrl+Shift+F)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="truncate">
              {currentProjectTitle ? `Search in ${currentProjectTitle}...` : 'Search files in project...'}
            </span>
          </div>
          <span className="text-[10px] bg-[#101014] border border-[#27272e] px-1.5 py-0.5 rounded text-neutral-500 font-mono hidden sm:inline leading-none shrink-0">
            Ctrl+Shift+F
          </span>
        </button>
      </div>

      {/* Right: View Controls, Google Auth & Compact ZIP */}
      <div className="flex items-center gap-1.5 shrink-0 relative">
        {/* Save Version button */}
        <button
          onClick={onOpenCheckpoints}
          disabled={filesCount === 0}
          className={`h-7 hidden sm:flex items-center gap-1.5 px-2.5 rounded-md text-xs transition-colors cursor-pointer border ${
            filesCount === 0
              ? 'border-neutral-800 text-neutral-600 cursor-not-allowed'
              : 'border-neutral-700 bg-[#161616] hover:bg-[#222222] text-neutral-300 hover:text-white'
          }`}
          title="Save Version (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Toggle Split Source Editor */}
        <button
          onClick={onToggleSplitView}
          className={`h-7 px-2.5 rounded-md transition-all duration-150 cursor-pointer hidden md:flex items-center gap-1.5 text-xs ${
            splitView
              ? 'bg-white text-black font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Split View (Side-by-side Source & Files)"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Split</span>
        </button>

        {/* Toggle Bottom Panel - White background transition when turned on */}
        <button
          onClick={onToggleBottomPanel}
          className={`h-7 px-2 sm:px-2.5 rounded-md transition-all duration-150 cursor-pointer hidden sm:flex items-center gap-1.5 text-xs shrink-0 ${
            bottomPanelOpen
              ? 'bg-white text-black font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Problems Panel (Ctrl+J)"
        >
          <PanelBottom className="w-3.5 h-3.5 shrink-0" />
        </button>

        {/* Toggle Primary Sidebar - White background transition when turned on */}
        <button
          onClick={onToggleSidebar}
          className={`h-7 px-2 sm:px-2.5 rounded-md transition-all duration-150 cursor-pointer hidden sm:flex items-center gap-1.5 text-xs shrink-0 ${
            sidebarOpen
              ? 'bg-white text-black font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Toggle Primary Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-3.5 h-3.5 shrink-0" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-0.5 hidden sm:block shrink-0" />

        {/* User Profile dropdown launcher */}
        {!authLoading && (
          <div className="relative shrink-0">
            {user ? (
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="h-7 flex items-center gap-1.5 bg-[#161616] hover:bg-[#222222] border border-neutral-800 px-2 rounded-md text-xs cursor-pointer transition-colors"
                title="Account Menu"
              >
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-neutral-300 max-w-[80px] truncate hidden md:inline">
                  {displayName}
                </span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>
            ) : (
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="h-7 flex items-center gap-1.5 px-2 bg-[#161616] hover:bg-[#222222] border border-neutral-700 rounded-md text-xs text-white cursor-pointer transition-colors"
                title="Account Menu"
              >
                <div className="w-4 h-4 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="text-xs text-neutral-300 max-w-[80px] truncate hidden md:inline">
                  Guest User
                </span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            <UserProfileDropdown
              isOpen={isProfileMenuOpen}
              onClose={() => setIsProfileMenuOpen(false)}
              onOpenSettings={onOpenSettings}
              onOpenExport={onOpenExport}
              anchorPosition="bottom-right"
            />
          </div>
        )}

        {/* Download ZIP Button: Compact, generous inner padding on counter badge */}
        <button
          onClick={onOpenExport}
          disabled={filesCount === 0}
          className={`h-7 flex items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold uppercase transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            filesCount === 0
              ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
              : 'bg-white text-black hover:bg-neutral-200 border border-white'
          }`}
          title="Export Project ZIP"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>ZIP</span>
          {filesCount > 0 && (
            <span className="bg-black text-white px-2 py-0.5 rounded-full text-[10px] font-mono leading-none font-bold inline-flex items-center justify-center min-w-[20px] ml-0.5">
              {filesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
