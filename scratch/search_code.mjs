import fs from 'fs';

const filePath = 'd:\\psnacet_edu\\psna_psna\\PSNACET_APPLICATION-main\\src\\app\\student\\form\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('clear') || line.toLowerCase().includes('reset')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
  }
});
