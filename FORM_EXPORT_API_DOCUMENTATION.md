# Form Export API Documentation

## Overview
This document describes the fields available in the student application form data and how to properly export them.

## Form Data Storage

### Location
- **Table**: `student_application_forms`
- **Column**: `encrypted_payload`
- **Format**: JSON (encrypted with AES-256-CBC)

### Data Flow
1. Student fills form with all fields listed below
2. Form data is collected via FormData API
3. Additional metadata (timestamps, user agent) is added
4. Entire payload is encrypted using 256-bit key
5. Encrypted JSON stored in database
6. Export must decrypt first, then extract fields

## Complete Field List (45 fields)

### 1. Student Basic Information (9 fields)
| Field Name | Type | Required | Prefilled | Column Name |
|------------|------|----------|-----------|------------|
| student_name | string | Yes | Yes (from DB) | Student Name |
| student_branch | string | Yes | Yes (from DB) | Branch |
| student_dob | date | Yes | Yes (from DB) | Date of Birth |
| student_age | number | Yes | No | Age |
| student_gender | enum | Yes | No | Gender |
| student_specially_abled | enum | Yes | No | Specially Abled |
| student_mobile | tel | Yes | Yes (from DB) | Student Mobile |
| student_email | email | Yes | No | Student Email |
| student_aadhaar | string | Yes | No | Aadhaar Number |

**Valid Values**:
- student_gender: `male`, `female`
- student_specially_abled: `yes`, `no`

---

### 2. Father Information (5 fields)
| Field Name | Type | Required | Prefilled | Column Name |
|------------|------|----------|-----------|------------|
| father_name | string | Yes | Yes (from DB) | Father's Name |
| father_occupation_type | enum | Yes | No | Father's Occupation Type |
| father_occupation | string | Yes | No | Father's Occupation |
| father_mobile | tel | Yes | Yes (from DB) | Father's Mobile |
| father_income | number | Yes | No | Father's Annual Income (₹) |

**Valid Values**:
- father_occupation_type: `government`, `private`, `business`, `self_employed`, `other`

---

### 3. Mother Information (5 fields)
| Field Name | Type | Required | Prefilled | Column Name |
|------------|------|----------|-----------|------------|
| mother_name | string | Yes | Yes (from DB) | Mother's Name |
| mother_occupation_type | enum | Yes | No | Mother's Occupation Type |
| mother_occupation | string | Yes | No | Mother's Occupation |
| mother_mobile | tel | Yes | No | Mother's Mobile |
| mother_income | number | Yes | No | Mother's Annual Income (₹) |

**Valid Values**:
- mother_occupation_type: `government`, `private`, `business`, `self_employed`, `other`

---

### 4. Permanent Address (4 fields)
| Field Name | Type | Required | Column Name |
|------------|------|----------|------------|
| permanent_address | text | Yes | Permanent Address |
| permanent_city | string | Yes | Permanent City |
| permanent_state | string | Yes | Permanent State |
| permanent_pincode | number | Yes | Permanent Pincode |

---

### 5. Communication Address (4 fields)
| Field Name | Type | Required | Column Name |
|------------|------|----------|------------|
| communication_address | text | Yes | Communication Address |
| communication_city | string | Yes | Communication City |
| communication_state | string | Yes | Communication State |
| communication_pincode | number | Yes | Communication Pincode |

---

### 6. Admission Details (4 fields)
| Field Name | Type | Required | Column Name |
|------------|------|----------|------------|
| admission_date | date | Yes | Date of Admission |
| admission_year | string | Yes | Admission Year |
| admission_batch | string | Yes | Batch |
| admission_allotment_number | string | Yes | GQ Allotment / MQ Application No |

**Format Notes**:
- admission_year: e.g., "2026"
- admission_batch: e.g., "2023 - 2027"

---

### 7. Academic & Background (4 fields)
| Field Name | Type | Required | Column Name |
|------------|------|----------|------------|
| mother_tongue | string | Yes | Mother Tongue |
| board_studied | enum | Yes | Board Studied |
| school_location | string | Yes | School Location |
| civic_status | enum | Yes | Civic Status |

**Valid Values**:
- board_studied: `tnhsc`, `cbse`, `icse`, `other`
- civic_status: `corp` (Corporation), `muni` (Municipality), `town`, `village`

---

### 8. Personal Details (4 fields)
| Field Name | Type | Required | Column Name |
|------------|------|----------|------------|
| religion | string | Yes | Religion |
| community | enum | Yes | Community |
| caste | string | Yes | Caste |
| emis_number | string | Yes | EMIS Number |

**Valid Values**:
- community: `oc` (OC), `bc` (BC), `bcm` (BCM), `mbc` (MBC & DNT), `sc` (SC), `st` (ST)

---

### 9. System Metadata (2 fields)
| Field Name | Type | Source | Column Name |
|------------|------|--------|------------|
| submitted_at | datetime | System | Submitted At |
| userAgent | string | Browser | User Agent |

**Format**:
- submitted_at: ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")

---

### 10. Prefill Data (2 fields)
| Field Name | Type | Source | Column Name |
|------------|------|--------|------------|
| application_number | string | Student DB | Application Number |
| institutional_id | string | Student DB | Institutional ID |

---

## API Endpoints

### Submit Form
**Endpoint**: `POST /api/forms/submit`  
**Auth**: Required (student must be logged in)

**Request Body**:
```json
{
  "payload": {
    // All 43 form fields (excluding prefill which is added by system)
    "student_name": "John Doe",
    "student_branch": "CSE",
    // ... other fields
    "prefill": {
      "application_number": "APP-2023-001",
      "institutional_id": "PSN-CSE-2023-001",
      "full_name": "John Doe",
      "date_of_birth": "2003-05-15",
      "academic_branch": "CSE",
      "father_name": "Mr. Doe",
      "mother_name": "Mrs. Doe",
      "father_mobile_number": "+91 9876543210",
      "mobile_number": "+91 9123456789"
    },
    "meta": {
      "submitted_at": "2024-01-15T10:30:00.000Z",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "formId": "uuid"
}
```

---

### Save Draft
**Endpoint**: `POST /api/forms/save-draft`  
**Auth**: Required (student must be logged in)

**Request Body**:
```json
{
  "payload": {
    // Partial or complete form fields
    "student_name": "John Doe",
    // ... other fields filled so far
    "meta": {
      "saved_at": "2024-01-15T10:30:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "currentStep": 1
    }
  }
}
```

---

### Get Latest Form
**Endpoint**: `GET /api/forms/latest`  
**Auth**: Required (student)  
**Purpose**: Retrieve the latest form (submitted or draft)

**Response** (encrypted):
```json
{
  "formId": "uuid",
  "status": "submitted",
  "encrypted_payload": "encrypted-json-string",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

## Export Guidelines

### For Excel Export
1. Query: `SELECT encrypted_payload, status FROM student_application_forms WHERE status = 'submitted'`
2. For each record:
   - Decrypt `encrypted_payload` using AES-256-CBC
   - Extract all 45 fields using field names from this documentation
   - Map to corresponding Excel columns
   - Handle null/missing fields gracefully (use empty string or "N/A")

### Recommended Column Order
1. Application Number
2. Student Name
3. Institution ID
4. Branch
5. Admission Number
6. Age
7. Date of Birth
8. Gender
9. Specially Abled
10. Student Mobile
11. Student Email
12. Aadhaar Number
13. Father's Name
14. Father's Occupation Type
15. Father's Occupation
16. Father's Mobile
17. Father's Annual Income
18. Mother's Name
19. Mother's Occupation Type
20. Mother's Occupation
21. Mother's Mobile
22. Mother's Annual Income
23. Permanent Address
24. Permanent City
25. Permanent State
26. Permanent Pincode
27. Communication Address
28. Communication City
29. Communication State
30. Communication Pincode
31. Date of Admission
32. Admission Year
33. Batch
34. GQ Allotment / MQ Application No
35. Mother Tongue
36. Board Studied
37. School Location
38. Civic Status
39. Religion
40. Community
41. Caste
42. EMIS Number
43. Submitted At
44. User Agent

---

## Important Notes

1. **Encryption**: All payload data is encrypted with AES-256-CBC. Export scripts must decrypt before processing.
2. **Prefilled Fields**: Some fields come from the student database profile, not the form.
3. **Validation**: The form UI validates most fields client-side. API should also validate.
4. **File Uploads**: Document uploads (signatures, certificates) are stored separately, not in encrypted_payload.
5. **Missing Data**: Handle gracefully when optional fields are not filled.
6. **Batch Format**: Admission batch format is typically "YYYY - YYYY" (e.g., "2023 - 2027")

---

## Example Usage (Node.js)

```javascript
const crypto = require('crypto');
const db = require('./db'); // Your database module

async function exportFormsToExcel() {
  const forms = await db.query(
    'SELECT encrypted_payload FROM student_application_forms WHERE status = $1',
    ['submitted']
  );

  return forms.map(form => {
    const decrypted = decryptPayload(form.encrypted_payload);
    const payload = JSON.parse(decrypted);
    
    return {
      application_number: payload.prefill.application_number,
      student_name: payload.student_name,
      age: payload.student_age,
      // ... map all other fields
    };
  });
}

function decryptPayload(encrypted) {
  const [iv, encryptedData] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## Field Validation Rules

| Field | Validation |
|-------|-----------|
| student_age | Must be 15-60 |
| student_email | Valid email format |
| student_mobile | 10 digits after country code |
| father_income | Non-negative number |
| mother_income | Non-negative number |
| permanent_pincode | 5-6 digits |
| communication_pincode | 5-6 digits |
| admission_date | Valid date format |
| board_studied | Must be one of: tnhsc, cbse, icse, other |
| community | Must be one of: oc, bc, bcm, mbc, sc, st |

---

## Related Tables

- **students**: Source of prefill data (application_number, institutional_id, full_name, date_of_birth, academic_branch, father_name, mother_name, father_mobile_number, mobile_number)
- **student_application_forms**: Stores encrypted form data with status tracking
- **document_uploads**: Stores uploaded files separately (signatures, certificates)

