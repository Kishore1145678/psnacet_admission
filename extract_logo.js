const fs = require('fs');
const data = fs.readFileSync('src/app/student/layout.tsx', 'utf8');
const match = data.match(/src="data:image\/png;base64,([^"]+)"/);
if (match) {
  if (!fs.existsSync('public')) fs.mkdirSync('public');
  fs.writeFileSync('public/psna.png', Buffer.from(match[1], 'base64'));
  console.log('Successfully saved public/psna.png !');
} else {
  console.log('Could not find base64 string.');
}
