# API Quick Reference

## Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | Public | Login (admin or student) |
| POST | `/api/auth/logout` | Any | Logout |
| GET | `/api/auth/me` | Any | Get current session info |

**Student Login**: Username = application_number, Password = YYYYMMDD (DOB)  
**Admin Login**: Username = admin username, Password = bcrypt hashed  
**Session**: 7 days, httpOnly cookie `mgmt_session`

---

## Student Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/students` | Admin | List all students |
| POST | `/api/students` | Admin | Create student |
| PATCH | `/api/students` | Admin | Update student (extend days, status) |
| DELETE | `/api/students` | Admin | Delete student (cascades) |
| GET | `/api/students/me` | Student | Get own profile |
| GET | `/api/students/me/status` | Student | Get access status |
| POST | `/api/students/toggle-lock` | Admin | Lock/unlock student |
| POST | `/api/students/restart-session` | Admin | Clear submissions |

**Create Input**:
```json
{
  "application_number": "APP123",
  "full_name": "John Doe",
  "date_of_birth": "2002-05-15",
  "academic_branch": "CSE"
}
```

**Extend Access**:
```json
{
  "application_number": "APP123",
  "extended_days": 5
}
```

---

## Form Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/forms/save-draft` | Student | Save draft form |
| POST | `/api/forms/submit` | Student | Submit form (encrypted) |
| GET | `/api/admin/forms/latest` | Admin | Get & decrypt latest form |
| GET | `/api/admin/forms/draft` | Admin | Get draft form |
| POST | `/api/admin/forms/promote` | Admin | Promote draft to submitted |

**Save Draft Input**:
```json
{
  "payload": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

**Submit Input** (same as draft):
```json
{
  "payload": { ... }
}
```

**Query Params**: `?applicationNumber=APP123`

---

## Document Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/documents` | Student | Upload document |
| GET | `/api/documents` | Student | List own documents |
| DELETE | `/api/documents` | Student | Delete own document |
| GET | `/api/documents/download` | Any | Download file |
| GET | `/api/admin/documents` | Admin | List student's documents |
| DELETE | `/api/admin/documents` | Admin | Delete student's document |
| GET | `/api/admin/documents/bulk-download` | Admin | Download ZIP of docs |
| POST | `/api/admin/documents/upload` | Admin | Upload for student |

**Upload**: FormData with `file` and `category`  
**Query Params**: `?studentId=APP123` or `?id=doc_id`

---

## Export Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/admin/export-excel` | Admin | Export students to Excel |

**Input**:
```json
{
  "students": [
    { "_studentId": "APP123", ... },
    { "_studentId": "APP124", ... }
  ],
  "useCustomPath": false
}
```

**Output**: Excel file with:
- Separate sheet per department
- Basic columns: App #, Name, Dept
- Contact columns: Mobile, Father Mobile, etc.
- Status columns: Status, Locked, Submitted Date, etc.
- Form fields: All dynamic fields from encrypted forms

---

## Admin Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| PATCH | `/api/admin/account` | Admin | Change username/password |
| GET | `/api/admin/settings` | Admin | Get admin settings |
| PATCH | `/api/admin/settings` | Admin | Update admin settings |

**Change Username**:
```json
{
  "action": "username",
  "currentPassword": "oldpwd",
  "newUsername": "newadmin"
}
```

**Change Password**:
```json
{
  "action": "password",
  "currentPassword": "oldpwd",
  "newPassword": "newpwd"
}
```

**Settings**: `excel_export_path` = custom export directory

---

## Department Routes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/departments` | Admin | List departments |
| POST | `/api/departments` | Admin | Create department |
| DELETE | `/api/departments` | Admin | Delete department |

**Create Input**:
```json
{
  "shortCode": "CSE",
  "fullName": "Computer Science"
}
```

---

## Database Tables Quick Reference

### `students` (Core)
```
id (UUID) | application_number | full_name | date_of_birth | academic_branch
mobile_number | is_locked | access_expires_at | form_submitted_at
completion_status | status | extended_days | additional_info
```

### `student_application_forms` (Submissions)
```
id | student_id | encrypted_payload (AES-256-GCM) | status (draft|submitted)
```

### `student_documents` (Files)
```
id | student_id | document_category | file_name | file_key (unique)
file_size | file_type | uploaded_at
```

### `sessions` (Authentication)
```
token (PK) | kind (admin|student) | admin_username | student_id | expires_at
```

### `admin_accounts` (Admin Users)
```
id | username (unique) | password_hash (bcrypt)
```

### `custom_departments`
```
id | short_code (unique) | full_name
```

---

## File Storage

- **Location**: `public/uploads/{file_key}`
- **File Key Format**: `{student_uuid}_{timestamp}_{original_name}`
- **Metadata**: Stored in `student_documents` table

---

## Encryption Details

**Algorithm**: AES-256-GCM (authenticated encryption)  
**Key Size**: 256 bits (32 bytes)  
**IV Size**: 96 bits (12 bytes, random)  
**Source**: `ENCRYPTION_KEY_BASE64` environment variable

**Encrypted Payload Structure**:
```json
{
  "v": 1,
  "alg": "aes-256-gcm",
  "iv": "base64_encoded_iv",
  "tag": "base64_encoded_auth_tag",
  "data": "base64_encoded_ciphertext"
}
```

---

## Access Control Rules

### Student Access Denied If:
- ✗ `is_locked = true` → "Account locked"
- ✗ `form_submitted_at != null` → "Already submitted"
- ✗ `access_expires_at < NOW()` → "Access expired"

### Admin Can:
- Extend access: `PATCH /api/students` with `extended_days`
- Lock/unlock: `POST /api/students/toggle-lock`
- View forms: `GET /api/admin/forms/latest`
- Export data: `POST /api/admin/export-excel`

---

## Session Flow

```
1. POST /api/auth/login → Verify credentials
2. INSERT INTO sessions → Create token + set 7-day expiry
3. Set cookie: mgmt_session={token}
4. Subsequent requests: Read cookie → Query sessions → Authorize
5. POST /api/auth/logout → DELETE from sessions, clear cookie
```

---

## Form Submission Flow

```
1. Student creates form (state = view-only populated fields)
2. Multiple POST /api/forms/save-draft (status='draft', plain JSON)
3. Final POST /api/forms/submit:
   - Encrypt with AES-256-GCM
   - INSERT status='submitted'
   - UPDATE students SET is_locked=true, form_submitted_at=NOW()
4. Student access denied (forms locked)
5. Admin: GET /api/admin/forms/latest → Decrypt & view
6. Admin: POST /api/admin/export-excel → Decrypt all & export
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
ENCRYPTION_KEY_BASE64=<base64_encoded_32_bytes>

# Optional
NODE_ENV=production|development (default: development)
```

**Generate ENCRYPTION_KEY_BASE64**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing fields) |
| 401 | Unauthorized (invalid auth) |
| 403 | Forbidden (access denied) |
| 404 | Not found |
| 409 | Conflict (duplicate entry) |
| 500 | Server error |

---

## Setup Commands

```bash
# Install dependencies
npm install

# Setup database (creates schema)
npm run db:setup

# Run migrations (if upgrading)
node scripts/migrate-add-documents-table.mjs
node scripts/migrate-add-access-fields.mjs

# Development server
npm run dev

# Production build
npm build && npm start

# Code quality
npm run lint
```

---

## Key URLs (Development)

- Frontend: `http://localhost:3000`
- Login: `/login`
- Student Dashboard: `/student`
- Student Form: `/student/form`
- Admin Dashboard: `/admin`
- Add Student: `/admin/add-student`
- View Forms: `/admin/student-forms`

---

## Security Headers

```
httpOnly cookie: mgmt_session
  - Prevents XSS access to token
  - secure flag in production (HTTPS only)
  - sameSite: 'lax' (CSRF protection)
  - maxAge: 604,800 seconds (7 days)
```

---

## Technology Stack

**Frontend**: React 19, Next.js 16, Tailwind CSS, Framer Motion, GSAP  
**Backend**: Node.js, TypeScript, Express (via Next.js Routes)  
**Database**: PostgreSQL with pgcrypto extension  
**Security**: Bcryptjs (password hashing), crypto (AES-256-GCM)  
**File Export**: XLSX library
