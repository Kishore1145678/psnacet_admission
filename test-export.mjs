import fs from 'fs';

const API_BASE = 'http://localhost:3000';

// Step 1: Login
console.log('=== TEST EXCEL EXPORT ===\n');
console.log('[1/4] Logging in...');

let loginRes = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ram', password: 'ram@1212' })
});

if (!loginRes.ok) {
  console.error('❌ Login failed:', loginRes.status);
  process.exit(1);
}

const cookies = loginRes.headers.get('set-cookie') || '';
console.log('✅ Logged in successfully');

// Step 2: Get students
console.log('\n[2/4] Fetching students...');

let studentsRes = await fetch(`${API_BASE}/api/students`, {
  headers: {
    'Cookie': cookies
  }
});

if (!studentsRes.ok) {
  console.error('❌ Failed to get students:', studentsRes.status);
  process.exit(1);
}

const students = await studentsRes.json();
console.log(`✅ Retrieved ${students.length} students`);

if (students.length === 0) {
  console.warn('⚠️  No students found. Creating test students...');
  
  // Create test students
  for (let i = 1; i <= 3; i++) {
    const addRes = await fetch(`${API_BASE}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        name: `Test Student ${i}`,
        mobile: `9123456789${i}`,
        dob: '2000-01-15',
        fatherName: `Father ${i}`,
        motherName: `Mother ${i}`,
        department: i % 2 === 0 ? 'CSE' : 'ECE',
        completionStatus: 'Complete'
      })
    });
    
    if (addRes.ok) {
      const data = await addRes.json();
      console.log(`  ✅ Created student ${i}: ${data.id}`);
    }
  }
  
  // Re-fetch students
  studentsRes = await fetch(`${API_BASE}/api/students`, {
    headers: { 'Cookie': cookies }
  });
  const newStudents = await studentsRes.json();
  console.log(`\n✅ Now have ${newStudents.length} students`);
}

// Step 3: Set export path
console.log('\n[3/4] Setting export path to E:\\nodel_excel...');

let settingsRes = await fetch(`${API_BASE}/api/admin/settings`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify({ excel_export_path: 'E:\\nodel_excel' })
});

if (!settingsRes.ok) {
  console.error('❌ Failed to set path:', settingsRes.status);
  const errorData = await settingsRes.json();
  console.error(errorData);
  process.exit(1);
}

const pathRes = await settingsRes.json();
console.log('✅ Path set successfully:', pathRes.savedPath);

// Step 4: Export to Excel
console.log('\n[4/4] Exporting to Excel...');

const completeStudents = students.filter(s => s.completionStatus === 'Complete');
console.log(`   Exporting ${completeStudents.length} complete students`);

if (completeStudents.length === 0) {
  console.error('❌ No complete students to export');
  process.exit(1);
}

const exportData = completeStudents.map(s => ({
  id: s.id,
  name: s.name,
  department: s.department || 'Unknown',
  mobile: s.mobile,
  dob: s.dob,
  fatherName: s.fatherName,
  motherName: s.motherName,
  date: new Date().toISOString(),
  status: s.completionStatus
}));

let exportRes = await fetch(`${API_BASE}/api/admin/export-excel`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify({ students: exportData, useCustomPath: true })
});

const exportResult = await exportRes.json();
console.log('\nExport API Response:');
console.log('  Status:', exportRes.status);
console.log('  Success:', exportRes.ok);
console.log('  Result:', JSON.stringify(exportResult, null, 2));

// Step 5: Verify file
console.log('\n[5/5] Verifying exported file...');

if (exportRes.ok && exportResult.filepath) {
  const fileExists = fs.existsSync(exportResult.filepath);
  console.log('  File path:', exportResult.filepath);
  console.log('  File exists:', fileExists);
  
  if (fileExists) {
    const stats = fs.statSync(exportResult.filepath);
    console.log('  File size:', stats.size, 'bytes');
    console.log('  Created:', stats.birthtime);
    console.log('\n✅ EXPORT SUCCESSFUL!');
  } else {
    console.log('❌ File not found at path');
  }
} else {
  console.log('❌ Export failed');
  console.log('  Error:', exportResult.error);
  console.log('  Error Code:', exportResult.errorCode);
  console.log('  Details:', exportResult.details);
}

console.log('\n=== TEST COMPLETE ===');
