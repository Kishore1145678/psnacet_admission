import fs from 'fs';

const content = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('excel')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
