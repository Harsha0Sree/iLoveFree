'use client';

import React from 'react';
import { useAuth } from '@/src/context/AuthContext.tsx';
import {
  ArrowRight,
  LogIn,
  FolderOpen,
  FileCode,
  Code2,
  Download,
  Search,
  Star,
  Check,
  History,
  AlertTriangle,
  Cpu,
  Layers,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  FolderTree,
  Sparkles,
  GitCommit,
  RotateCcw,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onTryNow: () => void;
  onSignInSuccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onTryNow,
  onSignInSuccess,
}) => {
  const { user, signInWithGoogle, signingIn } = useAuth();

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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-neutral-200 font-mono flex flex-col selection:bg-white selection:text-black overflow-x-hidden">
      {/* 1. Spacious Nav Bar Optimized for Both Desktop and Mobile (>350px) */}
      <header className="h-14 sm:h-20 lg:h-24 px-3 sm:px-10 lg:px-16 bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-50 shrink-0 border-b border-[#18181b] w-full">
        {/* Left: Clean iLoveFree Typography */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-base sm:text-lg font-bold text-white tracking-tight hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            iLoveFree
          </button>

          {/* Quick Anchor Links for Smooth Scrolling (Desktop only) */}
          <nav className="hidden lg:flex items-center gap-1 text-xs text-neutral-400">
            <button
              onClick={() => scrollTo('versions-section')}
              className="px-2.5 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-neutral-400" />
              <span>Versions</span>
            </button>
            <button
              onClick={() => scrollTo('extractor-section')}
              className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Extractor
            </button>
            <button
              onClick={() => scrollTo('workbench-section')}
              className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              VS Code Studio
            </button>
            <button
              onClick={() => scrollTo('workspaces-section')}
              className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Workspaces
            </button>
            <button
              onClick={() => scrollTo('diagnostics-section')}
              className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Diagnostics
            </button>
            <button
              onClick={() => scrollTo('export-section')}
              className="px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Export &amp; ZIP
            </button>
          </nav>
        </div>

        {/* Right: Actions (Sized gracefully to prevent any wrapping or overflow) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="h-8 sm:h-10 px-2 sm:px-4 border border-[#2b2b32] hover:border-neutral-500 bg-[#121216] hover:bg-[#1a1a20] text-neutral-200 hover:text-white rounded-lg text-[11px] sm:text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Sign In with Google"
          >
            <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-400 shrink-0" />
            <span className="hidden sm:inline">
              {signingIn ? 'Signing in...' : user ? user.displayName || 'Account' : 'Sign In'}
            </span>
            <span className="sm:hidden">{user ? 'Account' : 'Sign In'}</span>
          </button>

          <button
            onClick={onTryNow}
            className="h-8 sm:h-10 px-3 sm:px-5 bg-white text-black hover:bg-neutral-200 rounded-lg text-[11px] sm:text-xs font-bold uppercase transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-md hover:shadow-lg whitespace-nowrap shrink-0"
          >
            <span>Try Now</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section - Spans screen height perfectly on mobile (>350px) */}
      <section className="min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 py-8 sm:py-16 text-center max-w-5xl mx-auto w-full shrink-0">
        {/* Scaled headline matching image.png */}
        <h1 className="text-[34px] sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] text-center mb-5 sm:mb-6 max-w-[320px] sm:max-w-4xl mx-auto break-words">
          Unpack transcripts into clean, workable codebases.
        </h1>

        {/* Subtitle description matching image.png */}
        <p className="text-xs sm:text-base text-neutral-400 font-mono text-center leading-[1.65] max-w-[320px] sm:max-w-xl mx-auto mb-8 sm:mb-10 px-1">
          Turn AI conversation logs, markdown code fences, and directory trees into structured, runnable projects. Complete with version tracking, in-browser VS Code editing, and instant offline ZIP export.
        </p>

        {/* Action Buttons: Stacked on mobile with exact width max-w-[330px], matching image.png */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-[330px] sm:max-w-none sm:w-auto mx-auto">
          <button
            onClick={onTryNow}
            className="w-full sm:w-auto h-12 sm:h-13 px-6 sm:px-8 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl"
          >
            <span>TRY NOW — FREE FOREVER</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full sm:w-auto h-12 sm:h-13 px-5 sm:px-7 border border-[#272730] hover:border-neutral-500 bg-[#0f0f14] hover:bg-[#181820] text-white rounded-xl text-xs sm:text-sm font-mono font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 text-neutral-300" />
            <span>{signingIn ? 'Signing in...' : user ? `Continue as ${user.displayName || 'User'}` : 'Sign In with Google'}</span>
          </button>
        </div>
      </section>

      {/* 3. Features Showcase Container */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 lg:px-16 pb-12 sm:pb-20 text-center max-w-5xl mx-auto w-full">

        {/* ========================================================================= */}
        {/* ALL FEATURES SCROLLABLE ONE AFTER ANOTHER (NO BUTTON TABS NEEDED)         */}
        {/* ========================================================================= */}
        <div className="w-full space-y-16 sm:space-y-24 text-left">

          {/* ========================================================================= */}
          {/* FEATURE 1 (HIGHLIGHTED): VERSION HISTORY & SNAPSHOT SYSTEM               */}
          {/* ========================================================================= */}
          <section id="versions-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#26262e] pb-3 sm:pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2">
                  <History className="w-3 h-3 text-neutral-300" />
                  <span>Highlight Feature</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                  Version History &amp; Snapshots
                </h2>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Track full-project revisions, inspect side-by-side diffs, and rollback with one click across iterative AI generations.
                </p>
              </div>

              <button
                onClick={onTryNow}
                className="h-8 px-3.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg text-xs uppercase flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
              >
                <span>Launch Versions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Detailed UI Demo for Versions */}
            <div className="bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
              {/* Studio Window Bar */}
              <div className="h-9 sm:h-10 border-b border-[#222228] bg-[#141418] px-3 sm:px-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70 shrink-0" />
                  <span className="ml-2 text-neutral-400 font-semibold text-[10px] sm:text-[11px] truncate">
                    version-timeline // snapshots
                  </span>
                </div>
                <div className="text-neutral-400 flex items-center gap-1.5 text-[10px] sm:text-[11px] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>3 Snapshots</span>
                </div>
              </div>

              {/* Version Timeline Nodes */}
              <div className="p-3 sm:p-6 bg-[#0e0e12] border-b border-[#202026]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                  {/* Snapshot Node 1 */}
                  <div className="p-3 sm:p-3.5 bg-[#141418] border border-[#26262e] rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">v1.0</span>
                        <span className="text-[10px] text-neutral-400">10m ago</span>
                      </div>
                      <div className="font-semibold text-white text-xs">Initial Scaffold</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">4 files • Baseline</div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#202026] flex items-center justify-between text-[10px] text-neutral-400">
                      <span>4 files total</span>
                      <span className="text-white hover:underline cursor-pointer">Inspect</span>
                    </div>
                  </div>

                  {/* Snapshot Node 2 */}
                  <div className="p-3 sm:p-3.5 bg-[#141418] border border-[#26262e] rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">v1.1</span>
                        <span className="text-[10px] text-neutral-400">4m ago</span>
                      </div>
                      <div className="font-semibold text-white text-xs">Auth &amp; Database</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">+3 files • Supabase</div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#202026] flex items-center justify-between text-[10px] text-neutral-400">
                      <span>7 files total</span>
                      <span className="text-white hover:underline cursor-pointer">Inspect</span>
                    </div>
                  </div>

                  {/* Snapshot Node 3 (Active) */}
                  <div className="p-3 sm:p-3.5 bg-[#181820] border-2 border-white rounded-xl flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">v1.2</span>
                          <span className="text-[9px] px-1 py-0.2 bg-white/20 text-white rounded">ACTIVE</span>
                        </div>
                        <span className="text-[10px] text-neutral-300">Just now</span>
                      </div>
                      <div className="font-bold text-white text-xs">UI Components &amp; Studio</div>
                      <div className="text-[11px] text-neutral-300 mt-0.5">+2 files • Responsive layout</div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[#2a2a36] flex items-center justify-between text-[10px]">
                      <span className="text-neutral-300">9 files total</span>
                      <button
                        onClick={onTryNow}
                        className="px-2 py-0.5 bg-white text-black font-bold rounded text-[10px] uppercase cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Visual Diff Inspection Demo */}
              <div className="p-3 sm:p-6 bg-[#09090b] grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
                {/* Previous Version Diff */}
                <div className="bg-[#121216] border border-[#22222a] rounded-xl p-3 sm:p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] pb-1.5 border-b border-[#202028]">
                    <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                      <RotateCcw className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>v1.1 Snapshot (Previous)</span>
                    </div>
                    <span className="text-neutral-400 text-[10px]">src/app.tsx</span>
                  </div>
                  <pre className="text-[10px] sm:text-[11px] leading-relaxed text-neutral-400 pt-1 overflow-x-auto no-scrollbar">
{`1  export default function App() {
2    return (
3      <div className="container">
- 4        <h1>Loading State</h1>
- 5        <p>Awaiting setup</p>
6      </div>
7    );
8  }`}
                  </pre>
                </div>

                {/* Active Version Diff */}
                <div className="bg-[#14141a] border border-[#2a2a36] rounded-xl p-3 sm:p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] pb-1.5 border-b border-[#242430]">
                    <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                      <GitCommit className="w-3 h-3 text-white shrink-0" />
                      <span>v1.2 Snapshot (Active)</span>
                    </div>
                    <span className="text-white text-[10px]">src/app.tsx</span>
                  </div>
                  <pre className="text-[10px] sm:text-[11px] leading-relaxed text-white pt-1 overflow-x-auto no-scrollbar">
{`1  export default function App() {
2    return (
3      <div className="container">
+ 4        <Header title="iLoveFree" />
+ 5        <CodeStudio files={projectFiles} />
6      </div>
7    );
8  }`}
                  </pre>
                </div>
              </div>

              {/* Key Features Pill Row */}
              <div className="p-3 sm:p-4 bg-[#121216] border-t border-[#202026] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-[11px] text-neutral-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Immutable project checkpoints</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Instant 1-click rollback without data loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Export any past version as standalone ZIP</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* FEATURE 2: MULTI-FILE TRANSCRIPT EXTRACTOR & AST PARSER                   */}
          {/* ========================================================================= */}
          <section id="extractor-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="border-b border-[#26262e] pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                Deterministic Transcript Extractor
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Parse markdown code fences, first-line comments, and ASCII directory trees into concrete files with zero token latency.
              </p>
            </div>

            <div className="bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-9 sm:h-10 border-b border-[#222228] bg-[#141418] px-3 sm:px-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70 shrink-0" />
                  <span className="ml-2 text-neutral-400 font-semibold text-[10px] sm:text-[11px] truncate">
                    ast-parser // transcript-to-disk
                  </span>
                </div>
                <div className="text-neutral-400 text-[10px] sm:text-[11px] shrink-0">100% Deterministic Engine</div>
              </div>

              <div className="p-3 sm:p-6 bg-[#0d0d10] grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Left: Input Markdown */}
                <div className="lg:col-span-5 bg-[#141418] border border-[#222228] rounded-xl p-3 sm:p-4 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 pb-1.5 border-b border-[#202026] flex items-center justify-between">
                    <span>Input Markdown Transcript</span>
                    <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                  <pre className="text-[10px] sm:text-[11px] text-neutral-300 overflow-x-auto leading-relaxed pt-1 no-scrollbar">
{`project/
├── package.json
└── src/
    └── server.ts

\`\`\`json package.json
{ "name": "api-service", "version": "1.0" }
\`\`\`

\`\`\`ts src/server.ts
// filepath: src/server.ts
import express from 'express';
const app = express();
app.listen(3000);
\`\`\``}
                  </pre>
                </div>

                {/* Center: Flow indicator */}
                <div className="lg:col-span-2 flex flex-col items-center justify-center py-1 text-center space-y-1">
                  <div className="p-2 sm:p-3 rounded-full bg-[#1c1c24] border border-[#2e2e3c] text-white">
                    <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-xs font-bold text-white">AST Parser</div>
                  <div className="text-[10px] text-neutral-400">
                    Auto-links fences &amp; trees
                  </div>
                  <div className="lg:hidden text-neutral-500 pt-1">
                    <ChevronDown className="w-4 h-4 mx-auto" />
                  </div>
                </div>

                {/* Right: Output Files */}
                <div className="lg:col-span-5 bg-[#141418] border border-[#222228] rounded-xl p-3 sm:p-4 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-white pb-1.5 border-b border-[#202026] flex items-center justify-between">
                    <span>Extracted Project Structure</span>
                    <FolderTree className="w-3.5 h-3.5 text-white" />
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex items-center justify-between p-2 rounded bg-white/5 text-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span className="font-semibold truncate">package.json</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">42 B</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white/5 text-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                        <span className="font-semibold truncate">src/server.ts</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0">89 B</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#202026] flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">2 files ready</span>
                    <button
                      onClick={onTryNow}
                      className="px-2.5 py-1 bg-white text-black font-bold text-[10px] sm:text-xs rounded uppercase hover:bg-neutral-200 transition-colors"
                    >
                      Open in Studio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* FEATURE 3: IN-BROWSER VS CODE WORKBENCH STUDIO                            */}
          {/* ========================================================================= */}
          <section id="workbench-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="border-b border-[#26262e] pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                In-Browser VS Code Studio
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                A desktop-class workbench with file navigation, tabbed editors, split view, and JetBrains Mono typography.
              </p>
            </div>

            {/* VS Code Studio Window Demo - Adaptive layout for mobile vs desktop */}
            <div className="bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl text-xs font-mono">
              <div className="h-9 sm:h-10 border-b border-[#222228] bg-[#141418] px-3 sm:px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/70 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/70 shrink-0" />
                  <span className="ml-2 text-white font-semibold text-[10px] sm:text-[11px] truncate">
                    iLoveFree Studio — project-workspace
                  </span>
                </div>
                <div className="text-neutral-400 text-[10px] sm:text-[11px] shrink-0">Split View • Minimap</div>
              </div>

              {/* Desktop 3-Column Studio View (hidden on small mobile screens to prevent squeezing) */}
              <div className="hidden sm:flex p-3 bg-[#09090b] gap-2 h-80 overflow-hidden">
                {/* Slim Activity Bar */}
                <div className="w-11 h-full bg-[#121216] border border-[#24242c] rounded-xl flex flex-col items-center py-3 gap-3 shrink-0">
                  <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-bold">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div className="w-7 h-7 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="w-7 h-7 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="w-7 h-7 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                </div>

                {/* Explorer File Tree */}
                <div className="w-52 h-full bg-[#141418] border border-[#24242c] rounded-xl p-3 flex flex-col justify-between shrink-0">
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                      EXPLORER
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="text-white font-semibold">▾ src/</div>
                      <div className="pl-3.5 text-white flex items-center gap-1.5 bg-white/10 px-1.5 py-1 rounded">
                        <FileCode className="w-3.5 h-3.5 text-neutral-300" />
                        <span>app.tsx</span>
                      </div>
                      <div className="pl-3.5 text-neutral-400 flex items-center gap-1.5 hover:text-white px-1.5 py-1">
                        <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                        <span>lib/db.ts</span>
                      </div>
                      <div className="pl-3.5 text-neutral-400 flex items-center gap-1.5 hover:text-white px-1.5 py-1">
                        <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                        <span>package.json</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-2 border-t border-[#202026]">
                    3 files in workspace
                  </div>
                </div>

                {/* Main Code Editor with Tabs */}
                <div className="flex-1 h-full bg-[#18181c] border border-[#24242c] rounded-xl flex flex-col overflow-hidden">
                  <div className="h-8 bg-[#141418] border-b border-[#24242c] flex items-center px-2 text-xs gap-1">
                    <div className="bg-[#18181c] text-white px-3 py-1.5 border-t-2 border-t-white font-semibold flex items-center gap-2 rounded-t">
                      <FileCode className="w-3.5 h-3.5 text-neutral-300" />
                      <span>app.tsx</span>
                    </div>
                  </div>

                  <div className="p-4 text-xs leading-relaxed text-neutral-300 flex-1 overflow-y-auto">
                    <div className="text-neutral-500 font-mono">1  import React from &apos;react&apos;;</div>
                    <div className="text-neutral-500 font-mono">2  import &#123; Client &#125; from &apos;./lib/db&apos;;</div>
                    <div className="text-neutral-500 font-mono">3  </div>
                    <div className="text-white font-mono">4  export default function Studio() &#123;</div>
                    <div className="text-white font-mono">5    return &lt;main className=&quot;workbench&quot;&gt;Hello from iLoveFree!&lt;/main&gt;;</div>
                    <div className="text-white font-mono">6  &#125;</div>
                  </div>

                  <div className="h-7 bg-[#141418] border-t border-[#202026] px-3 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>UTF-8 • TypeScript React • Spaces: 2</span>
                    <span className="text-white">0 Errors • 0 Warnings</span>
                  </div>
                </div>
              </div>

              {/* Mobile Screen Studio View (<640px) */}
              <div className="sm:hidden p-2.5 bg-[#09090b] flex flex-col gap-2">
                {/* Active Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <div className="bg-[#18181c] text-white px-2.5 py-1 border-t-2 border-t-white font-semibold flex items-center gap-1.5 rounded-t text-[11px] shrink-0">
                    <FileCode className="w-3 h-3 text-neutral-300" />
                    <span>app.tsx</span>
                  </div>
                  <div className="bg-[#121216] text-neutral-400 px-2.5 py-1 flex items-center gap-1.5 rounded-t text-[11px] shrink-0">
                    <FileCode className="w-3 h-3 text-neutral-500" />
                    <span>lib/db.ts</span>
                  </div>
                </div>

                {/* Code Body */}
                <div className="bg-[#18181c] border border-[#24242c] rounded-lg p-3 text-[10px] leading-relaxed text-neutral-300 overflow-x-auto no-scrollbar">
                  <div className="text-neutral-500 font-mono">1  import React from &apos;react&apos;;</div>
                  <div className="text-neutral-500 font-mono">2  import &#123; Client &#125; from &apos;./lib/db&apos;;</div>
                  <div className="text-neutral-500 font-mono">3  </div>
                  <div className="text-white font-mono">4  export default function Studio() &#123;</div>
                  <div className="text-white font-mono">5    return &lt;main&gt;Hello from iLoveFree!&lt;/main&gt;;</div>
                  <div className="text-white font-mono">6  &#125;</div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1">
                  <span>UTF-8 • TypeScript</span>
                  <span className="text-white">0 Errors</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* FEATURE 4: CLOUD WORKSPACES & MULTI-PROJECT MANAGER                       */}
          {/* ========================================================================= */}
          <section id="workspaces-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="border-b border-[#26262e] pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                Cloud Workspaces &amp; Project Dashboard
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Organize projects with persistent cloud storage, starred favorites, and instant multi-workspace switching.
              </p>
            </div>

            <div className="bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl p-3 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#202026]">
                <div className="flex-1 max-w-sm flex items-center gap-2 bg-[#141418] border border-[#27272e] px-2.5 py-1.5 rounded-lg text-neutral-400 text-xs">
                  <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">Search projects, transcripts...</span>
                </div>
                <button
                  onClick={onTryNow}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white text-black font-bold text-[10px] sm:text-xs rounded-lg uppercase cursor-pointer shrink-0"
                >
                  New Project
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                <div className="p-3 sm:p-4 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5 hover:border-neutral-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">NEXT.JS 15</span>
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                  </div>
                  <div className="font-bold text-white text-xs truncate">ecommerce-saas-platform</div>
                  <div className="text-[11px] text-neutral-400">28 files • 184 KB • 12 snapshots</div>
                  <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-400 flex justify-between">
                    <span>Active</span>
                    <span>20m ago</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5 hover:border-neutral-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">PYTHON 3.12</span>
                    <Star className="w-3.5 h-3.5 text-neutral-600 hover:text-white" />
                  </div>
                  <div className="font-bold text-white text-xs truncate">fastapi-microservice-backend</div>
                  <div className="text-[11px] text-neutral-400">16 files • 92 KB • 4 snapshots</div>
                  <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-400 flex justify-between">
                    <span>Synced</span>
                    <span>Yesterday</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-[#141418] border border-[#24242c] rounded-xl space-y-1.5 hover:border-neutral-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">RUST WASM</span>
                    <Star className="w-3.5 h-3.5 text-neutral-600 hover:text-white" />
                  </div>
                  <div className="font-bold text-white text-xs truncate">wasm-deterministic-parser</div>
                  <div className="text-[11px] text-neutral-400">9 files • 64 KB • 2 snapshots</div>
                  <div className="pt-2 border-t border-[#202026] text-[10px] text-neutral-400 flex justify-between">
                    <span>Synced</span>
                    <span>3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* FEATURE 5: DETERMINISTIC AUDIT & REPAIR DIAGNOSTICS                       */}
          {/* ========================================================================= */}
          <section id="diagnostics-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="border-b border-[#26262e] pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                Automated Diagnostics &amp; Auto-Repair
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Catches truncated AI responses, generates skeleton stubs, and resolves duplicate codeblocks before you export.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl space-y-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-bold text-white text-xs uppercase tracking-wider">Truncation Guard</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Identifies omissions like <code className="text-white bg-black/60 px-1 py-0.5 rounded">{'// ... rest of code'}</code> and notifies you to re-prompt or complete the missing snippet.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl space-y-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-bold text-white text-xs uppercase tracking-wider">Missing File Stubs</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Generates scaffold stub files for filenames referenced in directory trees that were omitted from conversational output blocks.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl space-y-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-bold text-white text-xs uppercase tracking-wider">Duplicate Resolution</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Automatically correlates multiple versions of the same file across long chats, defaulting to the latest updated version.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* FEATURE 6: INSTANT 1-CLICK ZIP PACKAGING & OFFLINE PRIVACY                */}
          {/* ========================================================================= */}
          <section id="export-section" className="space-y-4 sm:space-y-6 pt-2 scroll-mt-20">
            <div className="border-b border-[#26262e] pb-3 sm:pb-4">
              <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                Instant Offline ZIP Export &amp; Privacy
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Client-side compression pipeline. Zero telemetry, zero server-side inspection, and zero retraining.
              </p>
            </div>

            <div className="p-4 sm:p-6 bg-[#111115] border border-[#24242c] rounded-xl sm:rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              <div className="space-y-1.5 max-w-lg">
                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  <span>100% In-Browser Memory Processing</span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  All transcript parsing, diagnostics auditing, and Deflate ZIP archiving execute exclusively within your local browser. Your intellectual property never leaves your machine.
                </p>
              </div>

              <button
                onClick={onTryNow}
                className="w-full sm:w-auto h-11 px-6 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download ZIP Demo</span>
              </button>
            </div>
          </section>
        </div>

        {/* Bottom CTA Row */}
        <div className="w-full mt-16 sm:mt-24 pt-8 sm:pt-12 border-t border-[#1f1f23] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-base sm:text-lg font-bold text-white">Ready to unpack your first transcript?</div>
            <div className="text-xs text-neutral-400">Free forever. No credit card. Zero setup required.</div>
          </div>
          <button
            onClick={onTryNow}
            className="w-full sm:w-auto h-12 px-8 bg-white text-black hover:bg-neutral-200 font-bold rounded-lg text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xl"
          >
            <span>Launch Studio Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* 5. Minimal, Clean Mobile-Optimized Footer */}
      <footer className="border-t border-[#1f1f23] bg-[#0c0c0e] px-4 sm:px-10 lg:px-16 py-8 sm:py-12 text-xs text-neutral-400 shrink-0 w-full">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="text-base font-bold text-white tracking-tight">iLoveFree</div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The minimalist developer workbench for AI transcript unpacking, project workspace management, and offline ZIP archiving.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-1.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Features</div>
            <ul className="space-y-1 text-xs text-neutral-400">
              <li><button onClick={() => scrollTo('versions-section')} className="hover:text-white cursor-pointer">Version History</button></li>
              <li><button onClick={() => scrollTo('extractor-section')} className="hover:text-white cursor-pointer">Transcript Extractor</button></li>
              <li><button onClick={() => scrollTo('workbench-section')} className="hover:text-white cursor-pointer">VS Code Studio</button></li>
              <li><button onClick={() => scrollTo('workspaces-section')} className="hover:text-white cursor-pointer">Custom Workspaces</button></li>
            </ul>
          </div>

          {/* Guarantees */}
          <div className="space-y-1.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Guarantees</div>
            <ul className="space-y-1 text-xs text-neutral-400">
              <li><span>100% Deterministic</span></li>
              <li><span>Zero AI Telemetry</span></li>
              <li><span>Client-Side Processing</span></li>
              <li><span>Free Forever</span></li>
            </ul>
          </div>

          {/* Access */}
          <div className="space-y-1.5">
            <div className="font-bold text-white text-[11px] uppercase tracking-wider">Access</div>
            <ul className="space-y-1 text-xs text-neutral-400">
              <li><button onClick={onTryNow} className="text-white hover:underline cursor-pointer font-bold">Launch Studio →</button></li>
              <li><button onClick={handleSignIn} className="hover:text-white cursor-pointer">Google Sign In</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto pt-4 sm:pt-6 border-t border-[#1a1a20] flex items-center justify-center text-[11px] text-neutral-500 text-center">
          <div>© 2026 iLoveFree. Free forever for all developers.</div>
        </div>
      </footer>
    </div>
  );
};
