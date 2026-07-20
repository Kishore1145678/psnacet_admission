import fs from 'fs';

// Check API files for the target message
const filesToCheck = [
  'src/app/api/admin/export-excel/route.ts',
  'src/app/api/admin/excel-exports/download/route.ts',
  'src/app/api/admin/id-cards-export/route.ts',
  'src/app/admin/page.tsx',
];

let allPassed = true;

for (const file of filesToCheck) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('No student details available to download.')) {
    console.log(`✅ ${file} contains exact error message.`);
  } else {
    console.log(`❌ ${file} MISSING exact error message!`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n🎉 ALL FILES VERIFIED SUCCESSFULLY!');
} else {
  console.log('\n⚠️ SOME FILES FAILED VERIFICATION!');
  process.exit(1);
}
