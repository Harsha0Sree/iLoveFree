import { SavedProject } from '@/components/FigmaProjectsDashboard';

const DB_NAME = 'ilovefree_db';
const DB_VERSION = 1;
const STORE_NAME = 'guest_projects';
const SESSION_KEY = 'ilovefree_guest_projects';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Safely writes a lightweight summary or sanitized version to sessionStorage,
 * ensuring QuotaExceededError is never thrown.
 */
function safeSaveSessionStorage(projects: SavedProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(projects));
  } catch {
    // If full data exceeds 5MB quota (e.g. large images/videos),
    // strip large base64 contents for sessionStorage and store preview metadata only
    try {
      const sanitized = projects.map((p) => {
        const prunedFiles: Record<string, any> = {};
        if (p.parsedFiles) {
          Object.entries(p.parsedFiles).forEach(([path, file]: [string, any]) => {
            if (file.isBinary && file.content && file.content.length > 5000) {
              prunedFiles[path] = {
                ...file,
                content: `<!-- [Binary data stored in IndexedDB: ${path}] -->`,
                dataUrl: undefined,
              };
            } else {
              prunedFiles[path] = file;
            }
          });
        }
        return {
          ...p,
          parsedFiles: prunedFiles,
        };
      });
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sanitized));
    } catch {
      // If still exceeding quota, clear sessionStorage key safely
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
    }
  }
}

/**
 * Retrieves all guest projects from IndexedDB, falling back to sessionStorage.
 */
export async function getGuestProjects(): Promise<SavedProject[]> {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as SavedProject[]) || [];
        if (results.length > 0) {
          results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          resolve(results);
        } else {
          // Check sessionStorage for previous guest session data
          try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            const fallback: SavedProject[] = raw ? JSON.parse(raw) : [];
            // Seed IndexedDB with sessionStorage fallback
            if (fallback.length > 0) {
              fallback.forEach((proj) => {
                saveGuestProject(proj).catch(() => {});
              });
            }
            resolve(fallback);
          } catch {
            resolve([]);
          }
        }
      };

      request.onerror = () => {
        // Fallback to sessionStorage
        try {
          const raw = sessionStorage.getItem(SESSION_KEY);
          resolve(raw ? JSON.parse(raw) : []);
        } catch {
          resolve([]);
        }
      };
    });
  } catch {
    // If IndexedDB unavailable, use sessionStorage safely
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Saves or updates a guest project in IndexedDB and syncs to state/sessionStorage.
 * Guarantees no QuotaExceededError crashes.
 */
export async function saveGuestProject(project: SavedProject): Promise<SavedProject[]> {
  if (typeof window === 'undefined') return [project];

  let currentList: SavedProject[] = [];
  try {
    currentList = await getGuestProjects();
  } catch {
    currentList = [];
  }

  const updated = [project, ...currentList.filter((p) => p.id !== project.id)];

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(project);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB, using memory/session fallback:', err);
  }

  safeSaveSessionStorage(updated);
  return updated;
}

/**
 * Deletes a guest project from IndexedDB and sessionStorage.
 */
export async function deleteGuestProject(id: number | string): Promise<SavedProject[]> {
  if (typeof window === 'undefined') return [];

  const numId = Number(id);
  const strId = String(id);

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      if (!isNaN(numId)) {
        store.delete(numId);
      }
      store.delete(strId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }

  // Update sessionStorage immediately
  let currentList: SavedProject[] = [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    currentList = raw ? JSON.parse(raw) : [];
  } catch {
    currentList = [];
  }

  const updated = currentList.filter(
    (p) => Number(p.id) !== numId && String(p.id) !== strId
  );
  safeSaveSessionStorage(updated);
  return updated;
}

/**
 * Toggles the starred status of a guest project.
 */
export async function toggleGuestProjectStar(id: number, currentStar: number): Promise<SavedProject[]> {
  const newStar = currentStar === 1 ? 0 : 1;
  const currentList = await getGuestProjects();
  const target = currentList.find((p) => p.id === id);
  if (!target) return currentList;

  const updatedTarget: SavedProject = {
    ...target,
    isStarred: newStar,
    updatedAt: new Date().toISOString(),
  };

  return saveGuestProject(updatedTarget);
}
