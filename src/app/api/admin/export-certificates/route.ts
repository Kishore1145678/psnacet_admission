import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic';

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {
    // Ignore if directory exists
  }
}

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

async function handleCertificatesExport() {
  let tempDir: string | null = null;
  let tempZipPath: string | null = null;

  try {
    await requireAdminSession();

    // 1. Fetch all students from database
    const { rows: allStudents } = await query<{
      id: string;
      application_number: string;
      full_name: string;
      academic_branch: string;
      completion_status: string;
      status: string;
    }>(
      `SELECT id, application_number, full_name, academic_branch, completion_status, status 
       FROM students 
       ORDER BY application_number ASC`
    );

    tempDir = path.join(tmpdir(), `all_certificates_${Date.now()}`);
    await ensureDir(tempDir);

    if (allStudents.length === 0) {
      // Create empty notice text file if no students in DB yet
      const noticePath = path.join(tempDir, 'NO_STUDENTS_FOUND.txt');
      await fs.writeFile(
        noticePath,
        'No student records currently exist in the database.'
      );
    } else {
      for (const student of allStudents) {
        const cleanName =
          student.full_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'Student';
        const cleanAppNum = student.application_number.replace(/[^a-zA-Z0-9_\-]/g, '');
        const folderName = `${cleanName}_${cleanAppNum}`;
        const studentFolder = path.join(tempDir, folderName);
        await ensureDir(studentFolder);

        // Fetch all documents matching student UUID or application_number
        const { rows: docs } = await query<{
          id: number;
          document_category: string;
          file_name: string;
          file_key: string;
          uploaded_at: string;
        }>(
          `SELECT id, document_category, file_name, file_key, uploaded_at 
           FROM student_documents 
           WHERE student_id::text = $1::text OR student_id::text = $2::text 
           ORDER BY document_category ASC, id ASC`,
          [student.id, student.application_number]
        );

        // Create student summary info file inside their folder
        const summaryText = [
          '==================================================',
          'PSNA COLLEGE OF ENGINEERING & TECHNOLOGY',
          'STUDENT CERTIFICATE & ADMISSION RECORD',
          '==================================================',
          `Student Name       : ${student.full_name}`,
          `Application Number : ${student.application_number}`,
          `Academic Branch    : ${student.academic_branch || 'Not Specified'}`,
          `Form Status        : ${student.completion_status || 'Pending'}`,
          `Uploaded Documents : ${docs.length} file(s)`,
          '==================================================',
          '',
          'DOCUMENT LIST:',
          ...(docs.length > 0
            ? docs.map(
                (d, idx) =>
                  `${idx + 1}. [${d.document_category}] ${d.file_name} (Uploaded: ${new Date(d.uploaded_at).toLocaleString()})`
              )
            : ['No uploaded documents found for this student.']),
        ].join('\n');

        await fs.writeFile(path.join(studentFolder, 'student_summary.txt'), summaryText);

        // Copy all uploaded document files into student folder
        for (const doc of docs) {
          const sourcePath = await findSourceFile(doc.file_key);
          if (sourcePath) {
            const safeCategory = doc.document_category.replace(/[/\\?%*:|"<>]/g, '_');
            const safeFileName = doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_');
            const destFilename = `${safeCategory}_${safeFileName}`;
            const destPath = path.join(studentFolder, destFilename);
            try {
              await fs.copyFile(sourcePath, destPath);
            } catch (err) {
              console.error(`Failed to copy file for ${student.full_name}:`, err);
            }
          }
        }
      }
    }

    // 2. Also copy to admin_settings excel_export_path if set
    try {
      const { rows: settingsRows } = await query<{ value: string }>(
        `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
      );
      const baseExportPath = settingsRows[0]?.value?.trim();
      if (baseExportPath) {
        const certificatesExportDir = path.join(baseExportPath, 'Student_Certificates');
        await ensureDir(certificatesExportDir);
        await fs.cp(tempDir, certificatesExportDir, { recursive: true });
      }
    } catch (e) {
      console.warn('Server export path copy warning:', e);
    }

    // 3. Compress folder into ZIP file for direct browser download
    tempZipPath = path.join(tmpdir(), `all_student_certificates_${Date.now()}.zip`);
    const zipCommand =
      process.platform === 'win32'
        ? `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${tempZipPath}' -Force"`
        : `cd '${tempDir}' && zip -r '${tempZipPath}' .`;

    await execAsync(zipCommand);
    const fileBuffer = await fs.readFile(tempZipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="all_student_certificates.zip"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Export certificates error:', e);
    return NextResponse.json(
      { error: 'Failed to export certificates: ' + (e instanceof Error ? e.message : 'Unknown error') },
      { status: 500 }
    );
  } finally {
    // Cleanup temporary files
    try {
      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
      if (tempZipPath) await fs.rm(tempZipPath, { force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

export async function GET(req: Request) {
  return handleCertificatesExport();
}

export async function POST(req: Request) {
  return handleCertificatesExport();
}
