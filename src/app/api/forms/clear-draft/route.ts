import { requireStudentSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await requireStudentSession();
    
    // Delete any active draft row(s) for the current student
    await query(
      `DELETE FROM student_application_forms 
       WHERE student_id = $1 AND status = 'draft'`,
      [session.student_id]
    );

    return NextResponse.json({ success: true, message: 'Draft cleared successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error clearing draft:', error);
    return NextResponse.json({ error: 'Failed to clear draft' }, { status: 500 });
  }
}
