'use client';

import React, { useState } from 'react';
import { ExtractedCodeBlock } from '@/lib/parser';
import { Layers, FileCode, Check, AlertTriangle, Eye, ArrowRight } from 'lucide-react';

interface BlocksManifestProps {
  codeBlocks: ExtractedCodeBlock[];
  onSelectFile: (path: string) => void;
  onAssignBlockPath: (blockIndex: number, targetPath: string) => void;
}

export const BlocksManifest: React.FC<BlocksManifestProps> = ({
  codeBlocks,
  onSelectFile,
  onAssignBlockPath,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingPathBlock, setEditingPathBlock] = useState<number | null>(null);
  const [customPathInput, setCustomPathInput] = useState('');

  const selectedBlock = codeBlocks.find((b) => b.id === selectedBlockId) || null;

  const handleEditPathSubmit = (blockIndex: number) => {
    if (customPathInput.trim()) {
      onAssignBlockPath(blockIndex, customPathInput.trim());
      setEditingPathBlock(null);
      setCustomPathInput('');
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'fence_attribute':
        return 'Fence attribute (path="...")';
      case 'fence_trailing_path':
        return 'Fence tag path (```ts path)';
      case 'first_line_comment':
        return 'First-line comment (// filepath: ...)';
      case 'first_line_bare_path':
        return 'First-line filename';
      case 'preceding_heading':
        return 'Preceding markdown header (### `...`)';
      case 'preceding_delimiter':
        return 'Delimiter line (--- file ---)';
      case 'preceding_phrase':
        return 'Instruction phrase (In `...`: )';
      case 'tree_unique_match':
        return 'Tree disambiguation match';
      default:
        return 'Unresolved';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Manifest Header */}
      <div className="border-b border-neutral-800 p-4 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Extracted Code Blocks Manifest</span>
            <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 text-neutral-300">
              {codeBlocks.length} Blocks
            </span>
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1">
            Deterministic mapping log detailing exact line coordinates, heuristics, and assigned destinations.
          </p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-[10px] text-neutral-400 uppercase tracking-wider">
              <th className="p-2.5">Block #</th>
              <th className="p-2.5">Input Lines</th>
              <th className="p-2.5">Lang Tag</th>
              <th className="p-2.5">Resolved File Destination</th>
              <th className="p-2.5">Matching Heuristic</th>
              <th className="p-2.5">Confidence</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {codeBlocks.map((block) => {
              const isAssigned = Boolean(block.resolvedPath);
              const isSelected = selectedBlockId === block.id;

              return (
                <tr
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`hover:bg-neutral-950 transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-900' : ''
                  }`}
                >
                  <td className="p-2.5 font-bold text-white">#{block.index}</td>
                  <td className="p-2.5 text-neutral-400">
                    L{block.startLine}–L{block.endLine}
                  </td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 border border-neutral-800 bg-black text-[10px] text-neutral-300">
                      {block.langTag || 'plaintext'}
                    </span>
                  </td>
                  <td className="p-2.5">
                    {editingPathBlock === block.index ? (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={customPathInput}
                          onChange={(e) => setCustomPathInput(e.target.value)}
                          placeholder="path/to/file.ts"
                          className="bg-black border border-white px-2 py-0.5 text-xs text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditPathSubmit(block.index)}
                          className="bg-white text-black px-1.5 py-0.5 font-bold uppercase text-[10px]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPathBlock(null)}
                          className="border border-neutral-800 px-1 py-0.5 text-[10px] text-neutral-400"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {isAssigned ? (
                          <span className="text-white font-bold">{block.resolvedPath}</span>
                        ) : (
                          <span className="text-neutral-500 italic">Unassigned (Missing destination)</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPathBlock(block.index);
                            setCustomPathInput(block.resolvedPath || '');
                          }}
                          className="text-[9px] text-neutral-600 hover:text-white underline ml-1"
                        >
                          edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-neutral-400 text-[11px]">
                    {getReasonLabel(block.matchReason)}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 font-bold ${
                        block.confidence === 'high'
                          ? 'border border-white text-white'
                          : block.confidence === 'medium'
                          ? 'border border-neutral-600 text-neutral-300'
                          : block.confidence === 'low'
                          ? 'border border-neutral-700 text-neutral-500'
                          : 'bg-white text-black'
                      }`}
                    >
                      {block.confidence}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {block.resolvedPath && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFile(block.resolvedPath!);
                        }}
                        className="inline-flex items-center gap-1 border border-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300 hover:border-white hover:text-white transition-colors cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Block Quick Drawer */}
      {selectedBlock && (
        <div className="border-t border-neutral-800 bg-neutral-950 p-4 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-white font-mono">
              Raw Code for Block #{selectedBlock.index} (Lines {selectedBlock.startLine}–
              {selectedBlock.endLine})
            </span>
            <button
              onClick={() => setSelectedBlockId(null)}
              className="text-xs text-neutral-500 hover:text-white"
            >
              Close ✕
            </button>
          </div>
          <pre className="text-[11px] font-mono text-neutral-300 bg-black p-3 border border-neutral-800 overflow-x-auto">
            <code>{selectedBlock.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
