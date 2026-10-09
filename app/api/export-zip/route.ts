import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const runtime = 'nodejs';

/**
 * Free Public API: Deterministic ZIP Bundler
 * POST /api/export-zip
 * 
 * Request body (JSON):
 * {
 *   "projectName"?: string,
 *   "files": {
 *     "path/to/file.ts": "file content here",
 *     "README.md": "# Readme content"
 *   },
 *   "includeAuditReport"?: boolean
 * }
 * 
 * Response: binary application/zip stream with Content-Disposition attachment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const files = body?.files;
    const rawProjectName = (body?.projectName || 'my-project').toString();
    const cleanProjectName = rawProjectName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'my-project';

    if (!files || typeof files !== 'object' || Array.isArray(files)) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'The "files" field must be an object mapping relative file paths to their string contents.',
          example: {
            projectName: 'my-project',
            files: {
              'src/index.ts': "console.log('hello');",
              'package.json': '{\\n  "name": "my-project"\\n}'
            }
          }
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const zip = new JSZip();
    let count = 0;

    for (const [path, content] of Object.entries(files)) {
      if (!path || typeof path !== 'string') continue;
      const fileData = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      zip.file(path, fileData);
      count++;
    }

    if (body.includeAuditReport) {
      zip.file(
        'AUDIT_REPORT.md',
        `# Project Export Audit Report\n\n- **Project Name:** ${cleanProjectName}\n- **Total Files Packaged:** ${count}\n- **Generator:** RepoExtract Free API\n- **Timestamp:** ${new Date().toISOString()}\n`
      );
    }

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${cleanProjectName}.zip"`,
        'X-Packaged-Files-Count': String(count),
        ...corsHeaders(),
      },
    });
  } catch (error: any) {
    console.error('API /api/export-zip error:', error);
    return NextResponse.json(
      {
        error: 'Export failed',
        message: error.message || 'Internal server error during zip bundling',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      name: 'RepoExtract Free ZIP Bundler API',
      description: 'Generates standard ZIP archives from files object map.',
      usage: 'POST /api/export-zip with { "projectName": "name", "files": { "path": "content" } }',
      free: true,
    },
    { headers: corsHeaders() }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
