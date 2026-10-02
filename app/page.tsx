'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  parseProjectFromText,
  ParsedProject,
  ProjectFile,
} from '@/lib/parser';
import {
  ProjectCheckpoint,
  getSavedCheckpoints,
  saveCheckpoint,
  mergePatchIntoCheckpoint,
} from '@/lib/checkpoints';
import { useResizable } from '@/hooks/use-resizable';
import { useAuth } from '@/src/context/AuthContext.tsx';
import { VSCodeTitleBar } from '@/components/VSCodeTitleBar';
import { VSCodeActivityBar, ActivityTab } from '@/components/VSCodeActivityBar';
import { VSCodeStatusBar } from '@/components/VSCodeStatusBar';
import { VSCodeBottomPanel } from '@/components/VSCodeBottomPanel';
import { InputPane } from '@/components/InputPane';
import { FileTree } from '@/components/FileTree';
import { FileViewer } from '@/components/FileViewer';
import { CheckpointModal } from '@/components/CheckpointModal';
import { ManifestModal } from '@/components/ManifestModal';
import { TreeModal } from '@/components/TreeModal';
import { ExportModal } from '@/components/ExportModal';
import { HelpModal } from '@/components/HelpModal';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';
import { SettingsModal, AppSettings } from '@/components/SettingsModal';
import { MobileDrawer } from '@/components/MobileDrawer';
import { FigmaProjectsDashboard, SavedProject } from '@/components/FigmaProjectsDashboard';
import { LandingPage } from '@/components/LandingPage';
import { processUploadedFiles } from '@/lib/folder-upload';
import { generateProjectZip, triggerBlobDownload } from '@/lib/zip';
import { FolderPlus, Upload, X, AlertCircle, Monitor, Download } from 'lucide-react';

export default function HomePage() {
  const { user, token } = useAuth();

  // Mobile screen responsiveness detection (<768px)
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [mobileWorkspaceNoticeOpen, setMobileWorkspaceNoticeOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Primary view mode: If user is logged in (has cookie or active session), default to 'projects' (home screen).
  // If not logged in, the first page they see is 'landing'!
  const [viewMode, setViewMode] = useState<'editor' | 'projects' | 'landing'>(() => {
    if (typeof window === 'undefined') return 'landing';
    const hasAuthCookie = document.cookie.split(';').some((c) => c.trim().startsWith('ilovefree_auth='));
    const hasCachedUser = Boolean(localStorage.getItem('repoextract_cached_user'));
    return (hasAuthCookie || hasCachedUser) ? 'projects' : 'landing';
  });

  // Strict mobile restriction: Workspace is desktop-only!
  // Synchronize during render without triggering react-hooks/set-state-in-effect
  const activeViewMode = (isMobileScreen && viewMode === 'editor') ? 'projects' : viewMode;

  // When user logs in, automatically show the home projects dashboard
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user && viewMode === 'landing') {
      setViewMode('projects');
    }
  }

  // Active project title entered by user (ensures "0x-alpha" is never shown unless user entered it)
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>('');

  // Currently loaded database project metadata (if any)
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);

  // Database projects list
  const [dbProjects, setDbProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Activity bar active item & primary side bar state
  const [activeActivityTab, setActiveActivityTab] = useState<ActivityTab>('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Split View mode: default FALSE so Source markdown is NOT constantly taking up the screen!
  const [splitView, setSplitView] = useState(false);

  // Mobile Drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Bottom Panel state (Problems & Diagnostics)
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);

  // Quick New Project Modal prompt state
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [quickProjectTitle, setQuickProjectTitle] = useState('');
  const [quickProjectTranscript, setQuickProjectTranscript] = useState('');

  // Unsaved changes tracking
  const [lastSavedTranscript, setLastSavedTranscript] = useState<string>('');
  const [unsavedWarningModalOpen, setUnsavedWarningModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Comprehensive Functional Settings
  const [appSettings, setAppSettings] = useState<AppSettings>({
    parserOptions: {
      stripCommonRoot: true,
      detectTruncations: true,
      cleanFirstLinePathComment: true,
      duplicateResolution: 'use_latest',
    },
    editorSettings: {
      showLineNumbers: true,
      wordWrap: true,
      fontSize: '12px',
    },
    includeAuditReport: true,
    includeMissingPlaceholders: true,
  });

  // Raw source text: starts empty! (No test sample bloat)
  const [rawText, setRawText] = useState<string>('');

  // Open file tabs in VS Code editor
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState<ProjectCheckpoint[]>(() => getSavedCheckpoints());
  const [activeBaselineCheckpoint, setActiveBaselineCheckpoint] = useState<ProjectCheckpoint | null>(null);

  // Modals & Overlays
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Manual in-browser file edits & additions
  const [manualFileEdits, setManualFileEdits] = useState<Record<string, string>>({});
  const [customFilePaths, setCustomFilePaths] = useState<Record<number, string>>({});
  const [manuallyCreatedFiles, setManuallyCreatedFiles] = useState<Record<string, ProjectFile>>({});
  const [manuallyDeletedPaths, setManuallyDeletedPaths] = useState<Set<string>>(new Set());

  // Mouse Resizable Splitters
  const {
    size: sidebarWidth,
    isDragging: isDraggingSidebar,
    startDrag: startDragSidebar,
  } = useResizable({
    initialSize: 260,
    minSize: 180,
    maxSize: 500,
    direction: 'horizontal',
  });

  const {
    size: sourcePaneWidth,
    isDragging: isDraggingSourceSplit,
    startDrag: startDragSourceSplit,
  } = useResizable({
    initialSize: 450,
    minSize: 260,
    maxSize: 850,
    direction: 'horizontal',
  });

  const {
    size: bottomPanelHeight,
    isDragging: isDraggingBottomPanel,
    startDrag: startDragBottomPanel,
  } = useResizable({
    initialSize: 240,
    minSize: 120,
    maxSize: 600,
    direction: 'vertical',
    reverse: true,
  });

  const refreshCheckpoints = useCallback(() => {
    setCheckpoints(getSavedCheckpoints());
  }, []);

  // Fetch projects from PostgreSQL database (or per-tab sessionStorage for guest users)
  const fetchProjects = useCallback(async () => {
    if (!token) {
      try {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
        if (stored) {
          const parsed: SavedProject[] = JSON.parse(stored);
          setDbProjects(parsed);
        } else {
          setDbProjects([]);
        }
      } catch {
        setDbProjects([]);
      }
      return;
    }
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDbProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects from database:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      Promise.resolve().then(() => {
        if (isMounted) {
          try {
            const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
            if (stored) {
              setDbProjects(JSON.parse(stored));
            } else {
              setDbProjects([]);
            }
          } catch {
            setDbProjects([]);
          }
        }
      });
      return () => {
        isMounted = false;
      };
    }

    (async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setDbProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch projects from database:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Keyboard shortcut listener for Ctrl+Shift+F (search), Ctrl+, (settings), Ctrl+P, Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewProjectModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Deterministic Project Parsing & Checkpoint Patching
  const parsedProject: ParsedProject = useMemo(() => {
    const project = parseProjectFromText(rawText, appSettings.parserOptions);

    // Manual block assignments
    Object.entries(customFilePaths).forEach(([blockIdxStr, targetPath]) => {
      const blockIdx = parseInt(blockIdxStr, 10);
      const block = project.codeBlocks.find((b) => b.index === blockIdx);
      if (block) {
        block.extractedPath = targetPath;
        block.resolvedPath = targetPath;
        block.status = 'assigned';
        block.confidence = 'high';
        block.matchReason = 'fence_attribute';

        if (!project.files[targetPath]) {
          project.files[targetPath] = {
            path: targetPath,
            content: block.content,
            language: 'text',
            sourceBlockIndices: [blockIdx],
            isFromTree: false,
            isMissingContent: false,
            isDuplicate: false,
            hasTruncationWarning: false,
            truncationNotes: [],
            sizeBytes: new TextEncoder().encode(block.content).length,
            lineCount: block.content.split('\n').length,
          };
        }
      }
    });

    // Checkpoint baseline patch merge
    if (activeBaselineCheckpoint && Object.keys(project.files).length > 0) {
      const { merged, updatedPaths, newPaths } = mergePatchIntoCheckpoint(
        activeBaselineCheckpoint.files,
        project.files
      );

      [...updatedPaths, ...newPaths].forEach((p) => {
        if (merged[p]) {
          merged[p].isPatched = true;
        }
      });

      project.files = merged;
    }

    // Apply manual edits
    Object.entries(manualFileEdits).forEach(([path, newContent]) => {
      if (project.files[path]) {
        project.files[path].content = newContent;
        project.files[path].isMissingContent = false;
        project.files[path].sizeBytes = new TextEncoder().encode(newContent).length;
        project.files[path].lineCount = newContent.split('\n').length;
      }
    });

    // Apply manual created files
    Object.entries(manuallyCreatedFiles).forEach(([path, file]) => {
      project.files[path] = file;
    });

    // Apply manual deletions
    manuallyDeletedPaths.forEach((path) => {
      delete project.files[path];
    });

    return project;
  }, [
    rawText,
    appSettings.parserOptions,
    customFilePaths,
    activeBaselineCheckpoint,
    manualFileEdits,
    manuallyCreatedFiles,
    manuallyDeletedPaths,
  ]);

  // Ensure active selected path
  const activePath = useMemo(() => {
    if (selectedFilePath && parsedProject.files[selectedFilePath]) {
      return selectedFilePath;
    }
    const firstKey = Object.keys(parsedProject.files)[0];
    return firstKey || null;
  }, [selectedFilePath, parsedProject.files]);

  const activeFile = activePath ? parsedProject.files[activePath] : null;

  // Effective open file tabs (derived state)
  const effectiveOpenFiles = useMemo(() => {
    if (activePath && !openFiles.includes(activePath)) {
      return [...openFiles, activePath];
    }
    return openFiles.length > 0 ? openFiles : activePath ? [activePath] : [];
  }, [activePath, openFiles]);

  const handleSelectFile = useCallback((path: string) => {
    setSelectedFilePath(path);
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
    setActiveActivityTab('explorer');
  }, [openFiles]);

  const handleCloseTab = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((p) => p !== path);
      if (selectedFilePath === path) {
        setSelectedFilePath(filtered[filtered.length - 1] || null);
      }
      return filtered;
    });
  }, [selectedFilePath]);

  const handleClear = () => {
    setRawText('');
    setLastSavedTranscript('');
    setCurrentProject(null);
    setActiveProjectTitle('');
    setManualFileEdits({});
    setCustomFilePaths({});
    setManuallyCreatedFiles({});
    setManuallyDeletedPaths(new Set());
    setSelectedFilePath(null);
    setOpenFiles([]);
    setActiveBaselineCheckpoint(null);
  };

  const handleUpdateFileContent = useCallback((path: string, newContent: string) => {
    setManualFileEdits((prev) => ({
      ...prev,
      [path]: newContent,
    }));
  }, []);

  const handleRenameFile = useCallback((oldPath: string, newPath: string) => {
    if (parsedProject.files[oldPath]) {
      const existing = parsedProject.files[oldPath];
      setManuallyDeletedPaths((prev) => new Set([...prev, oldPath]));
      setManuallyCreatedFiles((prev) => ({
        ...prev,
        [newPath]: {
          ...existing,
          path: newPath,
        },
      }));
      setOpenFiles((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
      setSelectedFilePath(newPath);
    }
  }, [parsedProject.files]);

  const handleCreateFile = useCallback((path: string) => {
    setManuallyCreatedFiles((prev) => ({
      ...prev,
      [path]: {
        path,
        content: `// New file: ${path}\n`,
        language: 'text',
        sourceBlockIndices: [],
        isFromTree: false,
        isMissingContent: false,
        isDuplicate: false,
        hasTruncationWarning: false,
        truncationNotes: [],
        sizeBytes: 15,
        lineCount: 2,
      },
    }));
    handleSelectFile(path);
  }, [handleSelectFile]);

  const handleDeleteFile = useCallback((path: string) => {
    setManuallyDeletedPaths((prev) => new Set([...prev, path]));
    setOpenFiles((prev) => prev.filter((p) => p !== path));
    if (selectedFilePath === path) {
      setSelectedFilePath(null);
    }
  }, [selectedFilePath]);

  const handleAssignBlockPath = useCallback((blockIndex: number, targetPath: string) => {
    setCustomFilePaths((prev) => ({
      ...prev,
      [blockIndex]: targetPath,
    }));
    handleSelectFile(targetPath);
  }, [handleSelectFile]);

  const handleRestoreCheckpoint = useCallback((cp: ProjectCheckpoint) => {
    setActiveBaselineCheckpoint(cp);
    setManualFileEdits({});
    setCustomFilePaths({});
    setManuallyCreatedFiles({});
    setManuallyDeletedPaths(new Set());
    setRawText('');
    const firstPath = Object.keys(cp.files)[0] || null;
    setSelectedFilePath(firstPath);
    setOpenFiles(firstPath ? [firstPath] : []);
    setActiveActivityTab('explorer');
  }, []);

  // Quick Direct File Upload
  const handleDirectUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = (event.target?.result as string) || '';
      handleClear();
      setRawText(content);
      setLastSavedTranscript(content);
      setViewMode('editor');
      setActiveActivityTab('explorer');

      // If user is logged in, save to database; if guest, save to per-tab sessionStorage
      if (token && content.trim()) {
        const parsed = parseProjectFromText(content, appSettings.parserOptions);
        try {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: fileName || 'Uploaded Project',
              rawTranscript: content,
              parsedFiles: parsed.files,
              stats: {
                fileCount: Object.keys(parsed.files).length,
                totalBytes: parsed.stats.totalBytes,
                totalBlocks: parsed.stats.totalCodeBlocks,
                lineCount: parsed.stats.totalLines,
              },
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentProject(data.project);
            fetchProjects();
          }
        } catch (err) {
          console.error('Failed to auto-save uploaded project to database:', err);
        }
      } else if (!token && content.trim()) {
        const parsed = parseProjectFromText(content, appSettings.parserOptions);
        const guestProject: SavedProject = {
          id: Date.now(),
          userId: 'guest',
          title: fileName || 'Uploaded Project',
          rawTranscript: content,
          parsedFiles: parsed.files,
          stats: {
            fileCount: Object.keys(parsed.files).length,
            totalBytes: parsed.stats.totalBytes,
            totalBlocks: parsed.stats.totalCodeBlocks,
            lineCount: parsed.stats.totalLines,
          },
          isStarred: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentProject(guestProject);
        setActiveProjectTitle(guestProject.title);
        try {
          const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
          const existing: SavedProject[] = stored ? JSON.parse(stored) : [];
          const updated = [guestProject, ...existing.filter((p) => p.id !== guestProject.id)];
          sessionStorage.setItem('ilovefree_guest_projects', JSON.stringify(updated));
          setDbProjects(updated);
        } catch (err) {
          console.error('Failed to save guest project to sessionStorage:', err);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Open Project from Figma-style Dashboard
  const handleOpenProject = (project: SavedProject) => {
    handleClear();
    setCurrentProject(project);
    setActiveProjectTitle(project.title);
    setRawText(project.rawTranscript);
    setLastSavedTranscript(project.rawTranscript);
    if (isMobileScreen) {
      setMobileWorkspaceNoticeOpen(true);
    } else {
      setViewMode('editor');
      setActiveActivityTab('explorer');
    }
  };

  // Create Project from Dashboard modal
  const handleCreateNewProject = async (title: string, transcript: string) => {
    handleClear();
    const finalTitle = title.trim() || 'New Project';
    setActiveProjectTitle(finalTitle);
    setRawText(transcript);
    setLastSavedTranscript(transcript);
    const parsed = parseProjectFromText(transcript, appSettings.parserOptions);

    // Provide local state for guests so project title and files are immediately reflected
    const localProject: SavedProject = {
      id: Date.now(),
      userId: user?.uid || 'guest',
      title: finalTitle,
      rawTranscript: transcript,
      parsedFiles: parsed.files,
      stats: {
        fileCount: Object.keys(parsed.files).length,
        totalBytes: parsed.stats.totalBytes,
        totalBlocks: parsed.stats.totalCodeBlocks,
        lineCount: parsed.stats.totalLines,
      },
      isStarred: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(localProject);

    if (token) {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: finalTitle,
            rawTranscript: transcript,
            parsedFiles: parsed.files,
            stats: {
              fileCount: Object.keys(parsed.files).length,
              totalBytes: parsed.stats.totalBytes,
              totalBlocks: parsed.stats.totalCodeBlocks,
              lineCount: parsed.stats.totalLines,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentProject(data.project);
          setActiveProjectTitle(data.project.title);
          fetchProjects();
        }
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    } else {
      // Guest User: Save to sessionStorage (automatically wiped when tab closes)
      try {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
        const existing: SavedProject[] = stored ? JSON.parse(stored) : [];
        const updated = [localProject, ...existing.filter((p) => p.id !== localProject.id)];
        sessionStorage.setItem('ilovefree_guest_projects', JSON.stringify(updated));
        setDbProjects(updated);
      } catch (err) {
        console.error('Failed to save guest project to sessionStorage:', err);
      }
    }
    if (isMobileScreen) {
      setMobileWorkspaceNoticeOpen(true);
    } else {
      setViewMode('editor');
      setActiveActivityTab('explorer');
    }
  };

  // Upload folder or multiple files directly into a project
  const handleUploadFolderOrFiles = async (files: FileList) => {
    try {
      const result = await processUploadedFiles(files);
      setActiveProjectTitle(result.title);
      await handleCreateNewProject(result.title, result.transcript);
    } catch (err) {
      console.warn('Folder/files upload notice:', err);
    }
  };

  // Unsaved changes check & safe navigation
  const isSourceModified = Boolean(
    rawText.trim() && rawText.trim() !== (lastSavedTranscript || '').trim()
  );

  const handleSaveCurrentVersion = (name?: string) => {
    const fileEntries = Object.keys(parsedProject.files);
    if (fileEntries.length === 0) return;
    const saveName = name?.trim() || `Version ${checkpoints.length + 1} (${fileEntries.length} files)`;
    const newCp = saveCheckpoint(saveName, parsedProject.files);
    setActiveBaselineCheckpoint(newCp);
    refreshCheckpoints();
    setLastSavedTranscript(rawText);
  };

  const handleSafeNavigate = (action: () => void) => {
    if (isSourceModified) {
      setPendingAction(() => action);
      setUnsavedWarningModalOpen(true);
    } else {
      action();
    }
  };

  // Delete project from database or guest sessionStorage
  const handleDeleteDbProject = async (id: number) => {
    if (!token) {
      try {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
        const existing: SavedProject[] = stored ? JSON.parse(stored) : [];
        const updated = existing.filter((p) => p.id !== id);
        sessionStorage.setItem('ilovefree_guest_projects', JSON.stringify(updated));
        setDbProjects(updated);
        if (currentProject?.id === id) {
          handleClear();
        }
      } catch (err) {
        console.error('Failed to delete guest project:', err);
      }
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        if (currentProject?.id === id) {
          handleClear();
        }
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Toggle star
  const handleToggleStar = async (id: number, currentStar: number) => {
    const newStar = currentStar === 1 ? 0 : 1;
    if (!token) {
      try {
        const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ilovefree_guest_projects') : null;
        const existing: SavedProject[] = stored ? JSON.parse(stored) : [];
        const updated = existing.map((p) => (p.id === id ? { ...p, isStarred: newStar } : p));
        sessionStorage.setItem('ilovefree_guest_projects', JSON.stringify(updated));
        setDbProjects(updated);
      } catch (err) {
        console.error('Failed to toggle star for guest project:', err);
      }
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isStarred: newStar }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to star project:', err);
    }
  };

  // Duplicate project
  const handleDuplicateProject = async (project: SavedProject) => {
    await handleCreateNewProject(`${project.title} (Copy)`, project.rawTranscript);
  };

  // Handle submit from quick modal
  const handleQuickNewProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProjectTranscript.trim()) return;
    const title = quickProjectTitle.trim() || 'New Project';
    await handleCreateNewProject(title, quickProjectTranscript);
    setQuickProjectTitle('');
    setQuickProjectTranscript('');
    setNewProjectModalOpen(false);
  };

  const totalFilesCount = Object.keys(parsedProject.files).length;
  const errorCount = parsedProject.diagnostics.filter((d) => d.severity === 'error').length;
  const warningCount = parsedProject.diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-white selection:bg-white selection:text-black font-mono overflow-hidden">
      {/* 1. VS Code Title Bar - ONLY visible in editor mode, hidden completely in projects mode */}
      {activeViewMode === 'editor' && (
        <VSCodeTitleBar
          splitView={splitView}
          onToggleSplitView={() => setSplitView(!splitView)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          bottomPanelOpen={bottomPanelOpen}
          onToggleBottomPanel={() => setBottomPanelOpen(!bottomPanelOpen)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onClear={handleClear}
          onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenManifest={() => setIsManifestOpen(true)}
          onOpenTree={() => setIsTreeModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          onNewProjectPrompt={() => setNewProjectModalOpen(true)}
          onUploadFolder={handleUploadFolderOrFiles}
          onUploadFiles={handleUploadFolderOrFiles}
          currentProjectTitle={activeProjectTitle || currentProject?.title || 'Project'}
          filesCount={totalFilesCount}
        />
      )}

      {/* Main Switcher: Landing Page vs Figma Projects Gallery vs VS Code Editor */}
      {activeViewMode === 'landing' ? (
        <LandingPage
          onTryNow={() => setViewMode('projects')}
          onSignInSuccess={() => setViewMode('projects')}
        />
      ) : activeViewMode === 'projects' ? (
        <FigmaProjectsDashboard
          projects={dbProjects}
          isLoading={loadingProjects}
          onOpenProject={handleOpenProject}
          onCreateNewProject={handleCreateNewProject}
          onDeleteProject={handleDeleteDbProject}
          onToggleStar={handleToggleStar}
          onDuplicateProject={handleDuplicateProject}
          onOpenEditorDirectly={() => {
            if (isMobileScreen) {
              setMobileWorkspaceNoticeOpen(true);
            } else {
              setViewMode('editor');
            }
          }}
          onDirectUploadFile={handleDirectUploadFile}
          onUploadFolderOrFiles={handleUploadFolderOrFiles}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onGoToLanding={() => setViewMode('landing')}
          isMobile={isMobileScreen}
          onOpenMobileWorkspaceNotice={() => setMobileWorkspaceNoticeOpen(true)}
          onDownloadProjectZip={async (proj) => {
            try {
              const res = await generateProjectZip(proj.parsedFiles, {
                projectName: proj.title,
                includeAuditReport: true,
                includeMissingPlaceholders: true,
                diagnostics: [],
              });
              triggerBlobDownload(res.blob, res.fileName);
            } catch (err) {
              console.error('Failed to download project zip:', err);
            }
          }}
        />
      ) : (
        /* 2. Main VS Code Workbench Area */
        <div className="flex-1 flex min-h-0 overflow-hidden relative p-2 pt-1.5 pb-1.5 gap-2 bg-[#09090b]">
          {/* Activity Bar (Slim left bar, NO search icon bloat!) */}
          <div className="hidden md:flex h-full shrink-0">
            <VSCodeActivityBar
              activeTab={activeActivityTab}
              sidebarOpen={sidebarOpen}
              onSelectTab={(tab) => {
                if (tab === 'checkpoints') {
                  setIsCheckpointModalOpen(true);
                } else if (tab === 'audits') {
                  setBottomPanelOpen(true);
                } else {
                  if (activeActivityTab === tab && sidebarOpen) {
                    setSidebarOpen(false);
                  } else {
                    setActiveActivityTab(tab);
                    setSidebarOpen(true);
                  }
                }
              }}
              errorCount={errorCount}
              warningCount={warningCount}
              checkpointCount={checkpoints.length}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
              onToggleProjectsView={() => handleSafeNavigate(() => setViewMode('projects'))}
            />
          </div>

          {/* Primary Side Bar (File Explorer or Source Section) - Gutter div removed as requested */}
          {sidebarOpen && (
            <div
              style={{ width: `${sidebarWidth}px` }}
              className="h-full shrink-0 flex flex-col bg-[#141418] border border-[#24242c] rounded-xl overflow-hidden shadow-xs"
            >
              {activeActivityTab === 'explorer' && (
                <FileTree
                  files={parsedProject.files}
                  selectedPath={activePath}
                  onSelectFile={handleSelectFile}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleDeleteFile}
                  onUploadTranscript={() => setNewProjectModalOpen(true)}
                  projectTitle={activeProjectTitle || currentProject?.title || 'Project'}
                />
              )}

              {activeActivityTab === 'source' && (
                <div className="h-full flex flex-col p-4 bg-[#141418] text-xs space-y-3">
                  <div className="text-[11px] uppercase font-bold text-white">
                    Source Markdown Section
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    The source markdown is kept isolated here so it does not clutter your main project code editor.
                  </p>
                  <button
                    onClick={() => {
                      setSplitView(true);
                      setActiveActivityTab('explorer');
                    }}
                    className="w-full py-2 px-3 bg-[#1e1e24] border border-[#2b2b36] rounded-md text-white font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer"
                  >
                    Open in Side-by-Side Split View
                  </button>
                  <button
                    onClick={() => setNewProjectModalOpen(true)}
                    className="w-full py-2 px-3 border border-[#2b2b36] rounded-md text-neutral-300 hover:text-white transition-colors uppercase cursor-pointer"
                  >
                    Upload New Transcript
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Center Editor Stage & Bottom Panel Container */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden gap-2">
            {/* Main Editors Row */}
            <div className="flex-1 flex min-h-0 overflow-hidden gap-2">
              {/* If active tab is 'source' without split view, show source in the main stage */}
              {activeActivityTab === 'source' && !splitView ? (
                <div className="flex-1 h-full min-w-0 flex flex-col bg-[#18181c] border border-[#24242c] rounded-xl overflow-hidden shadow-xs">
                  <InputPane
                    rawText={rawText}
                    onChangeText={setRawText}
                    onReparse={() => {
                      setManualFileEdits({});
                      setCustomFilePaths({});
                    }}
                    activeCheckpoint={activeBaselineCheckpoint}
                    onClearActiveBaseline={() => setActiveBaselineCheckpoint(null)}
                    onSwitchToFilesView={() => setActiveActivityTab('explorer')}
                    filesCount={totalFilesCount}
                    hasUnsavedChanges={isSourceModified}
                    onSaveVersion={() => setIsCheckpointModalOpen(true)}
                  />
                </div>
              ) : (
                <>
                  {/* Optional Split View: Only when user explicitly enables it! */}
                  {splitView && (
                    <>
                      <div
                        style={{ width: `${sourcePaneWidth}px` }}
                        className="h-full shrink-0 flex flex-col bg-[#18181c] border border-[#24242c] rounded-xl overflow-hidden shadow-xs"
                      >
                        <InputPane
                          rawText={rawText}
                          onChangeText={setRawText}
                          onReparse={() => {
                            setManualFileEdits({});
                            setCustomFilePaths({});
                          }}
                          activeCheckpoint={activeBaselineCheckpoint}
                          onClearActiveBaseline={() => setActiveBaselineCheckpoint(null)}
                          onSwitchToFilesView={() => setSplitView(false)}
                          filesCount={totalFilesCount}
                          hasUnsavedChanges={isSourceModified}
                          onSaveVersion={() => setIsCheckpointModalOpen(true)}
                        />
                      </div>

                      {/* Mouse Draggable Gutter / Splitter between Source & File Preview */}
                      <div
                        onMouseDown={startDragSourceSplit}
                        className={`w-2 h-full cursor-col-resize z-20 shrink-0 select-none flex items-center justify-center group ${
                          isDraggingSourceSplit ? 'pointer-events-auto' : ''
                        }`}
                        title="Drag to resize Source and Project sections"
                      >
                        <div
                          className={`w-[2px] h-8 rounded-full transition-colors ${
                            isDraggingSourceSplit ? 'bg-white h-full' : 'bg-transparent group-hover:bg-neutral-600'
                          }`}
                        />
                      </div>
                    </>
                  )}

                  {/* Right Editor Pane: Project File Viewer & Code Editor */}
                  <div className="flex-1 h-full min-w-0 flex flex-col bg-[#18181c] border border-[#24242c] rounded-xl overflow-hidden shadow-xs">
                    <FileViewer
                      key={activePath || 'none'}
                      file={activeFile}
                      openFiles={effectiveOpenFiles}
                      activePath={activePath}
                      onSelectFile={handleSelectFile}
                      onCloseTab={handleCloseTab}
                      onUpdateContent={handleUpdateFileContent}
                      onRenamePath={handleRenameFile}
                      onUploadTranscript={() => setNewProjectModalOpen(true)}
                      onOpenSource={() => {
                        setActiveActivityTab('source');
                        setSplitView(false);
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Panel (Problems showing exact code blocks, Output, Tree, Checkpoints) */}
            {bottomPanelOpen && (
              <>
                <div
                  onMouseDown={startDragBottomPanel}
                  className={`h-2 w-full cursor-row-resize z-20 shrink-0 select-none flex items-center justify-center group -mt-1 -mb-1 ${
                    isDraggingBottomPanel ? 'pointer-events-auto' : ''
                  }`}
                  title="Drag to resize bottom panel"
                >
                  <div
                    className={`h-[2px] w-12 rounded-full transition-colors ${
                      isDraggingBottomPanel ? 'bg-white w-full' : 'bg-transparent group-hover:bg-neutral-600'
                    }`}
                  />
                </div>

                <div
                  style={{ height: `${bottomPanelHeight}px` }}
                  className="w-full shrink-0 bg-[#141418] border border-[#24242c] rounded-xl overflow-hidden shadow-xs"
                >
                  <VSCodeBottomPanel
                    isOpen={bottomPanelOpen}
                    onClose={() => setBottomPanelOpen(false)}
                    diagnostics={parsedProject.diagnostics}
                    files={parsedProject.files}
                    codeBlocks={parsedProject.codeBlocks}
                    treeDeclaredPaths={parsedProject.treeDeclaredPaths}
                    rootPrefix={parsedProject.rootFolderPrefix}
                    checkpoints={checkpoints}
                    activeCheckpoint={activeBaselineCheckpoint}
                    onSelectFile={handleSelectFile}
                    onAssignBlockPath={handleAssignBlockPath}
                    onRestoreCheckpoint={handleRestoreCheckpoint}
                    onSetActiveBaseline={setActiveBaselineCheckpoint}
                    onOpenCheckpointModal={() => setIsCheckpointModalOpen(true)}
                    onJumpToSource={() => {
                      setActiveActivityTab('source');
                      setSplitView(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. VS Code Status Bar - ONLY visible in editor mode, flush edge-to-edge with no pill borders */}
      {activeViewMode === 'editor' && (
        <div className="w-full shrink-0 bg-[#09090b]">
          <VSCodeStatusBar
            activeCheckpoint={activeBaselineCheckpoint}
            errorCount={errorCount}
            warningCount={warningCount}
            activeLanguage={activeFile?.language || 'plaintext'}
            activeLinesCount={activeFile?.lineCount || 0}
            activeBytesCount={activeFile?.sizeBytes || 0}
            onToggleBottomPanel={() => setBottomPanelOpen(!bottomPanelOpen)}
            onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
          />
        </div>
      )}

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filesCount={totalFilesCount}
        errorCount={errorCount}
        warningCount={warningCount}
        checkpointCount={checkpoints.length}
        onSelectView={(view) => {
          if (view === 'projects') {
            handleSafeNavigate(() => setViewMode('projects'));
          } else {
            if (isMobileScreen) {
              setMobileWorkspaceNoticeOpen(true);
            } else {
              setViewMode('editor');
              setActiveActivityTab(view === 'files' ? 'explorer' : 'source');
              setSplitView(false);
            }
          }
        }}
        onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
        onOpenAudits={() => setBottomPanelOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewProjectPrompt={() => setNewProjectModalOpen(true)}
        onClear={handleClear}
      />

      {/* Quick New Project / Upload Transcript Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-neutral-700 w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#141414]">
              <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-white" />
                <span>New Project from Transcript</span>
              </span>
              <button
                onClick={() => setNewProjectModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickNewProjectSubmit} className="p-4 space-y-3 flex-1 flex flex-col">
              <div>
                <label className="block text-[11px] text-neutral-400 uppercase font-bold mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={quickProjectTitle}
                  onChange={(e) => setQuickProjectTitle(e.target.value)}
                  placeholder="e.g. My Next.js Web App"
                  className="w-full bg-black border border-neutral-700 rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-white"
                  autoFocus
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-neutral-400 uppercase font-bold">
                    Source Markdown / Transcript
                  </label>
                  <label className="text-[11px] text-white hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload .md file instead</span>
                    <input
                      type="file"
                      accept=".md,.txt,.markdown,.log"
                      className="hidden"
                      onChange={(e) => {
                        handleDirectUploadFile(e);
                        setNewProjectModalOpen(false);
                      }}
                    />
                  </label>
                </div>
                <textarea
                  value={quickProjectTranscript}
                  onChange={(e) => setQuickProjectTranscript(e.target.value)}
                  placeholder={`Paste full project transcript here...
e.g.
my-app/
├── package.json
└── src/index.ts

\`\`\`json package.json
{ "name": "my-app" }
\`\`\`
`}
                  className="flex-1 w-full bg-black border border-neutral-700 rounded-md p-3 text-white text-xs resize-none focus:outline-none focus:border-white leading-relaxed placeholder:text-neutral-600 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="h-8 px-4 border border-neutral-700 rounded-md text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickProjectTranscript.trim()}
                  className={`h-8 px-4 rounded-md text-xs font-semibold uppercase transition-colors ${
                    quickProjectTranscript.trim()
                      ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  Parse & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Search Modal across all project files */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        files={parsedProject.files}
        onSelectResult={(filePath) => handleSelectFile(filePath)}
      />

      {/* Preferences & Settings Modal - Desktop Only */}
      <SettingsModal
        isOpen={isSettingsOpen && !isMobileScreen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onUpdateSettings={setAppSettings}
      />

      {/* Checkpoints & Patches Manager */}
      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        checkpoints={checkpoints}
        activeCheckpoint={activeBaselineCheckpoint}
        currentFiles={parsedProject.files}
        onRestoreCheckpoint={handleRestoreCheckpoint}
        onSetActiveBaseline={setActiveBaselineCheckpoint}
        onRefreshCheckpoints={refreshCheckpoints}
        onVersionSaved={() => setLastSavedTranscript(rawText)}
      />

      {/* Code Blocks Manifest */}
      <ManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        codeBlocks={parsedProject.codeBlocks}
        onSelectFile={handleSelectFile}
        onAssignBlockPath={handleAssignBlockPath}
      />

      {/* Structure Tree Matcher */}
      <TreeModal
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        treeDeclaredPaths={parsedProject.treeDeclaredPaths}
        files={parsedProject.files}
        rootPrefix={parsedProject.rootFolderPrefix}
        onSelectFile={handleSelectFile}
      />

      {/* Package & Download ZIP */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        files={parsedProject.files}
        diagnostics={parsedProject.diagnostics}
        defaultProjectName={
          activeProjectTitle || currentProject?.title || parsedProject.rootFolderPrefix || 'project-bundle'
        }
      />

      {/* Documentation & Specs */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Mobile Workspace Restriction Popup */}
      {mobileWorkspaceNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono text-xs">
          <div className="bg-[#141418] border border-[#2a2a34] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#1c1c24] border border-[#2e2e3c] flex items-center justify-center mx-auto text-white shadow-inner">
              <Monitor className="w-6 h-6 text-[#3b82f6]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Open in Desktop to Access Workspace
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                The full multi-pane VS Code studio and code editor require a desktop screen. On mobile, you can upload transcripts and download your complete generated ZIP bundle directly.
              </p>
            </div>

            {totalFilesCount > 0 && (
              <div className="bg-[#0e0e12] border border-[#202028] p-3 rounded-xl flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-white truncate text-xs">
                    {activeProjectTitle || currentProject?.title || 'Project Bundle'}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-sans">
                    {totalFilesCount} files extracted
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileWorkspaceNoticeOpen(false);
                    setIsExportOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ZIP</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              {totalFilesCount > 0 ? (
                <button
                  onClick={() => {
                    setMobileWorkspaceNoticeOpen(false);
                    setIsExportOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download ZIP</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileWorkspaceNoticeOpen(false);
                    setNewProjectModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Upload Transcript</span>
                </button>
              )}

              <button
                onClick={() => setMobileWorkspaceNoticeOpen(false)}
                className="w-full py-2 px-4 border border-[#2e2e38] hover:border-neutral-500 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Source Warning Modal */}
      {unsavedWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono text-xs">
          <div className="bg-[#141414] border border-amber-500/70 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Unsaved Source Changes
              </h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              You have modified the project source transcript without saving a version snapshot.
              Would you like to save this version before leaving?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setUnsavedWarningModalOpen(false);
                  setPendingAction(null);
                }}
                className="w-full sm:w-auto h-8 px-3 border border-neutral-700 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnsavedWarningModalOpen(false);
                  if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                  }
                }}
                className="w-full sm:w-auto h-8 px-3 border border-neutral-700 text-neutral-300 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                Discard & Leave
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCurrentVersion();
                  setUnsavedWarningModalOpen(false);
                  if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                  }
                }}
                className="w-full sm:w-auto h-8 px-3.5 bg-white text-black hover:bg-neutral-200 font-semibold uppercase rounded-md transition-colors cursor-pointer"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
