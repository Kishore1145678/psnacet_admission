import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { decryptJson, type EncryptedPayload } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const url = new URL(req.url);
    const applicationNumber = String(url.searchParams.get('applicationNumber') || '').trim();
    if (!applicationNumber) {
      return NextResponse.json({ error: 'applicationNumber is required' }, { status: 400 });
    }

    const { rows } = await query<{ encrypted_payload: EncryptedPayload; created_at: string; status: string }>(
      `SELECT saf.encrypted_payload, saf.created_at, saf.status
       FROM student_application_forms saf
       JOIN students s ON s.id = saf.student_id
       WHERE LOWER(s.application_number) = LOWER($1)
       ORDER BY saf.updated_at DESC, saf.created_at DESC
       LIMIT 1`,
      [applicationNumber]
    );

    if (!rows[0]) {
      return NextResponse.json({ payload: null });
    }

    let payload = rows[0].encrypted_payload;
    
    // Check if payload is encrypted (has v, alg, iv, tag, data structure)
    if (payload && typeof payload === 'object' && 'v' in payload && payload.v === 1) {
      try {
        payload = decryptJson(rows[0].encrypted_payload);
      } catch (e) {
        console.error('Decryption error:', e);
        return NextResponse.json({ error: 'Failed to decrypt form data' }, { status: 500 });
      }
    } else {
      // Payload is plain JSON (for backward compatibility)
      payload = rows[0].encrypted_payload;
    }

    return NextResponse.json({
      payload,
      submittedAt: rows[0].created_at,
      status: rows[0].status,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

