const fs = require('fs');
let code = fs.readFileSync('management-app/src/app/student/form/page.tsx', 'utf8');

code = code.replace(/className="((?:space-y-6|border border-transparent)[^"]+)\$\{currentStep === (\d) \? 'block' : 'hidden'\}"/g, 'className={`$1 ${currentStep === $2 ? \\\'block\\\' : \\\'hidden\\\'}`}');

fs.writeFileSync('management-app/src/app/student/form/page.tsx', code);
console.log('ClassNames Fixed');
