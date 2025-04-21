✅ PRD: Pregnancy & Re-entry Dashboard
Purpose:
Enable data collectors to submit school-specific pregnancy/re-entry data and allow admin users to view analytics and submissions per region/district/circuit/school.

🟩 SECTION A: Data Collector Interface
1.0 Authentication & Access
1.1 Create login form with validation

1.2 Verify user credentials against users table

1.3 Ensure user has “Data Collector” role

1.4 Fetch jurisdiction data (region, district, circuit) tied to user profile

1.5 Redirect authorized users to Data Collection Interface

1.6 Handle unauthorized access (role mismatch)

2.0 UI Setup – Data Collection Interface
2.1 Build page layout following provided UI reference

2.2 Add sidebar (or tabbed menu) with route to "Pregnancy & Re-entry Form"

2.3 Display assigned schools in dropdown list (based on logged-in user’s jurisdiction)

2.4 Add logout button and user profile name

3.0 Question Rendering from DB
3.1 Query pregnancy_questions table

3.2 Group questions by thematic area

3.3 Dynamically render input types:

3.3.1 Numeric (e.g., number of pregnant girls)

3.3.2 Textarea (open-ended support activities)

3.4 Handle form validations per field type

3.5 Auto-tag form responses with current academic term (from config or system)

4.0 Submitting Responses
4.1 Build Submit function

4.2 Validate all required fields

4.3 Auto-attach metadata to each record:

User ID

Region / District / Circuit / School

Timestamp

4.4 Save responses into pregnancy_responses or equivalent table

4.5 Show success toast and clear form

4.6 Prevent duplicate submissions for the same school per frequency (weekly/termly)

5.0 Viewing Submission History
5.1 Display tab/page for "My Submissions"

5.2 Query all records submitted by the user

5.3 List responses with:

School

Date

Thematic area summary

5.4 Add "View Details" button per entry

5.5 Show full Q&A breakdown in a modal or new view

