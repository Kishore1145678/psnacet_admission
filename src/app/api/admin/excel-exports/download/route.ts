import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import { decryptJson, EncryptedPayload } from '@/lib/crypto';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

function buildStudentExportRow(student: any, formData: Record<string, any>) {
  const val = (...keys: string[]) => {
    for (const key of keys) {
      const v1 = formData?.[key];
      if (v1 !== undefined && v1 !== null && String(v1).trim() !== '' && String(v1).trim() !== '-') return String(v1).trim();

      const v2 = formData?.prefill?.[key];
      if (v2 !== undefined && v2 !== null && String(v2).trim() !== '' && String(v2).trim() !== '-') return String(v2).trim();

      const v3 = student?.[key];
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

  const dobRaw = student?.date_of_birth || formData?.student_dob || formData?.date_of_birth || formData?.dob || formData?.prefill?.date_of_birth;
  const dobFormatted = formatDate(dobRaw);

  const exportRow: Record<string, any> = {
    // ===== BASIC INFORMATION =====
    'Application Number': student.application_number || val('application_number', 'applicationNumber', 'appNo', 'id'),
    'Institutional ID': student.institutional_id || val('institutional_id', 'institutionalId', 'regNo', 'register_number', 'roll_number'),
    'Full Name': student.full_name || val('full_name', 'fullName', 'student_name', 'studentName', 'name'),
    'Academic Branch': student.academic_branch || val('academic_branch', 'academicBranch', 'student_branch', 'department', 'branch'),
    'Status': student.status || val('status'),
    'Completion Status': student.completion_status || val('completion_status', 'completionStatus'),

    // ===== PERSONAL INFORMATION =====
    'Date of Birth': dobFormatted,
    'Age': val('student_age', 'age', 'studentAge', 'dob_age'),
    'Gender': val('student_gender', 'gender', 'studentGender'),
    'Blood Group': val('blood_group', 'student_blood_group', 'bloodGroup'),
    'Nationality': val('nationality'),
    'Religion': val('religion'),
    'Mother Tongue': val('mother_tongue', 'motherTongue'),
    'Community': val('community'),
    'Caste': val('caste'),
    'Student Mobile': student.mobile_number || val('mobile_number', 'student_mobile', 'mobileNumber', 'mobile', 'phone'),
    'Student Email': val('student_email', 'studentEmail', 'email'),
    'Student Aadhaar': val('student_aadhaar', 'studentAadhaar', 'aadhar_number', 'aadharNumber', 'aadhar', 'aadhaar'),
    'EMIS Number': val('emis_number', 'emisNumber', 'emis', 'emisNo'),
    'Specially Abled': val('student_specially_abled', 'studentSpeciallyAbled', 'specially_abled', 'speciallyAbled'),
    'Studied in TN': val('tn_study', 'tnStudy', 'studied_tn', 'studiedTN', 'studied_in_tn'),
    'Government School Student': val('govt_school', 'govtSchool', 'studied_in_govt_school', 'govt_school_student'),

    // ===== FAMILY INFORMATION =====
    'Father Name': student.father_name || val('father_name', 'fatherName'),
    'Father Occupation': val('father_occupation', 'fatherOccupation'),
    'Father Occupation Type': val('father_occupation_type', 'fatherOccupationType'),
    'Father Mobile': student.father_mobile_number || val('father_mobile_number', 'fatherMobileNumber', 'father_mobile', 'fatherMobile'),
    'Father Income': val('father_income', 'fatherIncome', 'father_annual_income'),
    'Mother Name': student.mother_name || val('mother_name', 'motherName'),
    'Mother Occupation': val('mother_occupation', 'motherOccupation'),
    'Mother Occupation Type': val('mother_occupation_type', 'motherOccupationType'),
    'Mother Mobile': val('mother_mobile', 'motherMobile'),
    'Mother Income': val('mother_income', 'motherIncome', 'mother_annual_income'),
    'Guardian Name': val('guardian_name', 'guardianName', 'guardian'),
    'Guardian Mobile': val('guardian_mobile', 'guardianMobile'),

    // ===== ADDRESS INFORMATION =====
    'Permanent Address': val('permanent_address', 'permanentAddress', 'address'),
    'Permanent City / District': val('permanent_city', 'permanentCity', 'district', 'city'),
    'Permanent State': val('permanent_state', 'permanentState', 'state'),
    'Permanent Pincode': val('permanent_pincode', 'permanentPincode', 'pincode', 'pin_code'),
    'Communication Address': val('communication_address', 'communicationAddress'),

    // ===== ADMISSION INFORMATION =====
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
    'Is Locked': student.is_locked ? 'Yes' : 'No',
    'Extended Days': student.extended_days ?? 0,
    'Date Submitted': student.form_submitted_at ? formatDate(student.form_submitted_at) : '-',
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

export async function GET() {
  try {
    await requireAdminSession();

    // ALWAYS query live database to get exact current students (including newly submitted forms)
    console.log('Generating live fresh Excel export directly from database...');

    const { rows: dbStudents } = await query(
      `SELECT 
        s.*,
        f.encrypted_payload,
        f.updated_at as form_updated_at
      FROM students s
      LEFT JOIN LATERAL (
        SELECT encrypted_payload, updated_at
        FROM student_application_forms
        WHERE student_id = s.id OR student_id::text = s.application_number OR student_id::text = s.id::text
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      ) f ON true
      ORDER BY s.academic_branch ASC, s.created_at DESC`
    );

    if (dbStudents.length === 0) {
      return NextResponse.json(
        { error: 'No student details available to download.' },
        { status: 404 }
      );
    }

    const deptMap = new Map<string, any[]>();

    dbStudents.forEach((student: any) => {
      const dept = (student.academic_branch || 'Unknown').toString();
      if (!deptMap.has(dept)) deptMap.set(dept, []);

      let formData: any = {};
      if (student.encrypted_payload) {
        try {
          const payload = typeof student.encrypted_payload === 'string'
            ? JSON.parse(student.encrypted_payload)
            : student.encrypted_payload;
          formData = decryptJson<any>(payload as EncryptedPayload) || {};
        } catch (err) {
          console.warn('Decrypt payload error in excel download:', err);
        }
      }

      if (student.additional_info && typeof student.additional_info === 'object') {
        formData = { ...formData, ...student.additional_info };
      }

      const exportRow = buildStudentExportRow(student, formData);
      deptMap.get(dept)!.push(exportRow);
    });

    const wb = XLSX.utils.book_new();

    deptMap.forEach((deptStudents, deptName) => {
      const ws = XLSX.utils.json_to_sheet(deptStudents);
      const columnNames = deptStudents.length > 0 ? Object.keys(deptStudents[0]) : [];

      const colWidths: any[] = [];
      columnNames.forEach((col) => {
        const width = Math.max(col.length + 3, 16);
        colWidths.push({ wch: width });
      });

      ws['!cols'] = colWidths;
      const safeDeptName = deptName.replace(/[\\/?*[\]:]/g, ' ').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeDeptName);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `PSNACET_Student_Applications_${timestamp}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const uint8Array = new Uint8Array(buffer);

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8Array.length.toString(),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('excel-exports download error:', e);
    return NextResponse.json({ error: 'Server error: ' + (e instanceof Error ? e.message : 'Unknown') }, { status: 500 });
  }
}
