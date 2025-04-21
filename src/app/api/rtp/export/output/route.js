import { NextResponse } from 'next/server';

/**
 * GET /api/rtp/export/output
 * Exports output indicator data in formats suitable for CSV export
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const itineraryId = searchParams.get('itineraryId');
  const schoolType = searchParams.get('schoolType'); // 'all', 'galop', or 'non-galop'
  const level = searchParams.get('level'); // 'school', 'district', or 'all'
  
  // In a real implementation, this would query the database based on parameters
  // For now, we'll return structured data that can be exported
  
  // Mock data for school-level output indicators
  const schoolLevelData = [
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      indicator: 'Teacher Champions - Male',
      value: 3,
      categoryId: 'teacherChampions',
      gender: 'male',
      submissionDate: '2025-03-15'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      indicator: 'Teacher Champions - Female',
      value: 5,
      categoryId: 'teacherChampions',
      gender: 'female',
      submissionDate: '2025-03-15'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      indicator: 'PBL Training - Male',
      value: 8,
      categoryId: 'teachersPBL',
      gender: 'male',
      submissionDate: '2025-03-15'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      indicator: 'PBL Training - Female',
      value: 10,
      categoryId: 'teachersPBL',
      gender: 'female',
      submissionDate: '2025-03-15'
    },
    // Add more school-level indicator data here
    {
      schoolName: 'Tema Model School',
      district: 'Tema Metro',
      region: 'Greater Accra',
      isGalop: false,
      indicator: 'Teacher Champions - Male',
      value: 2,
      categoryId: 'teacherChampions',
      gender: 'male',
      submissionDate: '2025-03-12'
    },
    {
      schoolName: 'Tema Model School',
      district: 'Tema Metro',
      region: 'Greater Accra',
      isGalop: false,
      indicator: 'Teacher Champions - Female',
      value: 4,
      categoryId: 'teacherChampions',
      gender: 'female',
      submissionDate: '2025-03-12'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for district-level output indicators
  const districtLevelData = [
    {
      district: 'Accra Metro',
      region: 'Greater Accra',
      indicator: 'District Teacher Support Teams',
      value: 1,
      categoryId: 'districtSupportTeams',
      gender: 'na',
      submissionDate: '2025-03-18'
    },
    {
      district: 'Accra Metro',
      region: 'Greater Accra',
      indicator: 'District Team Members - Male',
      value: 12,
      categoryId: 'districtTeamMembersTrained',
      gender: 'male',
      submissionDate: '2025-03-18'
    },
    {
      district: 'Accra Metro',
      region: 'Greater Accra',
      indicator: 'District Team Members - Female',
      value: 8,
      categoryId: 'districtTeamMembersTrained',
      gender: 'female',
      submissionDate: '2025-03-18'
    },
    {
      district: 'Accra Metro',
      region: 'Greater Accra',
      indicator: 'Coaching Plans',
      value: 1,
      categoryId: 'districtCoachingPlans',
      gender: 'na',
      submissionDate: '2025-03-18'
    },
    // Add more district-level indicator data here
    {
      district: 'Tema Metro',
      region: 'Greater Accra',
      indicator: 'District Teacher Support Teams',
      value: 1,
      categoryId: 'districtSupportTeams',
      gender: 'na',
      submissionDate: '2025-03-16'
    },
    {
      district: 'Tema Metro',
      region: 'Greater Accra',
      indicator: 'District Team Members - Male',
      value: 8,
      categoryId: 'districtTeamMembersTrained',
      gender: 'male',
      submissionDate: '2025-03-16'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Determine which data to return based on level
  let exportData;
  
  switch (level) {
    case 'school':
      exportData = schoolLevelData;
      break;
    case 'district':
      exportData = districtLevelData;
      break;
    case 'all':
    default:
      // Combine all data with appropriate level indicators
      exportData = [
        ...schoolLevelData.map(item => ({ ...item, level: 'School Level' })),
        ...districtLevelData.map(item => ({ ...item, level: 'District Level' }))
      ];
      break;
  }
  
  // Filter data based on schoolType if applicable and if level is school or all
  if (schoolType !== 'all' && (level === 'school' || level === 'all')) {
    const isGalopSchool = schoolType === 'galop';
    
    // If we're including school-level data, filter it by GALOP status
    if (level === 'school') {
      exportData = exportData.filter(item => item.isGalop === isGalopSchool);
    } else if (level === 'all') {
      // For combined data, only filter the school-level items
      exportData = [
        ...exportData.filter(item => item.level === 'School Level' && item.isGalop === isGalopSchool),
        ...exportData.filter(item => item.level === 'District Level')
      ];
    }
  }
  
  return NextResponse.json({
    status: 'success',
    data: exportData
  });
}