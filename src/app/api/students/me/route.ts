import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';
import { pgDateToYmd } from '@/lib/student-password';

export async function GET() {
  const session = await requireStudentSession();

  // Track that the student opened the form after login.
  await query(
    `UPDATE students
     SET additional_info = COALESCE(additional_info, '{}'::jsonb) || jsonb_build_object('form_opened_at', NOW()::text),
         updated_at = NOW()
     WHERE id = $1`,
    [session.student_id]
  );

  const { rows } = await query<{
    application_number: string;
    institutional_id: string;
    full_name: string;
    date_of_birth: Date;
    academic_branch: string;
    father_name: string;
    mother_name: string;
    father_mobile_number: string;
    mobile_number: string;
    is_locked: boolean;
    access_expires_at: Date | null;
    form_submitted_at: Date | null;
  }>(
    `SELECT application_number, institutional_id, full_name, date_of_birth, academic_branch,
            father_name, mother_name, father_mobile_number, mobile_number, is_locked, access_expires_at, form_submitted_at
     FROM students
     WHERE id = $1`,
    [session.student_id]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r = rows[0];
  // Return snake_case fields (used directly by the user form).
  return NextResponse.json({
    application_number: r.application_number,
    institutional_id: r.institutional_id,
    full_name: r.full_name,
    date_of_birth: pgDateToYmd(r.date_of_birth), // YYYY-MM-DD
    academic_branch: r.academic_branch,
    father_name: r.father_name || '',
    mother_name: r.mother_name || '',
    father_mobile_number: r.father_mobile_number || '',
    mobile_number: r.mobile_number || '',
    is_locked: r.is_locked,
    access_expires_at: r.access_expires_at,
    form_submitted_at: r.form_submitted_at,
  });
}
