import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(req: Request) {
  let tempZipPath: string | null = null;
  
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    type StudentRow = { id: string, full_name: string };
    // First, look up the student UUID using application_number
    const { rows: studentRows } = await query<StudentRow>(
      `SELECT id, full_name FROM students WHERE application_number = $1`,
      [studentId]
    );

    if (!studentRows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const actualStudentId = studentRows[0].id;
    const studentName = studentRows[0].full_name || `Student_${studentId}`;

    type DocRow = {
      id: number;
      file_name: string;
      file_key: string;
      document_category: string;
    };

    const { rows } = await query<DocRow>(
      `SELECT id, file_name, file_key, document_category FROM student_documents WHERE student_id = $1 ORDER BY document_category, file_name`,
      [actualStudentId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Create a temporary directory for organizing files
    const tempDir = path.join(tmpdir(), `student_${studentId}_${Date.now()}`);
    
    // Create a subfolder with the student's name
    const safeStudentName = studentName.replace(/[^a-zA-Z0-9 -]/g, '').trim() || `Student_${studentId}`;
    const studentFolder = path.join(tempDir, safeStudentName);
    
    await fs.mkdir(studentFolder, { recursive: true });

    try {
      // Copy files to organized folder structure
      for (const doc of rows) {
        const filePath = path.join(UPLOAD_DIR, doc.file_key);
        
        try {
          const safeCategory = doc.document_category.replace(/[/\\?%*:|"<>]/g, '-');
          const uniqueFileName = `${safeCategory} - ${doc.id} - ${doc.file_name}`;
          await fs.copyFile(filePath, path.join(studentFolder, uniqueFileName));
        } catch (e) {
          console.error(`Failed to copy file: ${filePath}`);
          // Skip missing files
        }
      }

      // Create zip file using system zip command (Windows/Linux/Mac compatible)
      tempZipPath = path.join(tmpdir(), `student_${studentId}_documents_${Date.now()}.zip`);
      
      // Use appropriate command based on platform
      const zipCommand = process.platform === 'win32'
        ? `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${tempZipPath}' -Force"`
        : `cd '${tempDir}' && zip -r '${tempZipPath}' .`;

      await execAsync(zipCommand);

      // Read the zip file
      const fileBuffer = await fs.readFile(tempZipPath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="student_${studentId}_documents.zip"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } finally {
      // Cleanup temporary directory and zip file
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        if (tempZipPath) {
          await fs.rm(tempZipPath, { force: true });
        }
      } catch (e) {
        console.error('Cleanup error:', e);
      }
    }
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Bulk download error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
