import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Prevent directory traversal attacks
    const safeSegments = pathSegments.map((s) => path.basename(s));

    // Try primary path: CWD/public/uploads/...
    let filePath = path.join(process.cwd(), 'public', 'uploads', ...safeSegments);

    let exists = false;
    try {
      await fs.access(filePath);
      exists = true;
    } catch {
      // Fallback path: CWD/.next/standalone/public/uploads/...
      filePath = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', ...safeSegments);
      try {
        await fs.access(filePath);
        exists = true;
      } catch {
        exists = false;
      }
    }

    if (!exists) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.gif') contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving uploaded file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
