import { ProjectFile } from './parser';

export interface UploadedProjectData {
  title: string;
  files: Record<string, ProjectFile>;
  transcript: string;
  totalBytes: number;
}

/**
 * Traverses and extracts text files from an uploaded FileList (Folder or Multiple Files)
 */
export async function processUploadedFiles(
  fileList: FileList | File[]
): Promise<UploadedProjectData> {
  const filesArray = Array.from(fileList);
  if (filesArray.length === 0) {
    throw new Error('No files provided');
  }

  // Determine top folder name if uploaded via webkitdirectory
  let inferredTitle = 'Uploaded Project';
  const firstPath = filesArray[0].webkitRelativePath || filesArray[0].name;
  if (firstPath.includes('/')) {
    inferredTitle = firstPath.split('/')[0];
  } else if (filesArray.length === 1) {
    inferredTitle = filesArray[0].name.replace(/\.[^/.]+$/, '');
  }

  const filesMap: Record<string, ProjectFile> = {};
  let totalBytes = 0;
  const transcriptBlocks: string[] = [];

  // Sort files for consistent tree structure
  filesArray.sort((a, b) => {
    const pathA = a.webkitRelativePath || a.name;
    const pathB = b.webkitRelativePath || b.name;
    return pathA.localeCompare(pathB);
  });

  for (const file of filesArray) {
    // Skip binary files, lock files, node_modules, git, and hidden items
    const rawPath = file.webkitRelativePath || file.name;
    if (
      rawPath.includes('/node_modules/') ||
      rawPath.includes('/.git/') ||
      rawPath.includes('/.next/') ||
      rawPath.includes('/dist/') ||
      rawPath.includes('/build/') ||
      file.name.startsWith('.')
    ) {
      continue;
    }

    // Strip top folder name if folder upload
    let cleanPath = rawPath;
    if (rawPath.startsWith(`${inferredTitle}/`)) {
      cleanPath = rawPath.slice(inferredTitle.length + 1);
    }

    try {
      const content = await file.text();
      const ext = cleanPath.split('.').pop()?.toLowerCase() || 'text';
      const sizeBytes = file.size || new TextEncoder().encode(content).length;
      const lineCount = content.split('\n').length;
      totalBytes += sizeBytes;

      filesMap[cleanPath] = {
        path: cleanPath,
        content,
        language: ext,
        sourceBlockIndices: [],
        isFromTree: false,
        isMissingContent: false,
        isDuplicate: false,
        hasTruncationWarning: false,
        truncationNotes: [],
        sizeBytes,
        lineCount,
      };

      transcriptBlocks.push(`\`\`\`${ext} ${cleanPath}\n${content}\n\`\`\``);
    } catch {
      // Skip unreadable / binary files
    }
  }

  // Generate clean markdown representation
  const filePaths = Object.keys(filesMap);
  const treeDisplay = filePaths.map((p) => `├── ${p}`).join('\n');
  const transcript = `# ${inferredTitle}\n\n${treeDisplay}\n\n${transcriptBlocks.join('\n\n')}`;

  return {
    title: inferredTitle,
    files: filesMap,
    transcript,
    totalBytes,
  };
}
