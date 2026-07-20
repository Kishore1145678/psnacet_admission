import { requireAdminSession } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { decryptJson, EncryptedPayload } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    await requireAdminSession();

    const body = await req.json();
    const { students, useCustomPath } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student details available to download.' }, { status: 400 });
    }

    console.log('=== EXCEL EXPORT START ===');
    console.log('Received export request for:', students.length, 'students');

    // Get Excel path from settings
    let exportPath: string | null = null;
    if (useCustomPath) {
      try {
        const { rows } = await query(
          `SELECT value FROM admin_settings WHERE key = 'excel_export_path' LIMIT 1`
        );
        exportPath = (rows[0]?.value as string) || null;
        console.log('Export path from database:', exportPath);
      } catch (e) {
        console.error('Error fetching excel path from database:', e);
        return NextResponse.json({ 
          error: `Failed to retrieve export path: ${e instanceof Error ? e.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

    // Validate export path
    if (exportPath) {
      exportPath = exportPath.trim();
      if (!exportPath) {
        return NextResponse.json({ error: 'Export path is empty' }, { status: 400 });
      }
      console.log('Validated export path:', exportPath);
    }

    // Extract student IDs/application numbers from request
    const studentIdentifiers: string[] = students
      .map((s: any) => s._studentId || s['Application Number'] || s.id)
      .filter(Boolean);

    console.log('Student identifiers to query:', studentIdentifiers);

    // Query database for all student information AND their forms
    let dbStudents: any[] = [];
    if (studentIdentifiers.length > 0) {
      try {
        console.log('Querying database for complete student records with forms...');
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
            WHERE student_id = s.id
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 1
          ) f ON true
          WHERE s.application_number = ANY(ARRAY[${placeholders}]::text[])`,
          studentIdentifiers
        );
        dbStudents = rows;
        console.log('Retrieved', dbStudents.length, 'student records with forms from database');
      } catch (e) {
        console.error('Error querying students from database:', e);
        // Continue with empty records - will use provided data as fallback
      }
    }

    // Create map of database students by application_number
    const dbStudentMap = new Map();
    dbStudents.forEach((s: any) => {
      dbStudentMap.set(s.application_number, s);
    });

    // Collect all unique field names from all students' forms
    const allFieldNames = new Set<string>();
    dbStudents.forEach((student: any) => {
      if (student.encrypted_payload) {
        try {
          const payload = typeof student.encrypted_payload === 'string' 
            ? JSON.parse(student.encrypted_payload) 
            : student.encrypted_payload;
          
          const decrypted = decryptJson<any>(payload);
          if (decrypted && typeof decrypted === 'object') {
            Object.keys(decrypted).forEach(key => allFieldNames.add(key));
          }
        } catch (e) {
          console.warn(`Failed to decrypt form for student ${student.application_number}:`, e instanceof Error ? e.message : 'Unknown error');
        }
      }
    });
    
    console.log('Total unique form fields found:', allFieldNames.size);
    if (allFieldNames.size > 0) {
      console.log('Sample fields:', Array.from(allFieldNames).slice(0, 10));
    }

    // Group students by department
    console.log('Processing students for export:', students.length);
    const deptMap = new Map<string, any[]>();
    
    students.forEach((student: any) => {
      // Try to get full data from database, fall back to provided data
      const appNumber = student._studentId || student['Application Number'] || student.id;
      const dbStudent = appNumber ? dbStudentMap.get(appNumber) : null;
      
      const dept = (dbStudent?.academic_branch || student.department || 'Unknown').toString();
      if (!deptMap.has(dept)) deptMap.set(dept, []);

      // Decrypt form data if available
      let formData: any = {};
      if (dbStudent?.encrypted_payload) {
        try {
          const payload = typeof dbStudent.encrypted_payload === 'string' 
            ? JSON.parse(dbStudent.encrypted_payload) 
            : dbStudent.encrypted_payload;
          
          formData = decryptJson<any>(payload);
          console.log(`Decrypted form for ${dbStudent.application_number}: ${Object.keys(formData).length} fields`);
        } catch (e) {
          console.warn(`Failed to decrypt form for student ${appNumber}:`, e instanceof Error ? e.message : 'Unknown error');
        }
      }

      // Merge updated fields from additional_info (JSONB) - these override old form data
      // This ensures that edits made via admin interface are reflected in exports
      if (dbStudent?.additional_info && typeof dbStudent.additional_info === 'object') {
        formData = { ...formData, ...dbStudent.additional_info };
        console.log(`Merged additional_info for ${dbStudent.application_number}: now has ${Object.keys(formData).length} fields`);
      }

      // Build comprehensive export row with ALL data organized by sections
      const val = (...keys: string[]) => {
        for (const key of keys) {
          const v = formData?.[key];
          if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '-';
      };

      const exportRow: any = {
        // ===== BASIC INFORMATION =====
        'Application Number': dbStudent?.application_number || student['Application Number'] || student.id || '-',
        'Full Name': dbStudent?.full_name || student['Full Name'] || student.name || '-',
        'Department': dept,
        'Status': dbStudent?.status || student.status || '-',
        'Completion Status': dbStudent?.completion_status || student['Completion Status'] || '-',
        
        // ===== PERSONAL INFORMATION =====
        'Date of Birth': dbStudent?.date_of_birth ? new Date(dbStudent.date_of_birth).toLocaleDateString() : '-',
        'Age': val('student_age'),
        'Nationality': val('nationality'),
        'Religion': val('religion'),
        'Mother Tongue': val('mother_tongue'),
        'Student Mobile': dbStudent?.mobile_number || student.mobile || formData['student_mobile'] || '-',
        'Specially Abled': val('student_specially_abled'),
        'Studied in TN': val('tn_study', 'studied_tn'),
        'Government School': val('govt_school'),
        
        // ===== FAMILY INFORMATION =====
        'Father Name': dbStudent?.father_name || student['Father Name'] || formData['father_name'] || '-',
        'Father Occupation': val('father_occupation'),
        'Father Occupation Type': val('father_occupation_type'),
        'Father Mobile': dbStudent?.father_mobile_number || student['Father Mobile'] || formData['father_mobile'] || '-',
        'Father Income': val('father_income'),
        'Mother Name': dbStudent?.mother_name || student['Mother Name'] || formData['mother_name'] || '-',
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
        'Is Locked': dbStudent?.is_locked ? 'Yes' : 'No',
        'Extended Days': dbStudent?.extended_days ?? 0,
        'Date Submitted': dbStudent?.form_submitted_at ? new Date(dbStudent.form_submitted_at).toLocaleString() : '-',
      };
      
      deptMap.get(dept)!.push(exportRow);
    });

    console.log('Department map created with', deptMap.size, 'departments');
    deptMap.forEach((students, dept) => {
      console.log(`  - ${dept}: ${students.length} students`);
    });

    // Create workbook with department sheets
    const wb = XLSX.utils.book_new();
    let sheetsCreated = 0;

    deptMap.forEach((deptStudents, deptName) => {
      console.log(`Creating sheet for ${deptName} with ${deptStudents.length} rows`);
      const ws = XLSX.utils.json_to_sheet(deptStudents);
      
      // Get all column names from first student
      const columnNames = deptStudents.length > 0 ? Object.keys(deptStudents[0]) : [];
      
      // Format header row: bold text and proper column widths
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '366092' } }, // Dark blue background
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
      
      // Set column widths and format headers
      const colWidths: any[] = [];
      columnNames.forEach((col, idx) => {
        // Calculate width based on column name length
        const width = Math.max(col.length + 2, 15);
        colWidths.push({ wch: width });
        
        // Apply header styling to cell A1, B1, C1, etc.
        const cellAddress = XLSX.utils.encode_col(idx) + '1';
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
      });
      
      ws['!cols'] = colWidths;
      
      // Freeze first row
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      
      let safeDeptName = deptName.replace(/[\\/?*[\]:]/g, ' ').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeDeptName);
      sheetsCreated++;
      console.log(`Sheet "${safeDeptName}" created successfully with ${columnNames.length} columns`);
    });
    
    console.log('Total sheets created:', sheetsCreated);

    const activeSession = `${new Date().getFullYear()} – ${new Date().getFullYear() + 4}`;
    const filename = `Student_Records_${activeSession}.xlsx`;

    if (exportPath) {
      // Save to custom path
      try {
        console.log('=== STARTING CUSTOM PATH EXPORT ===');
        console.log('Target path:', exportPath);
        
        // Validate path format
        if (exportPath.includes('nodel')) {
          console.warn('WARNING: Path contains unusual text "nodel" - verify this is correct');
        }
        
        // Create directory if it doesn't exist
        console.log('Checking if directory exists...');
        const dirExists = fs.existsSync(exportPath);
        console.log('Directory exists:', dirExists);
        
        if (!dirExists) {
          console.log('Creating directory:', exportPath);
          try {
            fs.mkdirSync(exportPath, { recursive: true });
            console.log('✓ Directory created successfully');
          } catch (mkdirError: any) {
            console.error('✗ Failed to create directory');
            console.error('  Error code:', mkdirError.code);
            console.error('  Error message:', mkdirError.message);
            console.error('  Error:', mkdirError);
            throw mkdirError;
          }
        } else {
          console.log('✓ Directory already exists');
        }

        const filepath = path.join(exportPath, filename);
        console.log('Full file path:', filepath);
        
        // Generate buffer
        console.log('Generating Excel buffer...');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        console.log('✓ Buffer generated, size:', buffer.length, 'bytes');
        
        // Write file
        console.log('Writing file to disk...');
        try {
          fs.writeFileSync(filepath, buffer);
          console.log('✓ File written successfully');
        } catch (writeError: any) {
          console.error('✗ Failed to write file');
          console.error('  Error code:', writeError.code);
          console.error('  Error message:', writeError.message);
          console.error('  Path attempted:', filepath);
          throw writeError;
        }

        // Verify file exists
        console.log('Verifying file was created...');
        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          console.log('✓ File verified successfully');
          console.log('  File size:', stats.size, 'bytes');
          console.log('  Created at:', stats.birthtime);
          console.log('=== EXPORT COMPLETED SUCCESSFULLY ===');
          
          return NextResponse.json({
            success: true,
            message: `Excel file saved successfully to ${filepath}`,
            filepath,
            fileSize: stats.size,
            sheetsCreated
          }, { status: 200 });
        } else {
          console.error('✗ File verification failed - file does not exist');
          console.log('  Expected path:', filepath);
          console.log('  Files in directory:');
          try {
            const files = fs.readdirSync(exportPath);
            files.forEach(f => console.log('    -', f));
          } catch (readError) {
            console.error('    Could not read directory:', readError);
          }
          throw new Error('File was written but verification failed - file not found in directory');
        }
      } catch (error: any) {
        console.error('=== EXPORT FAILED ===');
        console.error('Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error type:', error.constructor.name);
        
        return NextResponse.json({
          success: false,
          error: `Failed to write file: ${error.message}`,
          errorCode: error.code,
          errorType: error.constructor.name,
          path: exportPath,
          sheetsCreated,
          details: {
            code: error.code,
            message: error.message,
            syscall: error.syscall
          }
        }, { status: 500 });
      }
    } else {
      // Return as browser download
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
