import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { normalizeApplicationNumber, pgDateToYmd } from '@/lib/student-password';

type StudentRow = {
  id: string;
  application_number: string;
  institutional_id: string;
  full_name: string;
  date_of_birth: Date;
  academic_branch: string;
  father_name: string;
  mother_name: string;
  father_mobile_number: string;
  mobile_number: string;
  status: string;
  completion_status: string;
  is_locked: boolean;
  extended_days: number;
  additional_info: any;
  created_at: Date;
  updated_at: Date;
};

function statusMeta(status: string) {
  if (status === 'Approved') {
    return { statusText: 'text-emerald-600', statusBg: 'bg-emerald-50', statusBorder: 'border-emerald-200' };
  }
  if (status === 'In Review') {
    return { statusText: 'text-amber-600', statusBg: 'bg-amber-50', statusBorder: 'border-amber-200' };
  }
  return { statusText: 'text-red-600', statusBg: 'bg-red-50', statusBorder: 'border-red-200' };
}

function rowToApplication(row: StudentRow) {
  const initials = row.full_name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const date = new Date(row.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const dob = pgDateToYmd(row.date_of_birth);
  const st = statusMeta(row.status);
  return {
    id: row.application_number,
    initials,
    name: row.full_name,
    status: row.status,
    date,
    statusText: st.statusText,
    statusBg: st.statusBg,
    statusBorder: st.statusBorder,
    department: row.academic_branch,
    dob,
    mobile: row.mobile_number || undefined,
    fatherName: row.father_name || undefined,
    motherName: row.mother_name || undefined,
    fatherMobile: row.father_mobile_number || undefined,
    completionStatus: row.completion_status as 'Partial' | 'Complete' | 'Not Started',
    isLocked: row.is_locked,
    extendedDays: row.extended_days || undefined,
    formOpenedAt: row.additional_info?.form_opened_at || undefined,
    // submitTime will be set by GET() based on form submission status
    // Spread additional info fields
    ...(row.additional_info || {}),
  };
}

function makeInstitutionalId() {
  return `INST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET() {
  try {
    await requireAdminSession();
    const { rows } = await query<StudentRow>(
      `SELECT * FROM students ORDER BY created_at DESC`
    );
    
    // Determine status from latest form row per student.
    const { rows: formStatusRows } = await query<{ student_id: string; latest_status: string; submit_time?: Date }>(
      `SELECT latest.student_id, latest.status AS latest_status, latest.updated_at AS submit_time
       FROM (
         SELECT DISTINCT ON (student_id) student_id, status, updated_at
         FROM student_application_forms
         ORDER BY student_id, updated_at DESC
       ) latest`
    );
    
    // Build map for quick lookup
    const studentFormStatus = new Map<string, { latestStatus: string; submitTime?: Date }>();
    for (const row of formStatusRows) {
      studentFormStatus.set(row.student_id, {
        latestStatus: row.latest_status,
        submitTime: row.submit_time,
      });
    }
    
    // Map students and set completionStatus based on form submission status
    const applications = rows.map(row => {
      const app = rowToApplication(row);
      const formStatus = studentFormStatus.get(row.id);
      
      if (formStatus?.latestStatus === 'submitted') {
        // Latest form is submitted -> complete.
        app.completionStatus = 'Complete';
        if (formStatus.submitTime) {
          app.submitTime = new Date(formStatus.submitTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        }
      } else if (formStatus?.latestStatus === 'draft') {
        // Draft exists, but not submitted -> partial.
        app.completionStatus = 'Partial';
      } else {
        // No form record at all -> not started.
        app.completionStatus = 'Not Started';
      }
      
      return app;
    });
    
    return NextResponse.json({ students: applications });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const application_number = normalizeApplicationNumber(String(body.application_number ?? body.id ?? ''));
    const full_name = String(body.full_name ?? body.name ?? '').trim();
    const date_of_birth = String(body.date_of_birth ?? body.dob ?? '').split('T')[0];
    const academic_branch = String(body.academic_branch ?? body.department ?? '').trim();
    const father_name = String(body.father_name ?? '').trim();
    const mother_name = String(body.mother_name ?? '').trim();
    const father_mobile_number = String(body.father_mobile_number ?? body.fatherMobile ?? body.mobile ?? '').trim();
    const mobile_number = String(body.mobile_number ?? '').trim();

    if (!application_number || !full_name || !date_of_birth || !academic_branch) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const institutional_id = makeInstitutionalId();

    const accessExpiresAt = new Date();
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 5);

    const { rows } = await query<StudentRow>(
      `INSERT INTO students (
        application_number, institutional_id, full_name, date_of_birth, academic_branch,
        father_name, mother_name, father_mobile_number, mobile_number, status, completion_status, is_locked, access_expires_at, extended_days
      ) VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        application_number,
        institutional_id,
        full_name,
        date_of_birth,
        academic_branch,
        father_name,
        mother_name,
        father_mobile_number,
        mobile_number,
        'In Review',
        'Complete',
        false,
        accessExpiresAt.toISOString(),
        0,
      ]
    );

    return NextResponse.json({ student: rowToApplication(rows[0]) });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const err = e as { code?: string };
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Application number already exists' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const application_number = normalizeApplicationNumber(String(body.application_number ?? body.id ?? ''));
    if (!application_number) {
      return NextResponse.json({ error: 'application_number required' }, { status: 400 });
    }

    if (typeof body.extended_days === 'number') {
      const newAccessExpiresAt = new Date();
      newAccessExpiresAt.setDate(newAccessExpiresAt.getDate() + body.extended_days);
      
      await query(
        `UPDATE students SET extended_days = $2, access_expires_at = $3, updated_at = NOW() WHERE LOWER(application_number) = LOWER($1)`,
        [application_number, body.extended_days, newAccessExpiresAt.toISOString()]
      );
      const { rows } = await query<StudentRow>(
        `SELECT * FROM students WHERE LOWER(application_number) = LOWER($1)`,
        [application_number]
      );
      if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ student: rowToApplication(rows[0]) });
    }

    const full_name = String(body.full_name ?? body.name ?? '').trim();
    const date_of_birth = (body.date_of_birth ?? body.dob)
      ? String(body.date_of_birth ?? body.dob).split('T')[0]
      : null;
    const academic_branch = (body.academic_branch ?? body.department)
      ? String(body.academic_branch ?? body.department).trim()
      : null;
    const father_name = body.father_name != null ? String(body.father_name).trim() : null;
    const mother_name = body.mother_name != null ? String(body.mother_name).trim() : null;
    const father_mobile_number = body.father_mobile_number != null ? String(body.father_mobile_number).trim() : null;
    const mobile_number = body.mobile_number != null ? String(body.mobile_number).trim() : null;

    // Additional fields stored in JSONB
    const additionalInfo: Record<string, any> = {};
    const additionalFields = [
      // Additional Information
      'aadhar_number', 'student_aadhaar', 'student_age', 'student_gender',
      // Contact & Guardian
      'guardian_name', 'student_email',
      'permanent_address', 'permanent_city', 'permanent_state', 'permanent_pincode',
      'communication_address', 'communication_city', 'communication_state', 'communication_pincode',
      // Father Information
      'father_occupation_type', 'father_occupation', 'father_income',
      // Mother Information  
      'mother_occupation_type', 'mother_occupation', 'mother_income', 'mother_mobile',
      // Personal Details
      'mother_tongue', 'nationality', 'caste', 'religion', 'residential_status',
      'day_scholar_need_bus', 'bus_district', 'bus_area', 'nearby_bus_stop',
      'student_specially_abled', 'tn_study', 'govt_school',
      // Academic Information
      'admission_date', 'admission_year', 'board_studied', 'admission_batch', 
      'mark_cutoff', 'pcm_target', 'mark_physics', 'mark_chemistry', 'mark_maths',
      // Other Information
      'admission_allotment_number', 'admission_category', 'emis_number', 'civic_status',
      'school_location', 'relative_name', 'hear_about_psna',
      // Class-wise information (VI-XII)
      'school_VI_year_passing', 'school_VI_name', 'school_VI_category', 'school_VI_medium', 'school_VI_block', 'school_VI_score',
      'school_VII_year_passing', 'school_VII_name', 'school_VII_category', 'school_VII_medium', 'school_VII_block', 'school_VII_score',
      'school_VIII_year_passing', 'school_VIII_name', 'school_VIII_category', 'school_VIII_medium', 'school_VIII_block', 'school_VIII_score',
      'school_IX_year_passing', 'school_IX_name', 'school_IX_category', 'school_IX_medium', 'school_IX_block', 'school_IX_score',
      'school_X_year_passing', 'school_X_name', 'school_X_category', 'school_X_medium', 'school_X_block', 'school_X_score',
      'school_XI_year_passing', 'school_XI_name', 'school_XI_category', 'school_XI_medium', 'school_XI_block', 'school_XI_score',
      'school_XII_year_passing', 'school_XII_name', 'school_XII_category', 'school_XII_medium', 'school_XII_block', 'school_XII_score',
    ];
    
    additionalFields.forEach(field => {
      if (body[field] != null) {
        additionalInfo[field] = String(body[field]).trim();
      }
    });

    console.log('PATCH update data:', {
      application_number,
      full_name,
      date_of_birth,
      academic_branch,
      father_name,
      mother_name,
      father_mobile_number,
      mobile_number,
      additionalInfo,
    });

    if (!full_name || !date_of_birth || !academic_branch) {
      console.log('Validation failed:', { full_name, date_of_birth, academic_branch });
      return NextResponse.json({ error: 'Missing required fields: full_name, date_of_birth, and academic_branch' }, { status: 400 });
    }

    const result = await query(
      `UPDATE students SET
        full_name = $2,
        date_of_birth = $3::date,
        academic_branch = $4,
        father_name = $5,
        mother_name = $6,
        father_mobile_number = $7,
        mobile_number = $8,
        additional_info = COALESCE(additional_info, '{}'::jsonb) || $9::jsonb,
        updated_at = NOW()
      WHERE LOWER(application_number) = LOWER($1)`,
      [
        application_number,
        full_name,
        date_of_birth,
        academic_branch,
        father_name ?? '',
        mother_name ?? '',
        father_mobile_number ?? '',
        mobile_number ?? '',
        JSON.stringify(additionalInfo),
      ]
    );

    console.log('UPDATE affected rows:', result.rowCount);

    const { rows } = await query<StudentRow>(
      `SELECT * FROM students WHERE LOWER(application_number) = LOWER($1)`,
      [application_number]
    );
    console.log('Updated student data:', rows[0]);
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ student: rowToApplication(rows[0]) });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const application_number = normalizeApplicationNumber(String(body.application_number ?? body.id ?? ''));
    if (!application_number) {
      return NextResponse.json({ error: 'application_number required' }, { status: 400 });
    }
    await query(`DELETE FROM students WHERE LOWER(application_number) = LOWER($1)`, [application_number]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
