/**
 * School Statistics Aggregator Service
 * Aggregates data from multiple statistics endpoints into a single summary
 */

// Import the database connection
import { createPool } from '@/utils/db';

// Direct database queries for server-side execution
async function fetchDirectFromDatabase(endpoint, params) {
  const db = await createPool();
  const { schoolId, year, term, weekNumber } = params;
  
  console.log(`Direct DB query for ${endpoint} with params:`, params);
  
  try {
    // Handle different endpoints with appropriate queries
    if (endpoint === '/api/statistics/enrolment') {
      const query = `
        SELECT 
          id, school_id, circuit_id, district_id, region_id,
          normal_boys_total, normal_girls_total,
          special_boys_total, special_girls_total,
          total_population, term, week_number, year
        FROM school_enrolment_totals
        WHERE year = ? AND term = ?
        AND school_id = ? 
        ORDER BY week_number DESC 
        LIMIT 1`;

      const queryParams = [year, term, schoolId].filter(p => p !== undefined);
      
      console.log('Executing enrollment query:', query, queryParams);
      const [rows] = await db.query(query, queryParams);
      console.log(`Enrollment query returned ${rows.length} rows`);

      if (rows.length === 0) {
        return { success: false, error: 'No enrollment data found' };
      }
      
      return { 
        success: true, 
        data: rows[0] 
      };
    } 
    else if (endpoint === '/api/statistics/student-attendance') {
      const query = `
        SELECT 
          id, school_id, circuit_id, district_id, region_id,
          normal_boys_total, normal_girls_total,
          special_boys_total, special_girls_total,
          total_population, term, week_number, year
        FROM school_student_attendance_totals
        WHERE year = ? AND term = ?
        AND school_id = ? 
        ORDER BY week_number DESC 
        LIMIT 1`;

      const queryParams = [year, term, schoolId].filter(p => p !== undefined);
      
      console.log('Executing student attendance query:', query, queryParams);
      const [rows] = await db.query(query, queryParams);
      console.log(`Student attendance query returned ${rows.length} rows`);

      if (rows.length === 0) {
        return { success: false, error: 'No student attendance data found' };
      }
      
      // Calculate attendance rates
      const processedData = rows.map(row => {
        const totalEnrolled = row.total_population || 0;
        const totalPresent = (row.normal_boys_total || 0) + 
                            (row.normal_girls_total || 0) + 
                            (row.special_boys_total || 0) + 
                            (row.special_girls_total || 0);
        
        const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;
        
        return {
          ...row,
          attendance_rate: parseFloat(attendanceRate.toFixed(2))
        };
      });
      
      return { success: true, data: processedData };
    }
    else if (endpoint === '/api/statistics/teacher-attendance') {
      const query = `
        SELECT 
          id, school_id, circuit_id, district_id, region_id,
          school_session_days, days_present, days_punctual, days_absent,
          days_absent_with_permission, days_absent_without_permission,
          lesson_plan_ratings, excises_given, excises_marked, position,
          week_number, term, year, created_at
        FROM teacher_attendances
        WHERE year = ? AND term = ?
        AND school_id = ? 
        ORDER BY week_number DESC 
        LIMIT 1`;

      const queryParams = [year, term, schoolId].filter(p => p !== undefined);
      
      console.log('Executing teacher attendance query:', query, queryParams);
      const [rows] = await db.query(query, queryParams);
      console.log(`Teacher attendance query returned ${rows.length} rows`);

      if (rows.length === 0) {
        return { success: false, error: 'No teacher attendance data found' };
      }
      
      // Calculate summary statistics
      const summary = {
        totalTeachers: rows.length,
        totalDaysPresent: rows.reduce((sum, row) => sum + (row.days_present || 0), 0),
        totalDaysPunctual: rows.reduce((sum, row) => sum + (row.days_punctual || 0), 0),
        totalDaysAbsent: rows.reduce((sum, row) => sum + (row.days_absent || 0), 0),
        totalExercisesGiven: rows.reduce((sum, row) => sum + (row.excises_given || 0), 0),
        totalExercisesMarked: rows.reduce((sum, row) => sum + (row.excises_marked || 0), 0),
        avgAttendanceRate: rows.length > 0 
          ? (rows.reduce((sum, row) => {
              const sessionDays = row.school_session_days || 1;
              return sum + ((row.days_present || 0) / sessionDays);
            }, 0) / rows.length) * 100
          : 0,
        avgPunctualityRate: rows.length > 0
          ? (rows.reduce((sum, row) => {
              const daysPresent = row.days_present || 1;
              return sum + ((row.days_punctual || 0) / daysPresent);
            }, 0) / rows.length) * 100
          : 0,
        avgExerciseCompletionRate: rows.length > 0
          ? (rows.reduce((sum, row) => {
              const exercisesGiven = row.excises_given || 1;
              return sum + ((row.excises_marked || 0) / exercisesGiven);
            }, 0) / rows.length) * 100
          : 0
      };
      
      // Format the summary values to 2 decimal places
      Object.keys(summary).forEach(key => {
        if (typeof summary[key] === 'number' && key.startsWith('avg')) {
          summary[key] = parseFloat(summary[key].toFixed(2));
        }
      });
      
      return {
        success: true,
        data: {
          summary,
          details: rows
        }
      };
    }
    
    return { success: false, error: `Unknown endpoint: ${endpoint}` };
  } catch (error) {
    console.error(`Error in direct database query for ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to make API requests
async function fetchFromEndpoint(endpoint, params = {}) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    
    // When running on the server side, we need to use absolute URLs
    // Check if we're running on the server or client
    const isServer = typeof window === 'undefined';
    
    let url;
    if (isServer) {
      // On server side, use direct database queries instead of API calls
      // This avoids the need for server-to-server API calls
      return await fetchDirectFromDatabase(endpoint, params);
    } else {
      // On client side, we can use relative URLs
      url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`Fetching from: ${url}`);
      
      const response = await fetch(url, { 
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`API request failed with status ${response.status} for ${url}`);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Response from ${endpoint}:`, data);
      
      return data;
    }
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}



/**
 * Transform enrollment data into a standardized summary format
 */
function transformEnrolment(data) {
  if (!data) return null;
  
  return {
    totalStudents: data.total_population || 0,
    genderDistribution: {
      boys: (data.normal_boys_total || 0) + (data.special_boys_total || 0),
      girls: (data.normal_girls_total || 0) + (data.special_girls_total || 0)
    },
    specialNeeds: {
      boys: data.special_boys_total || 0,
      girls: data.special_girls_total || 0,
      total: (data.special_boys_total || 0) + (data.special_girls_total || 0)
    },
    period: {
      year: data.year,
      term: data.term,
      week: data.week_number
    }
  };
}

/**
 * Transform student attendance data into a standardized summary format
 */
function transformStudentAttendance(data) {
  if (!data || !data.length) return null;
  
  // Use the most recent attendance record
  const latestAttendance = data[0];
  
  const totalPresent = (latestAttendance.normal_boys_total || 0) + 
                       (latestAttendance.normal_girls_total || 0) + 
                       (latestAttendance.special_boys_total || 0) + 
                       (latestAttendance.special_girls_total || 0);
  
  const totalEnrolled = latestAttendance.total_population || 0;
  const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;
  
  return {
    totalPresent,
    totalEnrolled,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    genderDistribution: {
      boys: {
        present: (latestAttendance.normal_boys_total || 0) + (latestAttendance.special_boys_total || 0),
        rate: parseFloat(((latestAttendance.normal_boys_total || 0) + (latestAttendance.special_boys_total || 0)) / 
              ((latestAttendance.normal_boys_total || 0) + (latestAttendance.special_boys_total || 0) + 0.001) * 100).toFixed(2)
      },
      girls: {
        present: (latestAttendance.normal_girls_total || 0) + (latestAttendance.special_girls_total || 0),
        rate: parseFloat(((latestAttendance.normal_girls_total || 0) + (latestAttendance.special_girls_total || 0)) / 
              ((latestAttendance.normal_girls_total || 0) + (latestAttendance.special_girls_total || 0) + 0.001) * 100).toFixed(2)
      }
    },
    period: {
      year: latestAttendance.year,
      term: latestAttendance.term,
      week: latestAttendance.week_number
    }
  };
}

/**
 * Transform teacher attendance data into a standardized summary format
 */
function transformTeacherAttendance(data) {
  if (!data || !data.summary) return null;
  
  const { summary, details } = data;
  
  return {
    totalTeachers: summary.totalTeachers || 0,
    attendanceRate: summary.avgAttendanceRate || 0,
    punctualityRate: summary.avgPunctualityRate || 0,
    exerciseCompletionRate: summary.avgExerciseCompletionRate || 0,
    lessonPlanQuality: calculateLessonPlanQuality(details),
    period: details.length > 0 ? {
      year: details[0].year,
      term: details[0].term,
      week: details[0].week_number
    } : null
  };
}

/**
 * Calculate lesson plan quality distribution from teacher details
 */
function calculateLessonPlanQuality(details) {
  if (!details || !details.length) return null;
  
  const ratings = details.reduce((acc, teacher) => {
    const rating = teacher.lesson_plan_ratings || 'not_rated';
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});
  
  const total = details.length;
  
  return {
    excellent: {
      count: ratings.excellent || 0,
      percentage: parseFloat(((ratings.excellent || 0) / total * 100).toFixed(2))
    },
    good: {
      count: ratings.good || 0,
      percentage: parseFloat(((ratings.good || 0) / total * 100).toFixed(2))
    },
    fair: {
      count: ratings.fair || 0,
      percentage: parseFloat(((ratings.fair || 0) / total * 100).toFixed(2))
    },
    poor: {
      count: ratings.poor || 0,
      percentage: parseFloat(((ratings.poor || 0) / total * 100).toFixed(2))
    },
    not_rated: {
      count: ratings.not_rated || 0,
      percentage: parseFloat(((ratings.not_rated || 0) / total * 100).toFixed(2))
    }
  };
}

/**
 * Get aggregated statistics for a school
 * @param {string} schoolId - The ID of the school
 * @param {Object} period - Period filters (year, term, weekNumber)
 * @returns {Promise<Object>} - Aggregated statistics
 */
async function getSchoolStatsSummary(schoolId, period = {}) {
  try {
    console.log(`Getting statistics for school ${schoolId} with period:`, period);
    
    const { year, term, weekNumber } = period;
    
    // Prepare params for API calls
    const params = { 
      schoolId,
      ...(year && { year }),
      ...(term && { term }),
      ...(weekNumber && { weekNumber })
    };
    
    console.log('API call parameters:', params);
    
    // Fetch data from all endpoints in parallel
    const [enrolmentRes, studentAttendanceRes, teacherAttendanceRes] = await Promise.all([
      fetchFromEndpoint('/api/statistics/enrolment', params),
      fetchFromEndpoint('/api/statistics/student-attendance', params),
      fetchFromEndpoint('/api/statistics/teacher-attendance', params)
    ]);
    
    console.log('Enrollment response success:', enrolmentRes.success);
    console.log('Student attendance response success:', studentAttendanceRes.success);
    console.log('Teacher attendance response success:', teacherAttendanceRes.success);
    
    // Transform the data
    const enrolment = enrolmentRes.success ? transformEnrolment(enrolmentRes.data) : null;
    const studentAttendance = studentAttendanceRes.success ? transformStudentAttendance(studentAttendanceRes.data) : null;
    const teacherAttendance = teacherAttendanceRes.success ? transformTeacherAttendance(teacherAttendanceRes.data) : null;
    
    console.log('Transformed enrollment data:', enrolment);
    console.log('Transformed student attendance data:', studentAttendance);
    console.log('Transformed teacher attendance data:', teacherAttendance);
    
    return {
      success: true,
      data: {
        enrolment,
        studentAttendance,
        teacherAttendance
      }
    };
  } catch (error) {
    console.error('Error aggregating school stats:', error);
    return { 
      success: false, 
      error: 'Failed to aggregate school statistics'
    };
  }
}

module.exports = {
  getSchoolStatsSummary
};
