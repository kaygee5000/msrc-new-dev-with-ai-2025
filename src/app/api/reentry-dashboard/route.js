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
        id,
        school_id,
        circuit_id,
        district_id,
        region_id,
        period,
        responses,
        created_at,
        updated_at
      FROM pregnancy 
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
      let responses = [];
      try {
        responses = JSON.parse(row.responses);
      } catch (e) {
        console.error('Error parsing responses:', e);
        responses = [];
      }

      // Map responses to pregnancy/reentry indicators based on question_id
      const indicators = {
        // Girls Pregnancy indicators
        pregnant_girls_attending: responses.find(r => r.question_id === 1)?.answer || 0,
        pregnant_girls_not_attending: responses.find(r => r.question_id === 2)?.answer || 0,
        
        // Girls Re-entry indicators
        dropped_out_returned: responses.find(r => r.question_id === 3)?.answer || 0,
        pregnant_returned_after_birth: responses.find(r => r.question_id === 4)?.answer || 0,
        
        // Support Services
        support_activities: responses.find(r => r.question_id === 5)?.answer || '',
        followup_activities: responses.find(r => r.question_id === 6)?.answer || '',
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
      total_schools: totalRecords,
      total_pregnant_attending: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_girls_attending) || 0), 0),
      total_pregnant_not_attending: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_girls_not_attending) || 0), 0),
      total_dropped_out_returned: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.dropped_out_returned) || 0), 0),
      total_pregnant_returned: processedData.reduce((sum, d) => sum + (parseInt(d.indicators.pregnant_returned_after_birth) || 0), 0),
    };

    // Calculate reentry rate
    const totalDroppedOut = summary.total_pregnant_not_attending + summary.total_dropped_out_returned;
    summary.reentry_rate = totalDroppedOut > 0 ? 
      ((summary.total_dropped_out_returned / totalDroppedOut) * 100).toFixed(1) : 0;

    // Calculate trends (mock data for now - would need historical data)
    const trends = {
      pregnant_attending_trend: [45, 48, 52, 55, 58],
      reentry_trend: [65, 68, 72, 75, 78],
      support_activities_trend: [30, 35, 40, 45, 50],
      followup_activities_trend: [25, 28, 32, 35, 38]
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

