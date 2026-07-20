import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { youtube_url } = body;

    if (!youtube_url || typeof youtube_url !== 'string') {
      return NextResponse.json({ error: 'Valid YouTube URL is required' }, { status: 400 });
    }

    const trimmedUrl = youtube_url.trim();

    // Ensure table exists
    await query(
      `CREATE TABLE IF NOT EXISTS admin_settings (
        id BIGSERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ).catch((e) => console.log('Table creation (may already exist):', e));

    // Save under tutorial_youtube_url and tutorial_video_url for backward compatibility
    await query(
      `INSERT INTO admin_settings (key, value, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      ['tutorial_youtube_url', trimmedUrl]
    );

    await query(
      `INSERT INTO admin_settings (key, value, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      ['tutorial_video_url', trimmedUrl]
    );

    return NextResponse.json({
      success: true,
      message: 'YouTube tutorial video link saved successfully',
      youtubeUrl: trimmedUrl,
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving YouTube video link:', error);
    return NextResponse.json({
      error: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
