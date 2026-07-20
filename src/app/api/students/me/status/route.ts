import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStudentSession } from '@/lib/session';

export async function GET() {
  const session = await requireStudentSession();

  try {
    const { rows } = await query<{
      is_locked: boolean;
      access_expires_at: Date | null;
      form_submitted_at: Date | null;
    }>(
      `SELECT is_locked, access_expires_at, form_submitted_at FROM students WHERE id = $1`,
      [session.student_id]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = rows[0];
    let accessStatus = 'active';
    let message = '';

    if (student.is_locked) {
      accessStatus = 'locked';
      message = 'Your application has been submitted and is under review. Your account is locked. The admin will unlock it if changes are needed.';
    } else if (student.access_expires_at) {
      const expiresAt = new Date(student.access_expires_at);
      if (new Date() > expiresAt) {
        accessStatus = 'access_expired';
        message = 'Your access period has expired. Please contact the admin to extend your access.';
      } else {
        const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        message = `Access expires in ${daysLeft} day(s).`;
      }
    }

    return NextResponse.json({
      status: accessStatus,
      message,
      isLocked: student.is_locked,
      formSubmitted: !!student.form_submitted_at,
      accessExpiresAt: student.access_expires_at,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
