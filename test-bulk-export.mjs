#!/usr/bin/env node
// Test bulk export
import fs from 'fs';
import XLSX from 'xlsx';

const API_BASE = 'http://localhost:3000';

console.log('=== TESTING BULK EXPORT ===\n');

// Login
console.log('[1/4] Logging in...');
const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ram', password: 'ram@1212' })
});

const cookies = loginRes.headers.get('set-cookie') || '';
console.log('✅ Logged in\n');

// Get students
console.log('[2/4] Fetching all students...');
const studentsRes = await fetch(`${API_BASE}/api/students`, {
  headers: { 'Cookie': cookies }
});

const studentsData = await studentsRes.json();
const completeStudents = studentsData.students.filter(s => s.completionStatus === 'Complete');
console.log(`✅ Found ${completeStudents.length} Complete students\n`);

if (completeStudents.length === 0) {
  console.error('❌ No Complete students to export');
  process.exit(1);
}

completeStudents.forEach(s => {
  console.log(`   • ${s.name} (${s.id}) - ${s.department}`);
});

// Build export request
console.log('\n[3/4] Calling export API for bulk export...');
const exportRes = await fetch(`${API_BASE}/api/admin/export-excel`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify({
    students: completeStudents.map(s => ({
      _studentId: s.id,
      'Application Number': s.id
    })),
    useCustomPath: true
  })
});

const result = await exportRes.json();
console.log('✅ API Response:', result.message);
console.log(`   File: ${result.filepath}`);
console.log(`   Size: ${result.fileSize} bytes`);
console.log(`   Sheets: ${result.sheetsCreated}\n`);

// Verify file
console.log('[4/4] Verifying Excel file...');
const filepath = result.filepath;

if (fs.existsSync(filepath)) {
  const workbook = XLSX.readFile(filepath);
  console.log(`✅ File exists with ${workbook.SheetNames.length} sheets:\n`);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`   📋 ${sheetName}:`);
    console.log(`      Rows: ${data.length}`);
    data.forEach((row, i) => {
      console.log(`      ${i + 1}. ${row['Full Name']} (ID: ${row['Application Number']})`);
    });
  });
  
  console.log('\n✅✅✅ BULK EXPORT SUCCESSFUL! ✅✅✅');
} else {
  console.error('❌ File not found');
  process.exit(1);
}
