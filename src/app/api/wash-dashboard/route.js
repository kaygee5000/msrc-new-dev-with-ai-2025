// API route for WASH data
import { getConnection } from '../../../utils/db';

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const level = searchParams.get("level") || "school";
    const levelId = searchParams.get("levelId");

    connection = await getConnection();

    // Base query to get WASH data
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
      FROM wash 
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
    
    // Process the data to extract WASH indicators
    const processedData = rows.map(row => {
      let responses = [];
      try {
        responses = JSON.parse(row.responses);
      } catch (e) {
        console.error('Error parsing responses:', e);
        responses = [];
      }

      // Map responses to indicators based on question_id
      const indicators = {
        // General indicators (1-20)
        safe_drinking_water: responses.find(r => r.question_id === 1)?.answer === 'YES',
        water_for_other_purposes: responses.find(r => r.question_id === 2)?.answer === 'YES',
        separate_toilets: responses.find(r => r.question_id === 3)?.answer === 'YES',
        adequate_toilets_boys: responses.find(r => r.question_id === 4)?.answer === 'YES',
        urinal_available: responses.find(r => r.question_id === 5)?.answer === 'YES',
        urinal_privacy_girls: responses.find(r => r.question_id === 6)?.answer === 'YES',
        toilet_clean_accessible: responses.find(r => r.question_id === 7)?.answer === 'YES',
        toilet_disability_friendly: responses.find(r => r.question_id === 8)?.answer === 'YES',
        girls_changing_room: responses.find(r => r.question_id === 9)?.answer === 'YES',
        soap_water_available: responses.find(r => r.question_id === 10)?.answer === 'YES',
        refuse_disposal_site: responses.find(r => r.question_id === 11)?.answer === 'YES',
        children_wash_hands: responses.find(r => r.question_id === 12)?.answer === 'YES',
        hiv_aids_education: responses.find(r => r.question_id === 13)?.answer === 'YES',
        sports_facilities: responses.find(r => r.question_id === 14)?.answer === 'YES',
        health_hygiene_teaching: responses.find(r => r.question_id === 15)?.answer === 'YES',
        first_aid_box: responses.find(r => r.question_id === 16)?.answer === 'YES',
        dust_bins_in_use: responses.find(r => r.question_id === 17)?.answer === 'YES',
        teachers_wash_hands: responses.find(r => r.question_id === 18)?.answer === 'YES',
        compound_clean_safe: responses.find(r => r.question_id === 19)?.answer === 'YES',
        vulnerable_children_support: responses.find(r => r.question_id === 20)?.answer === 'YES',
        
        // Facility availability (21-25)
        toilet_status: responses.find(r => r.question_id === 21)?.answer,
        urinal_status: responses.find(r => r.question_id === 22)?.answer,
        water_status: responses.find(r => r.question_id === 23)?.answer,
        veronica_bucket_status: responses.find(r => r.question_id === 24)?.answer,
        changing_rooms_status: responses.find(r => r.question_id === 25)?.answer,
        
        // Problems identified (26)
        problems: responses.find(r => r.question_id === 26)?.answer,
        
        // Additional data
        handwashing_facility: responses.find(r => r.question_id === 33)?.answer === 'Yes',
        playground_available: responses.find(r => r.question_id === 36)?.answer === 'Yes',
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
      safe_drinking_water_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.safe_drinking_water).length / totalRecords * 100).toFixed(1) : 0,
      adequate_sanitation_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.separate_toilets && d.indicators.toilet_clean_accessible).length / totalRecords * 100).toFixed(1) : 0,
      hygiene_education_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.health_hygiene_teaching).length / totalRecords * 100).toFixed(1) : 0,
      handwashing_facilities_percentage: totalRecords > 0 ? 
        (processedData.filter(d => d.indicators.handwashing_facility).length / totalRecords * 100).toFixed(1) : 0,
    };

    // Calculate trends (mock data for now - would need historical data)
    const trends = {
      safe_water_trend: [65, 68, 72, 75, 78],
      sanitation_trend: [45, 48, 52, 55, 58],
      hygiene_trend: [60, 63, 67, 70, 73],
      handwashing_trend: [40, 43, 47, 50, 53]
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
    console.error('WASH API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch WASH data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

