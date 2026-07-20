import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    type StudentRow = { id: string };
    // First, look up the student UUID using application_number
    const { rows: studentRows } = await query<StudentRow>(
      `SELECT id FROM students WHERE application_number = $1`,
      [studentId]
    );

    if (!studentRows[0]) {
      return NextResponse.json({ documents: [] });
    }

    const actualStudentId = studentRows[0].id;

    type DocRow = {
      id: number;
      document_category: string;
      file_name: string;
      file_key: string;
      file_size: number;
      file_type: string;
      uploaded_at: string;
    };

    const { rows } = await query<DocRow>(
      `SELECT id, document_category, file_name, file_key, file_size, file_type, uploaded_at 
       FROM student_documents WHERE student_id = $1 ORDER BY document_category, uploaded_at DESC`,
      [actualStudentId]
    );

    return NextResponse.json({ documents: rows });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Fetch error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document id required' }, { status: 400 });
    }

    type DocRow = { file_key: string };
    const { rows } = await query<DocRow>(
      `SELECT file_key FROM student_documents WHERE id = $1`,
      [docId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file
    const filePath = path.join(UPLOAD_DIR, rows[0].file_key);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // File might already be deleted
    }

    // Delete from database
    await query(`DELETE FROM student_documents WHERE id = $1`, [docId]);

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Delete error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
