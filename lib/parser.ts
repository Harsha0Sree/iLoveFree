/**
 * Deterministic Project Parser & Extractor
 * No LLM / No AI inference. Purely deterministic parsing, structural analysis,
 * file-tree correlation, collision resolution, and integrity verification.
 * 
 * Capable of parsing:
 * 1. AI Agent Tool Calls & JSON Logs (create_file, edit_file, multi_edit_file, view_file, etc.)
 * 2. Markdown fenced code blocks (```, ~~~) with all tag, header, comment, and preceding phrase styles
 * 3. XML / HTML tagged code blocks (<file path="...">, <antArtifact>, [FILE: ...])
 * 4. Unified Diffs & Git Patches (diff --git, --- a/, +++ b/)
 * 5. Aider SEARCH/REPLACE blocks (<<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE)
 * 6. Section-delimited blocks (=== File: ... ===, --- File: ... ---)
 * 7. JSON files objects ({ "files": { ... } }, [ { path, content } ])
 * 8. ASCII project structure trees and workspace references
 */

export interface DiagnosticIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  filePath?: string;
  blockIndex?: number;
  line?: number;
  suggestedAction?: string;
}

export interface ExtractedCodeBlock {
  id: string;
  index: number;
  rawFence: string;
  langTag: string;
  startLine: number;
  endLine: number;
  content: string;
  extractedPath: string | null;
  matchReason:
    | 'fence_attribute'
    | 'fence_trailing_path'
    | 'first_line_comment'
    | 'first_line_bare_path'
    | 'preceding_heading'
    | 'preceding_delimiter'
    | 'preceding_phrase'
    | 'tree_unique_match'
    | 'tool_call'
    | 'tool_edit'
    | 'xml_tag'
    | 'claude_artifact'
    | 'unified_diff'
    | 'aider_search_replace'
    | 'section_delimiter'
    | 'json_file_export'
    | 'unresolved';
  confidence: 'high' | 'medium' | 'low' | 'none';
  resolvedPath: string | null;
  status: 'assigned' | 'duplicate' | 'unresolved' | 'tree_only';
  truncationWarnings: string[];
}

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  sourceBlockIndices: number[];
  isFromTree: boolean;
  isMissingContent: boolean;
  isDuplicate: boolean;
  hasTruncationWarning: boolean;
  truncationNotes: string[];
  sizeBytes: number;
  lineCount: number;
  isPatched?: boolean;
  isBinary?: boolean;
  mimeType?: string;
  dataUrl?: string;
  allBlocks?: {
    blockIndex: number;
    startLine: number;
    content: string;
    reason: string;
  }[];
}

export interface ParsedProject {
  files: Record<string, ProjectFile>;
  treeDeclaredPaths: string[];
  codeBlocks: ExtractedCodeBlock[];
  diagnostics: DiagnosticIssue[];
  rootFolderPrefix: string | null;
  stats: {
    totalCodeBlocks: number;
    assignedBlocks: number;
    unresolvedBlocks: number;
    totalFiles: number;
    missingContentFiles: number;
    duplicateFiles: number;
    truncatedFiles: number;
    totalBytes: number;
    totalLines: number;
  };
}

export interface ParserOptions {
  stripCommonRoot?: boolean;
  detectTruncations?: boolean;
  cleanFirstLinePathComment?: boolean;
  duplicateResolution?: 'use_latest' | 'use_first' | 'append' | 'keep_separate';
}

const EXTENSION_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  sql: 'sql',
  md: 'markdown',
  markdown: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  env: 'shell',
  dockerfile: 'dockerfile',
  xml: 'xml',
  svg: 'svg',
};

// Known filenames without common extensions or dotfiles
const SPECIAL_FILENAMES = new Set([
  'dockerfile',
  'caddyfile',
  'makefile',
  'gemfile',
  'procfile',
  'vagrantfile',
  'jenkinsfile',
  'brewfile',
  'rakefile',
  'containerfile',
  'license',
  'licence',
  'readme',
  'copying',
  'authors',
  '.gitignore',
  '.dockerignore',
  '.npmignore',
  '.env',
  '.env.local',
  '.env.example',
  '.env.production',
  '.env.development',
  '.env.test',
  '.editorconfig',
  '.prettierrc',
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
]);

/**
 * Clean and unescape JSON / code string values.
 * Handles escaped quotes, newlines, tabs, and outer wrapping quotes.
 */
export function unescapeJsonString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  let s = str.trim();

  // Strip wrapping escaped quotes or normal quotes
  while (
    (s.startsWith('\\"') && s.endsWith('\\"')) ||
    (s.startsWith("\\'") && s.endsWith("\\'"))
  ) {
    s = s.slice(2, -2).trim();
  }

  while (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }

  // Unescape standard JSON escape sequences
  s = s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');

  // Strip outer quotes if the entire unescaped string was quoted and single line
  if (
    (s.startsWith('"') && s.endsWith('"') && !s.slice(1, -1).includes('\n')) ||
    (s.startsWith("'") && s.endsWith("'") && !s.slice(1, -1).includes('\n'))
  ) {
    s = s.slice(1, -1);
  }

  return s;
}

/**
 * Clean and normalize a relative file path.
 * Disallows absolute path traversal, removes quotes, escaped quotes, colons, entities, etc.
 */
export function normalizeFilePath(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let curr = raw.trim();
  let prev = '';

  while (prev !== curr) {
    prev = curr;
    // Strip escaped quotes
    while (
      (curr.startsWith('\\"') && curr.endsWith('\\"')) ||
      (curr.startsWith("\\'") && curr.endsWith("\\'"))
    ) {
      curr = curr.slice(2, -2).trim();
    }
    // Strip wrapping symbols: backticks, quotes, brackets, parens, braces, angle brackets, bold/italic, backslashes
    curr = curr.replace(/^[`'""'""«»„“"\[\](){}<>_*\s\\]+|[`'""'""«»„“"\[\](){}<>_*\s\\]+$/g, '').trim();
    // Strip trailing line numbers (:32, :123) or trailing punctuation
    curr = curr.replace(/:\d+$/, '').trim();
    curr = curr.replace(/[:;,]+$/, '').trim();
    curr = curr.replace(/\*\/$|-->$/, '').trim();
    curr = curr.replace(/&quot;/g, '').replace(/&#39;/g, '').replace(/&lt;/g, '').replace(/&gt;/g, '').trim();
    // Strip common path keyword prefixes
    curr = curr.replace(/^(?:File(?:\s*\d+)?|filepath|path|filename|source|TargetFile|AbsolutePath|file)\s*[:=]\s*/i, '').trim();
  }

  // Convert backslashes to forward slashes (Windows paths)
  curr = curr.replace(/\\/g, '/');
  // Strip quotes again in case slash conversion freed them
  curr = curr.replace(/^['"]+|['"]+$/g, '').trim();
  // Strip leading ./, .\, /, \
  curr = curr.replace(/^\.?\/+/, '');
  // Remove duplicate slashes
  curr = curr.replace(/\/+/g, '/');
  // Remove URL query params or fragment hashes (?raw, #L1-10)
  curr = curr.replace(/[?#].*$/, '');

  // Safely resolve path traversal (..)
  if (curr.includes('..')) {
    const parts = curr.split('/');
    const safeParts: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        if (safeParts.length > 0) safeParts.pop();
      } else if (part !== '.' && part !== '') {
        safeParts.push(part);
      }
    }
    curr = safeParts.join('/');
  }

  if (!curr || curr.endsWith('/')) {
    return null;
  }

  const base = curr.split('/').pop() || '';
  if (!base) return null;

  // Dotfiles like .gitignore, .env, .env.example, .eslintrc, etc.
  const isDotFile = base.startsWith('.') && base.length > 1;
  // Files with extension like app.css, workspace.js, route.ts, index.html
  const hasExt = /^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_-]+$/.test(base);
  // Special filenames like Dockerfile, Makefile, LICENSE
  const isSpecial = SPECIAL_FILENAMES.has(base.toLowerCase()) || isDotFile;

  if (!hasExt && !isSpecial) {
    return null;
  }

  // Reject strings with spaces
  if (curr.includes(' ')) {
    return null;
  }

  // Reject strings with impossible filesystem or URL characters
  if (/[*|<>"?]/.test(curr)) {
    return null;
  }

  return curr;
}

/**
 * Detect language from file path extension
 */
export function getLanguageFromPath(path: string): string {
  const base = path.split('/').pop() || '';
  if (base.toLowerCase() === 'dockerfile') return 'dockerfile';
  if (base.toLowerCase().startsWith('.env')) return 'shell';
  if (base.toLowerCase().endsWith('.gitignore')) return 'bash';
  const ext = base.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_TO_LANG[ext] || 'text';
}

/**
 * Truncation / Placeholder regex detector
 */
const TRUNCATION_PATTERNS = [
  {
    regex: /(?:\/\*|\/\/|#|<!--|--)\s*(?:\.\.\.|…|rest of (?:the )?code|existing code|remains the same|same as above|omitted for brevity|unchanged|previous code|todo:? implement)/i,
    label: 'Code placeholder or omission comment',
  },
  {
    regex: /^[ \t]*(?:\/\*|\/\/|#)\s*(?:\.{3,}|…)[ \t]*$/m,
    label: 'Standalone ellipsis comment (... or …)',
  },
  {
    regex: /^[ \t]*(?:\.\.\.|…)[ \t]*$/m,
    label: 'Uncommented ellipsis line (...)',
  },
  {
    regex: /\/\/\s*<--\s*(?:rest of code|existing code)/i,
    label: 'Inline truncation marker',
  },
  {
    regex: /<truncated\s+\d+\s+bytes>/i,
    label: 'Log / Stream truncation marker (<truncated ... bytes>)',
  },
  {
    regex: /\[TRUNCATED\]/i,
    label: 'Truncated stream placeholder',
  },
];

export function inspectCodeTruncations(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of TRUNCATION_PATTERNS) {
      if (pattern.regex.test(line)) {
        warnings.push(`Line ${i + 1}: ${pattern.label} - "${line.trim().slice(0, 60)}"`);
        break;
      }
    }
  }

  return warnings;
}

/**
 * Extract ASCII/Text Project Structure Tree
 */
export function extractDeclaredTreePaths(text: string): {
  paths: string[];
  rootPrefix: string | null;
} {
  const declaredPaths = new Set<string>();
  const lines = text.split('\n');

  // Languages/tags that definitely contain code or config, not directory trees
  const NON_TREE_TAGS = new Set([
    'gitignore',
    'dockerfile',
    'yaml',
    'yml',
    'json',
    'diff',
    'patch',
    'sql',
    'sh',
    'bash',
    'python',
    'py',
    'javascript',
    'js',
    'jsx',
    'ts',
    'tsx',
    'css',
    'html',
    'toml',
    'xml',
    'env',
    'dotenv',
  ]);

  const hasTreeBranchChars = (line: string) =>
    /[├└│|]\s*[-─+]|├──|└──|\+--|\|--|\\--/.test(line);

  let inTreeBlock = false;
  type IndentStackItem = { depth: number; dirPath: string };
  let dirStack: IndentStackItem[] = [];
  let rootFolderCandidate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const tag = line.replace(/^```/, '').trim().toLowerCase();
      if (inTreeBlock) {
        inTreeBlock = false;
        continue;
      }
      if (!NON_TREE_TAGS.has(tag)) {
        // Look ahead for genuine tree branch characters (├──, └──, etc.)
        let hasBranch = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
          if (lines[j].trim().startsWith('```')) break;
          if (hasTreeBranchChars(lines[j])) {
            hasBranch = true;
            break;
          }
        }
        if (hasBranch) {
          inTreeBlock = true;
          dirStack = [];
          continue;
        }
      }
    }

    // Outside fenced blocks: ONLY enter if there are consecutive lines with actual branch characters
    if (!inTreeBlock && hasTreeBranchChars(line)) {
      const prev = lines[i - 1]?.trim() || '';
      const next = lines[i + 1]?.trim() || '';
      if (hasTreeBranchChars(next) || prev.endsWith('/') || hasTreeBranchChars(prev)) {
        inTreeBlock = true;
        dirStack = [];
        if (prev.endsWith('/') && !prev.includes(' ') && !rootFolderCandidate) {
          rootFolderCandidate = prev.replace(/\/+$/, '');
        }
      }
    }

    if (inTreeBlock) {
      if (line.trim().startsWith('```')) {
        inTreeBlock = false;
        continue;
      }

      if (!line.trim()) {
        const next = lines[i + 1];
        if (!next || !hasTreeBranchChars(next)) {
          inTreeBlock = false;
          continue;
        }
      }

      // Safe branch prefix extraction without regex character class range bugs!
      // Must NOT use [+\\-─] which forms a range between '-' (45) and '─' (9472) matching all alphabet!
      const match = line.match(/^([ \t│|├└+\\─\s\-]+)(.*)$/);
      if (!match) {
        const trimmedLine = line.trim();
        if (trimmedLine.endsWith('/') && !trimmedLine.includes(' ') && !rootFolderCandidate && dirStack.length === 0) {
          rootFolderCandidate = trimmedLine.replace(/\/+$/, '');
        }
        continue;
      }

      const prefixStr = match[1];
      let item = match[2].trim();
      if (!item) continue;

      // Clean trailing comments or markdown annotations
      item = item.split(/\s+#|\s+\/\/|\s+\/\*|\s+[-—–]\s+|\s+\(|\s+\[/)[0].trim();
      item = item.replace(/^[`'"]+|[`'"]+$/g, '');

      if (!item) continue;

      const isDir =
        item.endsWith('/') ||
        (!item.includes('.') &&
          item.toLowerCase() !== 'dockerfile' &&
          item.toLowerCase() !== 'caddyfile' &&
          item.toLowerCase() !== 'license' &&
          item.toLowerCase() !== 'makefile');
      item = item.replace(/\/+$/, '');

      // Calculate tree depth accurately based on column indentation
      const depth = prefixStr.replace(/\t/g, '    ').length;

      while (dirStack.length > 0 && dirStack[dirStack.length - 1].depth >= depth) {
        dirStack.pop();
      }

      const currentParent = dirStack.length > 0 ? dirStack[dirStack.length - 1].dirPath : '';
      const fullPath = currentParent ? `${currentParent}/${item}` : item;

      if (isDir) {
        if (!rootFolderCandidate && dirStack.length === 0 && !currentParent) {
          rootFolderCandidate = item;
        }
        dirStack.push({ depth, dirPath: fullPath });
      } else {
        const norm = normalizeFilePath(fullPath);
        if (norm) {
          declaredPaths.add(norm);
        }
      }
    }
  }

  // Also check markdown lists with file paths under a "Project Structure" header
  let underStructureHeader = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,4}\s+.*(?:project\s+structure|file\s+structure|directory\s+structure|repository\s+layout|project\s+layout)/i.test(line)) {
      underStructureHeader = true;
      continue;
    }
    if (underStructureHeader && /^#{1,4}\s+/.test(line) && !line.toLowerCase().includes('structure')) {
      underStructureHeader = false;
    }
    if (underStructureHeader) {
      const listMatch = line.match(/^\s*[-*+]\s+[`']?([a-zA-Z0-9_./-]+)[`']?/);
      if (listMatch) {
        const norm = normalizeFilePath(listMatch[1]);
        if (norm) declaredPaths.add(norm);
      }
    }
  }

  return {
    paths: Array.from(declaredPaths),
    rootPrefix: rootFolderCandidate,
  };
}

/**
 * Extract filename from code fence line.
 */
function extractFromFenceTag(tagLine: string): { path: string | null; lang: string } {
  const trimmed = tagLine.trim();

  // Check for attributes: path="...", title="...", filename="...", file="..."
  const attrMatch = trimmed.match(/(?:path|title|filename|file)=["']([^"']+)["']/i);
  if (attrMatch) {
    const path = normalizeFilePath(attrMatch[1]);
    const lang = trimmed.split(/\s+/)[0] || '';
    return { path, lang };
  }

  // Check for colon separation: ```ts:src/index.ts or ```javascript:lib/util.js
  const colonMatch = trimmed.match(/^([a-zA-Z0-9_-]+):([a-zA-Z0-9_./-]+)/);
  if (colonMatch) {
    const lang = colonMatch[1];
    const path = normalizeFilePath(colonMatch[2]);
    return { path, lang };
  }

  // Check for space separation: ```ts src/index.ts or ```python app/main.py or ```bash .env.example
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    let potentialPath = parts[1];
    if (potentialPath === '#' || potentialPath === '//') {
      potentialPath = parts[2] || '';
    }
    // Must look like an actual file path (has dot or slash or known special file)
    if (potentialPath.includes('/') || potentialPath.includes('.') || potentialPath.startsWith('.')) {
      const path = normalizeFilePath(potentialPath);
      if (path) {
        return { path, lang: parts[0] };
      }
    }
  }

  // Check if entire tag is an explicit file path: ```src/index.ts or ```package.json or ```.gitignore
  // Single bare words like "dockerfile" or "python" or "bash" are syntax tags, NOT explicit file paths!
  if (trimmed.includes('/') || trimmed.startsWith('.') || trimmed.includes('.')) {
    const directPath = normalizeFilePath(trimmed);
    if (directPath) {
      return { path: directPath, lang: getLanguageFromPath(directPath) };
    }
  }

  return { path: null, lang: parts[0] || '' };
}

/**
 * Helper to extract a file path from a comment or header line
 */
function tryExtractPathFromCommentOrHeader(line: string): string | null {
  if (!line || typeof line !== 'string') return null;

  let body = line.replace(/^(?:#{1,6}\s*|\/\*+|\/\/+|#+|<!--+|--+|;+)\s*/, '').trim();
  body = body.replace(/\*\/$|-->$/, '').trim();
  body = body.replace(/^(?:File(?:\s*\d+)?|filepath|path|filename|source)\s*[:=]\s*/i, '').trim();
  body = body.replace(/^\d+[\.\)]\s*/, '').trim();
  body = body.replace(/^[`'"]+/, '');

  const tokens = body.split(/\s*[-—–]\s+|\s*:\s+|\s+\(|\s+\[|\s*[`'"]+\s*/);
  for (const token of tokens) {
    const candidate = token.trim();
    if (!candidate) continue;

    const norm = normalizeFilePath(candidate);
    if (norm) return norm;

    const firstWord = candidate.split(/\s+/)[0].trim();
    const normFirst = normalizeFilePath(firstWord);
    if (normFirst) return normFirst;
  }

  const regexMatch = body.match(/[`'"]?(\.?[a-zA-Z0-9_./-]+\/[a-zA-Z0-9_.-]+|\.[a-zA-Z0-9_.-]+|[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_.-]+|Dockerfile|Makefile|LICENSE)[`'"]?/i);
  if (regexMatch) {
    const norm = normalizeFilePath(regexMatch[1]);
    if (norm) return norm;
  }

  return null;
}

/**
 * Extract filename from first 4 lines of code content
 */
function extractFromFirstLines(code: string): {
  path: string | null;
  cleanedCode: string;
  reason: 'first_line_comment' | 'first_line_bare_path' | null;
} {
  const lines = code.split('\n');
  if (lines.length === 0) return { path: null, cleanedCode: code, reason: null };

  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isComment = /^(?:\/\*|\/\/|#|<!--|--|;)/.test(line);

    if (isComment) {
      const extracted = tryExtractPathFromCommentOrHeader(line);
      if (extracted) {
        const newLines = [...lines];
        newLines.splice(i, 1);
        return {
          path: extracted,
          cleanedCode: newLines.join('\n'),
          reason: 'first_line_comment',
        };
      }
    }

    if (i === 0) {
      const barePath = normalizeFilePath(line);
      if (barePath && (barePath.includes('/') || SPECIAL_FILENAMES.has(barePath.toLowerCase()) || barePath.startsWith('.'))) {
        if (!line.includes('=') && !line.includes('(') && !line.includes(';') && !line.includes('import ') && !line.includes('from ')) {
          const newLines = [...lines];
          newLines.splice(0, 1);
          return {
            path: barePath,
            cleanedCode: newLines.join('\n'),
            reason: 'first_line_bare_path',
          };
        }
      }
    }
  }

  return { path: null, cleanedCode: code, reason: null };
}

/**
 * Extract filename from text lines preceding the code block (up to 12 lines backwards)
 */
function extractFromPrecedingLines(
  lines: string[],
  fenceLineIndex: number
): { path: string | null; reason: 'preceding_heading' | 'preceding_delimiter' | 'preceding_phrase' | null } {
  const maxLookback = Math.max(0, fenceLineIndex - 12);

  for (let i = fenceLineIndex - 1; i >= maxLookback; i--) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    if (line.startsWith('```') || line.startsWith('~~~')) {
      break;
    }

    // Delimiter style: --- /components/Navbar.tsx --- or === package.json ===
    const delimMatch = line.match(/^[-=*~_]{2,}\s*[`'"]?([a-zA-Z0-9_./-]+)[`'"]?\s*[-=*~_]{2,}$/);
    if (delimMatch) {
      const path = normalizeFilePath(delimMatch[1]);
      if (path) {
        return { path, reason: 'preceding_delimiter' };
      }
    }

    // Heading style: ### `src/components/Header.tsx` or #### `backend/Dockerfile`
    if (/^#{1,6}\s+/.test(line)) {
      const path = tryExtractPathFromCommentOrHeader(line);
      if (path) {
        return { path, reason: 'preceding_heading' };
      }
      // Section boundary reached that does NOT name a file (e.g. ### Run Android or ### Setup).
      // Crucial: STOP looking backwards so we do not bleed past section boundaries!
      break;
    }

    // Bold title style: **`src/utils/math.ts`** or **File: .env.example**
    if (/^\*\*(?:File(?:\s*\d+)?\s*:\s*)?[`'"]?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|dockerfile|\.env[a-zA-Z0-9._-]*)[`'"]?\*\*:?$/i.test(line)) {
      const match = line.match(/^\*\*(?:File(?:\s*\d+)?\s*:\s*)?[`'"]?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|dockerfile|\.env[a-zA-Z0-9._-]*)[`'"]?\*\*:?$/i);
      if (match) {
        const path = normalizeFilePath(match[1]);
        if (path) {
          return { path, reason: 'preceding_heading' };
        }
      }
    }

    // Common instruction phrases within 2 lines of the code block
    if (fenceLineIndex - i <= 3) {
      const phraseMatch = line.match(
        /(?:create|add|in|update|edit|open|save(?: as)?|file(?:name)?|path)\s*(?:the\s+file\s+)?(?:named\s+)?(?:called\s+)?(?:to\s+)?(?:at\s+)?[:\s]*[`'"]([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|\.env[a-zA-Z0-9._-]*|dockerfile)[`'"]/i
      );
      if (phraseMatch) {
        const path = normalizeFilePath(phraseMatch[1]);
        if (path) {
          return { path, reason: 'preceding_phrase' };
        }
      }

      // Bare inline code at start of line: `.env.example`: or `web/static/app.css`:
      const inlineMatch = line.match(/^[`'"]([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|\.env[a-zA-Z0-9._-]*|dockerfile)[`'"]\s*:?$/i);
      if (inlineMatch) {
        const path = normalizeFilePath(inlineMatch[1]);
        if (path) {
          return { path, reason: 'preceding_phrase' };
        }
      }
    }
  }

  return { path: null, reason: null };
}

/**
 * Tolerant AI Agent Tool Call and JSON Log Extractor
 */
export function extractToolCallsFromText(text: string): {
  name: string;
  args: Record<string, any>;
  raw?: any;
}[] {
  const toolCalls: { name: string; args: Record<string, any>; raw?: any }[] = [];

  const tryParseObject = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch {
      try {
        const sanitized = str.replace(/<truncated\s+\d+\s+bytes>/gi, '[TRUNCATED]');
        return JSON.parse(sanitized);
      } catch {
        return null;
      }
    }
  };

  const processObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Direct tool call object
    if (obj.name && (obj.args || obj.parameters || obj.input || obj.arguments)) {
      toolCalls.push({
        name: String(obj.name),
        args: typeof obj.args === 'object' ? obj.args :
              typeof obj.parameters === 'object' ? obj.parameters :
              typeof obj.input === 'object' ? obj.input :
              typeof obj.arguments === 'string' ? (tryParseObject(obj.arguments) || {}) :
              obj.args || {},
        raw: obj,
      });
    }

    // Array of tool_calls
    if (Array.isArray(obj.tool_calls)) {
      obj.tool_calls.forEach((tc: any) => {
        if (tc && typeof tc === 'object') {
          const name = tc.name || (tc.function && tc.function.name) || '';
          let args = tc.args || tc.input || tc.parameters || (tc.function && tc.function.arguments) || {};
          if (typeof args === 'string') {
            args = tryParseObject(args) || { rawStringArgs: args };
          }
          if (name) {
            toolCalls.push({ name: String(name), args, raw: tc });
          }
        }
      });
    }

    // Claude tool_use format
    if (obj.type === 'tool_use' && obj.name) {
      toolCalls.push({
        name: String(obj.name),
        args: obj.input || obj.args || {},
        raw: obj,
      });
    }
  };

  // Strategy 1: Stitched JSON line parsing
  const rawLines = text.split('\n');
  let currentBuffer = '';
  let inJsonCandidate = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!inJsonCandidate && trimmed.startsWith('{')) {
      inJsonCandidate = true;
      currentBuffer = trimmed;
    } else if (inJsonCandidate) {
      currentBuffer += '\n' + line;
    } else {
      currentBuffer = trimmed;
    }

    if (inJsonCandidate || trimmed.startsWith('{')) {
      const parsed = tryParseObject(currentBuffer);
      if (parsed) {
        processObject(parsed);
        inJsonCandidate = false;
        currentBuffer = '';
      }
    }
  }

  // Strategy 2: Resilient Regex Scanner for Truncated/Broken Tool Calls
  const toolPattern = /"name"\s*:\s*"([a-zA-Z0-9_-]+)"\s*,\s*"args"\s*:\s*\{/g;
  let match;
  while ((match = toolPattern.exec(text)) !== null) {
    const toolName = match[1];
    const startArgsIndex = match.index + match[0].length - 1; // points to {

    let depth = 0;
    let inStr = false;
    let escape = false;
    let endArgsIndex = -1;

    for (let j = startArgsIndex; j < text.length; j++) {
      const ch = text[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inStr = !inStr;
        continue;
      }
      if (!inStr) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            endArgsIndex = j + 1;
            break;
          }
        }
      }
    }

    let args: any = null;
    let rawArgsStr = '';

    if (endArgsIndex > startArgsIndex) {
      rawArgsStr = text.slice(startArgsIndex, endArgsIndex);
      args = tryParseObject(rawArgsStr);
    } else {
      const sliceAhead = text.slice(startArgsIndex, startArgsIndex + 40000);
      rawArgsStr = sliceAhead.split(/}\s*,\s*"toolAction"|}\s*,\s*"truncated_fields"|}\s*\]/)[0] + '}';
      args = tryParseObject(rawArgsStr);
    }

    if (!args || typeof args !== 'object') {
      args = {};
      const fileMatch = rawArgsStr.match(/"(?:TargetFile|AbsolutePath|FilePath|file_path|path|filename)"\s*:\s*("(?:\\"|[^"])*")/i);
      if (fileMatch) args.TargetFile = unescapeJsonString(fileMatch[1]);

      const contentMatch = rawArgsStr.match(/"Content"\s*:\s*("(?:\\"|[^"])*")/i);
      if (contentMatch) args.Content = unescapeJsonString(contentMatch[1]);

      const targetContentMatch = rawArgsStr.match(/"TargetContent"\s*:\s*("(?:\\"|[^"])*")/i);
      if (targetContentMatch) args.TargetContent = unescapeJsonString(targetContentMatch[1]);

      const repContentMatch = rawArgsStr.match(/"ReplacementContent"\s*:\s*("(?:\\"|[^"])*")/i);
      if (repContentMatch) args.ReplacementContent = unescapeJsonString(repContentMatch[1]);
    }

    const alreadyFound = toolCalls.some(
      (tc) => tc.name === toolName && JSON.stringify(tc.args) === JSON.stringify(args)
    );

    if (!alreadyFound && (args.TargetFile || args.AbsolutePath || args.path || args.Content || args.ReplacementContent)) {
      toolCalls.push({ name: toolName, args, raw: { name: toolName, args } });
    }
  }

  return toolCalls;
}

/**
 * Extract XML/HTML Tagged Code Blocks
 */
export function extractXmlBlocksFromText(text: string): {
  path: string;
  content: string;
  matchReason: ExtractedCodeBlock['matchReason'];
}[] {
  const blocks: { path: string; content: string; matchReason: ExtractedCodeBlock['matchReason'] }[] = [];

  // Pattern A: <file path="...">...</file> or <code-block path="...">...</code-block>
  const tagPattern = /<(?:file|code-block|action|document|code|patch)\b([^>]*)>([\s\S]*?)<\/(?:file|code-block|action|document|code|patch)>/gi;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const attrs = match[1];
    const content = match[2];

    const pathMatch = attrs.match(/(?:path|filePath|file|filename|name)=["']?([^"' >]+)["']?/i);
    const path = pathMatch ? normalizeFilePath(pathMatch[1]) : null;

    if (path) {
      blocks.push({
        path,
        content: content.trim(),
        matchReason: 'xml_tag',
      });
    }
  }

  // Pattern B: Claude <antArtifact title="..." identifier="...">...</antArtifact>
  const artifactPattern = /<antArtifact\b([^>]*)>([\s\S]*?)<\/antArtifact>/gi;
  while ((match = artifactPattern.exec(text)) !== null) {
    const attrs = match[1];
    const content = match[2];

    const titleMatch = attrs.match(/\btitle=["']?([^"'>]+)["']?/i) || attrs.match(/\bidentifier=["']?([^"'>]+)["']?/i);
    const path = titleMatch ? normalizeFilePath(titleMatch[1]) : null;

    if (path) {
      blocks.push({
        path,
        content: content.trim(),
        matchReason: 'claude_artifact',
      });
    }
  }

  // Pattern C: [FILE: path]...[/FILE] or [FILE path]...[/FILE]
  const bracketPattern = /\[FILE(?::|\s+)?\s*([^\]\n]+)\]([\s\S]*?)\[\/FILE\]/gi;
  while ((match = bracketPattern.exec(text)) !== null) {
    const rawPath = match[1];
    const content = match[2];
    const path = normalizeFilePath(rawPath);
    if (path) {
      blocks.push({
        path,
        content: content.trim(),
        matchReason: 'bracket_file_tag' as any,
      });
    }
  }

  return blocks;
}

/**
 * Extract from Unified Diffs and Git Patches
 */
export function extractDiffBlocksFromText(text: string): {
  path: string;
  content: string;
  diffBody: string;
}[] {
  const blocks: { path: string; content: string; diffBody: string }[] = [];
  const diffPattern = /(?:diff --git a\/(.+?) b\/(.+?)|--- (?:a\/)?([^\n\t]+)\n\+\+\+ (?:b\/)?([^\n\t]+))\n([\s\S]*?)(?=(?:diff --git|--- (?:a\/)?|$))/g;
  let match;
  while ((match = diffPattern.exec(text)) !== null) {
    const rawPath = match[2] || match[4] || match[1] || match[3];
    const path = normalizeFilePath(rawPath);
    const diffBody = match[5];
    if (path && diffBody) {
      const lines = diffBody.split('\n');
      const addedLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          addedLines.push(line.slice(1));
        } else if (!line.startsWith('-') && !line.startsWith('@@') && !line.startsWith('index ')) {
          addedLines.push(line.startsWith(' ') ? line.slice(1) : line);
        }
      }
      blocks.push({
        path,
        content: addedLines.join('\n').trim(),
        diffBody: diffBody.trim(),
      });
    }
  }
  return blocks;
}

/**
 * Extract from Aider SEARCH/REPLACE blocks
 */
export function extractAiderBlocksFromText(text: string): {
  path: string;
  targetContent: string;
  replacementContent: string;
}[] {
  const blocks: { path: string; targetContent: string; replacementContent: string }[] = [];
  const aiderPattern = /([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+)\s*\n<{7}\s*SEARCH\n([\s\S]*?)\n={7}\n([\s\S]*?)\n>{7}\s*REPLACE/g;
  let match;
  while ((match = aiderPattern.exec(text)) !== null) {
    const rawPath = match[1];
    const targetContent = match[2];
    const replacementContent = match[3];
    const path = normalizeFilePath(rawPath);
    if (path) {
      blocks.push({
        path,
        targetContent,
        replacementContent,
      });
    }
  }
  return blocks;
}

/**
 * Extract Section Delimited Blocks (=== File: ... ===)
 */
export function extractSectionDelimitedBlocks(text: string): {
  path: string;
  content: string;
}[] {
  const blocks: { path: string; content: string }[] = [];
  const sectionPattern = /(?:^|\n)(?:[-=*~_]{3,}\s*(?:FILE|File|Path|filename):\s*([^\n]+?)\s*[-=*~_]{3,}|(?:\/\/|#)\s*(?:[-=*~_]{3,}\s*)?(?:File|FILE):\s*([^\n]+?)(?:\s*[-=*~_]{3,})?)\n([\s\S]*?)(?=(?:\n[-=*~_]{3,}|\n(?:\/\/|#)\s*(?:[-=*~_]{3,}\s*)?(?:File|FILE):|$))/gi;
  let match;
  while ((match = sectionPattern.exec(text)) !== null) {
    const rawPath = match[1] || match[2];
    const path = normalizeFilePath(rawPath);
    const content = match[3];
    if (path && content && content.trim()) {
      blocks.push({
        path,
        content: content.trim(),
      });
    }
  }
  return blocks;
}

/**
 * Extract from JSON Files Objects ({ "files": { ... } } or [ { path, content } ])
 */
export function extractJsonFilesMap(text: string): { path: string; content: string }[] {
  const blocks: { path: string; content: string }[] = [];
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return blocks;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      // Form A: Array of { path, content }
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (item && typeof item === 'object') {
            const rawPath = item.path || item.filePath || item.name || item.file;
            const norm = normalizeFilePath(rawPath);
            const content = typeof item.content === 'string' ? item.content : typeof item.code === 'string' ? item.code : null;
            if (norm && content !== null) {
              blocks.push({ path: norm, content });
            }
          }
        });
      } else {
        // Form B: { files: { "src/index.ts": "..." } } or { files: [ ... ] }
        const filesContainer = parsed.files || parsed.fileList || parsed.sources || parsed;
        if (filesContainer && typeof filesContainer === 'object' && !Array.isArray(filesContainer)) {
          Object.entries(filesContainer).forEach(([key, val]) => {
            const norm = normalizeFilePath(key);
            if (norm) {
              if (typeof val === 'string') {
                blocks.push({ path: norm, content: val });
              } else if (val && typeof val === 'object' && typeof (val as any).content === 'string') {
                blocks.push({ path: norm, content: (val as any).content });
              }
            }
          });
        }
      }
    }
  } catch {
    // Ignore JSON parse failure
  }
  return blocks;
}

/**
 * Apply edit replacement safely to base content
 */
function applyEditReplacement(
  original: string,
  targetContent: string,
  replacementContent: string
): string {
  if (!targetContent) {
    return original ? `${original}\n\n${replacementContent}` : replacementContent;
  }

  // Exact match
  if (original.includes(targetContent)) {
    return original.replace(targetContent, replacementContent);
  }

  // Trimmed match
  const trimmedTarget = targetContent.trim();
  const trimmedReplacement = replacementContent.trim();
  if (trimmedTarget && original.includes(trimmedTarget)) {
    return original.replace(trimmedTarget, trimmedReplacement);
  }

  // Line-normalized match
  const normOriginal = original.replace(/\r\n/g, '\n');
  const normTarget = targetContent.replace(/\r\n/g, '\n');
  if (normOriginal.includes(normTarget)) {
    return normOriginal.replace(normTarget, replacementContent.replace(/\r\n/g, '\n'));
  }

  // If replacement couldn't be matched directly, append it cleanly
  return original ? `${original}\n\n${replacementContent}` : replacementContent;
}

/**
 * Main Deterministic Parser Function
 */
export function parseProjectFromText(
  rawText: string,
  options: ParserOptions = {}
): ParsedProject {
  const {
    stripCommonRoot = true,
    detectTruncations = true,
    cleanFirstLinePathComment = true,
    duplicateResolution = 'use_latest',
  } = options;

  const diagnostics: DiagnosticIssue[] = [];
  const lines = rawText.split('\n');

  // 1. Extract declared tree structure and referenced paths
  const { paths: asciiTreePaths, rootPrefix } = extractDeclaredTreePaths(rawText);
  const referencedPathsSet = new Set<string>(asciiTreePaths);

  // 2. Track virtual file system state and code blocks list
  const codeBlocks: ExtractedCodeBlock[] = [];
  const virtualFiles: Record<string, string> = {};
  const fileBlockIndices: Record<string, number[]> = {};

  // -------------------------------------------------------------
  // STAGE 1: Tool Calls / Agent Execution Logs (create_file, edit_file, multi_edit_file, etc.)
  // -------------------------------------------------------------
  const toolCalls = extractToolCallsFromText(rawText);
  if (toolCalls.length > 0) {
    for (const tc of toolCalls) {
      const name = tc.name.toLowerCase();
      const args = tc.args || {};

      const rawPath =
        args.TargetFile ||
        args.target_file ||
        args.AbsolutePath ||
        args.FilePath ||
        args.file_path ||
        args.path ||
        args.filename ||
        args.name ||
        args.file;

      const normPath = normalizeFilePath(rawPath);

      // Record inspect/read paths to referenced files list
      if (['view_file', 'read_file', 'cat', 'readfile', 'open_file'].includes(name) && normPath) {
        referencedPathsSet.add(normPath);
        continue;
      }

      // Handle file creation tools
      if (
        ['create_file', 'write_to_file', 'write_file', 'new_file', 'writefile', 'make_file', 'createfile', 'save_file', 'put_file'].includes(name) &&
        normPath
      ) {
        const rawContent = args.Content ?? args.content ?? args.code ?? args.text ?? args.source ?? args.body ?? '';
        const content = unescapeJsonString(String(rawContent));

        const blockIdx = codeBlocks.length + 1;
        codeBlocks.push({
          id: `block-${blockIdx}`,
          index: blockIdx,
          rawFence: 'tool_call',
          langTag: getLanguageFromPath(normPath),
          startLine: 1,
          endLine: 1,
          content: content,
          extractedPath: normPath,
          matchReason: 'tool_call',
          confidence: 'high',
          resolvedPath: normPath,
          status: 'assigned',
          truncationWarnings: detectTruncations ? inspectCodeTruncations(content) : [],
        });

        virtualFiles[normPath] = content;
        if (!fileBlockIndices[normPath]) fileBlockIndices[normPath] = [];
        fileBlockIndices[normPath].push(blockIdx);
      }

      // Handle single edit tools
      else if (
        ['edit_file', 'modify_file', 'update_file', 'replace_file_content', 'patch_file', 'editfile', 'str_replace'].includes(name) &&
        normPath
      ) {
        const targetContent = unescapeJsonString(String(args.TargetContent ?? args.target_content ?? args.old_str ?? args.search ?? args.find ?? ''));
        const repContent = unescapeJsonString(String(args.ReplacementContent ?? args.replacement_content ?? args.new_str ?? args.replace ?? args.replacement ?? ''));
        const instruction = args.Instruction ? `// Edit: ${args.Instruction}\n` : '';

        const blockIdx = codeBlocks.length + 1;
        codeBlocks.push({
          id: `block-${blockIdx}`,
          index: blockIdx,
          rawFence: 'tool_edit',
          langTag: getLanguageFromPath(normPath),
          startLine: 1,
          endLine: 1,
          content: repContent,
          extractedPath: normPath,
          matchReason: 'tool_edit',
          confidence: 'high',
          resolvedPath: normPath,
          status: 'assigned',
          truncationWarnings: detectTruncations ? inspectCodeTruncations(repContent) : [],
        });

        if (virtualFiles[normPath] !== undefined) {
          virtualFiles[normPath] = applyEditReplacement(virtualFiles[normPath], targetContent, repContent);
        } else {
          virtualFiles[normPath] = repContent;
        }

        if (!fileBlockIndices[normPath]) fileBlockIndices[normPath] = [];
        fileBlockIndices[normPath].push(blockIdx);
      }

      // Handle multi-edit tools
      else if (name === 'multi_edit_file' && normPath) {
        const chunks = Array.isArray(args.ReplacementChunks) ? args.ReplacementChunks : [];
        for (const chunk of chunks) {
          const targetContent = unescapeJsonString(String(chunk.TargetContent ?? chunk.old_str ?? ''));
          const repContent = unescapeJsonString(String(chunk.ReplacementContent ?? chunk.new_str ?? ''));

          const blockIdx = codeBlocks.length + 1;
          codeBlocks.push({
            id: `block-${blockIdx}`,
            index: blockIdx,
            rawFence: 'tool_edit',
            langTag: getLanguageFromPath(normPath),
            startLine: 1,
            endLine: 1,
            content: repContent,
            extractedPath: normPath,
            matchReason: 'tool_edit',
            confidence: 'high',
            resolvedPath: normPath,
            status: 'assigned',
            truncationWarnings: detectTruncations ? inspectCodeTruncations(repContent) : [],
          });

          if (virtualFiles[normPath] !== undefined) {
            virtualFiles[normPath] = applyEditReplacement(virtualFiles[normPath], targetContent, repContent);
          } else {
            virtualFiles[normPath] = repContent;
          }

          if (!fileBlockIndices[normPath]) fileBlockIndices[normPath] = [];
          fileBlockIndices[normPath].push(blockIdx);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // STAGE 2: XML / HTML Tagged Blocks (<file path="...">, <antArtifact>, etc.)
  // -------------------------------------------------------------
  const xmlBlocks = extractXmlBlocksFromText(rawText);
  for (const xml of xmlBlocks) {
    const blockIdx = codeBlocks.length + 1;
    codeBlocks.push({
      id: `block-${blockIdx}`,
      index: blockIdx,
      rawFence: xml.matchReason === 'claude_artifact' ? '<antArtifact>' : '<file>',
      langTag: getLanguageFromPath(xml.path),
      startLine: 1,
      endLine: 1,
      content: xml.content,
      extractedPath: xml.path,
      matchReason: xml.matchReason,
      confidence: 'high',
      resolvedPath: xml.path,
      status: 'assigned',
      truncationWarnings: detectTruncations ? inspectCodeTruncations(xml.content) : [],
    });

    virtualFiles[xml.path] = xml.content;
    if (!fileBlockIndices[xml.path]) fileBlockIndices[xml.path] = [];
    fileBlockIndices[xml.path].push(blockIdx);
  }

  // -------------------------------------------------------------
  // STAGE 3: Unified Diffs & Patches
  // -------------------------------------------------------------
  const diffBlocks = extractDiffBlocksFromText(rawText);
  for (const diff of diffBlocks) {
    if (!virtualFiles[diff.path]) {
      const blockIdx = codeBlocks.length + 1;
      codeBlocks.push({
        id: `block-${blockIdx}`,
        index: blockIdx,
        rawFence: 'diff',
        langTag: getLanguageFromPath(diff.path),
        startLine: 1,
        endLine: 1,
        content: diff.content,
        extractedPath: diff.path,
        matchReason: 'unified_diff',
        confidence: 'high',
        resolvedPath: diff.path,
        status: 'assigned',
        truncationWarnings: detectTruncations ? inspectCodeTruncations(diff.content) : [],
      });

      virtualFiles[diff.path] = diff.content;
      if (!fileBlockIndices[diff.path]) fileBlockIndices[diff.path] = [];
      fileBlockIndices[diff.path].push(blockIdx);
    }
  }

  // -------------------------------------------------------------
  // STAGE 4: Aider SEARCH/REPLACE blocks
  // -------------------------------------------------------------
  const aiderBlocks = extractAiderBlocksFromText(rawText);
  for (const aider of aiderBlocks) {
    const blockIdx = codeBlocks.length + 1;
    codeBlocks.push({
      id: `block-${blockIdx}`,
      index: blockIdx,
      rawFence: 'aider',
      langTag: getLanguageFromPath(aider.path),
      startLine: 1,
      endLine: 1,
      content: aider.replacementContent,
      extractedPath: aider.path,
      matchReason: 'aider_search_replace',
      confidence: 'high',
      resolvedPath: aider.path,
      status: 'assigned',
      truncationWarnings: detectTruncations ? inspectCodeTruncations(aider.replacementContent) : [],
    });

    if (virtualFiles[aider.path] !== undefined) {
      virtualFiles[aider.path] = applyEditReplacement(virtualFiles[aider.path], aider.targetContent, aider.replacementContent);
    } else {
      virtualFiles[aider.path] = aider.replacementContent;
    }

    if (!fileBlockIndices[aider.path]) fileBlockIndices[aider.path] = [];
    fileBlockIndices[aider.path].push(blockIdx);
  }

  // -------------------------------------------------------------
  // STAGE 5: JSON Files Object ({ "files": { ... } })
  // -------------------------------------------------------------
  const jsonFiles = extractJsonFilesMap(rawText);
  for (const jf of jsonFiles) {
    if (!virtualFiles[jf.path]) {
      const blockIdx = codeBlocks.length + 1;
      codeBlocks.push({
        id: `block-${blockIdx}`,
        index: blockIdx,
        rawFence: 'json',
        langTag: getLanguageFromPath(jf.path),
        startLine: 1,
        endLine: 1,
        content: jf.content,
        extractedPath: jf.path,
        matchReason: 'json_file_export',
        confidence: 'high',
        resolvedPath: jf.path,
        status: 'assigned',
        truncationWarnings: detectTruncations ? inspectCodeTruncations(jf.content) : [],
      });

      virtualFiles[jf.path] = jf.content;
      if (!fileBlockIndices[jf.path]) fileBlockIndices[jf.path] = [];
      fileBlockIndices[jf.path].push(blockIdx);
    }
  }

  // -------------------------------------------------------------
  // STAGE 6: Section Delimited Blocks (=== File: ... ===)
  // -------------------------------------------------------------
  const sectionBlocks = extractSectionDelimitedBlocks(rawText);
  for (const sec of sectionBlocks) {
    if (!virtualFiles[sec.path]) {
      const blockIdx = codeBlocks.length + 1;
      codeBlocks.push({
        id: `block-${blockIdx}`,
        index: blockIdx,
        rawFence: 'section',
        langTag: getLanguageFromPath(sec.path),
        startLine: 1,
        endLine: 1,
        content: sec.content,
        extractedPath: sec.path,
        matchReason: 'section_delimiter',
        confidence: 'high',
        resolvedPath: sec.path,
        status: 'assigned',
        truncationWarnings: detectTruncations ? inspectCodeTruncations(sec.content) : [],
      });

      virtualFiles[sec.path] = sec.content;
      if (!fileBlockIndices[sec.path]) fileBlockIndices[sec.path] = [];
      fileBlockIndices[sec.path].push(blockIdx);
    }
  }

  // -------------------------------------------------------------
  // STAGE 7: Markdown Fenced Code Blocks (```, ~~~)
  // -------------------------------------------------------------
  const fencedBlocks: ExtractedCodeBlock[] = [];
  let inBlock = false;
  let currentFence = '';
  let currentTag = '';
  let currentStartLine = 0;
  let currentBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);

    if (fenceMatch) {
      const fenceMarker = fenceMatch[2];
      const tagContent = fenceMatch[3];

      if (!inBlock) {
        inBlock = true;
        currentFence = fenceMarker;
        currentTag = tagContent;
        currentStartLine = i + 1;
        currentBlockLines = [];
      } else {
        if (line.trim().startsWith(currentFence.slice(0, 3))) {
          const endLine = i + 1;
          const content = currentBlockLines.join('\n');
          const blockIdx = codeBlocks.length + fencedBlocks.length + 1;
          fencedBlocks.push({
            id: `block-${blockIdx}`,
            index: blockIdx,
            rawFence: currentFence,
            langTag: currentTag.trim(),
            startLine: currentStartLine,
            endLine: endLine,
            content: content,
            extractedPath: null,
            matchReason: 'unresolved',
            confidence: 'none',
            resolvedPath: null,
            status: 'unresolved',
            truncationWarnings: detectTruncations ? inspectCodeTruncations(content) : [],
          });
          inBlock = false;
          currentBlockLines = [];
        } else {
          currentBlockLines.push(line);
        }
      }
    } else if (inBlock) {
      currentBlockLines.push(line);
    }
  }

  if (inBlock) {
    diagnostics.push({
      id: 'unclosed-fence',
      severity: 'error',
      title: 'Unclosed Code Block Detected',
      message: `Code block starting at line ${currentStartLine} was never closed with ${currentFence}. Its contents have been captured up to end of text.`,
      line: currentStartLine,
      suggestedAction: 'Ensure markdown code block has matching closing triple backticks.',
    });
    const content = currentBlockLines.join('\n');
    const blockIdx = codeBlocks.length + fencedBlocks.length + 1;
    fencedBlocks.push({
      id: `block-${blockIdx}`,
      index: blockIdx,
      rawFence: currentFence,
      langTag: currentTag.trim(),
      startLine: currentStartLine,
      endLine: lines.length,
      content: content,
      extractedPath: null,
      matchReason: 'unresolved',
      confidence: 'none',
      resolvedPath: null,
      status: 'unresolved',
      truncationWarnings: detectTruncations ? inspectCodeTruncations(content) : [],
    });
  }

  // Determine paths for fenced code blocks
  for (const block of fencedBlocks) {
    // 1. Explicit fence attributes: path="...", title="...", colon ```ts:src/app.ts
    const fromFence = extractFromFenceTag(block.langTag);
    if (
      fromFence.path &&
      (block.langTag.includes(':') ||
        block.langTag.includes('path=') ||
        block.langTag.includes('file=') ||
        block.langTag.includes('title='))
    ) {
      block.extractedPath = fromFence.path;
      block.matchReason = 'fence_attribute';
      block.confidence = 'high';
      continue;
    }

    // 2. Preceding markdown heading: #### `backend/Dockerfile`, ### `src/components/Header.tsx`
    const fromPreceding = extractFromPrecedingLines(lines, block.startLine - 1);
    if (fromPreceding.path) {
      block.extractedPath = fromPreceding.path;
      block.matchReason = fromPreceding.reason || 'preceding_heading';
      block.confidence = 'high';
      continue;
    }

    // 3. First line comment inside the block: // File: src/components/Header.tsx
    const fromFirstLines = extractFromFirstLines(block.content);
    if (fromFirstLines.path) {
      block.extractedPath = fromFirstLines.path;
      block.matchReason = fromFirstLines.reason || 'first_line_comment';
      block.confidence = 'high';
      if (cleanFirstLinePathComment) {
        block.content = fromFirstLines.cleanedCode;
      }
      continue;
    }

    // 4. Fence path without attributes (e.g. ```src/app.tsx or ```package.json)
    if (fromFence.path) {
      block.extractedPath = fromFence.path;
      block.matchReason = 'fence_attribute';
      block.confidence = 'high';
      continue;
    }
  }

  // Correlate fenced blocks with tree structure paths
  const treeMap = new Map<string, string[]>();
  for (const tPath of referencedPathsSet) {
    const filename = tPath.split('/').pop() || '';
    if (!treeMap.has(filename)) {
      treeMap.set(filename, []);
    }
    treeMap.get(filename)!.push(tPath);
  }

  for (const block of fencedBlocks) {
    if (block.extractedPath) {
      const extractedBase = block.extractedPath.split('/').pop() || '';
      if (!block.extractedPath.includes('/') && treeMap.has(extractedBase)) {
        const matches = treeMap.get(extractedBase)!;
        if (matches.length === 1) {
          block.extractedPath = matches[0];
          block.matchReason = 'tree_unique_match';
          block.confidence = 'high';
        } else if (matches.length > 1) {
          diagnostics.push({
            id: `ambiguous-path-${block.index}`,
            severity: 'warning',
            title: `Ambiguous File Path: "${extractedBase}"`,
            message: `Code block #${block.index} specifies filename "${extractedBase}", which matches multiple locations in the tree (${matches.join(', ')}). Defaulting to "${matches[0]}".`,
            blockIndex: block.index,
            line: block.startLine,
            suggestedAction: 'Specify full directory in the heading or code block to avoid ambiguity.',
          });
          block.extractedPath = matches[0];
          block.confidence = 'low';
        }
      }
    }
  }

  for (const block of fencedBlocks) {
    if (!block.extractedPath) {
      const isShellInstall =
        /^\s*(?:npm|yarn|pnpm|bun|pip|cargo|go|cd|cp|npx|docker|git|expo|curl|source)\b/m.test(block.content);
      const isTreeBlock = block.content.includes('├──') || block.content.includes('└──');

      if (isTreeBlock) {
        block.status = 'unresolved';
        diagnostics.push({
          id: `tree-block-${block.index}`,
          severity: 'info',
          title: `Project Structure Tree Detected (Block #${block.index})`,
          message: `Block #${block.index} was identified as an ASCII project structure tree and used to verify file paths.`,
          blockIndex: block.index,
          line: block.startLine,
        });
      } else if (isShellInstall) {
        block.status = 'unresolved';
        diagnostics.push({
          id: `command-block-${block.index}`,
          severity: 'info',
          title: `Terminal Command Block Ignored (Block #${block.index})`,
          message: `Block #${block.index} contains terminal setup commands (e.g. npm install), excluded from source files.`,
          blockIndex: block.index,
          line: block.startLine,
        });
      } else {
        block.status = 'unresolved';
        diagnostics.push({
          id: `unresolved-block-${block.index}`,
          severity: 'error',
          title: `Unresolved Code Block #${block.index} (Lines ${block.startLine}-${block.endLine})`,
          message: `Could not deterministically determine which file this ${block.langTag || 'code'} block belongs to.`,
          blockIndex: block.index,
          line: block.startLine,
          suggestedAction: 'Assign a file path manually in the audit inspector before exporting.',
        });
      }
    }
  }

  codeBlocks.push(...fencedBlocks);

  // Re-index all blocks sequentially
  codeBlocks.forEach((b, i) => {
    b.index = i + 1;
    b.id = `block-${i + 1}`;
  });

  // -------------------------------------------------------------
  // STAGE 8: Common Root Directory Stripping & Normalization
  // -------------------------------------------------------------
  const PROTECTED_ROOTS = new Set([
    'components',
    'src',
    'app',
    'lib',
    'pages',
    'public',
    'styles',
    'utils',
    'server',
    'client',
    'common',
    'core',
    'hooks',
    'types',
    'assets',
    'test',
    'tests',
    'docs',
    'api',
    'routes',
  ]);

  let detectedRoot: string | null = rootPrefix || null;
  const allResolvedPaths = codeBlocks
    .map((b) => b.extractedPath)
    .filter((p): p is string => Boolean(p));

  const allWorkspacePaths = [...allResolvedPaths, ...referencedPathsSet];

  if (!detectedRoot && allWorkspacePaths.length > 1) {
    const firstParts = allWorkspacePaths[0].split('/');
    if (firstParts.length > 1) {
      const candidate = firstParts[0];
      if (!PROTECTED_ROOTS.has(candidate.toLowerCase())) {
        const allShareCandidate = allWorkspacePaths.every((p) => p.startsWith(`${candidate}/`));
        if (allShareCandidate) {
          detectedRoot = candidate;
        }
      }
    }
  }

  for (const block of codeBlocks) {
    if (block.extractedPath) {
      let finalPath = block.extractedPath;
      if (stripCommonRoot && detectedRoot && finalPath.startsWith(`${detectedRoot}/`)) {
        finalPath = finalPath.slice(detectedRoot.length + 1);
      }
      block.resolvedPath = finalPath;
      if (block.status === 'unresolved') {
        block.status = 'assigned';
      }
    }
  }

  // -------------------------------------------------------------
  // STAGE 9: Build Final Project Files & Resolve Collisions
  // -------------------------------------------------------------
  const pathGroups = new Map<string, ExtractedCodeBlock[]>();
  for (const block of codeBlocks) {
    if (block.resolvedPath) {
      if (!pathGroups.has(block.resolvedPath)) {
        pathGroups.set(block.resolvedPath, []);
      }
      pathGroups.get(block.resolvedPath)!.push(block);
    }
  }

  const projectFiles: Record<string, ProjectFile> = {};

  pathGroups.forEach((blocks, filePath) => {
    const isDuplicate = blocks.length > 1;

    if (isDuplicate) {
      const blockNumbers = blocks.map((b) => `#${b.index}`).join(', ');
      diagnostics.push({
        id: `duplicate-${filePath}`,
        severity: 'warning',
        title: `Multiple Blocks for "${filePath}"`,
        message: `Found ${blocks.length} blocks targeting "${filePath}": ${blockNumbers}. Resolution strategy: ${duplicateResolution.replace('_', ' ')}.`,
        filePath: filePath,
        suggestedAction: 'Review the blocks in the file inspector to ensure no unintended replacement occurred.',
      });

      blocks.forEach((b) => {
        b.status = 'duplicate';
      });
    } else {
      blocks[0].status = 'assigned';
    }

    // Determine final content
    let finalContent = '';
    // If virtualFiles already has sequentially simulated content (e.g. from tool calls)
    if (virtualFiles[filePath] !== undefined) {
      finalContent = virtualFiles[filePath];
    } else {
      if (duplicateResolution === 'use_latest') {
        finalContent = blocks[blocks.length - 1].content;
      } else if (duplicateResolution === 'use_first') {
        finalContent = blocks[0].content;
      } else if (duplicateResolution === 'append') {
        finalContent = blocks.map((b) => b.content).join('\n\n');
      } else {
        finalContent = blocks[blocks.length - 1].content;
      }
    }

    // Aggregate truncation warnings
    const allTruncations: string[] = [];
    blocks.forEach((b) => {
      allTruncations.push(...b.truncationWarnings);
    });

    // Also check final content directly
    if (detectTruncations) {
      const finalContentWarnings = inspectCodeTruncations(finalContent);
      for (const w of finalContentWarnings) {
        if (!allTruncations.includes(w)) allTruncations.push(w);
      }
    }

    if (allTruncations.length > 0) {
      diagnostics.push({
        id: `truncation-${filePath}`,
        severity: 'warning',
        title: `Possible Truncation in "${filePath}"`,
        message: `Detected ${allTruncations.length} placeholder(s) or omission marker(s) (e.g., "..."): ${allTruncations[0]}`,
        filePath: filePath,
        suggestedAction: 'Check file contents to verify it is complete and not missing lines.',
      });
    }

    projectFiles[filePath] = {
      path: filePath,
      content: finalContent,
      language: getLanguageFromPath(filePath),
      sourceBlockIndices: blocks.map((b) => b.index),
      isFromTree: referencedPathsSet.has(filePath),
      isMissingContent: false,
      isDuplicate: isDuplicate,
      hasTruncationWarning: allTruncations.length > 0,
      truncationNotes: allTruncations,
      sizeBytes: new TextEncoder().encode(finalContent).length,
      lineCount: finalContent.split('\n').length,
      allBlocks: blocks.map((b) => ({
        blockIndex: b.index,
        startLine: b.startLine,
        content: b.content,
        reason: b.matchReason,
      })),
    };
  });

  // -------------------------------------------------------------
  // STAGE 10: Cross-Check with Tree & Referenced Paths for Placeholders
  // -------------------------------------------------------------
  const normalizedTreePaths: string[] = [];
  for (const rawTreePath of referencedPathsSet) {
    let norm = rawTreePath;
    if (stripCommonRoot && detectedRoot && norm.startsWith(`${detectedRoot}/`)) {
      norm = norm.slice(detectedRoot.length + 1);
    }
    normalizedTreePaths.push(norm);

    if (!projectFiles[norm]) {
      projectFiles[norm] = {
        path: norm,
        content: `// [REFERENCED / TREE FILE PLACEHOLDER]\n// File "${norm}" was referenced in the transcript or project structure tree,\n// but no code block content was provided for it in the input.\n`,
        language: getLanguageFromPath(norm),
        sourceBlockIndices: [],
        isFromTree: true,
        isMissingContent: true,
        isDuplicate: false,
        hasTruncationWarning: false,
        truncationNotes: [],
        sizeBytes: 0,
        lineCount: 0,
      };

      diagnostics.push({
        id: `missing-file-${norm}`,
        severity: 'info',
        title: `Referenced Workspace File: "${norm}"`,
        message: `"${norm}" was inspected or referenced in the workspace, but its contents were not modified or provided in the text.`,
        filePath: norm,
        suggestedAction: 'A placeholder has been created. You can view or add code in the editor.',
      });
    }
  }

  // -------------------------------------------------------------
  // STAGE 11: Calculate Final Statistics
  // -------------------------------------------------------------
  let totalBytes = 0;
  let totalLines = 0;
  let missingCount = 0;
  let dupCount = 0;
  let truncCount = 0;

  Object.values(projectFiles).forEach((f) => {
    totalBytes += f.sizeBytes;
    totalLines += f.lineCount;
    if (f.isMissingContent) missingCount++;
    if (f.isDuplicate) dupCount++;
    if (f.hasTruncationWarning) truncCount++;
  });

  const totalAssigned = codeBlocks.filter((b) => b.resolvedPath).length;
  const totalUnresolved = codeBlocks.filter((b) => !b.resolvedPath && b.status === 'unresolved').length;

  return {
    files: projectFiles,
    treeDeclaredPaths: normalizedTreePaths,
    codeBlocks: codeBlocks,
    diagnostics: diagnostics.sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    }),
    rootFolderPrefix: detectedRoot,
    stats: {
      totalCodeBlocks: codeBlocks.length,
      assignedBlocks: totalAssigned,
      unresolvedBlocks: totalUnresolved,
      totalFiles: Object.keys(projectFiles).length,
      missingContentFiles: missingCount,
      duplicateFiles: dupCount,
      truncatedFiles: truncCount,
      totalBytes: totalBytes,
      totalLines: totalLines,
    },
  };
}
