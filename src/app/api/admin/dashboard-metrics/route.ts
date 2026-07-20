import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';

type CountsRow = {
  total_students: string;
  submitted_students: string;
  draft_only_students: string;
};

export async function GET() {
  try {
    await requireAdminSession();

    // "submitted" = at least one non-draft form row
    // "draft_only" = has at least one draft row AND no submitted row
    const { rows } = await query<CountsRow>(`
      WITH
        total AS (
          SELECT COUNT(*)::bigint AS total_students
          FROM students
        ),
        submitted AS (
          SELECT COUNT(DISTINCT student_id)::bigint AS submitted_students
          FROM student_application_forms
          WHERE status != 'draft'
        ),
        draft_only AS (
          SELECT COUNT(DISTINCT f.student_id)::bigint AS draft_only_students
          FROM student_application_forms f
          WHERE f.status = 'draft'
            AND NOT EXISTS (
              SELECT 1
              FROM student_application_forms s
              WHERE s.student_id = f.student_id AND s.status != 'draft'
            )
        )
      SELECT
        total.total_students::text,
        submitted.submitted_students::text,
        draft_only.draft_only_students::text
      FROM total, submitted, draft_only
    `);

    const totalStudents = Number(rows[0]?.total_students ?? 0);
    const submittedStudents = Number(rows[0]?.submitted_students ?? 0);
    const draftOnlyStudents = Number(rows[0]?.draft_only_students ?? 0);

    const notSubmitted = Math.max(0, totalStudents - submittedStudents);
    const notStarted = Math.max(0, totalStudents - submittedStudents - draftOnlyStudents);
    const completionRate = totalStudents ? Math.round((submittedStudents / totalStudents) * 100) : 0;

    return NextResponse.json(
      {
        totalStudents,
        finishedForms: submittedStudents,
        notSubmitted,
        partiallyFilled: draftOnlyStudents,
        notStarted,
        completionRate,
        asOf: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Dashboard metrics error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

