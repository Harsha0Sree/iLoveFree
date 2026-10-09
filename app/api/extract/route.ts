import { NextRequest, NextResponse } from 'next/server';
import { parseProjectFromText } from '@/lib/parser';

export const runtime = 'nodejs';

/**
 * Free Public API: Extract & Parse Project
 * POST /api/extract
 * 
 * Request body (JSON):
 * {
 *   "text": string,                    // Markdown transcript, AI tool call logs, diffs, etc.
 *   "options"?: {
 *     "stripCommonRoot"?: boolean,    // Strip shared top-level directory (default: true)
 *     "detectTruncations"?: boolean,  // Flag "// ... rest of code" markers (default: true)
 *     "cleanFirstLinePathComment"?: boolean, // Strip "// filename.ts" comment header (default: true)
 *     "duplicateResolution"?: "use_latest" | "use_first" | "append"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "stats": { ... },
 *   "files": {
 *     "path/to/file": {
 *       "path": string,
 *       "content": string,
 *       "language": string,
 *       "sizeBytes": number,
 *       "lineCount": number,
 *       "isMissingContent": boolean,
 *       "hasTruncationWarning": boolean
 *     }
 *   },
 *   "diagnostics": [ ... ],
 *   "treeDeclaredPaths": [ ... ],
 *   "rootFolderPrefix": string | null
 * }
 */
export async function POST(req: NextRequest) {
  try {
    let body: any;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = { text };
    }

    const rawText = body?.text || body?.transcript || body?.content || '';

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json(
        {
          error: 'Missing input text',
          message: 'Please provide a "text" string in the JSON body containing your markdown transcript, code blocks, or AI agent tool call logs.',
          example: {
            text: "# Project\n\n```typescript filename=\"src/index.ts\"\nconsole.log('hello world');\n```"
          }
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const options = {
      stripCommonRoot: body.options?.stripCommonRoot ?? true,
      detectTruncations: body.options?.detectTruncations ?? true,
      cleanFirstLinePathComment: body.options?.cleanFirstLinePathComment ?? true,
      duplicateResolution: body.options?.duplicateResolution || 'use_latest',
    };

    const parsed = parseProjectFromText(rawText, options);

    return NextResponse.json(
      {
        success: true,
        stats: parsed.stats,
        totalFiles: Object.keys(parsed.files).length,
        rootFolderPrefix: parsed.rootFolderPrefix,
        files: parsed.files,
        diagnostics: parsed.diagnostics,
        treeDeclaredPaths: parsed.treeDeclaredPaths,
      },
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error: any) {
    console.error('API /api/extract error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract project',
        message: error.message || 'Internal server error during parsing',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      name: 'RepoExtract Free Deterministic Parser API',
      version: '1.0.0',
      description: 'Zero LLM hallucination code extractor. Converts markdown transcripts, LLM agent tool calls, diffs, and trees into clean file trees.',
      endpoints: {
        'POST /api/extract': 'Parse markdown transcripts / AI logs into clean project files',
        'POST /api/format': 'Auto-format source code across all major languages',
        'POST /api/export-zip': 'Pack extracted files into a downloadable ZIP archive',
      },
      free: true,
      rateLimit: 'unlimited for fair use',
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
