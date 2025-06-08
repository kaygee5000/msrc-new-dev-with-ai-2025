# MSRC (Mobile School Report Card) Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Core Modules](#core-modules)
6. [Database Structure](#database-structure)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Structure](#api-structure)
9. [Frontend Components](#frontend-components)
10. [Key Workflows](#key-workflows)
11. [Data Models](#data-models)
12. [Integration Points](#integration-points)
13. [Deployment & Configuration](#deployment--configuration)
14. [Development Guidelines](#development-guidelines)
15. [Performance Optimization](#performance-optimization)
16. [Troubleshooting](#troubleshooting)

## Introduction

The Mobile School Report Card (MSRC) is a comprehensive data collection and analytics platform supporting education decision-making for the Ghana Education Service. It provides tools for monitoring and analyzing education data across different administrative levels, from individual schools up to the national level.

## Project Overview

MSRC is designed to facilitate data collection, management, and analysis for educational institutions. The system allows various stakeholders (administrators, teachers, facilitators) to input and access data related to schools, students, textbooks, performance metrics, and more. The platform supports hierarchical data views at different administrative levels:

- School level
- Circuit level
- District level
- Regional level
- National level

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.0
- **UI Libraries**: 
  - React 19.0.0
  - Material UI 7.0.2
  - Tailwind CSS 4.1.3
- **State Management**: React Context API
- **Charts & Visualization**: ApexCharts 3.44.0
- **Data Processing**: ExcelJS, PapaParser (CSV handling)

### Backend
- **Framework**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: NextAuth.js 4.24.11
- **Storage**: AWS S3 (for file uploads)
- **Caching**: Redis 4.7.0
- **Email**: Nodemailer 6.10.1

### Development Tools
- **Testing**: Jest 29.7.0, React Testing Library 16.3.0
- **Linting**: ESLint 9
- **Database Migrations**: db-migrate 0.11.14

## Architecture

MSRC follows a modern web application architecture built on Next.js, utilizing its App Router for both frontend and backend functionality.

### Directory Structure
```
msrc-app/
├── public/            # Static assets
├── src/
│   ├── app/           # Next.js App Router pages and API routes
│   │   ├── api/       # Backend API endpoints
│   │   ├── dashboard/ # Dashboard pages
│   │   └── ...        # Other page routes
│   ├── components/    # Reusable React components
│   │   ├── SRC_Main/  # Core SRC components
│   │   ├── SRC_Management/ # Management components
│   │   └── ...        # Other component categories
│   ├── config/        # Configuration files
│   ├── context/       # React Context providers
│   ├── services/      # Service modules
│   └── utils/         # Utility functions
├── migrations/        # Database migration scripts
└── scripts/          # Utility scripts
```

## Core Modules

MSRC is organized into several core modules, each handling specific functionality:

### 1. SRC_Main
Handles core school reporting functionality including:
- Facilitators management
- Student attendance tracking
- Student enrollment data

### 2. SRC_Management
Manages school resources and performance:
- Textbooks inventory and distribution
- Pupil performance metrics
- Record books
- Support grants

### 3. SRC_Grounds
Manages physical infrastructure and facilities:
- School buildings
- Sanitation facilities
- Accessibility features

### 4. SRC_CommunityInvolvement
Tracks community engagement:
- PTA meetings
- Community outreach programs
- Volunteer activities

### 5. Dashboard
Administrative dashboards for different user roles and levels:
- Admin dashboard
- Regional dashboard
- District dashboard
- Circuit dashboard
- School dashboard

## Database Structure

MSRC uses MySQL as its primary database. The database schema includes tables for:

- Users and authentication
- Educational hierarchy (regions, districts, circuits, schools)
- School reports and metrics
- Resource management (textbooks, grants)
- Student data (attendance, enrollment, performance)
- Facilitator information

Key relationships:
- Schools belong to circuits
- Circuits belong to districts
- Districts belong to regions
- Users have program roles that determine access levels
- Reports are associated with specific schools and time periods (terms/years)

## Authentication & Authorization

### Authentication Methods
- Email/password login
- Magic link email authentication
- OTP-based login (SMS)

### User Roles and Permissions
The system implements role-based access control through program roles:
- System administrators (full access)
- Regional officers (access to region data)
- District officers (access to district data)
- Circuit supervisors (access to circuit data)
- School administrators (access to school data)
- Teachers/Facilitators (limited access to specific school data)

## API Structure

The API follows RESTful principles and is organized by resource type:

### Main API Categories
- `/api/auth`: Authentication endpoints
- `/api/users`: User management
- `/api/regions`, `/api/districts`, `/api/circuits`, `/api/schools`: Administrative hierarchy
- `/api/school-report`: School reporting data
  - `/main`: Core school data
  - `/management`: Resource management
  - `/grounds`: Infrastructure data
  - `/community-involvement`: Community engagement
- `/api/statistics`: Aggregated statistics and analytics
- `/api/upload`: File upload handling
- `/api/dashboard`: Dashboard data

## Frontend Components

### UI Framework
The application uses Material UI with custom theming, enhanced by Tailwind CSS for additional styling flexibility.

### Key Component Categories
- **Data Display Components**: Tables, charts, and data visualization
- **Form Components**: Input forms for data collection
- **Navigation Components**: Menus, breadcrumbs, and navigation controls
- **Dashboard Components**: Summary cards, statistics displays
- **Administrative View Components**: Hierarchical views (Region, District, Circuit, School)

### State Management
- React Context API for global state
- Local component state for UI-specific state

## Deployment & Configuration

### Environment Variables
The application requires various environment variables for configuration:
- Database connection details
- Authentication secrets
- AWS S3 credentials
- Email service configuration
- Redis connection details

### Optimization Features
- Bundle analysis and optimization
- Memory optimizations for build process
- CSS optimization
- Server-side React optimization

## Development Guidelines

### Code Organization
- Follow the established directory structure
- Keep components modular and reusable
- Use appropriate naming conventions

### State Management
- Use React Context for global state
- Keep component state local when possible
- Implement proper data fetching patterns

### API Development
- Follow RESTful principles
- Implement proper error handling
- Document all endpoints

### Performance Considerations
- Optimize database queries
- Implement appropriate caching strategies
- Minimize client-side JavaScript
- Use server-side rendering where appropriate

### Testing
- Write unit tests for critical functionality
- Test components using React Testing Library
- Ensure proper error handling and edge cases

### Security Best Practices
- Implement proper authentication and authorization
- Sanitize all user inputs
- Follow secure coding practices
- Keep dependencies updated

## Key Workflows

### Data Collection Workflow
1. **User Authentication**: Users log in with their credentials
2. **School Selection**: Users select the school they want to report on
3. **Period Selection**: Users select the academic year, term, and week (if applicable)
4. **Data Entry**: Users fill out forms for various reporting categories
   - Facilitators information
   - Student attendance
   - Student enrollment
   - Textbooks inventory
   - Infrastructure status
   - Community involvement
5. **Validation**: System validates the data for completeness and accuracy
6. **Submission**: Data is submitted to the server and stored in the database
7. **Confirmation**: Users receive confirmation of successful submission

### Report Generation Workflow
1. **User Authentication**: Administrative users log in
2. **Level Selection**: Users select the administrative level (school, circuit, district, region)
3. **Entity Selection**: Users select the specific entity (e.g., specific school or district)
4. **Period Selection**: Users select the academic year and term
5. **Report Type Selection**: Users select the type of report they want to view
6. **Data Aggregation**: System aggregates data from the database
7. **Report Display**: System displays the report with visualizations
8. **Export Options**: Users can export reports to Excel or PDF formats

### User Management Workflow
1. **Admin Authentication**: Admin users log in
2. **User Management**: Admins access the user management interface
3. **User Creation**: Admins create new users with appropriate roles
4. **Role Assignment**: Admins assign program roles to users
5. **Access Control**: System enforces access controls based on roles
6. **User Notification**: New users receive email notifications

## Data Models

### Educational Hierarchy

```
Region
  |
  +-- Districts
       |
       +-- Circuits
            |
            +-- Schools
```

### User Model
- **id**: Unique identifier
- **email**: User's email address
- **phone_number**: User's phone number
- **password**: Hashed password
- **first_name**: User's first name
- **last_name**: User's last name
- **status**: Active/Inactive status
- **created_at**: Creation timestamp
- **updated_at**: Last update timestamp

### Program Roles Model
- **id**: Unique identifier
- **user_id**: Reference to user
- **program_id**: Reference to program
- **role**: Role within the program
- **region_id**: Optional region scope
- **district_id**: Optional district scope
- **circuit_id**: Optional circuit scope
- **school_id**: Optional school scope

### School Report Model
- **id**: Unique identifier
- **school_id**: Reference to school
- **year**: Academic year
- **term**: Academic term
- **week**: Optional week number
- **status**: Report status
- **submitted_by**: User who submitted the report
- **submitted_at**: Submission timestamp

### Facilitator Model
- **id**: Unique identifier
- **first_name**: Facilitator's first name
- **last_name**: Facilitator's last name
- **gender**: Facilitator's gender
- **phone_number**: Contact number
- **email**: Email address
- **staff_number**: Official staff ID
- **rank**: Professional rank
- **qualification**: Academic qualifications
- **is_headteacher**: Boolean flag for headteacher status

### Textbook Model
- **id**: Unique identifier
- **school_id**: Reference to school
- **subject**: Subject name
- **grade_level**: Grade level
- **quantity_available**: Number of books available
- **quantity_needed**: Number of books needed
- **condition**: Overall condition assessment
- **year**: Academic year
- **term**: Academic term

## Integration Points

### External Systems Integration

#### Email Service
- **Provider**: SMTP email service
- **Integration Type**: Direct integration via Nodemailer
- **Purpose**: Send authentication emails, notifications, and reports
- **Configuration**: Configured via environment variables

#### SMS Service
- **Provider**: Nsano SMS Gateway
- **Integration Type**: REST API
- **Purpose**: Send OTP codes and notifications
- **Configuration**: API endpoint and key in environment variables

#### File Storage
- **Provider**: AWS S3
- **Integration Type**: AWS SDK
- **Purpose**: Store uploaded files (images, documents)
- **Configuration**: AWS credentials in environment variables

### Internal System Integration

#### Redis Cache
- **Purpose**: Cache frequently accessed data and session information
- **Integration Type**: Redis client library
- **Configuration**: Redis URL in environment variables

#### MySQL Database
- **Purpose**: Primary data storage
- **Integration Type**: MySQL client library
- **Configuration**: Database connection details in environment variables

## Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Implemented via Next.js for optimized loading
- **Image Optimization**: Using Next.js Image component with proper sizing
- **Bundle Size Reduction**: Webpack optimizations in Next.js config
- **Caching Strategy**: Browser caching for static assets

### Backend Optimizations
- **Database Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: Optimized SQL queries with proper joins
- **Connection Pooling**: MySQL connection pool for efficient connections
- **Caching Layer**: Redis caching for frequently accessed data

### API Optimizations
- **Response Compression**: Automatic compression via Next.js
- **Pagination**: Implemented for large data sets
- **Selective Data Loading**: Only load necessary fields
- **Batch Processing**: Batch operations for bulk data handling

## Troubleshooting

### Common Issues

#### Authentication Issues
- **Symptom**: Unable to log in
- **Possible Causes**: Invalid credentials, expired session, database connection issues
- **Resolution Steps**: Verify credentials, check database connection, clear browser cache

#### Data Loading Issues
- **Symptom**: Data not loading or displaying properly
- **Possible Causes**: API errors, network issues, permission problems
- **Resolution Steps**: Check network tab for API errors, verify permissions, check server logs

#### Performance Issues
- **Symptom**: Slow page loading or response times
- **Possible Causes**: Unoptimized queries, missing indexes, large data sets
- **Resolution Steps**: Profile database queries, check for missing indexes, implement pagination

### Logging and Monitoring
- **Application Logs**: Using Pino logger for structured logging
- **Error Tracking**: Console errors logged to server
- **Performance Monitoring**: Basic metrics tracking via custom middleware

---

This documentation provides a comprehensive overview of the MSRC system. For specific implementation details, refer to the codebase and inline documentation.
