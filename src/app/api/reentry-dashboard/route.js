// API route for Pregnancy/Reentry data
import { getConnection } from '../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const level = searchParams.get('level') || 'school';
    const levelId = searchParams.get('levelId');

    const connection = await getConnection();

    // Base query to get pregnancy data
    let query = `
      SELECT 
        ptr.id,
        ptr.question_id,
        ptr.school_id,
        s.circuit_id,
        s.district_id,
        s.region_id,
        ptr.level,
        ptr.numeric_response,
        ptr.text_response,
        ptr.single_choice_response,
        ptr.multiple_choice_response,
        ptr.submission_type,
        ptr.week,
        ptr.term,
        ptr.year,
        ptr.created_at,
        ptr.updated_at,
        ptq.question_type,
        ptq.options
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      JOIN pregnancy_tracker_questions ptq ON ptr.question_id = ptq.id
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
    
    // Process the data to extract pregnancy/reentry indicators
    const processedData = rows.map(row => {
      let answer = null;
      switch (row.question_type) {
        case 'open_ended_numeric':
          answer = row.numeric_response;
          break;
        case 'open_ended_text':
          answer = row.text_response;
          break;
        case 'close_ended_single_choice':
          answer = row.single_choice_response;
          break;
        case 'close_ended_multiple_choice':
          answer = row.multiple_choice_response;
          break;
        default:
          // Fallback for other types or if question_type is not found
          if (row.numeric_response !== null) {
            answer = row.numeric_response;
          } else if (row.text_response !== null) {
            answer = row.text_response;
          } else if (row.single_choice_response !== null) {
            answer = row.single_choice_response;
          } else if (row.multiple_choice_response !== null) {
            answer = row.multiple_choice_response;
          }
          break;
      }

      return {
        id: row.id,
        question_id: row.question_id,
        school_id: row.school_id,
        circuit_id: row.circuit_id,
        district_id: row.district_id,
        region_id: row.region_id,
        level: row.level,
        answer: answer,
        week: row.week,
        term: row.term,
        year: row.year,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    // Group processed data by school_id, year, term, and week
    const groupedData = {};
    processedData.forEach(item => {
      const key = `${item.school_id}-${item.year}-${item.term}-${item.week}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          school_id: item.school_id,
          circuit_id: item.circuit_id,
          district_id: item.district_id,
          region_id: item.region_id,
          period: `${item.year} - Term ${item.term} - Week ${item.week}`,
          indicators: {},
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      }
      groupedData[key].indicators[`question_${item.question_id}`] = item.answer;
    });

    const finalProcessedData = Object.values(groupedData).map(entry => {
      // Map generic question_id based indicators to meaningful names
      const indicators = {
        pregnant_girls_attending: entry.indicators.question_1 || 0,
        pregnant_girls_not_attending: entry.indicators.question_2 || 0,
        dropped_out_returned: entry.indicators.question_3 || 0,
        pregnant_returned_after_birth: entry.indicators.question_4 || 0,
        support_activities: entry.indicators.question_5 || '',
        followup_activities: entry.indicators.question_6 || '',
        pregnancy_outcome: entry.indicators.question_7 || null,
      };

      return {
        id: entry.id, // This ID might not be unique per grouped entry, consider generating a new one if needed
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
    const totalRecords = finalProcessedData.length;
    const summary = {
      total_schools: totalRecords,
      total_pregnant_attending: finalProcessedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_girls_attending) || 0), 0),
      total_pregnant_not_attending: finalProcessedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_girls_not_attending) || 0), 0),
      total_dropped_out_returned: finalProcessedData.reduce((sum, d) => sum + (parseInt(d.indicators.dropped_out_returned) || 0), 0),
      total_pregnant_returned: finalProcessedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_returned_after_birth) || 0), 0),
    };

    // Calculate reentry rate
    const totalDroppedOut = summary.total_pregnant_not_attending + summary.total_dropped_out_returned;
    summary.reentry_rate = totalDroppedOut > 0 ? 
      ((summary.total_dropped_out_returned / totalDroppedOut) * 100).toFixed(1) : 0;

    // Calculate trends from actual historical data
    // Get historical data for the past 5 terms
    const trendQuery = `
      SELECT 
        CONCAT(year, '-', term) as period,
        SUM(CASE WHEN question_id = 1 THEN numeric_response ELSE 0 END) as pregnant_attending,
        SUM(CASE WHEN question_id = 2 THEN numeric_response ELSE 0 END) as pregnant_not_attending,
        SUM(CASE WHEN question_id = 3 THEN numeric_response ELSE 0 END) as dropped_out_returned,
        SUM(CASE WHEN question_id = 4 THEN numeric_response ELSE 0 END) as pregnant_returned,
        COUNT(DISTINCT school_id) as total_schools,
        COUNT(DISTINCT CASE WHEN question_id = 5 AND text_response IS NOT NULL AND text_response != '' THEN school_id ELSE NULL END) as schools_with_support,
        COUNT(DISTINCT CASE WHEN question_id = 6 AND text_response IS NOT NULL AND text_response != '' THEN school_id ELSE NULL END) as schools_with_followup
      FROM pregnancy_tracker_responses
      WHERE submission_type = 'termly'
      GROUP BY year, term
      ORDER BY year DESC, term DESC
      LIMIT 5
    `;
    
    const [trendRows] = await connection.execute(trendQuery);
    
    // Reverse the rows to show oldest first
    trendRows.reverse();
    
    // Calculate percentages and prepare trend data
    const trends = {
      pregnant_attending_trend: trendRows.map(row => parseInt(row.pregnant_attending) || 0),
      reentry_trend: trendRows.map(row => {
        const totalDroppedOut = (parseInt(row.pregnant_not_attending) || 0) + (parseInt(row.dropped_out_returned) || 0);
        return totalDroppedOut > 0 ? 
          ((parseInt(row.dropped_out_returned) / totalDroppedOut) * 100).toFixed(1) : 0;
      }),
      support_activities_trend: trendRows.map(row => 
        row.total_schools > 0 ? ((row.schools_with_support / row.total_schools) * 100).toFixed(1) : 0
      ),
      followup_activities_trend: trendRows.map(row => 
        row.total_schools > 0 ? ((row.schools_with_followup / row.total_schools) * 100).toFixed(1) : 0
      ),
      period_labels: trendRows.map(row => row.period)
    };

    // Get available periods for filtering
    const periodsQuery = `
      SELECT DISTINCT year, term, week
      FROM pregnancy_tracker_responses
      ORDER BY year DESC, term DESC, week DESC
    `;
    
    const [periodsRows] = await connection.execute(periodsQuery);
    
    // Format periods for the frontend
    const availablePeriods = periodsRows.map(row => ({
      year: row.year,
      term: row.term,
      week: row.week,
      label: `${row.year} - Term ${row.term} - Week ${row.week}`
    }));

    return Response.json({
      success: true,
      data: processedData,
      summary,
      trends,
      level,
      period,
      total: totalRecords,
      availablePeriods,
      availableLevels: [
        { id: 'national', name: 'National' },
        { id: 'region', name: 'Region' },
        { id: 'district', name: 'District' },
        { id: 'circuit', name: 'Circuit' },
        { id: 'school', name: 'School' }
      ]
    });

  } catch (error) {
    console.error('Pregnancy/Reentry API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch pregnancy/reentry data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

