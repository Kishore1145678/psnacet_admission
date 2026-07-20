# Student Management App - Visual Architecture Diagrams

## System Overview

```mermaid
graph TB
    subgraph Clients["🖥️ Clients"]
        Admin["👨‍💼 Admin Portal"]
        Student["📝 Student Portal"]
        Public["🌐 Public Page"]
    end

    subgraph Frontend["Frontend - Next.js 16"]
        LoginPage["Login Page"]
        AdminDash["Admin Dashboard"]
        StudentDash["Student Dashboard"]
        FormPage["Form Page"]
        UI["Framer Motion UI<br/>Animations & Charts"]
    end

    subgraph API["🔌 API Layer - Next.js Routes"]
        Auth["Auth Routes<br/>login/logout/me"]
        StudentAPI["Student Routes<br/>CRUD ops"]
        FormAPI["Form Routes<br/>draft/submit"]
        DocAPI["Document Routes<br/>upload/download"]
        AdminAPI["Admin Routes<br/>export/settings"]
        ExportAPI["Export Routes<br/>Excel generation"]
    end

    subgraph Logic["🧠 Logic Layer"]
        Session["Session Manager<br/>7-day tokens"]
        Crypto["Encryption<br/>AES-256-GCM"]
        AuthLogic["Auth Logic<br/>Admin/Student"]
    end

    subgraph Storage["💾 PostgreSQL Database"]
        AdminTable["admin_accounts<br/>username, pwd_hash"]
        StudentTable["students<br/>profile, status, access"]
        FormsTable["student_application_forms<br/>encrypted_payload, status"]
        DocsTable["student_documents<br/>file_key, metadata"]
        SessionTable["sessions<br/>token, kind, expires_at"]
        DeptTable["custom_departments<br/>code, name"]
        SettingsTable["admin_settings<br/>excel_export_path"]
    end

    subgraph Files["📁 File Storage"]
        Uploads["public/uploads/<br/>student files"]
    end

    Admin -->|Login| LoginPage
    Student -->|Login| LoginPage
    Public -->|Browse| Public
    
    LoginPage -->|POST /api/auth/login| Auth
    AdminDash -->|GET /api/students| StudentAPI
    StudentDash -->|GET /api/students/me| StudentAPI
    FormPage -->|POST /api/forms/submit| FormAPI
    AdminDash -->|POST /api/admin/export-excel| ExportAPI
    
    Auth -->|Verify| Session
    Auth -->|Hash check| AuthLogic
    
    StudentAPI -->|Query| StudentTable
    FormAPI -->|Encrypt/Decrypt| Crypto
    FormAPI -->|Store| FormsTable
    DocAPI -->|Store metadata| DocsTable
    ExportAPI -->|Decrypt + Export| FormsTable
    
    Session -->|Store/Read| SessionTable
    ExportAPI -->|Read settings| SettingsTable
    
    DocAPI -->|Write| Uploads
    ExportAPI -->|Read| Uploads
```

## Database Schema Relationships

```mermaid
erDiagram
    ADMIN_ACCOUNTS ||--o{ SESSIONS : creates
    STUDENTS ||--o{ SESSIONS : has
    STUDENTS ||--o{ STUDENT_APPLICATION_FORMS : submits
    STUDENTS ||--o{ STUDENT_DOCUMENTS : uploads
    CUSTOM_DEPARTMENTS ||--o{ STUDENTS : "has many"

    ADMIN_ACCOUNTS {
        int id PK
        string username UK
        string password_hash
        timestamp updated_at
    }

    STUDENTS {
        uuid id PK
        string application_number UK
        string institutional_id UK
        string full_name
        date date_of_birth
        string academic_branch FK
        boolean is_locked
        timestamp access_expires_at
        timestamp form_submitted_at
        jsonb additional_info
        timestamp created_at
        timestamp updated_at
    }

    SESSIONS {
        uuid token PK
        string kind
        string admin_username FK
        uuid student_id FK
        timestamp expires_at
        timestamp created_at
    }

    STUDENT_APPLICATION_FORMS {
        bigint id PK
        uuid student_id FK
        jsonb encrypted_payload
        string status
        timestamp created_at
        timestamp updated_at
    }

    STUDENT_DOCUMENTS {
        bigint id PK
        uuid student_id FK
        string document_category
        string file_name
        string file_key UK
        int file_size
        string file_type
        timestamp uploaded_at
    }

    CUSTOM_DEPARTMENTS {
        int id PK
        string short_code UK
        string full_name
    }
```

## Student Form Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Authenticated: Login with DOB
    
    Authenticated --> CreatingDraft: Start form
    
    CreatingDraft --> CreatingDraft: Save draft<br/>POST /api/forms/save-draft<br/>status='draft'<br/>plain JSON
    
    CreatingDraft --> Submitted: Final submit<br/>POST /api/forms/submit<br/>Encrypt with AES-256-GCM<br/>status='submitted'
    
    Submitted --> Submitted: is_locked=true<br/>form_submitted_at=NOW()<br/>Student access blocked
    
    Submitted --> Resubmit: Admin calls<br/>POST /api/students/restart-session<br/>is_locked=false<br/>form_submitted_at=null
    
    Resubmit --> CreatingDraft: Can re-edit
    
    Submitted --> AdminReview: Admin accesses<br/>GET /api/admin/forms/latest<br/>Form decrypted for review
    
    AdminReview --> AdminExport: Export to Excel<br/>POST /api/admin/export-excel<br/>All forms decrypted<br/>PDF/Excel generated
    
    AdminReview --> [*]: Approved/Rejected
```

## Access Control Flow

```mermaid
sequenceDiagram
    actor S as Student
    participant Web as Web Browser
    participant API as API Server
    participant DB as PostgreSQL
    
    S->>Web: Navigate to /login
    Web->>API: POST /api/auth/login
    API->>DB: SELECT * FROM students WHERE app_num=?
    DB-->>API: Student record
    
    alt Student Locked
        API-->>Web: 403 "Account locked"
        Web-->>S: Show error
    else Access Expired
        API-->>DB: Check access_expires_at > NOW()
        alt Expired
            API-->>Web: 403 "Access expired"
        else Valid
            API->>DB: INSERT INTO sessions (token, student_id, expires_at)
            DB-->>API: Token created
            API-->>Web: Set httpOnly cookie
            Web-->>S: Redirect to /student
        end
    end
    
    S->>Web: Submit form
    Web->>API: POST /api/forms/submit {payload}
    API->>API: Encrypt with AES-256-GCM
    API->>DB: INSERT encrypted form
    API->>DB: UPDATE students SET is_locked=true
    DB-->>API: Done
    API-->>Web: 200 OK
    Web-->>S: Show success
    
    S->>Web: Refresh page
    Web->>API: GET /api/students/me
    API->>DB: SELECT from_submitted_at FROM students
    DB-->>API: form_submitted_at is NOT NULL
    API-->>Web: 403 "Already submitted"
    Web-->>S: Show locked message
```

## Form Export Pipeline

```mermaid
graph LR
    A["Admin selects<br/>students from table"] -->|POST /api/admin/export-excel| B["Query Database<br/>SELECT s.*, f.*<br/>for each student"]
    
    B --> C["For each form:<br/>Decrypt with<br/>AES-256-GCM"]
    
    C --> D["Extract all<br/>form fields<br/>Collect unique names"]
    
    D --> E["Group students<br/>by department"]
    
    E --> F["Build Excel rows<br/>Basic + Dynamic cols"]
    
    F --> G["Format workbook<br/>Bold headers<br/>Auto width"]
    
    G --> H{useCustomPath?}
    
    H -->|Yes| I["Save to<br/>admin_settings.path"]
    
    H -->|No| J["Return as<br/>download"]
    
    I --> K["✅ Excel file<br/>ready"]
    J --> K
```

## Encryption Architecture

```mermaid
graph TD
    A["Form Data<br/>Plain JSON"] -->|POST /api/forms/submit| B["Generate<br/>Random IV 12 bytes"]
    
    B --> C["Load Encryption Key<br/>ENCRYPTION_KEY_BASE64<br/>32 bytes from env"]
    
    C --> D["AES-256-GCM Cipher<br/>key + IV"]
    
    D --> E["Encrypt<br/>Form JSON"]
    
    E --> F["Get Auth Tag<br/>for integrity check"]
    
    F --> G["Build Payload<br/>{v:1, alg, iv, tag, data}"]
    
    G -->|INSERT| H["Database<br/>encrypted_payload JSONB"]
    
    H -->|Later - Admin| I["GET /api/admin/forms/latest"]
    
    I --> J["Load Encryption Key<br/>from env"]
    
    J --> K["Extract IV, Tag, Data<br/>from encrypted_payload"]
    
    K --> L["AES-256-GCM Decipher<br/>key + IV + tag"]
    
    L --> M["Decrypt Data<br/>Verify Auth Tag"]
    
    M --> N["Return Plain JSON<br/>for Excel export"]
```

## API Authentication Guard

```mermaid
graph TD
    A["Incoming Request<br/>with Cookie"] --> B["getSession()"]
    
    B --> C["Read mgmt_session<br/>cookie from HttpOnly"]
    
    C --> D{"Token<br/>exists?"}
    
    D -->|No| E["Return null"]
    D -->|Yes| F["Query sessions table<br/>WHERE token=? AND<br/>expires_at > NOW()"]
    
    F --> G{"Row<br/>found?"}
    
    G -->|No| H["Return null"]
    G -->|Yes| I["Return SessionRow<br/>kind, admin_username<br/>OR student_id"]
    
    I --> J["Route Handler<br/>requireAdminSession()"]
    
    J --> K{"kind ==<br/>admin?"}
    
    K -->|No| L["Throw AuthError 401"]
    K -->|Yes| M["Proceed with<br/>admin logic"]
    
    L --> N["Return 401<br/>Unauthorized"]
    M --> O["Execute Route"]
```

## Data Storage - File Upload Flow

```mermaid
graph LR
    A["Student uploads<br/>Document.pdf<br/>Category: Aadhar"] -->|FormData| B["POST /api/documents"]
    
    B --> C["Generate file_key<br/>{uuid}_{timestamp}_{name}"]
    
    C --> D["Write to disk<br/>public/uploads/{file_key}"]
    
    D --> E["INSERT INTO<br/>student_documents<br/>student_id, category,<br/>file_key, size, type"]
    
    E --> F["Return 200 OK"]
    
    F -->|Later| G["Admin: GET /api/admin/documents<br/>?studentId=APP123"]
    
    G --> H["Query student_documents<br/>WHERE student_id=?"]
    
    H --> I["Return list of files<br/>with metadata"]
    
    I --> J["Admin clicks download"]
    
    J -->|GET /api/documents/download| K["Stream file from<br/>public/uploads/{file_key}"]
    
    K --> L["Browser downloads<br/>original filename"]
    
    L --> M["Admin can also<br/>DELETE document"]
    
    M --> N["Remove file from disk<br/>DELETE from DB"]
```

## Admin Dashboard Data Loading

```mermaid
sequenceDiagram
    actor Admin
    participant UI as Admin Dashboard
    participant API as API
    participant DB as Database

    Admin->>UI: Load /admin
    UI->>API: GET /api/auth/me
    alt Not logged in
        API-->>UI: 401
        UI->>UI: Redirect to /login
    else Logged in
        API-->>UI: {role: 'admin'}
        UI->>API: GET /api/students
        API->>DB: SELECT * FROM students
        API->>DB: SELECT DISTINCT student_id<br/>FROM forms WHERE status='draft'
        DB-->>API: All students + draft list
        API-->>UI: {students: [...]}
        UI->>UI: Render table with statuses
        
        Admin->>UI: Click student row
        UI->>API: GET /api/admin/forms/latest?app=APP123
        API->>DB: SELECT encrypted_payload<br/>FROM forms
        API->>API: Decrypt form
        API-->>UI: {payload: {...}}
        UI->>UI: Show StudentDetailModal
        
        Admin->>UI: Select students + Export
        UI->>API: POST /api/admin/export-excel
        API->>DB: Query all students + forms
        API->>API: Decrypt, build rows
        API->>API: Generate Excel
        API-->>UI: .xlsx file
        UI->>UI: Download starts
    end
```

## Technology Stack Diagram

```mermaid
graph TB
    subgraph Frontend["🎨 Frontend (Client)"]
        React["React 19"]
        Next["Next.js 16<br/>App Router"]
        FramerMotion["Framer Motion<br/>Animations"]
        GSAP["GSAP<br/>ScrollTrigger"]
        Tailwind["Tailwind CSS"]
        XLSX["XLSX<br/>Excel reading"]
        HTML2Canvas["html2canvas<br/>Screenshot"]
    end

    subgraph Backend["⚙️ Backend (Node.js)"]
        NextRoutes["Next.js API Routes<br/>Route Handlers"]
        TypeScript["TypeScript<br/>Type Safety"]
        Bcrypt["Bcryptjs<br/>Password Hashing"]
        Crypto["Node.js Crypto<br/>AES-256-GCM"]
    end

    subgraph Database["🗄️ Database"]
        PostgreSQL["PostgreSQL 14+"]
        JSONB["JSONB<br/>Additional Fields"]
        pgcrypto["pgcrypto<br/>UUID generation"]
    end

    subgraph Tools["🛠️ Tools & Config"]
        ESLint["ESLint 9<br/>Code Quality"]
        PostCSS["PostCSS 4<br/>CSS Processing"]
        TypescriptConfig["TypeScript Config"]
        Environmental["Environment Vars"]
    end

    React --> Next
    Next --> NextRoutes
    Next --> Tailwind
    React --> FramerMotion
    React --> GSAP
    React --> XLSX
    React --> HTML2Canvas

    NextRoutes --> TypeScript
    TypeScript --> Crypto
    TypeScript --> Bcrypt
    TypeScript --> PostgreSQL

    PostgreSQL --> JSONB
    PostgreSQL --> pgcrypto

    ESLint -.->|Code Quality| TypeScript
    PostCSS -.->|Styling| Tailwind
    Environmental -.->|Config| NextRoutes
```

## Security Layers

```mermaid
graph TD
    A["Client Request"] --> B["HTTPS/TLS<br/>Transport Layer"]
    
    B --> C["HTTP-only Cookie<br/>Session Token"]
    
    C --> D["Database Validation<br/>Sessions Table<br/>Expiry Check"]
    
    D --> E["Role Verification<br/>admin vs student<br/>requireAdminSession()"]
    
    E --> F{Type of<br/>Operation}
    
    F -->|Student Data| G["Ownership Check<br/>session.student_id<br/>== resource.student_id"]
    
    F -->|Admin Only| H["Admin Check<br/>session.kind<br/>== 'admin'"]
    
    F -->|File Access| I["Verify student owns<br/>file before download"]
    
    G --> J["Database Operation<br/>with parameterized<br/>queries"]
    
    H --> J
    I --> J
    
    J --> K{Data Type}
    
    K -->|Forms| L["Encrypted at Rest<br/>AES-256-GCM<br/>ENCRYPTION_KEY_BASE64"]
    
    K -->|Passwords| M["Bcrypt Hashed<br/>10 salt rounds"]
    
    K -->|Files| N["Unique file keys<br/>Access control<br/>via DB"]
    
    L --> O["Response<br/>via HTTPS"]
    M --> O
    N --> O
```

---

These diagrams illustrate:
1. **System Overview** - High-level architecture
2. **Database Schema** - Entity relationships
3. **Form Lifecycle** - State machine for submissions
4. **Access Control** - Session validation flow
5. **Export Pipeline** - Excel generation process
6. **Encryption** - AES-256-GCM flow
7. **Auth Guards** - API protection layers
8. **File Upload** - Document storage process
9. **Dashboard** - Data loading sequence
10. **Tech Stack** - Technology choices
11. **Security** - Multi-layer defense
