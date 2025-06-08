import { getConnection } from '../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const level = searchParams.get("level") || "school";
    const levelId = searchParams.get("levelId");

    const connection = await getConnection();

    // Base query to get WASH data
    let query = `
      SELECT 
        id,
        reporter_id,
        school_id,
        circuit_id,
        district_id,
        region_id,
        term,
        semester,
        semester_week_number,
        year,
        survey_object,
        created_at,
        updated_at
      FROM wash 
      WHERE 1=1
    `;
    
    const params = [];

    // Extract year and term from the period parameter
    let filterYear, filterTerm;
    if (period) {
      const parts = period.split("&term=");
      if (parts.length === 2) {
        filterYear = parts[0].replace("year=", "");
        filterTerm = parts[1];
      }
    }

    // Add year and term filters if provided
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
      let survey_object = {};
      try {
        survey_object = JSON.parse(row.survey_object);
      } catch (e) {
        console.error('Error parsing survey_object:', e);
        survey_object = {};
      }

      // Map survey_object to indicators based on question_id or direct keys
      const indicators = {
        // General indicators (1-20) - Assuming question_id mapping from previous logic
        safe_drinking_water: survey_object['1']?.answer === 'YES',
        water_for_other_purposes: survey_object['2']?.answer === 'YES',
        separate_toilets: survey_object['3']?.answer === 'YES',
        adequate_toilets_boys: survey_object['4']?.answer === 'YES',
        urinal_available: survey_object['5']?.answer === 'YES',
        urinal_privacy_girls: survey_object['6']?.answer === 'YES',
        toilet_clean_accessible: survey_object['7']?.answer === 'YES',
        toilet_disability_friendly: survey_object['8']?.answer === 'YES',
        girls_changing_room: survey_object['9']?.answer === 'YES',
        soap_water_available: survey_object['10']?.answer === 'YES',
        refuse_disposal_site: survey_object['11']?.answer === 'YES',
        children_wash_hands: survey_object['12']?.answer === 'YES',
        hiv_aids_education: survey_object['13']?.answer === 'YES',
        sports_facilities: survey_object['14']?.answer === 'YES',
        health_hygiene_teaching: survey_object['15']?.answer === 'YES',
        first_aid_box: survey_object['16']?.answer === 'YES',
        dust_bins_in_use: survey_object['17']?.answer === 'YES',
        teachers_wash_hands: survey_object['18']?.answer === 'YES',
        compound_clean_safe: survey_object['19']?.answer === 'YES',
        vulnerable_children_support: survey_object['20']?.answer === 'YES',
        
        // Facility availability (21-25)
        toilet_status: survey_object['21']?.answer,
        urinal_status: survey_object['22']?.answer,
        water_status: survey_object['23']?.answer,
        veronica_bucket_status: survey_object['24']?.answer,
        changing_rooms_status: survey_object['25']?.answer,
        
        // Problems identified (26)
        problems: survey_object['26']?.answer,
        
        // Additional data
        handwashing_facility: survey_object['33']?.answer === 'Yes',
        playground_available: survey_object['36']?.answer === 'Yes',
      };

      return {
        id: row.id,
        school_id: row.school_id,
        circuit_id: row.circuit_id,
        district_id: row.district_id,
        region_id: row.region_id,
        term: row.term,
        semester: row.semester,
        semester_week_number: row.semester_week_number,
        year: row.year,
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
      year: filterYear, // Use the extracted year
      term: filterTerm, // Use the extracted term
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

