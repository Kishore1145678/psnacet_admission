/**
 * FORM FIELD EXPORT MAPPING GUIDE
 * 
 * This document maps all available fields from student_application_forms encrypted_payload
 * to their corresponding Excel/CSV columns for export functionality.
 */

const FORM_FIELD_MAPPING = {
  // ============ STUDENT BASIC INFORMATION ============
  "Student Information": {
    "student_name": {
      dbField: "payload.student_name",
      excelColumn: "Student Name",
      dataType: "string",
      source: "FormData (prefilled from DB)",
      example: "John Doe"
    },
    "student_branch": {
      dbField: "payload.student_branch",
      excelColumn: "Branch",
      dataType: "string",
      source: "FormData (prefilled from DB)",
      example: "CSE"
    },
    "student_dob": {
      dbField: "payload.student_dob",
      excelColumn: "Date of Birth",
      dataType: "date",
      source: "FormData (prefilled from DB)",
      example: "2003-05-15"
    },
    "student_age": {
      dbField: "payload.student_age",
      excelColumn: "Age",
      dataType: "number",
      source: "FormData",
      example: "21"
    },
    "student_gender": {
      dbField: "payload.student_gender",
      excelColumn: "Gender",
      dataType: "enum: male|female",
      source: "FormData",
      example: "male"
    },
    "student_specially_abled": {
      dbField: "payload.student_specially_abled",
      excelColumn: "Specially Abled",
      dataType: "enum: yes|no",
      source: "FormData",
      example: "no"
    },
    "student_mobile": {
      dbField: "payload.student_mobile",
      excelColumn: "Student Mobile",
      dataType: "tel",
      source: "FormData (prefilled from DB)",
      example: "+91 9876543210"
    },
    "student_email": {
      dbField: "payload.student_email",
      excelColumn: "Student Email",
      dataType: "email",
      source: "FormData",
      example: "student@example.com"
    },
    "student_aadhaar": {
      dbField: "payload.student_aadhaar",
      excelColumn: "Aadhaar Number",
      dataType: "string",
      source: "FormData",
      example: "1234 5678 9012"
    }
  },

  // ============ PARENT/GUARDIAN INFORMATION ============
  "Father Information": {
    "father_name": {
      dbField: "payload.father_name",
      excelColumn: "Father's Name",
      dataType: "string",
      source: "FormData (prefilled from DB)",
      example: "Mr. Doe"
    },
    "father_occupation_type": {
      dbField: "payload.father_occupation_type",
      excelColumn: "Father's Occupation Type",
      dataType: "enum: government|private|business|self_employed|other",
      source: "FormData",
      example: "government"
    },
    "father_occupation": {
      dbField: "payload.father_occupation",
      excelColumn: "Father's Occupation",
      dataType: "string",
      source: "FormData",
      example: "Engineer"
    },
    "father_mobile": {
      dbField: "payload.father_mobile",
      excelColumn: "Father's Mobile",
      dataType: "tel",
      source: "FormData (prefilled from DB)",
      example: "+91 9876543210"
    },
    "father_income": {
      dbField: "payload.father_income",
      excelColumn: "Father's Annual Income (₹)",
      dataType: "number",
      source: "FormData",
      example: "500000"
    }
  },

  "Mother Information": {
    "mother_name": {
      dbField: "payload.mother_name",
      excelColumn: "Mother's Name",
      dataType: "string",
      source: "FormData (prefilled from DB)",
      example: "Mrs. Doe"
    },
    "mother_occupation_type": {
      dbField: "payload.mother_occupation_type",
      excelColumn: "Mother's Occupation Type",
      dataType: "enum: government|private|business|self_employed|other",
      source: "FormData",
      example: "private"
    },
    "mother_occupation": {
      dbField: "payload.mother_occupation",
      excelColumn: "Mother's Occupation",
      dataType: "string",
      source: "FormData",
      example: "Doctor"
    },
    "mother_mobile": {
      dbField: "payload.mother_mobile",
      excelColumn: "Mother's Mobile",
      dataType: "tel",
      source: "FormData",
      example: "+91 9876543211"
    },
    "mother_income": {
      dbField: "payload.mother_income",
      excelColumn: "Mother's Annual Income (₹)",
      dataType: "number",
      source: "FormData",
      example: "450000"
    }
  },

  // ============ ADDRESS INFORMATION ============
  "Permanent Address": {
    "permanent_address": {
      dbField: "payload.permanent_address",
      excelColumn: "Permanent Address",
      dataType: "text",
      source: "FormData",
      example: "123 Main Street, Near Park"
    },
    "permanent_city": {
      dbField: "payload.permanent_city",
      excelColumn: "Permanent City",
      dataType: "string",
      source: "FormData",
      example: "Chennai"
    },
    "permanent_state": {
      dbField: "payload.permanent_state",
      excelColumn: "Permanent State",
      dataType: "string",
      source: "FormData",
      example: "Tamil Nadu"
    },
    "permanent_pincode": {
      dbField: "payload.permanent_pincode",
      excelColumn: "Permanent Pincode",
      dataType: "number",
      source: "FormData",
      example: "600001"
    }
  },

  "Communication Address": {
    "communication_address": {
      dbField: "payload.communication_address",
      excelColumn: "Communication Address",
      dataType: "text",
      source: "FormData",
      example: "456 Elm Street"
    },
    "communication_city": {
      dbField: "payload.communication_city",
      excelColumn: "Communication City",
      dataType: "string",
      source: "FormData",
      example: "Bangalore"
    },
    "communication_state": {
      dbField: "payload.communication_state",
      excelColumn: "Communication State",
      dataType: "string",
      source: "FormData",
      example: "Karnataka"
    },
    "communication_pincode": {
      dbField: "payload.communication_pincode",
      excelColumn: "Communication Pincode",
      dataType: "number",
      source: "FormData",
      example: "560001"
    }
  },

  // ============ ADMISSION DETAILS ============
  "Admission Information": {
    "admission_date": {
      dbField: "payload.admission_date",
      excelColumn: "Date of Admission",
      dataType: "date",
      source: "FormData",
      example: "2023-06-15"
    },
    "admission_year": {
      dbField: "payload.admission_year",
      excelColumn: "Admission Year",
      dataType: "string",
      source: "FormData",
      example: "2026"
    },
    "admission_batch": {
      dbField: "payload.admission_batch",
      excelColumn: "Batch",
      dataType: "string",
      source: "FormData",
      example: "2023 - 2027"
    },
    "admission_allotment_number": {
      dbField: "payload.admission_allotment_number",
      excelColumn: "GQ Allotment / MQ Application No",
      dataType: "string",
      source: "FormData",
      example: "CSE-2023-001"
    }
  },

  // ============ ACADEMIC & BACKGROUND ============
  "Academic Background": {
    "mother_tongue": {
      dbField: "payload.mother_tongue",
      excelColumn: "Mother Tongue",
      dataType: "string",
      source: "FormData",
      example: "Tamil"
    },
    "board_studied": {
      dbField: "payload.board_studied",
      excelColumn: "Board Studied",
      dataType: "enum: tnhsc|cbse|icse|other",
      source: "FormData",
      example: "tnhsc"
    },
    "school_location": {
      dbField: "payload.school_location",
      excelColumn: "School Location",
      dataType: "string",
      source: "FormData",
      example: "Chennai"
    },
    "civic_status": {
      dbField: "payload.civic_status",
      excelColumn: "Civic Status",
      dataType: "enum: corp|muni|town|village",
      source: "FormData",
      example: "corp"
    }
  },

  // ============ PERSONAL DETAILS ============
  "Personal Information": {
    "religion": {
      dbField: "payload.religion",
      excelColumn: "Religion",
      dataType: "string",
      source: "FormData",
      example: "Hindu"
    },
    "community": {
      dbField: "payload.community",
      excelColumn: "Community",
      dataType: "enum: oc|bc|bcm|mbc|sc|st",
      source: "FormData",
      example: "oc"
    },
    "caste": {
      dbField: "payload.caste",
      excelColumn: "Caste",
      dataType: "string",
      source: "FormData",
      example: "Brahmin"
    },
    "emis_number": {
      dbField: "payload.emis_number",
      excelColumn: "EMIS Number",
      dataType: "string",
      source: "FormData",
      example: "TN-2023-012345"
    }
  },

  // ============ METADATA ============
  "Metadata": {
    "submitted_at": {
      dbField: "payload.meta.submitted_at",
      excelColumn: "Submitted At",
      dataType: "datetime (ISO format)",
      source: "Added during form submission",
      example: "2024-01-15T10:30:00.000Z"
    },
    "userAgent": {
      dbField: "payload.meta.userAgent",
      excelColumn: "User Agent",
      dataType: "string",
      source: "Added during form submission",
      example: "Mozilla/5.0..."
    }
  },

  // ============ PREFILL DATA (Added by system) ============
  "Prefill Data (System Generated)": {
    "application_number": {
      dbField: "payload.prefill.application_number",
      excelColumn: "Application Number",
      dataType: "string",
      source: "Added from student profile",
      example: "APP-2023-001"
    },
    "institutional_id": {
      dbField: "payload.prefill.institutional_id",
      excelColumn: "Institutional ID",
      dataType: "string",
      source: "Added from student profile",
      example: "PSN-CSE-2023-001"
    }
  }
};

// ============ TOTAL COUNT ============
const TOTAL_FIELDS = Object.values(FORM_FIELD_MAPPING)
  .reduce((sum, section) => sum + Object.keys(section).length, 0);

console.log(`Total exportable fields: ${TOTAL_FIELDS}`);

// ============ EXPORT INSTRUCTIONS ============
/*
HOW TO USE THIS MAPPING:

1. To export form data to Excel:
   - Get all submitted forms with status 'submitted'
   - For each form, decrypt the encrypted_payload
   - Extract each field listed in this mapping
   - Map to corresponding Excel column

2. To add new fields:
   - Add them to this mapping with proper category
   - Update export scripts to include new fields
   - Update admin reports if needed

3. Column ordering recommendation:
   - Student Basic Info (9 fields)
   - Father Info (5 fields)
   - Mother Info (5 fields)
   - Permanent Address (4 fields)
   - Communication Address (4 fields)
   - Admission Info (4 fields)
   - Academic Background (4 fields)
   - Personal Info (4 fields)
   - Metadata (2 fields)
   - Prefill Data (2 fields)

4. Important Notes:
   - Some fields are prefilled from student DB profile (marked as "prefilled from DB")
   - Some fields are added by system (marked as "system generated")
   - All form-filled data is encrypted before storage
   - Export must decrypt payload first, then extract fields
*/

export { FORM_FIELD_MAPPING, TOTAL_FIELDS };
