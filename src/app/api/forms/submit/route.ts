import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import { encryptJson } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  const session = await requireStudentSession();

  try {
    const body = await req.json();
    const payload = body?.payload;
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'payload required' }, { status: 400 });
    }

    const encrypted = encryptJson(payload);

    await query(
      `INSERT INTO student_application_forms (student_id, encrypted_payload, status)
       VALUES ($1, $2::jsonb, 'submitted')`,
      [session.student_id, JSON.stringify(encrypted)]
    );

    await query(
      `UPDATE students SET is_locked = true, form_submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [session.student_id]
    );

    if (payload.student_blood_group) {
      await query(
        `UPDATE students SET blood_group = $2 WHERE id = $1`,
        [session.student_id, payload.student_blood_group]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('ENCRYPTION_KEY_BASE64')) {
      return NextResponse.json({ error: 'Server encryption key missing' }, { status: 500 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

