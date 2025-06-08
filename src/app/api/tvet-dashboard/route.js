// API route for TVET data
import { getConnection } from '../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const level = searchParams.get('level') || 'school';
    const levelId = searchParams.get('levelId');

    const connection = await getConnection();

    // Base query to get TVET data
    let query = `
      SELECT 
        id,
        school_id,
        circuit_id,
        district_id,
        region_id,
        period,
        responses,
        created_at,
        updated_at
      FROM tvet 
      WHERE 1=1
    `;
    
    const params = [];

    // Add period filter if provided
    if (period) {
      query += ' AND period = ?';
      params.push(period);
    }

    // Add level-specific filters
    if (level && levelId) {
      switch (level) {
        case 'school':
          query += ' AND school_id = ?';
          params.push(levelId);
          break;
        case 'circuit':
          query += ' AND circuit_id = ?';
          params.push(levelId);
          break;
        case 'district':
          query += ' AND district_id = ?';
          params.push(levelId);
          break;
        case 'region':
          query += ' AND region_id = ?';
          params.push(levelId);
          break;
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await connection.execute(query, params);
    
    // Process the data to extract TVET indicators
    const processedData = rows.map(row => {
      let responses = [];
      try {
        responses = JSON.parse(row.responses);
      } catch (e) {
        console.error('Error parsing responses:', e);
        responses = [];
      }

      // Map responses to TVET indicators based on question_id
      const indicators = {
        // Program Availability
        programs_offered: responses.find(r => r.question_id === 1)?.answer || [],
        enrollment_capacity: responses.find(r => r.question_id === 2)?.answer || 0,
        current_enrollment: responses.find(r => r.question_id === 3)?.answer || 0,
        
        // Infrastructure
        workshops_available: responses.find(r => r.question_id === 4)?.answer === 'YES',
        equipment_functional: responses.find(r => r.question_id === 5)?.answer === 'YES',
        library_resources: responses.find(r => r.question_id === 6)?.answer === 'YES',
        
        // Staff
        qualified_instructors: responses.find(r => r.question_id === 7)?.answer || 0,
        instructor_student_ratio: responses.find(r => r.question_id === 8)?.answer || 0,
        
        // Performance
        completion_rate: responses.find(r => r.question_id === 9)?.answer || 0,
        employment_rate: responses.find(r => r.question_id === 10)?.answer || 0,
        certification_rate: responses.find(r => r.question_id === 11)?.answer || 0,
        
        // Industry Partnerships
        industry_partnerships: responses.find(r => r.question_id === 12)?.answer === 'YES',
        internship_programs: responses.find(r => r.question_id === 13)?.answer === 'YES',
        job_placement_support: responses.find(r => r.question_id === 14)?.answer === 'YES',
        
        // Quality Assurance
        curriculum_updated: responses.find(r => r.question_id === 15)?.answer === 'YES',
        assessment_standards: responses.find(r => r.question_id === 16)?.answer === 'YES',
        accreditation_status: responses.find(r => r.question_id === 17)?.answer || 'Not Accredited',
      };

      return {
        id: row.id,
        school_id: row.school_id,
        circuit_id: row.circuit_id,
        district_id: row.district_id,
        region_id: row.region_id,
        period: row.period,
        indicators,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    // Calculate summary statistics
    const totalRecords = processedData.length;
    const summary = {
      total_institutions: totalRecords,
      average_enrollment: totalRecords > 0 ? 
        (processedData.reduce((sum, d) => sum + (parseInt(d.indicators.current_enrollment) || 0), 0) / totalRecords).toFixed(0) : 0,
      completion_rate_avg: totalRecords > 0 ? 
        (processedData.reduce((sum, d) => sum + (parseFloat(d.indicators.completion_rate) || 0), 0) / totalRecords).toFixed(1) : 0,
      employment_rate_avg: totalRecords > 0 ? 
        (processedData.reduce((sum, d) => sum + (parseFloat(d.indicators.employment_rate) || 0), 0) / totalRecords).toFixed(1) : 0,
      accredited_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.accreditation_status === 'Accredited').length / totalRecords * 100).toFixed(1) : 0,
    };

    // Calculate trends (mock data for now - would need historical data)
    const trends = {
      enrollment_trend: [1200, 1350, 1480, 1620, 1750],
      completion_trend: [75, 78, 82, 85, 88],
      employment_trend: [65, 68, 72, 75, 78],
      accreditation_trend: [40, 45, 50, 55, 60]
    };

    return Response.json({
      success: true,
      data: processedData,
      summary,
      trends,
      level,
      period,
      total: totalRecords
    });

  } catch (error) {
    console.error('TVET API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch TVET data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

