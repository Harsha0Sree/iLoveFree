/**
 * Code auto-formatter supporting multiple languages on save
 */

export interface FormatOptions {
  tabSize?: number;
}

export function formatCode(
  code: string,
  language: string,
  options: FormatOptions = {}
): string {
  if (!code || !code.trim()) return code;

  const tabSize = options.tabSize || 2;
  const indentStr = ' '.repeat(tabSize);
  const lang = (language || '').toLowerCase().trim();

  // 1. JSON formatting
  if (lang === 'json' || lang.endsWith('.json')) {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, tabSize) + '\n';
    } catch {
      // If parsing fails, fall through to bracket indentation
    }
  }

  // 2. Python formatting
  if (lang === 'python' || lang === 'py') {
    return formatPython(code, indentStr);
  }

  // 3. HTML / XML / SVG formatting
  if (['html', 'xml', 'svg', 'vue', 'svelte'].includes(lang)) {
    return formatHtmlXml(code, indentStr);
  }

  // 4. CSS / SCSS / LESS
  if (['css', 'scss', 'less'].includes(lang)) {
    return formatCss(code, indentStr);
  }

  // 5. SQL formatting
  if (lang === 'sql') {
    return formatSql(code, indentStr);
  }

  // 6. JavaScript / TypeScript / JSX / TSX / C / C++ / C# / Java / Go / Rust / PHP / Swift / Kotlin
  return formatCStyle(code, indentStr);
}

function formatPython(code: string, indentStr: string): string {
  const lines = code.split(/\r?\n/);
  const formattedLines: string[] = [];
  let inMultiLineString = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check multiline docstring
    if (trimmed.includes('"""') || trimmed.includes("'''")) {
      const count3Double = (rawLine.match(/"""/g) || []).length;
      const count3Single = (rawLine.match(/'''/g) || []).length;
      if ((count3Double % 2 !== 0) || (count3Single % 2 !== 0)) {
        inMultiLineString = !inMultiLineString;
      }
    }

    if (inMultiLineString) {
      formattedLines.push(rawLine.trimEnd());
      continue;
    }

    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Preserve existing indentation level but normalize spaces
    const leadingWhitespaceMatch = rawLine.match(/^(\s*)/);
    const leadingSpaces = leadingWhitespaceMatch ? leadingWhitespaceMatch[1].length : 0;
    const indentLevel = Math.round(leadingSpaces / 4);
    const newIndent = indentStr.repeat(indentLevel);

    // Format operators carefully outside quotes
    const formattedCode = formatOperatorsInLine(trimmed);
    formattedLines.push(newIndent + formattedCode);
  }

  // Ensure single trailing newline
  while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
    formattedLines.pop();
  }
  return formattedLines.join('\n') + '\n';
}

function formatCStyle(code: string, indentStr: string): string {
  const lines = code.split(/\r?\n/);
  const formattedLines: string[] = [];
  let indentLevel = 0;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      // Collapse multiple consecutive empty lines to one
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Check block comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }

    if (inBlockComment) {
      formattedLines.push(indentStr.repeat(indentLevel) + trimmed);
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // Single line comments
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      formattedLines.push(indentStr.repeat(indentLevel) + trimmed);
      continue;
    }

    // Count closing brackets that start this line to decrease indent before printing
    let startsWithDedent = 0;
    let checkStr = trimmed;
    while (/^[}\])]\s*/.test(checkStr)) {
      startsWithDedent++;
      checkStr = checkStr.replace(/^[}\])]\s*/, '');
    }

    const currentIndent = Math.max(0, indentLevel - startsWithDedent);

    // Format operators and spacing on the line
    const formattedLineContent = formatOperatorsInLine(trimmed);
    formattedLines.push(indentStr.repeat(currentIndent) + formattedLineContent);

    // Compute net indent change on this line (excluding characters inside quotes)
    const netChange = computeBracketChange(trimmed);
    indentLevel = Math.max(0, indentLevel + netChange);
  }

  while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
    formattedLines.pop();
  }
  return formattedLines.join('\n') + '\n';
}

function computeBracketChange(line: string): number {
  let change = 0;
  let inQuote: string | null = null;
  let isEscaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (ch === '\\') {
      isEscaped = true;
      continue;
    }

    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch;
      continue;
    }

    if (ch === '/' && line[i + 1] === '/') {
      break; // Single line comment
    }

    if (ch === '{' || ch === '(' || ch === '[') {
      change++;
    } else if (ch === '}' || ch === ')' || ch === ']') {
      change--;
    }
  }

  return change;
}

function formatOperatorsInLine(line: string): string {
  // If line is a comment or preprocessor, return as-is
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('#') || line.startsWith('*')) {
    return line;
  }

  // Normalize spaces around commas: e.g. "a,b, c" -> "a, b, c"
  let result = line.replace(/,([^\s\r\n'"`])/g, ', $1');

  // Normalize arrow functions "=>"
  result = result.replace(/([^\s=])=>/g, '$1 =>').replace(/=>([^\s>])/g, '=> $1');

  // Normalize colons in object properties (but not URLs like http://)
  result = result.replace(/([^:\s"'/])\s*:\s*([^:\s/])/g, '$1: $2');

  return result;
}

function formatCss(code: string, indentStr: string): string {
  const lines = code.split(/\r?\n/);
  const formattedLines: string[] = [];
  let indent = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    if (trimmed.startsWith('}')) {
      indent = Math.max(0, indent - 1);
    }

    // Format CSS property colon spacing: "color:red;" -> "color: red;"
    let formatted = trimmed;
    if (trimmed.includes(':') && !trimmed.startsWith('/*') && !trimmed.startsWith('@')) {
      formatted = trimmed.replace(/\s*:\s*/, ': ');
    }

    formattedLines.push(indentStr.repeat(indent) + formatted);

    if (trimmed.endsWith('{')) {
      indent++;
    }
  }

  return formattedLines.join('\n').trim() + '\n';
}

function formatHtmlXml(code: string, indentStr: string): string {
  // Simple tag-based XML/HTML beautifier
  const tokens = code.replace(/>\s*</g, '><').split(/(?<=<[^>]+>)/g);
  const formattedLines: string[] = [];
  let indent = 0;

  for (const rawToken of tokens) {
    const token = rawToken.trim();
    if (!token) continue;

    // Self-closing tag or comment or DOCTYPE
    const isSelfClosing = /^<.*\/>$/.test(token) || /^<!/.test(token) || /^<\?/.test(token) || /^<(meta|link|br|hr|img|input)/i.test(token);
    const isClosing = /^<\//.test(token);
    const isOpening = /^<[a-zA-Z0-9_-]/.test(token) && !isSelfClosing && !isClosing;

    if (isClosing) {
      indent = Math.max(0, indent - 1);
    }

    formattedLines.push(indentStr.repeat(indent) + token);

    if (isOpening) {
      indent++;
    }
  }

  return formattedLines.join('\n') + '\n';
}

function formatSql(code: string, indentStr: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
    'INNER JOIN', 'FULL JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
    'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
    'ALTER TABLE', 'DROP TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'NOT NULL'
  ];

  let formatted = code.trim();
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  }

  // Format lines
  const lines = formatted.split(/\r?\n/).map((l) => l.trimEnd());
  return lines.join('\n') + '\n';
}
