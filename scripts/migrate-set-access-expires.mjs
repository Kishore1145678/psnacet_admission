/**
 * Migration: Set access_expires_at for existing students (3 days from creation)
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
    console.log('Running migration: Setting access_expires_at for existing students...');

    // Update all students where access_expires_at is NULL
    const result = await client.query(`
      UPDATE students 
      SET access_expires_at = created_at + INTERVAL '5 days'
      WHERE access_expires_at IS NULL;
    `);

    console.log(`✓ Updated ${result.rowCount} student records with access_expires_at`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
