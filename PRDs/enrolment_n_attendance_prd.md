# Project Requirements Document: MSRC Enrollment & Attendance Analytics Dashboard

## Purpose
To develop a responsive, role-based dashboard for **Ghana Education Service (GES)** to track, analyze, and act on **weekly student enrollment and attendance data** across National, Regional, District, Circuit, and School levels. The dashboard must help identify trends, submission gaps, attendance problems, and performance at a glance, empowering decision-making at every level.

---

## Functional Requirements

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
|:---|:---|:---|:---|
| EA001 | Enrollment Overview Summary | As an admin, I want to view national, regional, district, circuit, and school enrollment totals at a glance. | Dashboard cards show enrollment numbers, broken down by gender and level. |
| EA002 | Attendance Overview Summary | As an admin, I want to see weekly attendance totals and attendance rate (%) immediately. | Dashboard cards show total attendance and attendance rate (%) for the latest week. |
| EA003 | Attendance Trends Visualization | As a regional/district admin, I want to visualize weekly attendance trends over a term/year. | Line graph via ApexCharts shows attendance % per week. Filters by year, term, week. |
| EA004 | Missing Submissions Highlight | As a district/circuit admin, I want to see which schools failed to submit weekly attendance. | List/table of schools with "no data" for selected weeks. |
| EA005 | Drill Down Navigation | As an admin, I want to drill down from National ➔ Region ➔ District ➔ Circuit ➔ School to see detailed data. | Clickable views; moving between levels dynamically without reloading. |
| EA006 | Gender-Based Attendance Breakdown | As a district admin, I want to view boys vs girls attendance separately. | Tables and charts show gender-split attendance rates. |
| EA007 | Special Needs Disaggregation (Optional) | As an admin, I want to track attendance for special needs students where available. | Separate small section for special needs if data exists. |
| EA008 | Term Attendance Average Calculation | As an admin, I want to see the average attendance % across a term. | Average of all weekly rates calculated and displayed automatically. |
| EA009 | Export Data Functionality | As an admin, I want to export filtered attendance and enrollment data as CSV or Excel. | Button to download whatever view/filters are selected. |
| EA010 | Role-Based Access Control (RBAC) Enforcement | As an officer, I want to only see my jurisdiction’s data. | Region/district/circuit admins only access their assigned areas automatically. |
| EA011 | Weekly and Term Selection Filters | As an admin, I want to filter data by year, term, week. | Dropdowns to pick Academic Year ➔ Term ➔ Week seamlessly. |
| EA012 | Responsive Mobile-Ready Design | As an admin, I want to access the dashboard cleanly on any device. | TailwindCSS + MUI ensures full responsiveness across desktop, tablet, mobile. |
| EA013 | Refresh/Update Data Button | As an admin, I want a button to refresh dashboards manually. | "Refresh" button reloads latest data without full page reload. |

---

## User Roles

| Role | Scope of Access |
|:---|:---|
| Super Admin | Full access to all data and exports nationwide. |
| National Admin | View only access to full national data. |
| Regional Officer | Access to only their assigned region. |
| District Officer | Access to only their assigned district. |
| Circuit Officer | Access to only their assigned circuit. |
| School Head | (Optional: View own school’s submissions.) |

---

## Technology Stack

| Layer | Tech |
|:---|:---|
| Frontend Framework | React + Next.js |
| Styling | TailwindCSS + MUI |
| Charts | ApexCharts (responsive, animated) |
| Backend | Laravel API (existing) |
| Database | MySQL |
| Authentication | RBAC via Laravel passport or JWT |

---

## KPIs to Display

| KPI | Level | Details |
|:---|:---|:---|
| Total Enrollment | All levels | Boys, Girls, Special Needs breakdown |
| Weekly Attendance | All levels | Absolute numbers |
| Attendance Rate (%) | All levels | Weekly and Term average |
| Submission Status | School | Whether weekly submission received |
| Missing Submissions Count | Admin view | Count and list of schools with gaps |
| Gender Breakdown Attendance | All levels | Boy vs Girl attendance comparisons |

---

# ✅ Now...  
Here’s your requested **Task Checklist** to build systematically:

---

# Enrollment & Attendance Analytics - Task Checklist

| Task ID | Description |
|:---|:---|
| 1.0 | Setup Dashboard page layout (Tailwind + MUI) |
| 1.1 | Build National Overview cards (Enrollment, Attendance, Rate %) |
| 1.2 | Create ApexCharts Attendance Trend line graph (Weekly, Term, Year filters) |
| 1.3 | Build Regional/District/Circuit Drilldown Table |
| 1.4 | Highlight missing submissions (schools without data) |
| 1.5 | Display Gender-Split Attendance charts |
| 1.6 | Display Term Attendance Average (Auto-calculated from weekly) |
| 1.7 | Implement Export CSV/Excel button |
| 1.8 | Integrate RBAC (Role Based Access Control) filters dynamically |
| 1.9 | Add Filters: Year, Term, Week, Region, District, Circuit, School |
| 2.0 | Optimize Mobile Responsiveness |
| 2.1 | Add Refresh Data button |
| 2.2 | Connect dashboard to Laravel API for real data |
| 2.3 | Test all data levels (National ➔ School) for accuracy |
| 2.4 | Conduct UI/UX Quality Assurance Testing |

---

