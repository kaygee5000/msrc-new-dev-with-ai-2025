# Right to Play (RTP) Component - MSRC Dashboard PRD

## 1. Project Overview

- [x] **Project Name**: Right to Play (RTP) Dashboard Component
- [x] **Client**: Ghana Education Service (GES)
- [x] **Purpose**: Enhance the existing mSRC education web dashboard with a data collection and analytics component for Right to Play indicators
- [x] **Component URLs**: 
  - Data Collection Interface: `/rtp`
  - Admin Dashboard: `/admin/rtp-dashboard`

## 2. Background

- [x] The mSRC Dashboard is an existing web-based education management system for GES
- [x] The system needs a new component to track and analyze Right to Play (RTP) implementation data
- [x] This component will collect both Output and Outcome Indicators from schools and districts
- [x] Data will be collected via structured forms and surveys, then analyzed through visualization dashboards

## 3. User Roles & Access

- [x] **System Administrator**: Full access to all features
- [ ] **District-level Data Collectors**: Access to input forms for their assigned schools
- [ ] **School-level Users**: Limited to viewing their own school's data
- [x] **RTP Program Managers**: Access to analytics dashboards and reports

## 4. Core Functional Requirements

### 4.1 Data Collection Interface (`/rtp`)

#### User Authentication & Management

- [ ] Authenticate users with existing mSRC credentials
- [ ] Display only schools and districts the user has access to
- [ ] Store user role information (district data collector, admin)

#### Itinerary Management

- [ ] Create itineraries (reporting periods) for data collection
- [ ] Set start and end dates for each itinerary
- [ ] Assign specific indicators to itineraries
- [ ] Allow district users to see all open itineraries for their assigned schools

#### Output Indicator Collection (School-level)

- [ ] Implement form for 18 output indicators as listed in documentation
- [ ] Save responses with school, district, itinerary, and submission date metadata
- [ ] Allow editing of submissions within the itinerary period
- [ ] Display previous submissions for reference

#### Output Indicator Collection (District-level)

- [ ] Implement form for 13 district-level output indicators
- [ ] Save responses with district, itinerary, and submission date metadata
- [ ] Allow editing of submissions within the itinerary period
- [ ] Display previous submissions for reference

#### Outcome Indicator Collection

- [ ] Implement "Consolidated Checklist" survey with 30 questions
- [ ] Implement "Partners in Play" survey with 64 questions
- [ ] Include all question types: multiple choice, dropdowns, text inputs, file uploads
- [ ] Save survey responses with appropriate metadata
- [ ] Allow file uploads for implementation plans (Q18 in Consolidated Checklist)

#### Data Submission & History

- [ ] Provide clear submission confirmation
- [ ] Allow users to view their submission history
- [ ] Group submissions by school, itinerary, and date
- [ ] Enable filtering and searching of previous submissions

### 4.2 Admin Dashboard & Analytics Interface (`/admin/rtp-dashboard`)

#### Dashboard Overview

- [x] Display summary statistics for all active itineraries
- [x] Show response rates by district and school type (GALOP/Non-GALOP)
- [x] Visualize school participation over time
- [x] Present key indicator metrics with trend analysis

#### Itinerary Management

- [x] Create, edit, and delete itineraries
- [x] Set itinerary timeframes and included indicators
- [x] Monitor submission progress by district and school
- [x] Close itineraries after deadline

#### Schools & Districts Management

- [ ] View all participating schools and districts
- [ ] Filter schools by GALOP/Non-GALOP status
- [ ] Track submission history by school and district
- [ ] Generate school participation reports

#### Output Indicators Analytics

- [x] Calculate and display totals for each of the 18 school-level output indicators
- [x] Calculate and display totals for each of the 13 district-level output indicators 
- [ ] Disaggregate data by gender where applicable
- [x] Compare indicators across itineraries to show trends
- [ ] Filter data by school, district, and region

#### Outcome Indicators Analytics

- [ ] Calculate the 9 outcome indicators using the specified formulas:
  1. Total primary school enrollment
  2. Primary school dropout rate
  3. Percentage of schools with implementation plans
  4. Percentage of schools with development plans including LtP
  5. Number of schools reached
  6. Percentage of district officials scoring satisfactorily on PBL tests
  7. Percentage of teachers with lessons plans that include LtP
  8. Percentage of learning environments showing LtP methods
  9. Percentage of teachers with LtP facilitation skills
- [ ] Display weighted scoring calculations for complex indicators
- [ ] Compare indicators across timeframes

#### Data Visualization Features

- [x] Implement interactive charts and graphs for all key metrics
- [ ] Allow toggling between GALOP and non-GALOP schools
- [ ] Enable drilling down from district to school level
- [x] Provide comparative analysis between itineraries

#### Export & Reporting

- [ ] Export all data to Excel/CSV format
- [ ] Generate PDF reports for key indicators
- [ ] Schedule automated report generation
- [ ] Include metadata in exports (submission dates, users)

## 5. Detailed Feature Requirements

### 5.1 Itinerary Management

- [ ] Itinerary creation form with:
  - Title field
  - Start/end date selectors
  - School selection (multiple)
  - District selection (multiple)
  - Indicator selection (checkbox list)
- [ ] Itinerary listing page with:
  - Status indicator (upcoming, active, closed)
  - Response rate statistics
  - Quick links to analytics

### 5.2 Output Indicators Form - School Level

- [ ] Implement form with 18 questions from documentation:
  1. Number of MALE Teacher Champions/Curriculum Leads trained on LtP by DTST
  2. Number of FEMALE Teacher Champions/Curriculum Leads trained on LtP by DTST
  3. Number of Trainings provided/organized this term through INSET
  4. Number of MALE teachers trained in PBL and Safe School Environment
  5. Number of FEMALE teachers trained in PBL and Safe School Environment
  6. Number of MALE teachers trained in Early Childhood Education (ECE)
  7. Number of FEMALE teachers trained in Early Childhood Education (ECE)
  8. Number of MALE teachers trained in any other form of training
  9. Number of FEMALE teachers trained in any other form of training
  10. Number of MALE teachers who received no training
  11. Number of FEMALE teachers who received no training
  12. Number of BOYS enrolled
  13. Number of GIRLS enrolled
  14. Number of BOYS with Special Needs/disabilities
  15. Number of GIRLS with Special Needs/disabilities
  16. Number of coaching and mentoring support visits this term
  17. Number of MALE teachers who went on transfer
  18. Number of FEMALE teachers who went on transfer
- [ ] Use appropriate input types (number fields)
- [ ] Implement validation rules (non-negative values)
- [ ] Save partial progress during form completion

### 5.3 Output Indicators Form - District Level

- [ ] Implement form with 13 questions from documentation:
  1. Number of District teacher support teams supported to develop training plans
  2. Number of trainings provided to District teacher support teams
  3. Number of district support teams' members trained with RTP staff support
  4. Number of Districts with coaching and mentoring plans
  5. Number of District Teacher Support Teams (DST) trained
  6. Number of DTST members trained (disaggregated by gender and training type)
  7. Number of districts with financial support for coaching activities
  8. Number of Quarterly district planning and review meetings
  9. Number of district officials attending planning meetings (by gender)
  10. Number of schools visited in each quarter
  11. Number of Trainers from District Support Teams trained on LtP integration
  12. Number of national level GES meetings
  13. Number of people attending national meetings (by category)
- [ ] Use appropriate input types (number fields)
- [ ] Implement validation rules (non-negative values)
- [ ] Save partial progress during form completion

### 5.4 Outcome Indicators - Consolidated Checklist

- [ ] Implement all 30 questions from the Consolidated Checklist survey
- [ ] Include appropriate input types:
  - Radio buttons for single-selection questions
  - Checkboxes for multiple-selection questions
  - Dropdown menus for location selections
  - Number inputs for count data
  - File upload for implementation plans (Q18)
- [ ] Store responses with metadata (school, date, assessor)
- [ ] Calculate relevant outcome indicators based on responses

### 5.5 Outcome Indicators - Partners in Play

- [ ] Implement all 64 questions from the Partners in Play survey
- [ ] Include appropriate input types as specified in documentation
- [ ] Record metadata (school, teacher, class, subject)
- [ ] Support scoring calculations for complex indicators

### 5.6 Dashboard Visualizations

- [ ] Create visualization for itinerary response rates:
  - Number of schools responded
  - Breakdown by GALOP/Non-GALOP schools
  - Clickable segments to show school lists
- [ ] Display aggregated output indicator totals:
  - All 18 school-level indicators (gender disaggregated)
  - All 13 district-level indicators
  - Filterable by school type
- [ ] Implement interactive charts for outcome indicators:
  - Implementation plan percentages
  - Teacher skills assessment results
  - Learning environment quality metrics
- [ ] Enable comparative analysis between itineraries
- [ ] Support drilling down into specific schools or districts

### 5.7 Analytics & Calculations

- [ ] Implement all specified indicator calculation formulas:
  - Simple summations for output indicators
  - Percentage calculations for outcome indicators
  - Weighted averages for complex indicators (e.g., teacher skills assessment)
- [ ] Percentages of schools with implementation plans:
  ```
  (Number of schools with implementation plans / Total number of schools reached) × 100
  ```
- [ ] Percentage of schools with LtP development plans:
  ```
  (Number of schools with uploaded plans / Total number of schools reached) × 100
  ```
- [ ] Percentage of teachers with LtP lesson plans:
  ```
  (Number of teachers' lesson plans with LtP / Total number of teachers' lesson plans assessed) × 100
  ```
- [ ] Percentage of learning environments with LtP methods:
  - Calculate using questions 43, 44, 45 with weighted scoring
  - Compare individual scores to overall average
- [ ] Percentage of teachers with LtP skills:
  - Calculate using questions 29, 30, 31, 32, 33, 39, 45, 46, 48, 49
  - Apply weighted scores and identify teachers above average

## 6. Technical Requirements

### 6.1 Integration Points

- [ ] Integrate with existing mSRC user authentication system
- [ ] Access existing school and district database
- [ ] Connect to existing data export mechanisms
- [ ] Use consistent UI/UX patterns from main dashboard

### 6.2 Data Storage

- [ ] Design database schema for:
  - Itineraries
  - Output indicators (school and district)
  - Outcome indicators (surveys)
  - Calculated metrics
  - User submissions
- [ ] Implement proper relationships between entities
- [ ] Design for efficient querying and reporting

### 6.3 Security Requirements

- [ ] Enforce role-based access control
- [ ] Secure API endpoints with proper authentication
- [ ] Validate all form inputs server-side
- [ ] Implement audit logging for all data changes
- [ ] Secure file uploads with proper validation

### 6.4 Performance Requirements

- [ ] Dashboard should load within 3 seconds
- [ ] Support concurrent users (at least 100 simultaneous users)
- [ ] Optimize database queries for large datasets
- [ ] Implement pagination for large data listings
- [ ] Cache calculated metrics where appropriate

## 7. User Interface Requirements

### 7.1 Data Collection Interface

- [ ] Clean, simple form design with clear instructions
- [ ] Group related questions logically
- [ ] Provide progress indicators for multi-page forms
- [ ] Implement responsive design for mobile compatibility
- [ ] Include help text for complex questions
- [ ] Provide immediate validation feedback

### 7.2 Admin Dashboard Interface

- [ ] Implement clear navigation between different views
- [ ] Design consistent data visualization components
- [ ] Include filters and controls for data exploration
- [ ] Design responsive layouts for different screen sizes
- [ ] Use consistent color coding for data categories
- [ ] Provide clear legends and context for metrics

## 8. Testing Requirements

- [ ] Unit tests for calculation formulas
- [ ] Integration tests for data submission flows
- [ ] User acceptance testing with actual stakeholders
- [ ] Performance testing for dashboard responsiveness
- [ ] Security testing for data access controls
- [ ] Cross-browser compatibility testing

## 9. Deployment & Maintenance

- [ ] Document deployment process
- [ ] Create database migration scripts
- [ ] Plan phased rollout strategy
- [ ] Define backup and recovery procedures
- [ ] Establish monitoring and alerting
- [ ] Create user documentation and training materials

## 10. Appendix: Technical Specifications

### 10.1 Outcome Indicator Calculation Details

#### Percentage of Schools with Implementation Plans
- Source: Consolidated Checklist Q17
- Formula: `(Number of YES responses / Total responses) × 100`

#### Percentage of Schools with LtP Development Plans
- Source: Consolidated Checklist Q18 (with file upload)
- Formula: `(Number of uploads / Total responses) × 100`

#### Percentage of Teachers with LtP Lesson Plans
- Source: Consolidated Checklist Q19
- Formula: `(Number of YES responses / Total responses) × 100`

#### Percentage of Learning Environments with LtP Methods
- Sources: Partners in Play Q43, Q44, Q45
- Scoring:
  - Q43 (friendly tone): Frequently=5, Sometimes=4, Only boys/girls=3, Not at all=0
  - Q44 (acknowledging effort): Frequently=5, Sometimes=4, Only boys/girls=3, Not at all=0
  - Q45 (pupil participation): Rated 1-5 as specified
- Formula: Calculate average score, compare to overall average

#### Percentage of Teachers with LtP Skills
- Sources: Partners in Play Q29, Q30, Q31, Q32, Q33, Q39, Q45, Q46, Q48, Q49
- Scoring: As specified in documentation for each question
- Formula: Calculate average score, compare to overall average

### 10.2 Required API Endpoints

#### Itinerary Management
- `GET /api/itineraries`
- `POST /api/itineraries`
- `GET /api/itineraries/:id`
- `PUT /api/itineraries/:id`
- `DELETE /api/itineraries/:id`

#### Output Indicators
- `GET /api/output/school`
- `POST /api/output/school`
- `GET /api/output/district`
- `POST /api/output/district`

#### Outcome Indicators
- `GET /api/outcome/consolidated-checklist`
- `POST /api/outcome/consolidated-checklist`
- `GET /api/outcome/partners-in-play`
- `POST /api/outcome/partners-in-play`

#### Analytics
- `GET /api/analytics/output-summary`
- `GET /api/analytics/outcome-indicators`
- `GET /api/analytics/school-participation`
- `GET /api/analytics/district-performance`

#### Export
- `GET /api/export/output`
- `GET /api/export/outcome`
- `GET /api/export/analytics`

## 11. Implementation Status Addendum (April 2025)

### 11.1 Completed Admin Functionality

1. **Admin Dashboard**
   - ✅ Main dashboard with active itinerary display
   - ✅ Summary statistics showing submissions, active schools, response/completion rates
   - ✅ Visualization of participation by category and submission trends
   - ✅ Recent itineraries list with management links

2. **Itinerary Management**
   - ✅ Interface for viewing active and past itineraries
   - ✅ Itinerary details page with metadata
   - ✅ Itinerary creation and editing capabilities
   - ✅ Status monitoring (active/inactive)

3. **Questions Management**
   - ✅ Question creation and editing interface
   - ✅ Support for multiple question types (single choice, multiple choice, text, numeric)
   - ✅ Category assignment (School Output, District Output, Consolidated Checklist, Partners in Play)
   - ✅ Answer options management
   - ✅ Question filtering by category and type

4. **Basic Analytics**
   - ✅ Category completion tracking
   - ✅ Response rate visualization
   - ✅ Basic submission trends 

### 11.2 Pending Admin Functionality
- [x] Schools & Districts Management interface
- [x] Gender-disaggregated data visualization
- [x] Export & Reporting (Excel/CSV functionality) 
- [x] File upload capability for implementation plans
- ⏳ Complex outcome indicator calculations
- ⏳ District-to-school drill-down capabilities
- ⏳ Weighted scoring calculations
- ⏳ Advanced PDF report generation & Automated reporting

### 11.3 Implementation Priority Order
1. Complete Schools & Districts Management interface (✔️)
2. Implement gender-disaggregated data visualization (✔️)
3. Add Excel/CSV export functionality (✔️)
4. Develop file upload capability for implementation plans (✔️)
5. Build advanced outcome indicator calculations (🔄 In Progress)
6. Create PDF report generation
7. Implement automated reporting features

## 12. Detailed Implementation Plan

Based on the database schema and existing functionality, here's the detailed implementation plan to complete the RTP component:

### 12.1 Schools & Districts Management Interface

1. **Schools Management API**
   - Implement endpoint to retrieve schools with RTP status
   ```javascript
   // GET /api/rtp/schools
   // Query parameters: region_id, district_id, galop_status, response_status
   ```
   - Implement endpoint to retrieve detailed school participation history
   ```javascript
   // GET /api/rtp/schools/:id/history
   // Returns all survey responses by itinerary for a specific school
   ```

2. **Districts Management API**
   - Implement endpoint to retrieve districts with submission statistics
   ```javascript
   // GET /api/rtp/districts
   // Query parameters: region_id, response_status, itinerary_id
   ```
   - Implement endpoint to retrieve detailed district submission history
   ```javascript
   // GET /api/rtp/districts/:id/history
   // Returns all responses by itinerary for a specific district
   ```

3. **School/District UI Components**
   - Create school list component with:
     - GALOP/Non-GALOP filters
     - Response status filters
     - Sortable columns for name, region, district, # of submissions
     - Pagination (20 schools per page)
   - Create district list component with:
     - Region filters
     - Response status filters
     - Sortable columns for name, region, # of submissions
     - Pagination (20 districts per page)
   - Create school detail view component:
     - Basic information section
     - Response history by itinerary
     - Output indicators statistics
     - Latest consolidated checklist results
     - Latest partners in play results

### 12.2 Gender-Disaggregated Data Visualization

1. **Data Processing Logic**
   - Implement query aggregations for gender breakdown in output indicators
   ```sql
   -- Example query to group by gender-related questions
   SELECT question_id, SUM(CAST(answer_value AS UNSIGNED)) as total
   FROM right_to_play_school_response_answers
   WHERE question_id IN (1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 17, 18)
   GROUP BY question_id
   ```
   - Create data transformation functions that pair male/female questions:
     - Teacher Champions (questions 1-2)
     - Teachers trained in PBL (questions 4-5)
     - Teachers trained in ECE (questions 6-7)
     - Teachers with other training (questions 8-9)
     - Teachers with no training (questions 10-11)
     - Teachers who transferred (questions 17-18)

2. **Visualization Components**
   - Implement stacked bar charts for gender comparisons
   - Implement pie charts showing gender distribution
   - Add legend that explains the gender breakdown
   - Include toggle for absolute numbers vs. percentages

3. **Dashboard Integration**
   - Update dashboard to include gender tab in analytics
   - Allow filtering gender data by region, district, and school
   - Display trend analysis for gender metrics across itineraries

### 12.3 Export Functionality

1. **Data Export API**
   - Implement endpoint for exporting school output data
   ```javascript
   // GET /api/export/rtp/school-output
   // Query parameters: itinerary_id, region_id, district_id, format (csv/excel)
   ```
   - Implement endpoint for exporting district output data
   ```javascript
   // GET /api/export/rtp/district-output
   // Query parameters: itinerary_id, region_id, format (csv/excel)
   ```
   - Implement endpoints for exporting outcome indicators
   ```javascript
   // GET /api/export/rtp/consolidated-checklist
   // GET /api/export/rtp/partners-in-play
   // Query parameters similar to above
   ```

2. **Export UI Components**
   - Create export dialog with:
     - Data type selection (school output, district output, consolidated checklist, partners in play)
     - Format selection (CSV, Excel)
     - Filters for region, district, itinerary
     - Optional columns selector
   - Implement progress indicator for large exports
   - Add download history section to track past exports

3. **Export File Generation**
   - Build server-side Excel generation using a library like ExcelJS
   - Implement CSV generation with proper escaping and formatting
   - Include metadata in exports (generation date, filters applied, user)
   - Structure exports with summary sheets and detailed data sheets

### 12.4 File Upload Capability

1. **File Upload API**
   - Implement endpoint for uploading implementation plans
   ```javascript
   // POST /api/rtp/files/upload
   // Headers: multipart/form-data
   // Body: file, question_id, response_id
   ```
   - Implement endpoint for retrieving uploaded files
   ```javascript
   // GET /api/rtp/files/:id
   // Returns file download with appropriate content type
   ```

2. **File Upload UI Components**
   - Create file upload component for implementation plans (Q18)
   - Build file preview component for PDF/image files
   - Implement file validation (type, size, virus scanning)
   - Add progress indicator for uploads

3. **File Storage Implementation**
   - Configure secure file storage location
   - Implement file naming convention (UUID-based)
   - Set up file type restrictions (PDF, DOC, DOCX, XLS, XLSX only)
   - Implement file cleanup for deleted responses

### 12.5 Advanced Outcome Indicator Calculations

1. **Calculation Logic Implementation**
   - Implement percentage calculations for implementation plans:
   ```javascript
   // Example calculation
   const implPlanPercentage = (schoolsWithPlans / totalSchools) * 100;
   ```
   - Implement weighted scoring for learning environments:
   ```javascript
   // Example weighted scoring
   const learningEnvScore = (
     (q43Score * 0.3) + 
     (q44Score * 0.3) + 
     (q45Score * 0.4)
   );
   ```
   - Implement teacher skills assessment scoring:
   ```javascript
   // Example teacher skills scoring
   const teacherSkillsScore = (
     (q29Score * 0.1) + (q30Score * 0.1) + (q31Score * 0.1) +
     (q32Score * 0.1) + (q33Score * 0.1) + (q39Score * 0.1) +
     (q45Score * 0.1) + (q46Score * 0.1) + (q48Score * 0.1) +
     (q49Score * 0.1)
   );
   ```

2. **API Endpoints for Calculated Metrics**
   - Implement endpoint for consolidated outcome indicators
   ```javascript
   // GET /api/analytics/rtp/outcome-indicators
   // Returns all 9 outcome indicators with calculations
   ```
   - Implement endpoint for detailed scoring breakdown
   ```javascript
   // GET /api/analytics/rtp/detailed-scores
   // Returns raw scores and calculations for verification
   ```

3. **Visualization Components**
   - Create gauge charts for percentage-based indicators
   - Implement radar charts for teacher skills assessment
   - Build stacked bar charts for learning environment quality
   - Create trend charts comparing indicators across itineraries

### 12.6 PDF Report Generation

1. **Report Template Design**
   - Create report templates for:
     - School Output Summary
     - District Output Summary 
     - Consolidated Checklist Summary
     - Partners in Play Assessment
   - Design template layouts with:
     - Header with logo, title, date
     - Summary section with key metrics
     - Detailed data tables
     - Visualizations
     - Footer with page numbers and metadata

2. **PDF Generation Implementation**
   - Implement server-side PDF generation using a library like PDFKit
   - Create components for rendering charts in PDFs
   - Build data transformation for PDF-friendly format
   - Implement PDF styling consistent with web dashboard

3. **Report Generation API**
   - Implement endpoint for generating reports
   ```javascript
   // POST /api/reports/rtp/generate
   // Body: report_type, filters, customizations
   ```
   - Implement endpoint for retrieving generated reports
   ```javascript
   // GET /api/reports/rtp/:id
   // Returns PDF file download
   ```

### 12.7 Database Optimizations

1. **Index Additions**
   - Add indexes for frequently queried fields:
   ```sql
   -- Add index to improve query performance
   ALTER TABLE right_to_play_school_response_answers
   ADD INDEX idx_school_answers_question (question_id, answer_value(20));
   
   ALTER TABLE right_to_play_consolidated_checklist_answers
   ADD INDEX idx_cc_answers_question (question_id, answer_value(20));
   ```

2. **Query Optimizations**
   - Implement data caching for calculated metrics
   - Create materialized views or summary tables for frequently accessed data
   - Optimize JOIN operations in complex analytics queries

3. **Performance Monitoring**
   - Implement query performance logging
   - Set up alerts for slow-running queries
   - Create maintenance schedule for database optimization
