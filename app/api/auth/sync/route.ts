import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/src/lib/auth-helper';
import { getOrCreateUser } from '@/src/db/projects';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyUserToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const synced = await getOrCreateUser(
      user.uid,
      user.email || body.email || 'user@example.com',
      user.name || body.displayName || null,
      user.picture || body.photoURL || null
    );

    return NextResponse.json({ user: synced });
  } catch (error: any) {
    console.error('Auth sync route failed:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
