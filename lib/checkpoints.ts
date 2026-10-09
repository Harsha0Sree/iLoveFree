import { ProjectFile } from './parser';

export interface ProjectCheckpoint {
  id: string;
  name: string;
  timestamp: string;
  files: Record<string, ProjectFile>;
  fileCount: number;
  totalBytes: number;
  description?: string;
}

const STORAGE_KEY = 'repo_extract_checkpoints_v1';

/**
 * Load all checkpoints from localStorage
 */
export function getSavedCheckpoints(): ProjectCheckpoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load checkpoints from localStorage', err);
    return [];
  }
}

/**
 * Save a new checkpoint
 */
export function saveCheckpoint(
  name: string,
  files: Record<string, ProjectFile>,
  description?: string
): ProjectCheckpoint {
  const checkpoints = getSavedCheckpoints();
  const fileEntries = Object.entries(files);

  let totalBytes = 0;
  fileEntries.forEach(([_, f]) => {
    totalBytes += f.sizeBytes;
  });

  const newCheckpoint: ProjectCheckpoint = {
    id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || `Checkpoint ${checkpoints.length + 1}`,
    timestamp: new Date().toISOString(),
    files: JSON.parse(JSON.stringify(files)), // Deep clone
    fileCount: fileEntries.length,
    totalBytes,
    description: description?.trim() || undefined,
  };

  const updated = [newCheckpoint, ...checkpoints.slice(0, 19)]; // Keep up to 20 checkpoints
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to write checkpoint to localStorage', err);
  }

  return newCheckpoint;
}

/**
 * Delete a checkpoint by ID
 */
export function deleteCheckpoint(id: string): ProjectCheckpoint[] {
  const checkpoints = getSavedCheckpoints();
  const updated = checkpoints.filter((cp) => cp.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete checkpoint from localStorage', err);
  }
  return updated;
}

/**
 * Merge an incremental patch into an existing baseline project (checkpoint).
 * Files present in patchFiles will update or add to baseFiles.
 * All other files in baseFiles remain completely untouched!
 */
export function mergePatchIntoCheckpoint(
  baseFiles: Record<string, ProjectFile>,
  patchFiles: Record<string, ProjectFile>
): {
  merged: Record<string, ProjectFile>;
  updatedPaths: string[];
  newPaths: string[];
  unchangedPaths: string[];
} {
  // Start with a clone of the base project
  const merged: Record<string, ProjectFile> = JSON.parse(JSON.stringify(baseFiles));
  const updatedPaths: string[] = [];
  const newPaths: string[] = [];

  // Apply patch files
  Object.entries(patchFiles).forEach(([path, file]) => {
    if (merged[path]) {
      updatedPaths.push(path);
    } else {
      newPaths.push(path);
    }
    // Update or add file
    merged[path] = {
      ...file,
      // Mark as modified in patch for visual clarity
      hasTruncationWarning: file.hasTruncationWarning,
      truncationNotes: file.truncationNotes,
    };
  });

  const patchPathSet = new Set(Object.keys(patchFiles));
  const unchangedPaths = Object.keys(baseFiles).filter((p) => !patchPathSet.has(p));

  return {
    merged,
    updatedPaths,
    newPaths,
    unchangedPaths,
  };
}
