import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, requireStudentSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey required' }, { status: 400 });
    }

    // Try to authenticate as either admin or student
    let session;
    try {
      session = await requireAdminSession();
    } catch {
      try {
        session = await requireStudentSession();
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    type DocRow = { student_id: string; file_name: string };
    const { rows } = await query<DocRow>(
      `SELECT student_id, file_name FROM student_documents WHERE file_key = $1`,
      [fileKey]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access: student can only download their own, admin can download any
    if ((session as any).kind === 'student' && rows[0].student_id !== (session as any).student_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const filePath = path.join(UPLOAD_DIR, fileKey);
    try {
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Disposition': `attachment; filename="${rows[0].file_name}"`,
          'Content-Type': 'application/octet-stream',
        },
      });
    } catch (e) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Download error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
