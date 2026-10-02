import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin.ts';

export async function verifyUserToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error('Failed to verify ID token:', error);
    return null;
  }
}
