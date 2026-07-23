import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { normalizeApplicationNumber } from '@/lib/student-password';
import { normalizeBranchToAbbreviation } from '@/lib/branch-mapping';

function makeInstitutionalId() {
  return `INST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const students = body.students;

    if (!Array.isArray(students)) {
      return NextResponse.json({ error: 'Invalid payload: expected an array of students' }, { status: 400 });
    }

    try {
      await query(`ALTER TABLE students ALTER COLUMN date_of_birth DROP NOT NULL`);
    } catch {
      // Column might already be nullable
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Execute sequentially to ensure unique IDs and accurate duplicate tracking
    for (const student of students) {
      try {
        const application_number = normalizeApplicationNumber(String(student.application_number ?? student.id ?? ''));
        const full_name = String(student.full_name ?? student.name ?? '').trim();
        const rawDob = String(student.date_of_birth ?? student.dob ?? '').trim();
        const date_of_birth = (rawDob && rawDob !== 'NaN-NaN-NaN' && rawDob !== 'undefined' && rawDob !== 'null') ? rawDob.split('T')[0] : null;
        const academic_branch = normalizeBranchToAbbreviation(String(student.academic_branch ?? student.department ?? '').trim());
        const father_name = String(student.father_name ?? '').trim();
        const mother_name = String(student.mother_name ?? '').trim();
        const father_mobile_number = String(student.father_mobile_number ?? student.fatherMobile ?? student.mobile ?? '').trim();
        const mobile_number = String(student.mobile_number ?? '').trim();

        if (!application_number || !full_name || !academic_branch || (!mobile_number && !father_mobile_number)) {
          results.failed++;
          results.errors.push(`Row missing required fields (App No, Name, Branch, or Phone Number). App No: ${application_number || 'Unknown'}`);
          continue;
        }

        const { rows: existingRows } = await query(
          `SELECT *, to_char(date_of_birth, 'YYYY-MM-DD') as dob_str FROM students WHERE application_number = $1`,
          [application_number]
        );

        if (existingRows.length > 0) {
          const existing = existingRows[0];
          
          if (
            existing.full_name === full_name &&
            (existing.dob_str || null) === date_of_birth &&
            existing.academic_branch === academic_branch &&
            (existing.father_name || '') === father_name &&
            (existing.mother_name || '') === mother_name &&
            (existing.father_mobile_number || '') === father_mobile_number &&
            (existing.mobile_number || '') === mobile_number
          ) {
            results.failed++;
            results.errors.push(`Exact duplicate skipped: ${application_number} (${full_name})`);
            continue;
          } else {
            // Update existing record
            await query(
              `UPDATE students SET
                full_name = $2, date_of_birth = $3::date, academic_branch = $4,
                father_name = $5, mother_name = $6, father_mobile_number = $7, mobile_number = $8,
                updated_at = NOW()
               WHERE application_number = $1`,
               [
                 application_number, full_name, date_of_birth, academic_branch,
                 father_name, mother_name, father_mobile_number, mobile_number
               ]
            );
            results.success++;
            continue;
          }
        }

        const institutional_id = makeInstitutionalId();
        const accessExpiresAt = new Date();
        accessExpiresAt.setDate(accessExpiresAt.getDate() + 5);

        await query(
          `INSERT INTO students (
            application_number, institutional_id, full_name, date_of_birth, academic_branch,
            father_name, mother_name, father_mobile_number, mobile_number, status, completion_status, is_locked, access_expires_at, extended_days
          ) VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
            'Complete', // Initially set to Complete as per standard manual creation
            false,
            accessExpiresAt.toISOString(),
            0,
          ]
        );
        results.success++;
      } catch (e: any) {
        if (e.code === '23505') {
          results.failed++;
          results.errors.push(`Duplicate application number: ${student.application_number || student.id}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to process ${student.application_number || 'Unknown'}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Bulk upload error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
