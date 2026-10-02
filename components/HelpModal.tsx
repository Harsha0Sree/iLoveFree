'use client';

import React from 'react';
import { X, ShieldCheck, Terminal, AlertTriangle, FileCode } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#0c0c0c] border border-neutral-700 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-[#111111]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Deterministic Parsing Specification & Guarantees
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 p-5 text-neutral-300 leading-relaxed text-[11px]">
          <div>
            <h3 className="text-white font-bold uppercase text-xs mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> 100% Deterministic — Zero AI Inference
            </h3>
            <p className="text-neutral-400">
              Unlike LLMs which can unpredictably hallucinate, omit lines, mix files, or fail silently on large codebases, this engine relies exclusively on mathematically deterministic algorithms, AST-style regex grammars, and directory graph correlation. Every output is 100% reproducible and verifiable.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold uppercase text-xs mb-1.5 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> Supported Filename Detection Patterns
            </h3>
            <div className="space-y-2 text-neutral-400">
              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <span className="text-white font-bold">1. Fence Attributes & Tags:</span>
                <pre className="mt-1 text-[10px] text-neutral-300">
                  {`\`\`\`ts path="src/index.ts"`}{"\n"}
                  {`\`\`\`typescript:src/app.ts`}{"\n"}
                  {`\`\`\`json package.json`}
                </pre>
              </div>

              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <span className="text-white font-bold">2. First-Line Comments:</span>
                <pre className="mt-1 text-[10px] text-neutral-300">
                  {`// filepath: src/models/user.ts`}{"\n"}
                  {`# path: config/settings.py`}{"\n"}
                  {`/* src/index.ts */`}
                </pre>
              </div>

              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <span className="text-white font-bold">3. Preceding Text & Headers:</span>
                <pre className="mt-1 text-[10px] text-neutral-300">
                  {`### \`src/components/Header.tsx\``}{"\n"}
                  {`--- /components/Navbar.tsx ---`}{"\n"}
                  {`In \`app/layout.tsx\`:`}{"\n"}
                  {`File 1: \`src/api.py\``}
                </pre>
              </div>

              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <span className="text-white font-bold">4. ASCII Directory Tree Disambiguation:</span>
                <p className="mt-1 text-[10px] text-neutral-300">
                  If an ASCII tree is present (e.g. <code>├── src/utils/math.ts</code>) and a block only specifies <code>math.ts</code>, the engine uniquely disambiguates and assigns it to <code>src/utils/math.ts</code>.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold uppercase text-xs mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Diagnostic & Failure Prevention System
            </h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li>
                <strong className="text-white">Missing File Detection:</strong> If an ASCII structure tree declared 10 files, but only 7 code blocks were provided, the engine highlights the 3 missing files immediately.
              </li>
              <li>
                <strong className="text-white">Truncation Placeholders:</strong> Detects code comments like <code>{`// ... rest of code remains unchanged ...`}</code> or <code>{`/* TODO: implement */`}</code> to prevent deploying broken stub code.
              </li>
              <li>
                <strong className="text-white">Duplicate Collisions:</strong> Detects when multiple revisions of the same file exist in the transcript, allowing you to choose between latest version, first version, or appended content.
              </li>
              <li>
                <strong className="text-white">Unclosed Fences & Ambiguities:</strong> Flags broken markdown formatting without corrupting sibling files.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-3 bg-[#111111] flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-md text-xs font-semibold uppercase bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
