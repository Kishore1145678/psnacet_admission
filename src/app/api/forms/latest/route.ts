import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import { decryptJson, type EncryptedPayload } from '@/lib/crypto';

export async function GET() {
  const session = await requireStudentSession();

  try {
    const { rows } = await query<{ encrypted_payload: EncryptedPayload; status: string; updated_at: string }>(
      `SELECT encrypted_payload, status, updated_at
       FROM student_application_forms
       WHERE student_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [session.student_id]
    );

    if (!rows[0]) {
      return NextResponse.json({ payload: null });
    }

    let payload: Record<string, any> | null = null;
    const rawPayload = rows[0].encrypted_payload as any;
    if (rawPayload && typeof rawPayload === 'object' && rawPayload.v === 1 && rawPayload.alg) {
      payload = decryptJson(rows[0].encrypted_payload);
    } else {
      payload = rawPayload;
    }

    return NextResponse.json({
      payload,
      status: rows[0].status,
      updatedAt: rows[0].updated_at,
    });
  } catch (e) {
    console.error('Error loading latest student form:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
