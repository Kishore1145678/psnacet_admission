import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(req: Request) {
  const kind = req.headers.get('x-session-kind');
  if (kind === 'admin' || kind === 'student') {
    await destroySession(kind);
  } else {
    await destroySession('all');
  }
  return NextResponse.json({ ok: true });
}
