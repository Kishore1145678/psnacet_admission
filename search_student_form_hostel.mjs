import fs from 'fs';

const filePath = 'd:\\psnacet_edu\\psna_psna\\PSNACET_APPLICATION-main\\src\\app\\student\\form\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Searching for Hostel/Hosteller in', filePath);
lines.forEach((line, idx) => {
  if (line.includes('Hostel') || line.includes('hostel') || line.includes('Hosteller') || line.includes('hosteller') || line.includes('Sharing') || line.includes('sharing')) {
    if (line.length < 120) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    } else {
      console.log(`Line ${idx + 1}: ${line.trim().substring(0, 120)}...`);
    }
  }
});
