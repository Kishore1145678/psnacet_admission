/**
 * Migration: Add access_expires_at and form_submitted_at columns to students table
 * Run this to add the new time-based access control fields
 */
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/management_app)');
  process.exit(1);
}

async function runMigration() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    console.log('Running migration: Adding access control fields to students table...');

    // Check if columns already exist
    const { rows } = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name IN ('access_expires_at', 'form_submitted_at')
    `);

    const existingColumns = rows.map(r => r.column_name);

    // Add access_expires_at if it doesn't exist
    if (!existingColumns.includes('access_expires_at')) {
      await client.query(`ALTER TABLE students ADD COLUMN access_expires_at TIMESTAMPTZ;`);
      console.log('✓ Added access_expires_at column');
    } else {
      console.log('✓ access_expires_at column already exists');
    }

    // Add form_submitted_at if it doesn't exist
    if (!existingColumns.includes('form_submitted_at')) {
      await client.query(`ALTER TABLE students ADD COLUMN form_submitted_at TIMESTAMPTZ;`);
      console.log('✓ Added form_submitted_at column');
    } else {
      console.log('✓ form_submitted_at column already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
