import { NextRequest, NextResponse } from 'next/server';
import { formatCode } from '@/lib/formatter';

export const runtime = 'nodejs';

/**
 * Free Public API: Multi-Language Code Formatter
 * POST /api/format
 * 
 * Request body (JSON):
 * {
 *   "code": string,           // Source code to format
 *   "language": string,       // Language: ts, js, python, html, css, json, sql, rust, go, c, cpp, java, etc.
 *   "tabSize"?: number        // Tab indent size (default: 2)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "formatted": string,
 *   "language": string,
 *   "lineCount": number
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body?.code ?? '';
    const language = body?.language || 'plaintext';
    const tabSize = Number(body?.tabSize) || 2;

    if (typeof code !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'The "code" field must be a string.',
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const formatted = formatCode(code, language, { tabSize });

    return NextResponse.json(
      {
        success: true,
        formatted,
        language,
        lineCount: formatted.split('\n').length,
      },
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error: any) {
    console.error('API /api/format error:', error);
    return NextResponse.json(
      {
        error: 'Formatting failed',
        message: error.message || 'Internal server error during formatting',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      name: 'RepoExtract Free Multi-Language Formatter API',
      description: 'Zero-dependency deterministic code formatting for JS, TS, Python, HTML, CSS, JSON, SQL, Rust, Go, C/C++, Java.',
      usage: 'POST /api/format with JSON: { "code": "...", "language": "python", "tabSize": 4 }',
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
