#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'management_app',
  user: 'postgres',
  password: 'password'
});

await client.connect();

console.log('=== CHECKING FORMS IN DATABASE ===\n');

// Check how many forms exist
const result = await client.query(`
  SELECT 
    f.student_id,
    s.application_number,
    s.full_name,
    f.encrypted_payload IS NOT NULL as has_form,
    f.created_at
  FROM students s
  LEFT JOIN student_application_forms f ON f.student_id = s.id
  WHERE s.application_number = '112233'
  ORDER BY f.created_at DESC
`);

console.log(`Found ${result.rows.length} records for student 112233:\n`);

result.rows.forEach((row, i) => {
  console.log(`${i + 1}. Application: ${row.application_number}`);
  console.log(`   Name: ${row.full_name}`);
  console.log(`   Has Form: ${row.has_form}`);
  console.log(`   Created: ${row.created_at}\n`);
});

await client.end();
