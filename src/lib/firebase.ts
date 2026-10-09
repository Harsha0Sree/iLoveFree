import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Safe client-side Firebase initialization to prevent build-time prerender failures
// when apiKey is not yet set or during static page generation.
let appInstance: any = null;
let authInstance: Auth | null = null;

if (typeof window !== 'undefined' && firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(appInstance);
  } catch (err) {
    console.warn('Firebase initialization skipped or deferred:', err);
  }
}

export const auth = (authInstance || {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signOut: async () => {},
}) as unknown as Auth;

export const googleAuthProvider = new GoogleAuthProvider();
