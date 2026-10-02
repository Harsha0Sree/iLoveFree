import { ProjectFile } from './parser';

export interface SearchMatch {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  startIndex: number;
  endIndex: number;
}

export interface SearchResultFile {
  filePath: string;
  matches: SearchMatch[];
}

export interface SearchOptions {
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
  useRegex?: boolean;
}

export function searchProjectFiles(
  files: Record<string, ProjectFile>,
  query: string,
  options: SearchOptions = {}
): SearchResultFile[] {
  if (!query || !query.trim()) return [];

  const { caseSensitive = false, matchWholeWord = false, useRegex = false } = options;
  const results: SearchResultFile[] = [];

  let regex: RegExp;
  try {
    if (useRegex) {
      regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
    } else {
      let escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (matchWholeWord) {
        escaped = `\\b${escaped}\\b`;
      }
      regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    }
  } catch {
    // If invalid regex, fall back to literal search
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  }

  for (const [filePath, file] of Object.entries(files)) {
    const lines = file.content.split('\n');
    const fileMatches: SearchMatch[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        fileMatches.push({
          filePath,
          lineNumber: i + 1,
          lineContent: line,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });

        // Prevent infinite loop on zero-width match
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    }

    if (fileMatches.length > 0) {
      results.push({
        filePath,
        matches: fileMatches,
      });
    }
  }

  return results;
}
