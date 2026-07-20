#!/usr/bin/env node
import XLSX from 'xlsx';
import fs from 'fs';

const filepath = 'E:\\nodel_excel\\Student_Records_2026 – 2030.xlsx';

console.log('=== CHECKING FOR OCCUPATION TYPE FIELDS ===\n');

if (!fs.existsSync(filepath)) {
  console.error('❌ File not found');
  process.exit(1);
}

const workbook = XLSX.readFile(filepath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

if (data.length > 0) {
  const row = data[0];
  const columns = Object.keys(row);
  
  console.log(`📊 Total columns: ${columns.length}\n`);
  
  const occupationFields = columns.filter(col => 
    col.toLowerCase().includes('occupation_type') || col.toLowerCase().includes('occupationtype')
  );
  
  console.log('Occupation Type Fields Found:');
  if (occupationFields.length > 0) {
    occupationFields.forEach(field => {
      console.log(`  ✅ ${field}`);
    });
  } else {
    console.log('  ⚠️ No occupation type fields found yet (will appear after form submission)');
  }
  
  console.log('\nAll columns:');
  columns.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col}`);
  });
} else {
  console.log('No data found');
}
