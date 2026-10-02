/**
 * Deterministic Project Parser & Extractor
 * No LLM / No AI inference. Purely deterministic parsing, structural analysis,
 * file-tree correlation, collision resolution, and integrity verification.
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
  'makefile',
  'gemfile',
  'procfile',
  'license',
  'readme',
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
 * Clean and normalize a relative file path.
 * Disallows absolute path traversal and markdown clutter.
 */
export function normalizeFilePath(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = raw.trim();

  // Strip wrapping backticks, quotes, braces, parens
  cleaned = cleaned.replace(/^[`'""([<{\s]+|[`'""\])>}\s]+$/g, '');

  // Strip markdown formatting if any remains
  cleaned = cleaned.replace(/^\*\*|\*\*$/g, '');
  cleaned = cleaned.replace(/^File(?:\s*\d+)?\s*:\s*/i, '');
  cleaned = cleaned.replace(/^Path\s*:\s*/i, '');
  cleaned = cleaned.replace(/^Filename\s*:\s*/i, '');

  // Strip trailing punctuation like : or , or ; or */ or -->
  cleaned = cleaned.replace(/[:;,]+$/, '').trim();
  cleaned = cleaned.replace(/\*\/$|-->$/, '').trim();

  // Convert backslashes to forward slashes
  cleaned = cleaned.replace(/\\/g, '/');

  // Strip leading ./ or /
  cleaned = cleaned.replace(/^\.?\/+/, '');

  // Remove duplicate slashes
  cleaned = cleaned.replace(/\/+/g, '/');

  // Check for path traversal attempts
  if (cleaned.includes('..')) {
    const parts = cleaned.split('/');
    const safeParts: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        if (safeParts.length > 0) safeParts.pop();
      } else if (part !== '.' && part !== '') {
        safeParts.push(part);
      }
    }
    cleaned = safeParts.join('/');
  }

  // Basic validation: must have valid characters and look like a file
  if (!cleaned || cleaned.endsWith('/')) {
    return null;
  }

  const base = cleaned.split('/').pop() || '';
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
  if (cleaned.includes(' ')) {
    return null;
  }

  // Reject strings with impossible URL or query characters
  if (/[?#*|"<>!]/.test(cleaned)) {
    return null;
  }

  return cleaned;
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

  // Find blocks or regions that look like ASCII tree
  // Tree characters: ├──, └──, │, |--, \--, +--
  const isTreeLine = (line: string) =>
    /[├└│|]\s*[-─+]|^\s*[-*]\s+[\w.-]+\/|^\s*[\w.-]+\/\s*$/.test(line) ||
    /^[ \t]*[|\\+]-+/.test(line);

  let inTreeBlock = false;

  // Stack of directory paths per indentation level
  type IndentStackItem = { depth: number; dirPath: string };
  let dirStack: IndentStackItem[] = [];
  let rootFolderCandidate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect if inside code block tagged as text, tree, ascii, or bare
    if (line.trim().startsWith('```')) {
      const tag = line.replace(/^```/, '').trim().toLowerCase();
      if (tag === 'tree' || tag === 'ascii' || tag === 'text' || tag === 'bash' || tag === 'directory' || tag === '') {
        // Lookahead to see if next 3 lines are tree-like
        let lookAheadTree = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
          if (lines[j].trim().startsWith('```')) break;
          if (isTreeLine(lines[j]) || lines[j].includes('├──') || lines[j].includes('└──')) {
            lookAheadTree = true;
            break;
          }
        }
        if (lookAheadTree) {
          inTreeBlock = true;
          dirStack = [];
          continue;
        }
      }
      if (inTreeBlock) {
        inTreeBlock = false;
      }
    }

    if (!inTreeBlock && isTreeLine(line)) {
      inTreeBlock = true;
      dirStack = [];
    }

    if (inTreeBlock) {
      if (line.trim().startsWith('```')) {
        inTreeBlock = false;
        continue;
      }

      // If line is blank and next line is not a tree line, end tree block
      if (!line.trim()) {
        const next = lines[i + 1];
        if (!next || !isTreeLine(next)) {
          inTreeBlock = false;
          continue;
        }
      }

      // Parse the tree line
      // Clean tree drawing symbols: │, ├──, └──, |--, \--, +--, |
      const strippedSymbols = line.replace(/^[ \t│|]*[├└│\+\\][-─+ ]*\s*/, '');
      const rawTrimmed = strippedSymbols.trim();

      if (!rawTrimmed) continue;

      // Calculate approximate depth from original line prefix
      const matchPrefix = line.match(/^([ \t│|\s├└\+\\-─]*)/);
      const prefixLength = matchPrefix ? matchPrefix[1].length : 0;

      // Extract item name and strip comments or descriptive annotations (e.g. # comment, // comment, (note), - note, — note)
      let item = rawTrimmed.split(/\s+#|\s+\/\/|\s+\/\*|\s+[-—–]\s+|\s+\(|\s+\[/)[0].trim();
      item = item.replace(/^[`'"]+|[`'"]+$/g, '');

      if (!item) continue;

      const isDir = item.endsWith('/') || (!item.includes('.') && !SPECIAL_FILENAMES.has(item.toLowerCase()));
      item = item.replace(/\/+$/, '');

      // Maintain directory stack based on prefixLength
      while (dirStack.length > 0 && dirStack[dirStack.length - 1].depth >= prefixLength) {
        dirStack.pop();
      }

      const currentParent = dirStack.length > 0 ? dirStack[dirStack.length - 1].dirPath : '';
      const fullPath = currentParent ? `${currentParent}/${item}` : item;

      if (isDir) {
        if (!rootFolderCandidate && dirStack.length === 0 && !currentParent) {
          rootFolderCandidate = item;
        }
        dirStack.push({ depth: prefixLength, dirPath: fullPath });
      } else {
        const norm = normalizeFilePath(fullPath);
        if (norm) {
          declaredPaths.add(norm);
        }
      }
    }
  }

  // Also check if user wrote markdown lists with file paths under a "Project Structure" header
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
      // Find paths in list items: - `src/index.ts`
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
 * Examples:
 * ```ts path="src/index.ts"
 * ```tsx title="src/components/Header.tsx"
 * ```typescript:src/index.ts
 * ```json package.json
 * ```bash .env.example
 * ```gitignore .gitignore
 * ```css web/static/app.css
 * ```src/app.py
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
    // Check parts[1] (or parts[2] if parts[1] is a comment marker like #)
    let potentialPath = parts[1];
    if (potentialPath === '#' || potentialPath === '//') {
      potentialPath = parts[2] || '';
    }
    const path = normalizeFilePath(potentialPath);
    if (path) {
      return { path, lang: parts[0] };
    }
  }

  // Check if entire tag is a file path: ```src/index.ts or ```package.json or ```.gitignore
  const directPath = normalizeFilePath(trimmed);
  if (directPath) {
    return { path: directPath, lang: getLanguageFromPath(directPath) };
  }

  return { path: null, lang: parts[0] || '' };
}

/**
 * Helper to extract a file path from a comment or header line that may contain
 * descriptions, em-dashes, hyphens, colons, or parentheses.
 *
 * Examples:
 * "# .env.example — copy to .env" -> ".env.example"
 * "# .gitignore" -> ".gitignore"
 * "/* web/static/app.css — strictly black & white, both themes *\/" -> "web/static/app.css"
 * "/* web/static/workspace.js — terminal + diff polling for the task page *\/" -> "web/static/workspace.js"
 * "// filepath: src/index.ts" -> "src/index.ts"
 * "# path: app/main.py" -> "app/main.py"
 * "// components/Header.tsx: navigation header" -> "components/Header.tsx"
 * "### .env.example — copy to .env" -> ".env.example"
 */
function tryExtractPathFromCommentOrHeader(line: string): string | null {
  if (!line || typeof line !== 'string') return null;

  // Clean leading markdown headers (###, ##, #) or comment symbols (//, /*, #, <!--, --, ;)
  let body = line.replace(/^(?:#{1,6}\s*|\/\*+|\/\/+|#+|<!--+|--+|;+)\s*/, '').trim();

  // Strip trailing comment delimiters like */ or -->
  body = body.replace(/\*\/$|-->$/, '').trim();

  // Strip prefix keywords like "File 1:", "File:", "filepath:", "path:", "filename:", "source:"
  body = body.replace(/^(?:File(?:\s*\d+)?|filepath|path|filename|source)\s*:\s*/i, '').trim();

  // Strip leading list numbers like "1. ", "2) "
  body = body.replace(/^\d+[\.\)]\s*/, '').trim();

  // Strip leading backticks or quotes
  body = body.replace(/^[`'"]+/, '');

  // Now split on common delimiters between filename and description:
  // em-dash (—), en-dash (–), hyphen with spaces ( - ), colon with spaces ( : ), parenthesis ( ( ), bracket ( [ ), or backtick
  const tokens = body.split(/\s*[-—–]\s+|\s*:\s+|\s+\(|\s+\[|\s*[`'"]+\s*/);
  for (const token of tokens) {
    const candidate = token.trim();
    if (!candidate) continue;

    const norm = normalizeFilePath(candidate);
    if (norm) return norm;

    // Try first whitespace-delimited word in this token
    const firstWord = candidate.split(/\s+/)[0].trim();
    const normFirst = normalizeFilePath(firstWord);
    if (normFirst) return normFirst;
  }

  // Regex fallback: find any standalone token with file extension or dotfile pattern
  // e.g. web/static/app.css or .env.example or .gitignore
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

  // Look at lines 0 through min(3, lines.length - 1)
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line is a comment or header
    const isComment = /^(?:\/\*|\/\/|#|<!--|--|;)/.test(line);

    if (isComment) {
      const extracted = tryExtractPathFromCommentOrHeader(line);
      if (extracted) {
        // Clean out this header comment line so it doesn't leave clutter
        const newLines = [...lines];
        newLines.splice(i, 1);
        return {
          path: extracted,
          cleanedCode: newLines.join('\n'),
          reason: 'first_line_comment',
        };
      }
    }

    // Pattern: Bare first line that is purely a file path and NOT valid code
    // e.g. line 0 is "src/utils/calc.ts" or ".env.example" and line 1 is code
    if (i === 0) {
      const barePath = normalizeFilePath(line);
      if (barePath && (barePath.includes('/') || SPECIAL_FILENAMES.has(barePath.toLowerCase()) || barePath.startsWith('.'))) {
        // Verify line is not a valid JS/Python/Bash statement like "a / b.ts" or arithmetic
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
 * Extract filename from text lines preceding the code block (up to 8 lines backwards)
 */
function extractFromPrecedingLines(
  lines: string[],
  fenceLineIndex: number
): { path: string | null; reason: 'preceding_heading' | 'preceding_delimiter' | 'preceding_phrase' | null } {
  const maxLookback = Math.max(0, fenceLineIndex - 8);

  for (let i = fenceLineIndex - 1; i >= maxLookback; i--) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // If we hit another code fence or end of another block, stop searching backwards
    if (line.startsWith('```') || line.startsWith('~~~')) {
      break;
    }

    // Delimiter style: --- /components/Navbar.tsx --- or === package.json === or *** src/index.ts ***
    const delimMatch = line.match(/^[-=*~_]{2,}\s*[`'"]?([a-zA-Z0-9_./-]+)[`'"]?\s*[-=*~_]{2,}$/);
    if (delimMatch) {
      const path = normalizeFilePath(delimMatch[1]);
      if (path) {
        return { path, reason: 'preceding_delimiter' };
      }
    }

    // Heading style:
    // ### `src/components/Header.tsx`
    // ### 5. .env.example — copy to .env
    // ### web/static/app.css — strictly black & white
    // ## .gitignore
    if (/^#{1,6}\s+/.test(line)) {
      const path = tryExtractPathFromCommentOrHeader(line);
      if (path) {
        return { path, reason: 'preceding_heading' };
      }
    }

    // Bold title style: **`src/utils/math.ts`** or **File: .env.example** or **web/static/app.css**
    if (/^\*\*(?:File(?:\s*\d+)?\s*:\s*)?[`'"]?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|dockerfile|\.env[a-zA-Z0-9._-]*)[`'"]?\*\*:?$/i.test(line)) {
      const match = line.match(/^\*\*(?:File(?:\s*\d+)?\s*:\s*)?[`'"]?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9_-]+|\.[a-zA-Z0-9_.-]+|dockerfile|\.env[a-zA-Z0-9._-]*)[`'"]?\*\*:?$/i);
      if (match) {
        const path = normalizeFilePath(match[1]);
        if (path) {
          return { path, reason: 'preceding_heading' };
        }
      }
    }

    // Common instruction phrases:
    // "In `src/index.ts`:"
    // "Create `src/components/Button.tsx` with the following content:"
    // "Update `package.json`:"
    // "File: `.env.example`"
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

  return { path: null, reason: null };
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

  // 1. Extract declared tree structure if present
  const { paths: treePaths, rootPrefix } = extractDeclaredTreePaths(rawText);

  // 2. Extract all fenced code blocks
  const codeBlocks: ExtractedCodeBlock[] = [];
  let inBlock = false;
  let currentFence = '';
  let currentTag = '';
  let currentStartLine = 0;
  let currentBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(```|~~~)(.*)$/);

    if (fenceMatch) {
      const indent = fenceMatch[1];
      const fenceMarker = fenceMatch[2];
      const tagContent = fenceMatch[3];

      if (!inBlock) {
        // Start of code block
        inBlock = true;
        currentFence = fenceMarker;
        currentTag = tagContent;
        currentStartLine = i + 1; // 1-based line number
        currentBlockLines = [];
      } else {
        // Check if matching closing fence
        if (line.trim().startsWith(currentFence)) {
          // End of code block
          const endLine = i + 1;
          const content = currentBlockLines.join('\n');
          codeBlocks.push({
            id: `block-${codeBlocks.length + 1}`,
            index: codeBlocks.length + 1,
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
    // Unclosed code block detected!
    diagnostics.push({
      id: 'unclosed-fence',
      severity: 'error',
      title: 'Unclosed Code Block Detected',
      message: `Code block starting at line ${currentStartLine} was never closed with ${currentFence}. Its contents have been captured up to end of text.`,
      line: currentStartLine,
      suggestedAction: 'Ensure markdown code block has matching closing triple backticks.',
    });
    const content = currentBlockLines.join('\n');
    codeBlocks.push({
      id: `block-${codeBlocks.length + 1}`,
      index: codeBlocks.length + 1,
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

  // 3. For each code block, determine its destination file path deterministically
  for (const block of codeBlocks) {
    // Step A: Check fence tag line
    const fromFence = extractFromFenceTag(block.langTag);
    if (fromFence.path) {
      block.extractedPath = fromFence.path;
      block.matchReason = 'fence_attribute';
      block.confidence = 'high';
      continue;
    }

    // Step B: Check first lines of code content
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

    // Step C: Check preceding lines before the code block
    const fromPreceding = extractFromPrecedingLines(lines, block.startLine - 1);
    if (fromPreceding.path) {
      block.extractedPath = fromPreceding.path;
      block.matchReason = fromPreceding.reason || 'preceding_heading';
      block.confidence = 'medium';
      continue;
    }
  }

  // 4. Correlate with tree structure paths for disambiguation
  const treeMap = new Map<string, string[]>(); // filename -> array of full paths
  for (const tPath of treePaths) {
    const filename = tPath.split('/').pop() || '';
    if (!treeMap.has(filename)) {
      treeMap.set(filename, []);
    }
    treeMap.get(filename)!.push(tPath);
  }

  for (const block of codeBlocks) {
    if (block.extractedPath) {
      const extractedBase = block.extractedPath.split('/').pop() || '';
      // If the extracted path doesn't contain a slash, check if tree uniquely matches it
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

  // 5. Detect blocks that have no path assigned
  for (const block of codeBlocks) {
    if (!block.extractedPath) {
      // Check if it's an ASCII tree or shell command block (e.g. npm install ...)
      const isShellInstall = /^\s*(?:npm|yarn|pnpm|bun|pip|cargo|go get)\s+(?:install|add|run)/m.test(block.content);
      const isTreeBlock = block.content.includes('├──') || block.content.includes('└──');

      if (isTreeBlock) {
        block.status = 'unresolved';
        diagnostics.push({
          id: `tree-block-${block.index}`,
          severity: 'info',
          title: `Project Structure Tree Detected (Block #${block.index})`,
          message: `Block #${block.index} was identified as an ASCII project structure tree and used to verify file paths. It will not be written as a file.`,
          blockIndex: block.index,
          line: block.startLine,
        });
      } else if (isShellInstall) {
        block.status = 'unresolved';
        diagnostics.push({
          id: `command-block-${block.index}`,
          severity: 'info',
          title: `Terminal Command Block Ignored (Block #${block.index})`,
          message: `Block #${block.index} contains terminal setup commands (e.g. npm install), so it was excluded from project source files.`,
          blockIndex: block.index,
          line: block.startLine,
        });
      } else {
        block.status = 'unresolved';
        diagnostics.push({
          id: `unresolved-block-${block.index}`,
          severity: 'error',
          title: `Unresolved Code Block #${block.index} (Lines ${block.startLine}-${block.endLine})`,
          message: `Could not deterministically determine which file this ${block.langTag || 'code'} block belongs to. No file name was found in its tag, top comments, or preceding text.`,
          blockIndex: block.index,
          line: block.startLine,
          suggestedAction: 'Assign a file path manually in the audit inspector before exporting.',
        });
      }
    }
  }

  // 6. Common Root Directory Detection and Stripping
  let detectedRoot: string | null = rootPrefix || null;
  const allResolvedPaths = codeBlocks
    .map((b) => b.extractedPath)
    .filter((p): p is string => Boolean(p));

  if (!detectedRoot && allResolvedPaths.length > 1) {
    const firstParts = allResolvedPaths[0].split('/');
    if (firstParts.length > 1) {
      const candidate = firstParts[0];
      const allShareCandidate = allResolvedPaths.every((p) => p.startsWith(`${candidate}/`));
      if (allShareCandidate) {
        detectedRoot = candidate;
      }
    }
  }

  // Normalize final resolved paths
  for (const block of codeBlocks) {
    if (block.extractedPath) {
      let finalPath = block.extractedPath;
      if (stripCommonRoot && detectedRoot && finalPath.startsWith(`${detectedRoot}/`)) {
        finalPath = finalPath.slice(detectedRoot.length + 1);
      }
      block.resolvedPath = finalPath;
    }
  }

  // 7. Group code blocks by resolved file path and detect collisions/duplicates
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
      const blockNumbers = blocks.map((b) => `#${b.index} (line ${b.startLine})`).join(', ');
      diagnostics.push({
        id: `duplicate-${filePath}`,
        severity: 'warning',
        title: `Multiple Code Blocks for "${filePath}"`,
        message: `Found ${blocks.length} code blocks targeting the same path: ${blockNumbers}. Resolution strategy applied: ${duplicateResolution.replace('_', ' ')}.`,
        filePath: filePath,
        suggestedAction: 'Review the blocks in the file inspector to ensure no unintended replacement or mixing occurred.',
      });

      blocks.forEach((b) => {
        b.status = 'duplicate';
      });
    } else {
      blocks[0].status = 'assigned';
    }

    // Determine final content based on duplicate resolution strategy
    let finalContent = '';
    if (duplicateResolution === 'use_latest') {
      finalContent = blocks[blocks.length - 1].content;
    } else if (duplicateResolution === 'use_first') {
      finalContent = blocks[0].content;
    } else if (duplicateResolution === 'append') {
      finalContent = blocks.map((b) => b.content).join('\n\n');
    } else {
      finalContent = blocks[blocks.length - 1].content;
    }

    // Aggregate truncation warnings
    const allTruncations: string[] = [];
    blocks.forEach((b) => {
      allTruncations.push(...b.truncationWarnings);
    });

    if (allTruncations.length > 0) {
      diagnostics.push({
        id: `truncation-${filePath}`,
        severity: 'warning',
        title: `Possible Truncation in "${filePath}"`,
        message: `Detected ${allTruncations.length} placeholder(s) or omission marker(s) (e.g., "...rest of code..."): ${allTruncations[0]}`,
        filePath: filePath,
        suggestedAction: 'Check file contents to verify it is complete and not missing lines.',
      });
    }

    projectFiles[filePath] = {
      path: filePath,
      content: finalContent,
      language: getLanguageFromPath(filePath),
      sourceBlockIndices: blocks.map((b) => b.index),
      isFromTree: treePaths.some((tp) => {
        const normTp = stripCommonRoot && detectedRoot && tp.startsWith(`${detectedRoot}/`)
          ? tp.slice(detectedRoot.length + 1)
          : tp;
        return normTp === filePath;
      }),
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

  // 8. Cross-check with Tree Structure for Missing Files
  const normalizedTreePaths: string[] = [];
  for (const rawTreePath of treePaths) {
    let norm = rawTreePath;
    if (stripCommonRoot && detectedRoot && norm.startsWith(`${detectedRoot}/`)) {
      norm = norm.slice(detectedRoot.length + 1);
    }
    normalizedTreePaths.push(norm);

    if (!projectFiles[norm]) {
      projectFiles[norm] = {
        path: norm,
        content: `// [MISSING FILE CONTENT]\n// This file was declared in the project structure tree,\n// but no corresponding code block was provided in the input text.\n`,
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
        severity: 'error',
        title: `Missing Code for Tree-Declared File: "${norm}"`,
        message: `The project structure tree listed "${norm}", but no code block in the text provided its implementation.`,
        filePath: norm,
        suggestedAction: 'An empty placeholder file will be prepared. You can type or paste code for this file in the editor.',
      });
    }
  }

  // Calculate statistics
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
