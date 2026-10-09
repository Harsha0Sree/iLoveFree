'use client';

import React, { useState } from 'react';
import { ProjectCheckpoint, saveCheckpoint, deleteCheckpoint } from '@/lib/checkpoints';
import { ProjectFile } from '@/lib/parser';
import {
  X,
  History,
  Plus,
  RotateCcw,
  Trash2,
  GitBranch,
  Check,
  Calendar,
  Layers,
  Save,
} from 'lucide-react';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoints: ProjectCheckpoint[];
  activeCheckpoint: ProjectCheckpoint | null;
  currentFiles: Record<string, ProjectFile>;
  onRestoreCheckpoint: (cp: ProjectCheckpoint) => void;
  onSetActiveBaseline: (cp: ProjectCheckpoint | null) => void;
  onRefreshCheckpoints: () => void;
  onVersionSaved?: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  isOpen,
  onClose,
  checkpoints,
  activeCheckpoint,
  currentFiles,
  onRestoreCheckpoint,
  onSetActiveBaseline,
  onRefreshCheckpoints,
  onVersionSaved,
}) => {
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentFileCount = Object.keys(currentFiles).length;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentFileCount === 0) return;

    const name = newVersionName.trim() || `Version ${checkpoints.length + 1} (${currentFileCount} files)`;
    const newCp = saveCheckpoint(name, currentFiles, newVersionDesc.trim());
    onSetActiveBaseline(newCp);
    onRefreshCheckpoints();
    if (onVersionSaved) onVersionSaved();
    setNewVersionName('');
    setNewVersionDesc('');
    setIsCreating(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCheckpoint(id);
    if (activeCheckpoint?.id === id) {
      onSetActiveBaseline(null);
    }
    onRefreshCheckpoints();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="border-b border-neutral-800 p-3.5 bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-white" />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Version History & Saves
              </h2>
              <p className="text-[11px] text-neutral-400">
                Save version snapshots and easily revert back to any previous version.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Version Status */}
          {activeCheckpoint && (
            <div className="border border-neutral-700 p-3 bg-[#111111] rounded-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-white font-bold uppercase text-[11px]">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Active Saved Version: {activeCheckpoint.name}</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Incremental mode is enabled. Any pasted code updates apply to this version.
                </p>
              </div>

              <button
                onClick={() => onSetActiveBaseline(null)}
                className="border border-neutral-700 px-2.5 py-1 rounded text-[10px] text-neutral-300 hover:text-white hover:border-white uppercase cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Create New Save Button or Form */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              disabled={currentFileCount === 0}
              className={`w-full py-2.5 border rounded-md flex items-center justify-center gap-1.5 uppercase font-bold text-xs transition-colors cursor-pointer ${
                currentFileCount === 0
                  ? 'border-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'border-white bg-white text-black hover:bg-neutral-200'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Current Version ({currentFileCount} files)</span>
            </button>
          ) : (
            <form
              onSubmit={handleSaveSubmit}
              className="border border-neutral-700 p-3.5 bg-[#111111] rounded-md space-y-2.5"
            >
              <div className="text-[10px] uppercase font-bold text-white">
                Save Version
              </div>
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="Version Name (e.g. v1.0 - Initial Working Build)"
                className="w-full bg-black border border-neutral-700 px-2.5 py-1.5 text-xs text-white rounded-md focus:outline-none focus:border-white"
                autoFocus
              />
              <input
                type="text"
                value={newVersionDesc}
                onChange={(e) => setNewVersionDesc(e.target.value)}
                placeholder="Optional notes or changelog"
                className="w-full bg-black border border-neutral-700 px-2.5 py-1.5 text-[11px] text-white rounded-md focus:outline-none focus:border-white"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="border border-neutral-700 px-3 py-1 rounded-md text-xs text-neutral-400 hover:text-white cursor-pointer uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="border border-white bg-white text-black px-4 py-1 rounded-md text-xs font-bold uppercase hover:bg-neutral-200 cursor-pointer"
                >
                  Save Version
                </button>
              </div>
            </form>
          )}

          {savedSuccess && (
            <div className="p-2 border border-white text-white text-center text-xs flex items-center justify-center gap-1.5 rounded-md">
              <Check className="w-3.5 h-3.5" />
              <span>Version saved successfully!</span>
            </div>
          )}

          {/* List of Saved Versions */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              Version History ({checkpoints.length})
            </div>

            {checkpoints.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-neutral-800 text-neutral-500 text-xs rounded-md">
                No saved versions yet. Save your current files as a version anytime to allow quick revert.
              </div>
            ) : (
              checkpoints.map((cp) => {
                const isActive = activeCheckpoint?.id === cp.id;
                return (
                  <div
                    key={cp.id}
                    className={`border rounded-md p-3 transition-colors ${
                      isActive ? 'border-neutral-600 bg-[#141414]' : 'border-neutral-800 bg-black'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{cp.name}</span>
                          {isActive && (
                            <span className="bg-white text-black text-[9px] px-1 font-bold uppercase rounded-sm">
                              Current
                            </span>
                          )}
                        </div>
                        {cp.description && (
                          <p className="text-[11px] text-neutral-400 mt-1">{cp.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" /> {cp.fileCount} files
                          </span>
                          <span>•</span>
                          <span>{(cp.totalBytes / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{' '}
                            {new Date(cp.timestamp).toLocaleDateString()} {new Date(cp.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onRestoreCheckpoint(cp);
                            onClose();
                          }}
                          className="h-7 flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-2.5 rounded-md text-xs font-semibold uppercase transition-colors cursor-pointer"
                          title="Revert workspace back to this exact version"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Revert</span>
                        </button>

                        <button
                          onClick={() => {
                            onSetActiveBaseline(isActive ? null : cp);
                          }}
                          className={`h-7 flex items-center gap-1.5 px-2.5 rounded-md text-xs transition-colors cursor-pointer border ${
                            isActive
                              ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              : 'bg-transparent text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-500'
                          }`}
                          title="Set as baseline for incremental updates"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Deactivate' : 'Patch Mode'}</span>
                        </button>

                        <button
                          onClick={(e) => handleDelete(cp.id, e)}
                          className="h-7 w-7 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete version"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview of file paths */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-900 text-[10px] text-neutral-500 truncate">
                      {Object.keys(cp.files).slice(0, 5).join(', ')}
                      {Object.keys(cp.files).length > 5 && ` and ${Object.keys(cp.files).length - 5} more...`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 border border-neutral-700 rounded-md text-xs text-neutral-400 hover:text-white uppercase transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
