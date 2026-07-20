/**
 * Migration: Add additional_info JSONB column to students table
 * This allows admin to edit all student fields
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
    console.log('Running migration: Adding additional_info column to students table...');

    // Check if column already exists
    const { rows } = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'additional_info'
    `);

    if (rows.length === 0) {
      await client.query(`ALTER TABLE students ADD COLUMN additional_info JSONB DEFAULT '{}'::jsonb;`);
      console.log('✓ Added additional_info column');
    } else {
      console.log('✓ additional_info column already exists');
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
