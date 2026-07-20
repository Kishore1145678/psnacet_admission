# Form Data Architecture & Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STUDENT APPLICATION FORM                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Frontend (src/app/student/form/page.tsx)                        │   │
│  │ - React component                                               │   │
│  │ - 3 steps (Student Info → Parent & Address → Admission)        │   │
│  │ - Collects 43 form fields                                      │   │
│  │ - Uses FormData API to gather input values                     │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Form Data Collection (in page.tsx)                              │   │
│  │ - Creates FormData from <form> element                          │   │
│  │ - Iterates through all entries                                  │   │
│  │ - Skips File uploads (stored separately)                        │   │
│  │ - Builds payload object with all text fields                    │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Enrichment (in page.tsx - submitForm function)                  │   │
│  │                                                                  │   │
│  │ payload.prefill = {                                             │   │
│  │   application_number: from DB                                   │   │
│  │   institutional_id: from DB                                     │   │
│  │   full_name: from DB                                            │   │
│  │   date_of_birth: from DB                                        │   │
│  │   academic_branch: from DB                                      │   │
│  │   father_name: from DB                                          │   │
│  │   mother_name: from DB                                          │   │
│  │   father_mobile_number: from DB                                 │   │
│  │   mobile_number: from DB                                        │   │
│  │ }                                                                │   │
│  │                                                                  │   │
│  │ payload.meta = {                                                │   │
│  │   submitted_at: new Date().toISOString()                       │   │
│  │   userAgent: navigator.userAgent                                │   │
│  │ }                                                                │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│                    POST /api/forms/submit                                │
│                    JSON.stringify({ payload })                           │
│                                      │                                   │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Backend)                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ /api/forms/submit (src/api/forms/submit/route.ts)              │   │
│  │ - Authenticate user (session check)                             │   │
│  │ - Validate form data                                            │   │
│  │ - Trigger encryption                                            │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Encryption (src/lib/crypto.ts - encryptPayload)                │   │
│  │                                                                  │   │
│  │ 1. Generate random IV (16 bytes)                                │   │
│  │ 2. Create AES-256-CBC cipher with IV                            │   │
│  │ 3. Encrypt JSON string of payload                               │   │
│  │ 4. Return "iv:encryptedData" (hex encoded)                      │   │
│  │                                                                  │   │
│  │ Example output:                                                 │   │
│  │ "a3f2e1d4c5b6a7f8e9d0c1b2a3f4e5d6:f8e9d0c1b2a3f4e5..."      │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
│                                      ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Database Insert (route.ts)                                      │   │
│  │                                                                  │   │
│  │ INSERT INTO student_application_forms (                         │   │
│  │   student_id,                                                   │   │
│  │   status,                                                       │   │
│  │   encrypted_payload,                                            │   │
│  │   created_at,                                                   │   │
│  │   updated_at                                                    │   │
│  │ ) VALUES (...)                                                  │   │
│  └──────────────────────────────────┬──────────────────────────────┘   │
│                                      │                                   │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       DATABASE (PostgreSQL)                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Table: student_application_forms                                │   │
│  │                                                                  │   │
│  │ id (UUID PRIMARY KEY)                                            │   │
│  │ student_id (FK -> students.id)                                   │   │
│  │ status (VARCHAR: 'draft' | 'submitted')                          │   │
│  │ encrypted_payload (TEXT)  ◄─── STORE ENCRYPTED DATA HERE        │   │
│  │ created_at (TIMESTAMP)                                           │   │
│  │ updated_at (TIMESTAMP)                                           │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                      │                                   │
└──────────────────────────────────────┼──────────────────────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                            │
                 ▼ (on export)                               ▼ (on view)
        ┌──────────────────────┐              ┌──────────────────────┐
        │   EXPORT WORKFLOW    │              │   VIEW WORKFLOW      │
        └──────────────────────┘              └──────────────────────┘
```

## 📊 Form Data Structure

### Complete Payload Structure (After Enrichment)

```json
{
  // === STUDENT INFO (from form input + DB prefill) ===
  "student_name": "John Doe",
  "student_branch": "CSE",
  "student_dob": "2003-05-15",
  "student_age": 21,
  "student_gender": "male",
  "student_specially_abled": "no",
  "student_mobile": "+91 9876543210",
  "student_email": "john@example.com",
  "student_aadhaar": "1234 5678 9012",

  // === PARENT INFO ===
  "father_name": "Mr. Doe",
  "father_occupation_type": "government",
  "father_occupation": "Engineer",
  "father_mobile": "+91 9876543210",
  "father_income": 500000,

  "mother_name": "Mrs. Doe",
  "mother_occupation_type": "private",
  "mother_occupation": "Doctor",
  "mother_mobile": "+91 9876543211",
  "mother_income": 450000,

  // === ADDRESSES ===
  "permanent_address": "123 Main Street",
  "permanent_city": "Chennai",
  "permanent_state": "Tamil Nadu",
  "permanent_pincode": 600001,

  "communication_address": "456 Elm Street",
  "communication_city": "Chennai",
  "communication_state": "Tamil Nadu",
  "communication_pincode": 600002,

  // === ADMISSION ===
  "admission_date": "2023-06-15",
  "admission_year": "2026",
  "admission_batch": "2023 - 2027",
  "admission_allotment_number": "CSE-2023-001",

  // === ACADEMIC ===
  "mother_tongue": "Tamil",
  "board_studied": "tnhsc",
  "school_location": "Chennai",
  "civic_status": "corp",

  // === PERSONAL ===
  "religion": "Hindu",
  "community": "oc",
  "caste": "Brahmin",
  "emis_number": "TN-2023-012345",

  // === SYSTEM FIELDS (auto-added) ===
  "prefill": {
    "application_number": "APP-2023-001",
    "institutional_id": "PSN-CSE-2023-001",
    "full_name": "John Doe",
    "date_of_birth": "2003-05-15",
    "academic_branch": "CSE",
    "father_name": "Mr. Doe",
    "mother_name": "Mrs. Doe",
    "father_mobile_number": "+91 9876543210",
    "mobile_number": "+91 9876543210"
  },

  "meta": {
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
  }
}
```

## 🔄 Export Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Export Process Flow                                             │
└─────────────────────────────────────────────────────────────────┘

1. QUERY DATABASE
   └─► SELECT encrypted_payload, status FROM student_application_forms
       WHERE status = 'submitted'

2. FOR EACH FORM RECORD
   │
   ├─► Extract encrypted_payload
   │   Format: "iv:encryptedData" (hex encoded)
   │
   ├─► DECRYPT
   │   ├─ Parse iv and encryptedData from hex
   │   ├─ Create decipher with AES-256-CBC algorithm
   │   ├─ Use environment ENCRYPTION_KEY (256-bit)
   │   └─ Result: Plain text JSON string
   │
   ├─► PARSE JSON
   │   └─ Convert string to JavaScript object
   │
   └─► EXTRACT FIELDS
       ├─ Map payload.student_name → Column "Student Name"
       ├─ Map payload.student_age → Column "Age"
       ├─ Map payload.prefill.application_number → Column "Application Number"
       ├─ ... (repeat for all 45 fields)
       └─ Write to Excel/CSV row

3. GENERATE EXPORT FILE
   └─► Write all rows to Excel/CSV file

4. SAVE/DOWNLOAD
   └─► Save file or send to client
```

## 🔐 Encryption/Decryption Details

### Encryption Process (On Submit)
```
Input: JavaScript Object (payload)
  ↓
JSON.stringify(payload)
  ↓
Generate random IV (16 bytes)
  ↓
Create cipher: crypto.createCipheriv('aes-256-cbc', key, iv)
  ↓
Encrypt JSON string
  ↓
Convert IV and encrypted data to hex
  ↓
Format: "iv_hex:encrypted_hex"
  ↓
Store in database
```

### Decryption Process (On Export)
```
Input: "iv_hex:encrypted_hex" from database
  ↓
Split by ':' to get iv_hex and encrypted_hex
  ↓
Convert hex strings back to buffers
  ↓
Create decipher: crypto.createDecipheriv('aes-256-cbc', key, iv)
  ↓
Decrypt encrypted_hex
  ↓
Result: Plain text JSON string
  ↓
JSON.parse() to get object
  ↓
Extract all 45 fields
```

## 📋 Field Category Distribution

```
Student Basic Info      ▓▓▓▓▓▓▓▓▓         [9 fields]
Father Info             ▓▓▓▓▓              [5 fields]
Mother Info             ▓▓▓▓▓              [5 fields]
Permanent Address       ▓▓▓▓               [4 fields]
Communication Address   ▓▓▓▓               [4 fields]
Admission Details       ▓▓▓▓               [4 fields]
Academic Background     ▓▓▓▓               [4 fields]
Personal Details        ▓▓▓▓               [4 fields]
Metadata                ▓▓                 [2 fields]
Prefill Data            ▓▓                 [2 fields]
                                     ───────────────
                                   TOTAL: 45 fields
```

## 🔗 Related Code Locations

```
Frontend
├─ src/app/student/form/page.tsx
│  ├─ Form inputs (all 43 fields)
│  ├─ FormData collection (lines 488-495)
│  ├─ Payload enrichment (lines 498-510)
│  └─ Submit function (lines 540-560)
│
Backend - API
├─ src/api/forms/submit/route.ts
│  ├─ Authentication check
│  ├─ Encryption call
│  └─ Database insert
│
Backend - Utilities
├─ src/lib/crypto.ts
│  ├─ encryptPayload()
│  └─ decryptPayload()
│
Database
├─ db/schema.sql
│  └─ student_application_forms table definition
│
Export
├─ src/api/admin/export/route.ts (if exists)
│  ├─ Query forms
│  ├─ Decrypt each payload
│  └─ Generate Excel/CSV
```

## ⚙️ Configuration

```env
# .env.local
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

# 256-bit key (64 hex characters)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🎯 Key Points to Remember

1. **45 Total Fields**: 43 from form input + 2 system metadata
2. **Encrypted at Rest**: All payload encrypted with AES-256-CBC before DB storage
3. **Prefill Data**: Some fields (9) come from student profile, not form
4. **Two Submission Types**: Forms can be "draft" (partial) or "submitted" (complete)
5. **IV Format**: Initialization Vector is prepended to encrypted data: "iv:data"
6. **Null Safe**: Always handle missing/null fields in export
7. **Timestamp Sensitive**: Use payload.meta.submitted_at for accurate timing
8. **User Agent**: Captured for audit and debugging purposes

