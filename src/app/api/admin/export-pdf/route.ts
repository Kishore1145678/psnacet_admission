import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { decryptJson, type EncryptedPayload } from '@/lib/crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function sanitizeText(text: string | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
}

function pick(data: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return sanitizeText(String(value));
    }
  }
  return '';
}

function humanize(value: string): string {
  const lower = value.toLowerCase();
  const map: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    yes: 'Yes',
    no: 'No',
    tnhsc: 'TN-HSC',
    cbse: 'CBSE',
    icse: 'ICSE',
    corp: 'Corporation',
    muni: 'Municipality',
    town: 'Town Panchayat',
    village: 'Village Panchayat',
    day: 'Day Scholar',
    hostel: 'Hosteller',
    government: 'Govt',
    private: 'Private',
    other: 'Others',
    mq: 'MQ',
    gq: 'GQ',
    oc: 'OC',
    bc: 'BC',
    bcm: 'BCM',
    mbc: 'MBC & DNT',
    sc: 'SC / SCA',
    st: 'ST',
    friend: 'Friends',
    old_student: 'Old Student',
    adv: 'Advertisement / Website / Stall',
    staff: 'PSNA Staff',
  };
  return map[lower] || value;
}

function drawCellText(
  page: any,
  font: any,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize = 10
) {
  if (!text) return;
  const raw = sanitizeText(humanize(text));
  const padX = 4;
  const padY = 3;
  const maxWidth = Math.max(1, w - padX * 2);
  const maxHeight = Math.max(1, h - padY * 2);

  const wrapToLines = (content: string, size: number) => {
    const paragraphs = content.split(/\n+/g);
    const lines: string[] = [];
    for (const para of paragraphs) {
      const words = para.split(/\s+/g).filter(Boolean);
      if (words.length === 0) {
        lines.push('');
        continue;
      }
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        // If a single word is too long, hard-trim it.
        let trimmed = word;
        while (trimmed.length > 1 && font.widthOfTextAtSize(trimmed, size) > maxWidth) {
          trimmed = trimmed.slice(0, -1);
        }
        line = trimmed;
      }
      if (line) lines.push(line);
    }
    return lines;
  };

  let size = fontSize;
  let lines = wrapToLines(raw, size);
  const lineGap = 2;
  const heightFor = (s: number, count: number) => count * s + Math.max(0, count - 1) * lineGap;

  while (size > 7 && heightFor(size, lines.length) > maxHeight) {
    size -= 0.5;
    lines = wrapToLines(raw, size);
  }

  // Still too tall: truncate lines and add ellipsis to the last visible line.
  const maxLines = Math.max(1, Math.floor((maxHeight + lineGap) / (size + lineGap)));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const ellipsis = '...';
    let last = lines[lines.length - 1] ?? '';
    while (last.length > 1 && font.widthOfTextAtSize(last + ellipsis, size) > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = (last + ellipsis).trim();
  }

  const totalH = heightFor(size, lines.length);
  let cursorY = y + (h - totalH) / 2 + (lines.length - 1) * (size + lineGap);
  for (const line of lines) {
    page.drawText(line, {
      x: x + padX,
      y: cursorY,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    cursorY -= size + lineGap;
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminSession();
    const body = await req.json();
    const applicationNumber = String(body.applicationNumber || '').trim();

    if (!applicationNumber) {
      return NextResponse.json({ error: 'applicationNumber is required' }, { status: 400 });
    }

    const { rows: studentRows } = await query(
      `SELECT s.*, f.encrypted_payload, additional_info
       FROM students s
       LEFT JOIN student_application_forms f
         ON f.student_id = s.id
        AND f.status = 'submitted'
       WHERE s.application_number = $1
       ORDER BY f.created_at DESC
       LIMIT 1`,
      [applicationNumber]
    );

    if (!studentRows?.[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentRows[0] as any;
    let formData: Record<string, any> = {};
    if (student.encrypted_payload) {
      try {
        if (student.encrypted_payload?.v === 1 && student.encrypted_payload?.alg) {
          formData = decryptJson(student.encrypted_payload as EncryptedPayload);
        } else {
          formData =
            typeof student.encrypted_payload === 'string'
              ? JSON.parse(student.encrypted_payload)
              : student.encrypted_payload;
        }
      } catch {
        formData = {};
      }
    }
    if (student.additional_info && typeof student.additional_info === 'object') {
      formData = { ...formData, ...student.additional_info };
    }

    const all = {
      ...formData,
      student_name: pick(formData, 'student_name') || sanitizeText(student.full_name),
      student_branch: pick(formData, 'student_branch') || sanitizeText(student.academic_branch),
      student_dob: pick(formData, 'student_dob') || (student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : ''),
      father_name: pick(formData, 'father_name') || sanitizeText(student.father_name),
      mother_name: pick(formData, 'mother_name') || sanitizeText(student.mother_name),
      father_mobile: pick(formData, 'father_mobile') || sanitizeText(student.father_mobile_number),
      student_mobile: pick(formData, 'student_mobile') || sanitizeText(student.mobile_number),
      student_photo_base64: pick(formData, 'student_photo_base64'),
    };

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page 1 - Student + family details
    const p1 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    p1.drawText('PSNA COLLEGE OF ENGINEERING AND TECHNOLOGY', { x: 95, y: 775, size: 14, font: bold });
    p1.drawText('KOTHANDARAMAN NAGAR, DINDIGUL - 624622', { x: 145, y: 748, size: 11, font: bold });
    p1.drawText('(An Autonomous Institution)', { x: 190, y: 724, size: 10, font: bold });
    p1.drawText("B.E / B.TECH STUDENT'S DETAILS", { x: 170, y: 701, size: 11, font: bold });

    if (all.student_photo_base64) {
      try {
        const photoBase64 = all.student_photo_base64;
        const isPng = photoBase64.startsWith('data:image/png');
        const base64Data = photoBase64.includes(',') ? photoBase64.split(',')[1] : photoBase64;
        const imageBytes = Buffer.from(base64Data, 'base64');
        const embeddedImage = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
        
        const imgWidth = 82; // approx 29mm
        const imgHeight = 105; // approx 37mm
        const startX = 45;
        const labelW = 290;
        const valueW = 220;
        const imgX = startX + labelW + valueW - imgWidth; // Align with right edge of table
        const imgY = 680; // Sit completely above the table (table top is at 670)
        
        p1.drawImage(embeddedImage, {
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
        });
        
        p1.drawRectangle({
          x: imgX,
          y: imgY,
          width: imgWidth,
          height: imgHeight,
          borderWidth: 1,
          borderColor: rgb(0, 0, 0),
        });
      } catch (err) {
        console.error('Failed to embed student photo in PDF:', err);
      }
    }

    // Full-width layout (no photo box)
    const startX = 45;
    const labelW = 290;
    const valueW = 220;
    // Keep all first-page rows visible (including Aadhaar at bottom).
    const rowH = 30;
    let y = 640;

    const rows1: Array<[string, string]> = [
      ['Name of the student', all.student_name],
      ['Branch', all.student_branch],
      ['Date of Birth', all.student_dob],
      ['Age', pick(all, 'student_age')],
      ['Gender (Male / Female)', pick(all, 'student_gender')],
      ['Physically Handicapped (Yes / No)', pick(all, 'student_specially_abled')],
      ["Father's Name", all.father_name],
      ["Father's Occupation (Type)", pick(all, 'father_occupation_type')],
      ["Father's Occupation (Name)", pick(all, 'father_occupation')],
      ['Father Annual Income', pick(all, 'father_income')],
      ["Mother's Name", all.mother_name],
      ["Mother's Occupation (Type)", pick(all, 'mother_occupation_type')],
      ["Mother's Occupation (Name)", pick(all, 'mother_occupation')],
      ['Mother Annual Income', pick(all, 'mother_income')],
      ["Guardian's Name", pick(all, 'guardian_name')],
      ["Father's Mobile No.", all.father_mobile],
      ["Mother's Mobile No.", pick(all, 'mother_mobile')],
      ["Student's Mobile No.", all.student_mobile],
      ["Student's Email id", pick(all, 'student_email')],
      ["Student's Aadhaar Number", pick(all, 'student_aadhaar', 'aadhar_number')],
    ];

    for (const [label, value] of rows1) {
      p1.drawRectangle({ x: startX, y, width: labelW, height: rowH, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      p1.drawRectangle({ x: startX + labelW, y, width: valueW, height: rowH, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p1, font, label, startX, y, labelW, rowH, 9.5);
      drawCellText(p1, font, value, startX + labelW, y, valueW, rowH, 10);
      y -= rowH;
      if (y < 30) break;
    }

    // Page 2 - Address + admission + profile
    const p2 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    p2.drawText("B.E / B.TECH STUDENT'S DETAILS - CONTINUED", { x: 140, y: 785, size: 11, font: bold });
    const rows2: Array<{ label: string; value: string; h?: number }> = [
      { label: 'Permanent Address with Pincode', value: `${pick(all, 'permanent_address')} ${pick(all, 'permanent_pincode')}`.trim(), h: 46 },
      { label: 'Communication Address with Pincode', value: `${pick(all, 'communication_address')} ${pick(all, 'communication_pincode')}`.trim(), h: 46 },
      { label: 'Date of Admission', value: pick(all, 'admission_date') },
      { label: 'Admission for the Year', value: pick(all, 'admission_year') },
      { label: 'Mother Tongue', value: pick(all, 'mother_tongue') },
      { label: 'District', value: pick(all, 'permanent_city') },
      { label: 'State', value: pick(all, 'permanent_state') },
      { label: 'Nationality', value: pick(all, 'nationality') },
      { label: 'Religion', value: pick(all, 'religion') },
      { label: 'Community', value: pick(all, 'community') },
      { label: 'Caste', value: pick(all, 'caste') },
      { label: "Student's Residential Status", value: pick(all, 'residential_status') },
      { label: 'Board Studied in HSC', value: pick(all, 'board_studied') },
      { label: 'GQ Allotment Letter No. / MQ Application No.', value: pick(all, 'admission_allotment_number') },
      { label: 'Batch', value: pick(all, 'admission_batch') },
      { label: 'School Location', value: pick(all, 'school_location') },
      { label: 'Civic Status of School Location', value: pick(all, 'civic_status') },
      { label: 'Studied VIII to XII in Tamil Nadu?', value: pick(all, 'tn_study') },
      { label: 'Studied VI to XII in Government School?', value: pick(all, 'govt_study') },
      { label: 'EMIS Number', value: pick(all, 'emis_number') },
    ];
    y = 735;
    for (const row of rows2) {
      const h2 = row.h ?? rowH;
      p2.drawRectangle({ x: startX, y, width: labelW, height: h2, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      p2.drawRectangle({ x: startX + labelW, y, width: valueW, height: h2, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p2, font, row.label, startX, y, labelW, h2, 9.5);
      drawCellText(p2, font, row.value, startX + labelW, y, valueW, h2, 10);
      y -= h2;
      if (y < 30) break;
    }

    // Page 3 - School details VI to XII
    // Use landscape orientation so the table fills the page horizontally.
    const LANDSCAPE_WIDTH = A4_HEIGHT;
    const LANDSCAPE_HEIGHT = A4_WIDTH;
    const p3 = pdfDoc.addPage([LANDSCAPE_WIDTH, LANDSCAPE_HEIGHT]);
    p3.drawText('School Details (VI - XII)', { x: 330, y: 565, size: 11, font: bold });
    // Full-width table across the page (as wide as possible).
    // Keep a tiny margin to avoid printer clipping.
    const tableLeft = 10;
    const tableRight = LANDSCAPE_WIDTH - 10;
    const tableWidth = tableRight - tableLeft;
    // Relative column widths: Class, Year, State, District, Block, School, Category, Medium, Score
    const colRel = [6, 11, 11, 12, 12, 24, 13, 12, 7];
    const relSum = colRel.reduce((a, b) => a + b, 0);
    const colX: number[] = [tableLeft];
    for (let i = 0; i < colRel.length; i++) {
      const prev = colX[colX.length - 1]!;
      const w = (tableWidth * colRel[i]!) / relSum;
      colX.push(prev + w);
    }
    // Avoid any accumulated floating rounding leaving a right gap.
    colX[colX.length - 1] = tableRight;
    const headers = ['Class', 'Year', 'State', 'District', 'Block', 'School Name', 'Category', 'Medium', 'Score %'];
    const headerY = 515;
    const headerH = 28;
    for (let i = 0; i < headers.length; i++) {
      const w = colX[i + 1] - colX[i];
      p3.drawRectangle({ x: colX[i], y: headerY, width: w, height: headerH, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p3, font, headers[i], colX[i], headerY, w, headerH, 8.5);
    }
    const bottomMargin = 20;
    const totalRows = 7; // VI..XII
    // Data rows must sit strictly below the header row.
    const availableH = headerY - bottomMargin;
    const rowH3 = availableH / totalRows;
    // First row: its top should touch the header's bottom line at headerY.
    y = headerY - rowH3;
    for (const cls of ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']) {
      const rowY = y;
      const values = [
        cls,
        pick(all, `school_${cls}_year_passing`),
        pick(all, `school_${cls}_state`),
        pick(all, `school_${cls}_district`),
        pick(all, `school_${cls}_block`),
        pick(all, `school_${cls}_name`),
        pick(all, `school_${cls}_category`),
        pick(all, `school_${cls}_medium`),
        pick(all, `school_${cls}_score`),
      ];
      for (let i = 0; i < values.length; i++) {
        const w = colX[i + 1] - colX[i];
        p3.drawRectangle({ x: colX[i], y: rowY, width: w, height: rowH3, borderWidth: 1, borderColor: rgb(0, 0, 0) });
        drawCellText(p3, font, values[i], colX[i], rowY, w, rowH3, 8.5);
      }
      y -= rowH3;
    }

    // Page 4 - Marks + relative details
    const p4 = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    p4.drawText('Details of the Marks Obtained in School Level', { x: 155, y: 790, size: 11, font: bold });
    const markX = [50, 90, 155, 245, 345, 460, 540];
    const markHeaders = ['S.No', 'Class', 'Year', 'Total', 'Obtained', 'Percentage', ''];
    for (let i = 0; i < markHeaders.length - 1; i++) {
      const w = markX[i + 1] - markX[i];
      p4.drawRectangle({ x: markX[i], y: 750, width: w, height: 28, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p4, font, markHeaders[i], markX[i], 750, w, 28, 8.5);
    }
    y = 718;
    const markRows: Array<[string, string]> = [['1', '10'], ['2', '11'], ['3', '12']];
    for (const [idx, cls] of markRows) {
      const vals = [
        idx,
        cls,
        pick(all, `marks_${cls}_year_passing`),
        pick(all, `marks_${cls}_total`),
        pick(all, `marks_${cls}_obtained`),
        pick(all, `marks_${cls}_percentage`),
      ];
      for (let i = 0; i < vals.length; i++) {
        const w = markX[i + 1] - markX[i];
        p4.drawRectangle({ x: markX[i], y, width: w, height: 30, borderWidth: 1, borderColor: rgb(0, 0, 0) });
        drawCellText(p4, font, vals[i], markX[i], y, w, 30, 9);
      }
      y -= 30;
    }

    // Add spacing so the heading doesn't sit on the table border.
    p4.drawText('Marks Obtained in XII', { x: 55, y: 635, size: 10, font: bold });
    const subjRows: Array<[string, string]> = [
      ['Physics', pick(all, 'mark_physics')],
      ['Chemistry', pick(all, 'mark_chemistry')],
      ['Maths', pick(all, 'mark_maths')],
      ['Cut off Mark', pick(all, 'mark_cutoff')],
    ];
    y = 600;
    for (const [label, value] of subjRows) {
      p4.drawRectangle({ x: 50, y, width: 220, height: 30, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      p4.drawRectangle({ x: 270, y, width: 140, height: 30, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p4, font, label, 50, y, 220, 30, 9.5);
      drawCellText(p4, font, value, 270, y, 140, 30, 10);
      y -= 30;
    }

    // Lift the heading above the table border so it never overlaps.
    p4.drawText('If your relative studies in this college', { x: 50, y: 465, size: 10, font: bold });
    const relRows: Array<[string, string]> = [
      ['Name', pick(all, 'relative_name')],
      ['Branch & Year', `${pick(all, 'relative_branch')} ${pick(all, 'relative_year')}`.trim()],
      ['Relation', pick(all, 'relative_relation')],
      ['How do you know about PSNA', pick(all, 'hear_about_psna')],
    ];
    y = 430;
    for (const [label, value] of relRows) {
      p4.drawRectangle({ x: 50, y, width: 220, height: 32, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      p4.drawRectangle({ x: 270, y, width: 260, height: 32, borderWidth: 1, borderColor: rgb(0, 0, 0) });
      drawCellText(p4, font, label, 50, y, 220, 32, 9.5);
      drawCellText(p4, font, value, 270, y, 260, 32, 10);
      y -= 32;
    }

    // Signatures (bottom of the same page)
    const sigY = 70;
    const lineY = sigY + 12;
    p4.drawLine({ start: { x: 60, y: lineY }, end: { x: 240, y: lineY }, thickness: 1, color: rgb(0, 0, 0) });
    p4.drawLine({ start: { x: 355, y: lineY }, end: { x: 535, y: lineY }, thickness: 1, color: rgb(0, 0, 0) });
    p4.drawText('Parent/Guardian Signature', { x: 80, y: sigY, size: 10, font: bold });
    p4.drawText('Student Signature', { x: 405, y: sigY, size: 10, font: bold });

    const pdfBytes = await pdfDoc.save();
    const fileName = `${sanitizeText(student.full_name || 'student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('PDF generation error:', e);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
