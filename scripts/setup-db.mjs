/**
 * DB bootstrap:
 * 1) Ensure target database exists
 * 2) Apply schema
 * 3) Seed default admin (ram / ram@1212) once
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/management_app)');
  process.exit(1);
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function ensureDatabaseExists() {
  const target = new URL(DATABASE_URL);
  const dbName = target.pathname.replace(/^\//, '');
  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  // Try connecting directly to the target database first
  try {
    const direct = new pg.Client({ connectionString: DATABASE_URL });
    await direct.connect();
    await direct.end();
    console.log(`Database exists and is reachable: ${dbName}`);
    return;
  } catch (e) {
    // If target database doesn't exist, fallback to adminUrl connection
    console.log(`Direct connection to ${dbName} failed (${e.message}), attempting admin check...`);
  }

  const adminUrl = new URL(DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
      console.log(`Created database: ${dbName}`);
    } else {
      console.log(`Database exists: ${dbName}`);
    }
  } finally {
    await admin.end();
  }
}

async function main() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await ensureDatabaseExists();
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Add status column to student_application_forms if it doesn't exist
  try {
    await client.query(`
      ALTER TABLE student_application_forms
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    `);
  } catch (e) {
    // Table might not exist yet, will be created by schema.sql
    console.log('Note: student_application_forms table may not exist yet');
  }

  // Add father_mobile column if needed
  try {
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS father_mobile_number TEXT DEFAULT ''
    `);
  } catch (e) {
    // Table will be created/updated by schema.sql
    console.log('Note: students table will be initialized by schema');
  }

  // Add additional_info column if needed
  try {
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS additional_info JSONB DEFAULT '{}'
    `);
  } catch (e) {
    // Column already exists or table will be created, ignore
  }

  // Now run the schema which will create any missing tables
  try {
    await client.query(sql);
  } catch (e) {
    // Some statements might fail if they already exist, that's ok
    console.log('Schema execution note:', e.message);
  }

  // Ensure status column exists and has correct default
  try {
    await client.query(`
      ALTER TABLE student_application_forms
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    `);
  } catch (e) {
    // Column already exists, ignore error
  }

  // Create indexes that might have failed in schema.sql
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forms_status
      ON student_application_forms (status)
    `);
  } catch (e) {
    console.log('Index creation note:', e.message);
  }

  // Data migration: older versions stored father's mobile into mobile_number.
  // Move it across once and clear student mobile.
  try {
    await client.query(`
      UPDATE students
      SET father_mobile_number = mobile_number,
          mobile_number = '',
          updated_at = NOW()
      WHERE COALESCE(father_mobile_number, '') = ''
        AND COALESCE(mobile_number, '') <> ''
    `);
  } catch (e) {
    // Columns might not exist yet, ignore
  }

  // Remove legacy admin account 'ram' if present
  try {
    await client.query(`DELETE FROM admin_accounts WHERE username = 'ram'`);
  } catch (e) {
    // Ignore error if table doesn't exist
  }

  const hash = await bcrypt.hash('forgotpsnacet1984', 10);
  await client.query(
    `INSERT INTO admin_accounts (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) 
     DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    ['forgotpsna1984', hash]
  );

  console.log('Database ready. Default admin: username forgotpsna1984, password forgotpsnacet1984.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
