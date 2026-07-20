import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';

/** Removes all students marked Complete (after admin has archived export). */
export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true) {
      return NextResponse.json({ error: 'confirm: true required' }, { status: 400 });
    }
    await query(`DELETE FROM student_application_forms`);
    await query(`DELETE FROM students`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
