import { ProjectFile } from './parser';

export interface UploadedProjectData {
  title: string;
  files: Record<string, ProjectFile>;
  transcript: string;
  totalBytes: number;
  isSingleFile: boolean;
  primaryFilePath: string;
}

const BINARY_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'avif', 'tiff', 'tif', 'psd',
  // Videos
  'mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv', 'avi', 'wmv', 'flv',
  // Audio
  'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma',
  // Documents / Archives
  'pdf', 'zip', 'tar', 'gz', '7z', 'rar', 'bin', 'exe', 'dmg', 'iso',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
]);

export function isBinaryFile(file: File, filename: string): boolean {
  if (file.type) {
    if (file.type.startsWith('image/') && !file.type.includes('svg')) return true;
    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) return true;
    if (file.type === 'application/pdf') return true;
    if (file.type.includes('zip') || file.type.includes('octet-stream')) return true;
  }
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getMimeTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    bmp: 'image/bmp',
    avif: 'image/avif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    zip: 'application/zip',
    json: 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Traverses and processes any uploaded FileList (single file, multiple files, or directory tree).
 * Fully supports all file types (text, code, images, videos, audio, PDF, binary).
 */
export async function processUploadedFiles(
  fileList: FileList | File[]
): Promise<UploadedProjectData> {
  const filesArray = Array.from(fileList);
  if (filesArray.length === 0) {
    throw new Error('No files provided');
  }

  const isSingleFile = filesArray.length === 1;

  // Determine top folder name if uploaded via webkitdirectory or standalone file name
  let inferredTitle = 'Imported Project';
  const firstPath = filesArray[0].webkitRelativePath || filesArray[0].name;

  if (isSingleFile) {
    // If user uploads a standalone file (e.g. cat.png), use its name as project name
    inferredTitle = filesArray[0].name;
  } else if (firstPath.includes('/')) {
    inferredTitle = firstPath.split('/')[0];
  } else {
    inferredTitle = `Imported (${filesArray.length} files)`;
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
    const rawPath = file.webkitRelativePath || file.name;

    // Skip node_modules, git internal objects, build outputs, and hidden metadata
    if (
      rawPath.includes('/node_modules/') ||
      rawPath.includes('/.git/') ||
      rawPath.includes('/.next/') ||
      rawPath.includes('/dist/') ||
      rawPath.includes('/build/') ||
      file.name === '.DS_Store' ||
      file.name === 'Thumbs.db'
    ) {
      continue;
    }

    // Strip top folder name if folder upload
    let cleanPath = rawPath;
    if (!isSingleFile && rawPath.startsWith(`${inferredTitle}/`)) {
      cleanPath = rawPath.slice(inferredTitle.length + 1);
    }

    const ext = cleanPath.split('.').pop()?.toLowerCase() || 'txt';
    const isBinary = isBinaryFile(file, cleanPath);
    const sizeBytes = file.size;
    totalBytes += sizeBytes;

    try {
      if (isBinary) {
        // Read binary files safely as Data URL (preserves exact image/video data)
        const dataUrl = await readFileAsDataUrl(file);
        const mimeType = file.type || getMimeTypeFromExt(ext);

        filesMap[cleanPath] = {
          path: cleanPath,
          content: dataUrl,
          dataUrl,
          language: ext,
          isBinary: true,
          mimeType,
          sourceBlockIndices: [1],
          isFromTree: false,
          isMissingContent: false,
          isDuplicate: false,
          hasTruncationWarning: false,
          truncationNotes: [],
          sizeBytes,
          lineCount: 1,
        };

        transcriptBlocks.push(`<!-- [Binary Asset] ${cleanPath} (${mimeType}, ${(sizeBytes / 1024).toFixed(1)} KB) -->`);
      } else {
        // Attempt reading text / code file as UTF-8 string
        try {
          const content = await file.text();
          const lineCount = content.split('\n').length;

          filesMap[cleanPath] = {
            path: cleanPath,
            content,
            language: ext,
            isBinary: false,
            mimeType: file.type || getMimeTypeFromExt(ext),
            sourceBlockIndices: [1],
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
          // If text decoding fails on unknown binary, safely fallback to Data URL
          const dataUrl = await readFileAsDataUrl(file);
          const mimeType = file.type || getMimeTypeFromExt(ext);

          filesMap[cleanPath] = {
            path: cleanPath,
            content: dataUrl,
            dataUrl,
            language: ext,
            isBinary: true,
            mimeType,
            sourceBlockIndices: [1],
            isFromTree: false,
            isMissingContent: false,
            isDuplicate: false,
            hasTruncationWarning: false,
            truncationNotes: [],
            sizeBytes,
            lineCount: 1,
          };

          transcriptBlocks.push(`<!-- [Binary Asset] ${cleanPath} (${mimeType}, ${(sizeBytes / 1024).toFixed(1)} KB) -->`);
        }
      }
    } catch (err) {
      console.warn(`Could not read file ${cleanPath}:`, err);
    }
  }

  const filePaths = Object.keys(filesMap);
  const primaryFilePath = filePaths[0] || '';
  const treeDisplay = filePaths.map((p) => `├── ${p}`).join('\n');
  const transcript = `# ${inferredTitle}\n\n${treeDisplay}\n\n${transcriptBlocks.join('\n\n')}`;

  return {
    title: inferredTitle,
    files: filesMap,
    transcript,
    totalBytes,
    isSingleFile,
    primaryFilePath,
  };
}

export async function processSingleStandaloneFile(file: File): Promise<UploadedProjectData> {
  return processUploadedFiles([file]);
}
