#!/usr/bin/env node
// Comprehensive single student export test
import fs from 'fs';

const API_BASE = 'http://localhost:3000';

console.log('=== TESTING SINGLE STUDENT EXPORT ===\n');

// Step 1: Login
console.log('[1/5] Logging in...');
const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ram', password: 'ram@1212' })
});

if (!loginRes.ok) {
  console.error('❌ Login failed:', loginRes.status);
  process.exit(1);
}

const cookies = loginRes.headers.get('set-cookie') || '';
console.log('✅ Logged in successfully\n');

// Step 2: Get settings
console.log('[2/5] Checking export settings...');
const settingsRes = await fetch(`${API_BASE}/api/admin/settings`, {
  headers: { 'Cookie': cookies }
});

const settings = await settingsRes.json();
console.log('✅ Export path:', settings.excel_export_path);

// Step 3: Get students
console.log('\n[3/5] Fetching students...');
const studentsRes = await fetch(`${API_BASE}/api/students`, {
  headers: { 'Cookie': cookies }
});

const studentsData = await studentsRes.json();
console.log('✅ Total students:', studentsData.students?.length || 0);

if (!studentsData.students || studentsData.students.length === 0) {
  console.error('❌ No students found');
  process.exit(1);
}

const student = studentsData.students.find(s => s.completionStatus === 'Complete');
if (!student) {
  console.error('❌ No Complete students found');
  process.exit(1);
}

console.log('✅ Found Complete student:');
console.log('   ID:', student.id);
console.log('   Name:', student.name);
console.log('   Department:', student.department);
console.log('   Status:', student.completionStatus);
console.log('   Fields available:', Object.keys(student).length);

// Step 4: Build export request exactly like smartExportStudents does
console.log('\n[4/5] Building export request (simulating smartExportStudents)...');

// This is what appToExportRow does in the frontend
const exportRow = {
  // Basic Information
  'Application Number': student.id || '-',
  'Full Name': student.name || '-',
  'Department': student.department || '-',
  
  // Contact Information
  'Mobile Number': student.mobile || '-',
  'Father Mobile': student.fatherMobile || student.mobile || '-',
  'Mother Mobile': student.motherMobile || '-',
  'Address': student.address || '-',
  'District': student.district || '-',
  'State': student.state || '-',
  
  // Personal Information
  'Date of Birth': student.dob || '-',
  'Age': student.age || '-',
  'Caste': student.caste || '-',
  'Religion': student.religion || '-',
  'Mother Tongue': student.motherTongue || '-',
  'Nationality': student.nationality || '-',
  'Civic Status': student.civicStatus || '-',
  'Residential Status': student.residentialStatus || '-',
  'Specially Abled': student.speciallyAbled || '-',
  
  // Family Information
  'Father Name': student.fatherName || '-',
  'Father Occupation': student.fatherOccupation || '-',
  'Father Income': student.fatherIncome || '-',
  'Mother Name': student.motherName || '-',
  'Mother Occupation': student.motherOccupation || '-',
  'Mother Income': student.motherIncome || '-',
  'Guardian': student.guardian || '-',
  'Relatives in College': student.relativesInCollege || '-',
  
  // Educational Information
  'HSC Board': student.hscBoard || '-',
  'GQ/MQ Number': student.gqMqNumber || '-',
  'GQ/MQ Type': student.gqMqType || '-',
  'School Location': student.schoolLocation || '-',
  'EMIS No': student.emisNo || '-',
  'Studied in TN': student.studiedTN || '-',
  'Govt School': student.govtSchool || '-',
  'Batch': student.batch || '-',
  'Admission Year': student.admissionYear || '-',
  'Cutoff': student.cutoff || '-',
  
  // Academic Scores
  'PCM Target': student.pcmTarget || '-',
  'Physics Mark': student.physicsMark || '-',
  'Chemistry Mark': student.chemistryMark || '-',
  'Maths Mark': student.mathsMark || '-',
  
  // Application Status
  'Completion Status': student.completionStatus || '-',
  'Status': student.status || 'In Review',
  'Is Locked': student.isLocked ? 'Yes' : 'No',
  'Extended Days': student.extendedDays || 0,
  'Date Submitted': student.date || student.submitTime || '-',
  'How Heard About PSNA': student.hearAboutPSNA || '-',
  
  '_studentId': student.id, // Hidden field for tracking
};

const exportRequest = {
  students: [exportRow],
  useCustomPath: true
};

console.log('✅ Export request built');
console.log('   Student row keys:', Object.keys(exportRow).length);

// Step 5: Make the API call
console.log('\n[5/5] Calling export API...');
console.log('   Endpoint: POST /api/admin/export-excel');
console.log('   Path setting: E:\\nodel_excel');

const exportRes = await fetch(`${API_BASE}/api/admin/export-excel`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify(exportRequest)
});

console.log('\n📋 API Response:');
console.log('   Status Code:', exportRes.status);
console.log('   Status OK:', exportRes.ok);

const result = await exportRes.json();
console.log('   Response:', JSON.stringify(result, null, 2));

if (!exportRes.ok) {
  console.error('\n❌ EXPORT FAILED');
  console.error('Error:', result.error);
  console.error('Error Code:', result.errorCode);
  console.error('Details:', result.details);
  process.exit(1);
}

// Verify file
console.log('\n📁 Verifying file creation...');
const filepath = result.filepath;
console.log('   Expected path:', filepath);

if (fs.existsSync(filepath)) {
  const stats = fs.statSync(filepath);
  console.log('✅ FILE EXISTS!');
  console.log('   Size:', stats.size, 'bytes');
  console.log('   Created:', stats.birthtime);
  console.log('   Modified:', stats.mtime);
  
  console.log('\n✅✅✅ SINGLE STUDENT EXPORT SUCCESSFUL! ✅✅✅');
  console.log('\nFile Details:');
  console.log('  Location:', filepath);
  console.log('  Size:', stats.size, 'bytes');
  console.log('  Sheet Name:', student.department || 'Unknown');
  console.log('  Row Count: 1 (student data)');
} else {
  console.error('❌ FILE DOES NOT EXIST');
  console.error('   Expected at:', filepath);
  
  // Check directory
  const dir = require('path').dirname(filepath);
  console.error('\n📁 Directory contents:');
  try {
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      console.error('   (empty)');
    } else {
      files.forEach(f => {
        const fpath = `${dir}\\${f}`;
        try {
          const fstats = fs.statSync(fpath);
          console.error(`   - ${f} (${fstats.size} bytes, ${fstats.mtime})`);
        } catch (e) {
          console.error(`   - ${f} (error reading stats)`);
        }
      });
    }
  } catch (e) {
    console.error('   Error reading directory:', e.message);
  }
  
  process.exit(1);
}
