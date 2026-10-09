'use client';

import React from 'react';

interface CodeHighlighterProps {
  line: string;
  language?: string;
  isTruncationWarning?: boolean;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  line,
  language = 'plaintext',
  isTruncationWarning = false,
}) => {
  if (!line) {
    return <span>&nbsp;</span>;
  }

  if (isTruncationWarning) {
    return <span className="text-amber-300 font-semibold">{line}</span>;
  }

  const lang = (language || '').toLowerCase();

  // Fast line-level tokenizer
  const tokens = tokenizeLine(line, lang);

  return (
    <span>
      {tokens.map((token, i) => (
        <span key={i} className={token.className} style={token.style}>
          {token.text}
        </span>
      ))}
    </span>
  );
};

interface Token {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

const CONTROL_KEYWORDS = new Set([
  'if', 'else', 'elif', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'yield', 'try', 'catch', 'finally', 'throw',
  'await', 'match'
]);

const GENERAL_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'extends', 'implements',
  'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'abstract',
  'public', 'private', 'protected', 'readonly', 'static', 'new', 'this',
  'super', 'import', 'export', 'from', 'as', 'default', 'async', 'of', 'in',
  'typeof', 'instanceof', 'void', 'delete', 'keyof', 'is',
  // Python
  'def', 'lambda', 'with', 'pass', 'raise', 'except', 'assert', 'global',
  'nonlocal', 'import', 'from', 'as',
  // Rust / Go
  'fn', 'pub', 'mut', 'struct', 'trait', 'impl', 'crate', 'use', 'mod',
  'func', 'package', 'var', 'type', 'range', 'chan', 'go', 'select', 'defer',
  // SQL
  'select', 'from', 'where', 'and', 'or', 'join', 'left', 'right', 'inner',
  'outer', 'on', 'group', 'by', 'order', 'having', 'limit', 'offset', 'insert',
  'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'alter', 'drop'
]);

const TYPE_KEYWORDS = new Set([
  'string', 'number', 'boolean', 'symbol', 'bigint', 'any', 'unknown',
  'never', 'object', 'undefined', 'null', 'void', 'React', 'FC', 'Promise',
  'Array', 'Record', 'Set', 'Map', 'int', 'float', 'double', 'char', 'bool',
  'str', 'list', 'dict', 'tuple', 'i32', 'i64', 'u32', 'u64', 'f32', 'f64',
  'usize', 'bool', 'int64', 'string', 'byte'
]);

const BOOLEAN_LITERALS = new Set([
  'true', 'false', 'null', 'undefined', 'None', 'True', 'False', 'nil'
]);

function tokenizeLine(line: string, lang: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  const length = line.length;

  while (index < length) {
    const remaining = line.slice(index);

    // 1. Comments: //, /*, */, # (for python/bash/yaml)
    if (remaining.startsWith('//') || remaining.startsWith('/*') || (['python', 'py', 'sh', 'bash', 'yaml', 'yml', 'dockerfile'].includes(lang) && remaining.startsWith('#'))) {
      tokens.push({
        text: remaining,
        className: 'italic',
        style: { color: '#6a9955' }, // VS Code green comment
      });
      break;
    }

    // HTML / JSX comments: <!-- ... -->
    if (remaining.startsWith('<!--')) {
      tokens.push({
        text: remaining,
        className: 'italic',
        style: { color: '#6a9955' },
      });
      break;
    }

    // 2. Strings: double quotes, single quotes, backticks
    const firstChar = remaining[0];
    if (firstChar === '"' || firstChar === "'" || firstChar === '`') {
      let strEnd = 1;
      let escaped = false;
      while (strEnd < remaining.length) {
        const c = remaining[strEnd];
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === firstChar) {
          strEnd++;
          break;
        }
        strEnd++;
      }
      tokens.push({
        text: remaining.slice(0, strEnd),
        style: { color: '#ce9178' }, // VS Code warm coral string
      });
      index += strEnd;
      continue;
    }

    // 3. HTML / JSX tags: e.g. <div or </div or />
    if (['html', 'xml', 'svg', 'jsx', 'tsx'].includes(lang) && remaining.startsWith('<') && !remaining.startsWith('<=') && !remaining.startsWith('<<')) {
      const tagMatch = remaining.match(/^<(\/?)([a-zA-Z0-9_\-.:]+)/);
      if (tagMatch) {
        tokens.push({
          text: '<' + tagMatch[1],
          style: { color: '#808080' },
        });
        const tagName = tagMatch[2];
        const isComponent = /^[A-Z]/.test(tagName);
        tokens.push({
          text: tagName,
          style: { color: isComponent ? '#4ec9b0' : '#569cd6' },
        });
        index += tagMatch[0].length;
        continue;
      }
    }

    // 4. Numbers
    const numberMatch = remaining.match(/^(?:0x[a-fA-F0-9]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/);
    if (numberMatch) {
      tokens.push({
        text: numberMatch[0],
        style: { color: '#b5cea8' }, // VS Code light green number
      });
      index += numberMatch[0].length;
      continue;
    }

    // 5. Identifiers, Keywords, Function Calls
    const identMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (identMatch) {
      const word = identMatch[0];
      const afterWord = remaining.slice(word.length);

      if (CONTROL_KEYWORDS.has(word)) {
        tokens.push({
          text: word,
          style: { color: '#c586c0' }, // VS Code control flow purple
        });
      } else if (GENERAL_KEYWORDS.has(word) || GENERAL_KEYWORDS.has(word.toLowerCase())) {
        tokens.push({
          text: word,
          style: { color: '#569cd6' }, // VS Code keyword blue
        });
      } else if (BOOLEAN_LITERALS.has(word)) {
        tokens.push({
          text: word,
          style: { color: '#569cd6' },
        });
      } else if (TYPE_KEYWORDS.has(word) || (/^[A-Z]/.test(word) && !/^\s*\(/.test(afterWord))) {
        tokens.push({
          text: word,
          style: { color: '#4ec9b0' }, // VS Code turquoise type / class
        });
      } else if (/^\s*\(/.test(afterWord)) {
        // Function call: identifier(...)
        tokens.push({
          text: word,
          style: { color: '#dcdcaa' }, // VS Code function yellow
        });
      } else {
        // Variable / property name
        tokens.push({
          text: word,
          style: { color: '#9cdcfe' }, // VS Code variable light blue
        });
      }

      index += word.length;
      continue;
    }

    // 6. Whitespace
    const spaceMatch = remaining.match(/^\s+/);
    if (spaceMatch) {
      tokens.push({
        text: spaceMatch[0],
      });
      index += spaceMatch[0].length;
      continue;
    }

    // 7. Operators & Punctuation
    const char = remaining[0];
    if ('{}()[]'.includes(char)) {
      tokens.push({
        text: char,
        style: { color: '#ffd700' }, // Matching bracket gold
      });
    } else if (['=>', '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/='].some((op) => remaining.startsWith(op))) {
      const op = ['=>', '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/='].find((o) => remaining.startsWith(o))!;
      tokens.push({
        text: op,
        style: { color: '#d4d4d4' },
      });
      index += op.length;
      continue;
    } else {
      tokens.push({
        text: char,
        style: { color: '#d4d4d4' },
      });
    }
    index++;
  }

  return tokens;
}
