import fs from 'fs';

// Helper: Clean and unescape JSON string values
export function unescapeJsonString(str) {
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
  s = s.replace(/\\n/g, '\n')
       .replace(/\\r/g, '\r')
       .replace(/\\t/g, '\t')
       .replace(/\\"/g, '"')
       .replace(/\\'/g, "'")
       .replace(/\\\\/g, '\\');

  // Strip outer quotes again if the entire unescaped string was quoted
  if (
    (s.startsWith('"') && s.endsWith('"') && !s.slice(1, -1).includes('\n')) ||
    (s.startsWith("'") && s.endsWith("'") && !s.slice(1, -1).includes('\n'))
  ) {
    s = s.slice(1, -1);
  }

  return s;
}

const SPECIAL_FILENAMES = new Set([
  'dockerfile', 'makefile', 'gemfile', 'procfile', 'license', 'readme',
  '.gitignore', '.dockerignore', '.npmignore', '.env', '.env.local',
  '.env.example', '.env.production', '.env.development', '.env.test',
  '.editorconfig', '.prettierrc', '.eslintrc', '.eslintrc.json', '.eslintrc.js',
]);

export function normalizeFilePath(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let curr = raw.trim();
  let prev = '';

  while (prev !== curr) {
    prev = curr;
    while (
      (curr.startsWith('\\"') && curr.endsWith('\\"')) ||
      (curr.startsWith("\\'") && curr.endsWith("\\'"))
    ) {
      curr = curr.slice(2, -2).trim();
    }
    // Strip wrapping symbols: backticks, quotes, brackets, parens, braces, angle brackets, bold/italic
    curr = curr.replace(/^[`'""'""«»„“"\[\](){}<>_*\s\\]+|[`'""'""«»„“"\[\](){}<>_*\s\\]+$/g, '').trim();
    // Strip line numbers (:32, :123) or trailing colons, commas, semicolons
    curr = curr.replace(/:\d+$/, '').trim();
    curr = curr.replace(/[:;,]+$/, '').trim();
    curr = curr.replace(/\*\/$|-->$/, '').trim();
    curr = curr.replace(/&quot;/g, '').replace(/&#39;/g, '').replace(/&lt;/g, '').replace(/&gt;/g, '').trim();
    curr = curr.replace(/^(?:File(?:\s*\d+)?|filepath|path|filename|source|TargetFile|AbsolutePath)\s*[:=]\s*/i, '').trim();
  }

  // Convert backslashes to forward slashes
  curr = curr.replace(/\\/g, '/');
  // Strip quotes again in case backslash conversion freed them
  curr = curr.replace(/^['"]+|['"]+$/g, '').trim();
  // Strip leading ./, .\, /, \
  curr = curr.replace(/^\.?\/+/, '');
  // Remove duplicate slashes
  curr = curr.replace(/\/+/g, '/');
  // Remove URL query params or fragment hashes
  curr = curr.replace(/[?#].*$/, '');

  // Safely resolve path traversal
  if (curr.includes('..')) {
    const parts = curr.split('/');
    const safeParts = [];
    for (const part of parts) {
      if (part === '..') {
        if (safeParts.length > 0) safeParts.pop();
      } else if (part !== '.' && part !== '') {
        safeParts.push(part);
      }
    }
    curr = safeParts.join('/');
  }

  if (!curr || curr.endsWith('/')) return null;

  const base = curr.split('/').pop() || '';
  if (!base) return null;

  const isDotFile = base.startsWith('.') && base.length > 1;
  const hasExt = /^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9_-]+$/.test(base);
  const isSpecial = SPECIAL_FILENAMES.has(base.toLowerCase()) || isDotFile;

  if (!hasExt && !isSpecial) return null;
  if (curr.includes(' ')) return null;
  if (/[*|<>"?]/.test(curr)) return null;

  return curr;
}

console.log("Normalize test 1:", normalizeFilePath("\"\\\"/components/NewProjectModal.tsx\\\"\""));
console.log("Normalize test 2:", normalizeFilePath("`package.json`:"));
