import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import { decryptJson, EncryptedPayload } from '@/lib/crypto';
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
      // continue to next dir
    }
  }

  return null;
}

async function handleCertificatesExport() {
  let tempDir: string | null = null;
  let tempZipPath: string | null = null;

  try {
    await requireAdminSession();

    // 1. Fetch all students with optional form payload data
    const { rows: allStudents } = await query<{
      id: string;
      application_number: string;
      institutional_id: string;
      full_name: string;
      academic_branch: string;
      completion_status: string;
      status: string;
      encrypted_payload?: any;
    }>(
      `SELECT s.id, s.application_number, s.institutional_id, s.full_name, s.academic_branch, 
              s.completion_status, s.status, f.encrypted_payload
       FROM students s
       LEFT JOIN student_application_forms f ON f.student_id = s.id AND f.status = 'submitted'
       ORDER BY s.application_number ASC`
    );

    tempDir = path.join(tmpdir(), `all_certificates_${Date.now()}`);
    await ensureDir(tempDir);

    if (allStudents.length === 0) {
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

        // 1. Extract any base64 files (student photo, documents, certificates) in formData payload
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

        // 2. Fetch all document records from student_documents table
        const { rows: docs } = await query<{
          id: number;
          document_category: string;
          file_name: string;
          file_key: string;
          uploaded_at: string;
        }>(
          `SELECT id, document_category, file_name, file_key, uploaded_at 
           FROM student_documents 
           WHERE student_id::text = $1::text 
              OR student_id::text = $2::text 
              OR file_key LIKE $1::text || '%' 
              OR file_key LIKE $2::text || '%'
           ORDER BY document_category ASC, id ASC`,
          [student.id, student.application_number]
        );

        let copiedDocCount = 0;

        // Copy certificate files from upload candidate directories
        for (const doc of docs) {
          const sourcePath = await findSourceFile(doc.file_key, doc.file_name);
          if (sourcePath) {
            const safeCategory = doc.document_category.replace(/[/\\?%*:|"<>]/g, '_');
            const safeFileName = doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_');
            const destFilename = `${safeCategory}_${safeFileName}`;
            const destPath = path.join(studentFolder, destFilename);
            try {
              await fs.copyFile(sourcePath, destPath);
              copiedDocCount++;
            } catch (err) {
              console.error(`Failed to copy file for ${student.full_name}:`, err);
            }
          }
        }

        // 3. Generate comprehensive student summary details file
        const summaryLines = [
          '==================================================',
          'PSNA COLLEGE OF ENGINEERING & TECHNOLOGY',
          'STUDENT CERTIFICATE & ADMISSION RECORD',
          '==================================================',
          `Student Name       : ${student.full_name}`,
          `Application Number : ${student.application_number}`,
          `Institutional ID   : ${student.institutional_id || 'Pending'}`,
          `Academic Branch    : ${student.academic_branch || 'Not Specified'}`,
          `Form Status        : ${student.completion_status || 'Pending'}`,
          `Base64 Files Found : ${extractedBase64Count}`,
          `Disk Files Copied  : ${copiedDocCount} of ${docs.length} database record(s)`,
          '==================================================',
          '',
          'DATABASE DOCUMENT RECORDS:',
          ...(docs.length > 0
            ? docs.map(
                (d, idx) =>
                  `${idx + 1}. [${d.document_category}] ${d.file_name} (FileKey: ${d.file_key})`
              )
            : ['No document records registered in database for this student.']),
        ];

        await fs.writeFile(path.join(studentFolder, 'student_summary.txt'), summaryLines.join('\n'));
      }
    }

    // Also copy to admin_settings excel_export_path if configured
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

    // Compress folder into ZIP file for direct browser download
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
