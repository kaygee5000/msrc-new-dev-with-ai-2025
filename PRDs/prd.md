# MSRC Product Requirements Document (PRD)

## Checklist of Deliverables

1. **Project Overview**
   - [ ] Capture school-level educational indicators.
   - [ ] Visualize and analyze weekly and termly data submissions.
   - [ ] Enable real-time decision-making from the school to the national level.

2. **Goals & Objectives**
   - [ ] Provide a mobile-first, user-friendly interface for data reporting and monitoring.
   - [ ] Support role-based access to facilitate hierarchical drill-down from National > Region > District > School.
   - [ ] Present trend analytics across time and comparison across districts/regions.
   - [ ] Export data for offline analysis (CSV, Excel).

3. **Tech Stack**
   - [ ] Frontend: React.js + Next.js
   - [ ] Styling: Bootstrap 5 (GES branding: Bootstrap Blue)
   - [ ] Charts: ApexCharts (via react-apexcharts)
   - [ ] Backend: Laravel + MySQL (existing)
   - [ ] Auth: Email & Password (Role-based access control)

4. **User Roles**
   - [ ] Implement GES Admin role with full access.
   - [ ] Implement Regional Officer role with region-level data access.
   - [ ] Implement District Officer role with district-level data access.
   - [ ] Implement School Head Facilitator role with school-level data access.

5. **Features & Functionality**
   - 5.1 **Home Page**
     - [ ] Short intro to MSRC.
     - [ ] Links to About, Contact, and Login.
     - [ ] Clean, mobile-first layout.
   - 5.2 **About Page**
     - [ ] Static content on the purpose of MSRC and GES’s goals.
   - 5.3 **Contact Page**
     - [ ] Static contact info and email form (optional).
   - 5.4 **Login Page**
     - [ ] Email + Password authentication.
     - [ ] Role-based redirection after login.
   - 5.5 **Dashboard**
     - [ ] KPIs: Total submissions, attendance rates, enrollment changes, re-entry numbers.
     - [ ] Analytics: Weekly vs. termly comparisons, regional vs. district stats, activity feed.
     - [ ] Visuals: Bar charts, line charts, pie charts.
     - [ ] Drilldown path: National > Region > District > School.
   - 5.6 **Report Submission**
     - [ ] UI for submitting weekly indicators.
     - [ ] UI for submitting termly indicators.
     - [ ] Form validation, feedback, and success/error states.
     - [ ] Auto-fill suggestions for recurring fields.
   - 5.7 **Submission History**
     - [ ] List of recent submissions by user’s access level.
     - [ ] Filters: Term, Week, Indicator Type.
     - [ ] Export: CSV/Excel.
     - [ ] View trends from submission history.

6. **UX & UI Requirements**
   - [ ] Mobile-first design.
   - [ ] Consistent use of Bootstrap 5.
   - [ ] Role-sensitive layout.
   - [ ] Use color-coded indicators.
   - [ ] Responsive dashboard cards and collapsible panels.

7. **Data Integration**
   - [ ] Connect Laravel backend to expose dashboard and reports via MCP interface.
   - [ ] Fetch data using REST endpoints.
   - [ ] Handle authentication token via secure sessions.

8. **Notifications**
   - [ ] Toasts/snackbars for form actions (submit, error, saved).

9. **Security**
   - [ ] Role-based access control on both frontend and backend.
   - [ ] Basic session-based authentication.
   - [ ] Logout and session timeout functionality.

10. **Future Considerations**
    - [ ] AI agent integration via MCP API.
    - [ ] Offline-first submission from mobile app.
    - [ ] Admin panel to manage About/Contact content.
    - [ ] More granular audit trails.

11. **Appendices**
    - [ ] Weekly Indicators: Student Enrollment, Attendance, Facilitator Attendance & Punctuality.
    - [ ] Termly Indicators: School Management, School Grounds, Community Involvement.
    - [ ] Other Modules: WASH, Right to Play, TVET, Pregnancy & Re-entry Dashboards.