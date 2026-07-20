#!/usr/bin/env node
// Verify Excel file contents
import XLSX from 'xlsx';
import fs from 'fs';

const filepath = 'E:\\nodel_excel\\Student_Records_2026 – 2030.xlsx';

console.log('=== VERIFYING EXCEL FILE CONTENTS ===\n');

if (!fs.existsSync(filepath)) {
  console.error('❌ File not found:', filepath);
  process.exit(1);
}

const stats = fs.statSync(filepath);
console.log('📄 File Info:');
console.log('   Path:', filepath);
console.log('   Size:', stats.size, 'bytes');
console.log('   Created:', stats.birthtime);
console.log('   Modified:', stats.mtime);

try {
  const workbook = XLSX.readFile(filepath);
  
  console.log('\n📑 Workbook Contents:');
  console.log('   Sheets:', workbook.SheetNames.length);
  console.log('   Sheet names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`\n📋 Sheet: "${sheetName}"`);
    console.log(`   Rows: ${data.length}`);
    
    if (data.length > 0) {
      console.log('   Columns:', Object.keys(data[0]).length);
      console.log('\n   📊 Data in sheet:');
      
      data.forEach((row, index) => {
        console.log(`\n   Row ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          const displayValue = value ? String(value).substring(0, 50) : '(empty)';
          const truncated = String(value || '').length > 50 ? '...' : '';
          console.log(`     • ${key}: ${displayValue}${truncated}`);
        });
      });
    }
  });
  
  console.log('\n✅ Excel file is valid and contains student data!');
  
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  process.exit(1);
}
