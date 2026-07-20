# COMPLETE PSNA STUDENT DETAILS FORM - FIELD MAPPING

## 📋 Comprehensive Field Reference (113 Fields Total)

---

## PART 1: STEP 1 - STUDENT BASIC INFORMATION (9 Fields)

| # | Field Name | Type | Required | Database Source | Excel Column |
|---|---|---|---|---|---|
| 1 | student_name | string | Yes | Prefilled from students.full_name | Student Name |
| 2 | student_branch | string | Yes | Prefilled from students.academic_branch | Branch |
| 3 | student_dob | date (YYYY-MM-DD) | Yes | Prefilled from students.date_of_birth | Date of Birth |
| 4 | student_age | number | Yes | User input | Age |
| 5 | student_gender | enum | Yes | User input | Gender |
| 6 | student_specially_abled | enum | Yes | User input | Specially Abled |
| 7 | student_mobile | tel | Yes | Prefilled from students.mobile_number | Student Mobile |
| 8 | student_email | email | Yes | User input | Student Email |
| 9 | student_aadhaar | string | Yes | User input | Aadhaar Number |

**Valid Enum Values:**
- student_gender: `male`, `female`
- student_specially_abled: `yes`, `no`

---

## PART 2: STEP 2 - FAMILY HEADER / PARENT INFORMATION (11 Fields)

| # | Field Name | Type | Required | Database Source | Excel Column |
|---|---|---|---|---|---|
| 10 | father_name | string | Yes | Prefilled from students.father_name | Father's Name |
| 11 | father_occupation_type | enum | Yes | User input | Father's Occupation Type |
| 12 | father_occupation | string | Yes | User input | Father's Occupation |
| 13 | father_mobile | tel | Yes | Prefilled from students.father_mobile_number | Father's Mobile |
| 14 | father_income | number | Yes | User input | Father's Annual Income (₹) |
| 15 | mother_name | string | Yes | Prefilled from students.mother_name | Mother's Name |
| 16 | mother_occupation_type | enum | Yes | User input | Mother's Occupation Type |
| 17 | mother_occupation | string | Yes | User input | Mother's Occupation |
| 18 | mother_mobile | tel | Yes | User input | Mother's Mobile |
| 19 | mother_income | number | Yes | User input | Mother's Annual Income (₹) |
| 20 | guardian_name | string | **No** | User input | Guardian's Name (Optional) |

**Valid Enum Values:**
- father_occupation_type: `government`, `private`, `business`, `self_employed`, `other`
- mother_occupation_type: `government`, `private`, `business`, `self_employed`, `other`

---

## PART 3: STEP 3 - ADDRESS INFORMATION (8 Fields)

### Permanent Address (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 21 | permanent_address | text | Yes | Permanent Address |
| 22 | permanent_city | string | Yes | Permanent City |
| 23 | permanent_state | string | Yes | Permanent State |
| 24 | permanent_pincode | number | Yes | Permanent Pincode |

### Communication Address (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 25 | communication_address | text | Yes | Communication Address |
| 26 | communication_city | string | Yes | Communication City |
| 27 | communication_state | string | Yes | Communication State |
| 28 | communication_pincode | number | Yes | Communication Pincode |

---

## PART 4: STEP 4 - ADMISSION DETAILS (4 Fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 29 | admission_date | date (YYYY-MM-DD) | Yes | Date of Admission |
| 30 | admission_year | string | Yes | Admission Year |
| 31 | admission_batch | string | Yes | Batch |
| 32 | admission_allotment_number | string | Yes | GQ Allotment / MQ Application No |

**Format Notes:**
- admission_year: e.g., "2026"
- admission_batch: e.g., "2023 - 2027"
- admission_allotment_number: e.g., "CSE-2023-001"

---

## PART 5: STEP 5 - ACADEMIC BACKGROUND (7 Fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 33 | mother_tongue | string | Yes | Mother Tongue |
| 34 | board_studied | enum | Yes | Board Studied |
| 35 | school_location | string | Yes | School Location |
| 36 | civic_status | enum | Yes | Civic Status |
| 37 | residential_status | enum | Yes | Residential Status |
| 38 | tn_study | enum | Yes | Studied VIII-XII in Tamil Nadu |
| 39 | govt_study | enum | Yes | Studied VI-XII in Government School |

**Valid Enum Values:**
- board_studied: `tnhsc`, `cbse`, `icse`, `other`
- civic_status: `corp` (Corporation), `muni` (Municipality), `town`, `village`
- residential_status: `day` (Day Scholar), `hostel` (Hosteller)
- tn_study: `yes`, `no`
- govt_study: `yes`, `no`

---

## PART 6: STEP 6 - COMMUNITY DETAILS (3 Fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 40 | religion | string | Yes | Religion |
| 41 | community | enum | Yes | Community |
| 42 | caste | string | Yes | Caste |

**Valid Enum Values:**
- community: `oc` (OC), `bc` (BC), `bcm` (BCM), `mbc` (MBC & DNT), `sc` (SC), `st` (ST)

---

## PART 7: STEP 7 - SCHOOL DETAILS (50 Fields)

### EMIS Number (1 field)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 43 | emis_number | string | Yes | EMIS Number |

### School Details for Class VI (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 44 | school_VI_year_passing | string (YYYY) | Yes | Class VI - Year Passing |
| 45 | school_VI_state | string | Yes | Class VI - State |
| 46 | school_VI_district | string | Yes | Class VI - District |
| 47 | school_VI_block | string | Yes | Class VI - Block |
| 48 | school_VI_name | string | Yes | Class VI - School Name |
| 49 | school_VI_category | enum | Yes | Class VI - Category |
| 50 | school_VI_medium | enum | Yes | Class VI - Medium |

### School Details for Class VII (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 51 | school_VII_year_passing | string (YYYY) | Yes | Class VII - Year Passing |
| 52 | school_VII_state | string | Yes | Class VII - State |
| 53 | school_VII_district | string | Yes | Class VII - District |
| 54 | school_VII_block | string | Yes | Class VII - Block |
| 55 | school_VII_name | string | Yes | Class VII - School Name |
| 56 | school_VII_category | enum | Yes | Class VII - Category |
| 57 | school_VII_medium | enum | Yes | Class VII - Medium |

### School Details for Class VIII (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 58 | school_VIII_year_passing | string (YYYY) | Yes | Class VIII - Year Passing |
| 59 | school_VIII_state | string | Yes | Class VIII - State |
| 60 | school_VIII_district | string | Yes | Class VIII - District |
| 61 | school_VIII_block | string | Yes | Class VIII - Block |
| 62 | school_VIII_name | string | Yes | Class VIII - School Name |
| 63 | school_VIII_category | enum | Yes | Class VIII - Category |
| 64 | school_VIII_medium | enum | Yes | Class VIII - Medium |

### School Details for Class IX (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 65 | school_IX_year_passing | string (YYYY) | Yes | Class IX - Year Passing |
| 66 | school_IX_state | string | Yes | Class IX - State |
| 67 | school_IX_district | string | Yes | Class IX - District |
| 68 | school_IX_block | string | Yes | Class IX - Block |
| 69 | school_IX_name | string | Yes | Class IX - School Name |
| 70 | school_IX_category | enum | Yes | Class IX - Category |
| 71 | school_IX_medium | enum | Yes | Class IX - Medium |

### School Details for Class X (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 72 | school_X_year_passing | string (YYYY) | Yes | Class X - Year Passing |
| 73 | school_X_state | string | Yes | Class X - State |
| 74 | school_X_district | string | Yes | Class X - District |
| 75 | school_X_block | string | Yes | Class X - Block |
| 76 | school_X_name | string | Yes | Class X - School Name |
| 77 | school_X_category | enum | Yes | Class X - Category |
| 78 | school_X_medium | enum | Yes | Class X - Medium |

### School Details for Class XI (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 79 | school_XI_year_passing | string (YYYY) | Yes | Class XI - Year Passing |
| 80 | school_XI_state | string | Yes | Class XI - State |
| 81 | school_XI_district | string | Yes | Class XI - District |
| 82 | school_XI_block | string | Yes | Class XI - Block |
| 83 | school_XI_name | string | Yes | Class XI - School Name |
| 84 | school_XI_category | enum | Yes | Class XI - Category |
| 85 | school_XI_medium | enum | Yes | Class XI - Medium |

### School Details for Class XII (7 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 86 | school_XII_year_passing | string (YYYY) | Yes | Class XII - Year Passing |
| 87 | school_XII_state | string | Yes | Class XII - State |
| 88 | school_XII_district | string | Yes | Class XII - District |
| 89 | school_XII_block | string | Yes | Class XII - Block |
| 90 | school_XII_name | string | Yes | Class XII - School Name |
| 91 | school_XII_category | enum | Yes | Class XII - Category |
| 92 | school_XII_medium | enum | Yes | Class XII - Medium |

**Valid Enum Values for All Classes:**
- school_*_category: `private`, `government`
- school_*_medium: `english`, `tamil`

---

## PART 8: STEP 8 - MARKS & OTHER INFORMATION (21 Fields)

### Marks for Class 10 (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 93 | marks_10_year_passing | string (YYYY) | Yes | Class 10 - Year Passing |
| 94 | marks_10_total | number | Yes | Class 10 - Total Marks |
| 95 | marks_10_obtained | number | Yes | Class 10 - Marks Obtained |
| 96 | marks_10_percentage | number | Yes | Class 10 - Percentage (%) |

### Marks for Class 11 (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 97 | marks_11_year_passing | string (YYYY) | Yes | Class 11 - Year Passing |
| 98 | marks_11_total | number | Yes | Class 11 - Total Marks |
| 99 | marks_11_obtained | number | Yes | Class 11 - Marks Obtained |
| 100 | marks_11_percentage | number | Yes | Class 11 - Percentage (%) |

### Marks for Class 12 (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 101 | marks_12_year_passing | string (YYYY) | Yes | Class 12 - Year Passing |
| 102 | marks_12_total | number | Yes | Class 12 - Total Marks |
| 103 | marks_12_obtained | number | Yes | Class 12 - Marks Obtained |
| 104 | marks_12_percentage | number | Yes | Class 12 - Percentage (%) |

### Class 12 Core Subjects (4 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 105 | mark_physics | number | Yes | Physics Marks |
| 106 | mark_chemistry | number | Yes | Chemistry Marks |
| 107 | mark_maths | number | Yes | Mathematics Marks |
| 108 | mark_cutoff | number (read-only) | Yes | Cutoff Mark (Auto-Calculated) |

**Cutoff Calculation Formula:** `(mark_physics + mark_chemistry + mark_maths) / 3`

### Relative/Connection Information (5 fields)

| # | Field Name | Type | Required | Excel Column |
|---|---|---|---|---|
| 109 | relative_name | string | **No** | Relative Name |
| 110 | relative_branch | enum | **No** | Relative Branch |
| 111 | relative_year | string | **No** | Relative Year |
| 112 | relative_relation | string | **No** | Relative Relation |
| 113 | hear_about_psna | enum | Yes | How do you know about PSNA |

**Valid Enum Values:**
- relative_branch: `CSE` (B.E. CSE), `ECE` (B.E. ECE), `IT` (B.Tech IT), `EEE` (B.E. EEE), `MECH` (B.E. Mechanical), `BME` (B.E. Biomedical), `AI` (B.Tech AI & DS), `CSBS` (B.Tech CSBS), `CYS` (B.Tech CYS), `Civil` (B.Tech Civil), `VLSI` (B.Tech VLSI), `AIML` (B.Tech AI & ML)
- hear_about_psna: `adv` (Advertisement / Website / Stall), `old_student` (Old Student), `friend` (Friend), `staff` (PSNA Staff)

**Notes:**
- relative_name: Leave blank if no relative studying in college
- relative_year: e.g., "2nd Year", "3rd Year", "4th Year"
- relative_relation: e.g., "Brother", "Sister", "Cousin"

---

## PART 9: STEP 9 - DOCUMENT UPLOADS

**Note:** Document uploads are NOT part of the encrypted_payload. They are stored separately as files in the document_uploads table.

**Document Types:**
- Student Signature
- Parent/Guardian Signature
- Supporting Certificates
- Proof Documents

---

## PART 10: SYSTEM-GENERATED FIELDS (Added automatically on submission)

### Prefill Data (From Student Profile)

| Field Name | Type | Source | Excel Column |
|---|---|---|---|
| prefill.application_number | string | students.application_number | Application Number |
| prefill.institutional_id | string | students.institutional_id | Institutional ID |
| prefill.full_name | string | students.full_name | Full Name (Prefill) |
| prefill.date_of_birth | date | students.date_of_birth | DOB (Prefill) |
| prefill.academic_branch | string | students.academic_branch | Branch (Prefill) |
| prefill.father_name | string | students.father_name | Father's Name (Prefill) |
| prefill.mother_name | string | students.mother_name | Mother's Name (Prefill) |
| prefill.father_mobile_number | tel | students.father_mobile_number | Father's Mobile (Prefill) |
| prefill.mobile_number | tel | students.mobile_number | Mobile (Prefill) |

### Metadata (System Generated)

| Field Name | Type | Source | Excel Column |
|---|---|---|---|
| meta.submitted_at | datetime (ISO 8601) | System timestamp | Submitted At |
| meta.userAgent | string | Browser user agent | User Agent |

---

## COMPLETE FIELD COUNT SUMMARY

```
Step 1: Student Basic Information        9 fields
Step 2: Family Header                   11 fields
Step 3: Address Information              8 fields
Step 4: Admission Details                4 fields
Step 5: Academic Background              7 fields
Step 6: Community Details                3 fields
Step 7: School Details                  50 fields
Step 8: Marks & Other Information       21 fields
                                        ─────────
TOTAL FORM FIELDS:                     113 fields
```

**Additional System Fields (Not in form):**
- Prefill Data: 9 fields
- Metadata: 2 fields
- **GRAND TOTAL WITH SYSTEM FIELDS: 124 fields**

---

## DATA STORAGE STRUCTURE

### Database Location
```sql
TABLE: student_application_forms
  - id (UUID)
  - student_id (FK)
  - status (VARCHAR: 'draft' | 'submitted')
  - encrypted_payload (TEXT) ← All 113 form fields + prefill + metadata
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### Encryption Details
- **Algorithm:** AES-256-CBC
- **Key:** From process.env.ENCRYPTION_KEY (256-bit hex string, 64 characters)
- **IV:** Random 16 bytes, included in encrypted string
- **Format:** `iv_hex:encrypted_hex` (colon-separated, hex-encoded)
- **Content:** JSON string of complete payload

### Encrypted Payload Structure
```json
{
  "student_name": "John Doe",
  "student_branch": "CSE",
  // ... all 113 form fields
  "school_VI_year_passing": "2015",
  // ... all school details
  "marks_10_year_passing": "2020",
  // ... all marks details
  "relative_name": "Jane Doe",
  // ... all relative info
  "prefill": {
    "application_number": "APP-2023-001",
    // ... 9 prefill fields
  },
  "meta": {
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "userAgent": "Mozilla/5.0..."
  }
}
```

---

## EXPORT COLUMN ORDER (Recommended Sequence)

### Section A: Student Information (9 columns)
1. Student Name
2. Branch
3. Date of Birth
4. Age
5. Gender
6. Specially Abled
7. Student Mobile
8. Student Email
9. Aadhaar Number

### Section B: Parent Information (11 columns)
10. Father's Name
11. Father's Occupation Type
12. Father's Occupation
13. Father's Mobile
14. Father's Annual Income (₹)
15. Mother's Name
16. Mother's Occupation Type
17. Mother's Occupation
18. Mother's Mobile
19. Mother's Annual Income (₹)
20. Guardian's Name

### Section C: Address Information (8 columns)
21. Permanent Address
22. Permanent City
23. Permanent State
24. Permanent Pincode
25. Communication Address
26. Communication City
27. Communication State
28. Communication Pincode

### Section D: Admission Details (4 columns)
29. Date of Admission
30. Admission Year
31. Batch
32. GQ Allotment / MQ Application No

### Section E: Academic Background (7 columns)
33. Mother Tongue
34. Board Studied
35. School Location
36. Civic Status
37. Residential Status
38. Studied VIII-XII in Tamil Nadu
39. Studied VI-XII in Government School

### Section F: Community Details (3 columns)
40. Religion
41. Community
42. Caste

### Section G: School Details (50 columns)
43. EMIS Number
44-50. Class VI: Year Passing | State | District | Block | School Name | Category | Medium
51-57. Class VII: (same 7 columns as VI)
58-64. Class VIII: (same 7 columns as VI)
65-71. Class IX: (same 7 columns as VI)
72-78. Class X: (same 7 columns as VI)
79-85. Class XI: (same 7 columns as VI)
86-92. Class XII: (same 7 columns as VI)

### Section H: Marks Details (16 columns)
93-96. Class 10: Year Passing | Total Marks | Marks Obtained | Percentage
97-100. Class 11: Year Passing | Total Marks | Marks Obtained | Percentage
101-104. Class 12: Year Passing | Total Marks | Marks Obtained | Percentage
105. Physics Marks
106. Chemistry Marks
107. Mathematics Marks
108. Cutoff Mark

### Section I: Relative/Connection Information (5 columns)
109. Relative Name
110. Relative Branch
111. Relative Year
112. Relative Relation
113. How do you know about PSNA

### Section J: System Information (11 columns)
114. Application Number (prefill)
115. Institutional ID (prefill)
116. Full Name (prefill)
117. DOB (prefill)
118. Branch (prefill)
119. Father's Name (prefill)
120. Mother's Name (prefill)
121. Father's Mobile (prefill)
122. Mobile (prefill)
123. Submitted At
124. User Agent

---

## FIELD VALIDATION RULES

### Required Field Validation
- **All 113 form fields are required** in the form UI
- However, `guardian_name` and `relative_*` fields may be empty strings if not applicable
- Empty strings are valid for optional fields

### Data Type Validation

**String Fields:** No special validation
- Names, locations, occupations, etc.

**Number Fields:** Must be numeric
- age, father_income, mother_income, marks values
- Percentage fields: 0-100

**Date Fields:** Must be YYYY-MM-DD format
- student_dob, admission_date, marks year_passing, school year_passing

**Tel Fields:** Phone number format
- student_mobile, father_mobile, mother_mobile
- Expected: +91 XXXXX XXXXX format

**Email Fields:** Valid email format
- student_email

**Enum Fields:** Must be exact value from predefined list
- No other values accepted
- Case-sensitive matching

### Calculated Fields
- `mark_cutoff` = (mark_physics + mark_chemistry + mark_maths) / 3
- Read-only on form UI
- Calculated server-side on submission

---

## EXPORT IMPLEMENTATION CHECKLIST

**Before Exporting:**
- [ ] Verify all 113 field names match exactly (case-sensitive)
- [ ] Confirm database connection working
- [ ] Verify encryption key is loaded (64 hex chars)
- [ ] Check that submitted forms exist in database
- [ ] Test decryption with sample form

**During Export:**
- [ ] Query: `SELECT encrypted_payload FROM student_application_forms WHERE status = 'submitted'`
- [ ] For each form: decrypt payload using AES-256-CBC
- [ ] Parse JSON from decrypted string
- [ ] Extract all 113 fields (handle missing gracefully)
- [ ] Map to corresponding Excel columns
- [ ] Format dates/numbers appropriately
- [ ] Handle optional fields (use empty string for missing)

**After Export:**
- [ ] Verify row count matches database count
- [ ] Check all 124 columns present
- [ ] Validate data types in Excel
- [ ] Spot-check random rows for accuracy
- [ ] Save with timestamp in filename
- [ ] Verify file integrity

---

## COMMON EXPORT MAPPINGS

**Field → Excel Format Examples:**

```
student_dob: "2003-05-15" → Excel Date (5/15/2003)
student_age: "21" → Number (21)
student_gender: "male" → Text (Male)
father_income: "500000" → Currency (₹500,000)
marks_12_percentage: "91.67" → Number (91.67)
admission_batch: "2023 - 2027" → Text (2023 - 2027)
residential_status: "day" → Text (Day Scholar)
community: "oc" → Text (OC)
hear_about_psna: "old_student" → Text (Old Student)
meta.submitted_at: "2024-01-15T10:30:00.000Z" → DateTime (1/15/2024 10:30)
```

---

## 🎯 COMPLETE FIELD REFERENCE

### Quick Lookup by Category

**Student Info Fields:** 1-9
**Parent Info Fields:** 10-19
**Guardian Field:** 20
**Address Fields:** 21-28
**Admission Fields:** 29-32
**Academic Fields:** 33-39
**Community Fields:** 40-42
**EMIS Field:** 43
**School VI-XII Fields:** 44-92 (49 fields)
**Marks 10-12 Fields:** 93-104 (12 fields)
**Core Subject Fields:** 105-108 (4 fields)
**Relative Info Fields:** 109-112 (4 fields)
**PSNA Knowledge Field:** 113 (1 field)

---

## FINAL NOTES

1. **All 113 fields are collected** from the form via FormData API
2. **No fields are truncated** during collection or encryption
3. **Encryption happens server-side** after form submission
4. **Export must decrypt first** before accessing field values
5. **System fields are added** automatically on submission (prefill + meta)
6. **Complete payload** (all 113 + system fields) stored encrypted in database
7. **Dynamic tables** (school, marks) properly formatted as individual fields with class/year in name
8. **Optional fields** should export as empty string if not filled

