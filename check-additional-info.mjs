#!/usr/bin/env node
// Check what's in additional_info for Naresh
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

console.log('=== CHECKING STUDENT FORM DATA ===\n');

const result = await client.query(`
  SELECT application_number, full_name, additional_info
  FROM students
  WHERE application_number = '112233'
  LIMIT 1
`);

if (result.rows.length > 0) {
  const row = result.rows[0];
  console.log(`Student: ${row.full_name} (${row.application_number})\n`);
  
  console.log('📦 additional_info content:\n');
  
  if (row.additional_info) {
    const data = typeof row.additional_info === 'object' 
      ? row.additional_info 
      : JSON.parse(row.additional_info);
    
    const keys = Object.keys(data);
    console.log(`Total fields: ${keys.length}\n`);
    
    console.log('Fields available:');
    keys.forEach(key => {
      const value = data[key];
      let displayValue = '';
      
      if (value === null || value === undefined) {
        displayValue = '(empty)';
      } else if (typeof value === 'object') {
        displayValue = JSON.stringify(value).substring(0, 50);
      } else {
        displayValue = String(value).substring(0, 50);
      }
      
      console.log(`  • ${key}: ${displayValue}`);
    });
    
    console.log('\n\n📄 Full JSON structure:\n');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('(empty or null)');
  }
} else {
  console.log('Student not found');
}

await client.end();
