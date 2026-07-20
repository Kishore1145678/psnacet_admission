import fs from 'fs';

const content = fs.readFileSync('src/app/admin/StudentDetailModal.tsx', 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('reset') || line.toLowerCase().includes('excel') || line.toLowerCase().includes('download')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
