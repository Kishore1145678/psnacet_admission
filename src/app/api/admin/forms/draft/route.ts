import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const GET = async (req: Request) => {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    // Look up student by application_number or UUID
    let student_id = studentId;
    
    // Try to find by application_number first
    const appNumberResult = await query<{ id: string }>(
      `SELECT id FROM students WHERE application_number = $1`,
      [studentId]
    );
    
    if (appNumberResult.rows.length > 0) {
      student_id = appNumberResult.rows[0].id;
    }

    // Fetch draft forms
    const result = await query(
      `SELECT 
        id, 
        student_id, 
        encrypted_payload, 
        status,
        created_at, 
        updated_at 
       FROM student_application_forms 
       WHERE student_id = $1 AND status = 'draft'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [student_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ draft: null }, { status: 200 });
    }

    const draft = result.rows[0];
    return NextResponse.json({
      draft: {
        id: draft.id,
        studentId: draft.student_id,
        payload: draft.encrypted_payload,
        createdAt: draft.created_at,
        updatedAt: draft.updated_at
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
};
