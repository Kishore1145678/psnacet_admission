#!/usr/bin/env node
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'management_app',
  user: 'postgres',
  password: 'password'
});

function getKey() {
  const b64 = process.env.ENCRYPTION_KEY_BASE64;
  if (!b64) throw new Error('ENCRYPTION_KEY_BASE64 is not set in .env.local');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  return key;
}

function encryptJson(value) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

await client.connect();

console.log('=== ENCRYPTING PLAIN JSON FORMS ===\n');

// Find forms with plain JSON (no 'v' field)
const result = await client.query(`
  SELECT id, student_id, encrypted_payload
  FROM student_application_forms
  WHERE encrypted_payload ->> 'v' IS NULL
  AND encrypted_payload ->> 'data' IS NULL
`);

if (result.rows.length === 0) {
  console.log('✅ No plain JSON forms found - all forms are properly encrypted!');
  await client.end();
  process.exit(0);
}

console.log(`Found ${result.rows.length} unencrypted form(s):\n`);

for (const row of result.rows) {
  try {
    const plainPayload = row.encrypted_payload;
    const encrypted = encryptJson(plainPayload);
    
    await client.query(
      `UPDATE student_application_forms SET encrypted_payload = $1 WHERE id = $2`,
      [JSON.stringify(encrypted), row.id]
    );
    
    console.log(`✅ Form ID ${row.id}: Encrypted successfully`);
    console.log(`   Fields: ${Object.keys(plainPayload).length}`);
  } catch (e) {
    console.error(`❌ Form ID ${row.id}: ${e.message}`);
  }
}

console.log('\n✅ Migration complete!');
await client.end();
