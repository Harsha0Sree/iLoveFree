'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signingIn: boolean;
  signInWithGoogle: (forceSelectAccount?: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signingIn: false,
  signInWithGoogle: async () => false,
  signOut: async () => {},
});

// Secure cookie utilities for persistent login session
const COOKIE_NAME = 'ilovefree_auth';

function setAuthCookie(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
  if (typeof document === 'undefined') return;
  try {
    const payload = encodeURIComponent(
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ts: Date.now(),
      })
    );
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    // 30 days expiration, SameSite=Lax, Path=/
    document.cookie = `${COOKIE_NAME}=${payload}; Path=/; Max-Age=2592000; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  } catch (e) {
    console.warn('Failed to set auth cookie:', e);
  }
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function getAuthCookieUser(): User | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.startsWith(`${COOKIE_NAME}=`)) {
        const value = trimmed.slice(COOKIE_NAME.length + 1);
        const data = JSON.parse(decodeURIComponent(value));
        if (data && data.uid) {
          return data as User;
        }
      }
    }
  } catch {}
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    // Check cookie first, fallback to cached user
    const cookieUser = getAuthCookieUser();
    if (cookieUser) return cookieUser;
    try {
      const cached = localStorage.getItem('repoextract_cached_user');
      if (cached) {
        return JSON.parse(cached) as User;
      }
    } catch {}
    return null;
  });
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    // Fast initial check with auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const userSummary = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };

        // Set secure cookie and local cache
        setAuthCookie(userSummary);

        try {
          localStorage.setItem('repoextract_cached_user', JSON.stringify(userSummary));
        } catch {}

        // Non-blocking background token retrieval
        currentUser
          .getIdToken(false)
          .then((idToken) => {
            setToken(idToken);
            fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
              }),
            }).catch(() => {});
          })
          .catch(() => {});
      } else {
        setToken(null);
        clearAuthCookie();
        try {
          localStorage.removeItem('repoextract_cached_user');
        } catch {}
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (forceSelectAccount = false): Promise<boolean> => {
    if (signingIn) return false;
    setSigningIn(true);
    try {
      if (forceSelectAccount) {
        googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
      } else {
        googleAuthProvider.setCustomParameters({});
      }

      const result = await signInWithPopup(auth, googleAuthProvider);
      setUser(result.user);
      setSigningIn(false);

      try {
        localStorage.setItem(
          'repoextract_cached_user',
          JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          })
        );
      } catch {}

      // Asynchronously fetch token and sync in background
      result.user
        .getIdToken(false)
        .then((idToken) => {
          setToken(idToken);
          fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
            }),
          }).catch(() => {});
        })
        .catch(() => {});

      return true;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string } | null;
      const code = err?.code || '';
      const message = err?.message || '';

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled' ||
        message.includes('auth/popup-closed-by-user') ||
        message.includes('auth/cancelled-popup-request')
      ) {
        return false;
      }

      console.warn('Google Sign In notice:', code || message);
      return false;
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setToken(null);
      clearAuthCookie();
      try {
        localStorage.removeItem('repoextract_cached_user');
      } catch {}
      await fbSignOut(auth);
    } catch (error: unknown) {
      console.warn('Sign Out notice:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signingIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
