// Test single student export
console.log('Testing single student export API...\n');

// Step 1: Login
console.log('[1/3] Logging in...');
const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'ram', password: 'ram@1212' })
});

if (!loginRes.ok) {
  console.error('❌ Login failed:', loginRes.status);
  process.exit(1);
}

const cookies = loginRes.headers.get('set-cookie') || '';
console.log('✅ Logged in');

// Step 2: Get a real student
console.log('\n[2/3] Fetching real students...');
const studentsRes = await fetch('http://localhost:3000/api/students', {
  headers: { 'Cookie': cookies }
});

const studentsData = await studentsRes.json();
console.log('Students response:', studentsData);

if (!studentsData.students || studentsData.students.length === 0) {
  console.error('❌ No students found');
  process.exit(1);
}

const student = studentsData.students[0];
console.log('\n✅ Got student:', {
  id: student.id,
  name: student.name,
  department: student.department,
  completionStatus: student.completionStatus,
  fieldsCount: Object.keys(student).length
});

console.log('Student object keys:', Object.keys(student).sort());

// Step 3: Export single student
console.log('\n[3/3] Exporting single student...');

const exportData = {
  id: student.id,
  name: student.name,
  department: student.department || 'Unknown',
  mobile: student.mobile,
  dob: student.dob,
  fatherName: student.fatherName,
  motherName: student.motherName,
  date: student.date || new Date().toISOString().split('T')[0],
  status: student.completionStatus,
  // Include all other fields that were added
  age: student.age,
  caste: student.caste,
  religion: student.religion,
  motherTongue: student.motherTongue,
  nationality: student.nationality,
  civicStatus: student.civicStatus,
  residentialStatus: student.residentialStatus,
  speciallyAbled: student.speciallyAbled,
  fatherOccupation: student.fatherOccupation,
  fatherIncome: student.fatherIncome,
  motherOccupation: student.motherOccupation,
  motherIncome: student.motherIncome,
  guardian: student.guardian,
  relativesInCollege: student.relativesInCollege,
  address: student.address,
  district: student.district,
  state: student.state,
  fatherMobile: student.fatherMobile,
  motherMobile: student.motherMobile,
  hscBoard: student.hscBoard,
  gqMqNumber: student.gqMqNumber,
  gqMqType: student.gqMqType,
  schoolLocation: student.schoolLocation,
  emisNo: student.emisNo,
  studiedTN: student.studiedTN,
  govtSchool: student.govtSchool,
  batch: student.batch,
  admissionYear: student.admissionYear,
  cutoff: student.cutoff,
  pcmTarget: student.pcmTarget,
  physicsMark: student.physicsMark,
  chemistryMark: student.chemistryMark,
  mathsMark: student.mathsMark,
  isLocked: student.isLocked,
  extendedDays: student.extendedDays,
  hearAboutPSNA: student.hearAboutPSNA
};

const exportReq = {
  students: [exportData],
  useCustomPath: true
};

console.log('Export request:', JSON.stringify(exportReq, null, 2));

const exportRes = await fetch('http://localhost:3000/api/admin/export-excel', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': cookies
  },
  body: JSON.stringify(exportReq)
});

const result = await exportRes.json();
console.log('\nExport Response:');
console.log('  Status:', exportRes.status);
console.log('  Success:', exportRes.ok);
console.log('  Result:', JSON.stringify(result, null, 2));

if (exportRes.ok) {
  console.log('\n✅ SINGLE STUDENT EXPORT SUCCESSFUL!');
  console.log('File:', result.filepath);
  console.log('Size:', result.fileSize, 'bytes');
  console.log('Sheets:', result.sheetsCreated);
}
