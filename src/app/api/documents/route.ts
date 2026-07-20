import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireStudentSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    // ignore if already exists
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireStudentSession();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
      return NextResponse.json({ error: 'File and category required' }, { status: 400 });
    }

    await ensureUploadDir();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique file key
    const fileKey = `${session.student_id}_${Date.now()}_${file.name}`;
    const filePath = path.join(UPLOAD_DIR, fileKey);

    // Save file
    await fs.writeFile(filePath, buffer);

    // Store metadata in database
    await query(
      `INSERT INTO student_documents (student_id, document_category, file_name, file_key, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.student_id, category, file.name, fileKey, file.size, file.type]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully',
      file: { name: file.name, size: file.size, type: file.type }
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireStudentSession();
    
    const { rows } = await query(
      `SELECT id, document_category, file_name, file_size, file_type, file_key, uploaded_at 
       FROM student_documents WHERE student_id = $1 ORDER BY uploaded_at DESC`,
      [session.student_id]
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
    const session = await requireStudentSession();
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document id required' }, { status: 400 });
    }

    type DocRow = { file_key: string; student_id: string };
    const { rows } = await query<DocRow>(
      `SELECT file_key, student_id FROM student_documents WHERE id = $1`,
      [docId]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify ownership
    if (rows[0].student_id !== session.student_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
