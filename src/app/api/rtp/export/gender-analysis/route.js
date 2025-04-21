import { NextResponse } from 'next/server';

/**
 * GET /api/rtp/export/gender-analysis
 * Exports gender-disaggregated data for RTP analysis
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const itineraryId = searchParams.get('itineraryId');
  const schoolType = searchParams.get('schoolType'); // 'all', 'galop', or 'non-galop'
  const exportType = searchParams.get('exportType'); // 'teachers', 'students', 'districts', 'outcomes', 'all'
  
  // In a real implementation, this would query the database based on parameters
  // For now, we'll return structured data that can be exported
  
  // Mock data for teachers export
  const teachersData = [
    {
      category: 'Teacher Champions',
      male: 156,
      female: 203,
      total: 359,
      femalePercentage: 56.5,
      district: 'Accra Metro'
    },
    {
      category: 'PBL Training',
      male: 412,
      female: 587,
      total: 999,
      femalePercentage: 58.8,
      district: 'Accra Metro'
    },
    {
      category: 'ECE Training',
      male: 98,
      female: 124,
      total: 222,
      femalePercentage: 55.9,
      district: 'Accra Metro'
    },
    {
      category: 'Other Training',
      male: 211,
      female: 245,
      total: 456,
      femalePercentage: 53.7,
      district: 'Accra Metro'
    },
    {
      category: 'No Training',
      male: 45,
      female: 32,
      total: 77,
      femalePercentage: 41.6,
      district: 'Accra Metro'
    },
    // Add more entries for other districts
    {
      category: 'Teacher Champions',
      male: 30,
      female: 42,
      total: 72,
      femalePercentage: 58.3,
      district: 'Tema Metro'
    },
    {
      category: 'PBL Training',
      male: 87,
      female: 124,
      total: 211,
      femalePercentage: 58.8,
      district: 'Tema Metro'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for students export
  const studentsData = [
    {
      category: 'Total Enrollment',
      male: 12456,
      female: 11987,
      total: 24443,
      femalePercentage: 49.0,
      district: 'All Districts'
    },
    {
      category: 'Special Needs',
      male: 245,
      female: 187,
      total: 432,
      femalePercentage: 43.3,
      district: 'All Districts'
    },
    {
      category: 'Total Enrollment',
      male: 2780,
      female: 2645,
      total: 5425,
      femalePercentage: 48.8,
      district: 'Accra Metro'
    },
    {
      category: 'Special Needs',
      male: 56,
      female: 43,
      total: 99,
      femalePercentage: 43.4,
      district: 'Accra Metro'
    },
    // Add data for other districts
    {
      category: 'Total Enrollment',
      male: 2540,
      female: 2498,
      total: 5038,
      femalePercentage: 49.6,
      district: 'Tema Metro'
    },
    {
      category: 'Special Needs',
      male: 52,
      female: 40,
      total: 92,
      femalePercentage: 43.5,
      district: 'Tema Metro'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for district team members
  const districtTeamsData = [
    {
      category: 'Team Members',
      male: 51,
      female: 36,
      total: 87,
      femalePercentage: 41.4,
      district: 'All Districts'
    },
    {
      category: 'Planning Attendees',
      male: 128,
      female: 87,
      total: 215,
      femalePercentage: 40.5,
      district: 'All Districts'
    },
    {
      category: 'Trainers',
      male: 37,
      female: 28,
      total: 65,
      femalePercentage: 43.1,
      district: 'All Districts'
    },
    // District-specific data
    {
      category: 'Team Members',
      male: 12,
      female: 8,
      total: 20,
      femalePercentage: 40.0,
      district: 'Accra Metro'
    },
    {
      category: 'Planning Attendees',
      male: 28,
      female: 18,
      total: 46,
      femalePercentage: 39.1,
      district: 'Accra Metro'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for teaching outcomes
  const outcomesData = [
    {
      category: 'Lesson Plans with LtP',
      male: 68,
      female: 76,
      gap: 8,
      district: 'All Districts',
      term: 'Current Term',
      notes: 'Percentage of teachers incorporating LtP methodologies'
    },
    {
      category: 'LtP Teaching Skills',
      male: 55,
      female: 63,
      gap: 8,
      district: 'All Districts',
      term: 'Current Term',
      notes: 'Percentage of teachers demonstrating LtP skills'
    },
    // Historical data
    {
      category: 'Lesson Plans with LtP',
      male: 62,
      female: 69,
      gap: 7,
      district: 'All Districts',
      term: 'Previous Term',
      notes: 'Percentage of teachers incorporating LtP methodologies'
    },
    {
      category: 'LtP Teaching Skills',
      male: 48,
      female: 56,
      gap: 8,
      district: 'All Districts',
      term: 'Previous Term',
      notes: 'Percentage of teachers demonstrating LtP skills'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for trends export
  const trendsData = [
    {
      category: 'Teacher Training',
      male: 485,
      female: 365,
      total: 850,
      femalePercentage: 42.9,
      term: 'Term 1'
    },
    {
      category: 'Teacher Training',
      male: 590,
      female: 460,
      total: 1050,
      femalePercentage: 43.8,
      term: 'Term 2'
    },
    {
      category: 'Teacher Training',
      male: 722,
      female: 567,
      total: 1289,
      femalePercentage: 44.0,
      term: 'Current Term'
    },
    {
      category: 'Teachers with Skills',
      male: 42,
      female: 48,
      gap: 6,
      term: 'Term 1',
      notes: 'Percentage points'
    },
    {
      category: 'Teachers with Skills',
      male: 48,
      female: 56,
      gap: 8,
      term: 'Term 2',
      notes: 'Percentage points'
    },
    {
      category: 'Teachers with Skills',
      male: 55,
      female: 63,
      gap: 8,
      term: 'Current Term',
      notes: 'Percentage points'
    }
  ];
  
  // Determine which data to return based on exportType
  let exportData;
  
  switch (exportType) {
    case 'teachers':
      exportData = teachersData;
      break;
    case 'students':
      exportData = studentsData;
      break;
    case 'districts':
      exportData = districtTeamsData;
      break;
    case 'outcomes':
      exportData = outcomesData;
      break;
    case 'trends':
      exportData = trendsData;
      break;
    case 'all':
    default:
      // Combine all data with appropriate category indicators
      exportData = [
        ...teachersData.map(item => ({ ...item, dataType: 'Teacher Training' })),
        ...studentsData.map(item => ({ ...item, dataType: 'Student Enrollment' })),
        ...districtTeamsData.map(item => ({ ...item, dataType: 'District Teams' })),
        ...outcomesData.map(item => ({ ...item, dataType: 'Teaching Outcomes' })),
        ...trendsData.map(item => ({ ...item, dataType: 'Trends Analysis' }))
      ];
      break;
  }
  
  // Filter data based on schoolType if applicable
  // In a real implementation, this would be handled in the database query
  
  return NextResponse.json({
    status: 'success',
    data: exportData
  });
}