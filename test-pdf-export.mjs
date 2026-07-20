#!/usr/bin/env node
import fetch from 'node:fetch';
import fs from 'fs';
import path from 'path';

console.log('=== TESTING PDF EXPORT ===\n');

const testPDF = async () => {
  try {
    console.log('Fetching PDF for student 112233...\n');

    const res = await fetch('http://localhost:3000/api/admin/export-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationNumber: '112233' }),
    });

    console.log(`Response Status: ${res.status}\n`);

    if (res.status === 401) {
      console.log('⚠️  Need authentication (expected for API)');
      console.log('✅ API endpoint is reachable!');
      return;
    }

    if (!res.ok) {
      const error = await res.text();
      console.error(`❌ Error: ${error}`);
      return;
    }

    const buffer = await res.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);
    
    const filename = `Naresh_${new Date().toISOString().split('T')[0]}.pdf`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, pdfBuffer);
    
    console.log(`✅ PDF Generated Successfully!`);
    console.log(`   File: ${filename}`);
    console.log(`   Size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Path: ${filepath}\n`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  }
};

testPDF();
