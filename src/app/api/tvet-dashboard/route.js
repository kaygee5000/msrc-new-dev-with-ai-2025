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
        ttr.id,
        ttr.question_id,
        ttr.school_id,
        s.circuit_id,
        s.district_id,
        s.region_id,
        ttr.numeric_response,
        ttr.text_response,
        ttr.json_response,
        ttr.submission_type,
        ttr.week,
        ttr.term,
        ttr.year,
        ttr.created_at,
        ttr.updated_at,
        ttq.question_type,
        ttq.options
      FROM tvet_tracker_responses ttr
      JOIN schools s ON ttr.school_id = s.id
      JOIN tvet_tracker_questions ttq ON ttr.question_id = ttq.id
      WHERE 1=1
    `;
    
    const params = [];

    // Parse period filter
    let filterYear, filterTerm;
    if (period) {
      const parts = period.split(" - ");
      if (parts.length === 2) {
        filterYear = parts[0];
        filterTerm = parts[1].replace("Term ", "");
      }
    }

    if (filterYear) {
      query += ` AND year = ?`;
      params.push(filterYear);
    }
    if (filterTerm) {
      query += ` AND term = ?`;
      params.push(filterTerm);
    }

    // Add level-specific filters
    if (level && levelId) {
      switch (level) {
        case 'school':
          query += ' AND school_id = ?';
          params.push(levelId);
          break;
        case 'circuit':
          query += ' AND s.circuit_id = ?';
          params.push(levelId);
          break;
        case 'district':
          query += ' AND s.district_id = ?';
          params.push(levelId);
          break;
        case 'region':
          query += ' AND s.region_id = ?';
          params.push(levelId);
          break;
      }
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await connection.execute(query, params);
    
    // Group responses by school_id and period to process indicators per school/period
    const groupedData = {};
    rows.forEach(row => {
      const key = `${row.school_id}-${row.year}-${row.term}-${row.week}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          school_id: row.school_id,
          circuit_id: row.circuit_id, // Assuming these exist
          district_id: row.district_id, // Assuming these exist
          region_id: row.region_id, // Assuming these exist
          period: `${row.year} - Term ${row.term} - Week ${row.week}`,
          responses: [],
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      }
      groupedData[key].responses.push({
        question_id: row.question_id,
        numeric_response: row.numeric_response,
        text_response: row.text_response,
        json_response: row.json_response,
      });
    });

    const processedData = Object.values(groupedData).map(entry => {
      let allResponses = [];
      entry.responses.forEach(r => {
        // Find the question type for the current question_id
        const questionMeta = rows.find(row => row.question_id === r.question_id);
        const questionType = questionMeta?.question_type;

        let answer = null;

        switch (questionType) {
          case 'open_ended_numeric':
            answer = r.numeric_response;
            break;
          case 'close_ended_single_choice':
          case 'close_ended_multiple_choice':
            answer = r.text_response;
            break;
          case 'json_data_value_numeric':
            try {
              answer = JSON.parse(r.json_response);
            } catch (e) {
              console.error('Error parsing json_response for question_id', r.question_id, e);
              answer = null;
            }
            break;
          default:
            // Fallback for other types or if question_type is not found
            if (r.numeric_response !== null) {
              answer = r.numeric_response;
            } else if (r.text_response !== null) {
              answer = r.text_response;
            } else if (r.json_response !== null) {
              try {
                answer = JSON.parse(r.json_response);
              } catch (e) {
                console.error('Error parsing json_response fallback for question_id', r.question_id, e);
                answer = null;
              }
            }
            break;
        }
        allResponses.push({ question_id: r.question_id, answer: answer });
      });

      // Map responses to TVET indicators based on question_id
      const indicators = {
        economic_activity: allResponses.find(r => r.question_id === 1)?.answer || null,
        programs_offered: allResponses.find(r => r.question_id === 2)?.answer || null,
        student_enrollment_boys: allResponses.find(r => r.question_id === 3)?.answer || 0,
        student_enrollment_girls: allResponses.find(r => r.question_id === 4)?.answer || 0,
        teacher_strength_male: allResponses.find(r => r.question_id === 5)?.answer || 0,
        teacher_strength_female: allResponses.find(r => r.question_id === 6)?.answer || 0,
        girls_boys_offering_program: allResponses.find(r => r.question_id === 7)?.answer || null,
        teachers_with_capacity: allResponses.find(r => r.question_id === 8)?.answer || null,
        student_services_offered: allResponses.find(r => r.question_id === 9)?.answer || null,
        students_benefiting: allResponses.find(r => r.question_id === 10)?.answer || null,
        schools_with_partnerships: allResponses.find(r => r.question_id === 11)?.answer || null,
      };

      return {
        id: entry.id,
        school_id: entry.school_id,
        circuit_id: entry.circuit_id,
        district_id: entry.district_id,
        region_id: entry.region_id,
        period: entry.period,
        indicators,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      };
    });

    // Calculate summary statistics
    const totalRecords = processedData.length;
    const summary = {
      total_institutions: totalRecords,
      total_boys_enrolled: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.student_enrollment_boys) || 0), 0),
      total_girls_enrolled: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.student_enrollment_girls) || 0), 0),
      total_teachers_male: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.teacher_strength_male) || 0), 0),
      total_teachers_female: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.teacher_strength_female) || 0), 0),
      schools_with_partnerships_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.schools_with_partnerships === 'yes_with_active_placement' || d.indicators.schools_with_partnerships === 'yes_without_active_placement').length / totalRecords * 100).toFixed(1) : 0,
    };

    // Calculate trends (mock data for now - would need historical data)
    const trends = {
      enrollment_trend: [1200, 1350, 1480, 1620, 1750],
      teacher_strength_trend: [100, 110, 120, 130, 140],
      partnerships_trend: [40, 45, 50, 55, 60],
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

