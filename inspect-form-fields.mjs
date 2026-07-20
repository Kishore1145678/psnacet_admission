import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const parseEnv = (content) => {
  const result = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) result[key.trim()] = value.trim();
  });
  return result;
};

const env = parseEnv(envContent);

const client = new Client({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
});

async function inspectFormFields() {
  try {
    await client.connect();
    
    // Get a student with form data
    const res = await client.query(`
      SELECT 
        s.application_number,
        s.full_name,
        f.encrypted_payload,
        f.status
      FROM students s
      LEFT JOIN student_application_forms f ON f.student_id = s.id
      WHERE f.encrypted_payload IS NOT NULL
      ORDER BY f.created_at DESC
      LIMIT 1
    `);

    if (res.rows.length === 0) {
      console.log('No student forms found with encrypted_payload');
      return;
    }

    const row = res.rows[0];
    console.log('\n========== STUDENT FORM INSPECTION ==========');
    console.log('Application Number:', row.application_number);
    console.log('Full Name:', row.full_name);
    console.log('Status:', row.status);
    console.log('\n========== ENCRYPTED PAYLOAD STRUCTURE ==========');
    console.log(JSON.stringify(row.encrypted_payload, null, 2));

    // Show field names from payload
    if (row.encrypted_payload && typeof row.encrypted_payload === 'object') {
      console.log('\n========== AVAILABLE FIELD NAMES IN FORM ==========');
      const fields = Object.keys(row.encrypted_payload);
      fields.sort().forEach(field => {
        console.log(`- ${field}`);
      });
      console.log(`\nTotal fields: ${fields.length}`);
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

inspectFormFields();
