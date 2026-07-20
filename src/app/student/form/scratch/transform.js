const fs = require('fs');
let code = fs.readFileSync('management-app/src/app/student/form/page.tsx', 'utf8');

// Task 1: Replace conditionally rendered steps with CSS hidden blocks
for(let i=1; i<=9; i++) {
  const stepStartRegex = new RegExp('{currentStep === ' + i + ' && \\(\\s*(<div[^>]*className="([^"]+)"[^>]*>)');
  const match = code.match(stepStartRegex);
  if(match) {
    const originalDiv = match[1];
    const originalClasses = match[2];
    const newDiv = originalDiv.replace(originalClasses, originalClasses + ` \${currentStep === ` + i + ` ? 'block' : 'hidden'}`);
    code = code.replace(match[0], newDiv);
  }
}

// Remove the closing )} for the 9 steps
code = code.replace(/\n\s*\)\}\n/g, '\n\n');

// Task 2: Inject Batch state and logic
const batchStateStr = `  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [batchString, setBatchString] = useState('');

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\\D/g, '');
    if (val.length > 4) {
      val = val.substring(0, 4) + '-' + val.substring(4, 8);
    }
    setBatchString(val);
  };`;
code = code.replace('  const [isDraggingRight, setIsDraggingRight] = useState(false);', batchStateStr);

// Task 3: Replace Batch input
code = code.replace('<Input label="Batch" placeholder="20__ - 20__" required />', '<Input label="Batch" placeholder="20__ - 20__" value={batchString} onChange={handleBatchChange} maxLength={9} required />');

// Task 4: Sibling details
const oldSiblingStr = `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input label="Name (Leave blank if none)" />
                          <Input label="Branch & Year" />
                          <Input label="Relation" />
                        </div>`;
const newSiblingStr = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input label="Name (Leave blank if none)" />
                          <Select 
                            label="Branch" 
                            options={[
                              {value: '', label: 'Select Branch'},
                              {value: 'CSE', label: 'B.E. CSE'},
                              {value: 'ECE', label: 'B.E. ECE'},
                              {value: 'IT', label: 'B.Tech IT'},
                              {value: 'EEE', label: 'B.E. EEE'},
                              {value: 'MECH', label: 'B.E. Mechanical'},
                              {value: 'BME', label: 'B.E. Biomedical'},
                              {value: 'AI', label: 'B.Tech AI & DS'}
                            ]} 
                          />
                          <Input label="Year" placeholder="e.g. 2nd Year" />
                          <Input label="Relation" />
                        </div>`;
code = code.replace(oldSiblingStr, newSiblingStr);

fs.writeFileSync('management-app/src/app/student/form/page.tsx', code);
console.log('TRANSFORMED');
