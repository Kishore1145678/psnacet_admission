import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminSession, AuthError } from '@/lib/session';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type CountsRow = {
  total_students: string;
  submitted_students: string;
  draft_only_students: string;
};

type DeptRow = {
  department: string;
  total_students: string;
  submitted_students: string;
};

function safeText(v: unknown) {
  return String(v ?? '').replace(/[^\x20-\x7E\n]/g, ' ').trim();
}

export async function GET() {
  try {
    await requireAdminSession();

    const { rows: countRows } = await query<CountsRow>(`
      WITH
        total AS (
          SELECT COUNT(*)::bigint AS total_students
          FROM students
        ),
        submitted AS (
          SELECT COUNT(DISTINCT student_id)::bigint AS submitted_students
          FROM student_application_forms
          WHERE status != 'draft'
        ),
        draft_only AS (
          SELECT COUNT(DISTINCT f.student_id)::bigint AS draft_only_students
          FROM student_application_forms f
          WHERE f.status = 'draft'
            AND NOT EXISTS (
              SELECT 1
              FROM student_application_forms s
              WHERE s.student_id = f.student_id AND s.status != 'draft'
            )
        )
      SELECT
        total.total_students::text,
        submitted.submitted_students::text,
        draft_only.draft_only_students::text
      FROM total, submitted, draft_only
    `);

    const totalStudents = Number(countRows[0]?.total_students ?? 0);
    const finishedForms = Number(countRows[0]?.submitted_students ?? 0);
    const partiallyFilled = Number(countRows[0]?.draft_only_students ?? 0);
    const notSubmitted = Math.max(0, totalStudents - finishedForms);
    const notStarted = Math.max(0, totalStudents - finishedForms - partiallyFilled);
    const completionRate = totalStudents ? Math.round((finishedForms / totalStudents) * 100) : 0;

    const { rows: deptRows } = await query<DeptRow>(`
      WITH submitted AS (
        SELECT DISTINCT student_id
        FROM student_application_forms
        WHERE status != 'draft'
      )
      SELECT
        COALESCE(NULLIF(TRIM(s.academic_branch), ''), 'Unknown') AS department,
        COUNT(*)::bigint AS total_students,
        COUNT(submitted.student_id)::bigint AS submitted_students
      FROM students s
      LEFT JOIN submitted ON submitted.student_id = s.id
      GROUP BY 1
      ORDER BY COUNT(*) DESC, 1 ASC
    `);

    const now = new Date();
    const year = now.getFullYear();
    const session = `${year} – ${year + 4}`;

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const page = pdf.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const margin = 42;
    let y = height - margin;

    page.drawText('Dashboard Report', { x: margin, y, size: 18, font: bold, color: rgb(0.09, 0.16, 0.12) });
    y -= 22;
    page.drawText(`Academic session: ${safeText(session)}`, { x: margin, y, size: 11, font, color: rgb(0.35, 0.37, 0.35) });
    y -= 14;
    page.drawText(`Generated: ${safeText(now.toLocaleString())}`, { x: margin, y, size: 11, font, color: rgb(0.35, 0.37, 0.35) });
    y -= 18;

    // Summary cards (simple boxes)
    const boxW = (width - margin * 2 - 16) / 3;
    const boxH = 64;
    const gap = 8;
    const boxY = y - boxH;

    const metrics: Array<[string, string]> = [
      ['Total Registrations', String(totalStudents)],
      ['Finished Forms', String(finishedForms)],
      ['Not Submitted', String(notSubmitted)],
      ['Partially Filled', String(partiallyFilled)],
      ['Not Started', String(notStarted)],
      ['Completion Rate', `${completionRate}%`],
    ];

    for (let i = 0; i < metrics.length; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = margin + col * (boxW + gap);
      const yy = boxY - row * (boxH + gap);
      page.drawRectangle({ x, y: yy, width: boxW, height: boxH, borderWidth: 1, borderColor: rgb(0.9, 0.89, 0.88) });
      page.drawText(metrics[i][0], { x: x + 10, y: yy + boxH - 18, size: 10, font: bold, color: rgb(0.22, 0.24, 0.23) });
      page.drawText(metrics[i][1], { x: x + 10, y: yy + 18, size: 18, font: bold, color: rgb(0.09, 0.16, 0.12) });
    }

    y = boxY - 2 * (boxH + gap) - 26;

    page.drawText('Department analytics', { x: margin, y, size: 12, font: bold, color: rgb(0.09, 0.16, 0.12) });
    y -= 14;

    // Table header
    const tableX = margin;
    const tableW = width - margin * 2;
    const colWidths = [0.46, 0.18, 0.18, 0.18].map((p) => p * tableW);
    const headerH = 22;
    const rowH = 18;

    const drawRow = (cells: string[], yy: number, isHeader = false) => {
      let cx = tableX;
      for (let c = 0; c < cells.length; c++) {
        const w = colWidths[c]!;
        page.drawRectangle({
          x: cx,
          y: yy,
          width: w,
          height: isHeader ? headerH : rowH,
          borderWidth: 1,
          borderColor: rgb(0.9, 0.89, 0.88),
          color: isHeader ? rgb(0.98, 0.98, 0.98) : undefined,
        });
        page.drawText(safeText(cells[c]), {
          x: cx + 6,
          y: yy + (isHeader ? 7 : 5),
          size: 9.5,
          font: isHeader ? bold : font,
          color: rgb(0.1, 0.11, 0.12),
        });
        cx += w;
      }
    };

    drawRow(['Department', 'Students', 'Finished', 'Not Submitted'], y - headerH, true);
    y -= headerH;

    // Rows (paginate if needed)
    let currentPage = page;
    let cursorY = y;
    for (const r of deptRows) {
      const dept = r.department || 'Unknown';
      const total = Number(r.total_students ?? 0);
      const submitted = Number(r.submitted_students ?? 0);
      const pending = Math.max(0, total - submitted);

      if (cursorY - rowH < margin) {
        currentPage = pdf.addPage([595.28, 841.89]);
        cursorY = currentPage.getSize().height - margin;
        currentPage.drawText('Department analytics (continued)', { x: margin, y: cursorY, size: 12, font: bold, color: rgb(0.09, 0.16, 0.12) });
        cursorY -= 18;
        // Redraw header on new page
        const yHeader = cursorY - headerH;
        let cx = tableX;
        for (let c = 0; c < 4; c++) {
          const w = colWidths[c]!;
          currentPage.drawRectangle({
            x: cx,
            y: yHeader,
            width: w,
            height: headerH,
            borderWidth: 1,
            borderColor: rgb(0.9, 0.89, 0.88),
            color: rgb(0.98, 0.98, 0.98),
          });
          currentPage.drawText(['Department', 'Students', 'Finished', 'Not Submitted'][c]!, {
            x: cx + 6,
            y: yHeader + 7,
            size: 9.5,
            font: bold,
            color: rgb(0.1, 0.11, 0.12),
          });
          cx += w;
        }
        cursorY = yHeader;
      }

      // draw row on currentPage
      let cx = tableX;
      const cells = [dept, String(total), String(submitted), String(pending)];
      for (let c = 0; c < cells.length; c++) {
        const w = colWidths[c]!;
        currentPage.drawRectangle({ x: cx, y: cursorY - rowH, width: w, height: rowH, borderWidth: 1, borderColor: rgb(0.9, 0.89, 0.88) });
        currentPage.drawText(safeText(cells[c]), { x: cx + 6, y: cursorY - rowH + 5, size: 9.5, font, color: rgb(0.1, 0.11, 0.12) });
        cx += w;
      }
      cursorY -= rowH;
    }

    const bytes = await pdf.save();
    const fileName = `Dashboard_Report_${now.toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('Dashboard PDF report error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

