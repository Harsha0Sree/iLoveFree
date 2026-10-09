'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DiagnosticIssue, ExtractedCodeBlock, ProjectFile } from '@/lib/parser';
import { ProjectCheckpoint } from '@/lib/checkpoints';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  RotateCcw,
  Plus,
  Code2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal as TerminalIcon,
  Trash,
  FolderTree,
  FileQuestion,
  FileCode,
  Folder,
  Layers,
} from 'lucide-react';

interface VSCodeBottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: DiagnosticIssue[];
  files: Record<string, ProjectFile>;
  codeBlocks: ExtractedCodeBlock[];
  treeDeclaredPaths: string[];
  rootPrefix: string | null;
  checkpoints: ProjectCheckpoint[];
  activeCheckpoint: ProjectCheckpoint | null;
  activeTab?: 'problems' | 'output' | 'terminal' | 'ports' | 'checkpoints';
  onTabChange?: (tab: 'problems' | 'output' | 'terminal' | 'ports' | 'checkpoints') => void;
  onSelectFile: (path: string) => void;
  onAssignBlockPath: (blockIndex: number, targetPath: string) => void;
  onRestoreCheckpoint: (cp: ProjectCheckpoint) => void;
  onSetActiveBaseline: (cp: ProjectCheckpoint | null) => void;
  onOpenCheckpointModal: () => void;
  onJumpToSource?: (line: number) => void;
  onUpdateFileContent?: (path: string, content: string) => void;
  onDeleteFile?: (path: string) => void;
}

export const VSCodeBottomPanel: React.FC<VSCodeBottomPanelProps> = ({
  isOpen,
  onClose,
  diagnostics,
  files,
  codeBlocks,
  treeDeclaredPaths,
  rootPrefix,
  checkpoints,
  activeCheckpoint,
  activeTab: controlledActiveTab,
  onTabChange,
  onSelectFile,
  onAssignBlockPath,
  onRestoreCheckpoint,
  onSetActiveBaseline,
  onOpenCheckpointModal,
  onJumpToSource,
  onUpdateFileContent,
  onDeleteFile,
}) => {
  // Tabs: Problems, Output, Terminal, Ports, Checkpoints (Defaults to 'problems' as requested)
  const [internalTab, setInternalTab] = useState<'problems' | 'output' | 'terminal' | 'ports' | 'checkpoints'>('problems');
  const activeTab = controlledActiveTab ?? internalTab;
  const setActiveTab = (tab: 'problems' | 'output' | 'terminal' | 'ports' | 'checkpoints') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [manualPaths, setManualPaths] = useState<Record<number, string>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({});
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [copiedProblems, setCopiedProblems] = useState(false);
  const [problemFilter, setProblemFilter] = useState<'all' | 'errors' | 'warnings' | 'missing' | 'unparsed' | 'tree'>('all');

  // Terminal state
  const [cwd, setCwd] = useState<string>(''); // relative to root workspace
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [zoxideScores, setZoxideScores] = useState<Record<string, number>>({});
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'input' | 'output'; text: string; cwd?: string }>>([
    {
      type: 'input',
      text: `init project: ${rootPrefix || 'my-project'}`,
      cwd: '',
    },
    {
      type: 'output',
      text: 'iLoveFree Virtual Environment v2.4 (CLI & Posix Tools Active)\nLoaded utilities: zoxide (z), tree, ripgrep (rg), fd, ls, cat, cd, pwd, mkdir, touch, rm, clear, help.\nType "help" to view full manual.',
    },
  ]);

  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [terminalHistory, activeTab]);

  if (!isOpen) return null;

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  // Find all unparsed / unresolved code blocks
  const unparsedBlocks = codeBlocks.filter((b) => b.status === 'unresolved' || !b.resolvedPath);

  // Missing files declared in structure tree that need code
  const missingTreePaths = treeDeclaredPaths.filter(
    (p) => !files[p] || files[p].isMissingContent
  );

  const totalProblemCount = errors.length + warnings.length + missingTreePaths.length + unparsedBlocks.length;

  const handleAssignPath = (blockIndex: number, customPath?: string) => {
    const path = (customPath || manualPaths[blockIndex] || '').trim();
    if (path) {
      onAssignBlockPath(blockIndex, path);
    }
  };

  const handleCopyCode = (blockIndex: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockIndex(blockIndex);
    setTimeout(() => setCopiedBlockIndex(null), 2000);
  };

  const toggleExpandBlock = (blockIndex: number) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockIndex]: !prev[blockIndex],
    }));
  };

  // 1-Click Copy All Problems, Missing Files, Diagnostics, and Structure Tree
  const handleCopyAllProblems = () => {
    const lines: string[] = [];
    lines.push(`# Project Integrity & Diagnostics Report`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Project Root: ${rootPrefix || 'workspace'}`);
    lines.push(`Total Files Extracted: ${Object.keys(files).length}`);
    lines.push(`Total Problems Detected: ${totalProblemCount}`);
    lines.push(`- Errors: ${errors.length}`);
    lines.push(`- Warnings: ${warnings.length}`);
    lines.push(`- Missing Files: ${missingTreePaths.length}`);
    lines.push(`- Unparsed Code Blocks: ${unparsedBlocks.length}`);
    lines.push('');

    if (missingTreePaths.length > 0) {
      lines.push(`## Missing Files (${missingTreePaths.length})`);
      lines.push(`Files declared in the project structure tree but lacking implementation code:`);
      missingTreePaths.forEach((p) => {
        lines.push(`- [MISSING] ${p}`);
      });
      lines.push('');
    }

    if (unparsedBlocks.length > 0) {
      lines.push(`## Unparsed Code Blocks (${unparsedBlocks.length})`);
      unparsedBlocks.forEach((b) => {
        lines.push(`- Block #${b.index} (${b.langTag || 'code'}): Lines ${b.startLine}-${b.endLine}`);
      });
      lines.push('');
    }

    if (diagnostics.length > 0) {
      lines.push(`## Diagnostics Issues (${diagnostics.length})`);
      diagnostics.forEach((d) => {
        lines.push(`### [${d.severity.toUpperCase()}] ${d.title}`);
        lines.push(`- Description: ${d.message}`);
        if (d.filePath) lines.push(`- Target File: ${d.filePath}`);
        if (d.line) lines.push(`- Line: ${d.line}`);
        if (d.suggestedAction) lines.push(`- Suggested Action: ${d.suggestedAction}`);
        lines.push('');
      });
    }

    if (treeDeclaredPaths.length > 0) {
      lines.push(`## Project Structure Tree Reconciliation`);
      treeDeclaredPaths.forEach((tp) => {
        const hasContent = Boolean(files[tp] && !files[tp].isMissingContent);
        lines.push(`- ${hasContent ? '[OK]' : '[MISSING]'} ${tp}`);
      });
      lines.push('');
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedProblems(true);
    setTimeout(() => setCopiedProblems(false), 2000);
  };

  // Helper: List of unique directories in project
  const getAllProjectDirs = (): string[] => {
    const dirSet = new Set<string>();
    dirSet.add('');
    Object.keys(files).forEach((p) => {
      const parts = p.split('/');
      parts.pop(); // remove filename
      let curr = '';
      for (const part of parts) {
        curr = curr ? `${curr}/${part}` : part;
        dirSet.add(curr);
      }
    });
    return Array.from(dirSet);
  };

  // Helper: Build visual ASCII tree
  const buildAsciiTree = (startDir: string = ''): string => {
    const allPaths = Object.keys(files).sort();
    const relevantPaths = startDir
      ? allPaths.filter((p) => p.startsWith(`${startDir}/`)).map((p) => p.slice(startDir.length + 1))
      : allPaths;

    if (relevantPaths.length === 0) {
      return `(empty directory: ${startDir || '.'})`;
    }

    interface TreeNode {
      [key: string]: TreeNode;
    }
    const tree: TreeNode = {};

    relevantPaths.forEach((path) => {
      const parts = path.split('/');
      let curr = tree;
      for (const part of parts) {
        if (!curr[part]) curr[part] = {};
        curr = curr[part];
      }
    });

    const outputLines: string[] = [];
    outputLines.push(startDir ? `${startDir}/` : `${rootPrefix || 'project'}/`);

    let dirCount = 0;
    let fileCount = 0;

    const render = (node: TreeNode, prefix: string) => {
      const keys = Object.keys(node).sort();
      keys.forEach((key, index) => {
        const isLast = index === keys.length - 1;
        const isDirectory = Object.keys(node[key]).length > 0;
        const connector = isLast ? '└── ' : '├── ';

        if (isDirectory) {
          dirCount++;
          outputLines.push(`${prefix}${connector}\x1b[36m${key}/\x1b[0m`);
          render(node[key], prefix + (isLast ? '    ' : '│   '));
        } else {
          fileCount++;
          outputLines.push(`${prefix}${connector}${key}`);
        }
      });
    };

    render(tree, '');
    outputLines.push(`\n${dirCount} directories, ${fileCount} files`);
    return outputLines.join('\n');
  };

  // Execute terminal commands
  const executeTerminalCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    const promptCwd = cwd ? `/${cwd}` : '';
    const newEntries = [...terminalHistory, { type: 'input' as const, text: cmd, cwd: promptCwd }];

    const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    const args = parts.map((a) => a.replace(/^["']|["']$/g, ''));
    const command = (args[0] || '').toLowerCase();

    // 1. CLEAR
    if (command === 'clear' || command === 'cls') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    // 2. HELP
    if (command === 'help') {
      newEntries.push({
        type: 'output',
        text: `Available Terminal Commands:
  z <query>         Fast jump to directory via zoxide frecency ranking (e.g. "z app", "z web")
  z -l              List tracked directories and frecency scores
  tree [dir]        Display visual hierarchical ASCII structure tree
  rg <query>        Ripgrep search regex or string across all project files
  fd <pattern>      Fast find files or directories matching name
  ls [-la] [dir]    List directory contents with colors and permissions
  cat [-n] <file>   Print file contents
  cd <dir>          Change working directory (.., ~, /, or subpath)
  pwd               Print current working directory
  mkdir [-p] <dir>  Create a virtual directory
  touch <file>      Create an empty file in workspace
  rm [-rf] <path>   Delete a file from workspace
  head [-n N] <file>Print first N lines of file (default: 10)
  tail [-n N] <file>Print last N lines of file (default: 10)
  wc <file>         Print line, word, and character counts
  echo <txt> [>f]   Echo text or redirect output to file
  clear             Clear terminal screen
  help              Display this command guide`,
      });
    }

    // 3. PWD
    else if (command === 'pwd') {
      newEntries.push({
        type: 'output',
        text: `/workspace/${rootPrefix || 'project'}${cwd ? '/' + cwd : ''}`,
      });
    }

    // 4. CD
    else if (command === 'cd') {
      const target = args[1] || '';
      const allDirs = getAllProjectDirs();

      if (!target || target === '~' || target === '/') {
        setCwd('');
        newEntries.push({ type: 'output', text: `Switched to root: /workspace/${rootPrefix || 'project'}` });
      } else if (target === '..') {
        const parts = cwd.split('/').filter(Boolean);
        parts.pop();
        const next = parts.join('/');
        setCwd(next);
        newEntries.push({ type: 'output', text: `/workspace/${rootPrefix || 'project'}${next ? '/' + next : ''}` });
      } else if (target === '.') {
        // do nothing
      } else {
        // Resolve target relative to current cwd
        let resolved = target.startsWith('/') ? target.slice(1) : cwd ? `${cwd}/${target}` : target;
        resolved = resolved.replace(/\/+$/, '');

        if (allDirs.includes(resolved)) {
          setCwd(resolved);
          // Boost zoxide score
          setZoxideScores((prev) => ({
            ...prev,
            [resolved]: (prev[resolved] || 0) + 1,
          }));
          newEntries.push({ type: 'output', text: `/workspace/${rootPrefix || 'project'}/${resolved}` });
        } else {
          newEntries.push({
            type: 'output',
            text: `cd: no such file or directory: ${target}\nAvailable subdirectories: ${allDirs.filter(d => d && (!cwd || d.startsWith(cwd))).join(', ') || 'none'}`,
          });
        }
      }
    }

    // 5. ZOXIDE (z)
    else if (command === 'z' || command === 'zoxide') {
      const query = args[1];
      const allDirs = getAllProjectDirs().filter(Boolean);

      if (!query || query === '-l') {
        const list = allDirs.map((d) => `  ${(zoxideScores[d] || 1).toString().padStart(3, ' ')}  ${d}`);
        newEntries.push({
          type: 'output',
          text: list.length > 0 ? `Zoxide Database:\n${list.join('\n')}` : 'No directories visited yet.',
        });
      } else {
        // Find best match matching query substring or fuzzy
        const candidates = allDirs.filter((d) => d.toLowerCase().includes(query.toLowerCase()));
        if (candidates.length === 0) {
          newEntries.push({
            type: 'output',
            text: `z: directory not found matching "${query}". Available: ${allDirs.join(', ')}`,
          });
        } else {
          // Sort by score
          candidates.sort((a, b) => (zoxideScores[b] || 1) - (zoxideScores[a] || 1));
          const best = candidates[0];
          setCwd(best);
          setZoxideScores((prev) => ({
            ...prev,
            [best]: (prev[best] || 0) + 2,
          }));
          newEntries.push({
            type: 'output',
            text: `Jumped to \x1b[36m/workspace/${rootPrefix || 'project'}/${best}\x1b[0m`,
          });
        }
      }
    }

    // 6. TREE
    else if (command === 'tree') {
      const targetDir = args[1] ? (args[1] === '.' ? cwd : args[1]) : cwd;
      const treeOutput = buildAsciiTree(targetDir);
      newEntries.push({
        type: 'output',
        text: treeOutput,
      });
    }

    // 7. RIPGREP (rg)
    else if (command === 'rg' || command === 'ripgrep' || command === 'grep') {
      const query = args[1];
      if (!query) {
        newEntries.push({ type: 'output', text: 'Usage: rg <search-pattern> [optional-file]' });
      } else {
        const matches: string[] = [];
        const isCaseInsensitive = cmd.includes(' -i ');
        const cleanQuery = query.replace(/^-i\s+/, '');
        const regex = new RegExp(cleanQuery, isCaseInsensitive ? 'gi' : 'g');

        Object.entries(files).forEach(([filePath, file]) => {
          if (file.isMissingContent) return;
          const lines = file.content.split('\n');
          lines.forEach((line, lineIdx) => {
            if (regex.test(line)) {
              matches.push(`${filePath}:${lineIdx + 1}: ${line.trim()}`);
            }
          });
        });

        newEntries.push({
          type: 'output',
          text:
            matches.length > 0
              ? `Found ${matches.length} match(es) for "${cleanQuery}":\n${matches.slice(0, 50).join('\n')}${matches.length > 50 ? `\n... (${matches.length - 50} more matches omitted)` : ''}`
              : `No matches found for "${cleanQuery}".`,
        });
      }
    }

    // 8. FD (Fast Find)
    else if (command === 'fd' || command === 'find') {
      const query = args[1] || '';
      const allPaths = Object.keys(files);
      const allDirs = getAllProjectDirs().filter(Boolean);

      const matchedFiles = allPaths.filter((p) => p.toLowerCase().includes(query.toLowerCase()));
      const matchedDirs = allDirs.filter((d) => d.toLowerCase().includes(query.toLowerCase()));

      const formatted = [
        ...matchedDirs.map((d) => `\x1b[36m[DIR]  ${d}/\x1b[0m`),
        ...matchedFiles.map((f) => `[FILE] ${f}`),
      ];

      newEntries.push({
        type: 'output',
        text:
          formatted.length > 0
            ? formatted.join('\n')
            : `fd: no files or directories found matching "${query}".`,
      });
    }

    // 9. LS / DIR
    else if (command === 'ls' || command === 'dir') {
      const isLong = cmd.includes('-l') || cmd.includes('-la');
      const allPaths = Object.keys(files);

      // Filter files and directories within current cwd
      const directChildrenFiles = new Set<string>();
      const directChildrenDirs = new Set<string>();

      allPaths.forEach((p) => {
        let rel = p;
        if (cwd) {
          if (!p.startsWith(`${cwd}/`)) return;
          rel = p.slice(cwd.length + 1);
        }
        const parts = rel.split('/');
        if (parts.length === 1) {
          directChildrenFiles.add(parts[0]);
        } else {
          directChildrenDirs.add(parts[0]);
        }
      });

      const dirsArray = Array.from(directChildrenDirs).sort();
      const filesArray = Array.from(directChildrenFiles).sort();

      if (dirsArray.length === 0 && filesArray.length === 0) {
        newEntries.push({ type: 'output', text: 'total 0\n(empty directory)' });
      } else if (isLong) {
        const outLines = [`total ${dirsArray.length + filesArray.length}`];
        dirsArray.forEach((d) => {
          outLines.push(`drwxr-xr-x  4 dev staff   128 Oct 06 12:00 \x1b[36m${d}/\x1b[0m`);
        });
        filesArray.forEach((f) => {
          const fullPath = cwd ? `${cwd}/${f}` : f;
          const sz = files[fullPath]?.sizeBytes || 0;
          outLines.push(`-rw-r--r--  1 dev staff  ${sz.toString().padStart(5, ' ')} Oct 06 12:00 ${f}`);
        });
        newEntries.push({ type: 'output', text: outLines.join('\n') });
      } else {
        const items = [
          ...dirsArray.map((d) => `\x1b[36m${d}/\x1b[0m`),
          ...filesArray,
        ];
        newEntries.push({ type: 'output', text: items.join('   ') });
      }
    }

    // 10. CAT
    else if (command === 'cat') {
      const showLineNumbers = args.includes('-n');
      const targetArg = args.filter((a) => a !== '-n')[1];

      if (!targetArg) {
        newEntries.push({ type: 'output', text: 'Usage: cat [-n] <filename>' });
      } else {
        const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
        const matched = files[fullPath] || files[targetArg];

        if (matched) {
          if (showLineNumbers) {
            const lines = matched.content.split('\n');
            const numbered = lines.map((l, i) => `${(i + 1).toString().padStart(4, ' ')}  ${l}`);
            newEntries.push({ type: 'output', text: numbered.join('\n') });
          } else {
            newEntries.push({ type: 'output', text: matched.content });
          }
        } else {
          newEntries.push({
            type: 'output',
            text: `cat: ${targetArg}: No such file. Tip: type "ls" to list files in ${cwd || 'root'}.`,
          });
        }
      }
    }

    // 11. HEAD
    else if (command === 'head') {
      const targetArg = args[args.length - 1];
      const count = cmd.includes('-n') ? parseInt(args[2] || '10', 10) : 10;
      const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
      const matched = files[fullPath] || files[targetArg];

      if (matched) {
        const lines = matched.content.split('\n').slice(0, count);
        newEntries.push({ type: 'output', text: lines.join('\n') });
      } else {
        newEntries.push({ type: 'output', text: `head: cannot open "${targetArg}"` });
      }
    }

    // 12. TAIL
    else if (command === 'tail') {
      const targetArg = args[args.length - 1];
      const count = cmd.includes('-n') ? parseInt(args[2] || '10', 10) : 10;
      const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
      const matched = files[fullPath] || files[targetArg];

      if (matched) {
        const allLines = matched.content.split('\n');
        const lines = allLines.slice(Math.max(0, allLines.length - count));
        newEntries.push({ type: 'output', text: lines.join('\n') });
      } else {
        newEntries.push({ type: 'output', text: `tail: cannot open "${targetArg}"` });
      }
    }

    // 13. WC
    else if (command === 'wc') {
      const targetArg = args[1];
      const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
      const matched = files[fullPath] || files[targetArg];

      if (matched) {
        const lCount = matched.content.split('\n').length;
        const wCount = matched.content.split(/\s+/).filter(Boolean).length;
        const bCount = matched.sizeBytes || matched.content.length;
        newEntries.push({ type: 'output', text: `  ${lCount}  ${wCount}  ${bCount}  ${targetArg}` });
      } else {
        newEntries.push({ type: 'output', text: `wc: ${targetArg}: No such file` });
      }
    }

    // 14. TOUCH
    else if (command === 'touch') {
      const targetArg = args[1];
      if (!targetArg) {
        newEntries.push({ type: 'output', text: 'Usage: touch <filename>' });
      } else {
        const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
        if (onUpdateFileContent) {
          onUpdateFileContent(fullPath, '');
          newEntries.push({ type: 'output', text: `Created file: ${fullPath}` });
        } else {
          newEntries.push({ type: 'output', text: `Touched: ${fullPath}` });
        }
      }
    }

    // 15. RM
    else if (command === 'rm') {
      const targetArg = args[args.length - 1];
      const fullPath = cwd ? `${cwd}/${targetArg}` : targetArg;
      if (onDeleteFile && files[fullPath]) {
        onDeleteFile(fullPath);
        newEntries.push({ type: 'output', text: `Removed: ${fullPath}` });
      } else {
        newEntries.push({ type: 'output', text: `rm: ${targetArg}: No such file in project` });
      }
    }

    // 16. ECHO
    else if (command === 'echo') {
      const redirectIdx = args.indexOf('>');
      if (redirectIdx !== -1 && args[redirectIdx + 1]) {
        const echoText = args.slice(1, redirectIdx).join(' ');
        const destFile = args[redirectIdx + 1];
        const fullPath = cwd ? `${cwd}/${destFile}` : destFile;
        if (onUpdateFileContent) {
          onUpdateFileContent(fullPath, echoText);
          newEntries.push({ type: 'output', text: `Wrote to ${fullPath}` });
        } else {
          newEntries.push({ type: 'output', text: echoText });
        }
      } else {
        const echoText = args.slice(1).join(' ');
        newEntries.push({ type: 'output', text: echoText });
      }
    }

    // Fallback executed message
    else {
      newEntries.push({
        type: 'output',
        text: `bash: ${command}: command simulated (exit code 0). Type "help" for a list of available tools (z, tree, rg, fd, ls, cat, etc.).`,
      });
    }

    setTerminalHistory(newEntries);
    setTerminalInput('');
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTerminalCommand(terminalInput);
  };

  // Keyboard navigation for history (Up/Down) & Tab autocomplete
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setTerminalInput(commandHistory[nextIdx] || '');
        } else {
          setHistoryIndex(-1);
          setTerminalInput('');
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const tokens = terminalInput.split(' ');
      const lastToken = tokens[tokens.length - 1];
      if (lastToken) {
        const allPaths = Object.keys(files);
        const match = allPaths.find((p) => p.startsWith(lastToken) || p.split('/').pop()?.startsWith(lastToken));
        if (match) {
          tokens[tokens.length - 1] = match;
          setTerminalInput(tokens.join(' '));
        }
      }
    }
  };

  // Filter items in the Problems tab
  const filteredDiagnostics = diagnostics.filter((d) => {
    if (problemFilter === 'all') return true;
    if (problemFilter === 'errors') return d.severity === 'error';
    if (problemFilter === 'warnings') return d.severity === 'warning';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#18181c] text-xs font-mono select-none overflow-hidden">
      {/* 1. Panel Tab Header */}
      <div className="h-9 border-b border-[#24242a] bg-[#141418] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {/* PROBLEMS Tab */}
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'problems'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Problems</span>
            {totalProblemCount > 0 ? (
              <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                {totalProblemCount}
              </span>
            ) : (
              <span className="text-neutral-500 text-[9px]">0</span>
            )}
          </button>

          {/* OUTPUT Tab */}
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer rounded-md ${
              activeTab === 'output'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Output</span>
          </button>

          {/* TERMINAL Tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'terminal'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Terminal</span>
          </button>

          {/* PORTS Tab */}
          <button
            onClick={() => setActiveTab('ports')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'ports'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Ports</span>
            <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 text-[9px] rounded-full">
              4
            </span>
          </button>

          {/* CHECKPOINTS Tab */}
          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-3 py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 rounded-md ${
              activeTab === 'checkpoints'
                ? 'text-white bg-white/10 font-medium'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Checkpoints</span>
            <span className="text-neutral-500 text-[9px]">{checkpoints.length}</span>
          </button>
        </div>

        {/* Right Header Terminal Controls */}
        <div className="flex items-center gap-1 text-neutral-400 text-xs">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#1e1e24] hover:bg-[#25252e] border border-[#2d2d36] rounded text-[11px] text-neutral-300 cursor-pointer">
            <TerminalIcon className="w-3 h-3 text-[#e5c07b]" />
            <span className="text-white">bash</span>
            <span className="text-neutral-500">-</span>
            <span className="text-neutral-400 truncate max-w-[120px]">{rootPrefix || 'project'}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
          </div>

          <button
            onClick={() => {
              setTerminalHistory((prev) => [
                ...prev,
                { type: 'output', text: `New terminal session spawned for ${rootPrefix || 'workspace'}` },
              ]);
            }}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="New Terminal"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setTerminalHistory([])}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Kill Terminal / Clear"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#27272e] mx-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Close Panel (Ctrl+J)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header Filter Toolbar (for Problems) */}
      {activeTab === 'problems' && (
        <div className="h-8 border-b border-[#24242a] px-3 bg-[#111115] flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-neutral-500 uppercase tracking-wider font-bold text-[10px]">Filter:</span>

            <button
              onClick={() => setProblemFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                problemFilter === 'all'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({totalProblemCount})
            </button>

            {errors.length > 0 && (
              <button
                onClick={() => setProblemFilter('errors')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  problemFilter === 'errors'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Errors ({errors.length})
              </button>
            )}

            {warnings.length > 0 && (
              <button
                onClick={() => setProblemFilter('warnings')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  problemFilter === 'warnings'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Warnings ({warnings.length})
              </button>
            )}

            {missingTreePaths.length > 0 && (
              <button
                onClick={() => setProblemFilter('missing')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  problemFilter === 'missing'
                    ? 'bg-red-950/60 border border-red-700 text-red-300 font-bold'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                <FileQuestion className="w-3 h-3 text-red-400" />
                <span>Missing Files ({missingTreePaths.length})</span>
              </button>
            )}

            {unparsedBlocks.length > 0 && (
              <button
                onClick={() => setProblemFilter('unparsed')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  problemFilter === 'unparsed'
                    ? 'bg-amber-950/60 border border-amber-700 text-amber-300 font-bold'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <AlertOctagon className="w-3 h-3 text-amber-400" />
                <span>Unparsed Blocks ({unparsedBlocks.length})</span>
              </button>
            )}

            <button
              onClick={() => setProblemFilter('tree')}
              className={`px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                problemFilter === 'tree'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3 h-3 text-neutral-400" />
              <span>Project Structure Tree ({treeDeclaredPaths.length})</span>
            </button>
          </div>

          {/* 1-Click Copy All Problems Button */}
          <button
            onClick={handleCopyAllProblems}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-neutral-200 text-black rounded text-[10px] font-bold uppercase transition-colors cursor-pointer shrink-0 ml-2 shadow-xs"
            title="Copy all problems, missing files, diagnostics, and project tree to clipboard"
          >
            {copiedProblems ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied All Problems!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-black" />
                <span>Copy Problems</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Panel Scrollable Content */}
      <div
        onClick={() => {
          if (activeTab === 'terminal') {
            const selection = window.getSelection();
            if (!selection || selection.toString().length === 0) {
              inputRef.current?.focus();
            }
          }
        }}
        className={`flex-1 overflow-y-auto p-3 min-h-0 bg-[#16161a] ${
          activeTab === 'terminal' ? 'cursor-text' : ''
        }`}
      >
        {/* Tab: Terminal (Fully Functioning CLI with zoxide, tree, rg, fd, ls, cat) */}
        {activeTab === 'terminal' && (
          <div
            onClick={() => {
              const selection = window.getSelection();
              if (!selection || selection.toString().length === 0) {
                inputRef.current?.focus();
              }
            }}
            className="flex flex-col h-full font-mono text-xs select-text cursor-text"
          >
            <div
              onClick={() => {
                const selection = window.getSelection();
                if (!selection || selection.toString().length === 0) {
                  inputRef.current?.focus();
                }
              }}
              className="flex-1 overflow-y-auto space-y-1.5 pb-2 cursor-text"
            >
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="leading-relaxed">
                  {item.type === 'input' ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#3b82f6] text-[10px]">●</span>
                      <span className="text-[#56b6c2]">dev@ilovefree</span>
                      <span className="text-white">~/workspace/{rootPrefix || 'project'}{item.cwd || ''}</span>
                      <span className="text-[#e5c07b]">(main)&gt;</span>
                      <span className="text-emerald-400 font-semibold">{item.text}</span>
                    </div>
                  ) : (
                    <div className="text-neutral-300 pl-4 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                      {item.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={terminalBottomRef} />
            </div>

            {/* Active Terminal Input Row */}
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 pt-2 border-t border-[#23232b] shrink-0">
              <span className="text-neutral-500 text-[10px]">○</span>
              <span className="text-[#56b6c2]">dev@ilovefree</span>
              <span className="text-white">~/workspace/{rootPrefix || 'project'}{cwd ? `/${cwd}` : ''}</span>
              <span className="text-[#e5c07b]">(main)&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                placeholder="type command (z <dir>, tree, rg <query>, fd <pattern>, ls -la, cat <file>, help)..."
                className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-xs placeholder:text-neutral-600 cursor-text"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Tab: Problems (Showing Diagnostics, Missing Files, and Project Structure Tree) */}
        {activeTab === 'problems' && (
          <div className="space-y-4">
            {/* 1. Missing Files Section */}
            {(problemFilter === 'all' || problemFilter === 'missing') && missingTreePaths.length > 0 && (
              <div className="p-3.5 bg-red-950/20 border border-red-800/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-white font-bold text-xs uppercase">
                      Missing Workspace Files ({missingTreePaths.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-red-300">Declared in project tree but code is missing</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {missingTreePaths.map((mp) => (
                    <div
                      key={mp}
                      className="flex items-center justify-between p-2 bg-black/60 border border-red-900/50 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileQuestion className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-white font-mono truncate">{mp}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-950 text-red-300 border border-red-800 rounded font-bold">
                          MISSING CONTENT
                        </span>
                        {files[mp] && (
                          <button
                            onClick={() => onSelectFile(mp)}
                            className="px-2 py-0.5 bg-neutral-800 hover:bg-white hover:text-black text-neutral-300 rounded text-[10px] transition-colors cursor-pointer"
                          >
                            Open Placeholder
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Project Structure Tree Reconciliation Section */}
            {(problemFilter === 'all' || problemFilter === 'tree') && treeDeclaredPaths.length > 0 && (
              <div className="p-3.5 bg-[#121216] border border-[#272730] rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-white shrink-0" />
                    <span className="text-white font-bold text-xs uppercase">
                      Project Structure Tree Reconciliation ({treeDeclaredPaths.length} Files)
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {missingTreePaths.length === 0
                      ? '✓ All tree files provided'
                      : `${missingTreePaths.length} missing`}
                  </span>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto pt-1">
                  {treeDeclaredPaths.map((tp) => {
                    const isMissing = !files[tp] || files[tp].isMissingContent;
                    return (
                      <div
                        key={tp}
                        onClick={() => files[tp] && onSelectFile(tp)}
                        className={`flex items-center justify-between p-1.5 px-2.5 rounded-md text-xs cursor-pointer transition-colors ${
                          isMissing
                            ? 'bg-red-950/20 hover:bg-red-950/40 text-red-200 border border-red-900/40'
                            : 'bg-black/40 hover:bg-neutral-800/60 text-neutral-200 border border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isMissing ? (
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-mono text-[11px] truncate">{tp}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                            isMissing
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {isMissing ? 'MISSING CONTENT' : 'CODE PROVIDED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Diagnostic Issues & Unparsed Blocks */}
            {problemFilter !== 'tree' && filteredDiagnostics.length === 0 && missingTreePaths.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <span className="text-white font-bold block mb-1 text-sm">Zero Problems Detected</span>
                <span>All code blocks and project files have been extracted and verified.</span>
              </div>
            ) : (
              problemFilter !== 'tree' &&
              filteredDiagnostics.map((d) => {
                const isErr = d.severity === 'error';
                const isWarn = d.severity === 'warning';

                let block =
                  d.blockIndex !== undefined ? codeBlocks.find((b) => b.index === d.blockIndex) : null;

                if (!block && d.filePath && files[d.filePath]) {
                  const firstIdx = files[d.filePath].sourceBlockIndices[0];
                  if (firstIdx !== undefined) {
                    block = codeBlocks.find((b) => b.index === firstIdx) || null;
                  }
                }

                const isUnparsedBlock =
                  block && (!block.resolvedPath || block.status === 'unresolved');
                const isExpanded = block ? Boolean(expandedBlocks[block.index]) : false;
                const allLines = block ? block.content.split('\n') : [];
                const previewLines = isExpanded ? allLines : allLines.slice(0, 10);

                return (
                  <div
                    key={d.id}
                    className={`p-3.5 border rounded-xl transition-colors ${
                      isUnparsedBlock
                        ? 'border-red-500/50 bg-[#140b0b]'
                        : isErr
                        ? 'border-red-900/60 bg-[#130b0b]'
                        : isWarn
                        ? 'border-neutral-800 bg-[#0d0d0d]'
                        : 'border-neutral-900 bg-black'
                    }`}
                  >
                    {/* Problem Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {isUnparsedBlock ? (
                          <span className="p-1 bg-red-500 text-white font-bold rounded shrink-0 mt-0.5">
                            <AlertOctagon className="w-4 h-4" />
                          </span>
                        ) : isErr ? (
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs">{d.title}</span>
                            {d.filePath && (
                              <span className="px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-white rounded text-[10px] font-mono">
                                {d.filePath}
                              </span>
                            )}
                            {d.line && (
                              <span className="text-neutral-500 text-[10px]">
                                Line {d.line}
                              </span>
                            )}
                          </div>

                          <p className="text-neutral-300 text-[11px] mt-1.5 leading-relaxed">
                            {d.message}
                          </p>

                          {d.suggestedAction && (
                            <p className="text-neutral-400 text-[10px] mt-1">
                              <strong className="text-white">Suggested:</strong> {d.suggestedAction}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {block && onJumpToSource && (
                          <button
                            onClick={() => onJumpToSource(block.startLine)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] hover:bg-[#252525] border border-neutral-700 text-[10px] text-white rounded transition-colors cursor-pointer"
                            title="Jump to this code block in the Source Transcript"
                          >
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                            <span>Line {block.startLine}</span>
                          </button>
                        )}

                        {d.filePath && files[d.filePath] && (
                          <button
                            onClick={() => onSelectFile(d.filePath!)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white text-black font-bold text-[10px] rounded hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exact Code Block Snippet Preview Box */}
                    {block && (
                      <div className="mt-3 bg-black border border-neutral-800 rounded-lg overflow-hidden">
                        <div className="px-3 py-1.5 bg-[#161616] border-b border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1.5 text-white font-bold">
                            <Code2 className="w-3.5 h-3.5 text-white" />
                            <span>
                              {isUnparsedBlock
                                ? `Unparsed Code Block #${block.index} Preview`
                                : `Code Block #${block.index} Content`}
                              {' '}(Lines {block.startLine}–{block.endLine})
                            </span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCode(block.index, block.content)}
                              className="flex items-center gap-1 px-2 py-0.5 bg-[#202020] hover:bg-[#282828] text-white rounded transition-colors cursor-pointer"
                              title="Copy code snippet to clipboard"
                            >
                              {copiedBlockIndex === block.index ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-neutral-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {allLines.length > 10 && (
                              <button
                                onClick={() => toggleExpandBlock(block.index)}
                                className="flex items-center gap-1 px-2 py-0.5 bg-[#202020] hover:bg-[#282828] text-neutral-300 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Collapse</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Show All {allLines.length} Lines</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Raw code content */}
                        <div className="p-2.5 text-[11px] font-mono overflow-x-auto text-neutral-200 bg-[#050505] max-h-56">
                          {previewLines.map((line, idx) => (
                            <div key={idx} className="flex gap-3 hover:bg-neutral-900/60 py-0.5 px-1 rounded">
                              <span className="select-none text-neutral-600 text-right w-8 shrink-0 text-[10px]">
                                {block.startLine + idx}
                              </span>
                              <span className="whitespace-pre font-mono">{line || ' '}</span>
                            </div>
                          ))}
                          {!isExpanded && allLines.length > 10 && (
                            <div
                              onClick={() => toggleExpandBlock(block.index)}
                              className="text-neutral-500 text-[10px] pl-11 py-1 italic hover:text-white cursor-pointer"
                            >
                              ... and {allLines.length - 10} more lines (click to expand) ...
                            </div>
                          )}
                        </div>

                        {/* Instant Quick-Fix Filepath Assignment Input */}
                        {!block.resolvedPath && (
                          <div className="p-3 bg-[#111111] border-t border-neutral-800 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-[11px] text-white font-bold shrink-0">
                                Assign Destination File:
                              </span>
                              <div className="flex-1 flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. backend/app/main.py or web/src/App.jsx"
                                  value={manualPaths[block.index] || ''}
                                  onChange={(e) =>
                                    setManualPaths({
                                      ...manualPaths,
                                      [block.index]: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAssignPath(block.index);
                                    }
                                  }}
                                  className="flex-1 bg-black border border-neutral-700 px-3 py-1.5 text-xs text-white font-mono rounded-md focus:outline-none focus:border-white placeholder:text-neutral-600"
                                />
                                <button
                                  onClick={() => handleAssignPath(block.index)}
                                  disabled={!manualPaths[block.index]?.trim()}
                                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-colors shrink-0 ${
                                    manualPaths[block.index]?.trim()
                                      ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer'
                                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                  }`}
                                >
                                  Assign & Parse
                                </button>
                              </div>
                            </div>

                            {/* Structure Tree Suggestions */}
                            {missingTreePaths.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-1">
                                <span className="text-neutral-500">Tree suggestions:</span>
                                {missingTreePaths.slice(0, 6).map((tp) => (
                                  <button
                                    key={tp}
                                    onClick={() => {
                                      setManualPaths({
                                        ...manualPaths,
                                        [block.index]: tp,
                                      });
                                      handleAssignPath(block.index, tp);
                                    }}
                                    className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded transition-colors cursor-pointer"
                                    title={`Click to instantly assign block #${block.index} to ${tp}`}
                                  >
                                    + {tp}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Output Log */}
        {activeTab === 'output' && (
          <div className="space-y-2 text-neutral-300 font-mono text-[11px]">
            <div className="text-white font-bold border-b border-neutral-800 pb-1">
              [DETERMINISTIC_PARSER_CORE] Execution Statistics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">TOTAL BLOCKS</div>
                <div className="text-base font-bold text-white">{codeBlocks.length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">RESOLVED FILES</div>
                <div className="text-base font-bold text-white">{Object.keys(files).length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">UNPARSED BLOCKS</div>
                <div className="text-base font-bold text-red-400">{unparsedBlocks.length}</div>
              </div>
              <div className="p-2 border border-neutral-800 bg-black rounded-md">
                <div className="text-neutral-500 text-[10px]">COMMON ROOT</div>
                <div className="text-xs font-bold text-white truncate">{rootPrefix || 'None'}</div>
              </div>
            </div>

            <div className="mt-3 bg-black border border-neutral-800 p-3 rounded-md text-[10px] space-y-1 text-neutral-400">
              <div>→ Scanned {codeBlocks.length} markdown code block fences across document</div>
              <div>→ Extracted {Object.keys(files).length} project files with integrity hash checks</div>
              <div>→ Diagnostic issue count: {diagnostics.length} ({errors.length} errors, {warnings.length} warnings)</div>
              <div>→ Missing tree paths: {missingTreePaths.length}</div>
              <div>→ Incremental checkpoint baseline: {activeCheckpoint?.name || 'Active Workspace'}</div>
            </div>
          </div>
        )}

        {/* Tab: Ports */}
        {activeTab === 'ports' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#24242a] pb-2 text-[11px] text-neutral-400">
              <span className="font-semibold text-white">Forwarded Ports</span>
              <span>4 ports active</span>
            </div>
            <div className="space-y-1.5">
              {[
                { port: 3000, name: 'Web Dev Server', status: 'Running', protocol: 'HTTP', address: 'localhost:3000' },
                { port: 5432, name: 'Postgres / Cloud SQL', status: 'Listening', protocol: 'TCP', address: '127.0.0.1:5432' },
                { port: 8080, name: 'Firebase Emulator', status: 'Listening', protocol: 'HTTP', address: 'localhost:8080' },
                { port: 9099, name: 'Auth Gateway', status: 'Listening', protocol: 'HTTP', address: 'localhost:9099' },
              ].map((p) => (
                <div key={p.port} className="flex items-center justify-between p-2 bg-[#121216] border border-[#222228] rounded-md text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white font-mono">{p.port}</span>
                    <span className="text-neutral-400">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-neutral-400">
                    <span className="text-emerald-400 text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800">{p.status}</span>
                    <span className="text-neutral-500 font-mono">{p.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Checkpoints & Patches */}
        {activeTab === 'checkpoints' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div>
                <span className="font-bold text-white uppercase text-[11px]">
                  Project Checkpoints & Patches
                </span>
                <p className="text-[10px] text-neutral-400">
                  Save snapshot baselines to apply small incremental updates.
                </p>
              </div>
              <button
                onClick={onOpenCheckpointModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-white text-black font-bold uppercase text-[10px] rounded hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Save New Checkpoint</span>
              </button>
            </div>

            {checkpoints.length === 0 ? (
              <div className="p-4 text-center text-neutral-500 text-xs">
                No checkpoints saved yet. Click &quot;Save New Checkpoint&quot; to bookmark the current state.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {checkpoints.map((cp) => {
                  const isActive = activeCheckpoint?.id === cp.id;
                  return (
                    <div
                      key={cp.id}
                      className={`p-2.5 rounded-md border flex items-center justify-between text-[11px] ${
                        isActive
                          ? 'border-white bg-[#161616]'
                          : 'border-neutral-800 bg-[#0e0e0e]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-3.5 h-3.5 text-white" />
                          <span className="font-bold text-white">{cp.name}</span>
                          {isActive && (
                            <span className="text-[9px] bg-white text-black px-1 font-bold rounded">
                              ACTIVE BASELINE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {cp.fileCount} files • {new Date(cp.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRestoreCheckpoint(cp)}
                          className="flex items-center gap-1 px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] border border-neutral-700 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => onSetActiveBaseline(isActive ? null : cp)}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] border border-neutral-700 cursor-pointer"
                        >
                          {isActive ? 'Clear Active' : 'Set as Patch Baseline'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
