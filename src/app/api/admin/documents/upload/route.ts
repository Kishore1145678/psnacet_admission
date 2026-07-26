import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';

async function saveToUploadDirs(fileKey: string, buffer: Buffer) {
  const uploadDirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    '/home/jelastic/ROOT/public/uploads',
    '/home/jelastic/ROOT/.next/standalone/public/uploads',
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, fileKey), buffer);
    } catch {
      // ignore
    }
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    if (!studentIdParam) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
      return NextResponse.json({ error: 'File and category required' }, { status: 400 });
    }

    type StudentRow = { id: string };
    // Look up the student UUID using id OR application_number
    const { rows: studentRows } = await query<StudentRow>(
      `SELECT id FROM students WHERE id::text = $1::text OR application_number = $1 LIMIT 1`,
      [studentIdParam]
    );

    if (!studentRows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const actualStudentId = studentRows[0].id;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique file key
    const fileKey = `${actualStudentId}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')}`;

    // Save file to all upload directories
    await saveToUploadDirs(fileKey, buffer);

    // Store metadata in database
    await query(
      `INSERT INTO student_documents (student_id, document_category, file_name, file_key, file_size, file_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [actualStudentId, category, file.name, fileKey, file.size, file.type]
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
