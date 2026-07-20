import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
  try {
    await requireAdminSession();

    const { formId } = await req.json();
    if (!formId) {
      return NextResponse.json({ error: 'Missing formId' }, { status: 400 });
    }

    // Update form status from draft to submitted
    const result = await query(
      `UPDATE student_application_forms 
       SET status = 'submitted', updated_at = NOW()
       WHERE id = $1 AND status = 'draft'
       RETURNING student_id`,
      [formId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Draft form not found' }, { status: 404 });
    }

    const studentId = result.rows[0].student_id;

    // Lock the student record
    await query(
      `UPDATE students SET is_locked = true, updated_at = NOW() WHERE id = $1`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      message: 'Form promoted to completed successfully and student record locked',
      studentId
    }, { status: 200 });
  } catch (error) {
    console.error('Error promoting draft:', error);
    return NextResponse.json({ error: 'Failed to promote draft' }, { status: 500 });
  }
};
