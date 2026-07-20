#!/usr/bin/env node
// Check database schema and actual student data
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

console.log('=== CHECKING DATABASE SCHEMA ===\n');

// Get table columns
console.log('📋 Students table columns:');
const colResult = await client.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'students'
  ORDER BY ordinal_position;
`);

colResult.rows.forEach((col, i) => {
  console.log(`  ${i + 1}. ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
});

// Check sample student data
console.log('\n📊 Sample student record:');
const studentResult = await client.query(`
  SELECT * FROM students LIMIT 1;
`);

if (studentResult.rows.length > 0) {
  const student = studentResult.rows[0];
  console.log('   Fields with data:');
  Object.entries(student).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      const displayValue = String(value).substring(0, 50);
      console.log(`     • ${key}: ${displayValue}`);
    }
  });
  
  console.log('\n   Empty fields:');
  Object.entries(student).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      console.log(`     • ${key}`);
    }
  });
}

// Check additional_info column
console.log('\n📦 Checking additional_info column:');
const addlResult = await client.query(`
  SELECT id, name, additional_info FROM students LIMIT 1;
`);

if (addlResult.rows.length > 0) {
  const student = addlResult.rows[0];
  console.log(`   Student: ${student.name} (${student.id})`);
  
  if (student.additional_info) {
    console.log('   additional_info content:');
    try {
      const parsed = typeof student.additional_info === 'object' 
        ? student.additional_info 
        : JSON.parse(student.additional_info);
      
      if (Object.keys(parsed).length === 0) {
        console.log('     (empty object)');
      } else {
        Object.entries(parsed).forEach(([key, value]) => {
          console.log(`     • ${key}: ${String(value).substring(0, 40)}`);
        });
      }
    } catch (e) {
      console.log('     Error parsing:', e.message);
    }
  } else {
    console.log('   additional_info is NULL or empty');
  }
}

await client.end();
console.log('\n✅ Database check complete');
