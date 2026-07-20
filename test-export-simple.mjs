// Simple test for export API
console.log('Testing export API...\n');

// Step 1: Login to get session
console.log('[1/2] Logging in...');
const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ram', password: 'ram@1212' })
});

if (!loginRes.ok) {
  console.error('❌ Login failed:', loginRes.status);
  process.exit(1);
}

// Get session cookies
const cookies = loginRes.headers.get('set-cookie') || '';
console.log('✅ Logged in, got session');

const testData = {
  students: [
    {
      id: 'test-001',
      name: 'Test Student 1',
      department: 'CSE',
      mobile: '9876543210',
      dob: '2000-01-15',
      fatherName: 'Father Test',
      motherName: 'Mother Test',
      date: new Date().toISOString().split('T')[0],
      status: 'Complete'
    },
    {
      id: 'test-002',
      name: 'Test Student 2',
      department: 'ECE',
      mobile: '9876543211',
      dob: '2000-02-15',
      fatherName: 'Father Test 2',
      motherName: 'Mother Test 2',
      date: new Date().toISOString().split('T')[0],
      status: 'Complete'
    }
  ],
  useCustomPath: true
};

console.log('\n[2/2] Testing export API...');
console.log('Request data:');
console.log(JSON.stringify(testData, null, 2));
console.log('\nSending to http://localhost:3000/api/admin/export-excel...\n');

fetch('http://localhost:3000/api/admin/export-excel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify(testData)
})
  .then(async (res) => {
    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    const data = await res.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if file exists
    console.log('\n\nChecking if file was created...');
    const fs = await import('fs');
    const filepath = data.filepath;
    if (filepath && fs.existsSync(filepath)) {
      console.log('✅ File exists:', filepath);
      const stats = fs.statSync(filepath);
      console.log('   Size:', stats.size, 'bytes');
      console.log('   Created:', stats.birthtime);
    } else {
      console.log('❌ File not found at:', filepath);
      
      // List what's in the directory
      console.log('\nDirectory contents:');
      const dirPath = 'E:\\nodel_excel';
      try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          console.log('   (empty)');
        } else {
          files.forEach(f => {
            const fpath = `${dirPath}\\${f}`;
            const fstats = fs.statSync(fpath);
            console.log(`   - ${f} (${fstats.size} bytes)`);
          });
        }
      } catch (e) {
        console.log('   Error reading directory:', e.message);
      }
    }
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
