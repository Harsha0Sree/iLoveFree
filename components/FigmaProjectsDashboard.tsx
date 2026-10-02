'use client';

import React, { useState, useRef } from 'react';
import {
  Folder,
  Plus,
  Search,
  Star,
  MoreVertical,
  Clock,
  Layers,
  Trash2,
  Copy,
  LogIn,
  LogOut,
  ArrowRight,
  Code2,
  FolderOpen,
  Check,
  User,
  MoveRight,
  FolderUp,
  FileUp,
  Sliders,
  Sparkles,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { UserProfileDropdown } from './UserProfileDropdown';
import { processUploadedFiles } from '@/lib/folder-upload';

export interface SavedProject {
  id: number;
  userId: string;
  title: string;
  description?: string | null;
  rawTranscript: string;
  parsedFiles: any;
  stats: {
    fileCount: number;
    totalBytes: number;
    totalBlocks: number;
    lineCount: number;
  };
  thumbnailGradient?: string | null;
  isStarred: number;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'default', name: 'Default Workspace', createdAt: new Date().toISOString() },
];

const WORKSPACES_STORAGE_KEY = 'repo_extract_workspaces_v1';
const PROJECT_WORKSPACE_MAP_KEY = 'repo_extract_project_workspace_map_v1';

interface FigmaProjectsDashboardProps {
  projects: SavedProject[];
  isLoading: boolean;
  onOpenProject: (project: SavedProject) => void;
  onCreateNewProject: (title: string, transcript: string) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onToggleStar: (id: number, currentStar: number) => Promise<void>;
  onDuplicateProject: (project: SavedProject) => Promise<void>;
  onOpenEditorDirectly?: () => void;
  onOpenSettings?: () => void;
  onDirectUploadFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadFolderOrFiles?: (files: FileList) => Promise<void>;
  onGoToLanding?: () => void;
  isMobile?: boolean;
  onOpenMobileWorkspaceNotice?: () => void;
  onDownloadProjectZip?: (project: SavedProject) => void;
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
  } catch {
    return 'Recently';
  }
}

export const FigmaProjectsDashboard: React.FC<FigmaProjectsDashboardProps> = ({
  projects,
  isLoading,
  onOpenProject,
  onCreateNewProject,
  onDeleteProject,
  onToggleStar,
  onDuplicateProject,
  onOpenEditorDirectly,
  onOpenSettings,
  onDirectUploadFile,
  onUploadFolderOrFiles,
  onGoToLanding,
  isMobile = false,
  onOpenMobileWorkspaceNotice,
  onDownloadProjectZip,
}) => {
  const { user, signInWithGoogle, signOut, loading: authLoading, signingIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [navSection, setNavSection] = useState<'recents' | 'starred' | 'all' | 'workspace'>('recents');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('default');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Hidden folder / file input refs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WORKSPACES;
    try {
      const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY);
      if (!raw) return DEFAULT_WORKSPACES;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORKSPACES;
    } catch {
      return DEFAULT_WORKSPACES;
    }
  });

  // Project to workspace mapping state
  const [projectWorkspaceMap, setProjectWorkspaceMap] = useState<Record<number, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(PROJECT_WORKSPACE_MAP_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });

  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Project creation modal state
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [createModeTab, setCreateModeTab] = useState<'transcript' | 'folder' | 'files'>('transcript');
  const [newTitle, setNewTitle] = useState('');
  const [newTranscript, setNewTranscript] = useState('');
  const [targetWorkspaceForNewProject, setTargetWorkspaceForNewProject] = useState('default');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const saveWorkspaces = (newWsList: Workspace[]) => {
    setWorkspaces(newWsList);
    try {
      localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(newWsList));
    } catch (err) {
      console.error('Failed to save workspaces', err);
    }
  };

  const saveProjectWorkspaceMap = (newMap: Record<number, string>) => {
    setProjectWorkspaceMap(newMap);
    try {
      localStorage.setItem(PROJECT_WORKSPACE_MAP_KEY, JSON.stringify(newMap));
    } catch (err) {
      console.error('Failed to save project workspace map', err);
    }
  };

  const handleCreateWorkspace = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newWorkspaceName.trim();
    if (!name) return;
    const newWs: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      createdAt: new Date().toISOString(),
    };
    const updated = [...workspaces, newWs];
    saveWorkspaces(updated);
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
    setSelectedWorkspaceId(newWs.id);
    setNavSection('workspace');
  };

  const handleDeleteWorkspace = (wsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (wsId === 'default') return;
    const updated = workspaces.filter((w) => w.id !== wsId);
    saveWorkspaces(updated);

    const newMap = { ...projectWorkspaceMap };
    Object.keys(newMap).forEach((pidStr) => {
      const pid = Number(pidStr);
      if (newMap[pid] === wsId) {
        newMap[pid] = 'default';
      }
    });
    saveProjectWorkspaceMap(newMap);

    if (selectedWorkspaceId === wsId) {
      setSelectedWorkspaceId('default');
      setNavSection('workspace');
    }
  };

  const handleMoveProjectToWorkspace = (projectId: number, targetWsId: string) => {
    const newMap = { ...projectWorkspaceMap, [projectId]: targetWsId };
    saveProjectWorkspaceMap(newMap);
    setActiveMenuId(null);
  };

  const getWorkspaceCount = (wsId: string) => {
    return projects.filter((p) => (projectWorkspaceMap[p.id] || 'default') === wsId).length;
  };

  const filteredProjects = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchFiles = Object.keys(p.parsedFiles || {}).some((f) =>
        f.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchFiles) return false;
    }

    if (navSection === 'starred') {
      return p.isStarred === 1;
    }
    if (navSection === 'workspace') {
      const assignedWs = projectWorkspaceMap[p.id] || 'default';
      return assignedWs === selectedWorkspaceId;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTranscript.trim()) return;
    const title = newTitle.trim() || 'Untitled Project';
    await onCreateNewProject(title, newTranscript);

    if (targetWorkspaceForNewProject) {
      setTimeout(() => {
        setProjectWorkspaceMap((prev) => {
          const updated = { ...prev };
          projects.forEach((proj) => {
            if (!updated[proj.id]) {
              updated[proj.id] = targetWorkspaceForNewProject;
            }
          });
          try {
            localStorage.setItem(PROJECT_WORKSPACE_MAP_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }, 500);
    }

    setNewTitle('');
    setNewTranscript('');
    setIsCreatingModal(false);
  };

  const handleFolderUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onUploadFolderOrFiles) {
        await onUploadFolderOrFiles(e.target.files);
        setIsCreatingModal(false);
      }
      e.target.value = '';
    }
  };

  const handleFilesUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onUploadFolderOrFiles) {
        await onUploadFolderOrFiles(e.target.files);
        setIsCreatingModal(false);
      }
      e.target.value = '';
    }
  };

  const displayName = user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest User';
  const initial = displayName.charAt(0).toUpperCase();

  const activeWorkspaceObj = workspaces.find((w) => w.id === selectedWorkspaceId) || workspaces[0];
  const pageTitle =
    navSection === 'recents'
      ? 'Recents'
      : navSection === 'starred'
      ? 'Starred Projects'
      : navSection === 'all'
      ? 'All Projects'
      : activeWorkspaceObj?.name || 'Workspace';

  return (
    <div className="flex h-screen w-screen bg-[#0e0e0e] text-neutral-200 font-sans select-none overflow-hidden relative">
      {/* Hidden file & folder inputs */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in modern browsers
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleFolderUploadChange}
      />
      <input
        ref={filesInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesUploadChange}
      />

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* 1. Left Navigation Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 md:w-60 bg-[#121212] border-r border-[#202020] flex flex-col shrink-0 select-none z-50 md:z-20 overflow-y-auto transition-transform duration-200 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1">
          {/* User profile row matching image.png with interactive dropdown launcher */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#1f1f1f] shrink-0 relative">
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity cursor-pointer"
              title="Open Profile Menu"
            >
              {user?.photoURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-neutral-700"
                />
              ) : user ? (
                <div className="w-7 h-7 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-neutral-600">
                  {initial}
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center shrink-0 ring-1 ring-neutral-700">
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex items-center gap-1">
                <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  disabled={authLoading || signingIn}
                  className="h-7 px-2.5 bg-white text-black hover:bg-neutral-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Sign In with Google"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{signingIn ? '...' : 'Login'}</span>
                </button>
              )}
            </div>

            {/* Profile Dropdown Component */}
            <UserProfileDropdown
              isOpen={isProfileMenuOpen}
              onClose={() => setIsProfileMenuOpen(false)}
              onOpenSettings={onOpenSettings || (() => {})}
              anchorPosition="bottom-left"
            />
          </div>

          {/* Quick Search Input */}
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-8 bg-[#1a1a1a] border border-[#262626] rounded-md pl-8 pr-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              />
            </div>
          </div>

          {/* Primary Navigation Links */}
          <div className="px-2 space-y-0.5 shrink-0">
            <button
              onClick={() => setNavSection('recents')}
              className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer ${
                navSection === 'recents'
                  ? 'bg-[#2b2b2b] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Recents</span>
            </button>

            <button
              onClick={() => setNavSection('starred')}
              className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer ${
                navSection === 'starred'
                  ? 'bg-[#2b2b2b] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Star className="w-4 h-4 shrink-0" />
              <span>Starred</span>
            </button>

            <button
              onClick={() => setNavSection('all')}
              className={`w-full h-8 px-2.5 rounded-md flex items-center gap-2.5 text-xs font-medium transition-colors cursor-pointer ${
                navSection === 'all'
                  ? 'bg-[#2b2b2b] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span>All Projects</span>
            </button>
          </div>

          {/* Section Divider */}
          <div className="h-[1px] bg-[#1f1f1f] mx-3 my-3 shrink-0" />

          {/* Workspaces Section */}
          <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5 px-1 shrink-0">
              <span className="tracking-wider">WORKSPACES</span>
              <button
                onClick={() => {
                  setIsCreatingWorkspace(true);
                  setNewWorkspaceName('');
                }}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Create Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline workspace creation form */}
            {isCreatingWorkspace && (
              <form
                onSubmit={handleCreateWorkspace}
                className="mb-2 p-2 bg-[#1a1a1a] rounded-md border border-[#2f2f2f] space-y-2 shrink-0 animate-in fade-in duration-100"
              >
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name..."
                  className="w-full bg-[#111111] border border-[#333333] rounded px-2.5 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingWorkspace(false);
                      setNewWorkspaceName('');
                    }}
                    className="px-2 py-0.5 text-[10px] text-neutral-400 hover:text-white rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newWorkspaceName.trim()}
                    className="px-2.5 py-0.5 text-[10px] bg-white text-black hover:bg-neutral-200 rounded font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Workspaces List */}
            <div className="space-y-0.5 overflow-y-auto pr-0.5 flex-1">
              {workspaces.map((ws) => {
                const count = getWorkspaceCount(ws.id);
                const isSelected = navSection === 'workspace' && selectedWorkspaceId === ws.id;

                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspaceId(ws.id);
                      setNavSection('workspace');
                    }}
                    className={`group w-full h-8 px-2 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2b2b2b] text-white font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ws.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                        {count}
                      </span>
                      {ws.id !== 'default' && (
                        <button
                          onClick={(e) => handleDeleteWorkspace(ws.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-neutral-800 transition-all cursor-pointer"
                          title={`Delete workspace "${ws.name}"`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links Footer in Sidebar */}
          <div className="p-3 border-t border-[#1f1f1f] flex items-center justify-between text-xs text-neutral-400">
            {onGoToLanding && (
              <button
                onClick={onGoToLanding}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="View iLoveFree Landing Page"
              >
                <span>iLoveFree</span>
              </button>
            )}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#141414] overflow-hidden">
        {/* Top Header Row (border-none to eliminate separating line) */}
        <header className="h-14 border-none bg-[#141414] px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger menu trigger */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight capitalize truncate max-w-xs sm:max-w-sm">
              {pageTitle}
            </h1>
            <span className="text-xs text-neutral-500 font-normal shrink-0">
              ({filteredProjects.length})
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Upload Folder Button */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="h-8 px-2.5 sm:px-3 bg-[#1e1e1e] hover:bg-[#292929] border border-[#2d2d2d] rounded-md text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload entire project folder from disk"
            >
              <FolderUp className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Upload Folder</span>
            </button>

            {/* Single primary New Project button */}
            <button
              onClick={() => {
                setTargetWorkspaceForNewProject(selectedWorkspaceId || 'default');
                setIsCreatingModal(true);
              }}
              className="h-8 px-3 sm:px-3.5 bg-white text-black hover:bg-neutral-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Project</span>
            </button>

            {onOpenEditorDirectly && (
              <button
                onClick={() => {
                  if (isMobile && onOpenMobileWorkspaceNotice) {
                    onOpenMobileWorkspaceNotice();
                  } else {
                    onOpenEditorDirectly();
                  }
                }}
                className="h-8 px-2.5 sm:px-3 bg-[#1e1e1e] hover:bg-[#292929] border border-[#2d2d2d] rounded-md text-xs text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isMobile ? "Workspace (Desktop Only)" : "Go to Code Workspace"}
              >
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Workspace</span>
              </button>
            )}
          </div>
        </header>

        {/* Sub-nav row */}
        <div className="h-10 border-b border-[#1f1f1f] px-6 flex items-center justify-between text-xs shrink-0 bg-[#141414]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium">
              {navSection === 'workspace'
                ? `Filtered by workspace: ${activeWorkspaceObj?.name}`
                : 'Recently viewed'}
            </span>
          </div>

          <div className="text-[11px] text-neutral-500">
            Click any project to open in editor
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mb-2.5" />
              <span>Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="h-72 border border-dashed border-[#262626] rounded-xl flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto mt-12 bg-[#171717]">
              <div className="w-10 h-10 rounded-lg bg-[#222222] flex items-center justify-center text-neutral-400 mb-3">
                <Folder className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {navSection === 'starred'
                  ? 'No Starred Projects'
                  : navSection === 'workspace'
                  ? `No Projects in "${activeWorkspaceObj?.name}"`
                  : 'No Projects Yet'}
              </h3>
              <p className="text-neutral-400 text-xs mb-4 leading-relaxed max-w-xs">
                {navSection === 'starred'
                  ? 'Star any project to quickly access it here.'
                  : navSection === 'workspace'
                  ? 'Create, upload, or move a project into this workspace to organize your work.'
                  : 'Create a new project by pasting your code or uploading a folder.'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="h-8 px-3 border border-[#333333] hover:border-neutral-500 bg-[#1e1e1e] text-neutral-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>Upload Folder</span>
                </button>
                <button
                  onClick={() => {
                    setTargetWorkspaceForNewProject(selectedWorkspaceId || 'default');
                    setIsCreatingModal(true);
                  }}
                  className="h-8 px-4 bg-white text-black hover:bg-neutral-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map((p) => {
                const fileCount = p.stats?.fileCount || Object.keys(p.parsedFiles || {}).length;
                const relativeTime = formatRelativeTime(p.updatedAt);
                const assignedWsId = projectWorkspaceMap[p.id] || 'default';
                const assignedWs = workspaces.find((w) => w.id === assignedWsId);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isMobile && onOpenMobileWorkspaceNotice) {
                        onOpenProject(p);
                        onOpenMobileWorkspaceNotice();
                      } else {
                        onOpenProject(p);
                      }
                    }}
                    className="group relative border border-[#252525] hover:border-neutral-500 bg-[#181818] rounded-xl overflow-hidden cursor-pointer transition-all duration-150 flex flex-col hover:shadow-lg"
                  >
                    {/* Visual Card Preview */}
                    <div className="h-32 bg-[#1e1e1e] border-b border-[#252525] p-3 flex flex-col justify-between relative overflow-hidden group-hover:bg-[#202020] transition-colors">
                      {/* Top row in thumbnail */}
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[10px] bg-black/60 border border-white/10 px-2 py-0.5 rounded text-neutral-300 font-mono flex items-center gap-1 backdrop-blur-xs">
                          <Layers className="w-3 h-3 text-neutral-400" />
                          <span>{fileCount} files</span>
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(p.id, p.isStarred);
                          }}
                          className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                            p.isStarred ? 'text-white' : 'text-neutral-500 hover:text-white'
                          }`}
                          title={p.isStarred ? 'Unstar project' : 'Star project'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              p.isStarred ? 'fill-white text-white' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mock code card interior */}
                      <div className="z-10 flex items-center gap-1.5 opacity-40 group-hover:opacity-70 transition-opacity">
                        <div className="w-8 h-10 rounded border border-neutral-700 bg-neutral-900/80 flex flex-col p-1 gap-1">
                          <div className="w-full h-1 bg-neutral-600 rounded-xs" />
                          <div className="w-3/4 h-1 bg-neutral-700 rounded-xs" />
                          <div className="w-1/2 h-1 bg-neutral-700 rounded-xs" />
                        </div>
                        <div className="flex-1 h-10 rounded border border-neutral-700 bg-neutral-900/80 flex flex-col p-1.5 justify-between">
                          <div className="w-full h-1 bg-neutral-600 rounded-xs" />
                          <div className="w-5/6 h-1 bg-neutral-700 rounded-xs" />
                          <div className="w-2/3 h-1 bg-neutral-800 rounded-xs" />
                        </div>
                      </div>

                      <div className="z-10 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span className="truncate max-w-[120px]">
                          {assignedWs ? assignedWs.name : 'Default Workspace'}
                        </span>
                        <span>{relativeTime}</span>
                      </div>
                    </div>

                    {/* Card Body Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white truncate mb-0.5 group-hover:text-white">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {p.description || `Edited ${relativeTime}`}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#232323] relative">
                        <div className="flex items-center gap-1.5">
                          {isMobile ? (
                            <span className="text-[10px] text-neutral-400 flex items-center gap-1 group-hover:text-white transition-colors">
                              <span>Desktop Workspace</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1 group-hover:text-neutral-300 transition-colors">
                              <span>Open in editor</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {onDownloadProjectZip && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownloadProjectZip(p);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                              title="Download ZIP"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === p.id ? null : p.id);
                            }}
                            className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenuId === p.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />
                            <div className="absolute right-0 bottom-8 w-48 bg-[#1f1f1f] border border-[#2f2f2f] shadow-2xl py-1.5 z-50 text-xs rounded-md font-sans">
                              {onDownloadProjectZip && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    onDownloadProjectZip(p);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-white flex items-center gap-2 cursor-pointer font-semibold"
                                >
                                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Download ZIP</span>
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  onDuplicateProject(p);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-white flex items-center gap-2 cursor-pointer"
                              >
                                <Copy className="w-3 h-3 text-neutral-400" />
                                <span>Duplicate</span>
                              </button>

                              <div className="border-t border-[#2c2c2c] my-1" />

                              {/* Move to Workspace Submenu */}
                              <div className="px-3 py-1 text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                                <MoveRight className="w-3 h-3" />
                                <span>Move to Workspace</span>
                              </div>
                              {workspaces.map((ws) => (
                                <button
                                  key={ws.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveProjectToWorkspace(p.id, ws.id);
                                  }}
                                  className={`w-full text-left px-3 py-1 hover:bg-neutral-800 flex items-center justify-between text-xs cursor-pointer ${
                                    assignedWsId === ws.id ? 'text-white font-semibold' : 'text-neutral-300'
                                  }`}
                                >
                                  <span className="truncate">{ws.name}</span>
                                  {assignedWsId === ws.id && <Check className="w-3 h-3 text-white shrink-0" />}
                                </button>
                              ))}

                              <div className="border-t border-[#2c2c2c] my-1" />

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  onDeleteProject(p.id);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Create New Project */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-sans">
          <div className="bg-[#181818] border border-[#2f2f2f] w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden text-xs">
            <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1b1b1b]">
              <span className="font-semibold text-white text-xs">
                New Project
              </span>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Creation tabs: Paste Transcript / Upload Folder / Upload Files */}
            <div className="px-4 pt-3 border-b border-[#262626] flex items-center gap-4 bg-[#161616]">
              <button
                onClick={() => setCreateModeTab('transcript')}
                className={`pb-2 border-b-2 font-medium text-xs transition-colors cursor-pointer ${
                  createModeTab === 'transcript'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                Paste Transcript
              </button>
              <button
                onClick={() => {
                  setCreateModeTab('folder');
                  folderInputRef.current?.click();
                }}
                className={`pb-2 border-b-2 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  createModeTab === 'folder'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Upload Folder</span>
              </button>
              <button
                onClick={() => {
                  setCreateModeTab('files');
                  filesInputRef.current?.click();
                }}
                className={`pb-2 border-b-2 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  createModeTab === 'files'
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload Files</span>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3.5 flex-1 flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. My Next.js Web App"
                    className="w-full bg-[#111111] border border-[#2c2c2c] rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                    Target Workspace
                  </label>
                  <select
                    value={targetWorkspaceForNewProject}
                    onChange={(e) => setTargetWorkspaceForNewProject(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2c2c2c] rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-white cursor-pointer"
                  >
                    {workspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-neutral-400 font-medium">
                    Source Markdown / Transcript
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      browse folder
                    </button>
                    <span className="text-neutral-600">|</span>
                    <button
                      type="button"
                      onClick={() => filesInputRef.current?.click()}
                      className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      browse files
                    </button>
                  </div>
                </div>
                <textarea
                  value={newTranscript}
                  onChange={(e) => setNewTranscript(e.target.value)}
                  placeholder="Paste markdown transcript with file tree and code blocks..."
                  className="flex-1 w-full bg-[#111111] border border-[#2c2c2c] rounded-md p-3 text-white text-xs resize-none focus:outline-none focus:border-white leading-relaxed placeholder:text-neutral-600 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="h-8 px-4 border border-[#2c2c2c] rounded-md text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTranscript.trim()}
                  className={`h-8 px-4 rounded-md text-xs font-semibold transition-colors ${
                    newTranscript.trim()
                      ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
