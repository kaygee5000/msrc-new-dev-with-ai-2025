# 📄 Full PRD: Teacher Attendance, Punctuality, and Exercises Monitoring

## Purpose
To develop a comprehensive module within the MSRC Dashboard to track and analyze:
- **Weekly teacher attendance**
- **Teacher punctuality (days late)**
- **Lesson exercises given and marked (termly)**
- **Reasons for teacher absence**

This system will help GES officers at National, Regional, District, and Circuit levels easily monitor teacher engagement, attendance, and academic productivity, and make evidence-based decisions.

---

## Functional Requirements

| Requirement ID | Description | User Story | Expected Outcome |
|:---|:---|:---|:---|
| TA001 | Create New Teacher | As an admin, I want to create teachers with unique codes and assign them to schools. | Teacher profile created with Teacher Code (or temp code like TMP-2025-001). |
| TA002 | View Teacher Profiles | As an officer, I want to view teacher details (attendance records, lesson stats, etc.). | Admins can view full profiles of teachers under their jurisdiction. |
| TA003 | Transfer Teacher Between Schools | As an admin, I want to release a teacher and reassign to another school. | Teacher appears in "Released Teachers" pool until assigned. |
| TA004 | Mark Weekly Attendance and Punctuality | As a headteacher, I want to submit number of days present and days late per teacher weekly. | Weekly data entry interface; stored and available for analysis. |
| TA005 | Submit Absence Reasons | As a headteacher, I must select an absence reason if a teacher was absent during a week. | Mandatory absence reason if teacher did not complete expected working days. |
| TA006 | Track Exercises Given | As a headteacher, I want to enter total exercises given by teacher per term. | Data stored separately and aggregated termly. |
| TA007 | Track Exercises Marked | As a headteacher, I want to enter number of exercises marked per term. | Termly data showing teacher follow-through on grading. |
| TA008 | Calculate Attendance Rate (%) | As an admin, I want to see teacher attendance rate calculated automatically. | Rate = (Days Present ÷ Expected Days) × 100 |
| TA009 | Calculate Punctuality Rate (%) | As an admin, I want to see punctuality rate calculated automatically. | Rate = (Days on Time ÷ Expected Days) × 100 |
| TA010 | Calculate Exercise Marking Rate (%) | As an admin, I want to see how many exercises given were marked. | Rate = (Exercises Marked ÷ Exercises Given) × 100 |
| TA011 | Export Attendance & Punctuality Reports | As an admin, I want to download filtered teacher reports (school, district, region, national). | CSV/Excel download available for filtered datasets. |
| TA012 | View Released (Unassigned) Teachers | As an officer, I want to view all teachers without current school assignments. | Separate page or list for managing released teachers. |
| TA013 | Bulk Create Teachers | As an admin, I want to upload multiple teachers at once using a CSV or form. | Bulk add feature with validation to prevent duplicate Teacher Codes. |
| TA014 | Drilldown Navigation | As an admin, I want to drill down from National ➔ Region ➔ District ➔ Circuit ➔ School ➔ Teacher. | Navigation flow with RBAC enforced dynamically. |

---

## KPIs to Track

| KPI | Description |
|:---|:---|
| Attendance Rate % | (Days Present / Expected Days) × 100 |
| Punctuality Rate % | (Days on Time / Expected Days) × 100 |
| Exercises Given | Termly total |
| Exercises Marked | Termly total |
| Exercise Marking Rate % | (Exercises Marked / Exercises Given) × 100 |
| Absence Reasons | Summary table of absence breakdowns (Sick Leave, Maternity Leave, Official Duty, etc.) |

---

## Technology Stack

| Layer | Technology |
|:---|:---|
| Frontend | React + Next.js |
| UI Styling | TailwindCSS + MUI |
| Charts | ApexCharts |
| Backend | Laravel (existing MSRC backend) |
| Database | MySQL (teacher_attendance, teacher_exercises tables) |
| Authentication | Role-Based Access Control (RBAC) |

---

## Important Business Rules

- Teacher Codes must be **unique**.  
- Temporary Teachers must have codes starting with `"TMP-"`.
- Absence reasons must be selected if Days Present < Expected Days.
- "Released" teachers should be easily assignable back to any school.
- Weekly data = attendance + punctuality.
- Termly data = exercises given/marked.

---

# 🛠 Task Checklist (Build Step-by-Step)

| Task ID | Description |
|:---|:---|
| 1.0 | Setup Teacher Profiles management (CRUD) |
| 1.1 | Add unique Teacher Code validation |
| 1.2 | Create Released Teachers List Page |
| 1.3 | Build Weekly Teacher Attendance Form (Days Present / Expected Days) |
| 1.4 | Build Weekly Teacher Punctuality Form (Days Late field) |
| 1.5 | Add Absence Reason mandatory selection if teacher absent |
| 1.6 | Build Termly Exercises Given/Marked Form |
| 1.7 | Create Dashboard Cards (Attendance %, Punctuality %, Exercises Marked %) |
| 1.8 | Build ApexCharts Trends (Attendance Rate over weeks, Exercise Marking Rate per term) |
| 1.9 | Build Export Functions (per school, circuit, district, region, national) |
| 2.0 | Build Drilldown Navigation (National ➔ Region ➔ District ➔ Circuit ➔ School ➔ Teacher) |
| 2.1 | Bulk Upload Teachers Feature (CSV Upload) |
| 2.2 | RBAC Enforcement: Filter data by logged in admin's scope |
| 2.3 | Responsive UI for all views (Tailwind + MUI) |
| 2.4 | QA Testing: Attendance, Punctuality, Exercises Calculations |
