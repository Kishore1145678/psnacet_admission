import { cookies } from 'next/headers';
import { query } from '@/lib/db';

const LEGACY_COOKIE = 'mgmt_session';
const ADMIN_COOKIE = 'mgmt_admin_session';
const STUDENT_COOKIE = 'mgmt_student_session';
const MAX_AGE_DAYS = 7;

export type SessionRow = {
  token: string;
  kind: 'admin' | 'student';
  admin_username: string | null;
  student_id: string | null;
};

export async function createSession(data: {
  kind: 'admin' | 'student';
  adminUsername?: string;
  studentId?: string;
}) {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + MAX_AGE_DAYS);

  await query(
    `INSERT INTO sessions (token, kind, admin_username, student_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, data.kind, data.adminUsername ?? null, data.studentId ?? null, expires.toISOString()]
  );

  const jar = await cookies();
  const targetCookie = data.kind === 'admin' ? ADMIN_COOKIE : STUDENT_COOKIE;
  jar.set(targetCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  });
  // Keep backward compatibility but avoid stale collisions going forward.
  jar.delete(LEGACY_COOKIE);

  return token;
}

async function readSessionByToken(token: string | undefined): Promise<SessionRow | null> {
  if (!token) return null;
  const { rows } = await query<SessionRow>(
    `SELECT token, kind, admin_username, student_id
     FROM sessions
     WHERE token = $1 AND expires_at > NOW()`,
    [token]
  );
  return rows[0] ?? null;
}

async function getSessionFromCookie(cookieName: string): Promise<SessionRow | null> {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  return readSessionByToken(token);
}

export async function destroySession(kind: 'admin' | 'student' | 'all' = 'all') {
  const jar = await cookies();
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  const studentToken = jar.get(STUDENT_COOKIE)?.value;
  const legacyToken = jar.get(LEGACY_COOKIE)?.value;

  const tokens: string[] = [];
  if (kind === 'all' || kind === 'admin') {
    if (adminToken) tokens.push(adminToken);
  }
  if (kind === 'all' || kind === 'student') {
    if (studentToken) tokens.push(studentToken);
  }
  if (kind === 'all' && legacyToken) {
    tokens.push(legacyToken);
  }

  for (const token of tokens) {
    await query('DELETE FROM sessions WHERE token = $1', [token]).catch(() => {});
  }

  if (kind === 'all' || kind === 'admin') {
    jar.delete(ADMIN_COOKIE);
  }
  if (kind === 'all' || kind === 'student') {
    jar.delete(STUDENT_COOKIE);
  }
  if (kind === 'all') {
    jar.delete(LEGACY_COOKIE);
  }
}

export async function getSession(): Promise<SessionRow | null> {
  // Prefer role-specific cookies first, then legacy fallback.
  return (
    (await getSessionFromCookie(ADMIN_COOKIE)) ||
    (await getSessionFromCookie(STUDENT_COOKIE)) ||
    (await getSessionFromCookie(LEGACY_COOKIE))
  );
}

export async function requireAdminSession(): Promise<SessionRow> {
  const s =
    (await getSessionFromCookie(ADMIN_COOKIE)) ||
    (await getSessionFromCookie(LEGACY_COOKIE));
  if (!s || s.kind !== 'admin') {
    throw new AuthError('Unauthorized', 401);
  }
  return s;
}

export async function requireStudentSession(): Promise<SessionRow> {
  const s =
    (await getSessionFromCookie(STUDENT_COOKIE)) ||
    (await getSessionFromCookie(LEGACY_COOKIE));
  if (!s || s.kind !== 'student') {
    throw new AuthError('Unauthorized', 401);
  }
  return s;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
