✅ PRD: Pregnancy & Re-entry Dashboard
Purpose:
Enable data collectors to submit school-specific pregnancy/re-entry data and allow admin users to view analytics and submissions per region/district/circuit/school.

🟦 SECTION B: Admin Dashboard & Analytics
6.0 Sidebar Integration
6.1 Add "Pregnancy & Re-entry Dashboard" to Admin sidebar

6.2 Restrict access to admin roles:

Super Admin

National Admin

Regional Admin

District Admin

Circuit Admin

7.0 Data Aggregation & Filters
7.1 Query all pregnancy_responses

7.2 Apply user-level jurisdiction filter:

National = All

Regional = Region

District = District

Circuit = Circuit

7.3 Aggregate data per question across all schools in view

7.4 Group by:

Term

School

District

Region

Thematic Area

8.0 UI – Analytics Dashboard
8.1 Use provided UI as reference for design

8.2 Create cards to display totals:

Pregnant girls in school

Pregnant girls out of school

Re-entry count

8.3 Charts/graphs for trends (weekly/termly):

8.3.1 Line graph for re-entries

8.3.2 Bar chart by district

8.4 Table listing of raw data with filters

8.5 Filters:

Region

District

Circuit

School

Term

Thematic Area

9.0 View Individual Submissions
9.1 View list of all form entries

9.2 Filterable by region/district/etc.

9.3 Show submitted Q&A per user per school

9.4 Include timestamp and user name

10.0 Backend & DB Integration
10.1 Use live DB connection (no mock data)

10.2 Tables involved:

users (role, jurisdiction)

pregnancy_questions

pregnancy_responses

schools

terms

10.3 Ensure efficient query performance

10.4 Add pagination and sorting where necessary

11.0 Permissions & Role Logic
11.1 Ensure all actions respect RBAC (role-based access control)

11.2 Data collector:

Only see & submit their own school’s data

11.3 Admin users:

Only see data within their scope (based on role level)

