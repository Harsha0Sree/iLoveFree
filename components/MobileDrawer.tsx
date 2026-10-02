'use client';

import React from 'react';
import {
  X,
  FileCode,
  History,
  AlertTriangle,
  Download,
  Settings,
  HelpCircle,
  LayoutGrid,
  LogIn,
  LogOut,
  FolderPlus,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext.tsx';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filesCount: number;
  errorCount: number;
  warningCount: number;
  checkpointCount: number;
  onSelectView: (view: 'files' | 'source' | 'projects') => void;
  onOpenCheckpoints: () => void;
  onOpenAudits: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  onNewProjectPrompt: () => void;
  onClear: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  filesCount,
  errorCount,
  warningCount,
  checkpointCount,
  onSelectView,
  onOpenCheckpoints,
  onOpenAudits,
  onOpenSettings,
  onOpenHelp,
  onOpenExport,
  onNewProjectPrompt,
  onClear,
}) => {
  const { user, signInWithGoogle, signOut, loading: authLoading, signingIn } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden bg-black/85 backdrop-blur-sm">
      <div className="w-[85vw] max-w-xs h-full bg-[#0c0c0c] border-r border-neutral-800 flex flex-col font-mono text-xs shadow-2xl">
        {/* Header with Google User Profile */}
        <div className="border-b border-neutral-800 p-4 bg-[#111111]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Sign-In Banner */}
          {!authLoading && (
            <div>
              {user ? (
                <div className="flex items-center justify-between bg-black border border-neutral-800 p-2 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    {user.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-7 h-7 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-neutral-800 text-white font-bold flex items-center justify-center text-xs">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </div>
                      <div className="text-[9px] text-neutral-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-neutral-400 hover:text-white rounded"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  disabled={authLoading || signingIn}
                  className="w-full py-2 bg-[#181818] hover:bg-[#252525] border border-neutral-700 rounded-lg text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Quick New Project Action */}
          <button
            onClick={() => {
              onNewProjectPrompt();
              onClose();
            }}
            className="w-full min-h-[38px] px-3 py-2 bg-white text-black font-semibold uppercase rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Project</span>
          </button>

          <div className="border-t border-neutral-800/80 my-2" />

          {/* Primary View Switchers */}
          <button
            onClick={() => {
              onSelectView('projects');
              onClose();
            }}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-white" />
              <span>Projects</span>
            </div>
          </button>

          <button
            onClick={() => {
              onSelectView('files');
              onClose();
            }}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-white" />
              <span>Files</span>
            </div>
            {filesCount > 0 && (
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                {filesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView('source');
              onClose();
            }}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center gap-2.5 transition-colors"
          >
            <FileCode className="w-4 h-4 text-neutral-400" />
            <span>Source Transcript</span>
          </button>

          <button
            onClick={() => {
              onOpenCheckpoints();
              onClose();
            }}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-white" />
              <span>Version History</span>
            </div>
            {checkpointCount > 0 && (
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                {checkpointCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenAudits();
              onClose();
            }}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-neutral-400" />
              <span>Diagnostics</span>
            </div>
            {(errorCount > 0 || warningCount > 0) && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  errorCount > 0
                    ? 'bg-white text-black font-bold'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {errorCount + warningCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onOpenExport();
              onClose();
            }}
            disabled={filesCount === 0}
            className="w-full min-h-[36px] px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-lg flex items-center gap-2.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-neutral-400" />
            <span>Export ZIP</span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 bg-[#111111] space-y-1">
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full h-8 px-2 text-neutral-400 hover:text-white flex items-center gap-2 rounded hover:bg-neutral-900"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              onOpenHelp();
              onClose();
            }}
            className="w-full h-8 px-2 text-neutral-400 hover:text-white flex items-center gap-2 rounded hover:bg-neutral-900"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Docs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
