import { NextResponse } from 'next/server';
import { requireAdminSession, AuthError } from '@/lib/session';
import { query } from '@/lib/db';
import { decryptJson } from '@/lib/crypto';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await requireAdminSession();

    let exportPath = '';
    try {
      const { rows } = await query(
        `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
      );
      exportPath = String((rows[0]?.value as string) || '').trim();
    } catch {
      // fallback to dynamic export
    }

    // Try serving files from configured export path if it exists on host OS
    if (exportPath && fs.existsSync(exportPath)) {
      try {
        const files = fs
          .readdirSync(exportPath)
          .filter((f) => f.toLowerCase().endsWith('.xlsx'))
          .map((f) => path.join(exportPath, f));

        if (files.length > 0) {
          const fileName = `Excel_Exports_${new Date().toISOString().slice(0, 10)}.zip`;
          const archive = archiver('zip', { zlib: { level: 9 } });

          for (const fullPath of files) {
            archive.file(fullPath, { name: path.basename(fullPath) });
          }
          void archive.finalize();

          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              archive.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
              archive.on('end', () => controller.close());
              archive.on('error', (err: any) => controller.error(err));
            },
            cancel() {
              try {
                archive.destroy();
              } catch {}
            },
          });

          return new NextResponse(stream, {
            status: 200,
            headers: {
              'Content-Type': 'application/zip',
              'Content-Disposition': `attachment; filename="${fileName}"`,
            },
          });
        }
      } catch (err) {
        console.warn('Failed reading files from export path, falling back to dynamic generation:', err);
      }
    }

    // Dynamic Excel generation from database fallback
    console.log('Generating dynamic Excel export from database...');

    const { rows: dbStudents } = await query(
      `SELECT 
        s.*,
        f.encrypted_payload,
        f.updated_at as form_updated_at
      FROM students s
      LEFT JOIN LATERAL (
        SELECT encrypted_payload, updated_at
        FROM student_application_forms
        WHERE student_id = s.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) f ON true
      ORDER BY s.created_at DESC`
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
          formData = decryptJson<any>(payload) || {};
        } catch {
          // ignore decrypt error
        }
      }

      if (student.additional_info && typeof student.additional_info === 'object') {
        formData = { ...formData, ...student.additional_info };
      }

      const val = (...keys: string[]) => {
        for (const key of keys) {
          const v = formData?.[key];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '-';
      };

      const exportRow: any = {
        // ===== BASIC INFORMATION =====
        'Application Number': student.application_number || '-',
        'Full Name': student.full_name || '-',
        'Department': dept,
        'Status': student.status || '-',
        'Completion Status': student.completion_status || '-',

        // ===== PERSONAL INFORMATION =====
        'Date of Birth': student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-',
        'Age': val('student_age'),
        'Nationality': val('nationality'),
        'Religion': val('religion'),
        'Mother Tongue': val('mother_tongue'),
        'Student Mobile': student.mobile_number || formData['student_mobile'] || '-',
        'Specially Abled': val('student_specially_abled'),
        'Studied in TN': val('tn_study', 'studied_tn'),
        'Government School': val('govt_school'),

        // ===== FAMILY INFORMATION =====
        'Father Name': student.father_name || formData['father_name'] || '-',
        'Father Occupation': val('father_occupation'),
        'Father Occupation Type': val('father_occupation_type'),
        'Father Mobile': student.father_mobile_number || formData['father_mobile'] || '-',
        'Father Income': val('father_income'),
        'Mother Name': student.mother_name || formData['mother_name'] || '-',
        'Mother Occupation': val('mother_occupation'),
        'Mother Occupation Type': val('mother_occupation_type'),
        'Mother Mobile': val('mother_mobile'),
        'Mother Income': val('mother_income'),
        'Guardian Name': val('guardian_name'),
        'Caste': val('caste'),

        // ===== ADDRESS INFORMATION =====
        'Permanent Address': val('permanent_address'),
        'Communication Address': val('communication_address'),
        'District': val('permanent_city', 'district'),
        'State': val('permanent_state', 'state'),

        // ===== ADMISSION INFORMATION =====
        'Board Studied': val('board_studied', 'hsc_board'),
        'School Location': val('school_location'),
        'GQ/MQ Number': val('admission_allotment_number', 'gq_mq_number'),
        'GQ/MQ Type': val('admission_category', 'gq_mq_type'),
        'Admission Year': val('admission_year'),
        'HSC Board': val('board_studied', 'hsc_board'),

        // ===== BACKGROUND INFORMATION =====
        'Civic Status': val('civic_status'),
        'Residential Status': val('residential_status'),
        'Hostel Stay': val('hostel_stay'),
        'Day Scholar Needs Bus': val('day_scholar_need_bus'),
        'Bus District': val('bus_district'),
        'Bus Area': val('bus_area'),
        'Nearby Bus Stop': val('nearby_bus_stop'),
        'Relative In College': val('relative_name', 'relative_in_college'),
        'Relative Name': val('relative_name'),
        'Relative Branch': val('relative_branch'),
        'Relative Year': val('relative_year'),
        'Relative Relation': val('relative_relation'),

        // ===== COMMUNITY INFORMATION =====
        'Community': val('community'),

        // ===== ACADEMIC INFORMATION =====
        'Student Email': val('student_email'),
        'Student Aadhaar': val('student_aadhaar', 'aadhar_number'),
        'EMIS Number': val('emis_number'),

        // ===== CLASS 12 MARKS =====
        'Class 12 Year': val('marks_12_year_passing'),
        'Class 12 Total': val('marks_12_total'),
        'Class 12 Obtained': val('marks_12_obtained'),
        'Class 12 Percentage': val('marks_12_percentage'),

        // ===== CLASS 12 CORE SUBJECTS =====
        'Physics Marks': val('mark_physics'),
        'Chemistry Marks': val('mark_chemistry'),
        'Mathematics Marks': val('mark_maths'),
        'Cutoff Mark': val('mark_cutoff'),

        // ===== OTHER INFORMATION =====
        'Is Locked': student.is_locked ? 'Yes' : 'No',
        'Extended Days': student.extended_days ?? 0,
        'Date Submitted': student.form_submitted_at ? new Date(student.form_submitted_at).toLocaleString() : '-',
      };

      deptMap.get(dept)!.push(exportRow);
    });

    const wb = XLSX.utils.book_new();

    deptMap.forEach((deptStudents, deptName) => {
      const ws = XLSX.utils.json_to_sheet(deptStudents);
      const columnNames = deptStudents.length > 0 ? Object.keys(deptStudents[0]) : [];

      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '366092' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      };

      const colWidths: any[] = [];
      columnNames.forEach((col, idx) => {
        const width = Math.max(col.length + 2, 15);
        colWidths.push({ wch: width });
        const cellAddress = XLSX.utils.encode_col(idx) + '1';
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
      });

      ws['!cols'] = colWidths;
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      const safeDeptName = deptName.replace(/[\\/?*[\]:]/g, ' ').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeDeptName);
    });

    const activeSession = `${new Date().getFullYear()} – ${new Date().getFullYear() + 4}`;
    const filename = `Student_Records_${activeSession}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('excel-exports download error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


