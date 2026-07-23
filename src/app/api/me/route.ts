import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  if (session.kind === 'admin') {
    if (session.admin_username?.toLowerCase() === 'ram') {
      return NextResponse.json({ role: null }, { status: 401 });
    }
    return NextResponse.json({
      role: 'admin',
      username: session.admin_username,
    });
  }

  const { rows } = await query<{
    application_number: string;
    full_name: string;
    institutional_id: string;
  }>(
    'SELECT application_number, full_name, institutional_id FROM students WHERE id = $1',
    [session.student_id]
  );

  if (!rows[0]) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  return NextResponse.json({
    role: 'student',
    student: {
      name: rows[0].full_name,
      applicationNumber: rows[0].application_number,
      institutionalId: rows[0].institutional_id,
    },
  });
}
