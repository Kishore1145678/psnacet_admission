import { requireStudentSession } from '@/lib/session';
import { query } from '@/lib/db';
import { encryptJson } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = async (req: Request) => {
  try {
    const session = await requireStudentSession();

    const { payload } = await req.json();
    if (!payload) {
      return Response.json({ error: 'Missing payload' }, { status: 400 });
    }

    const encrypted = encryptJson(payload);
    const payloadText = JSON.stringify(encrypted);

    // Keep only one active draft per student by updating latest draft if present.
    const existingDraft = await query<{ id: string }>(
      `SELECT id
       FROM student_application_forms
       WHERE student_id = $1 AND status = 'draft'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [session.student_id]
    );

    const result = existingDraft.rows[0]
      ? await query(
          `UPDATE student_application_forms
           SET encrypted_payload = $2::jsonb, updated_at = NOW()
           WHERE id = $1
           RETURNING id, created_at`,
          [existingDraft.rows[0].id, payloadText]
        )
      : await query(
          `INSERT INTO student_application_forms (student_id, encrypted_payload, status)
           VALUES ($1, $2::jsonb, 'draft')
           RETURNING id, created_at`,
          [session.student_id, payloadText]
        );

    // Update the students table with the blood_group if provided
    if (payload.student_blood_group) {
      await query(
        `UPDATE students SET blood_group = $2 WHERE id = $1`,
        [session.student_id, payload.student_blood_group]
      );
    }

    return Response.json({
      success: true,
      id: result.rows[0].id,
      message: 'Draft saved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error saving draft:', error);
    return Response.json({ error: 'Failed to save draft' }, { status: 500 });
  }
};
