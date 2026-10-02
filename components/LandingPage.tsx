'use client';

import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import {
  ArrowRight,
  LogIn,
  FolderPlus,
  Layers,
  Sparkles,
  Terminal,
  FolderOpen,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Code2,
  Download,
  Search,
  Star,
  Check,
  Lock,
  Zap,
  Cpu,
  History,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileText,
  Sliders,
  CheckCheck,
} from 'lucide-react';

interface LandingPageProps {
  onTryNow: () => void;
  onSignInSuccess: () => void;
}

type LandingTab = 'overview' | 'workspaces' | 'editor' | 'extractor' | 'security' | 'docs';

export const LandingPage: React.FC<LandingPageProps> = ({
  onTryNow,
  onSignInSuccess,
}) => {
  const { user, signInWithGoogle, signingIn } = useAuth();
  const [activeTab, setActiveTab] = useState<LandingTab>('overview');

  const handleSignIn = async () => {
    if (user) {
      onSignInSuccess();
      return;
    }
    const success = await signInWithGoogle();
    if (success) {
      onSignInSuccess();
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-neutral-200 font-mono flex flex-col selection:bg-white selection:text-black overflow-x-hidden">
      {/* 1. Spacious Nav Bar (CSS selector 2) with Breathing Room & No Logo */}
      <header className="h-16 sm:h-20 lg:h-24 px-4 sm:px-14 lg:px-20 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-50 shrink-0">
        {/* Left: Clean iLoveFree Typography Branding without any logo box */}
        <div className="flex items-center gap-4 sm:gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className="text-lg font-bold text-white tracking-tight hover:opacity-90 transition-opacity cursor-pointer"
          >
            iLoveFree
          </button>

          {/* Navigation Links with ample breathing room */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-400">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'workspaces'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Workspaces
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Code Studio
            </button>
            <button
              onClick={() => setActiveTab('extractor')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'extractor'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Extractor Engine
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Security & Privacy
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-2 rounded-md transition-colors cursor-pointer ${
                activeTab === 'docs'
                  ? 'text-white bg-white/10 font-semibold'
                  : 'hover:text-white hover:bg-white/5'
              }`}
            >
              Docs
            </button>
          </nav>
        </div>

        {/* Right: Actions with Generous Breathing Room */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="h-9 sm:h-10 px-3 sm:px-5 border border-[#2b2b32] hover:border-neutral-500 bg-[#121216] hover:bg-[#1a1a20] text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap"
            title="Sign In with Google (Session securely remembered via cookies)"
          >
            <LogIn className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="hidden sm:inline">
              {signingIn ? 'Signing in...' : user ? user.displayName || 'Account' : 'Sign In'}
            </span>
            <span className="sm:hidden">{user ? 'Account' : 'Sign In'}</span>
          </button>

          <button
            onClick={onTryNow}
            className="h-9 sm:h-10 px-4 sm:px-6 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <span>Try Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-14 lg:px-20 py-10 sm:py-16 text-center max-w-5xl mx-auto w-full">
        {/* Main Headline */}
        <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.14] mb-5 sm:mb-6 max-w-4xl">
          Unpack transcripts into clean, workable codebases.
        </h1>

        {/* Value Subheading */}
        <p className="text-xs sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-normal">
          The free, developer-first workbench to turn AI chat logs, markdown code fences, and multi-file directory trees into structured, production-ready projects. Deterministic parsing, in-browser VS Code studio, and instant offline ZIP export.
        </p>

        {/* CTA Button Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-10 sm:mb-14">
          <button
            onClick={onTryNow}
            className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs sm:text-sm font-bold uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-xl"
          >
            <span>Try Now — Free Forever</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-7 border border-[#2b2b32] hover:border-neutral-500 bg-[#121216] hover:bg-[#1a1a22] text-neutral-200 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <LogIn className="w-4 h-4 text-neutral-400" />
            <span>{signingIn ? 'Signing in...' : user ? `Continue as ${user.displayName || 'User'}` : 'Sign In with Google'}</span>
          </button>
        </div>

        {/* Secondary Sub-Navigation Pill for Pages */}
        <div className="flex overflow-x-auto no-scrollbar max-w-full items-center gap-1.5 sm:gap-2 mb-8 bg-[#121216] border border-[#24242c] p-1.5 rounded-xl text-xs shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>01. Extractor Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'workspaces'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>02. Workspaces</span>
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>03. Code Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('extractor')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'extractor'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>04. Deterministic Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>05. Security & Privacy</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>06. Quick Start</span>
          </button>
        </div>

        {/* 3. Demo Pictures Showcase matching the user request: "make more of those in the other pages too" */}
        <div className="w-full">
          {/* TAB 1: OVERVIEW & TRANSCRIPT EXTRACTOR DEMO PICTURE */}
          {activeTab === 'overview' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    ilovefree-extractor // transcript-to-codebase
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>100% Deterministic</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0d0d10]">
                {/* Left: Input pane preview */}
                <div className="space-y-2.5 border border-[#222228] p-3.5 rounded-lg bg-[#141418]/60 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1.5 pb-2 border-b border-[#202026]">
                      <Terminal className="w-3 h-3 text-[#3b82f6]" />
                      <span>Input Transcript Markdown</span>
                    </div>
                    <pre className="text-[11px] text-neutral-300 overflow-x-auto leading-relaxed pt-2">
{`project-saas/
├── package.json
├── tsconfig.json
└── src/
    ├── app.tsx
    └── lib/db.ts

\`\`\`json package.json
{
  "name": "project-saas",
  "version": "1.0.0",
  "dependencies": { "next": "15.0" }
}
\`\`\`

\`\`\`typescript src/app.tsx
export default function App() {
  return <div>Welcome to iLoveFree</div>;
}
\`\`\``}
                    </pre>
                  </div>
                  <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-500 flex justify-between">
                    <span>Fences parsed: 2 code blocks</span>
                    <span>Format: UTF-8</span>
                  </div>
                </div>

                {/* Right: Output files preview */}
                <div className="space-y-2.5 border border-[#222228] p-3.5 rounded-lg bg-[#141418]/60 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between pb-2 border-b border-[#202026]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Extracted Project Structure</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        Audit Passed
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] pt-2">
                      <div className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors text-white">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-[#cbcb41]" />
                          <span className="font-semibold">package.json</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">98 B • json</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors text-white">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-[#3178c6]" />
                          <span className="font-semibold">src/app.tsx</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">114 B • tsx</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors text-neutral-400">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-3.5 h-3.5 text-[#cbcb41]" />
                          <span>tsconfig.json</span>
                        </div>
                        <span className="text-[10px] text-neutral-500">placeholder • ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#202026] flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">3 files ready in memory</span>
                    <button
                      onClick={onTryNow}
                      className="px-2.5 py-1 bg-white text-black font-bold text-[10px] rounded uppercase hover:bg-neutral-200 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export ZIP</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSPACES & PROJECTS DASHBOARD DEMO PICTURE */}
          {activeTab === 'workspaces' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    iLoveFree // custom-workspaces-manager
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                  <span>SQLite & Cloud Backed</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-[#0d0d10] space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#202026]">
                  <div className="flex-1 max-w-sm flex items-center gap-2 bg-[#141418] border border-[#27272e] px-3 py-1.5 rounded-lg text-neutral-400 text-xs">
                    <Search className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Search projects, files or transcripts...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1.5 bg-[#18181e] border border-[#282832] rounded-lg text-[11px] text-neutral-300 flex items-center gap-1.5">
                      <FolderPlus className="w-3 h-3 text-neutral-400" />
                      <span>New Workspace</span>
                    </div>
                  </div>
                </div>

                {/* Project Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2 hover:border-neutral-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#3b82f6] font-bold">NEXT.JS 15</span>
                      <Star className="w-3.5 h-3.5 fill-[#e2b340] text-[#e2b340]" />
                    </div>
                    <div className="font-bold text-white text-xs">ecommerce-saas-platform</div>
                    <div className="text-[11px] text-neutral-400">28 files • 184 KB • 12 snapshots</div>
                    <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-500 flex justify-between">
                      <span>Updated 20 mins ago</span>
                      <span className="text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2 hover:border-neutral-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#3572a5] font-bold">PYTHON 3.12</span>
                      <Star className="w-3.5 h-3.5 text-neutral-600 hover:text-[#e2b340]" />
                    </div>
                    <div className="font-bold text-white text-xs">fastapi-microservice-backend</div>
                    <div className="text-[11px] text-neutral-400">16 files • 92 KB • 4 snapshots</div>
                    <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-500 flex justify-between">
                      <span>Updated yesterday</span>
                      <span className="text-neutral-400 font-semibold">Synced</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2 hover:border-neutral-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#dea584] font-bold">RUST WASM</span>
                      <Star className="w-3.5 h-3.5 text-neutral-600 hover:text-[#e2b340]" />
                    </div>
                    <div className="font-bold text-white text-xs">wasm-deterministic-parser</div>
                    <div className="text-[11px] text-neutral-400">9 files • 64 KB • 2 snapshots</div>
                    <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-500 flex justify-between">
                      <span>Updated 3 days ago</span>
                      <span className="text-neutral-400 font-semibold">Synced</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#121216] border border-[#222228] rounded-lg flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Organize multiple customer transcripts into separate workspaces without losing track of previous exports.</span>
                  <button onClick={onTryNow} className="text-white hover:underline cursor-pointer font-bold">
                    Launch Workspaces →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE STUDIO (VS CODE WORKSPACE) DEMO PICTURE */}
          {activeTab === 'editor' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    iLoveFree // vscode-floating-panels-studio
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">Floating Panels • Clean Gaps</div>
              </div>

              <div className="p-3 bg-[#09090b] flex gap-2 h-72 overflow-hidden">
                {/* Slim Activity Bar */}
                <div className="w-10 h-full bg-[#121216] border border-[#24242c] rounded-lg flex flex-col items-center py-2.5 gap-2 shrink-0">
                  <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-white" title="Explorer">
                    <FolderOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 hover:bg-white/5 rounded flex items-center justify-center text-neutral-400" title="Source">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 hover:bg-white/5 rounded flex items-center justify-center text-neutral-400" title="Checkpoints">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 hover:bg-white/5 rounded flex items-center justify-center text-neutral-400" title="Diagnostics">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Primary Sidebar Card */}
                <div className="w-48 h-full bg-[#141418] border border-[#24242c] rounded-lg p-2.5 flex flex-col justify-between shrink-0">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">EXPLORER</div>
                    <div className="space-y-1 text-[11px]">
                      <div className="text-neutral-300 font-semibold">▾ src/</div>
                      <div className="pl-3 text-white flex items-center gap-1.5 bg-white/10 px-1 py-0.5 rounded">
                        <FileCode className="w-3 h-3 text-[#3178c6]" />
                        <span>app.tsx</span>
                      </div>
                      <div className="pl-3 text-neutral-400 flex items-center gap-1.5 hover:text-white px-1 py-0.5">
                        <FileCode className="w-3 h-3 text-[#cbcb41]" />
                        <span>package.json</span>
                      </div>
                      <div className="pl-3 text-neutral-400 flex items-center gap-1.5 hover:text-white px-1 py-0.5">
                        <FileCode className="w-3 h-3 text-[#3178c6]" />
                        <span>lib/db.ts</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-500 pt-2 border-t border-[#202026]">
                    4 files extracted
                  </div>
                </div>

                {/* Main Code Editor Card */}
                <div className="flex-1 h-full bg-[#18181c] border border-[#24242c] rounded-lg flex flex-col overflow-hidden">
                  <div className="h-7 bg-[#141418] border-b border-[#24242c] flex items-center px-2 text-[11px] gap-2">
                    <div className="bg-[#18181c] text-white px-2.5 py-1 border-t-2 border-t-[#3b82f6] font-semibold flex items-center gap-1.5 rounded-t">
                      <FileCode className="w-3 h-3 text-[#3178c6]" />
                      <span>app.tsx</span>
                    </div>
                  </div>
                  <div className="p-3 text-[11px] leading-relaxed text-neutral-300 flex-1 overflow-y-auto">
                    <div className="text-neutral-500 font-mono">1  import React from &apos;react&apos;;</div>
                    <div className="text-neutral-500 font-mono">2  import &#123; createClient &#125; from &apos;@supabase/supabase-js&apos;;</div>
                    <div className="text-neutral-500 font-mono">3  </div>
                    <div className="text-white font-mono">4  export default function SaaS() &#123;</div>
                    <div className="text-white font-mono">5    return &lt;main className=&quot;workbench&quot;&gt;Hello from iLoveFree!&lt;/main&gt;;</div>
                    <div className="text-white font-mono">6  &#125;</div>
                  </div>
                  <div className="h-6 bg-[#141418] border-t border-[#202026] px-2 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>UTF-8 • TypeScript React • Spaces: 2</span>
                    <span className="text-emerald-400">0 Errors • 0 Warnings</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DETERMINISTIC AUDIT & PARSER ENGINE DEMO PICTURE */}
          {activeTab === 'extractor' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    iLoveFree // deterministic-audit-heuristics
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-bold">100% Client-Side Engine</div>
              </div>

              <div className="p-4 sm:p-5 bg-[#0d0d10] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Fence Attribute Parser</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Automatically detects inline filepath tags like <code className="text-white bg-black/60 px-1 py-0.5 rounded">```tsx src/app.tsx</code> and header annotations.
                    </p>
                  </div>

                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5">
                    <div className="text-[10px] text-[#e2b340] uppercase font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Truncation Guard</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Scans for truncated LLM statements like <code className="text-white bg-black/60 px-1 py-0.5 rounded">{`// ... rest of code`}</code> and notifies you before export.
                    </p>
                  </div>

                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5">
                    <div className="text-[10px] text-sky-400 uppercase font-bold flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Version Checkpoints</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Creates instant immutable snapshots of project state so you can test experimental modifications and restore instantly.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-[#141418]/80 border border-[#24242c] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                  <div className="space-y-0.5 text-neutral-300">
                    <span className="font-bold text-white">No AI Hallucinations. No Code Mutation.</span>
                    <p className="text-neutral-400 text-[10px]">What was in your transcript is preserved verbatim, down to the exact indentation.</p>
                  </div>
                  <button
                    onClick={onTryNow}
                    className="px-4 py-2 bg-white text-black font-bold uppercase rounded-lg text-xs hover:bg-neutral-200 transition-colors shrink-0 cursor-pointer"
                  >
                    Test with Sample Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & PRIVACY DEMO PICTURE */}
          {activeTab === 'security' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    iLoveFree // security-and-cookies-architecture
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Secure & Private</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-[#0d0d10] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Persistent Secure Cookie Login</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Your session is maintained via hardened cookies (<code className="text-white bg-black/60 px-1 py-0.5 rounded">SameSite=Lax; Secure</code>) with 30-day lifecycle. Return visits immediately recognize your authenticated state.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" />
                      <span>Zero Telemetry & Zero Data Selling</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      We do not track your code, your keystrokes, or your project contents. No analytics scripts, no trackers, and no external AI model retraining.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>Client-Side Local Memory Processing</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      All markdown parsing, tree audits, and ZIP file compressions execute in browser memory. Even with hundreds of files, execution is instant.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#141418] border border-[#24242c] rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Protected Database Workspaces</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Projects you choose to save are bound to your authenticated user UID in PostgreSQL, guarded by row-level access control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: QUICK START & DOCS DEMO PICTURE */}
          {activeTab === 'docs' && (
            <div className="w-full bg-[#111115] border border-[#24242c] rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs">
              <div className="h-9 border-b border-[#222228] bg-[#141418] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-[11px] text-neutral-400 font-semibold">
                    iLoveFree // developer-quickstart-guide
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">3-Step Workflow</div>
              </div>

              <div className="p-4 sm:p-5 bg-[#0d0d10] space-y-3.5">
                <div className="space-y-3">
                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-white mb-0.5">Input Your Transcript or Upload Folder</div>
                      <p className="text-neutral-400 text-[11px]">
                        Paste any conversation from ChatGPT, Claude, Gemini, or open-source LLMs into the Source editor, or drag-and-drop an entire local folder.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-white mb-0.5">Inspect & Edit in VS Code Studio</div>
                      <p className="text-neutral-400 text-[11px]">
                        Browse files in the tree, review syntax highlighting, resolve any missing path warnings, and test edits directly in the split view editor.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#141418] border border-[#24242c] rounded-xl flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-white mb-0.5">Instant Offline ZIP Download</div>
                      <p className="text-neutral-400 text-[11px]">
                        Click Export ZIP to generate an archive ready to run (<code className="text-white bg-black/60 px-1 py-0.5 rounded">npm install &amp;&amp; npm run dev</code>).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onTryNow}
                    className="h-10 px-6 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg text-xs uppercase flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Get Started Immediately</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Three Core Benefits Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16 text-left">
          <div className="p-5 border border-[#24242c] bg-[#111115] rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-white" />
              <span>01. Multi-File &amp; Folder Upload</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Import transcripts, individual code files, or entire directory trees directly through high-speed browser uploads with automatic path normalization.
            </p>
          </div>

          <div className="p-5 border border-[#24242c] bg-[#111115] rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span>02. Custom Workspaces</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Group your projects into clean custom workspaces, filter by recents or favorites, and switch seamlessly with persistent state across sessions.
            </p>
          </div>

          <div className="p-5 border border-[#24242c] bg-[#111115] rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span>03. Zero LLM Hallucinations</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The deterministic parsing engine extracts exactly what is in your markdown fences without synthesizing or altering your code.
            </p>
          </div>
        </div>
      </main>

      {/* 5. Minimal, Spacious Footer in JetBrains Mono matching Hero Section */}
      <footer className="border-t border-[#1f1f23] bg-[#0c0c0e] px-6 sm:px-14 lg:px-20 py-12 mt-16 text-xs text-neutral-400 shrink-0">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-base font-bold text-white tracking-tight">iLoveFree</div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              The free, minimalist developer workbench for transcript unpacking, project workspace management, and offline ZIP archiving.
            </p>
            <div className="pt-2 text-[11px] text-neutral-500">
              100% Free • No Telemetry • Client-Side Privacy
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Product</div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={onTryNow} className="hover:text-white transition-colors cursor-pointer">
                  Extractor Studio
                </button>
              </li>
              <li>
                <button onClick={onTryNow} className="hover:text-white transition-colors cursor-pointer">
                  Workspaces Manager
                </button>
              </li>
              <li>
                <button onClick={onTryNow} className="hover:text-white transition-colors cursor-pointer">
                  VS Code Workbench
                </button>
              </li>
              <li>
                <button onClick={onTryNow} className="hover:text-white transition-colors cursor-pointer">
                  Offline ZIP Bundler
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Architecture */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Security</div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors cursor-pointer">
                  Cookie Session Policy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors cursor-pointer">
                  Client-Side Sandboxing
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors cursor-pointer">
                  Zero Telemetry Promise
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('security')} className="hover:text-white transition-colors cursor-pointer">
                  Data Isolation Architecture
                </button>
              </li>
            </ul>
          </div>

          {/* Developer Resources */}
          <div className="space-y-2.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Resources</div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => setActiveTab('docs')} className="hover:text-white transition-colors cursor-pointer">
                  Quick Start Guide
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('extractor')} className="hover:text-white transition-colors cursor-pointer">
                  Deterministic Heuristics
                </button>
              </li>
              <li>
                <button onClick={handleSignIn} className="hover:text-white transition-colors cursor-pointer">
                  Google Auth Sign In
                </button>
              </li>
              <li>
                <button onClick={onTryNow} className="hover:text-white transition-colors cursor-pointer">
                  Keyboard Shortcuts
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="max-w-6xl mx-auto pt-6 border-t border-[#1a1a20] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <div>© 2026 iLoveFree. Free forever for all developers.</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>All Systems Operational</span>
            </span>
            <span>v2.4-stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
