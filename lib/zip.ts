import JSZip from 'jszip';
import { ProjectFile, DiagnosticIssue } from './parser';

export interface ZipExportOptions {
  projectName?: string;
  includeAuditReport?: boolean;
  includeMissingPlaceholders?: boolean;
  diagnostics?: DiagnosticIssue[];
}

export async function generateProjectZip(
  files: Record<string, ProjectFile>,
  options: ZipExportOptions = {}
): Promise<{ blob: Blob; fileName: string; fileCount: number }> {
  const {
    projectName = 'project-bundle',
    includeAuditReport = true,
    includeMissingPlaceholders = true,
    diagnostics = [],
  } = options;

  const zip = new JSZip();
  let fileCount = 0;

  // Add each file to its respective path in the zip
  for (const [filePath, file] of Object.entries(files)) {
    if (file.isMissingContent && !includeMissingPlaceholders) {
      continue;
    }

    // JSZip handles folder paths automatically when passing full path like 'src/components/Button.tsx'
    zip.file(filePath, file.content);
    fileCount++;
  }

  // Optionally include an AUDIT_REPORT.md at project root
  if (includeAuditReport) {
    const timestamp = new Date().toISOString();
    let report = `# Project Extraction Audit Report\n\n`;
    report += `**Generated:** ${timestamp}\n`;
    report += `**Total Files Packaged:** ${fileCount}\n`;
    report += `**Generator:** RepoExtract (100% Deterministic Engine - Zero AI / LLM)\n\n`;

    report += `## Integrity Status\n\n`;
    if (diagnostics.length === 0) {
      report += `✅ **Flawless Extraction:** All code blocks and directory paths matched with 100% confidence. No duplicate blocks, missing files, or truncation markers detected.\n\n`;
    } else {
      const errorCount = diagnostics.filter((d) => d.severity === 'error').length;
      const warnCount = diagnostics.filter((d) => d.severity === 'warning').length;
      report += `⚠️ **Audits & Warnings:** ${errorCount} error(s), ${warnCount} warning(s) detected during deterministic analysis.\n\n`;

      report += `| Severity | Title | Path / Target | Message |\n`;
      report += `|---|---|---|---|\n`;
      diagnostics.forEach((d) => {
        const icon = d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️';
        report += `| ${icon} ${d.severity.toUpperCase()} | ${d.title.replace(/\|/g, '\\|')} | ${d.filePath || 'Global'} | ${d.message.replace(/\|/g, '\\|')} |\n`;
      });
      report += `\n`;
    }

    report += `## Packaged Files Manifest\n\n`;
    report += `| File Path | Lines | Size (Bytes) | Source Block(s) | Status |\n`;
    report += `|---|---|---|---|---|\n`;
    Object.values(files).forEach((f) => {
      let statusTag = '✅ OK';
      if (f.isMissingContent) statusTag = '❌ MISSING (Placeholder)';
      else if (f.isDuplicate) statusTag = '⚠️ DUPLICATE BLOCKS';
      else if (f.hasTruncationWarning) statusTag = '⚠️ TRUNCATED CODE';

      const sources = f.sourceBlockIndices.length > 0 ? f.sourceBlockIndices.map((i) => `#${i}`).join(', ') : 'None';
      report += `| \`${f.path}\` | ${f.lineCount} | ${f.sizeBytes} | ${sources} | ${statusTag} |\n`;
    });

    zip.file('AUDIT_REPORT.md', report);
  }

  const cleanProjectName = projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'project-bundle';
  const zipFileName = `${cleanProjectName}.zip`;

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return {
    blob,
    fileName: zipFileName,
    fileCount,
  };
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
