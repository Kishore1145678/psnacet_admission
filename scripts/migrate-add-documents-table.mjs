/**
 * Migration: Add student_documents table for file uploads
 */
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL (e.g. postgresql://user:pass@localhost:5432/management_app)');
  process.exit(1);
}

async function runMigration() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Running migration: Adding student_documents table...');

    // Check if table already exists
    const { rows } = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'student_documents'
    `);

    if (rows.length === 0) {
      await client.query(`
        CREATE TABLE student_documents (
          id BIGSERIAL PRIMARY KEY,
          student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
          document_category TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_key TEXT NOT NULL UNIQUE,
          file_size INT NOT NULL,
          file_type TEXT NOT NULL,
          uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_docs_student ON student_documents (student_id);
        CREATE INDEX IF NOT EXISTS idx_docs_category ON student_documents (document_category);
      `);
      console.log('✓ Created student_documents table');
    } else {
      console.log('✓ student_documents table already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
  }
}

runMigration();
