import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';

export async function PATCH(req: Request) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const action = String(body.action ?? '');

    const username = session.admin_username;
    if (!username) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { rows: admins } = await query<{ id: number; password_hash: string }>(
      'SELECT id, password_hash FROM admin_accounts WHERE username = $1',
      [username]
    );
    if (!admins[0]) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (action === 'username') {
      const currentPassword = String(body.currentPassword ?? '');
      const newUsername = String(body.newUsername ?? '').trim();
      if (!currentPassword || !newUsername) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }
      const ok = await bcrypt.compare(currentPassword, admins[0].password_hash);
      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }
      const { rows: clash } = await query('SELECT 1 FROM admin_accounts WHERE username = $1 AND id <> $2', [
        newUsername,
        admins[0].id,
      ]);
      if (clash.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
      await query('UPDATE admin_accounts SET username = $1, updated_at = NOW() WHERE id = $2', [
        newUsername,
        admins[0].id,
      ]);
      await query(
        `UPDATE sessions SET admin_username = $1 WHERE kind = 'admin' AND admin_username = $2`,
        [newUsername, username]
      ).catch(() => {});
      return NextResponse.json({ ok: true, username: newUsername });
    }

    if (action === 'password') {
      const currentPassword = String(body.currentPassword ?? '');
      const newPassword = String(body.newPassword ?? '');
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
      }
      const ok = await bcrypt.compare(currentPassword, admins[0].password_hash);
      if (!ok) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await query('UPDATE admin_accounts SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
        hash,
        admins[0].id,
      ]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
