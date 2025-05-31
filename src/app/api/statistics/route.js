import { NextResponse } from 'next/server';

/**
 * GET handler for statistics API index
 * Lists all available statistics endpoints and their parameters
 */
async function GET() {
  return NextResponse.json({
    success: true,
    endpoints: [
      {
        path: '/api/statistics/periods',
        description: 'Get available submission periods (years, terms, and weeks)',
        parameters: [
          'schoolId (optional)',
          'circuitId (optional)',
          'districtId (optional)',
          'regionId (optional)'
        ]
      },
      {
        path: '/api/statistics/enrolment',
        description: 'Get school enrolment statistics',
        parameters: [
          'schoolId (optional)',
          'circuitId (optional)',
          'districtId (optional)',
          'regionId (optional)',
          'year (optional, default: current year)',
          'term (optional, default: 1)'
        ]
      },
      {
        path: '/api/statistics/student-attendance',
        description: 'Get student attendance statistics',
        parameters: [
          'schoolId (optional)',
          'circuitId (optional)',
          'districtId (optional)',
          'regionId (optional)',
          'year (optional, default: current year)',
          'term (optional, default: 1)',
          'weekNumber (optional)'
        ]
      },
      {
        path: '/api/statistics/teacher-attendance',
        description: 'Get teacher attendance and performance statistics',
        parameters: [
          'schoolId (optional)',
          'circuitId (optional)',
          'districtId (optional)',
          'regionId (optional)',
          'year (optional, default: current year)',
          'term (optional, default: 1)',
          'weekNumber (optional)'
        ]
      }
    ]
  });
}

export { GET };
