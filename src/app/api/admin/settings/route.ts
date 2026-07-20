import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    // Try to get settings from database
    const { rows } = await query(
      `SELECT key, value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
    );

    const excel_export_path = rows[0]?.value || '';
    console.log('Retrieved excel_export_path from database:', excel_export_path);

    return NextResponse.json({
      excel_export_path
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { excel_export_path } = body;
    console.log('Received excel_export_path to save:', excel_export_path);

    if (!excel_export_path || typeof excel_export_path !== 'string') {
      return NextResponse.json({ error: 'Invalid excel_export_path' }, { status: 400 });
    }

    console.log('Trimmed and validated path:', excel_export_path.trim());

    // Check if table exists, if not create it
    await query(
      `CREATE TABLE IF NOT EXISTS admin_settings (
        id BIGSERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ).catch((e) => console.log('Table creation (may already exist):', e));

    // Insert or update the setting
    const updateResult = await query(
      `INSERT INTO admin_settings (key, value, updated_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      ['excel_export_path', excel_export_path]
    );
    
    console.log('Path saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Excel export path saved successfully',
      savedPath: excel_export_path
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ 
      error: `Failed to save path: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
