import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { decryptJson, EncryptedPayload } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

function buildStudentExportRow(dbStudent: any, formData: Record<string, any>) {
  const val = (...keys: string[]) => {
    for (const key of keys) {
      // 1. Direct form data check
      const v1 = formData?.[key];
      if (v1 !== undefined && v1 !== null && String(v1).trim() !== '' && String(v1).trim() !== '-') return String(v1).trim();

      // 2. Prefill object check
      const v2 = formData?.prefill?.[key];
      if (v2 !== undefined && v2 !== null && String(v2).trim() !== '' && String(v2).trim() !== '-') return String(v2).trim();

      // 3. Database record check
      const v3 = dbStudent?.[key];
      if (v3 !== undefined && v3 !== null && String(v3).trim() !== '' && String(v3).trim() !== '-') return String(v3).trim();
    }
    return '-';
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-IN');
    } catch {
      return String(dateVal);
    }
  };

  const dobRaw = dbStudent?.date_of_birth || formData?.student_dob || formData?.date_of_birth || formData?.dob || formData?.prefill?.date_of_birth;
  const dobFormatted = formatDate(dobRaw);

  const exportRow: Record<string, any> = {
    // ===== BASIC INFORMATION =====
    'Application Number': val('application_number'),
    'Institutional ID': val('institutional_id'),
    'Full Name': val('full_name', 'student_name', 'name'),
    'Academic Branch': val('academic_branch', 'student_branch', 'department'),
    'Status': val('status'),
    'Completion Status': val('completion_status'),

    // ===== PERSONAL DETAILS =====
    'Date of Birth': dobFormatted,
    'Age': val('student_age', 'age'),
    'Gender': val('student_gender', 'gender'),
    'Blood Group': val('blood_group', 'student_blood_group'),
    'Nationality': val('nationality'),
    'Religion': val('religion'),
    'Mother Tongue': val('mother_tongue'),
    'Community': val('community'),
    'Caste': val('caste'),
    'Student Mobile': val('mobile_number', 'student_mobile', 'mobile'),
    'Student Email': val('student_email', 'email'),
    'Student Aadhaar': val('student_aadhaar', 'aadhar_number', 'aadhar'),
    'EMIS Number': val('emis_number', 'emis'),
    'Specially Abled': val('student_specially_abled', 'specially_abled'),
    'Studied in TN': val('tn_study', 'studied_tn'),
    'Government School Student': val('govt_school', 'studied_in_govt_school'),

    // ===== FAMILY DETAILS =====
    'Father Name': val('father_name'),
    'Father Occupation': val('father_occupation'),
    'Father Occupation Type': val('father_occupation_type'),
    'Father Mobile': val('father_mobile_number', 'father_mobile'),
    'Father Annual Income': val('father_income'),
    'Mother Name': val('mother_name'),
    'Mother Occupation': val('mother_occupation'),
    'Mother Occupation Type': val('mother_occupation_type'),
    'Mother Mobile': val('mother_mobile'),
    'Mother Annual Income': val('mother_income'),
    'Guardian Name': val('guardian_name'),
    'Guardian Mobile': val('guardian_mobile'),

    // ===== ADDRESS DETAILS =====
    'Permanent Address': val('permanent_address'),
    'Permanent City / District': val('permanent_city', 'district', 'city'),
    'Permanent State': val('permanent_state', 'state'),
    'Permanent Pincode': val('permanent_pincode', 'pincode'),
    'Communication Address': val('communication_address'),

    // ===== ADMISSION & SCHOOL DETAILS =====
    'Admission Category (GQ/MQ)': val('admission_category', 'gq_mq_type'),
    'GQ/MQ Allotment Number': val('admission_allotment_number', 'gq_mq_number'),
    'Admission Year': val('admission_year', 'admission_batch'),
    'Board Studied': val('board_studied', 'hsc_board'),
    'School Location': val('school_location'),
    'Civic Status': val('civic_status'),
    'Residential Status': val('residential_status'),
    'Hostel Stay': val('hostel_stay'),
    'Day Scholar Bus Required': val('day_scholar_need_bus'),
    'Bus District': val('bus_district'),
    'Bus Area': val('bus_area'),
    'Nearby Bus Stop': val('nearby_bus_stop'),

    // ===== RELATIVE DETAILS =====
    'Relative in College': val('relative_in_college', 'relative_name'),
    'Relative Name': val('relative_name'),
    'Relative Branch': val('relative_branch'),
    'Relative Year': val('relative_year'),
    'Relative Relation': val('relative_relation'),

    // ===== ACADEMIC MARKS =====
    'Class 12 Year of Passing': val('marks_12_year_passing'),
    'Class 12 Total Marks': val('marks_12_total'),
    'Class 12 Obtained Marks': val('marks_12_obtained'),
    'Class 12 Percentage': val('marks_12_percentage'),
    'Physics Mark': val('mark_physics'),
    'Chemistry Mark': val('mark_chemistry'),
    'Mathematics Mark': val('mark_maths'),
    'Cutoff Mark': val('mark_cutoff'),

    // ===== SYSTEM DETAILS =====
    'Is Locked': dbStudent?.is_locked ? 'Yes' : 'No',
    'Date Submitted': dbStudent?.form_submitted_at ? formatDate(dbStudent.form_submitted_at) : '-',
  };

  // Add any extra unmapped fields from formData dynamically
  for (const [k, v] of Object.entries(formData)) {
    if (
      !k.startsWith('_') &&
      !k.endsWith('_base64') &&
      k !== 'meta' &&
      k !== 'prefill' &&
      typeof v !== 'object' &&
      !(k in exportRow)
    ) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        exportRow[k] = String(v).trim();
      }
    }
  }

  return exportRow;
}

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    if (!studentIdParam) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT 
        s.*,
        f.encrypted_payload
      FROM students s
      LEFT JOIN LATERAL (
        SELECT encrypted_payload
        FROM student_application_forms
        WHERE student_id = s.id OR student_id::text = s.application_number
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      ) f ON true
      WHERE s.id::text = $1::text OR s.application_number = $1
      LIMIT 1`,
      [studentIdParam]
    );

    const dbStudent = rows[0] as any;
    if (!dbStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let formData: Record<string, any> = {};
    if (dbStudent.encrypted_payload) {
      try {
        const payload = typeof dbStudent.encrypted_payload === 'string'
          ? JSON.parse(dbStudent.encrypted_payload)
          : dbStudent.encrypted_payload;
        formData = decryptJson(payload as EncryptedPayload) || {};
      } catch {
        formData = typeof dbStudent.encrypted_payload === 'string' ? JSON.parse(dbStudent.encrypted_payload) : dbStudent.encrypted_payload;
      }
    }
    if (dbStudent.additional_info && typeof dbStudent.additional_info === 'object') {
      formData = { ...formData, ...dbStudent.additional_info };
    }

    const exportRow = buildStudentExportRow(dbStudent, formData);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([exportRow]);
    
    // Auto column widths
    const colWidths = Object.keys(exportRow).map((col) => ({
      wch: Math.max(col.length + 3, 16),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Student Details');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const uint8Array = new Uint8Array(buffer);
    const filename = `student_${dbStudent.application_number}_details.xlsx`;

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error('Single student excel export error:', error);
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { students, useCustomPath } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student details available to download.' }, { status: 400 });
    }

    let exportPath: string | null = null;
    if (useCustomPath) {
      try {
        const { rows } = await query(
          `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
        );
        exportPath = (rows[0]?.value as string) || null;
      } catch (e) {
        return NextResponse.json({ 
          error: `Failed to retrieve export path: ${e instanceof Error ? e.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

    if (exportPath) {
      exportPath = exportPath.trim();
      if (!exportPath) {
        return NextResponse.json({ error: 'Export path is empty' }, { status: 400 });
      }
    }

    const studentIdentifiers: string[] = students
      .map((s: any) => s._studentId || s['Application Number'] || s.id)
      .filter(Boolean);

    let dbStudents: any[] = [];
    if (studentIdentifiers.length > 0) {
      try {
        const placeholders = studentIdentifiers.map((_: string, i: number) => `$${i + 1}`).join(',');
        const { rows } = await query(
          `SELECT 
            s.*,
            f.encrypted_payload,
            f.created_at as form_created_at
          FROM students s
          LEFT JOIN LATERAL (
            SELECT encrypted_payload, created_at
            FROM student_application_forms
            WHERE student_id = s.id OR student_id::text = s.application_number
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
          ) f ON true
          WHERE s.application_number = ANY(ARRAY[${placeholders}]::text[]) OR s.id::text = ANY(ARRAY[${placeholders}]::text[])`,
          studentIdentifiers
        );
        dbStudents = rows;
      } catch (e) {
        console.error('Error querying students from database:', e);
      }
    }

    const dbStudentMap = new Map();
    dbStudents.forEach((s: any) => {
      dbStudentMap.set(s.application_number, s);
      dbStudentMap.set(s.id, s);
    });

    const deptMap = new Map<string, any[]>();
    
    students.forEach((student: any) => {
      const appNumber = student._studentId || student['Application Number'] || student.id;
      const dbStudent = appNumber ? dbStudentMap.get(appNumber) : null;
      
      const dept = (dbStudent?.academic_branch || student.department || 'Unknown').toString();
      if (!deptMap.has(dept)) deptMap.set(dept, []);

      let formData: any = {};
      if (dbStudent?.encrypted_payload) {
        try {
          const payload = typeof dbStudent.encrypted_payload === 'string' 
            ? JSON.parse(dbStudent.encrypted_payload) 
            : dbStudent.encrypted_payload;
          
          formData = decryptJson<any>(payload) || {};
        } catch (e) {
          console.warn(`Failed to decrypt form for student ${appNumber}:`, e instanceof Error ? e.message : 'Unknown error');
        }
      }

      if (dbStudent?.additional_info && typeof dbStudent.additional_info === 'object') {
        formData = { ...formData, ...dbStudent.additional_info };
      }

      const exportRow = buildStudentExportRow(dbStudent || student, formData);
      deptMap.get(dept)!.push(exportRow);
    });

    const wb = XLSX.utils.book_new();
    let sheetsCreated = 0;

    deptMap.forEach((deptStudents, deptName) => {
      const ws = XLSX.utils.json_to_sheet(deptStudents);
      const columnNames = deptStudents.length > 0 ? Object.keys(deptStudents[0]) : [];
      
      const colWidths: any[] = [];
      columnNames.forEach((col) => {
        const width = Math.max(col.length + 3, 16);
        colWidths.push({ wch: width });
      });
      
      ws['!cols'] = colWidths;
      let safeDeptName = deptName.replace(/[\\/?*[\]:]/g, ' ').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeDeptName);
      sheetsCreated++;
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `PSNACET_Student_Applications_${timestamp}.xlsx`;

    if (exportPath) {
      try {
        if (!fs.existsSync(exportPath)) {
          fs.mkdirSync(exportPath, { recursive: true });
        }
        const fullPath = path.join(exportPath, filename);
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        fs.writeFileSync(fullPath, buffer);

        return NextResponse.json({
          success: true,
          message: `Excel exported successfully to: ${fullPath}`,
          path: fullPath,
          filename: filename,
          studentCount: students.length,
          sheetsCreated
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: `Failed to write file: ${error.message}`,
          path: exportPath
        }, { status: 500 });
      }
    } else {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const uint8Array = new Uint8Array(buffer);
      return new Response(uint8Array, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Length': uint8Array.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Unexpected error in export-excel:', error);
    return NextResponse.json({ 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}` 
    }, { status: 500 });
  }
}
