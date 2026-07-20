# PDF Template Integration Guide

## What Was Changed

The PDF export functionality has been updated to:
1. **Load your template PDF** (`PSNA_Student_Details_Form.pdf`) automatically
2. **Overlay student details** at specific positions on your template
3. **Use a configuration file** to control field positions

## How to Use

### Step 1: Click PDF Export Button
When you click the PDF button on a student record, the system will:
- Load your template PDF
- Fill in the student details
- Return the completed PDF

### Step 2: Adjust Field Positions

The file `pdf-field-config.json` controls where text appears on your PDF:

```json
{
  "fields": {
    "Application Number": { "x": 150, "y": 100, "fontSize": 10 },
    "Full Name": { "x": 150, "y": 130, "fontSize": 11 },
    "Date of Birth": { "x": 150, "y": 160, "fontSize": 10 },
    ...
  }
}
```

**Field Meanings:**
- `x`: Horizontal position from left edge (0-595)
- `y`: Vertical position from top (0-841)  
- `fontSize`: Text size in points

### Step 3: Fine-Tune Coordinates

To find the right coordinates for your template:

1. Open your template PDF in an image editor
2. Identify where each field should go
3. Estimate the pixel coordinates (A4 page ≈ 595 × 841 pixels)
4. Update `pdf-field-config.json` with the correct values

**Example Adjustments:**
```json
"Full Name": { "x": 200, "y": 150, "fontSize": 12 }
```
This places "Full Name" at 200px from left, 150px from top, size 12pt

## Fields Currently Configured

The following student fields are populated:
- Application Number
- Full Name
- Date of Birth
- Department
- Mobile Number
- Father Name, Occupation, Mobile
- Mother Name, Occupation, Mobile
- Guardian Name
- Permanent & Communication Address
- District, State
- Religion, Caste
- Nationality, Mother Tongue
- Board Studied, School Location
- Email, Aadhaar

## Adding More Fields

To add more fields to your PDF:

1. Add the field to `pdf-field-config.json`:
```json
"Student Mobile": { "x": 150, "y": 230, "fontSize": 10 }
```

2. The field name must match the available data:
   - Student database fields: `application_number`, `full_name`, `date_of_birth`, `academic_branch`, `mobile_number`, `father_name`, `father_mobile_number`, `mother_name`
   - Form fields: Any field from the student application form

## How Updated Data is Handled

When you edit a student in the admin modal:
1. Changes are saved to the database
2. When you export PDF immediately after, the **latest data** is used
3. This is because the system merges database fields + form data + recent edits (additional_info JSONB)

## Troubleshooting

**PDF appears blank?**
- Check that coordinates are within page bounds (x: 0-595, y: 0-841)
- Verify field names match available data

**Text overlaps with template content?**
- Adjust the `x` and `y` coordinates
- Or add more spacing between fields

**Field not appearing?**
- Verify the data exists for that student
- Check the field name is correct in config file
- Ensure coordinates are visible on the page

## PDF Template Structure

Your template has:
- **4 pages** (A4 size: 595.28 × 841.89 pixels each)
- Student details are filled on **Page 1**
- If you want to use other pages, let me know the coordinates

