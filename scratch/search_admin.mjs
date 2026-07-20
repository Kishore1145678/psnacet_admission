import fs from 'fs';

const content = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('excel') || line.toLowerCase().includes('reset')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
