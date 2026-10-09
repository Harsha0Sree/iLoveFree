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
import { useAuth } from '@/src/context/AuthContext';
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
import { FigmaProjectsDashboard, SavedProject, DEFAULT_WORKSPACES } from '@/components/FigmaProjectsDashboard';
import { NewProjectModal } from '@/components/NewProjectModal';
import { LandingPage } from '@/components/LandingPage';
import { processUploadedFiles } from '@/lib/folder-upload';
import { generateProjectZip, triggerBlobDownload } from '@/lib/zip';
import {
  getGuestProjects,
  saveGuestProject,
  deleteGuestProject,
  toggleGuestProjectStar,
} from '@/lib/guest-storage';
import { FolderPlus, Upload, X, AlertCircle, Monitor, Download, AlertTriangle, FileUp } from 'lucide-react';

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
  const [bottomPanelTab, setBottomPanelTab] = useState<'problems' | 'output' | 'terminal' | 'ports' | 'checkpoints'>('problems');

  // Quick New Project Modal prompt state
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [quickProjectTitle, setQuickProjectTitle] = useState('');
  const [quickProjectTranscript, setQuickProjectTranscript] = useState('');
  const [newProjectStagedFiles, setNewProjectStagedFiles] = useState<Record<string, ProjectFile>>({});

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

  // Fetch projects from PostgreSQL database (or IndexedDB/sessionStorage for guest users)
  const fetchProjects = useCallback(async () => {
    if (!token) {
      try {
        const guestProjects = await getGuestProjects();
        setDbProjects(guestProjects);
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
      getGuestProjects().then((projs) => {
        if (isMounted) setDbProjects(projs);
      }).catch(() => {
        if (isMounted) setDbProjects([]);
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

  const [clearWorkspaceModalOpen, setClearWorkspaceModalOpen] = useState(false);
  const [dontAskClearAgain, setDontAskClearAgain] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [dontAskDeleteFileAgain, setDontAskDeleteFileAgain] = useState(false);

  const handleClear = (wipeSavedProject: boolean = true) => {
    if (currentProject && wipeSavedProject) {
      const clearedProj: SavedProject = {
        ...currentProject,
        rawTranscript: '',
        parsedFiles: {},
        stats: {
          fileCount: 0,
          totalBytes: 0,
          totalBlocks: 0,
          lineCount: 0,
        },
        updatedAt: new Date().toISOString(),
      };

      setDbProjects((prev) =>
        prev.map((p) => (p.id === currentProject.id ? clearedProj : p))
      );

      if (token) {
        fetch(`/api/projects/${currentProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: currentProject.title,
            rawTranscript: '',
            parsedFiles: {},
            stats: clearedProj.stats,
          }),
        }).catch((err) => console.error('Failed to clear project on server:', err));
      } else {
        saveGuestProject(clearedProj)
          .then((updated) => setDbProjects(updated))
          .catch((err) => console.error('Failed to clear guest project in storage:', err));
      }
    }

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

  const handleRequestClearWorkspace = () => {
    const isSuppressed =
      typeof window !== 'undefined' &&
      localStorage.getItem('ilovefree_suppress_clear_warning') === 'true';
    const hasContent = Boolean(
      rawText.trim() ||
      Object.keys(parsedProject.files).length > 0 ||
      currentProject
    );

    if (isSuppressed || !hasContent) {
      handleClear();
    } else {
      setClearWorkspaceModalOpen(true);
    }
  };

  const handleConfirmClearWorkspace = () => {
    if (dontAskClearAgain && typeof window !== 'undefined') {
      localStorage.setItem('ilovefree_suppress_clear_warning', 'true');
    }
    handleClear();
    setClearWorkspaceModalOpen(false);
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

  const handleRequestDeleteFile = useCallback((path: string) => {
    const isSuppressed =
      typeof window !== 'undefined' &&
      localStorage.getItem('ilovefree_suppress_delete_file_warning') === 'true';
    if (isSuppressed) {
      handleDeleteFile(path);
    } else {
      setFileToDelete(path);
    }
  }, [handleDeleteFile]);

  const handleConfirmDeleteFile = () => {
    if (!fileToDelete) return;
    if (dontAskDeleteFileAgain && typeof window !== 'undefined') {
      localStorage.setItem('ilovefree_suppress_delete_file_warning', 'true');
    }
    handleDeleteFile(fileToDelete);
    setFileToDelete(null);
  };

  const handleAppendFilesToCurrentProject = async (files: FileList | File[]) => {
    try {
      const result = await processUploadedFiles(files);
      const newFiles = result.files;
      if (!newFiles || Object.keys(newFiles).length === 0) return;

      // Append into manuallyCreatedFiles
      setManuallyCreatedFiles((prev) => ({
        ...prev,
        ...newFiles,
      }));

      // Focus the first added file immediately
      const firstNewPath = Object.keys(newFiles)[0];
      if (firstNewPath) {
        setSelectedFilePath(firstNewPath);
        setOpenFiles((prev) => Array.from(new Set([...prev, firstNewPath])));
      }

      // Update currentProject if one is active
      if (currentProject) {
        const mergedFiles = {
          ...currentProject.parsedFiles,
          ...newFiles,
        };
        const updatedProj: SavedProject = {
          ...currentProject,
          parsedFiles: mergedFiles,
          updatedAt: new Date().toISOString(),
          stats: {
            ...currentProject.stats,
            fileCount: Object.keys(mergedFiles).length,
            totalBytes: (Object.values(mergedFiles) as ProjectFile[]).reduce(
              (acc: number, f: ProjectFile) => acc + (f.sizeBytes || 0),
              0
            ),
          },
        };
        setCurrentProject(updatedProj);
        if (!token) {
          saveGuestProject(updatedProj).then((updated) => setDbProjects(updated));
        }
      }
    } catch (err) {
      console.error('Failed to append files to current project:', err);
    }
  };

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

  // Quick Direct File Upload (Stages files and prompts project name & review)
  const handleUploadTranscriptFile = async (file: File) => {
    try {
      const content = await file.text();
      setQuickProjectTranscript(content);
      setQuickProjectTitle('');
      setNewProjectStagedFiles({});
      setNewProjectModalOpen(true);
    } catch (err) {
      console.error('Failed to upload transcript file:', err);
    }
  };

  const handleUploadStandaloneFile = async (file: File) => {
    try {
      const result = await processUploadedFiles([file]);
      setNewProjectStagedFiles(result.files);
      setQuickProjectTitle('');
      setNewProjectModalOpen(true);
    } catch (err) {
      console.error('Failed to upload standalone file:', err);
    }
  };

  const handleDirectUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'md' || ext === 'txt' || ext === 'markdown') {
      await handleUploadTranscriptFile(file);
    } else {
      await handleUploadStandaloneFile(file);
    }
    e.target.value = '';
  };

  // Open Project from Figma-style Dashboard
  const handleOpenProject = (project: SavedProject) => {
    handleClear(false);
    setCurrentProject(project);
    setActiveProjectTitle(project.title);
    setRawText(project.rawTranscript || '');
    setLastSavedTranscript(project.rawTranscript || '');
    if (project.parsedFiles && Object.keys(project.parsedFiles).length > 0) {
      setManuallyCreatedFiles(project.parsedFiles);
      const firstPath = Object.keys(project.parsedFiles)[0];
      setSelectedFilePath(firstPath);
      setOpenFiles([firstPath]);
    } else {
      setManuallyCreatedFiles({});
      setSelectedFilePath(null);
      setOpenFiles([]);
    }
    if (isMobileScreen) {
      setMobileWorkspaceNoticeOpen(true);
    } else {
      setViewMode('editor');
      setActiveActivityTab('explorer');
    }
  };

  // Create Project from Dashboard modal or file/folder upload
  const handleCreateNewProject = async (
    title: string,
    transcript: string,
    explicitFiles?: Record<string, ProjectFile>
  ) => {
    handleClear(false);
    const finalTitle = title.trim() || 'New Project';
    setActiveProjectTitle(finalTitle);
    setRawText(transcript);
    setLastSavedTranscript(transcript);

    let filesToUse: Record<string, ProjectFile> = {};
    let statsToUse = {
      fileCount: 0,
      totalBytes: 0,
      totalBlocks: 0,
      lineCount: 0,
    };

    if (explicitFiles && Object.keys(explicitFiles).length > 0) {
      filesToUse = explicitFiles;
      setManuallyCreatedFiles(explicitFiles);
      const fileValues = Object.values(explicitFiles);
      statsToUse = {
        fileCount: fileValues.length,
        totalBytes: fileValues.reduce((acc, f) => acc + (f.sizeBytes || 0), 0),
        totalBlocks: fileValues.length,
        lineCount: fileValues.reduce((acc, f) => acc + (f.lineCount || 1), 0),
      };
    } else {
      const parsed = parseProjectFromText(transcript, appSettings.parserOptions);
      filesToUse = parsed.files;
      statsToUse = {
        fileCount: Object.keys(parsed.files).length,
        totalBytes: parsed.stats.totalBytes,
        totalBlocks: parsed.stats.totalCodeBlocks,
        lineCount: parsed.stats.totalLines,
      };
    }

    const firstFilePath = Object.keys(filesToUse)[0];
    if (firstFilePath) {
      setSelectedFilePath(firstFilePath);
      setOpenFiles([firstFilePath]);
    }

    // Provide local state for guests so project title and files are immediately reflected
    const localProject: SavedProject = {
      id: Date.now(),
      userId: user?.uid || 'guest',
      title: finalTitle,
      rawTranscript: transcript,
      parsedFiles: filesToUse,
      stats: statsToUse,
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
            parsedFiles: filesToUse,
            stats: statsToUse,
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
      // Guest User: Save to IndexedDB safely without QuotaExceededError
      try {
        const updated = await saveGuestProject(localProject);
        setDbProjects(updated);
      } catch (err) {
        console.error('Failed to save guest project:', err);
      }
    }
    if (isMobileScreen) {
      setMobileWorkspaceNoticeOpen(true);
    } else {
      setViewMode('editor');
      setActiveActivityTab('explorer');
    }
  };

  // Upload folder or multiple files: stage files and prompt project name & review
  const handleUploadFolderOrFiles = async (files: FileList | File[]) => {
    try {
      const result = await processUploadedFiles(files);
      setNewProjectStagedFiles(result.files);
      setQuickProjectTitle('');
      setNewProjectModalOpen(true);
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

  // Delete project from database or guest storage
  const handleDeleteDbProject = async (id: number) => {
    const numId = Number(id);
    const strId = String(id);

    // Optimistically update project list immediately so the UI responds instantly
    setDbProjects((prev) =>
      prev.filter((p) => Number(p.id) !== numId && String(p.id) !== strId)
    );

    if (
      currentProject &&
      (Number(currentProject.id) === numId || String(currentProject.id) === strId)
    ) {
      handleClear();
    }

    // Always delete from local guest storage
    try {
      await deleteGuestProject(id);
    } catch (err) {
      console.warn('Failed to delete from local guest storage:', err);
    }

    // If authenticated, also notify backend
    if (token) {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          fetchProjects();
        }
      } catch (err) {
        console.warn('Backend DELETE error (project may have been local-only):', err);
      }
    }
  };

  // Toggle star
  const handleToggleStar = async (id: number, currentStar: number) => {
    const newStar = currentStar === 1 ? 0 : 1;
    if (!token) {
      try {
        const updated = await toggleGuestProjectStar(id, currentStar);
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
    await handleCreateNewProject(`${project.title} (Copy)`, project.rawTranscript, project.parsedFiles);
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
          onToggleBottomPanel={() => {
            if (!bottomPanelOpen) setBottomPanelTab('problems');
            setBottomPanelOpen(!bottomPanelOpen);
          }}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onClear={handleRequestClearWorkspace}
          onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenManifest={() => setIsManifestOpen(true)}
          onOpenTree={() => setIsTreeModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleMobileDrawer={() => setMobileDrawerOpen(true)}
          onNewProjectPrompt={() => setNewProjectModalOpen(true)}
          onUploadFolder={handleAppendFilesToCurrentProject}
          onUploadFiles={handleAppendFilesToCurrentProject}
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
          onUploadStandaloneFile={handleUploadStandaloneFile}
          onUploadTranscriptFile={handleUploadTranscriptFile}
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
                  setBottomPanelTab('problems');
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
              className="h-full shrink-0 flex flex-col bg-[#141418] border border-[#24242c] rounded-xl overflow-hidden shadow-xs relative"
            >
              {activeActivityTab === 'explorer' && (
                <FileTree
                  files={parsedProject.files}
                  selectedPath={activePath}
                  onSelectFile={handleSelectFile}
                  onCreateFile={handleCreateFile}
                  onDeleteFile={handleRequestDeleteFile}
                  onAppendFiles={handleAppendFilesToCurrentProject}
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

              {/* Seamless Zero-Gap Resize Handle on Right Edge */}
              <div
                onMouseDown={startDragSidebar}
                className={`absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-30 group flex items-center justify-center select-none ${
                  isDraggingSidebar ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                title="Drag to resize sidebar"
              >
                <div
                  className={`w-[2px] h-8 rounded-full transition-colors ${
                    isDraggingSidebar ? 'bg-white h-full' : 'bg-transparent group-hover:bg-neutral-500'
                  }`}
                />
              </div>
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

            {/* Bottom Panel (Problems showing exact code blocks, Output, Checkpoints, Terminal) */}
            {bottomPanelOpen && (
              <div
                style={{ height: `${bottomPanelHeight}px` }}
                className="w-full shrink-0 bg-[#141418] border border-[#24242c] rounded-xl overflow-hidden shadow-xs relative"
              >
                {/* Seamless Zero-Gap Resize Handle on Top Edge */}
                <div
                  onMouseDown={startDragBottomPanel}
                  className={`absolute top-0 left-0 right-0 h-2 cursor-row-resize z-30 group flex items-center justify-center select-none ${
                    isDraggingBottomPanel ? 'bg-white/20' : 'hover:bg-white/10'
                  }`}
                  title="Drag to resize bottom panel"
                >
                  <div
                    className={`h-[2px] w-12 rounded-full transition-colors ${
                      isDraggingBottomPanel ? 'bg-white w-full' : 'bg-transparent group-hover:bg-neutral-500'
                    }`}
                  />
                </div>

                <VSCodeBottomPanel
                  isOpen={bottomPanelOpen}
                  onClose={() => setBottomPanelOpen(false)}
                  activeTab={bottomPanelTab}
                  onTabChange={setBottomPanelTab}
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
                  onUpdateFileContent={handleUpdateFileContent}
                  onDeleteFile={handleRequestDeleteFile}
                />
              </div>
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
            onToggleBottomPanel={() => {
              if (!bottomPanelOpen) {
                setBottomPanelTab('problems');
                setBottomPanelOpen(true);
              } else {
                setBottomPanelOpen(false);
              }
            }}
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
        onOpenAudits={() => {
          setBottomPanelTab('problems');
          setBottomPanelOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onNewProjectPrompt={() => setNewProjectModalOpen(true)}
        onClear={handleRequestClearWorkspace}
      />

      {/* Spacious New Project Modal with File Review & Project Naming */}
      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => {
          setNewProjectModalOpen(false);
          setNewProjectStagedFiles({});
          setQuickProjectTitle('');
          setQuickProjectTranscript('');
        }}
        workspaces={DEFAULT_WORKSPACES}
        initialFiles={newProjectStagedFiles}
        initialTitle={quickProjectTitle}
        initialTranscript={quickProjectTranscript}
        onCreateProject={async (title, transcript, explicitFiles) => {
          await handleCreateNewProject(title, transcript, explicitFiles);
        }}
      />

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
          activeProjectTitle || currentProject?.title || parsedProject.rootFolderPrefix || 'my-project'
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

      {/* Clear Workspace Warning Modal with Remembered Choice */}
      {clearWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono text-xs">
          <div className="bg-[#141414] border border-red-500/60 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Clear Entire Workspace?
              </h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              Are you sure you want to clear the workspace? All unsaved files, current project state, and transcript changes will be reset. This action cannot be undone.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <input
                type="checkbox"
                id="dontAskClearAgain"
                checked={dontAskClearAgain}
                onChange={(e) => setDontAskClearAgain(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-500 accent-red-500 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="dontAskClearAgain"
                className="text-neutral-400 text-xs select-none cursor-pointer hover:text-white transition-colors"
              >
                Don&apos;t ask me again in the future
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setClearWorkspaceModalOpen(false)}
                className="w-full sm:w-auto h-8 px-4 border border-neutral-700 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearWorkspace}
                className="w-full sm:w-auto h-8 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold uppercase rounded-md transition-colors cursor-pointer shadow-md"
              >
                Clear Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Warning Modal with Remembered Choice */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono text-xs">
          <div className="bg-[#141414] border border-red-500/60 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Delete File?
              </h3>
            </div>
            <p className="text-neutral-300 leading-relaxed text-xs">
              Are you sure you want to delete <span className="text-white font-bold">&quot;{fileToDelete}&quot;</span>? This action cannot be undone.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <input
                type="checkbox"
                id="dontAskDeleteFileAgain"
                checked={dontAskDeleteFileAgain}
                onChange={(e) => setDontAskDeleteFileAgain(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-500 accent-red-500 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="dontAskDeleteFileAgain"
                className="text-neutral-400 text-xs select-none cursor-pointer hover:text-white transition-colors"
              >
                Don&apos;t ask me again in the future
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="w-full sm:w-auto h-8 px-4 border border-neutral-700 rounded-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFile}
                className="w-full sm:w-auto h-8 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold uppercase rounded-md transition-colors cursor-pointer shadow-md"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
