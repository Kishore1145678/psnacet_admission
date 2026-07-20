import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { rows } = await query<{ key: string; value: string }>(
      `SELECT key, value FROM admin_settings WHERE key IN (
        'hostel_images_two_sharing_ac',
        'hostel_images_two_sharing_non_ac',
        'hostel_images_four_sharing_non_ac'
      )`
    );

    const result: Record<string, string[]> = {
      two_sharing_ac: [],
      two_sharing_non_ac: [],
      four_sharing_non_ac: [],
    };

    rows.forEach((row) => {
      const categoryKey = row.key.replace('hostel_images_', '');
      try {
        result[categoryKey] = JSON.parse(row.value || '[]');
      } catch (e) {
        result[categoryKey] = [];
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching hostel images:', error);
    return NextResponse.json({
      two_sharing_ac: [],
      two_sharing_non_ac: [],
      four_sharing_non_ac: [],
    }, { status: 500 });
  }
}
