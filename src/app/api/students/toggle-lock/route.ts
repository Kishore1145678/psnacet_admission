import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { normalizeApplicationNumber } from '@/lib/student-password';

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const application_number = normalizeApplicationNumber(String(body.application_number ?? body.id ?? ''));
    const nextLockState = typeof body.lock === 'boolean' ? body.lock : null;
    if (!application_number) {
      return NextResponse.json({ error: 'application_number required' }, { status: 400 });
    }

    const { rows } = nextLockState === null
      ? await query<{ is_locked: boolean }>(
          `UPDATE students
           SET is_locked = NOT is_locked, updated_at = NOW()
           WHERE LOWER(application_number) = LOWER($1)
           RETURNING is_locked`,
          [application_number]
        )
      : await query<{ is_locked: boolean }>(
          `UPDATE students
           SET is_locked = $2, updated_at = NOW()
           WHERE LOWER(application_number) = LOWER($1)
           RETURNING is_locked`,
          [application_number, nextLockState]
        );

    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ is_locked: rows[0].is_locked });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const dbError = e as { code?: string; hint?: string };
    if (dbError?.code === '53100') {
      return NextResponse.json(
        {
          error: 'Database storage is full. Free disk space on the PostgreSQL host and try again.',
          hint: dbError.hint ?? null,
        },
        { status: 507 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
