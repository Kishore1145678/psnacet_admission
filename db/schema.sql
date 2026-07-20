-- Run once against your PostgreSQL database (see scripts/setup-db.mjs)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_accounts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  institutional_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  academic_branch TEXT NOT NULL,
  blood_group TEXT DEFAULT '',
  father_name TEXT DEFAULT '',
  mother_name TEXT DEFAULT '',
  father_mobile_number TEXT DEFAULT '',
  mobile_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'In Review',
  completion_status TEXT NOT NULL DEFAULT 'Complete',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  access_expires_at TIMESTAMPTZ,
  form_submitted_at TIMESTAMPTZ,
  extended_days INT NOT NULL DEFAULT 0,
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_departments (
  id SERIAL PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('admin', 'student')),
  admin_username TEXT,
  student_id UUID REFERENCES students (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_application_forms (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  encrypted_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forms_student_created ON student_application_forms (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forms_status ON student_application_forms (status);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_students_created ON students (created_at DESC);

CREATE TABLE IF NOT EXISTS admin_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
