import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query(
      `SELECT value FROM admin_settings WHERE key = 'tutorial_youtube_url' OR key = 'tutorial_video_url' ORDER BY id DESC LIMIT 1`
    );

    const videoUrl = rows[0]?.value || 'https://www.youtube.com';

    return NextResponse.json({
      tutorial_youtube_url: videoUrl,
      tutorial_video_url: videoUrl,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      tutorial_youtube_url: 'https://www.youtube.com',
      tutorial_video_url: 'https://www.youtube.com',
    }, { status: 200 });
  }
}
