import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic';

async function findSourceFile(fileKey: string): Promise<string | null> {
  const candidateDirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    '/home/jelastic/ROOT/public/uploads',
    '/home/jelastic/ROOT/.next/standalone/public/uploads',
  ];

  for (const dir of candidateDirs) {
    const filePath = path.join(dir, fileKey);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // check next candidate dir
    }
  }

  return null;
}

export async function GET(req: Request) {
  let tempDir: string | null = null;
  let tempZipPath: string | null = null;
  
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    if (!studentIdParam) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    type StudentRow = { id: string; application_number: string; full_name: string; academic_branch: string };
    const { rows: studentRows } = await query<StudentRow>(
      `SELECT id, application_number, full_name, academic_branch FROM students WHERE id::text = $1::text OR application_number = $1 LIMIT 1`,
      [studentIdParam]
    );

    if (!studentRows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentRows[0];
    const studentName = student.full_name || `Student_${studentIdParam}`;

    type DocRow = {
      id: number;
      file_name: string;
      file_key: string;
      document_category: string;
      uploaded_at: string;
    };

    const { rows } = await query<DocRow>(
      `SELECT id, file_name, file_key, document_category, uploaded_at 
       FROM student_documents 
       WHERE student_id::text = $1::text OR student_id::text = $2::text 
       ORDER BY document_category, file_name`,
      [student.id, student.application_number]
    );

    tempDir = path.join(tmpdir(), `student_${studentIdParam}_${Date.now()}`);
    const safeStudentName = studentName.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_') || `Student_${studentIdParam}`;
    const studentFolder = path.join(tempDir, safeStudentName);
    await fs.mkdir(studentFolder, { recursive: true });

    // Generate student summary txt
    const summaryText = [
      '==================================================',
      'PSNA COLLEGE OF ENGINEERING & TECHNOLOGY',
      'STUDENT CERTIFICATE & ADMISSION RECORD',
      '==================================================',
      `Student Name       : ${student.full_name}`,
      `Application Number : ${student.application_number}`,
      `Academic Branch    : ${student.academic_branch || 'Not Specified'}`,
      `Uploaded Documents : ${rows.length} file(s)`,
      '==================================================',
      '',
      'DOCUMENT LIST:',
      ...(rows.length > 0
        ? rows.map(
            (d, idx) =>
              `${idx + 1}. [${d.document_category}] ${d.file_name} (Uploaded: ${new Date(d.uploaded_at).toLocaleString()})`
          )
        : ['No uploaded documents found for this student.']),
    ].join('\n');

    await fs.writeFile(path.join(studentFolder, 'student_summary.txt'), summaryText);

    // Copy files
    for (const doc of rows) {
      const sourcePath = await findSourceFile(doc.file_key);
      if (sourcePath) {
        try {
          const safeCategory = doc.document_category.replace(/[/\\?%*:|"<>]/g, '-');
          const safeFileName = doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_');
          const uniqueFileName = `${safeCategory}_${safeFileName}`;
          await fs.copyFile(sourcePath, path.join(studentFolder, uniqueFileName));
        } catch (e) {
          console.error(`Failed to copy file: ${doc.file_key}`);
        }
      }
    }

    tempZipPath = path.join(tmpdir(), `student_${studentIdParam}_documents_${Date.now()}.zip`);
    const zipCommand = process.platform === 'win32'
      ? `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${tempZipPath}' -Force"`
      : `cd '${tempDir}' && zip -r '${tempZipPath}' .`;

    await execAsync(zipCommand);
    const fileBuffer = await fs.readFile(tempZipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="student_${student.application_number}_documents.zip"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Bulk download error:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : 'Unknown error') }, { status: 500 });
  } finally {
    try {
      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
      if (tempZipPath) await fs.rm(tempZipPath, { force: true });
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}
