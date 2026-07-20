# ⚠️ FORM EXPORT DOCUMENTATION - CRITICAL UPDATE

## 🔴 Previous Documentation Was Incomplete

The original documentation covered only **45 fields** from the form. The **ACTUAL form contains 113 data fields** across 10 steps.

---

## 📊 Complete Form Structure (113 Fields)

### STEP 1: Student Basic Information (9 fields)
| Field Name | Type | Required | Source |
|------------|------|----------|--------|
| student_name | string | Yes | Prefilled from DB |
| student_branch | string | Yes | Prefilled from DB |
| student_dob | date | Yes | Prefilled from DB |
| student_age | number | Yes | User input |
| student_gender | enum(male/female) | Yes | User input |
| student_specially_abled | enum(yes/no) | Yes | User input |
| student_mobile | tel | Yes | Prefilled from DB |
| student_email | email | Yes | User input |
| student_aadhaar | string | Yes | User input |

---

### STEP 2: Family Header (11 fields)
| Field Name | Type | Required | Source |
|------------|------|----------|--------|
| father_name | string | Yes | Prefilled from DB |
| father_occupation_type | enum | Yes | User input |
| father_occupation | string | Yes | User input |
| father_mobile | tel | Yes | Prefilled from DB |
| father_income | number | Yes | User input |
| mother_name | string | Yes | Prefilled from DB |
| mother_occupation_type | enum | Yes | User input |
| mother_occupation | string | Yes | User input |
| mother_mobile | tel | Yes | User input |
| mother_income | number | Yes | User input |
| guardian_name | string | **No** | **MISSING IN ORIGINAL DOCS** |

**guardian_name** Valid values: `government`, `private`, `business`, `self_employed`, `other`

---

### STEP 3: Address Information (8 fields)
| Field Name | Type | Required |
|------------|------|----------|
| permanent_address | text | Yes |
| permanent_city | string | Yes |
| permanent_state | string | Yes |
| permanent_pincode | number | Yes |
| communication_address | text | Yes |
| communication_city | string | Yes |
| communication_state | string | Yes |
| communication_pincode | number | Yes |

---

### STEP 4: Admission Details (4 fields)
| Field Name | Type | Required |
|------------|------|----------|
| admission_date | date | Yes |
| admission_year | string | Yes |
| admission_batch | string | Yes |
| admission_allotment_number | string | Yes |

---

### STEP 5: Academic Background (7 fields)
| Field Name | Type | Required | Note |
|------------|------|----------|------|
| mother_tongue | string | Yes | |
| board_studied | enum | Yes | tnhsc, cbse, icse, other |
| school_location | string | Yes | |
| civic_status | enum | Yes | corp, muni, town, village |
| residential_status | enum(day/hostel) | **Yes** | **MISSING IN ORIGINAL DOCS** |
| tn_study | enum(yes/no) | Yes | "Studied VIII–XII in Tamil Nadu?" |
| govt_study | enum(yes/no) | Yes | "Studied VI–XII in Government School?" |

---

### STEP 6: Community Details (3 fields)
| Field Name | Type | Required |
|------------|------|----------|
| religion | string | Yes |
| community | enum | Yes |
| caste | string | Yes |

**community** Valid values: `oc`, `bc`, `bcm`, `mbc`, `sc`, `st`

---

### STEP 7: School Details (50 fields)

**A. EMIS Number (1 field)**
- `emis_number` - string, required

**B. School Details for Classes VI-XII (49 fields)**

For each class (VI, VII, VIII, IX, X, XI, XII), capture 7 fields:

| For Each Class | Field Name Pattern | Type |
|---|---|---|
| 1 | `school_{CLASS}_year_passing` | text (YYYY) |
| 2 | `school_{CLASS}_state` | string |
| 3 | `school_{CLASS}_district` | string |
| 4 | `school_{CLASS}_block` | string |
| 5 | `school_{CLASS}_name` | string |
| 6 | `school_{CLASS}_category` | enum(private/government) |
| 7 | `school_{CLASS}_medium` | enum(english/tamil) |

**Example fields:**
- `school_VI_year_passing` - Year passed class VI
- `school_VI_state` - State for class VI
- `school_VII_year_passing` - Year passed class VII
- ... (repeat pattern)
- `school_XII_year_passing` - Year passed class XII
- `school_XII_medium` - Medium for class XII

**Total: 7 classes × 7 fields = 49 fields**

---

### STEP 8: Marks & Other Information (21 fields)

#### A. Marks Details (12 fields)

For classes 10, 11, 12, capture 4 fields each:

| For Each Class | Field Name Pattern | Type |
|---|---|---|
| 1 | `marks_{CLASS}_year_passing` | text (YYYY) |
| 2 | `marks_{CLASS}_total` | number |
| 3 | `marks_{CLASS}_obtained` | number |
| 4 | `marks_{CLASS}_percentage` | number (%) |

**Example fields:**
- `marks_10_year_passing`
- `marks_10_total`
- `marks_10_obtained`
- `marks_10_percentage`
- `marks_11_year_passing`
- ... (repeat)
- `marks_12_percentage`

**Total: 3 classes × 4 fields = 12 fields**

#### B. Core Subjects - Class 12 (4 fields)
| Field Name | Type | Note |
|---|---|---|
| mark_physics | number | Physics marks |
| mark_chemistry | number | Chemistry marks |
| mark_maths | number | Mathematics marks |
| mark_cutoff | number | Auto-calculated cutoff |

#### C. Relative/Connection Information (5 fields)
| Field Name | Type | Required | Note |
|---|---|---|---|
| relative_name | string | No | Leave blank if none |
| relative_branch | enum | No | Branch of relative |
| relative_year | string | No | e.g., "2nd Year" |
| relative_relation | string | No | Relationship to relative |
| hear_about_psna | enum | Yes | **MISSING IN ORIGINAL DOCS** |

**hear_about_psna** Valid values:
- `adv` - Advertisement / Website / Stall
- `old_student` - Old Student
- `friend` - Friend
- `staff` - PSNA Staff

**Total Step 8: 12 + 4 + 5 = 21 fields**

---

### STEP 9: Document Uploads
- **Not stored in encrypted_payload** - stored separately as files
- Contains signature, certificates, etc.
- Not included in form data export

### STEP 10: Final Submission
- UI only, no additional fields

---

## 📈 Complete Field Count

```
Step 1: Student Info        ............ 9 fields
Step 2: Family Header       ............ 11 fields
Step 3: Address             ............ 8 fields
Step 4: Admission           ............ 4 fields
Step 5: Academic Background ............ 7 fields
Step 6: Community           ............ 3 fields
Step 7: School Details      ............ 50 fields
Step 8: Marks & Other       ............ 21 fields
                               ─────────────────
                        TOTAL ............ 113 fields
```

---

## 🔍 Fields Missing from Original Documentation

### New Fields Discovered (7 total):

1. **guardian_name** (Step 2)
   - Type: string
   - Required: No
   - Optional guardian/legal guardian name

2. **residential_status** (Step 5)
   - Type: enum (day/hostel)
   - Required: Yes
   - Radio button: "Day Scholar" or "Hosteller"

3. **tn_study** (Step 5) ⚠️ Named differently
   - Type: enum (yes/no)
   - Required: Yes
   - Question: "Studied VIII–XII in Tamil Nadu?"
   - Note: Different from documented field name

4. **govt_study** (Step 5) ⚠️ Already documented but with eligibility context
   - Type: enum (yes/no)
   - Required: Yes
   - Question: "Studied VI–XII in Government School?"

5. **hear_about_psna** (Step 8)
   - Type: enum (adv/old_student/friend/staff)
   - Required: Yes
   - Question: "How do you know about PSNA?"

6-9. **Relative Information** (Step 8)
   - relative_name, relative_branch, relative_year, relative_relation
   - All optional fields
   - For capturing if student has siblings/relatives studying in college

---

## ⚠️ Critical Differences from Original Documentation

| Aspect | Original Claim | Actual Reality |
|--------|---|---|
| **Total Fields** | 45 | **113** |
| **Steps** | Not clearly stated | **10 steps total** |
| **School Details** | 4 fields | **50 fields** (table for VI-XII) |
| **Marks Details** | Not documented | **12 fields** (table for classes 10-12) |
| **Core Subjects** | Not documented | **4 fields** |
| **Relative Info** | Not documented | **5 fields** |
| **guardian_name** | Missing | **1 field** |
| **residential_status** | Missing | **1 field** |
| **hear_about_psna** | Missing | **1 field** |
| **Document Storage** | In encrypted_payload | **Separate file storage** |

---

## 📝 How School Details Are Stored

```
// For each of 7 classes (VI, VII, VIII, IX, X, XI, XII)
school_VI: {
  year_passing: "2015",
  state: "Tamil Nadu",
  district: "Chennai",
  block: "T.Nagar",
  name: "St. Anne's School",
  category: "private",
  medium: "english"
}
school_VII: { ... },
school_VIII: { ... },
// ... through XII
```

---

## 📝 How Marks Details Are Stored

```
// For each of classes 10, 11, 12
marks_10: {
  year_passing: "2020",
  total: 600,
  obtained: 550,
  percentage: 91.67
}
marks_11: { ... },
marks_12: { ... },

// Core subjects (class 12 only)
mark_physics: 95,
mark_chemistry: 92,
mark_maths: 98,
mark_cutoff: 95  // Auto-calculated
```

---

## 🔧 Export Column Names (Updated)

All 113 fields should have corresponding export columns:

### Step 1-4 (32 fields) - [See FORM_EXPORT_API_DOCUMENTATION.md]

### Step 5 Additional Columns
- Residential Status
- Studied in TN (VIII-XII)
- Studied in Govt School (VI-XII)

### Step 7 School Details (50 columns)
- EMIS Number
- Class VI: Year Passing | State | District | Block | School Name | Category | Medium
- Class VII: (same 7 columns)
- ... through Class XII

### Step 8 Marks Details (21 columns)
- Class 10: Year Passing | Total Marks | Marks Obtained | Percentage
- Class 11: (same 4 columns)
- Class 12: (same 4 columns)
- Physics Marks | Chemistry Marks | Mathematics Marks | Cutoff Mark
- Relative Name | Relative Branch | Relative Year | Relative Relation
- How do you know about PSNA

---

## ✅ Next Steps

1. **Update FORM_EXPORT_API_DOCUMENTATION.md** with all 113 fields
2. **Update FORM_FIELD_MAPPING.js** with complete mappings
3. **Update export implementation** to handle:
   - Dynamic school detail rows (7 classes × 7 fields)
   - Dynamic marks rows (3 classes × 4 fields)
   - All relative/connection information
4. **Verify database** that all 113 fields are being encrypted and stored
5. **Test export** with actual submitted forms

---

## 🚨 Verification Required

Before updating export functionality, verify:
- [ ] All 113 field names match exactly (case-sensitive)
- [ ] All enumerated field values are correct
- [ ] Dynamic table fields are properly collected in FormData
- [ ] Encrypted payload contains all 113 fields
- [ ] No fields are being truncated or lost during encryption
- [ ] Export maps exactly to these 113 fields

