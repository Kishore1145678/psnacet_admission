import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';

export async function GET() {
  try {
    await requireAdminSession();
    const { rows } = await query<{ short_code: string; full_name: string }>(
      `SELECT short_code, full_name FROM custom_departments ORDER BY short_code`
    );
    return NextResponse.json({
      departments: rows.map((r) => ({ short: r.short_code, full: r.full_name })),
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const short = String(body.short ?? '').trim().toUpperCase();
    const full = String(body.full ?? '').trim();
    if (!short || !full) {
      return NextResponse.json({ error: 'Short code and full name required' }, { status: 400 });
    }
    await query(
      `INSERT INTO custom_departments (short_code, full_name) VALUES ($1, $2)`,
      [short, full]
    );
    return NextResponse.json({ ok: true, department: { short, full } });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Department code already exists' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const short = String(body.short ?? '').trim().toUpperCase();
    if (!short) {
      return NextResponse.json({ error: 'short required' }, { status: 400 });
    }
    await query(`DELETE FROM custom_departments WHERE short_code = $1`, [short]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
