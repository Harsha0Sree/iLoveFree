import { SavedProject } from '@/components/FigmaProjectsDashboard';

const DB_NAME = 'ilovefree_storage';
const DB_VERSION = 1;
const STORE_NAME = 'guest_projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Saves a guest project into IndexedDB (supports large binary files like images and videos)
 */
export async function saveGuestProjectToIndexedDB(project: SavedProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(project);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save project notice:', err);
  }
}

/**
 * Loads all guest projects from IndexedDB
 */
export async function loadGuestProjectsFromIndexedDB(): Promise<SavedProject[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const result = (req.result as SavedProject[]) || [];
        // Sort newest first
        result.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB load projects notice:', err);
    return [];
  }
}

/**
 * Deletes a project from IndexedDB
 */
export async function deleteGuestProjectFromIndexedDB(id: number): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete project notice:', err);
  }
}

/**
 * Clears all guest projects from IndexedDB
 */
export async function clearAllGuestProjectsFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear projects notice:', err);
  }
}

/**
 * Safe sessionStorage writer that never throws QuotaExceededError.
 * Truncates heavy binary contents if necessary to fit in sessionStorage.
 */
export function safeSetSessionStorage(key: string, projects: SavedProject[]): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(key, JSON.stringify(projects));
  } catch (err) {
    // Quota exceeded: store lightweight version without massive binary dataUrls
    try {
      const sanitized = projects.slice(0, 10).map((proj) => ({
        ...proj,
        rawTranscript: proj.rawTranscript.length > 50000 ? proj.rawTranscript.slice(0, 50000) + '...[truncated]' : proj.rawTranscript,
        parsedFiles: Object.fromEntries(
          Object.entries(proj.parsedFiles || {}).map(([path, file]: [string, any]) => [
            path,
            file?.isBinary && file?.content && file.content.length > 1000
              ? { ...file, content: '' } // Clear heavy dataUrl in sessionStorage cache; IndexedDB keeps full dataUrl
              : file,
          ])
        ),
      }));
      sessionStorage.setItem(key, JSON.stringify(sanitized));
    } catch {
      // If even sanitized fails, leave sessionStorage alone without throwing
      console.warn('sessionStorage quota exceeded; project preserved in IndexedDB.');
    }
  }
}
