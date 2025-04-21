import { NextResponse } from 'next/server';

/**
 * GET /api/rtp/export/outcome
 * Exports outcome indicator data in formats suitable for CSV export
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const itineraryId = searchParams.get('itineraryId');
  const schoolType = searchParams.get('schoolType'); // 'all', 'galop', or 'non-galop'
  const surveyType = searchParams.get('surveyType'); // 'consolidated-checklist', 'partners-in-play', or 'all'
  
  // In a real implementation, this would query the database based on parameters
  // For now, we'll return structured data that can be exported
  
  // Mock data for Consolidated Checklist responses
  const consolidatedChecklistData = [
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      questionNumber: 1,
      questionText: 'Does the school have RTP Champions?',
      responseText: 'Yes',
      responseValue: 'yes',
      categoryId: 'implementation',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      questionNumber: 2,
      questionText: 'How many RTP Champions are in the school?',
      responseText: '8',
      responseValue: 8,
      categoryId: 'implementation',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      questionNumber: 17,
      questionText: 'Does the school have an implementation plan for LtP?',
      responseText: 'Yes',
      responseValue: 'yes',
      categoryId: 'planning',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      questionNumber: 18,
      questionText: 'Is there a copy of the implementation plan available?',
      responseText: 'Yes (Uploaded)',
      responseValue: 'implementation_plan_accra_basic.pdf',
      categoryId: 'planning',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    // Add more consolidated checklist data for additional schools
    {
      schoolName: 'Tema Model School',
      district: 'Tema Metro',
      region: 'Greater Accra',
      isGalop: false,
      questionNumber: 1,
      questionText: 'Does the school have RTP Champions?',
      responseText: 'Yes',
      responseValue: 'yes',
      categoryId: 'implementation',
      submissionDate: '2025-03-12',
      assessorName: 'Jane Doe',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Tema Model School',
      district: 'Tema Metro',
      region: 'Greater Accra',
      isGalop: false,
      questionNumber: 2,
      questionText: 'How many RTP Champions are in the school?',
      responseText: '6',
      responseValue: 6,
      categoryId: 'implementation',
      submissionDate: '2025-03-12',
      assessorName: 'Jane Doe',
      assessorRole: 'District Officer'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Mock data for Partners in Play responses
  const partnersInPlayData = [
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      teacherName: 'Michael Osei',
      teacherGender: 'male',
      className: 'Primary 4',
      subject: 'Mathematics',
      questionNumber: 29,
      questionText: 'Teacher uses child-friendly language and tone',
      responseText: 'Frequently',
      responseValue: 5,
      categoryId: 'teaching_approach',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      teacherName: 'Michael Osei',
      teacherGender: 'male',
      className: 'Primary 4',
      subject: 'Mathematics',
      questionNumber: 30,
      questionText: 'Teacher acknowledges student effort and achievement',
      responseText: 'Sometimes',
      responseValue: 4,
      categoryId: 'teaching_approach',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      teacherName: 'Sarah Mensah',
      teacherGender: 'female',
      className: 'Primary 5',
      subject: 'Science',
      questionNumber: 29,
      questionText: 'Teacher uses child-friendly language and tone',
      responseText: 'Frequently',
      responseValue: 5,
      categoryId: 'teaching_approach',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    {
      schoolName: 'Accra Basic School',
      district: 'Accra Metro',
      region: 'Greater Accra',
      isGalop: true,
      teacherName: 'Sarah Mensah',
      teacherGender: 'female',
      className: 'Primary 5',
      subject: 'Science',
      questionNumber: 30,
      questionText: 'Teacher acknowledges student effort and achievement',
      responseText: 'Frequently',
      responseValue: 5,
      categoryId: 'teaching_approach',
      submissionDate: '2025-03-15',
      assessorName: 'John Smith',
      assessorRole: 'District Officer'
    },
    // Add more Partners in Play data here
    {
      schoolName: 'Tema Model School',
      district: 'Tema Metro',
      region: 'Greater Accra',
      isGalop: false,
      teacherName: 'Joshua Aidoo',
      teacherGender: 'male',
      className: 'Primary 3',
      subject: 'English',
      questionNumber: 29,
      questionText: 'Teacher uses child-friendly language and tone',
      responseText: 'Sometimes',
      responseValue: 4,
      categoryId: 'teaching_approach',
      submissionDate: '2025-03-12',
      assessorName: 'Jane Doe',
      assessorRole: 'District Officer'
    }
    // Additional entries would be here in a real implementation
  ];
  
  // Determine which data to return based on surveyType
  let exportData;
  
  switch (surveyType) {
    case 'consolidated-checklist':
      exportData = consolidatedChecklistData;
      break;
    case 'partners-in-play':
      exportData = partnersInPlayData;
      break;
    case 'all':
    default:
      // Combine all data with appropriate survey type indicators
      exportData = [
        ...consolidatedChecklistData.map(item => ({ ...item, surveyType: 'Consolidated Checklist' })),
        ...partnersInPlayData.map(item => ({ ...item, surveyType: 'Partners in Play' }))
      ];
      break;
  }
  
  // Filter data based on schoolType if applicable
  if (schoolType !== 'all') {
    const isGalopSchool = schoolType === 'galop';
    exportData = exportData.filter(item => item.isGalop === isGalopSchool);
  }
  
  return NextResponse.json({
    status: 'success',
    data: exportData
  });
}