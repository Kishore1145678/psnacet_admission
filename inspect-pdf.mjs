import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

async function inspectPDF() {
  try {
    const pdfBytes = fs.readFileSync('./PSNA_Student_Details_Form.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    console.log('===== PDF INSPECTION =====');
    console.log('Number of pages:', pdfDoc.getPageCount());
    
    const pages = pdfDoc.getPages();
    pages.forEach((page, idx) => {
      const { width, height } = page.getSize();
      console.log(`\nPage ${idx + 1}:`);
      console.log(`  Dimensions: ${width}px x ${height}px`);
      
      // Try to get form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      console.log(`  Form fields: ${fields.length}`);
      fields.forEach((field, i) => {
        console.log(`    Field ${i + 1}: ${field.getName()} (${field.getType()})`);
      });
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectPDF();
