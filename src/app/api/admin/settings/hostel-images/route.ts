import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['two_sharing_ac', 'two_sharing_non_ac', 'four_sharing_non_ac'];

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (e) {
    // Ignore if directory already exists
  }
}

export async function POST(req: Request) {
  try {
    // 1. Require admin session
    await requireAdminSession();

    // 2. Parse form data
    const formData = await req.formData();
    const category = formData.get('category') as string | null;
    const file = formData.get('image') as File | null;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid or missing category' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Optional: Validate file type is an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Uploaded file must be an image' }, { status: 400 });
    }

    const key = `hostel_images_${category}`;

    // 3. Get existing images from database
    const { rows } = await query<{ value: string }>(
      `SELECT value FROM admin_settings WHERE key = $1 LIMIT 1`,
      [key]
    );

    let existingImages: string[] = [];
    if (rows[0]?.value) {
      try {
        existingImages = JSON.parse(rows[0].value);
      } catch (e) {
        existingImages = [];
      }
    }

    if (existingImages.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 images are allowed for this category' },
        { status: 400 }
      );
    }

    // 4. Save image to disk
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'hostel', category);
    await ensureDir(uploadDir);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.jpg';
    const filename = `hostel_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);
    const imageUrl = `/uploads/hostel/${category}/${filename}`;

    // 5. Update database settings
    existingImages.push(imageUrl);

    // Precautionary create table
    await query(
      `CREATE TABLE IF NOT EXISTS admin_settings (
        id BIGSERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ).catch((e) => console.log('Table creation (may already exist):', e));

    await query(
      `INSERT INTO admin_settings (key, value, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(existingImages)]
    );

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      images: existingImages
    }, { status: 200 });

  } catch (error) {
    console.error('Error uploading hostel image:', error);
    return NextResponse.json({
      error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // 1. Require admin session
    await requireAdminSession();

    // 2. Parse request body
    const body = await req.json();
    const { category, imageUrl } = body;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid or missing category' }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    const key = `hostel_images_${category}`;

    // 3. Get existing images
    const { rows } = await query<{ value: string }>(
      `SELECT value FROM admin_settings WHERE key = $1 LIMIT 1`,
      [key]
    );

    if (!rows[0]?.value) {
      return NextResponse.json({ error: 'No images found for this category' }, { status: 404 });
    }

    let existingImages: string[] = [];
    try {
      existingImages = JSON.parse(rows[0].value);
    } catch (e) {
      existingImages = [];
    }

    // 4. Remove image URL from database and unlink file
    if (existingImages.includes(imageUrl)) {
      existingImages = existingImages.filter(img => img !== imageUrl);
      
      // Delete file from disk
      const filePath = path.join(process.cwd(), 'public', imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Error deleting file at ${filePath}:`, err);
      }

      // Update database
      await query(
        `UPDATE admin_settings SET value = $2, updated_at = NOW() WHERE key = $1`,
        [key, JSON.stringify(existingImages)]
      );

      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
        images: existingImages
      }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Image not found in this category' }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting hostel image:', error);
    return NextResponse.json({
      error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
