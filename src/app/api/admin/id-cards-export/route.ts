import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { decryptJson } from '@/lib/crypto';
import { pgDateToYmd } from '@/lib/student-password';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    console.log('Querying database for complete student records with forms for ID Cards...');
    const { rows: dbStudents } = await query(
      `SELECT 
        s.*,
        f.encrypted_payload
      FROM students s
      LEFT JOIN LATERAL (
        SELECT encrypted_payload
        FROM student_application_forms
        WHERE student_id = s.id
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 1
      ) f ON true
      ORDER BY s.academic_branch ASC, s.full_name ASC`
    );

    if (dbStudents.length === 0) {
      return NextResponse.json({ error: 'No student details available to download.' }, { status: 404 });
    }

    // Group students by department
    const deptGroups: Record<string, any[]> = {};

    dbStudents.forEach((student: any) => {
      let payload: any = {};
      
      if (student.encrypted_payload) {
        try {
          const encPayload = typeof student.encrypted_payload === 'string' 
            ? JSON.parse(student.encrypted_payload) 
            : student.encrypted_payload;
          
          payload = decryptJson(encPayload);
        } catch (e) {
          console.error('Error decrypting payload for student', student.id, e);
        }
      }

      const branch = student.academic_branch || 'Unknown';
      if (!deptGroups[branch]) {
        deptGroups[branch] = [];
      }

      const addressParts = [
        payload.permanent_address,
        payload.permanent_city,
        payload.permanent_state,
        payload.permanent_pincode
      ].filter(Boolean);

      const address = addressParts.join(', ');

      deptGroups[branch].push({
        'Name': student.full_name,
        'Course': branch,
        'Batch': payload.admission_batch || '',
        'Date of Birth': pgDateToYmd(student.date_of_birth),
        'Blood Group': student.blood_group || payload.student_blood_group || '',
        'Father\'s Name': student.father_name || payload.father_name || '',
        'Address': address,
        'Contact No': student.mobile_number || payload.student_mobile || ''
      });
    });

    const wb = XLSX.utils.book_new();

    for (const [branch, studentsList] of Object.entries(deptGroups)) {
      // Sheet names in Excel have a max length of 31 characters and cannot contain certain chars
      const safeSheetName = branch.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
      const ws = XLSX.utils.json_to_sheet(studentsList);
      
      // Auto-size columns
      const colWidths = [
        { wch: 25 }, // Name
        { wch: 15 }, // Course
        { wch: 12 }, // Batch
        { wch: 12 }, // DOB
        { wch: 10 }, // Blood Group
        { wch: 25 }, // Father's Name
        { wch: 40 }, // Address
        { wch: 15 }  // Contact No
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="ID_Cards_Data.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error: any) {
    console.error('Error generating ID cards excel:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
