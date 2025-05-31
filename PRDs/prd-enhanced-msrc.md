# Ghana Education Service - School Monitoring System PRD

## Document Information
- **Document Title:** Product Requirements Document for GES School Monitoring System
- **Version:** 1.0
- **Last Updated:** May 5, 2025
- **Status:** Draft

## 1. Introduction

### 1.1 Purpose
This Product Requirements Document (PRD) provides comprehensive specifications for rebuilding the Ghana Education Service School Monitoring System from its existing VueJS implementation to a NextJS/React implementation. This document will guide the AI agent in building the application with minimal errors and ambiguities.

### 1.2 Project Overview
The GES School Monitoring System is a comprehensive web and mobile platform for tracking various educational indicators across schools in Ghana, including:
- Student attendance and enrollment
- Facilitator/teacher attendance
- Sanitation metrics
- Security conditions
- Textbook availability
- Units Covered
- Lesson Plans
- Pupil Performance
- Sports and Recreation
- School meetings
- Community involvement

Additional modules include:
- WASH (Water, Sanitation and Hygiene)
- Reentry and pregnancy tracking
- Right to Play program

### 1.3 Scope
This PRD covers the complete rebuild of the application with NextJS/React, maintaining all existing functionality while ensuring direct database connections to the existing MySQL database. New features will be developed in a modular and reusable way, with particular attention to error handling, testing, and frontend-backend integration.

### 1.4 Technical Stack
- **Frontend:** NextJS with React (JavaScript only, no TypeScript)
- **CSS Framework:** Tailwind CSS and Material-UI (MUI)
- **Database:** Direct connection to existing MySQL database
- **Authentication:** NextAuth
- **State Management:** React Context API
- **Testing:** Jest, React Testing Library

## 2. System Architecture

### 2.1 High-Level Architecture
The application will follow a modern NextJS architecture with:
- Client-side components using React
- Server-side rendering where appropriate
- API routes to communicate with the database
- Authentication using NextAuth
- Role-based access control
- Mobile-responsive design

### 2.2 Database Interaction Strategy
- The application will connect directly to the existing MySQL database
- No modifications to existing table structures
- New features will create new tables as needed
- All database operations will be tracked for production migration
- A central database connector will handle all database interactions

### 2.3 Folder Structure
```
/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API endpoints
│   │   ├── dashboard/      # Dashboard views
│   │   ├── login/          # Authentication
│   │   └── ...             # Other route groups
│   ├── components/         # Reusable UI components
│   ├── context/            # React context providers
│   ├── lib/                # Utility functions and connectors
│   │   ├── db.js           # Database connector
│   │   └── auth.js         # Authentication helpers
│   ├── utils/              # Helper functions
│   └── styles/             # Global styles
├── migrations/             # SQL migration files
├── new_tables_log.md       # Documentation for new database tables
└── package.json
```

### 2.4 API Structure
API endpoints will be organized by feature and use NextJS API routes:
```
/src/app/api/
├── auth/                   # Authentication endpoints
├── schools/                # School management
├── attendance/             # Attendance tracking
├── enrollment/             # Enrollment data
├── wash/                   # WASH module
├── reentry/                # Reentry and pregnancy
├── rtp/                    # Right to Play program
└── ...                     # Other features
```

## 3. Database Design

### 3.1 Database Connection
The application will use the `mysql2` library to establish direct connections to the MySQL database. A pooled connection will be used for improved performance.

```javascript
// src/lib/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

module.exports = {
  query,
  pool
};
```

### 3.2 New Tables Documentation
All new tables will be documented in `new_tables_log.md` with:
- Table name
- Column definitions
- Indexes
- Foreign key relationships
- Purpose of the table

## 4. Authentication & Authorization

### 4.1 Authentication Implementation
The application will use NextAuth.js for authentication:

```javascript
// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';
import { compareSync } from 'bcrypt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = await query(
          'SELECT * FROM users WHERE email = ?',
          [credentials.email]
        );
        
        const user = users[0];
        
        if (!user || !compareSync(credentials.password, user.password)) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 4.2 Role-Based Access Control
The application will implement role-based access control with the following roles:
- Super Admin
- National Admin
- Regional Admin
- District Admin
- Circuit Admin
- School Admin
- Teacher/Facilitator

Access control will be implemented using middleware and context providers:

```javascript
// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading: status === 'loading',
      role: user?.role || null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 4.3 Route Protection
Routes will be protected using middleware:

```javascript
// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  // Public paths accessible without authentication
  const publicPaths = ['/login', '/api/auth'];
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname.startsWith(path));
  
  // Handle authentication
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Role-based access control for specific paths
  const adminPaths = ['/dashboard/admin'];
  const isAdminPath = adminPaths.some(path => req.nextUrl.pathname.startsWith(path));
  
  if (isAdminPath && token?.role !== 'admin' && token?.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 5. Core Features

### 5.1 Dashboard
The dashboard provides an overview of key metrics and access to all modules, customized based on user role.

#### 5.1.1 Dashboard Implementation

```javascript
// src/app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { fetchDashboardStats } from '@/lib/api';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import RoleScopedView from '@/components/RoleScopedView';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const data = await fetchDashboardStats(user.id, user.role);
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Typography color="error">{error}</Typography>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Typography variant="h4" className="mb-6">
        Dashboard
      </Typography>
      
      <RoleScopedView
        roles={['admin', 'super_admin', 'national_admin']}
        fallback={<Typography>Welcome to your GES Monitoring Dashboard</Typography>}
      >
        <Typography className="mb-4">
          National Overview
        </Typography>
      </RoleScopedView>
      
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} md={4}>
          <DashboardMetricCard
            title="Total Schools"
            value={stats?.schoolCount || 0}
            icon="School"
            trend={stats?.schoolTrend || 0}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardMetricCard
            title="Student Enrollment"
            value={stats?.studentCount || 0}
            icon="People"
            trend={stats?.studentTrend || 0}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardMetricCard
            title="Teacher Attendance"
            value={`${stats?.teacherAttendance || 0}%`}
            icon="AssignmentTurnedIn"
            trend={stats?.teacherAttendanceTrend || 0}
          />
        </Grid>
      </Grid>
      
      <Typography variant="h5" className="mb-4">
        Module Performance
      </Typography>
      
      <Grid container spacing={3}>
        {stats?.modulePerformance?.map((module) => (
          <Grid item xs={12} md={4} key={module.name}>
            <Card>
              <CardContent>
                <Typography variant="h6">{module.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {module.description}
                </Typography>
                <div className="mt-2">
                  <div className="bg-gray-200 h-2 rounded-full mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${module.completionRate}%` }}
                    />
                  </div>
                  <Typography variant="body2" className="mt-1">
                    {module.completionRate}% Complete
                  </Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}
```

### 5.3 Attendance Tracking Module

The attendance tracking module is a critical component of the monitoring system, allowing for the tracking and analysis of both teacher and student attendance across schools.

#### 5.3.1 Teacher Attendance Implementation

```javascript
// src/app/api/attendance/teacher/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const schoolId = url.searchParams.get('school_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }
    
    if (!startDate) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }
    
    // Build SQL query
    const sql = `
      SELECT 
        ta.id,
        ta.teacher_id,
        t.name as teacher_name,
        t.staff_id,
        ta.date,
        ta.is_present,
        ta.reason_for_absence,
        ta.submitted_by,
        ta.created_at
      FROM teacher_attendance ta
      JOIN teachers t ON ta.teacher_id = t.id
      WHERE ta.school_id = ?
        AND ta.date BETWEEN ? AND ?
      ORDER BY ta.date DESC, t.name ASC
    `;
    
    const attendanceRecords = await query(sql, [schoolId, startDate, endDate]);
    
    // Calculate summary statistics
    const summary = {
      totalDays: 0,
      totalTeachers: 0,
      presentCount: 0,
      absentCount: 0,
      attendanceRate: 0
    };
    
    // Count unique dates
    const uniqueDates = new Set();
    attendanceRecords.forEach(record => uniqueDates.add(record.date));
    summary.totalDays = uniqueDates.size;
    
    // Count unique teachers
    const uniqueTeachers = new Set();
    attendanceRecords.forEach(record => uniqueTeachers.add(record.teacher_id));
    summary.totalTeachers = uniqueTeachers.size;
    
    // Count present/absent
    summary.presentCount = attendanceRecords.filter(record => record.is_present).length;
    summary.absentCount = attendanceRecords.length - summary.presentCount;
    
    // Calculate attendance rate
    if (attendanceRecords.length > 0) {
      summary.attendanceRate = (summary.presentCount / attendanceRecords.length) * 100;
    }
    
    return NextResponse.json({
      records: attendanceRecords,
      summary
    });
  } catch (error) {
    console.error('Teacher attendance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher attendance data' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['school_id', 'date', 'teacher_records'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field.replace('_', ' ')} is required` },
          { status: 400 }
        );
      }
    }
    
    if (!Array.isArray(body.teacher_records) || body.teacher_records.length === 0) {
      return NextResponse.json(
        { error: 'At least one teacher record is required' },
        { status: 400 }
      );
    }
    
    // Start transaction
    const connection = await query('START TRANSACTION');
    
    try {
      // Delete existing records for this date and school (to avoid duplicates)
      await query(
        'DELETE FROM teacher_attendance WHERE school_id = ? AND date = ?',
        [body.school_id, body.date]
      );
      
      // Insert new records
      const insertValues = [];
      const insertParams = [];
      
      body.teacher_records.forEach(record => {
        insertValues.push('(?, ?, ?, ?, ?, ?, ?)');
        insertParams.push(
          body.school_id,
          record.teacher_id,
          body.date,
          record.is_present ? 1 : 0,
          record.reason_for_absence || null,
          session.user.id,
          new Date()
        );
      });
      
      const insertSql = `
        INSERT INTO teacher_attendance (
          school_id, teacher_id, date, is_present, reason_for_absence, submitted_by, created_at
        ) VALUES ${insertValues.join(', ')}
      `;
      
      const result = await query(insertSql, insertParams);
      
      // Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        message: 'Teacher attendance records saved successfully',
        recordsInserted: body.teacher_records.length
      }, { status: 201 });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Save teacher attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to save teacher attendance records' },
      { status: 500 }
    );
  }
}
```

#### 5.3.2 Student Attendance Implementation

```javascript
// src/app/api/attendance/student/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const schoolId = url.searchParams.get('school_id');
    const classId = url.searchParams.get('class_id'); // Optional
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }
    
    // Build SQL query
    let sql, params;
    
    if (classId) {
      // Get data for a specific class
      sql = `
        SELECT 
          c.id as class_id,
          c.name as class_name,
          SUM(CASE WHEN sa.is_present = 1 THEN 1 ELSE 0 END) as present_count,
          SUM(CASE WHEN sa.is_present = 0 THEN 1 ELSE 0 END) as absent_count,
          COUNT(*) as total_students,
          ROUND(SUM(CASE WHEN sa.is_present = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as attendance_rate
        FROM classes c
        LEFT JOIN student_class_enrollments sce ON c.id = sce.class_id
        LEFT JOIN student_attendance sa ON sce.student_id = sa.student_id AND sa.date = ?
        WHERE c.school_id = ? AND c.id = ?
        GROUP BY c.id, c.name
      `;
      params = [date, schoolId, classId];
    } else {
      // Get data for all classes in the school
      sql = `
        SELECT 
          c.id as class_id,
          c.name as class_name,
          SUM(CASE WHEN sa.is_present = 1 THEN 1 ELSE 0 END) as present_count

#### 5.1.2 Dashboard API

```javascript
// src/app/api/dashboard/stats/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { user } = session;
    const { role, id } = user;
    
    // Get query parameters
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || 'month';
    
    // Base stats SQL
    let schoolCountSql = 'SELECT COUNT(*) as count FROM schools WHERE 1=1';
    let studentCountSql = 'SELECT COUNT(*) as count FROM students WHERE 1=1';
    let teacherAttendanceSql = `
      SELECT AVG(attendance_rate) as avg_attendance 
      FROM (
        SELECT school_id, COUNT(CASE WHEN is_present = 1 THEN 1 END) / COUNT(*) * 100 as attendance_rate
        FROM teacher_attendance
        WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 ${timeRange})
        GROUP BY school_id
      ) as school_attendance
    `;
    
    // Add filters based on user role
    const params = [];
    
    if (role === 'regional_admin') {
      const userRegion = await query('SELECT region_id FROM user_regions WHERE user_id = ?', [id]);
      if (userRegion.length > 0) {
        const regionId = userRegion[0].region_id;
        schoolCountSql += ' AND region_id = ?';
        studentCountSql += ' AND school_id IN (SELECT id FROM schools WHERE region_id = ?)';
        teacherAttendanceSql = teacherAttendanceSql.replace('WHERE date', 'WHERE school_id IN (SELECT id FROM schools WHERE region_id = ?) AND date');
        params.push(regionId, regionId, regionId);
      }
    } else if (role === 'district_admin') {
      const userDistrict = await query('SELECT district_id FROM user_districts WHERE user_id = ?', [id]);
      if (userDistrict.length > 0) {
        const districtId = userDistrict[0].district_id;
        schoolCountSql += ' AND district_id = ?';
        studentCountSql += ' AND school_id IN (SELECT id FROM schools WHERE district_id = ?)';
        teacherAttendanceSql = teacherAttendanceSql.replace('WHERE date', 'WHERE school_id IN (SELECT id FROM schools WHERE district_id = ?) AND date');
        params.push(districtId, districtId, districtId);
      }
    } else if (role === 'school_admin') {
      const userSchool = await query('SELECT school_id FROM user_schools WHERE user_id = ?', [id]);
      if (userSchool.length > 0) {
        const schoolId = userSchool[0].school_id;
        schoolCountSql += ' AND id = ?';
        studentCountSql += ' AND school_id = ?';
        teacherAttendanceSql = teacherAttendanceSql.replace('WHERE date', 'WHERE school_id = ? AND date');
        params.push(schoolId, schoolId, schoolId);
      }
    }
    
    // Execute queries
    const [schoolCountResult, studentCountResult, teacherAttendanceResult] = await Promise.all([
      query(schoolCountSql, params.slice(0, 1)),
      query(studentCountSql, params.slice(1, 2)),
      query(teacherAttendanceSql, params.slice(2))
    ]);
    
    // Get module performance data
    const modulePerformance = [
      {
        name: 'Attendance',
        description: 'Teacher and student attendance tracking',
        completionRate: 87
      },
      {
        name: 'WASH',
        description: 'Water, Sanitation and Hygiene metrics',
        completionRate: 65
      },
      {
        name: 'Re-entry',
        description: 'Student re-entry program tracking',
        completionRate: 42
      },
      {
        name: 'Right to Play',
        description: 'RTP program implementation',
        completionRate: 78
      },
      {
        name: 'Textbooks',
        description: 'Textbook distribution and usage',
        completionRate: 91
      },
      {
        name: 'Community',
        description: 'Community engagement initiatives',
        completionRate: 53
      }
    ];
    
    return NextResponse.json({
      schoolCount: schoolCountResult[0].count,
      schoolTrend: 3.2, // Mock data, to be replaced with actual calculations
      studentCount: studentCountResult[0].count,
      studentTrend: 5.7, // Mock data, to be replaced with actual calculations
      teacherAttendance: Math.round(teacherAttendanceResult[0].avg_attendance || 0),
      teacherAttendanceTrend: 1.5, // Mock data, to be replaced with actual calculations
      modulePerformance
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
```

#### 5.1.3 Dashboard Components

```javascript
// src/components/DashboardMetricCard.js
import { Card, CardContent, Typography, Box } from '@mui/material';
import { 
  School, People, AssignmentTurnedIn, LocalDrink, 
  Book, Group, TrendingUp, TrendingDown
} from '@mui/icons-material';

const iconMap = {
  School: School,
  People: People,
  AssignmentTurnedIn: AssignmentTurnedIn,
  LocalDrink: LocalDrink,
  Book: Book,
  Group: Group
};

export default function DashboardMetricCard({ title, value, icon, trend }) {
  const IconComponent = iconMap[icon] || School;
  
  return (
    <Card elevation={2} className="h-full">
      <CardContent>
        <div className="flex justify-between items-start">
          <Box>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
            <Typography variant="h4" component="div" className="font-bold mt-2">
              {value}
            </Typography>
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp fontSize="small" className="text-green-500" />
              ) : (
                <TrendingDown fontSize="small" className="text-red-500" />
              )}
              <Typography 
                variant="body2" 
                className={trend > 0 ? "text-green-500 ml-1" : "text-red-500 ml-1"}
              >
                {Math.abs(trend)}% from last period
              </Typography>
            </div>
          </Box>
          <IconComponent className="text-blue-500" fontSize="large" />
        </div>
      </CardContent>
    </Card>
  );
}

// src/components/RoleScopedView.js
import { useAuth } from '@/context/AuthContext';

export default function RoleScopedView({ roles, children, fallback = null }) {
  const { user } = useAuth();
  
  if (!user || !roles.includes(user.role)) {
    return fallback;
  }
  
  return children;
}
```

### 5.2 School Management

#### 5.2.1 School List Implementation

```javascript
// src/app/dashboard/admin/schools/page.js
'use client';

import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, MenuItem, Typography, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, CircularProgress, Pagination
} from '@mui/material';
import { Add, Edit, Delete, Search, FilterList, CloudDownload } from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { fetchSchools, deleteSchool } from '@/lib/api';
import SchoolForm from '@/components/forms/SchoolForm';

export default function SchoolsPage() {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [currentSchool, setCurrentSchool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    region: '',
    district: '',
    status: ''
  });
  
  const loadSchools = async () => {
    setLoading(true);
    try {
      const result = await fetchSchools({
        page,
        limit: rowsPerPage,
        search: searchQuery,
        ...filters
      });
      
      setSchools(result.schools);
      setTotalCount(result.total);
    } catch (err) {
      console.error('Failed to load schools:', err);
      setError('Failed to load schools. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadSchools();
  }, [page, rowsPerPage, searchQuery, filters]);
  
  const handleOpenForm = (school = null) => {
    setCurrentSchool(school);
    setOpenForm(true);
  };
  
  const handleCloseForm = (refreshData = false) => {
    setOpenForm(false);
    setCurrentSchool(null);
    
    if (refreshData) {
      loadSchools();
    }
  };
  
  const handleDeleteSchool = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await deleteSchool(id);
        loadSchools();
      } catch (err) {
        console.error('Failed to delete school:', err);
        alert('Failed to delete school. Please try again.');
      }
    }
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadSchools();
  };
  
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
    setPage(1);
  };
  
  const handleExport = async () => {
    try {
      // Implementation will be added in the Exports section
      alert('Export functionality to be implemented');
    } catch (err) {
      console.error('Failed to export schools:', err);
      alert('Failed to export schools. Please try again.');
    }
  };
  
  if (loading && schools.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Typography color="error">{error}</Typography>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Schools</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => handleOpenForm()}
        >
          Add School
        </Button>
      </div>
      
      <Paper className="mb-6 p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <TextField
            label="Search schools"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
            InputProps={{
              endAdornment: <Search />
            }}
          />
          
          <TextField
            select
            label="Region"
            size="small"
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="w-full md:w-48"
          >
            <MenuItem value="">All Regions</MenuItem>
            {/* Regions will be loaded dynamically */}
            <MenuItem value="1">Greater Accra</MenuItem>
            <MenuItem value="2">Ashanti</MenuItem>
          </TextField>
          
          <TextField
            select
            label="District"
            size="small"
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="w-full md:w-48"
          >
            <MenuItem value="">All Districts</MenuItem>
            {/* Districts will be loaded dynamically based on selected region */}
            <MenuItem value="1">Accra Metro</MenuItem>
            <MenuItem value="2">Tema Metro</MenuItem>
          </TextField>
          
          <TextField
            select
            label="Status"
            size="small"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full md:w-36"
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            startIcon={<Search />}
          >
            Search
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CloudDownload />}
            onClick={handleExport}
          >
            Export
          </Button>
        </form>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>School Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>District</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell>{school.name}</TableCell>
                <TableCell>{school.code}</TableCell>
                <TableCell>{school.region_name}</TableCell>
                <TableCell>{school.district_name}</TableCell>
                <TableCell>{school.type}</TableCell>
                <TableCell>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs ${
                      school.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {school.status}
                  </span>
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenForm(school)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteSchool(school.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            
            {schools.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No schools found. Please adjust your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <div className="flex justify-between items-center mt-4">
        <Typography variant="body2">
          Showing {Math.min((page - 1) * rowsPerPage + 1, totalCount)} - {Math.min(page * rowsPerPage, totalCount)} of {totalCount}
        </Typography>
        
        <Pagination 
          count={Math.ceil(totalCount / rowsPerPage)} 
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </div>
      
      <Dialog open={openForm} onClose={() => handleCloseForm()} maxWidth="md" fullWidth>
        <DialogTitle>{currentSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
        <DialogContent>
          <SchoolForm 
            school={currentSchool} 
            onSave={() => handleCloseForm(true)}
            onCancel={() => handleCloseForm()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

#### 5.2.2 School API Implementation

```javascript
// src/app/api/schools/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const region = url.searchParams.get('region') || '';
    const district = url.searchParams.get('district') || '';
    const status = url.searchParams.get('status') || '';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = ['1=1'];
    const params = [];
    
    if (search) {
      whereConditions.push('(schools.name LIKE ? OR schools.code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (region) {
      whereConditions.push('schools.region_id = ?');
      params.push(region);
    }
    
    if (district) {
      whereConditions.push('schools.district_id = ?');
      params.push(district);
    }
    
    if (status) {
      whereConditions.push('schools.status = ?');
      params.push(status);
    }
    
    // Role-based filtering
    const { user } = session;
    if (user.role === 'regional_admin') {
      const userRegion = await query('SELECT region_id FROM user_regions WHERE user_id = ?', [user.id]);
      if (userRegion.length > 0) {
        whereConditions.push('schools.region_id = ?');
        params.push(userRegion[0].region_id);
      }
    } else if (user.role === 'district_admin') {
      const userDistrict = await query('SELECT district_id FROM user_districts WHERE user_id = ?', [user.id]);
      if (userDistrict.length > 0) {
        whereConditions.push('schools.district_id = ?');
        params.push(userDistrict[0].district_id);
      }
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Build and execute the query
    const countSql = `
      SELECT COUNT(*) as total
      FROM schools
      WHERE ${whereClause}
    `;
    
    const schoolsSql = `
      SELECT 
        schools.*,
        regions.name as region_name,
        districts.name as district_name
      FROM schools
      LEFT JOIN regions ON schools.region_id = regions.id
      LEFT JOIN districts ON schools.district_id = districts.id
      WHERE ${whereClause}
      ORDER BY schools.name ASC
      LIMIT ? OFFSET ?
    `;
    
    const [countResult, schoolsResult] = await Promise.all([
      query(countSql, params),
      query(schoolsSql, [...params, limit, offset])
    ]);
    
    return NextResponse.json({
      schools: schoolsResult,
      total: countResult[0].total,
      page,
      limit
    });
  } catch (error) {
    console.error('Schools API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check permissions
    const { user } = session;
    const allowedRoles = ['admin', 'super_admin', 'national_admin', 'regional_admin'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'code', 'region_id', 'district_id', 'type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field.replace('_', ' ')} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if school code already exists
    const existingSchool = await query(
      'SELECT id FROM schools WHERE code = ? AND id != ?',
      [body.code, body.id || 0]
    );
    
    if (existingSchool.length > 0) {
      return NextResponse.json(
        { error: 'School code already exists' },
        { status: 400 }
      );
    }
    
    // Role-based permission check for region
    if (user.role === 'regional_admin') {
      const userRegion = await query('SELECT region_id FROM user_regions WHERE user_id = ?', [user.id]);
      if (userRegion.length === 0 || userRegion[0].region_id !== parseInt(body.region_id)) {
        return NextResponse.json(
          { error: 'You can only add schools to your assigned region' },
          { status: 403 }
        );
      }
    }
    
    // Insert new school
    const insertSql = `
      INSERT INTO schools (
        name, code, region_id, district_id, circuit_id, type, level, status, 
        address, phone, email, principal_name, established_year, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(insertSql, [
      body.name,
      body.code,
      body.region_id,
      body.district_id,
      body.circuit_id || null,
      body.type,
      body.level || null,
      body.status || 'active',
      body.address || null,
      body.phone || null,
      body.email || null,
      body.principal_name || null,
      body.established_year || null,
      user.id,
      user.id
    ]);
    
    return NextResponse.json({
      id: result.insertId,
      message: 'School created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
```

#### 5.2.3 School Form Component

```javascript
// src/components/forms/SchoolForm.js
'use client';

import { useState, useEffect } from 'react';
import { 
  TextField, Button, Grid, MenuItem, FormControl, 
  InputLabel, Select, FormHelperText, CircularProgress 
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { fetchRegions, fetchDistricts, fetchCircuits, createSchool, updateSchool } from '@/lib/api';

export default function SchoolForm({ school, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region_id: '',
    district_id: '',
    circuit_id: '',
    type: '',
    level: '',
    status: 'active',
    address: '',
    phone: '',
    email: '',
    principal_name: '',
    established_year: ''
  });
  
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingDependencies, setLoadingDependencies] = useState(true);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const regionsData = await fetchRegions();
        setRegions(regionsData);
        
        if (school) {
          setFormData({
            id: school.id,
            name: school.name || '',
            code: school.code || '',
            region_id: school.region_id || '',
            district_id: school.district_id || '',
            circuit_id: school.circuit_id || '',
            type: school.type || '',
            level: school.level || '',
            status: school.status || 'active',
            address: school.address || '',
            phone: school.phone || '',
            email: school.email || '',
            principal_name: school.principal_name || '',
            established_year: school.established_year || ''
          });
          
          // Load districts and circuits for this school
          if (school.region_id) {
            const districtsData = await fetchDistricts(school.region_id);
            setDistricts(districtsData);
          }
          
          if (school.district_id) {
            const circuitsData = await fetchCircuits(school.district_id);
            setCircuits(circuitsData);
          }
        }
      } catch (err) {
        console.error('Failed to load form dependencies:', err);
      } finally {
        setLoadingDependencies(false);
      }
    };
    
    loadInitialData();
  }, [school]);
  
  // Load districts when region changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (formData.region_id) {
        try {
          const districtsData = await fetchDistricts(formData.region_id);
          setDistricts(districtsData);
          
          // Reset district and circuit if they don't belong to the new region
          if (!districtsData.some(d => d.id === formData.district_id)) {
            setFormData(prev => ({
              ...prev,
              district_id: '',
              circuit_id: ''
            }));
            setCircuits([]);
          }
        } catch (err) {
          console.error('Failed to load districts:', err);
        }
      } else {
        setDistricts([]);
        setFormData(prev => ({
          ...prev,
          district_id: '',
          circuit_id: ''
        }));
        setCircuits([]);
      }
    };
    
    loadDistricts();
  }, [formData.region_id]);
  
  // Load circuits when district changes
  useEffect(() => {
    const loadCircuits = async () => {
      if (formData.district_id) {
        try {
          const circuitsData = await fetchCircuits(formData.district_id);
          setCircuits(circuitsData);
          
          // Reset circuit if it doesn't belong to the new district
          if (!circuitsData.some(c => c.id === formData.circuit_id)) {
            setFormData(prev => ({
              ...prev,
              circuit_id: ''
            }));
          }
        } catch (err) {
          console.error('Failed to load circuits:', err);
        }
      } else {
        setCircuits([]);
        setFormData(prev => ({
          ...prev,
          circuit_id: ''
        }));
      }
    };
    
    loadCircuits();
  }, [formData.district_id]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'School code is required';
    }
    
    if (!formData.region_id) {
      newErrors.region_id = 'Region is required';
    }
    
    if (!formData.district_id) {
      newErrors.district_id = 'District is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'School type is required';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (school) {
        await updateSchool(school.id, formData);
      } else {
        await createSchool(formData);
      }
      
      onSave();
    } catch (err) {
      console.error('Failed to save school:', err);
      if (err.response?.data?.error) {
        setErrors(prev => ({
          ...prev,
          apiError: err.response.data.error
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          apiError: 'Failed to save school. Please try again.'
        }));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  if (loadingDependencies) {
    return (
      <div className="flex justify-center items-center p-8">
        <CircularProgress size={24} className="mr-2" />
        <span>Loading form...</span>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-4">
      {errors.apiError && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {errors.apiError}
        </div>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            name="name"
            label="School Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="code"
            label="School Code"
            value={formData.code}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.code}
            helperText={errors.code}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required error={!!errors.region_id}>
            <InputLabel>Region</InputLabel>
            <Select
              name="region_id"
              value={formData.region_id}
              onChange={handleChange}
              label="Region"
            >
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
            {errors.region_id && (
              <FormHelperText>{errors.region_id}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required error={!!errors.district_id}>
            <InputLabel>District</InputLabel>
            <Select
              name="district_id"
              value={formData.district_id}
              onChange={handleChange}
              label="District"
              disabled={!formData.region_id}
            >
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
            {errors.district_id && (
              <FormHelperText>{errors.district_id}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Circuit</InputLabel>
            <Select
              name="circuit_id"
              value={formData.circuit_id}
              onChange={handleChange}
              label="Circuit"
              disabled={!formData.district_id}
            >
              <MenuItem value="">None</MenuItem>
              {circuits.map((circuit) => (
                <MenuItem key={circuit.id} value={circuit.id}>
                  {circuit.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel>School Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              label="School Type"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            {errors.type && (
              <FormHelperText>{errors.type}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>School Level</InputLabel>
            <Select
              name="level"
              value={formData.level}
              onChange={handleChange}
              label="School Level"
            >
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="kindergarten">Kindergarten</MenuItem>
              <MenuItem value="primary">Primary</MenuItem>
              <MenuItem value="jhs">Junior High School (JHS)</MenuItem>
              <MenuItem value="shs">Senior High School (SHS)</MenuItem>
              <MenuItem value="k_primary">KG & Primary</MenuItem>
              <MenuItem value="primary_jhs">Primary & JHS</MenuItem>
              <MenuItem value="k_primary_jhs">KG, Primary & JHS</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="address"
            label="Address"
            value={formData.address}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="principal_name"
            label="Principal Name"
            value={formData.principal_name}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            name="established_year"
            label="Established Year"
            type="number"
            value={formData.established_year}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 1900, max: new Date().getFullYear() }}
          />
        </Grid>
      </Grid>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          startIcon={<Cancel />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} /> : <Save />}
        >
          {loading ? 'Saving...' : 'Save School'}
        </Button>
      </div>
    </form>
  );
}
```
