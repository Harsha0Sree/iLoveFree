import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/src/lib/auth-helper';
import { getProjectById, updateProject, deleteProject } from '@/src/db/projects';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const project = await getProjectById(projectId, user.uid);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('GET /api/projects/[id] failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const updated = await updateProject(projectId, user.uid, body);
    if (!updated) {
      return NextResponse.json({ error: 'Project not found or not owned' }, { status: 404 });
    }

    return NextResponse.json({ project: updated });
  } catch (error: any) {
    console.error('PUT /api/projects/[id] failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const deleted = await deleteProject(projectId, user.uid);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found or not owned' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
