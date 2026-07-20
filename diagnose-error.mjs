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

console.log('=== DIAGNOSING 500 ERROR ===\n');

// Check if student exists
const studentRes = await client.query(`
  SELECT id, application_number, full_name, form_submitted_at
  FROM students
  WHERE application_number = '112233'
`);

if (studentRes.rows.length === 0) {
  console.log('❌ ERROR: Student 112233 not found');
  await client.end();
  process.exit(1);
}

const student = studentRes.rows[0];
console.log(`✅ Student found: ${student.full_name} (${student.application_number})`);
console.log(`   form_submitted_at: ${student.form_submitted_at || 'null (not submitted)'}\n`);

// Check if form exists
const formRes = await client.query(`
  SELECT id, status, encrypted_payload, created_at
  FROM student_application_forms
  WHERE student_id = $1
  ORDER BY created_at DESC
`, [student.id]);

if (formRes.rows.length === 0) {
  console.log('⚠️  WARNING: No forms found for this student');
  console.log('   → Student needs to submit a form first');
  await client.end();
  process.exit(0);
}

console.log(`✅ Forms found: ${formRes.rows.length}\n`);

formRes.rows.forEach((form, i) => {
  console.log(`Form ${i + 1}:`);
  console.log(`  ID: ${form.id}`);
  console.log(`  Status: ${form.status}`);
  console.log(`  Created: ${form.created_at}`);
  console.log(`  Payload type: ${typeof form.encrypted_payload}`);
  console.log(`  Payload keys: ${form.encrypted_payload ? Object.keys(form.encrypted_payload).join(', ') : 'null'}`);
  console.log(`  Is encrypted: ${form.encrypted_payload?.v ? 'Yes' : 'No (plain JSON)'}\n`);
});

await client.end();
