import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

export async function GET() {
  try {
    await requireAdminSession();

    const { rows } = await query(
      `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
    );
    const exportPath = String((rows[0]?.value as string) || '').trim();

    if (!exportPath) {
      return NextResponse.json(
        { error: 'Excel export path is not configured.' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(exportPath)) {
      return NextResponse.json(
        { error: `Export path not found: ${exportPath}` },
        { status: 404 }
      );
    }

    const files = fs
      .readdirSync(exportPath)
      .filter((f) => f.toLowerCase().endsWith('.xlsx'))
      .map((f) => path.join(exportPath, f));

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No student details available to download.' },
        { status: 404 }
      );
    }

    const fileName = `Excel_Exports_${new Date().toISOString().slice(0, 10)}.zip`;

    const archive = archiver('zip', { zlib: { level: 9 } });
    for (const fullPath of files) {
      archive.file(fullPath, { name: path.basename(fullPath) });
    }
    void archive.finalize();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        archive.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        archive.on('end', () => controller.close());
        archive.on('error', (err: any) => controller.error(err));
      },
      cancel() {
        try {
          archive.destroy();
        } catch {}
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('excel-exports download error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

