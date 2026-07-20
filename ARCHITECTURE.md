# Student Management Application - Comprehensive Architecture Overview

## 1. DATABASE ARCHITECTURE

### Database: PostgreSQL
**Connection**: `DATABASE_URL` environment variable (postgresql://...)

### Core Tables

#### `admin_accounts`
```sql
- id: SERIAL PRIMARY KEY
- username: TEXT UNIQUE NOT NULL
- password_hash: TEXT NOT NULL (bcrypt)
- updated_at: TIMESTAMPTZ
```
**Purpose**: Stores admin user credentials for access control

#### `students`
```sql
- id: UUID PRIMARY KEY (gen_random_uuid)
- application_number: TEXT UNIQUE NOT NULL
- institutional_id: TEXT UNIQUE NOT NULL (auto-generated)
- full_name: TEXT NOT NULL
- date_of_birth: DATE NOT NULL
- academic_branch: TEXT NOT NULL (department)
- father_name: TEXT (optional)
- mother_name: TEXT (optional)
- father_mobile_number: TEXT (optional)
- mobile_number: TEXT (optional)
- status: TEXT DEFAULT 'In Review' (In Review|Approved|Rejected)
- completion_status: TEXT DEFAULT 'Complete' (Complete|Partial)
- is_locked: BOOLEAN DEFAULT FALSE (admin-locked)
- access_expires_at: TIMESTAMPTZ (time-based access expiration)
- form_submitted_at: TIMESTAMPTZ (when student submitted form)
- extended_days: INT DEFAULT 0 (days to extend access)
- additional_info: JSONB DEFAULT '{}' (flexible additional data)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```
**Purpose**: Stores all student data and submission status

#### `student_application_forms`
```sql
- id: BIGSERIAL PRIMARY KEY
- student_id: UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
- encrypted_payload: JSONB NOT NULL (encrypted form data using AES-256-GCM)
- status: TEXT DEFAULT 'draft' (draft|submitted)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

INDEXES:
- idx_forms_student_created (student_id, created_at DESC)
- idx_forms_status (status)
```
**Purpose**: Stores student form submissions with encrypted data

#### `student_documents`
```sql
- id: BIGSERIAL PRIMARY KEY
- student_id: UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE
- document_category: TEXT NOT NULL
- file_name: TEXT NOT NULL (original filename)
- file_key: TEXT UNIQUE NOT NULL (generated key for storage)
- file_size: INT NOT NULL
- file_type: TEXT NOT NULL (MIME type)
- uploaded_at: TIMESTAMPTZ DEFAULT NOW()

INDEXES:
- idx_docs_student (student_id)
- idx_docs_category (document_category)
```
**Purpose**: Tracks file uploads and metadata

#### `custom_departments`
```sql
- id: SERIAL PRIMARY KEY
- short_code: TEXT UNIQUE NOT NULL
- full_name: TEXT NOT NULL
```
**Purpose**: Stores custom department/branch definitions

#### `sessions`
```sql
- token: UUID PRIMARY KEY (gen_random_uuid)
- kind: TEXT NOT NULL CHECK (kind IN ('admin', 'student'))
- admin_username: TEXT (populated for admin sessions)
- student_id: UUID REFERENCES students(id) ON DELETE CASCADE
- expires_at: TIMESTAMPTZ NOT NULL (7-day default)
- created_at: TIMESTAMPTZ

INDEX:
- idx_sessions_expires (expires_at)
```
**Purpose**: Tracks authenticated sessions for both roles

#### `admin_settings` (dynamic table, created on-demand)
```sql
- id: BIGSERIAL PRIMARY KEY
- key: VARCHAR(255) UNIQUE NOT NULL
- value: TEXT
- updated_at: TIMESTAMPTZ DEFAULT NOW()
```
**Purpose**: Stores admin configuration (e.g., excel_export_path)

---

## 2. DATA STORAGE AND RELATIONSHIPS

### Data Storage Organization

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT DATA FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  students table (Core)                                       │
│  ├── Personal Info (name, DOB, branch)                      │
│  ├── Contact Info (mobile, father mobile)                   │
│  ├── Status Tracking (status, is_locked, completion_status) │
│  ├── Access Control (access_expires_at, form_submitted_at)  │
│  └── Timestamps (created_at, updated_at)                    │
│                                                               │
│  student_application_forms (Child via FK)                    │
│  ├── Encrypted form payload (AES-256-GCM)                   │
│  ├── Draft versions                                          │
│  └── Submitted versions                                      │
│                                                               │
│  student_documents (Child via FK)                            │
│  ├── File metadata                                           │
│  └── File references (stored in public/uploads/)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Encryption

**Form Data Encryption**: AES-256-GCM (symmetric)
- **Key**: 32 bytes, base64 encoded from `ENCRYPTION_KEY_BASE64` env var
- **Payload Format** (encrypted_payload in DB):
  ```json
  {
    "v": 1,
    "alg": "aes-256-gcm",
    "iv": "base64_string",
    "tag": "base64_string",
    "data": "base64_ciphertext"
  }
  ```
- **Location**: [src/lib/crypto.ts](src/lib/crypto.ts)
- **Usage**: Form submissions encrypted at rest, decrypted server-side for exports

**Password Handling**:
- Student password = DOB formatted as YYYYMMDD
- Computed from `date_of_birth` at login time
- Admin passwords = bcrypt hashed

### File Storage

- **Location**: `public/uploads/` directory
- **File Key Format**: `{student_id}_{timestamp}_{filename}`
- **Metadata**: Stored in `student_documents` table
- **Access**: Admin can download/delete, students can upload/delete their own

---

## 3. API ROUTES

### Authentication Routes

#### `POST /api/auth/login`
- **Auth**: Public
- **Input**: `{ username, password }`
- **Logic**:
  1. Check if username is admin or student (via app number)
  2. Admin: verify bcrypt hash
  3. Student: compute expected password from DOB, check access_expires_at, is_locked, form_submitted_at
  4. Create session token with 7-day expiration
  5. Set httpOnly cookie
- **Output**: `{ ok: boolean, role: 'admin'|'student', student?: {...} }`
- **File**: [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)

#### `POST /api/auth/logout`
- **Auth**: Authenticated (any role)
- **Logic**: Delete session from DB, clear cookie
- **File**: [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts)

#### `GET /api/auth/me`
- **Auth**: Authenticated (any role)
- **Output**: Current session info
- **File**: [src/app/api/auth/me/route.ts](src/app/api/auth/me/route.ts)

### Student Routes

#### `GET /api/students`
- **Auth**: Admin only
- **Output**: Array of all students with application info (includes completion_status from draft check)
- **File**: [src/app/api/students/route.ts](src/app/api/students/route.ts#L82)

#### `POST /api/students` (Create)
- **Auth**: Admin only
- **Input**: `{ application_number, full_name, date_of_birth, academic_branch, ... }`
- **Logic**:
  1. Normalize application number
  2. Generate institutional_id
  3. Set access_expires_at = now + 3 days
  4. Insert student
- **Output**: Created student object
- **File**: [src/app/api/students/route.ts](src/app/api/students/route.ts#L115)

#### `PATCH /api/students` (Update)
- **Auth**: Admin only
- **Logic**:
  1. If `extended_days` provided: recalculate `access_expires_at`
  2. Update other student fields (name, status, etc.)
- **File**: [src/app/api/students/route.ts](src/app/api/students/route.ts#L175)

#### `DELETE /api/students`
- **Auth**: Admin only
- **Logic**: Cascade delete student (forms, documents)
- **File**: [src/app/api/students/route.ts](src/app/api/students/route.ts#L308)

#### `GET /api/students/me`
- **Auth**: Student only
- **Output**: Own profile data including access fields
- **File**: [src/app/api/students/me/route.ts](src/app/api/students/me/route.ts)

#### `GET /api/students/me/status`
- **Auth**: Student only
- **Output**: Current access status, completion progress
- **File**: [src/app/api/students/me/status/route.ts](src/app/api/students/me/status/route.ts)

#### `POST /api/students/toggle-lock`
- **Auth**: Admin only
- **Input**: `{ application_number }`
- **Logic**: Toggle `is_locked` boolean
- **File**: [src/app/api/students/toggle-lock/route.ts](src/app/api/students/toggle-lock/route.ts)

#### `POST /api/students/restart-session`
- **Auth**: Admin only
- **Logic**: Clear form submissions and allow student to restart
- **File**: [src/app/api/students/restart-session/route.ts](src/app/api/students/restart-session/route.ts)

### Form Routes

#### `POST /api/forms/save-draft`
- **Auth**: Student only
- **Input**: `{ payload: {...form data} }`
- **Logic**: Save draft form with status='draft' (stores as JSON, NOT encrypted yet)
- **Output**: Form ID and timestamp
- **File**: [src/app/api/forms/save-draft/route.ts](src/app/api/forms/save-draft/route.ts)

#### `POST /api/forms/submit`
- **Auth**: Student only
- **Input**: `{ payload: {...form data} }`
- **Logic**:
  1. Encrypt form payload with AES-256-GCM
  2. Insert with status='submitted'
  3. Set `is_locked = true` on student
  4. Set `form_submitted_at = NOW()`
- **File**: [src/app/api/forms/submit/route.ts](src/app/api/forms/submit/route.ts)

#### `GET /api/admin/forms/latest`
- **Auth**: Admin only
- **Input**: Query param `applicationNumber`
- **Logic**: Fetch latest submitted form, decrypt payload
- **Output**: Decrypted form data
- **File**: [src/app/api/admin/forms/latest/route.ts](src/app/api/admin/forms/latest/route.ts)

### Document Routes

#### `POST /api/documents` (Upload)
- **Auth**: Student only
- **Input**: FormData with `file` and `category`
- **Logic**:
  1. Generate file_key (unique identifier)
  2. Write file to `public/uploads/{file_key}`
  3. Record metadata in student_documents table
- **Output**: `{ success: true, file: {...} }`
- **File**: [src/app/api/documents/route.ts](src/app/api/documents/route.ts#L18)

#### `GET /api/documents`
- **Auth**: Student only
- **Output**: Array of own uploaded documents
- **File**: [src/app/api/documents/route.ts](src/app/api/documents/route.ts#L62)

#### `DELETE /api/documents`
- **Auth**: Student only
- **Logic**: Delete file and database record (verification that it belongs to student)
- **File**: [src/app/api/documents/route.ts](src/app/api/documents/route.ts#L82)

#### `GET /api/documents/download`
- **Auth**: Student (owns file) or Admin
- **Logic**: Stream file from `public/uploads/` directory
- **File**: [src/app/api/documents/download/route.ts](src/app/api/documents/download/route.ts)

### Admin Document Routes

#### `GET /api/admin/documents`
- **Auth**: Admin only
- **Input**: Query param `studentId` (application number)
- **Output**: All documents for a specific student
- **File**: [src/app/api/admin/documents/route.ts](src/app/api/admin/documents/route.ts#L9)

#### `DELETE /api/admin/documents`
- **Auth**: Admin only
- **Logic**: Admin can delete any student's document
- **File**: [src/app/api/admin/documents/route.ts](src/app/api/admin/documents/route.ts#L58)

#### `GET /api/admin/documents/bulk-download`
- **Auth**: Admin only
- **Logic**: Create ZIP of multiple documents
- **File**: [src/app/api/admin/documents/bulk-download/route.ts](src/app/api/admin/documents/bulk-download/route.ts)

### Export Routes

#### `POST /api/admin/export-excel`
- **Auth**: Admin only
- **Input**: `{ students: [...], useCustomPath: boolean }`
- **Logic**:
  1. For each student, fetch latest form and decrypt
  2. Collect all unique form field names across all students
  3. Group students by department
  4. Create separate Excel sheets per department
  5. Optionally save to custom path from `admin_settings`
  6. Return workbook or file path
- **Output**: Excel file with formatted headers and columns
- **File**: [src/app/api/admin/export-excel/route.ts](src/app/api/admin/export-excel/route.ts)
  
  **Columns Generated**:
  - Basic: Application Number, Full Name, Department
  - Contact: Mobile Number, Father Mobile, Mother Mobile
  - Personal: Date of Birth, Father Name, Mother Name
  - Status: Status, Completion Status, Is Locked, Extended Days, Date Submitted
  - Form Fields: All dynamic fields from encrypted forms

### Admin Account Routes

#### `PATCH /api/admin/account`
- **Auth**: Admin only
- **Actions**:
  1. `action: 'username'` - Change admin username (verify current password)
  2. `action: 'password'` - Change admin password (verify current password)
- **File**: [src/app/api/admin/account/route.ts](src/app/api/admin/account/route.ts)

### Admin Settings Routes

#### `GET /api/admin/settings`
- **Auth**: Admin only
- **Output**: `{ excel_export_path }`
- **File**: [src/app/api/admin/settings/route.ts](src/app/api/admin/settings/route.ts#L5)

#### `PATCH /api/admin/settings`
- **Auth**: Admin only
- **Input**: `{ excel_export_path }`
- **Logic**: Insert or update in admin_settings table
- **File**: [src/app/api/admin/settings/route.ts](src/app/api/admin/settings/route.ts#L26)

### Department Routes

#### `GET /api/departments`
- **Auth**: Admin only
- **Output**: Array of departments from custom_departments table
- **File**: [src/app/api/departments/route.ts](src/app/api/departments/route.ts)

#### `POST /api/departments`
- **Auth**: Admin only
- **Input**: `{ shortCode, fullName }`
- **File**: [src/app/api/departments/route.ts](src/app/api/departments/route.ts)

#### `DELETE /api/departments`
- **Auth**: Admin only
- **Input**: Department ID
- **File**: [src/app/api/departments/route.ts](src/app/api/departments/route.ts)

---

## 4. DATA FLOW ARCHITECTURE

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT LOGIN                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. POST /api/auth/login { application_number, password_dob }    │
│                                                                   │
│ 2. Server validates:                                             │
│    └─ DOB matches: password == YYYYMMDD format of date_of_birth │
│                                                                   │
│ 3. Server checks access:                                         │
│    ├─ is_locked == false?                                       │
│    ├─ form_submitted_at == null?                                │
│    └─ access_expires_at > NOW()?                                │
│                                                                   │
│ 4. Create session:                                               │
│    ├─ INSERT INTO sessions (token, student_id, expires_at)      │
│    ├─ Set httpOnly cookie: mgmt_session={token}                 │
│    └─ Return { ok: true, role: 'student' }                      │
│                                                                   │
│ 5. Subsequent requests:                                          │
│    └─ Read cookie → getSession() → verify in DB → authorize     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Form Submission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ FORM SUBMISSION                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ DRAFT SAVE:                                                      │
│ 1. POST /api/forms/save-draft { payload: {...form_data} }       │
│ 2. INSERT INTO student_application_forms (payload, status)      │
│    - status = 'draft'                                            │
│    - encrypted_payload = JSON (NOT encrypted yet)                │
│ 3. Student can edit and save multiple drafts                    │
│                                                                   │
│ FINAL SUBMIT:                                                    │
│ 1. POST /api/forms/submit { payload: {...form_data} }           │
│ 2. Server:                                                       │
│    ├─ Encrypt payload with AES-256-GCM                          │
│    ├─ INSERT INTO student_application_forms (encrypted, status) │
│    │  - status = 'submitted'                                    │
│    │  - encrypted_payload = {v:1, alg, iv, tag, data}          │
│    ├─ UPDATE students SET is_locked=true, form_submitted_at=NOW │
│    └─ Return { ok: true }                                       │
│ 3. Student access is now restricted to view-only                │
│ 4. Admin can unlock student to allow resubmission                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Document Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ DOCUMENT UPLOAD                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. POST /api/documents { file: File, category: string }         │
│                                                                   │
│ 2. Server:                                                       │
│    ├─ Generate file_key = {uuid}_{timestamp}_{filename}         │
│    ├─ Write to public/uploads/{file_key}                        │
│    ├─ INSERT INTO student_documents                              │
│    │  (student_id, file_name, file_key, file_size, file_type)   │
│    └─ Return { success: true }                                  │
│                                                                   │
│ 3. Subsequent access:                                            │
│    ├─ GET /api/documents → list own files                       │
│    ├─ GET /api/documents/download → stream file                 │
│    ├─ DELETE /api/documents → remove file & record              │
│    └─ Admin can GET /api/admin/documents (any student)           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Export Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ EXCEL EXPORT (Admin)                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Admin selects students from table                             │
│ 2. POST /api/admin/export-excel { students, useCustomPath }     │
│                                                                   │
│ 3. Server processing:                                            │
│    ├─ For each student:                                          │
│    │  ├─ SELECT s.*, f.encrypted_payload FROM students s        │
│    │  │  LEFT JOIN forms f ON f.student_id = s.id               │
│    │  ├─ Decrypt form payload (AES-256-GCM)                     │
│    │  └─ Extract all form fields                                │
│    │                                                              │
│    ├─ Collect all unique field names                            │
│    ├─ Group students by academic_branch                         │
│    └─ Build export rows with headers + dynamic fields           │
│                                                                   │
│ 4. Excel generation:                                             │
│    ├─ Create workbook with sheet per department                 │
│    ├─ Format headers (bold, auto-widths)                        │
│    ├─ Add data rows                                              │
│    └─ Optionally save to external path                          │
│                                                                   │
│ 5. Return file to admin                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. FILE STRUCTURE

### Project Layout

```
e:\management-app/
├── db/
│   └── schema.sql                          # Core database schema
├── scripts/
│   ├── setup-db.mjs                        # Initial DB setup
│   ├── migrate-add-access-fields.mjs        # Added access control fields
│   ├── migrate-add-documents-table.mjs      # Added file upload support
│   ├── migrate-add-additional-info.mjs      # Added JSONB field
│   └── migrate-set-access-expires.mjs       # Access expiration setup
├── src/
│   ├── app/
│   │   ├── globals.css                     # Global styling
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Landing page (public)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                    # Login page
│   │   │
│   │   ├── student/
│   │   │   ├── layout.tsx                  # Student layout
│   │   │   ├── page.tsx                    # Student dashboard
│   │   │   └── form/
│   │   │       └── page.tsx                # Student form page
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Admin layout
│   │   │   ├── page.tsx                    # Admin dashboard
│   │   │   ├── StudentDetailModal.tsx      # Modal for student details
│   │   │   ├── add-student/
│   │   │   │   └── page.tsx                # Add student page
│   │   │   └── student-forms/
│   │   │       └── page.tsx                # View student forms
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts          # Login endpoint
│   │       │   ├── logout/route.ts         # Logout endpoint
│   │       │   └── me/route.ts             # Current user endpoint
│   │       │
│   │       ├── students/
│   │       │   ├── route.ts                # GET all, POST new, PATCH, DELETE
│   │       │   ├── me/
│   │       │   │   ├── route.ts            # GET student profile
│   │       │   │   └── status/route.ts     # GET access status
│   │       │   ├── toggle-lock/route.ts    # Lock/unlock student
│   │       │   └── restart-session/route.ts # Clear submissions
│   │       │
│   │       ├── forms/
│   │       │   ├── save-draft/route.ts     # Save draft form
│   │       │   └── submit/route.ts         # Submit encrypted form
│   │       │
│   │       ├── documents/
│   │       │   ├── route.ts                # Upload, GET, DELETE
│   │       │   └── download/route.ts       # Download file
│   │       │
│   │       ├── admin/
│   │       │   ├── forms/
│   │       │   │   ├── draft/route.ts      # Get draft form
│   │       │   │   ├── latest/route.ts     # Get latest form + decrypt
│   │       │   │   └── promote/route.ts    # Promote draft to submitted
│   │       │   ├── documents/
│   │       │   │   ├── route.ts            # Admin view docs
│   │       │   │   ├── upload/route.ts     # Admin upload for student
│   │       │   │   └── bulk-download/route.ts
│   │       │   ├── export-excel/route.ts   # Export to Excel
│   │       │   ├── account/route.ts        # Change admin credentials
│   │       │   └── settings/route.ts       # Admin settings
│   │       │
│   │       └── departments/route.ts        # Department management
│   │
│   ├── components/
│   │   ├── DocumentUploadSection.tsx
│   │   ├── StudentHeader.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       └── Stepper.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                           # Database connection pool
│   │   ├── session.ts                      # Session management
│   │   ├── crypto.ts                       # AES-256-GCM encryption
│   │   └── student-password.ts             # Password helpers
│   │
│   └── image/
│       └── [college images...]
│
├── public/
│   ├── uploads/                            # File storage (dynamic)
│   └── [other static assets]
│
├── package.json                            # Dependencies
├── tsconfig.json                           # TypeScript config
├── next.config.ts                          # Next.js config
├── postcss.config.mjs                      # Tailwind config
└── env.example                             # Environment template
```

### Core Library Files

#### [src/lib/db.ts](src/lib/db.ts)
```typescript
- getPool()      # Get PostgreSQL pool
- query<T>()     # Generic query helper with typing
```

#### [src/lib/session.ts](src/lib/session.ts)
```typescript
- createSession()              # Create admin/student session
- destroySession()             # Clear session
- getSession()                 # Get current session
- requireAdminSession()        # Auth guard for admin
- requireStudentSession()      # Auth guard for student
```

#### [src/lib/crypto.ts](src/lib/crypto.ts)
```typescript
- encryptJson(value)           # AES-256-GCM encryption
- decryptJson<T>(payload)      # AES-256-GCM decryption
- EncryptedPayload (type)      # Encrypted data structure
```

#### [src/lib/student-password.ts](src/lib/student-password.ts)
```typescript
- expectedPasswordFromIsoDate() # Compute password from DOB
- normalizeApplicationNumber()  # Format application number
- pgDateToYmd()                 # Convert PostgreSQL date to YYYY-MM-DD
```

---

## 6. AUTHENTICATION SYSTEM

### Session Architecture

```
┌──────────────────────────────────────────────────────────┐
│ SESSION FLOW                                              │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ CREATION (Login):                                          │
│ 1. POST /api/auth/login                                   │
│ 2. Verify credentials (bcrypt for admin, DOB for student) │
│ 3. INSERT INTO sessions (token, kind, user_id, expires)  │
│ 4. Set HTTP-only cookie: mgmt_session={token}            │
│ 5. Return role to client                                  │
│                                                            │
│ VALIDATION (Subsequent Requests):                          │
│ 1. Client sends cookie automatically                      │
│ 2. getSession() reads cookie                              │
│ 3. SELECT * FROM sessions WHERE token=? AND expires_at>? │
│ 4. Return SessionRow or null                              │
│ 5. Auth guard functions check kind (admin/student)        │
│                                                            │
│ DESTRUCTION (Logout):                                      │
│ 1. POST /api/auth/logout                                  │
│ 2. DELETE FROM sessions WHERE token=?                     │
│ 3. Clear cookie                                           │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Student Authentication

**Credentials**:
- Username: Application number (case-insensitive)
- Password: Date of birth in YYYYMMDD format
  - Example: DOB = 2002-05-15 → Password = "20020515"

**Access Control**:

| Condition | Prevents Access | Message |
|-----------|-----------------|---------|
| `is_locked = true` | ✓ | "Account locked" |
| `form_submitted_at != null` | ✓ | "Already submitted" |
| `access_expires_at < NOW()` | ✓ | "Access expired" |

**Session Duration**: 7 days (or until form submitted)

### Admin Authentication

**Credentials**:
- Username: Text (stored in admin_accounts)
- Password: bcrypt hashed (10 salt rounds)

**Storage**: [admin_accounts table](admin_accounts)

**Session Duration**: 7 days

### Cookie Configuration

```typescript
{
  httpOnly: true,           // Not accessible to JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',          // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60  // 7 days in seconds
}
```

### Auth Guards

```typescript
// Admin only
const session = await requireAdminSession()
// Throws AuthError(401) if not admin

// Student only
const session = await requireStudentSession()
// Throws AuthError(401) if not student

// Get if exists (no throw)
const session = await getSession()
// Returns SessionRow or null
```

---

## 7. FORM SYSTEM

### Form Lifecycle

```
┌─────────────────────────────────────────────────────┐
│ FORM LIFECYCLE                                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│ STATE 1: Student creates form                       │
│ ─────────────────────────                           │
│ - GET /api/students/me (get student fields)         │
│ - Student fills dynamic form                        │
│ - Multiple saves via POST /api/forms/save-draft     │
│   └─ encrypted_payload stored as plain JSON         │
│   └─ status = 'draft'                               │
│   └─ student can edit without losing data           │
│                                                      │
│ STATE 2: Student submits                            │
│ ──────────────────────                              │
│ - POST /api/forms/submit                            │
│   ├─ Encrypt form with AES-256-GCM                  │
│   ├─ INSERT with status = 'submitted'               │
│   ├─ UPDATE students:                               │
│   │  ├─ is_locked = true                            │
│   │  ├─ form_submitted_at = NOW()                   │
│   │  └─ completion_status = 'Complete' / 'Partial'  │
│   └─ Student session ends (access denied)           │
│                                                      │
│ STATE 3: Admin reviews                              │
│ ────────────────────                                │
│ - GET /api/admin/forms/latest?applicationNumber=   │
│   ├─ Decrypt form payload                           │
│   ├─ Admin views all fields                         │
│   └─ Admin can export to Excel                      │
│                                                      │
│ STATE 4: Admin restart (optional)                   │
│ ────────────────────────────────                    │
│ - POST /api/students/restart-session                │
│   ├─ Delete form submissions                        │
│   ├─ Set is_locked = false                          │
│   ├─ Clear form_submitted_at                        │
│   └─ Student can resubmit                           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Draft vs Submitted

| Property | Draft | Submitted |
|----------|-------|-----------|
| encrypted_payload | Plain JSON | AES-256-GCM encrypted |
| status | 'draft' | 'submitted' |
| is_locked | false | true |
| form_submitted_at | null | Set to NOW() |
| Student access | Edit access | View-only / Denied |
| Admin can view | Yes (not encrypted) | Yes (decrypted) |

### Form Data Schema

The form payload is flexible and stored as JSONB in `encrypted_payload`:

```json
{
  "student_name": "John Doe",
  "student_mobile": "9876543210",
  "father_name": "Father Name",
  "mother_name": "Mother Name",
  "father_mobile": "9876543211",
  "mother_mobile": "9876543212",
  ...
  "custom_field_1": "value",
  "custom_field_2": "value"
}
```

All fields are converted to display format for Excel export.

---

## 8. EXPORT SYSTEM

### Excel Export Process

**Endpoint**: `POST /api/admin/export-excel`

**Input**:
```json
{
  "students": [
    { "_studentId": "APP123", "name": "John Doe", ... },
    { "_studentId": "APP124", "name": "Jane Doe", ... }
  ],
  "useCustomPath": false
}
```

**Process**:

1. **Fetch Complete Student Data**
   ```sql
   SELECT s.*, f.encrypted_payload FROM students s
   LEFT JOIN student_application_forms f ON f.student_id = s.id
   WHERE s.application_number = ANY(?)
   ```

2. **Decrypt Forms**
   - For each student with encrypted_payload:
   - Decrypt using AES-256-GCM
   - Extract all form fields

3. **Collect Unique Fields**
   - Scan all students' forms
   - Build set of all unique field names
   - Ensures complete column coverage

4. **Group by Department**
   - students.academic_branch
   - Create separate sheet for each department

5. **Build Export Rows**
   ```
   Basic Columns:
   - Application Number
   - Full Name
   - Department
   
   Contact Columns:
   - Mobile Number
   - Father Mobile
   - Mother Mobile
   
   Personal Columns:
   - Date of Birth
   - Father Name
   - Mother Name
   
   Status Columns:
   - Status
   - Completion Status
   - Is Locked
   - Extended Days
   - Date Submitted
   
   Dynamic Columns:
   - All form fields collected in step 3
   ```

6. **Format Excel**
   - Bold headers
   - Auto-width columns
   - Conditional formatting by status
   - Professional styling

7. **Save**
   - If `useCustomPath=true`: Save to `admin_settings.excel_export_path`
   - Otherwise: Return as downloadable file

**Output File**:
- Format: `.xlsx` (Excel 2007+)
- Multiple sheets (one per department)
- Fully formatted with proper headers

**Example Export Structure**:
```
Sheet "CSE" (Computer Science)
┌───────────────┬─────────────┬────┬─────────┬──────────┐
│ App Number    │ Full Name   │ ... │ Fathers │ Formfield│
├───────────────┼─────────────┼────┼─────────┼──────────┤
│ APP001        │ John Doe    │ ... │ Parent  │ Value1   │
│ APP002        │ Jane Doe    │ ... │ Parent2 │ Value2   │
└───────────────┴─────────────┴────┴─────────┴──────────┘

Sheet "ECE" (Electronics)
┌───────────────┬─────────────┬────┬─────────┬──────────┐
│ APP103        │ Bob Smith   │ ... │ Parent3 │ Value3   │
└───────────────┴─────────────┴────┴─────────┴──────────┘
```

### Export Path Configuration

**Stored in**: `admin_settings` table (created on-demand)

**Key**: `excel_export_path`

**API**:
- `GET /api/admin/settings` → Retrieve current path
- `PATCH /api/admin/settings { excel_export_path: "C:\\exports\\" }` → Update

**Usage**: When `useCustomPath=true`, saves file to configured external path

---

## 9. KEY ENVIRONMENT VARIABLES

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
ENCRYPTION_KEY_BASE64=<32-byte key, base64 encoded>

# Optional
NODE_ENV=development|production
```

**Generate ENCRYPTION_KEY_BASE64**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 10. SECURITY CONSIDERATIONS

### Data at Rest
- Form data encrypted with AES-256-GCM
- Encryption key managed via environment variable
- Database backups contain encrypted payloads only

### Data in Transit
- HTTPS enforced in production
- HTTP-only cookies prevent XSS access
- Same-site cookies prevent CSRF

### Authentication
- Admin passwords bcrypt hashed
- Student passwords computed from DOB (not stored)
- Sessions expire after 7 days
- Session invalidation on logout

### Access Control
- Role-based: Admin vs Student
- Time-based: `access_expires_at` enforces deadline
- State-based: `is_locked` and `form_submitted_at`

### File Uploads
- Stored in `public/uploads/` with unique keys
- Ownership verified before download/delete
- Admin can manage student files

---

## 11. DEPLOYMENT & SETUP

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp env.example .env.local
# Edit .env.local with DATABASE_URL and ENCRYPTION_KEY_BASE64

# 3. Initialize database
npm run db:setup
# Runs scripts/setup-db.mjs → creates schema

# 4. Apply migrations (optional, if upgrading)
node scripts/migrate-add-documents-table.mjs
node scripts/migrate-add-access-fields.mjs
# etc.

# 5. Start development
npm run dev

# 6. Build for production
npm run build
npm start
```

### Database Initialization

[scripts/setup-db.mjs](scripts/setup-db.mjs) creates:
1. pgcrypto extension
2. All core tables with indexes
3. Initial indexes for performance

### Run Commands

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build
npm start                # Run production build
npm run lint             # ESLint check
npm run db:setup         # Initialize database
```

---

This comprehensive architecture document covers the complete student management system from database to export.
