#!/usr/bin/env node
import fetch from 'node-fetch';

console.log('=== TESTING API ENDPOINT ===\n');

try {
  // First, we need to login as admin to get a session
  console.log('1. Logging in as admin...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ram', password: 'ram@1212' }),
  });

  const loginData = await loginRes.json();
  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Role: ${loginData.role}\n`);

  if (!loginRes.ok) {
    console.error('❌ Login failed');
    process.exit(1);
  }

  // Get cookies from response
  const cookies = loginRes.headers.get('set-cookie');
  console.log('2. Testing /api/admin/forms/latest endpoint...\n');

  const apiRes = await fetch('http://localhost:3000/api/admin/forms/latest?applicationNumber=112233', {
    headers: { 'Cookie': cookies || '' }
  });

  console.log(`   Status: ${apiRes.status}`);

  if (apiRes.status === 500) {
    console.error('❌ 500 ERROR - Still failing');
    const error = await apiRes.json();
    console.error(error);
    process.exit(1);
  }

  const data = await apiRes.json();
  
  if (data.payload) {
    console.log(`   ✅ SUCCESS - Got form data`);
    console.log(`   Fields: ${Object.keys(data.payload).length}`);
    console.log(`   Submitted at: ${data.submittedAt}\n`);
    console.log('✅ API is working correctly!');
  } else {
    console.log('⚠️  No form data');
  }

} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}
