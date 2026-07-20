const fs = require('fs');
let code = fs.readFileSync('management-app/src/app/student/form/page.tsx', 'utf8');

code = code.replace(/\\'block\\' : \\'hidden\\'/g, "'block' : 'hidden'");

fs.writeFileSync('management-app/src/app/student/form/page.tsx', code);
console.log('Quotes Fixed');
