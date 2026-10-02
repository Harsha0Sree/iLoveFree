import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/src/lib/auth-helper.ts';
import { getUserProjects, createProject } from '@/src/db/projects.ts';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectsList = await getUserProjects(user.uid);
    return NextResponse.json({ projects: projectsList });
  } catch (error: any) {
    console.error('GET /api/projects failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.rawTranscript) {
      return NextResponse.json({ error: 'Missing title or rawTranscript' }, { status: 400 });
    }

    const newProject = await createProject({
      userId: user.uid,
      title: body.title,
      description: body.description,
      rawTranscript: body.rawTranscript,
      parsedFiles: body.parsedFiles || {},
      stats: body.stats || {
        fileCount: Object.keys(body.parsedFiles || {}).length,
        totalBytes: 0,
        totalBlocks: 0,
        lineCount: 0,
      },
      thumbnailGradient: body.thumbnailGradient,
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/projects failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
