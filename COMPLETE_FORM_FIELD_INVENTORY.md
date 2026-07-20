# Complete Form Field Inventory - 113 Fields

## All Form Fields by Category

### STEP 1: Student Basic Information (9 fields)
```
1. student_name           string    [Prefilled from DB]
2. student_branch         string    [Prefilled from DB]
3. student_dob            date      [Prefilled from DB]
4. student_age            number    [User input]
5. student_gender         enum      [User input: male|female]
6. student_specially_abled enum    [User input: yes|no]
7. student_mobile         tel       [Prefilled from DB]
8. student_email          email     [User input]
9. student_aadhaar        string    [User input]
```

### STEP 2: Family Header (11 fields)
```
10. father_name               string [Prefilled from DB]
11. father_occupation_type    enum   [government|private|business|self_employed|other]
12. father_occupation         string
13. father_mobile             tel    [Prefilled from DB]
14. father_income             number
15. mother_name               string [Prefilled from DB]
16. mother_occupation_type    enum   [government|private|business|self_employed|other]
17. mother_occupation         string
18. mother_mobile             tel    [User input]
19. mother_income             number
20. guardian_name             string [Optional]
```

### STEP 3: Address Information (8 fields)
```
21. permanent_address         text
22. permanent_city            string
23. permanent_state           string
24. permanent_pincode         number
25. communication_address     text
26. communication_city        string
27. communication_state       string
28. communication_pincode     number
```

### STEP 4: Admission Details (4 fields)
```
29. admission_date            date
30. admission_year            string  [e.g., "2026"]
31. admission_batch           string  [e.g., "2023 - 2027"]
32. admission_allotment_number string [GQ Allotment No / MQ Application No]
```

### STEP 5: Academic Background (7 fields)
```
33. mother_tongue             string
34. board_studied             enum    [tnhsc|cbse|icse|other]
35. school_location           string
36. civic_status              enum    [corp|muni|town|village]
37. residential_status        enum    [day|hostel]
38. tn_study                  enum    [yes|no] - "Studied VIII–XII in Tamil Nadu?"
39. govt_study                enum    [yes|no] - "Studied VI–XII in Government School?"
```

### STEP 6: Community Details (3 fields)
```
40. religion                  string
41. community                 enum    [oc|bc|bcm|mbc|sc|st]
42. caste                     string
```

### STEP 7: School Details (50 fields)

#### EMIS (1 field)
```
43. emis_number               string
```

#### School Details for Class VI (7 fields)
```
44. school_VI_year_passing    string  [YYYY format]
45. school_VI_state           string
46. school_VI_district        string
47. school_VI_block           string
48. school_VI_name            string
49. school_VI_category        enum    [private|government]
50. school_VI_medium          enum    [english|tamil]
```

#### School Details for Class VII (7 fields)
```
51. school_VII_year_passing   string
52. school_VII_state          string
53. school_VII_district       string
54. school_VII_block          string
55. school_VII_name           string
56. school_VII_category       enum    [private|government]
57. school_VII_medium         enum    [english|tamil]
```

#### School Details for Class VIII (7 fields)
```
58. school_VIII_year_passing  string
59. school_VIII_state         string
60. school_VIII_district      string
61. school_VIII_block         string
62. school_VIII_name          string
63. school_VIII_category      enum    [private|government]
64. school_VIII_medium        enum    [english|tamil]
```

#### School Details for Class IX (7 fields)
```
65. school_IX_year_passing    string
66. school_IX_state           string
67. school_IX_district        string
68. school_IX_block           string
69. school_IX_name            string
70. school_IX_category        enum    [private|government]
71. school_IX_medium          enum    [english|tamil]
```

#### School Details for Class X (7 fields)
```
72. school_X_year_passing     string
73. school_X_state            string
74. school_X_district         string
75. school_X_block            string
76. school_X_name             string
77. school_X_category         enum    [private|government]
78. school_X_medium           enum    [english|tamil]
```

#### School Details for Class XI (7 fields)
```
79. school_XI_year_passing    string
80. school_XI_state           string
81. school_XI_district        string
82. school_XI_block           string
83. school_XI_name            string
84. school_XI_category        enum    [private|government]
85. school_XI_medium          enum    [english|tamil]
```

#### School Details for Class XII (7 fields)
```
86. school_XII_year_passing   string
87. school_XII_state          string
88. school_XII_district       string
89. school_XII_block          string
90. school_XII_name           string
91. school_XII_category       enum    [private|government]
92. school_XII_medium         enum    [english|tamil]
```

### STEP 8: Marks & Other Information (21 fields)

#### Marks for Class 10 (4 fields)
```
93. marks_10_year_passing     string  [YYYY format]
94. marks_10_total            number  [Total marks]
95. marks_10_obtained         number  [Marks obtained]
96. marks_10_percentage       number  [Percentage]
```

#### Marks for Class 11 (4 fields)
```
97. marks_11_year_passing     string
98. marks_11_total            number
99. marks_11_obtained         number
100. marks_11_percentage      number
```

#### Marks for Class 12 (4 fields)
```
101. marks_12_year_passing    string
102. marks_12_total           number
103. marks_12_obtained        number
104. marks_12_percentage      number
```

#### Class 12 Core Subjects (4 fields)
```
105. mark_physics             number  [Physics marks]
106. mark_chemistry           number  [Chemistry marks]
107. mark_maths               number  [Mathematics marks]
108. mark_cutoff              number  [Auto-calculated cutoff]
```

#### Relative/Connection Information (5 fields)
```
109. relative_name            string  [Optional - Leave blank if none]
110. relative_branch          enum    [CSE|ECE|IT|EEE|MECH|BME|AI|CSBS|CYS|Civil|VLSI|AIML]
111. relative_year            string  [e.g., "2nd Year" - Optional]
112. relative_relation        string  [Optional - Relationship]
113. hear_about_psna          enum    [adv|old_student|friend|staff]
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Fields | 113 |
| Text Fields | ~65 |
| Date Fields | 2 |
| Number Fields | 8 |
| Enum Fields | ~30 |
| Prefilled Fields | 9 |
| Optional Fields | 3 |
| Dynamic Row Fields | 49 (school VI-XII) + 12 (marks 10-12) = 61 |

---

## Field Validation Quick Reference

### Enum Fields and Valid Values

**gender**: male, female
**specially_abled**: yes, no
**residential_status**: day, hostel
**tn_study**: yes, no
**govt_study**: yes, no
**board_studied**: tnhsc, cbse, icse, other
**civic_status**: corp, muni, town, village
**community**: oc, bc, bcm, mbc, sc, st
**school_category**: private, government
**school_medium**: english, tamil
**relative_branch**: CSE, ECE, IT, EEE, MECH, BME, AI, CSBS, CYS, Civil, VLSI, AIML
**hear_about_psna**: adv, old_student, friend, staff
**father_occupation_type**: government, private, business, self_employed, other
**mother_occupation_type**: government, private, business, self_employed, other

---

## Export Column Order (Recommended)

### Columns 1-43: Basic Student & Family Info
Student Name, Branch, DOB, Age, Gender, Specially Abled, Mobile, Email, Aadhaar
Father Name, Father Occupation Type, Father Occupation, Father Mobile, Father Income
Mother Name, Mother Occupation Type, Mother Occupation, Mother Mobile, Mother Income, Guardian Name
Permanent Address, Permanent City, Permanent State, Permanent Pincode
Communication Address, Communication City, Communication State, Communication Pincode
Date of Admission, Admission Year, Batch, GQ Allotment Number

### Columns 44-50: Academic Background
Mother Tongue, Board Studied, School Location, Civic Status, Residential Status, Studied in TN (VIII-XII), Studied in Govt School (VI-XII)

### Columns 51-52: Community
Religion, Community, Caste

### Columns 53: EMIS
EMIS Number

### Columns 54-134: School Details (VI-XII)
For each class (VI, VII, VIII, IX, X, XI, XII):
  - Year Passing
  - State
  - District
  - Block
  - School Name
  - Category
  - Medium

### Columns 135-152: Marks (10-12 + Core Subjects)
For each class (10, 11, 12):
  - Year Passing
  - Total Marks
  - Marks Obtained
  - Percentage
Physics, Chemistry, Mathematics, Cutoff

### Columns 153-157: Relative/Connection
Relative Name, Relative Branch, Relative Year, Relative Relation, How do you know about PSNA

---

## Important Notes

1. **Dynamic Fields**: Rows 44-134 (91 fields) are part of dynamic tables
2. **Prefilled Data**: Some fields (student_name, student_branch, etc.) come from student DB profile
3. **Optional Fields**: guardian_name, relative_* fields are optional
4. **Enum Restrictions**: Must use exact values listed above
5. **Validation**: All required fields must be non-empty when form is submitted
6. **Date Format**: Stored as YYYY-MM-DD internally, may need formatting for export

---

## Database Considerations

When exporting, these 113 fields are stored in:
```sql
student_application_forms.encrypted_payload  
-- Format: JSON with all 113 fields
-- Encryption: AES-256-CBC
-- Format: "iv:encryptedData" (hex-encoded)
```

---

## File Structure in Payload

The encrypted_payload contains this structure:

```json
{
  // Fields 1-113 (all form fields directly)
  "student_name": "...",
  "student_branch": "...",
  // ... through field 113
  
  // System Added
  "prefill": {
    "application_number": "...",
    "institutional_id": "...",
    "full_name": "...",
    "date_of_birth": "...",
    "academic_branch": "...",
    "father_name": "...",
    "mother_name": "...",
    "father_mobile_number": "...",
    "mobile_number": "..."
  },
  
  "meta": {
    "submitted_at": "ISO 8601 timestamp",
    "userAgent": "browser user agent string"
  }
}
```

