/**
 * Test script for the School Statistics Aggregator
 * This script tests the aggregator by fetching statistics for a sample school
 */

// Use CommonJS require for Node.js script
const { getSchoolStatsSummary } = require('../src/services/schoolStatsAggregator');

// Mock fetch for Node.js environment
global.fetch = async (url) => {
  console.log(`Mocking fetch request to: ${url}`);
  
  // Parse the URL to extract endpoint and params
  const urlObj = new URL(url, 'http://localhost:3000');
  const endpoint = urlObj.pathname;
  const schoolId = urlObj.searchParams.get('schoolId');
  
  // Mock responses based on endpoint
  let mockResponse = { success: false, error: 'Unknown endpoint' };
  
  if (endpoint === '/api/statistics/enrolment') {
    mockResponse = {
      success: true,
      data: {
        id: 1,
        school_id: parseInt(schoolId),
        circuit_id: 9,
        district_id: 33,
        region_id: 3,
        normal_boys_total: 138,
        normal_girls_total: 139,
        special_boys_total: 2,
        special_girls_total: 3,
        total_population: 282,
        term: "1",
        week_number: 13,
        year: "2024/2025"
      }
    };
  } else if (endpoint === '/api/statistics/student-attendance') {
    mockResponse = {
      success: true,
      data: [
        {
          id: 1,
          school_id: parseInt(schoolId),
          circuit_id: 9,
          district_id: 33,
          region_id: 3,
          normal_boys_total: 120,
          normal_girls_total: 125,
          special_boys_total: 1,
          special_girls_total: 2,
          total_population: 282,
          term: "1",
          week_number: 13,
          year: "2024/2025",
          attendance_rate: 87.94
        }
      ]
    };
  } else if (endpoint === '/api/statistics/teacher-attendance') {
    mockResponse = {
      success: true,
      data: {
        summary: {
          totalTeachers: 15,
          totalDaysPresent: 68,
          totalDaysPunctual: 62,
          totalDaysAbsent: 7,
          totalExercisesGiven: 285,
          totalExercisesMarked: 254,
          avgAttendanceRate: 90.67,
          avgPunctualityRate: 91.18,
          avgExerciseCompletionRate: 89.12
        },
        details: [
          {
            id: 1,
            school_id: parseInt(schoolId),
            circuit_id: 9,
            district_id: 33,
            region_id: 3,
            school_session_days: 5,
            days_present: 5,
            days_punctual: 4,
            days_absent: 0,
            days_absent_with_permission: 0,
            days_absent_without_permission: 0,
            lesson_plan_ratings: "good",
            excises_given: 20,
            excises_marked: 18,
            week_number: 13,
            term: "1",
            year: "2024/2025"
          },
          {
            id: 2,
            school_id: parseInt(schoolId),
            circuit_id: 9,
            district_id: 33,
            region_id: 3,
            school_session_days: 5,
            days_present: 4,
            days_punctual: 4,
            days_absent: 1,
            days_absent_with_permission: 1,
            days_absent_without_permission: 0,
            lesson_plan_ratings: "excellent",
            excises_given: 15,
            excises_marked: 15,
            week_number: 13,
            term: "1",
            year: "2024/2025"
          }
        ]
      }
    };
  }
  
  return {
    ok: true,
    json: async () => mockResponse
  };
};

/**
 * Test the aggregator with a sample school ID
 */
async function testAggregator() {
  try {
    console.log('Testing School Statistics Aggregator...\n');
    
    const schoolId = '1563'; // Sample school ID
    const period = {
      year: '2024/2025',
      term: '1',
      weekNumber: '13'
    };
    
    console.log(`Fetching statistics for School ID: ${schoolId}`);
    console.log(`Period: Year ${period.year}, Term ${period.term}, Week ${period.weekNumber}\n`);
    
    const result = await getSchoolStatsSummary(schoolId, period);
    
    console.log('Aggregated Statistics Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\nTest completed successfully!');
    } else {
      console.error('\nTest failed:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testAggregator();
