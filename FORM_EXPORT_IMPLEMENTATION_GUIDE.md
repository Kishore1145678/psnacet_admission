# Form Export Implementation Guide

## 🎯 Quick Start (5 Minutes)

### Step 1: Verify Environment
```bash
# Check encryption key exists
grep ENCRYPTION_KEY .env.local

# Should output something like:
# ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### Step 2: Test Decryption
```bash
node -e "
const crypto = require('crypto');
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
console.log('✅ Key loaded:', key.length, 'bytes');
"
```

### Step 3: Write Export Function
See "Basic Implementation" section below

---

## 🔧 Basic Implementation

### Option 1: Simple Node.js Script

```javascript
// export-forms.mjs
import crypto from 'crypto';
import pg from 'pg';
import fs from 'fs';
import XLSX from 'xlsx';

const { Client } = pg;

const db = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT)
});

function decryptPayload(encryptedString) {
  const [iv, encryptedData] = encryptedString.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

async function exportFormsToExcel() {
  try {
    await db.connect();
    
    // Query submitted forms
    const result = await db.query(
      `SELECT id, encrypted_payload, created_at 
       FROM student_application_forms 
       WHERE status = 'submitted'
       ORDER BY created_at DESC`
    );

    if (result.rows.length === 0) {
      console.log('No submitted forms found');
      return;
    }

    console.log(`Found ${result.rows.length} submitted forms`);

    // Prepare rows for Excel
    const rows = result.rows.map(form => {
      const payload = decryptPayload(form.encrypted_payload);
      
      return {
        'Application Number': payload.prefill?.application_number || '',
        'Student Name': payload.student_name || '',
        'Branch': payload.student_branch || '',
        'Age': payload.student_age || '',
        'Date of Birth': payload.student_dob || '',
        'Gender': payload.student_gender || '',
        'Student Mobile': payload.student_mobile || '',
        'Student Email': payload.student_email || '',
        'Aadhaar Number': payload.student_aadhaar || '',
        'Father Name': payload.father_name || '',
        'Father Occupation Type': payload.father_occupation_type || '',
        'Father Occupation': payload.father_occupation || '',
        'Father Mobile': payload.father_mobile || '',
        'Father Annual Income': payload.father_income || '',
        'Mother Name': payload.mother_name || '',
        'Mother Occupation Type': payload.mother_occupation_type || '',
        'Mother Occupation': payload.mother_occupation || '',
        'Mother Mobile': payload.mother_mobile || '',
        'Mother Annual Income': payload.mother_income || '',
        'Permanent Address': payload.permanent_address || '',
        'Permanent City': payload.permanent_city || '',
        'Permanent State': payload.permanent_state || '',
        'Permanent Pincode': payload.permanent_pincode || '',
        'Communication Address': payload.communication_address || '',
        'Communication City': payload.communication_city || '',
        'Communication State': payload.communication_state || '',
        'Communication Pincode': payload.communication_pincode || '',
        'Date of Admission': payload.admission_date || '',
        'Admission Year': payload.admission_year || '',
        'Batch': payload.admission_batch || '',
        'GQ Allotment / MQ Application No': payload.admission_allotment_number || '',
        'Mother Tongue': payload.mother_tongue || '',
        'Board Studied': payload.board_studied || '',
        'School Location': payload.school_location || '',
        'Civic Status': payload.civic_status || '',
        'Religion': payload.religion || '',
        'Community': payload.community || '',
        'Caste': payload.caste || '',
        'EMIS Number': payload.emis_number || '',
        'Submitted At': payload.meta?.submitted_at || ''
      };
    });

    // Create workbook and write to file
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Forms');
    
    const filename = `forms_export_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    console.log(`✅ Export successful: ${filename}`);
    console.log(`   - ${rows.length} rows`);
    console.log(`   - ${Object.keys(rows[0] || {}).length} columns`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    await db.end();
  }
}

exportFormsToExcel();
```

### Option 2: API Endpoint

```typescript
// src/api/admin/export-forms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { decryptPayload } from '@/lib/crypto';
import XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    // Check admin auth
    const session = req.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    
    // Get all submitted forms
    const result = await db.query(
      `SELECT id, encrypted_payload, created_at 
       FROM student_application_forms 
       WHERE status = 'submitted'`
    );

    // Decrypt and map to Excel columns
    const rows = result.rows.map(form => {
      const payload = decryptPayload(form.encrypted_payload);
      return mapPayloadToExcelRow(payload);
    });

    // Generate Excel file
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Forms');
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="forms_${Date.now()}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function mapPayloadToExcelRow(payload: any) {
  return {
    'Application Number': payload.prefill?.application_number || '',
    'Student Name': payload.student_name || '',
    'Branch': payload.student_branch || '',
    // ... map all 45 fields
  };
}
```

---

## ✅ Implementation Checklist

### Pre-Implementation
- [ ] Verify `.env.local` has `ENCRYPTION_KEY` set
- [ ] Confirm database credentials work
- [ ] Ensure PostgreSQL driver is installed
- [ ] Verify at least one form has been submitted
- [ ] Check that `xlsx` or similar Excel library is available

### Implementation
- [ ] Create export function with decryption
- [ ] Map all 45 form fields to output columns
- [ ] Handle null/empty values gracefully
- [ ] Add error handling and logging
- [ ] Test with sample data
- [ ] Verify column order matches requirements
- [ ] Add proper formatting (dates, numbers)

### Testing
- [ ] [ ] Test with single form
- [ ] [ ] Test with multiple forms
- [ ] [ ] Verify all fields populate correctly
- [ ] [ ] Check date formatting
- [ ] [ ] Verify enum values are captured
- [ ] [ ] Test with missing optional fields
- [ ] [ ] Generate sample export file

### Deployment
- [ ] Add to your export endpoint/script
- [ ] Add authentication/authorization
- [ ] Add rate limiting if needed
- [ ] Add audit logging
- [ ] Document for admin users

---

## 🐛 Troubleshooting

### Problem: "ENCRYPTION_KEY is undefined"
**Solution**: 
```bash
# Set in terminal
export ENCRYPTION_KEY=your_key_here
# or in .env.local
ENCRYPTION_KEY=your_key_here
# or load dynamically
const key = process.env.ENCRYPTION_KEY || fs.readFileSync('.env.local', 'utf8').match(/ENCRYPTION_KEY=(.+)/)?.[1];
```

### Problem: "Cannot read property 'split' of null"
**Solution**: 
```javascript
// Add null check
if (!encryptedPayload) {
  console.warn('No encrypted payload found');
  return {};
}
// or check for draft forms
WHERE status = 'submitted' AND encrypted_payload IS NOT NULL
```

### Problem: "Decipher error: 08:02:0F (bad decrypt)"
**Solution**: 
```javascript
// Verify encryption key is correct
const keyLength = Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length;
console.log('Key length:', keyLength, '(should be 32 for AES-256)');

// Verify format is iv:data
if (!encryptedPayload.includes(':')) {
  console.error('Invalid format: missing colon separator');
}
```

### Problem: "JSON.parse error"
**Solution**: 
```javascript
// Add error handling
try {
  return JSON.parse(decrypted);
} catch (e) {
  console.error('Invalid JSON:', decrypted.substring(0, 100));
  return {};
}
```

---

## 📝 Field Mapping Template

Use this when implementing export:

```javascript
const fieldMapping = {
  // Student Info
  'Application Number': payload.prefill?.application_number,
  'Student Name': payload.student_name,
  'Branch': payload.student_branch,
  'Age': payload.student_age,
  'Date of Birth': payload.student_dob,
  'Gender': payload.student_gender,
  'Specially Abled': payload.student_specially_abled,
  'Student Mobile': payload.student_mobile,
  'Student Email': payload.student_email,
  'Aadhaar Number': payload.student_aadhaar,
  
  // Father Info
  'Father Name': payload.father_name,
  'Father Occupation Type': payload.father_occupation_type,
  'Father Occupation': payload.father_occupation,
  'Father Mobile': payload.father_mobile,
  'Father Annual Income': payload.father_income,
  
  // Mother Info
  'Mother Name': payload.mother_name,
  'Mother Occupation Type': payload.mother_occupation_type,
  'Mother Occupation': payload.mother_occupation,
  'Mother Mobile': payload.mother_mobile,
  'Mother Annual Income': payload.mother_income,
  
  // Permanent Address
  'Permanent Address': payload.permanent_address,
  'Permanent City': payload.permanent_city,
  'Permanent State': payload.permanent_state,
  'Permanent Pincode': payload.permanent_pincode,
  
  // Communication Address
  'Communication Address': payload.communication_address,
  'Communication City': payload.communication_city,
  'Communication State': payload.communication_state,
  'Communication Pincode': payload.communication_pincode,
  
  // Admission Details
  'Date of Admission': payload.admission_date,
  'Admission Year': payload.admission_year,
  'Batch': payload.admission_batch,
  'GQ Allotment / MQ Application No': payload.admission_allotment_number,
  
  // Academic Background
  'Mother Tongue': payload.mother_tongue,
  'Board Studied': payload.board_studied,
  'School Location': payload.school_location,
  'Civic Status': payload.civic_status,
  
  // Personal Details
  'Religion': payload.religion,
  'Community': payload.community,
  'Caste': payload.caste,
  'EMIS Number': payload.emis_number,
  
  // Metadata
  'Submitted At': payload.meta?.submitted_at,
  'User Agent': payload.meta?.userAgent,
};
```

---

## 🚀 Production Checklist

- [ ] Encryption key is secure (not in version control)
- [ ] Export function has error handling
- [ ] Logging is in place for debugging
- [ ] Rate limiting prevents abuse
- [ ] Only authenticated admins can export
- [ ] Exported files are temporary (auto-delete)
- [ ] Large exports use streaming
- [ ] Performance is acceptable (< 30 seconds for 1000+ forms)
- [ ] Fields are properly formatted (dates, numbers)
- [ ] Null values handled consistently

---

## 📚 Reference Documents

All fields and their mapping information are available in:
- `FORM_FIELD_MAPPING.js` - Structured field definitions
- `FORM_EXPORT_API_DOCUMENTATION.md` - Complete API docs
- `FORM_EXPORT_QUICK_REFERENCE.md` - Quick lookup
- `FORM_ARCHITECTURE_AND_FLOW.md` - System architecture

---

## 💬 Common Questions

**Q: Can I export just specific fields?**  
A: Yes, in fieldMapping, just include the fields you need.

**Q: How often are forms submitted?**  
A: Check `submitted_at` in metadata to track submission times.

**Q: What if a field is empty?**  
A: Always use `|| ''` to provide default value.

**Q: Can I include file attachments in export?**  
A: Signatures/documents are stored separately. Include their file paths or download URLs as additional columns.

**Q: How do I filter exports by date range?**  
A: Add to WHERE clause: `AND f.created_at >= $1 AND f.created_at <= $2`

**Q: How do I handle very large exports?**  
A: Use streaming with chunks, or use database cursor to process records in batches.

