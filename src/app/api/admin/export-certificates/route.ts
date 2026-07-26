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
  } catch (e) {
    // Ignore if already exists
  }
}

async function handleCertificatesExport(req: Request) {
  let tempDir: string | null = null;
  let tempZipPath: string | null = null;

  try {
    await requireAdminSession();

    // 1. Fetch all completed/submitted students
    const { rows: completedStudents } = await query<{
      id: string;
      application_number: string;
      full_name: string;
      academic_branch: string;
    }>(
      `SELECT id, application_number, full_name, academic_branch 
       FROM students 
       WHERE completion_status = 'Complete' OR is_locked = TRUE OR status = 'Approved' OR form_submitted_at IS NOT NULL
       ORDER BY application_number ASC`
    );

    if (completedStudents.length === 0) {
      return NextResponse.json(
        { error: 'No completed student records found to export certificates.' },
        { status: 404 }
      );
    }

    // Create temporary folder structure for zipping
    tempDir = path.join(tmpdir(), `all_certificates_${Date.now()}`);
    await ensureDir(tempDir);

    let totalExportedStudents = 0;
    let totalExportedFiles = 0;

    for (const student of completedStudents) {
      const cleanName = student.full_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'Student';
      const cleanAppNum = student.application_number.replace(/[^a-zA-Z0-9_\-]/g, '');
      const folderName = `${cleanName}_${cleanAppNum}`;
      const studentFolder = path.join(tempDir, folderName);

      const { rows: docs } = await query<{
        document_category: string;
        file_name: string;
        file_key: string;
      }>(
        `SELECT document_category, file_name, file_key FROM student_documents WHERE student_id::text = $1::text`,
        [student.id]
      );

      if (docs.length > 0) {
        await ensureDir(studentFolder);
        totalExportedStudents++;

        for (const doc of docs) {
          const primarySource = path.join(process.cwd(), 'public', 'uploads', doc.file_key);
          const standaloneSource = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', doc.file_key);

          let sourceFile: string | null = null;
          try {
            await fs.access(primarySource);
            sourceFile = primarySource;
          } catch {
            try {
              await fs.access(standaloneSource);
              sourceFile = standaloneSource;
            } catch {
              sourceFile = null;
            }
          }

          if (sourceFile) {
            const destFilename = `${doc.document_category.replace(/[/\\?%*:|"<>]/g, '_')}_${doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_')}`;
            const destPath = path.join(studentFolder, destFilename);
            try {
              await fs.copyFile(sourceFile, destPath);
              totalExportedFiles++;
            } catch (err) {
              console.error(`Failed to copy file for ${student.full_name}:`, err);
            }
          }
        }
      }
    }

    if (totalExportedFiles === 0) {
      return NextResponse.json(
        { error: 'No certificate document files found to export.' },
        { status: 404 }
      );
    }

    // 2. Save a copy to admin_settings excel_export_path if configured
    try {
      const { rows: settingsRows } = await query<{ value: string }>(
        `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
      );
      const baseExportPath = settingsRows[0]?.value?.trim();
      if (baseExportPath) {
        const certificatesExportDir = path.join(baseExportPath, 'Student_Certificates');
        await ensureDir(certificatesExportDir);
        // Copy directory contents to server export path
        for (const student of completedStudents) {
          const cleanName = student.full_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'Student';
          const cleanAppNum = student.application_number.replace(/[^a-zA-Z0-9_\-]/g, '');
          const folderName = `${cleanName}_${cleanAppNum}`;
          const srcFolder = path.join(tempDir, folderName);
          const dstFolder = path.join(certificatesExportDir, folderName);
          try {
            await fs.cp(srcFolder, dstFolder, { recursive: true });
          } catch (e) {
            // ignore server path copy errors
          }
        }
      }
    } catch (e) {
      console.warn('Server export copy error:', e);
    }

    // 3. Compress into ZIP archive for direct browser download
    tempZipPath = path.join(tmpdir(), `all_student_certificates_${Date.now()}.zip`);
    const zipCommand = process.platform === 'win32'
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
    return NextResponse.json({ error: 'Failed to export certificates: ' + (e instanceof Error ? e.message : 'Unknown error') }, { status: 500 });
  } finally {
    // Cleanup temporary files
    try {
      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
      if (tempZipPath) await fs.rm(tempZipPath, { force: true });
    } catch {
      // ignore
    }
  }
}

export async function GET(req: Request) {
  return handleCertificatesExport(req);
}

export async function POST(req: Request) {
  return handleCertificatesExport(req);
}
