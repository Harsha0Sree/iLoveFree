'use client';

import React, { useRef, useEffect } from 'react';
import {
  Palette,
  Sliders,
  Plus,
  LogOut,
  ChevronRight,
  Check,
  LogIn,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext.tsx';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenExport?: () => void;
  anchorPosition?: 'bottom-left' | 'bottom-right';
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  anchorPosition = 'bottom-left',
}) => {
  const { user, signInWithGoogle, signOut, signingIn } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [themeSubmenuOpen, setThemeSubmenuOpen] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState<'dark' | 'contrast' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('ilovefree_theme') as 'dark' | 'contrast' | 'light') || 'dark';
  });

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest User';
  const email = user?.email || 'Guest Account';
  const initial = displayName.charAt(0).toUpperCase();

  const handleThemeChange = (theme: 'dark' | 'contrast' | 'light') => {
    setActiveTheme(theme);
    setThemeSubmenuOpen(false);
    try {
      localStorage.setItem('ilovefree_theme', theme);
    } catch {}
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <>
      {/* Invisible fixed backdrop overlay ensuring clicks outside close cleanly without container restriction */}
      <div className="fixed inset-0 z-[9990] cursor-default" onClick={onClose} />

      {/* Floating Dropdown Panel on top of all other divs using fixed positioning */}
      <div
        ref={dropdownRef}
        className={`fixed z-[99999] w-64 bg-[#18181c] border border-[#2a2a32] rounded-2xl shadow-2xl py-2 px-1 text-white font-sans text-xs select-none animate-in fade-in zoom-in-95 duration-100 ${
          anchorPosition === 'bottom-right' ? 'top-12 right-3' : 'top-16 left-3'
        }`}
      >
        {/* 1. User Header Section */}
        <div className="pt-2 pb-3 px-3 flex flex-col items-center text-center">
          {user?.photoURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-neutral-700 shadow-md"
            />
          ) : user ? (
            <div className="w-12 h-12 rounded-full bg-neutral-700 text-white flex items-center justify-center font-bold text-lg shadow-md ring-2 ring-neutral-600">
              {initial}
            </div>
          ) : (
            /* Anonymous silhouette SVG for Guest User */
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center shadow-md ring-2 ring-neutral-700">
              <svg className="w-7 h-7 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}

          <div className="mt-2 font-semibold text-white text-sm tracking-tight truncate max-w-full">
            {displayName}
          </div>
          <div className="text-[11px] text-neutral-400 truncate max-w-full mt-0.5">
            {email}
          </div>

          {!user && (
            <button
              onClick={() => {
                signInWithGoogle();
                onClose();
              }}
              disabled={signingIn}
              className="mt-3 w-full py-2 px-3 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>

        <div className="border-t border-[#26262e] my-1" />

        {/* 2. Preferences Menu */}
        <div className="space-y-0.5 px-1">
          {/* Change theme with submenu */}
          <div className="relative">
            <button
              onClick={() => setThemeSubmenuOpen(!themeSubmenuOpen)}
              className="w-full h-8 px-2.5 rounded-lg flex items-center justify-between text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-neutral-400" />
                <span>Change theme</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {themeSubmenuOpen && (
              <div className="absolute left-full top-0 ml-1 w-40 bg-[#1e1e24] border border-[#2e2e38] rounded-xl shadow-2xl py-1 z-[10000] text-xs">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className="w-full px-3 py-1.5 text-left text-neutral-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Dark Modern</span>
                  {activeTheme === 'dark' && <Check className="w-3 h-3 text-white" />}
                </button>
                <button
                  onClick={() => handleThemeChange('contrast')}
                  className="w-full px-3 py-1.5 text-left text-neutral-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>High Contrast</span>
                  {activeTheme === 'contrast' && <Check className="w-3 h-3 text-white" />}
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className="w-full px-3 py-1.5 text-left text-neutral-300 hover:text-white hover:bg-white/10 flex items-center justify-between cursor-pointer"
                >
                  <span>Light</span>
                  {activeTheme === 'light' && <Check className="w-3 h-3 text-white" />}
                </button>
              </div>
            )}
          </div>

          {/* Settings button */}
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
          >
            <Sliders className="w-4 h-4 text-neutral-400" />
            <span>Settings</span>
          </button>
        </div>

        <div className="border-t border-[#26262e] my-1" />

        {/* 3. Account Actions (Add Account / Log out / Log in) */}
        <div className="space-y-0.5 px-1">
          {user ? (
            <>
              <button
                onClick={() => {
                  signInWithGoogle(true);
                  onClose();
                }}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4 text-neutral-400" />
                <span>Switch / Add account</span>
              </button>

              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
              >
                <LogOut className="w-4 h-4 text-neutral-400" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                signInWithGoogle();
                onClose();
              }}
              disabled={signingIn}
              className="w-full h-8 px-2.5 rounded-lg flex items-center gap-2.5 text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
            >
              <LogIn className="w-4 h-4 text-neutral-400" />
              <span>Login to Account</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
