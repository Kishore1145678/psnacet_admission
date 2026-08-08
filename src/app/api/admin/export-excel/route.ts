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
    'Application Number': val('application_number', 'applicationNumber', 'appNo', 'id'),
    'Institutional ID': val('institutional_id', 'institutionalId', 'regNo', 'register_number', 'roll_number', 'rollNo'),
    'Full Name': val('full_name', 'fullName', 'student_name', 'studentName', 'name', 'first_name'),
    'Academic Branch': val('academic_branch', 'academicBranch', 'student_branch', 'department', 'branch'),
    'Status': val('status'),
    'Completion Status': val('completion_status', 'completionStatus'),

    // ===== PERSONAL DETAILS =====
    'Date of Birth': dobFormatted,
    'Age': val('student_age', 'age', 'studentAge', 'dob_age'),
    'Gender': val('student_gender', 'gender', 'studentGender'),
    'Blood Group': val('blood_group', 'student_blood_group', 'bloodGroup', 'studentBloodGroup'),
    'Nationality': val('nationality'),
    'Religion': val('religion'),
    'Mother Tongue': val('mother_tongue', 'motherTongue'),
    'Community': val('community'),
    'Caste': val('caste'),
    'Student Mobile': val('mobile_number', 'student_mobile', 'mobileNumber', 'mobile', 'phone'),
    'Student Email': val('student_email', 'studentEmail', 'email'),
    'Student Aadhaar': val('student_aadhaar', 'studentAadhaar', 'aadhar_number', 'aadharNumber', 'aadhar', 'aadhaar'),
    'EMIS Number': val('emis_number', 'emisNumber', 'emis', 'emisNo'),
    'Specially Abled': val('student_specially_abled', 'studentSpeciallyAbled', 'specially_abled', 'speciallyAbled'),
    'Studied in TN': val('tn_study', 'tnStudy', 'studied_tn', 'studiedTN', 'studied_in_tn'),
    'Government School Student': val('govt_school', 'govtSchool', 'studied_in_govt_school', 'govt_school_student'),

    // ===== FAMILY DETAILS =====
    'Father Name': val('father_name', 'fatherName'),
    'Father Occupation': val('father_occupation', 'fatherOccupation'),
    'Father Occupation Type': val('father_occupation_type', 'fatherOccupationType'),
    'Father Mobile': val('father_mobile_number', 'fatherMobileNumber', 'father_mobile', 'fatherMobile'),
    'Father Annual Income': val('father_income', 'fatherIncome', 'father_annual_income'),
    'Mother Name': val('mother_name', 'motherName'),
    'Mother Occupation': val('mother_occupation', 'motherOccupation'),
    'Mother Occupation Type': val('mother_occupation_type', 'motherOccupationType'),
    'Mother Mobile': val('mother_mobile', 'motherMobile'),
    'Mother Annual Income': val('mother_income', 'motherIncome', 'mother_annual_income'),
    'Guardian Name': val('guardian_name', 'guardianName', 'guardian'),
    'Guardian Mobile': val('guardian_mobile', 'guardianMobile'),

    // ===== ADDRESS DETAILS =====
    'Permanent Address': val('permanent_address', 'permanentAddress', 'address'),
    'Permanent City / District': val('permanent_city', 'permanentCity', 'district', 'city'),
    'Permanent State': val('permanent_state', 'permanentState', 'state'),
    'Permanent Pincode': val('permanent_pincode', 'permanentPincode', 'pincode', 'pin_code'),
    'Communication Address': val('communication_address', 'communicationAddress'),

    // ===== ADMISSION & SCHOOL DETAILS =====
    'Admission Category (GQ/MQ)': val('admission_category', 'admissionCategory', 'gq_mq_type', 'gqMqType'),
    'GQ/MQ Allotment Number': val('admission_allotment_number', 'admissionAllotmentNumber', 'gq_mq_number', 'gqMqNumber'),
    'Admission Year': val('admission_year', 'admissionYear', 'admission_batch', 'batch'),
    'Board Studied': val('board_studied', 'boardStudied', 'hsc_board', 'hscBoard'),
    'School Location': val('school_location', 'schoolLocation'),
    'Civic Status': val('civic_status', 'civicStatus'),
    'Residential Status': val('residential_status', 'residentialStatus'),
    'Hostel Stay': val('hostel_stay', 'hostelStay'),
    'Day Scholar Bus Required': val('day_scholar_need_bus', 'dayScholarNeedBus', 'busRequired'),
    'Bus District': val('bus_district', 'busDistrict'),
    'Bus Area': val('bus_area', 'busArea'),
    'Nearby Bus Stop': val('nearby_bus_stop', 'nearbyBusStop'),

    // ===== RELATIVE DETAILS =====
    'Relative in College': val('relative_in_college', 'relativeInCollege', 'relativesInCollege'),
    'Relative Name': val('relative_name', 'relativeName'),
    'Relative Branch': val('relative_branch', 'relativeBranch'),
    'Relative Year': val('relative_year', 'relativeYear'),
    'Relative Relation': val('relative_relation', 'relativeRelation'),

    // ===== ACADEMIC MARKS =====
    'Class 12 Year of Passing': val('marks_12_year_passing', 'marks12YearPassing', 'year_passing'),
    'Class 12 Total Marks': val('marks_12_total', 'marks12Total', 'total_marks'),
    'Class 12 Obtained Marks': val('marks_12_obtained', 'marks12Obtained', 'obtained_marks'),
    'Class 12 Percentage': val('marks_12_percentage', 'marks12Percentage', 'percentage'),
    'Physics Mark': val('mark_physics', 'physicsMark', 'physics_mark', 'physics'),
    'Chemistry Mark': val('mark_chemistry', 'chemistryMark', 'chemistry_mark', 'chemistry'),
    'Mathematics Mark': val('mark_maths', 'mathsMark', 'math_mark', 'maths_mark', 'maths'),
    'Cutoff Mark': val('mark_cutoff', 'cutoffMark', 'cutoff', 'cutoff_mark'),

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

// Fetch DB student and decrypt payload
async function fetchAndDecryptStudents(studentIds?: string[]) {
  let queryText = `
    SELECT 
      s.*,
      f.encrypted_payload,
      f.created_at as form_created_at
    FROM students s
    LEFT JOIN LATERAL (
      SELECT encrypted_payload, created_at
      FROM student_application_forms
      WHERE student_id = s.id OR student_id::text = s.application_number OR student_id::text = s.id::text
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
    ) f ON true
  `;

  let queryParams: any[] = [];
  if (studentIds && studentIds.length > 0) {
    queryText += ` WHERE s.application_number = ANY($1::text[]) OR s.id::text = ANY($1::text[])`;
    queryParams = [studentIds];
  }

  queryText += ` ORDER BY s.academic_branch ASC, s.created_at DESC`;

  const { rows } = await query(queryText, queryParams);
  
  return rows.map((dbStudent: any) => {
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

    return buildStudentExportRow(dbStudent, formData);
  });
}

function buildExcelWorkbook(exportRows: Record<string, any>[]) {
  const deptMap = new Map<string, Record<string, any>[]>();
  
  exportRows.forEach((row) => {
    const dept = (row['Academic Branch'] || 'Unknown').toString();
    if (!deptMap.has(dept)) deptMap.set(dept, []);
    deptMap.get(dept)!.push(row);
  });

  const wb = XLSX.utils.book_new();
  let sheetsCreated = 0;

  if (deptMap.size === 0) {
    const ws = XLSX.utils.json_to_sheet(exportRows.length > 0 ? exportRows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, 'Student Details');
    sheetsCreated = 1;
  } else {
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
  }

  return { wb, sheetsCreated };
}

export async function GET(req: Request) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    // Single student or ALL students
    let exportRows: Record<string, any>[] = [];

    if (studentIdParam && studentIdParam !== 'all') {
      const { rows } = await query(
        `SELECT 
          s.*,
          f.encrypted_payload
        FROM students s
        LEFT JOIN LATERAL (
          SELECT encrypted_payload
          FROM student_application_forms
          WHERE student_id = s.id OR student_id::text = s.application_number OR student_id::text = s.id::text
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

      exportRows = [buildStudentExportRow(dbStudent, formData)];
    } else {
      // Export ALL students with full decrypted payloads
      exportRows = await fetchAndDecryptStudents();
    }

    const { wb } = buildExcelWorkbook(exportRows);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const uint8Array = new Uint8Array(buffer);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = studentIdParam && studentIdParam !== 'all' 
      ? `student_${studentIdParam}_details.xlsx` 
      : `PSNACET_Student_Applications_${timestamp}.xlsx`;

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const body = await req.json().catch(() => ({}));
    const { students, studentIds, useCustomPath } = body;

    let targetIds: string[] | undefined = undefined;
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      targetIds = studentIds.map(String);
    } else if (Array.isArray(students) && students.length > 0) {
      targetIds = students.map((s: any) => s._studentId || s['Application Number'] || s.id).filter(Boolean).map(String);
    }

    // Always fetch directly from DB and decrypt full payloads for 100% details accuracy
    const exportRows = await fetchAndDecryptStudents(targetIds);

    if (exportRows.length === 0) {
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

    const { wb, sheetsCreated } = buildExcelWorkbook(exportRows);
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
          studentCount: exportRows.length,
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
