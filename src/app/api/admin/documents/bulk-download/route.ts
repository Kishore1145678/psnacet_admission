import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { decryptJson, EncryptedPayload } from '@/lib/crypto';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic';

async function findSourceFile(fileKey: string, fileName?: string): Promise<string | null> {
  const candidateDirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
    path.join(process.cwd(), '..', 'public', 'uploads'),
    '/home/jelastic/ROOT/public/uploads',
    '/home/jelastic/ROOT/.next/standalone/public/uploads',
    '/home/jelastic/ROOT/uploads',
  ];

  const cleanKey = path.basename(fileKey);
  const cleanName = fileName ? path.basename(fileName) : '';

  for (const dir of candidateDirs) {
    try {
      // 1. Direct path check
      const p1 = path.join(dir, fileKey);
      try {
        await fs.access(p1);
        return p1;
      } catch {}

      // 2. Clean key check
      const p2 = path.join(dir, cleanKey);
      try {
        await fs.access(p2);
        return p2;
      } catch {}

      // 3. Directory scan for matching file
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (
          f === fileKey ||
          f === cleanKey ||
          f.endsWith(cleanKey) ||
          (cleanKey.length > 5 && f.includes(cleanKey)) ||
          (cleanName.length > 5 && f.includes(cleanName))
        ) {
          return path.join(dir, f);
        }
      }
    } catch {
      // continue to next candidate dir
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

    type StudentRow = { id: string; application_number: string; full_name: string; academic_branch: string; encrypted_payload?: any };
    const { rows: studentRows } = await query<StudentRow>(
      `SELECT s.id, s.application_number, s.full_name, s.academic_branch, f.encrypted_payload 
       FROM students s 
       LEFT JOIN student_application_forms f ON f.student_id = s.id AND f.status = 'submitted'
       WHERE s.id::text = $1::text OR s.application_number = $1 
       LIMIT 1`,
      [studentIdParam]
    );

    if (!studentRows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentRows[0];
    const studentName = student.full_name || `Student_${studentIdParam}`;

    tempDir = path.join(tmpdir(), `student_${studentIdParam}_${Date.now()}`);
    const safeStudentName = studentName.replace(/[^a-zA-Z0-9 -]/g, '').trim().replace(/\s+/g, '_') || `Student_${studentIdParam}`;
    const studentFolder = path.join(tempDir, safeStudentName);
    await fs.mkdir(studentFolder, { recursive: true });

    // Decrypt form payload if available
    let formData: Record<string, any> = {};
    if (student.encrypted_payload) {
      try {
        if (student.encrypted_payload?.v === 1 && student.encrypted_payload?.alg) {
          formData = decryptJson(student.encrypted_payload as EncryptedPayload);
        } else {
          formData =
            typeof student.encrypted_payload === 'string'
              ? JSON.parse(student.encrypted_payload)
              : student.encrypted_payload;
        }
      } catch {
        formData = {};
      }
    }

    let extractedBase64Count = 0;

    // 1. Extract base64 files
    if (formData && typeof formData === 'object') {
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string' && value.startsWith('data:')) {
          const match = value.match(/^data:([a-zA-Z0-9\/\-]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            let ext = 'bin';
            if (mimeType.includes('pdf')) ext = 'pdf';
            else if (mimeType.includes('png')) ext = 'png';
            else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
            else if (mimeType.includes('word') || mimeType.includes('document')) ext = 'docx';

            let filename = 'Document';
            if (key === 'student_photo_base64') filename = 'Student_Photo';
            else filename = key.replace(/[^a-zA-Z0-9_\-]/g, '_');

            const imageBuffer = Buffer.from(base64Data, 'base64');
            try {
              await fs.writeFile(path.join(studentFolder, `${filename}.${ext}`), imageBuffer);
              extractedBase64Count++;
            } catch (err) {
              console.error(`Failed to save base64 doc ${key}:`, err);
            }
          }
        }
      }
    }

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
       WHERE student_id::text = $1::text 
          OR student_id::text = $2::text 
          OR file_key LIKE $1::text || '%' 
          OR file_key LIKE $2::text || '%'
       ORDER BY document_category, file_name`,
      [student.id, student.application_number]
    );

    let copiedDocCount = 0;

    // Copy files
    for (const doc of rows) {
      const sourcePath = await findSourceFile(doc.file_key, doc.file_name);
      if (sourcePath) {
        try {
          const safeCategory = doc.document_category.replace(/[/\\?%*:|"<>]/g, '-');
          const safeFileName = doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_');
          const uniqueFileName = `${safeCategory}_${safeFileName}`;
          await fs.copyFile(sourcePath, path.join(studentFolder, uniqueFileName));
          copiedDocCount++;
        } catch (e) {
          console.error(`Failed to copy file: ${doc.file_key}`);
        }
      }
    }

    // Generate student summary txt
    const summaryText = [
      '==================================================',
      'PSNA COLLEGE OF ENGINEERING & TECHNOLOGY',
      'STUDENT CERTIFICATE & ADMISSION RECORD',
      '==================================================',
      `Student Name       : ${student.full_name}`,
      `Application Number : ${student.application_number}`,
      `Academic Branch    : ${student.academic_branch || 'Not Specified'}`,
      `Base64 Files Found : ${extractedBase64Count}`,
      `Disk Files Copied  : ${copiedDocCount} of ${rows.length} database record(s)`,
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
