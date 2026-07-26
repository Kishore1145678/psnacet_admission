import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e) {
    // Ignore if already exists
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    let reqBody: { studentId?: string; applicationNumber?: string; force?: boolean } = {};
    try {
      reqBody = await req.json();
    } catch {
      reqBody = {};
    }

    // 1. Fetch export directory path from admin_settings
    const { rows: settingsRows } = await query<{ value: string }>(
      `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
    );

    const baseExportPath = settingsRows[0]?.value?.trim();
    if (!baseExportPath) {
      return NextResponse.json(
        { error: 'Please set the Export Directory Path in Account Settings first.' },
        { status: 400 }
      );
    }

    const certificatesExportDir = path.join(baseExportPath, 'Student_Certificates');
    await ensureDir(certificatesExportDir);

    // Single student export case
    if (reqBody.studentId || reqBody.applicationNumber) {
      const targetId = reqBody.studentId || reqBody.applicationNumber;
      
      const { rows: studentRows } = await query<{
        id: string;
        application_number: string;
        full_name: string;
      }>(
        `SELECT id, application_number, full_name 
         FROM students 
         WHERE id = $1 OR application_number = $1 LIMIT 1`,
        [targetId]
      );

      const student = studentRows[0];
      if (!student) {
        return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
      }

      const cleanName = student.full_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      const cleanAppNum = student.application_number.replace(/[^a-zA-Z0-9_\-]/g, '');
      const folderName = `${cleanName}_${cleanAppNum}`;
      const studentFolder = path.join(certificatesExportDir, folderName);

      // Check if student folder already exists and has files
      if (!reqBody.force) {
        try {
          const filesInDir = await fs.readdir(studentFolder);
          if (filesInDir.length > 0) {
            return NextResponse.json(
              {
                alreadyExists: true,
                message: 'Already exists in your folder',
                folderPath: studentFolder
              },
              { status: 409 }
            );
          }
        } catch {
          // Directory does not exist yet, proceed with creation
        }
      }

      const { rows: docs } = await query<{
        document_category: string;
        file_name: string;
        file_key: string;
      }>(
        `SELECT document_category, file_name, file_key FROM student_documents WHERE student_id = $1`,
        [student.id]
      );

      if (docs.length === 0) {
        return NextResponse.json(
          { error: 'No documents uploaded for this student yet.' },
          { status: 400 }
        );
      }

      await ensureDir(studentFolder);
      let copiedCount = 0;

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
          const destFilename = `${doc.document_category}_${doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_')}`;
          const destPath = path.join(studentFolder, destFilename);
          try {
            await fs.copyFile(sourceFile, destPath);
            copiedCount++;
          } catch (err) {
            console.error(`Failed to copy file for ${student.full_name}:`, err);
          }
        }
      }

      return NextResponse.json({
        success: true,
        copiedFiles: copiedCount,
        folderPath: studentFolder,
        message: `✅ Documents for ${student.full_name} (${copiedCount} files) saved successfully to: ${studentFolder}`
      });
    }

    // Bulk export case (all completed students)
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
        { message: 'No completed student records found to export certificates.' },
        { status: 200 }
      );
    }

    let totalExportedStudents = 0;
    let totalExportedFiles = 0;

    for (const student of completedStudents) {
      const cleanName = student.full_name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
      const cleanAppNum = student.application_number.replace(/[^a-zA-Z0-9_\-]/g, '');
      const folderName = `${cleanName}_${cleanAppNum}`;
      const studentFolder = path.join(certificatesExportDir, folderName);

      const { rows: docs } = await query<{
        document_category: string;
        file_name: string;
        file_key: string;
      }>(
        `SELECT document_category, file_name, file_key FROM student_documents WHERE student_id = $1`,
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
            const destFilename = `${doc.document_category}_${doc.file_name.replace(/[^a-zA-Z0-9._\-]/g, '_')}`;
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

    return NextResponse.json({
      success: true,
      exportedStudents: totalExportedStudents,
      exportedFiles: totalExportedFiles,
      exportPath: certificatesExportDir,
      message: `✅ Successfully saved certificates for ${totalExportedStudents} students (${totalExportedFiles} files) into: ${certificatesExportDir}`
    });

  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Export certificates error:', e);
    return NextResponse.json({ error: 'Failed to export certificates: ' + (e instanceof Error ? e.message : 'Unknown error') }, { status: 500 });
  }
}
