# Form Export Quick Reference

## 📋 Summary

The student application form collects **45 fields** organized in 10 categories:
- Student Info: 9 fields
- Father Info: 5 fields  
- Mother Info: 5 fields
- Permanent Address: 4 fields
- Communication Address: 4 fields
- Admission Details: 4 fields
- Academic Background: 4 fields
- Personal Details: 4 fields
- Metadata: 2 fields
- Prefill Data: 2 fields

## 🗃️ Database Location

```sql
-- Find submitted forms with encrypted data
SELECT 
  s.id,
  s.application_number,
  s.full_name,
  f.id as form_id,
  f.encrypted_payload,
  f.status,
  f.created_at,
  f.updated_at
FROM students s
LEFT JOIN student_application_forms f ON f.student_id = s.id
WHERE f.status = 'submitted';
```

## 🔐 Encryption Details

- **Algorithm**: AES-256-CBC
- **Format**: `iv:encrypted_data` (hex-encoded)
- **Key Source**: `process.env.ENCRYPTION_KEY` (256-bit hex string)
- **Payload Format**: JSON string

### Decryption Example
```javascript
const crypto = require('crypto');

function decryptFormData(encryptedData, key) {
  const [iv, data] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  let result = decipher.update(data, 'hex', 'utf8');
  result += decipher.final('utf8');
  return JSON.parse(result);
}

// Usage
const key = process.env.ENCRYPTION_KEY;
const payload = decryptFormData(form.encrypted_payload, key);
console.log(payload.student_name); // "John Doe"
```

## 📊 Export Column Names (Excel/CSV)

Use these exact names as headers:

```
[1] Application Number          [23] Permanent Address
[2] Institutional ID            [24] Permanent City
[3] Student Name                [25] Permanent State
[4] Branch                      [26] Permanent Pincode
[5] Age                         [27] Communication Address
[6] Date of Birth               [28] Communication City
[7] Gender                      [29] Communication State
[8] Specially Abled             [30] Communication Pincode
[9] Student Mobile              [31] Date of Admission
[10] Student Email              [32] Admission Year
[11] Aadhaar Number             [33] Batch
[12] Father's Name              [34] GQ Allotment / MQ Application No
[13] Father's Occupation Type   [35] Mother Tongue
[14] Father's Occupation        [36] Board Studied
[15] Father's Mobile            [37] School Location
[16] Father's Annual Income     [38] Civic Status
[17] Mother's Name              [39] Religion
[18] Mother's Occupation Type   [40] Community
[19] Mother's Occupation        [41] Caste
[20] Mother's Mobile            [42] EMIS Number
[21] Mother's Annual Income     [43] Submitted At
[22] Submitted At               [44] User Agent
```

## 🔍 Common Issues & Solutions

### Issue 1: "Payload not decrypting"
**Solution**: 
- Verify `ENCRYPTION_KEY` environment variable is set
- Check key is 64 hex characters (256 bits)
- Ensure format is exactly `iv:data` with colon separator

### Issue 2: "JSON.parse error"
**Solution**:
- Ensure decryption completed without errors
- Check for null/undefined encrypted_payload
- Some forms might be null if drafts were saved but never submitted

### Issue 3: "Missing fields in decrypted data"
**Solution**:
- Some fields may not be filled if form was incomplete
- Always use null coalescing: `payload.field || ''`
- System fields only added on final submission, not drafts
- Check `payload.meta.submitted_at` to verify it's a submitted form

### Issue 4: "Prefill fields not matching database"
**Solution**:
- Prefill data is a snapshot at submission time
- May differ from current student profile if profile was updated after submission
- Use prefill data for consistency with what student submitted

## 📝 Field Breakdown by Category

### Student Basic Info (9)
- student_name, student_branch, student_dob, student_age
- student_gender, student_specially_abled, student_mobile
- student_email, student_aadhaar

### Parent Info (10)
- father_name, father_occupation_type, father_occupation, father_mobile, father_income
- mother_name, mother_occupation_type, mother_occupation, mother_mobile, mother_income

### Addresses (8)
- permanent_address, permanent_city, permanent_state, permanent_pincode
- communication_address, communication_city, communication_state, communication_pincode

### Admission (4)
- admission_date, admission_year, admission_batch, admission_allotment_number

### Academic (4)
- mother_tongue, board_studied, school_location, civic_status

### Personal (4)
- religion, community, caste, emis_number

### System (4)
- submitted_at, userAgent (in payload.meta)
- application_number, institutional_id (in payload.prefill)

## ✅ Validation Checklist

Before exporting, verify:
- [ ] Encryption key is properly loaded
- [ ] Database connection is working
- [ ] Can decrypt at least one sample form
- [ ] Decrypted JSON has expected structure
- [ ] All 45 fields are present (some may be null/empty)
- [ ] Timestamps are in ISO 8601 format
- [ ] Enum values match expected options

## 🎯 Quick Test Script

```javascript
// Quick test to verify form data structure
const crypto = require('crypto');

async function testFormDecryption(db) {
  const form = await db.query(
    `SELECT encrypted_payload FROM student_application_forms 
     WHERE status = 'submitted' LIMIT 1`
  );
  
  if (!form.rows.length) {
    console.log('No submitted forms found');
    return;
  }

  try {
    const decrypted = decryptFormData(
      form.rows[0].encrypted_payload,
      process.env.ENCRYPTION_KEY
    );
    
    console.log('✅ Decryption successful');
    console.log('Fields found:', Object.keys(decrypted).sort());
    console.log('Student name:', decrypted.student_name);
    console.log('Submitted at:', decrypted.meta?.submitted_at);
    console.log('Total fields:', Object.keys(decrypted).length);
    
  } catch (error) {
    console.error('❌ Decryption failed:', error.message);
  }
}
```

## 📂 Related Files

- `FORM_FIELD_MAPPING.js` - Detailed field-to-column mapping
- `FORM_EXPORT_API_DOCUMENTATION.md` - Complete API documentation
- `src/app/student/form/page.tsx` - Form implementation
- `src/lib/crypto.ts` - Encryption utilities
- `src/api/forms/submit/route.ts` - Form submission endpoint

## 🚀 Next Steps

1. Verify encryption key is available
2. Write decryption function
3. Query submitted forms
4. Decrypt each payload
5. Map fields to Excel columns
6. Handle missing/null values
7. Generate export file
8. Test with sample data

## 💡 Pro Tips

- Cache the decryption function to avoid repeated initialization
- Use streaming for large exports (100+ forms)
- Add retry logic for database timeouts
- Log decryption errors for debugging
- Validate enum fields before export
- Format dates consistently (ISO 8601 or dd/mm/yyyy)

