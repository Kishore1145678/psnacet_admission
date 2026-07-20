# Architecture Documentation - Quick Start Guide

## 📚 Documentation Files

This analysis is split into three comprehensive documents:

### 1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete Technical Reference
Deep dive into every component:
- Database architecture (7 tables + relationships)
- Data storage organization
- All 35+ API endpoints with code references
- Data flow diagrams
- Complete file structure
- Authentication system details
- Form system lifecycle
- Export system process

### 2. **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Visual Overview
Mermaid diagrams showing:
- System architecture
- Database schema & relationships
- Form lifecycle state machine
- Access control flow
- Export pipeline
- Encryption architecture
- API authentication guards
- File upload process
- Dashboard data loading
- Technology stack
- Security layers

### 3. **[API_REFERENCE.md](API_REFERENCE.md)** - Quick Lookup
Fast reference tables:
- All endpoints organized by function
- Database table schemas
- Error codes
- Setup commands
- Security configuration

---

## 🎯 Key Insights at a Glance

### Architecture Pattern
**Multi-tier web application**:
- **Presentation**: React 19 + Next.js 16 with animations
- **API Layer**: Next.js Route Handlers (TypeScript)
- **Business Logic**: Encryption, auth, form validation
- **Data Layer**: PostgreSQL with JSONB support

### Core Features

#### 1. **Dual Authentication System**
- **Admins**: Username/bcrypt password (stored in DB)
- **Students**: Application number + DOB as YYYYMMDD password
- **Sessions**: 7-day tokens in httpOnly cookies

#### 2. **Time-Based Access Control**
```
Student access_expires_at = NOW() + (3 days default + extended_days)
```
Prevents access after deadline unless admin extends access

#### 3. **Encrypted Form Storage**
- Forms saved as **drafts (plain JSON)** while editing
- Forms submitted as **encrypted (AES-256-GCM)** for storage
- Server can decrypt with `ENCRYPTION_KEY_BASE64`
- Protects data at rest

#### 4. **Dynamic Excel Export**
- Decrypts all student forms
- Auto-discovers all form fields
- Creates separate sheets per department
- Formats with headers and styling

#### 5. **File Management**
- Documents stored in `public/uploads/`
- Metadata tracked in `student_documents` table
- Admin can download/delete student files
- Students can upload/delete their own

---

## 🗄️ Database Overview

### 7 Core Tables

```
admin_accounts (Users)
├── students (Core profile data)
├── sessions (Active sessions)
├── student_application_forms (Encrypted submissions)
└── student_documents (File uploads)

custom_departments (Reference)
admin_settings (Configuration)
```

### Relationships
```
admin_accounts ─┐
                └─→ sessions ←─ students
                              ├─→ student_application_forms
                              └─→ student_documents
```

### Key Fields
- **Access Control**: `is_locked`, `access_expires_at`, `form_submitted_at`
- **Encryption**: `encrypted_payload` (AES-256-GCM stored as JSONB)
- **Status**: `status` (In Review|Approved|Rejected), `completion_status` (Complete|Partial)

---

## 🔄 Data Flow Summary

### Login → Form Submission → Export Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ LOGIN: Student enters app_number + DOB                      │
│ ↓                                                             │
│ Server computes password from DOB, checks access_expires_at │
│ ↓                                                             │
│ Create 7-day session with httpOnly cookie                    │
│ ↓                                                             │
│ FORM CREATION: Student fills form                           │
│ ↓                                                             │
│ DRAFT SAVE: POST /api/forms/save-draft → plain JSON in DB  │
│ (Can save multiple drafts)                                  │
│ ↓                                                             │
│ FINAL SUBMIT: POST /api/forms/submit                        │
│ ├─ Encrypt with AES-256-GCM                                │
│ ├─ Store encrypted payload in DB                            │
│ ├─ Set is_locked=true                                       │
│ └─ Set form_submitted_at=NOW()                              │
│ ↓                                                             │
│ ADMIN REVIEW: GET /api/admin/forms/latest                  │
│ ├─ Decrypt form                                             │
│ └─ View all fields                                          │
│ ↓                                                             │
│ EXPORT: POST /api/admin/export-excel                        │
│ ├─ Query all students + forms                               │
│ ├─ Decrypt all forms                                        │
│ ├─ Collect unique field names                               │
│ ├─ Group by department                                      │
│ ├─ Generate Excel with formatted headers                    │
│ └─ Return .xlsx file                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Model

### Layers
1. **Transport**: HTTPS (enforced in production)
2. **Authentication**: Session tokens in httpOnly cookies
3. **Authorization**: Role-based (admin vs student) + ownership checks
4. **Encryption**: AES-256-GCM for form data at rest
5. **Hashing**: Bcrypt for admin passwords (10 salt rounds)

### Student Access Revocation
```
✓ Access granted if:
  - is_locked = false
  - form_submitted_at = null (or null for draft viewing)
  - access_expires_at > NOW()

✗ Access denied if any above is false
  - Admin can extend via extended_days
  - Admin can unlock via toggle-lock
  - Student loses access after form submission
```

---

## 📡 API Organization (35+ endpoints)

### Routes by Function

**Auth** (3):
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

**Students** (8):
- CRUD: `/api/students` (GET, POST, PATCH, DELETE)
- Personal: `/api/students/me`, `/api/students/me/status`
- Admin Control: `/api/students/toggle-lock`, `/api/students/restart-session`

**Forms** (4):
- Student: `/api/forms/save-draft`, `/api/forms/submit`
- Admin: `/api/admin/forms/latest`, `/api/admin/forms/draft`

**Documents** (8):
- Student: `/api/documents` (POST, GET, DELETE), `/api/documents/download`
- Admin: `/api/admin/documents` (GET, DELETE), `/api/admin/documents/bulk-download`, `/api/admin/documents/upload`

**Admin** (6):
- Account: `/api/admin/account` (PATCH for username/password)
- Settings: `/api/admin/settings` (GET, PATCH)
- Export: `/api/admin/export-excel` (POST)
- Departments: `/api/departments` (GET, POST, DELETE)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (pages)            # Login, Student, Admin dashboards
│   ├── api/               # Route handlers (35+ endpoints)
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Core logic
│   ├── db.ts             # Database connection
│   ├── session.ts        # Auth guards
│   ├── crypto.ts         # AES-256-GCM
│   └── student-password.ts # Password helpers
├── image/                # College images
db/
├── schema.sql            # Core schema
scripts/
├── setup-db.mjs          # Initial setup
└── migrate-*.mjs         # 4 migration scripts
public/
└── uploads/              # File storage (dynamic)
```

---

## ⚙️ Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/management_app
ENCRYPTION_KEY_BASE64=<base64_32_bytes>
NODE_ENV=development|production
```

### Database Initialization

```bash
# Create schema + indexes
npm run db:setup

# Apply migrations (if upgrading)
node scripts/migrate-add-documents-table.mjs
node scripts/migrate-add-access-fields.mjs
```

### Encryption Key Generation

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 Startup

```bash
npm install              # Install deps
npm run db:setup         # Initialize database
npm run dev              # Start dev server (port 3000)
npm run build && npm start  # Production build
npm run lint             # Check code quality
```

---

## 📊 Sample Data Flow

### Admin Creating a Student

```
1. Admin: POST /api/students
   {
     "application_number": "APP2024001",
     "full_name": "John Doe",
     "date_of_birth": "2002-05-15",
     "academic_branch": "CSE"
   }

2. Server:
   - Normalize application_number
   - Generate institutional_id (UUID)
   - Set access_expires_at = NOW() + 3 days
   - INSERT into students table
   - Return student object

3. Student can now login with:
   - Username: APP2024001
   - Password: 20020515 (DOB as YYYYMMDD)
```

### Excel Export Example

```
Input: Admin selects 3 students
Output:
  
  Sheet "CSE"
  ┌────┬────┬────┬────┬────┐
  │App │Name│Mob │Fath│Form│
  │    │    │    │    │Fld │
  ├────┼────┼────┼────┼────┤
  │APP1│John│98XX│Mom │Val1│
  │APP2│Jane│97XX│Dad │Val2│
  └────┴────┴────┴────┴────┘

  Sheet "ECE"
  ┌────┬────┬────┬────┬────┐
  │APP3│Bob │96XX│Mr. │Val3│
  └────┴────┴────┴────┴────┘
```

---

## 🔍 Key File References

| Concept | File | Key Functions |
|---------|------|----------------|
| Database | [src/lib/db.ts](src/lib/db.ts) | `query<T>()`, `getPool()` |
| Auth | [src/lib/session.ts](src/lib/session.ts) | `getSession()`, `requireAdminSession()` |
| Encryption | [src/lib/crypto.ts](src/lib/crypto.ts) | `encryptJson()`, `decryptJson()` |
| Login | [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts) | Student/admin verification |
| Forms | [src/app/api/forms/submit/route.ts](src/app/api/forms/submit/route.ts) | Form encryption & submission |
| Export | [src/app/api/admin/export-excel/route.ts](src/app/api/admin/export-excel/route.ts) | Excel generation |
| Students | [src/app/api/students/route.ts](src/app/api/students/route.ts) | CRUD operations |

---

## 🎓 Learning Path

1. **Start with databases**: Read [db/schema.sql](db/schema.sql)
2. **Understand auth**: Read [src/lib/session.ts](src/lib/session.ts)
3. **Form flow**: Read [src/app/api/forms/submit/route.ts](src/app/api/forms/submit/route.ts)
4. **Export process**: Read [src/app/api/admin/export-excel/route.ts](src/app/api/admin/export-excel/route.ts)
5. **Full flow**: View [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Database connection works: `npm run db:setup`
- [ ] Encryption key generated: Check `.env.local`
- [ ] Dev server starts: `npm run dev` on port 3000
- [ ] Login works: Try admin/student login
- [ ] Form submission: Save draft → Submit → Confirm locked
- [ ] Excel export: Download student data as Excel
- [ ] File upload: Upload document → Download as admin

---

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "DATABASE_URL not set" | Missing env var | Add to `.env.local` |
| "ENCRYPTION_KEY_BASE64 not set" | Missing env var | Generate & add to `.env.local` |
| "Access expired" | 3-day window passed | Admin extends with `extended_days` |
| "Already submitted" | Form already locked | Admin calls `/api/students/restart-session` |
| "Account locked" | Admin locked student | Admin calls `/api/students/toggle-lock` |

---

## 📞 Questions?

Refer to specific documentation:
- **Database questions** → [ARCHITECTURE.md](ARCHITECTURE.md#1-database-architecture)
- **API questions** → [API_REFERENCE.md](API_REFERENCE.md)
- **Visual overview** → [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)
- **File structure** → [ARCHITECTURE.md](ARCHITECTURE.md#5-file-structure)
- **Security** → [ARCHITECTURE.md](ARCHITECTURE.md#10-security-considerations)

---

Generated: April 21, 2026  
Application: Student Management System  
Framework: Next.js 16 + React 19 + PostgreSQL
