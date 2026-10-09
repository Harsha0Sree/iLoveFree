'use client';

import React, { useState } from 'react';
import {
  X,
  Search,
  BookOpen,
  Terminal,
  FileCode,
  History,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Layers,
  Code2,
  FolderTree,
  ChevronRight,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocSection =
  | 'quickstart'
  | 'syntax'
  | 'versions'
  | 'workbench'
  | 'parser'
  | 'diagnostics'
  | 'export'
  | 'privacy';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<DocSection>('quickstart');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sections = [
    { id: 'quickstart' as DocSection, title: 'Quickstart Guide', icon: BookOpen },
    { id: 'syntax' as DocSection, title: 'Supported Syntax & Formats', icon: FileCode },
    { id: 'versions' as DocSection, title: 'Version History & Snapshots', icon: History },
    { id: 'workbench' as DocSection, title: 'VS Code Workbench', icon: Code2 },
    { id: 'parser' as DocSection, title: 'Deterministic AST Parser', icon: Cpu },
    { id: 'diagnostics' as DocSection, title: 'Diagnostics & Auto-Repair', icon: AlertTriangle },
    { id: 'export' as DocSection, title: 'Export & ZIP Bundling', icon: Download },
    { id: 'privacy' as DocSection, title: 'Security & Privacy', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-6 font-sans select-none animate-in fade-in duration-100">
      <div className="bg-[#18181b] border border-[#2b2b32] w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl rounded-2xl text-xs overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="h-14 border-b border-[#26262e] px-5 flex items-center justify-between gap-4 bg-[#141416] shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-white" />
            <span className="font-semibold text-white text-sm tracking-tight">Documentation &amp; User Manual</span>
          </div>

          {/* Quick search input */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (e.g. versions, syntax, shortcuts, export)..."
              className="w-full h-8 bg-[#1e1e24] border border-[#2e2e38] focus:border-white focus:outline-none rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-neutral-500 transition-colors font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close Documentation (Escape)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Sidebar Table of Contents */}
          <div className="w-60 bg-[#131316] border-r border-[#26262e] p-3 flex flex-col gap-1 shrink-0 select-none overflow-y-auto">
            <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
              Sections
            </div>
            {sections.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSearchQuery('');
                  }}
                  className={`w-full h-9 px-3 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-[#18181b] leading-relaxed">
            {/* 1. QUICKSTART */}
            {activeSection === 'quickstart' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Quickstart Guide</h2>
                  <p className="text-xs text-neutral-400">
                    Get from raw AI transcripts to an unpacked, production-ready codebase in under 30 seconds.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="w-6 h-6 rounded-lg bg-white text-black font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <div className="font-semibold text-white text-xs">Paste or Upload</div>
                    <p className="text-xs text-neutral-400">
                      Paste markdown transcripts from any LLM or drag and drop a folder of transcripts.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="w-6 h-6 rounded-lg bg-white text-black font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <div className="font-semibold text-white text-xs">AST Parsing</div>
                    <p className="text-xs text-neutral-400">
                      The deterministic engine recognizes files, cleans comments, and links directory structures.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="w-6 h-6 rounded-lg bg-white text-black font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <div className="font-semibold text-white text-xs">VS Code Studio</div>
                    <p className="text-xs text-neutral-400">
                      Inspect files in the explorer tree, edit code with syntax highlighting, and review diagnostics.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="w-6 h-6 rounded-lg bg-white text-black font-bold flex items-center justify-center text-xs">
                      4
                    </div>
                    <div className="font-semibold text-white text-xs">Instant Export</div>
                    <p className="text-xs text-neutral-400">
                      Download a clean, runnable ZIP archive ready for npm install and deployment.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-3">
                  <div className="font-semibold text-white text-xs flex items-center justify-between">
                    <span>Try with Sample Transcript Format</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `project-demo/
├── package.json
└── src/
    └── index.ts

\`\`\`json package.json
{
  "name": "demo-app",
  "version": "1.0.0"
}
\`\`\`

\`\`\`typescript src/index.ts
console.log("Hello from iLoveFree!");
\`\`\``,
                          'sample-transcript'
                        )
                      }
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSnippet === 'sample-transcript' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSnippet === 'sample-transcript' ? 'Copied' : 'Copy Example'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-[#131316] border border-[#26262e] rounded-lg font-mono text-[11px] text-neutral-300 overflow-x-auto leading-relaxed">
{`project-demo/
├── package.json
└── src/
    └── index.ts

\`\`\`json package.json
{
  "name": "demo-app",
  "version": "1.0.0"
}
\`\`\`

\`\`\`typescript src/index.ts
console.log("Hello from iLoveFree!");
\`\`\``}
                  </pre>
                </div>
              </div>
            )}

            {/* 2. SUPPORTED SYNTAX */}
            {activeSection === 'syntax' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Supported Syntax &amp; Formats</h2>
                  <p className="text-xs text-neutral-400">
                    The deterministic parser natively understands every major AI output pattern without requiring rigid formatting.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="font-semibold text-white text-xs">1. Fence Attributes &amp; Inline Path Tags</div>
                    <p className="text-xs text-neutral-400">
                      Standard markdown triple-backtick fences annotated with path attributes, colons, or filenames.
                    </p>
                    <pre className="p-3 bg-[#131316] border border-[#26262e] rounded-lg font-mono text-[11px] text-neutral-300">
{`\`\`\`typescript path="src/components/Header.tsx"
export const Header = () => <header>Logo</header>;
\`\`\`

\`\`\`tsx:src/App.tsx
import { Header } from './components/Header';
\`\`\`

\`\`\`json package.json
{ "dependencies": { "react": "^19" } }
\`\`\``}
                    </pre>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="font-semibold text-white text-xs">2. First-Line Filepath Comments</div>
                    <p className="text-xs text-neutral-400">
                      When code blocks omit filename tags, the parser inspects the first line comment for filepath cues and automatically cleans the comment.
                    </p>
                    <pre className="p-3 bg-[#131316] border border-[#26262e] rounded-lg font-mono text-[11px] text-neutral-300">
{`\`\`\`typescript
// filepath: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
\`\`\`

\`\`\`python
# path: server/config.py
DATABASE_URL = "postgresql://localhost:5432/app"
\`\`\``}
                    </pre>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="font-semibold text-white text-xs">3. Markdown Headings &amp; Preceding Labels</div>
                    <p className="text-xs text-neutral-400">
                      Headings or bold lines preceding a code block are automatically recognized as the target destination.
                    </p>
                    <pre className="p-3 bg-[#131316] border border-[#26262e] rounded-lg font-mono text-[11px] text-neutral-300">
{`### File 1: \`src/utils/format.ts\`
\`\`\`typescript
export function formatDate(d: Date) { return d.toISOString(); }
\`\`\`

--- \`components/Navbar.tsx\` ---
\`\`\`tsx
export function Navbar() { return <nav />; }
\`\`\``}
                    </pre>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-2">
                    <div className="font-semibold text-white text-xs">4. Claude &amp; ChatGPT XML Artifact Tags</div>
                    <p className="text-xs text-neutral-400">
                      Native support for <code className="text-white">&lt;antArtifact&gt;</code>, <code className="text-white">&lt;artifact&gt;</code>, and XML block attributes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. VERSIONS & SNAPSHOTS (HIGHLIGHTED) */}
            {activeSection === 'versions' && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold mb-2">
                    <History className="w-3.5 h-3.5" />
                    <span>Featured System</span>
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Version History &amp; Snapshots</h2>
                  <p className="text-xs text-neutral-400">
                    Track, branch, rollback, and compare full-project snapshots across iterative LLM generations without losing code.
                  </p>
                </div>

                <div className="p-5 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-4">
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <History className="w-4 h-4 text-white" />
                    <span>How the Versioning Engine Works</span>
                  </div>
                  <div className="space-y-2 text-xs text-neutral-300">
                    <p>
                      Every time you parse a new transcript or make modifications, iLoveFree creates an immutable snapshot of your entire project file tree. Snapshots store:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                      <li>Full file tree manifest with relative paths and exact bytes</li>
                      <li>Timestamp, version badge (e.g. v1.0, v1.1), and optional commit message</li>
                      <li>Diagnostic audit report at the moment of snapshot creation</li>
                      <li>Line-by-line diff markers indicating added, modified, or deleted files</li>
                    </ul>
                  </div>

                  {/* Visual Timeline Diagram */}
                  <div className="p-4 bg-[#131316] border border-[#26262e] rounded-xl space-y-3 font-mono text-[11px]">
                    <div className="text-neutral-400 text-[10px] uppercase font-bold tracking-wider">
                      Snapshot Timeline Architecture
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-white">
                      <div className="p-3 bg-[#1e1e24] border border-[#33333d] rounded-lg text-center min-w-32">
                        <div className="font-bold">v1.0 Baseline</div>
                        <div className="text-[10px] text-neutral-400 mt-1">4 files • Initial</div>
                      </div>
                      <div className="hidden sm:block text-neutral-500">──►</div>
                      <div className="p-3 bg-[#1e1e24] border border-[#33333d] rounded-lg text-center min-w-32">
                        <div className="font-bold">v1.1 Refactor</div>
                        <div className="text-[10px] text-neutral-400 mt-1">+3 files • Supabase</div>
                      </div>
                      <div className="hidden sm:block text-neutral-500">──►</div>
                      <div className="p-3 bg-white text-black font-bold rounded-lg text-center min-w-32 shadow">
                        <div>v1.2 Active</div>
                        <div className="text-[10px] text-neutral-700 mt-1">8 files • Current</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs">Instant Rollback</div>
                    <p className="text-xs text-neutral-400">
                      Restore any historical version with one click. Reverting swaps all memory files instantly.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs">Visual Diff Comparison</div>
                    <p className="text-xs text-neutral-400">
                      Compare any two versions side by side with red/green diff gutters before confirming restore.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs">Branch Export</div>
                    <p className="text-xs text-neutral-400">
                      Export any past snapshot as an independent ZIP archive without disturbing the active workspace.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. VS CODE WORKBENCH */}
            {activeSection === 'workbench' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">VS Code Studio Workbench</h2>
                  <p className="text-xs text-neutral-400">
                    A desktop-grade IDE environment directly inside your browser.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-3">
                    <div className="font-semibold text-white text-xs">Key Studio Features</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
                      <div>• Tabbed multi-file viewing with quick close</div>
                      <div>• Side-by-side split screen diff editor</div>
                      <div>• In-editor full text search and replace</div>
                      <div>• Breadcrumb file navigation bar</div>
                      <div>• JetBrains Mono code rendering with syntax highlighting</div>
                      <div>• Real-time syntax highlighting for 40+ languages</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-3">
                    <div className="font-semibold text-white text-xs">Keyboard Shortcuts Cheat Sheet</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2 bg-[#131316] rounded border border-[#26262e] flex justify-between">
                        <span className="text-neutral-400">Save Transcript / File:</span>
                        <span className="text-white font-bold">Ctrl / Cmd + S</span>
                      </div>
                      <div className="p-2 bg-[#131316] rounded border border-[#26262e] flex justify-between">
                        <span className="text-neutral-400">Quick File Search:</span>
                        <span className="text-white font-bold">Ctrl / Cmd + P</span>
                      </div>
                      <div className="p-2 bg-[#131316] rounded border border-[#26262e] flex justify-between">
                        <span className="text-neutral-400">Toggle Split View:</span>
                        <span className="text-white font-bold">Ctrl / Cmd + \</span>
                      </div>
                      <div className="p-2 bg-[#131316] rounded border border-[#26262e] flex justify-between">
                        <span className="text-neutral-400">Export ZIP Archive:</span>
                        <span className="text-white font-bold">Ctrl / Cmd + E</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. DETERMINISTIC PARSER */}
            {activeSection === 'parser' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Deterministic AST Parser</h2>
                  <p className="text-xs text-neutral-400">
                    Why deterministic algorithm execution beats secondary LLM wrappers.
                  </p>
                </div>

                <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-3">
                  <div className="font-semibold text-white text-xs">Guarantees of Deterministic Extraction</div>
                  <div className="space-y-2 text-xs text-neutral-300">
                    <p>
                      Other tools send transcripts to another LLM to parse them. This introduces latency, token costs, hallucinated changes, omitted functions, and privacy leaks.
                    </p>
                    <p>
                      iLoveFree executes 100% deterministic AST grammars in browser memory:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                      <li><strong>Zero Mutation:</strong> Every character and indentation space is preserved exactly.</li>
                      <li><strong>Instant Execution:</strong> Parses 500-file codebases in under 50 milliseconds.</li>
                      <li><strong>Offline Capable:</strong> Runs entirely without internet connectivity.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 6. DIAGNOSTICS & AUTO-REPAIR */}
            {activeSection === 'diagnostics' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Diagnostics &amp; Auto-Repair</h2>
                  <p className="text-xs text-neutral-400">
                    Automated code smell and transcript anomaly detection.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-white" />
                      <span>Truncation Guard</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Detects phrases like <code className="text-white bg-black/60 px-1 py-0.5 rounded">{'// ... rest of code remains unchanged ...'}</code> and flags diagnostic warnings before export so you don&apos;t ship broken stubs.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-white" />
                      <span>Missing File Stubs</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      If an ASCII tree mentions a file (e.g. <code className="text-white bg-black/60 px-1 py-0.5 rounded">lib/db.ts</code>) but no code block was supplied in the conversation, the engine creates a stub file with descriptive comments.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 text-white" />
                      <span>Duplicate Revision Resolution</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      When multiple versions of a file exist across an extended chat history, configure whether to use the latest revision, first revision, or combine them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. EXPORT */}
            {activeSection === 'export' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Export &amp; ZIP Bundling</h2>
                  <p className="text-xs text-neutral-400">
                    High-speed client-side ZIP packaging ready for execution.
                  </p>
                </div>

                <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-3">
                  <div className="font-semibold text-white text-xs">Running Your Extracted Project</div>
                  <p className="text-xs text-neutral-400">
                    Once downloaded, unpack the archive in your local terminal:
                  </p>
                  <pre className="p-3 bg-[#131316] border border-[#26262e] rounded-lg font-mono text-[11px] text-neutral-300 leading-relaxed">
{`# 1. Unzip the project archive
unzip my-project.zip -d my-project
cd my-project

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev`}
                  </pre>
                </div>
              </div>
            )}

            {/* 8. PRIVACY */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight mb-2">Security &amp; Privacy Architecture</h2>
                  <p className="text-xs text-neutral-400">
                    Strict isolation and client-side processing guarantees.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Client-Side Isolation</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      All parsing, decompression, and archiving run inside your web browser&apos;s WebAssembly and JavaScript memory.
                    </p>
                  </div>

                  <div className="p-4 bg-[#1f1f24] border border-[#2b2b32] rounded-xl space-y-1.5">
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>Zero Telemetry</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      We never store, log, inspect, or sell your source code, conversation logs, or API keys.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-[#26262e] bg-[#141416] px-5 flex items-center justify-between text-xs shrink-0 text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-neutral-300">Production documentation • Version 2.4</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 px-5 bg-white text-black hover:bg-neutral-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
