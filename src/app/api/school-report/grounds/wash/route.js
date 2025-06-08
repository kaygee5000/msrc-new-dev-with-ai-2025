// src/app/api/school-report/grounds/wash/route.js
import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const filters = {
        term: searchParams.get('term'),
        year: searchParams.get('year'),
        school_id: searchParams.get('school_id'),
        region_id: searchParams.get('region_id'),
        district_id: searchParams.get('district_id'),
        circuit_id: searchParams.get('circuit_id'),
        level: searchParams.get('level') || 'school',
    };

    const tableName = 'wash';
    let query = `SELECT T.* FROM ${tableName} T`;
    const queryParams = [];
    let conditions = [];

    // Direct filters on the target table
    if (filters.term) {
        conditions.push('T.term = ?');
        queryParams.push(filters.term);
    }
    if (filters.year) {
        conditions.push('T.year = ?');
        queryParams.push(filters.year);
    }
    if (filters.school_id) {
        conditions.push('T.school_id = ?');
        queryParams.push(filters.school_id);
    }

    // Hierarchical filters (region, district, circuit) - apply if school_id is not directly provided
    if (!filters.school_id && (filters.region_id || filters.district_id || filters.circuit_id)) {
        let schoolSubQueryParts = {
            select: 'SELECT s.id FROM schools s',
            joins: [],
            conditions: [],
            params: []
        };

        if (filters.circuit_id) {
            schoolSubQueryParts.conditions.push('s.circuit_id = ?');
            schoolSubQueryParts.params.push(filters.circuit_id);
        }
        
        if (filters.district_id) {
            if (!schoolSubQueryParts.joins.includes('JOIN circuits c ON s.circuit_id = c.id')) {
                 schoolSubQueryParts.joins.push('JOIN circuits c ON s.circuit_id = c.id');
            }
            schoolSubQueryParts.conditions.push('c.district_id = ?');
            schoolSubQueryParts.params.push(filters.district_id);
        }
        
        if (filters.region_id) {
            if (!schoolSubQueryParts.joins.includes('JOIN circuits c ON s.circuit_id = c.id')) {
                 schoolSubQueryParts.joins.push('JOIN circuits c ON s.circuit_id = c.id');
            }
            if (!schoolSubQueryParts.joins.includes('JOIN districts d ON c.district_id = d.id')) {
                 schoolSubQueryParts.joins.push('JOIN districts d ON c.district_id = d.id');
            }
            schoolSubQueryParts.conditions.push('d.region_id = ?');
            schoolSubQueryParts.params.push(filters.region_id);
        }

        if (schoolSubQueryParts.params.length > 0 && schoolSubQueryParts.conditions.length > 0) {
            const schoolSubQuery = `
                ${schoolSubQueryParts.select}
                ${schoolSubQueryParts.joins.join(' ')}
                WHERE ${schoolSubQueryParts.conditions.join(' AND ')}
            `;
            conditions.push(`T.school_id IN (${schoolSubQuery})`);
            queryParams.push(...schoolSubQueryParts.params);
        }
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    console.log("Query in WASH: ", query, queryParams);
    try {
        if (filters.level === 'school' || filters.school_id) {
            // Original logic for fetching individual school data
            const [results] = await db.query(query, queryParams);
            return NextResponse.json(results);
        } else {
            // New logic for aggregated data
            let aggregatedData;
            switch (filters.level) {
                case 'circuit':
                    aggregatedData = await getCircuitLevelWashData(filters);
                    break;
                case 'district':
                    aggregatedData = await getDistrictLevelWashData(filters);
                    break;
                case 'region':
                    aggregatedData = await getRegionLevelWashData(filters);
                    break;
                default:
                    return NextResponse.json({ message: 'Invalid aggregation level specified.' }, { status: 400 });
            }
            return NextResponse.json(aggregatedData);
        }
    } catch (error) {
        console.error('Error fetching WASH data:', error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

async function getSchoolWashDataForAggregation(filters) {
  let baseQuery = `
    SELECT 
      s.id as school_id,
      s.name as school_name,
      c.id as circuit_id,
      c.name as circuit_name,
      d.id as district_id,
      d.name as district_name,
      r.id as region_id,
      r.name as region_name,
      w.survey_object
    FROM 
      wash w
    JOIN 
      schools s ON w.school_id = s.id
    JOIN 
      circuits c ON s.circuit_id = c.id
    JOIN 
      districts d ON c.district_id = d.id
    JOIN 
      regions r ON d.region_id = r.id
    WHERE 
      w.year = ? AND w.term = ?
  `;
  const queryParams = [filters.year, filters.term];

  if (filters.region_id) {
    baseQuery += ' AND r.id = ?';
    queryParams.push(filters.region_id);
  }
  if (filters.district_id) {
    baseQuery += ' AND d.id = ?';
    queryParams.push(filters.district_id);
  }
  if (filters.circuit_id) {
    baseQuery += ' AND c.id = ?';
    queryParams.push(filters.circuit_id);
  }
  
  const [results] = await db.query(baseQuery, queryParams);
  return results.map(row => {
    let parsedSurveyObject = {};
    if (row.survey_object) {
      if (typeof row.survey_object === 'string') {
        try {
          parsedSurveyObject = JSON.parse(row.survey_object);
        } catch (parseError) {
          console.error('Failed to parse survey_object string:', parseError, 'Raw data:', row.survey_object);
          parsedSurveyObject = {}; 
        }
      } else if (typeof row.survey_object === 'object') {
        parsedSurveyObject = row.survey_object;
      } else {
        console.warn('survey_object is of unexpected type:', typeof row.survey_object, 'Raw data:', row.survey_object);
        parsedSurveyObject = {};
      }
    }
    return { ...row, survey_object: parsedSurveyObject };
  });
}

function aggregateWashIndicators(washDataArray) {
    const aggregated = {};
    const indicatorKeys = [
        'safeDrinkingWater', 'waterForOtherPurposes', 'separateToilets', 'adequateToiletsBoys', 'urinal',
        'urinalPrivacyGirls', 'toiletCleanAccessible', 'toiletDisabilityFriendly', 'girlsChangingRoom',
        'soapWaterAvailable', 'refuseDisposalSite', 'childrenWashHands', 'childrenLearnHIVAIDS',
        'sportsPlayFacilities', 'teachersIntegrateHealthHygiene', 'firstAidBox', 'dustBinsInUse',
        'teachersWashHands', 'schoolCompoundCleanSafe', 'vulnerableChildrenSupport'
    ];

    indicatorKeys.forEach(key => {
        aggregated[key] = { yes: 0, no: 0, total: 0 };
    });

    washDataArray.forEach(data => {
        indicatorKeys.forEach(key => {
            if (data.survey_object && typeof data.survey_object[key] === 'boolean') {
                aggregated[key].total++;
                if (data.survey_object[key]) {
                    aggregated[key].yes++;
                } else {
                    aggregated[key].no++;
                }
            }
        });
    });
    return aggregated;
}

async function getCircuitLevelWashData(filters) {
    const schoolsData = await getSchoolWashDataForAggregation(filters);
    const circuits = {};

    schoolsData.forEach(school => {
        if (!circuits[school.circuit_id]) {
            circuits[school.circuit_id] = {
                circuit_id: school.circuit_id,
                circuit_name: school.circuit_name,
                district_id: school.district_id,
                district_name: school.district_name,
                region_id: school.region_id,
                region_name: school.region_name,
                schools: [],
                aggregated_wash: {}
            };
        }
        circuits[school.circuit_id].schools.push({
            school_id: school.school_id,
            school_name: school.school_name,
            survey_object: school.survey_object
        });

        // Aggregate at circuit level
        const currentCircuitWashData = circuits[school.circuit_id].schools.map(s => ({ survey_object: s.survey_object }));
        circuits[school.circuit_id].aggregated_wash = aggregateWashIndicators(currentCircuitWashData);
    });
    return Object.values(circuits);
}

async function getDistrictLevelWashData(filters) {
    const circuitData = await getCircuitLevelWashData(filters);
    const districts = {};

    circuitData.forEach(circuit => {
        if (!districts[circuit.district_id]) {
            districts[circuit.district_id] = {
                district_id: circuit.district_id,
                district_name: circuit.district_name,
                region_id: circuit.region_id,
                region_name: circuit.region_name,
                circuits: [],
                aggregated_wash: {}
            };
        }
        districts[circuit.district_id].circuits.push({
            circuit_id: circuit.circuit_id,
            circuit_name: circuit.circuit_name,
            aggregated_wash_summary: circuit.aggregated_wash
        });

        // Aggregate at district level
        const currentDistrictWashData = districts[circuit.district_id].circuits.flatMap(c => 
            c.aggregated_wash_summary ? Object.keys(c.aggregated_wash_summary).flatMap(key => 
                Array(c.aggregated_wash_summary[key].yes).fill({ survey_object: { [key]: true } }).concat(
                Array(c.aggregated_wash_summary[key].no).fill({ survey_object: { [key]: false } })
            )) : []
        );
        districts[circuit.district_id].aggregated_wash = aggregateWashIndicators(currentDistrictWashData);
    });
    return Object.values(districts);
}

async function getRegionLevelWashData(filters) {
    const districtData = await getDistrictLevelWashData(filters);
    const regions = {};

    districtData.forEach(district => {
        if (!regions[district.region_id]) {
            regions[district.region_id] = {
                region_id: district.region_id,
                region_name: district.region_name,
                districts: [],
                aggregated_wash: {}
            };
        }
        regions[district.region_id].districts.push({
            district_id: district.district_id,
            district_name: district.district_name,
            aggregated_wash_summary: district.aggregated_wash
        });

        // Aggregate at region level
        const currentRegionWashData = regions[district.region_id].districts.flatMap(d => 
            d.aggregated_wash_summary ? Object.keys(d.aggregated_wash_summary).flatMap(key => 
                Array(d.aggregated_wash_summary[key].yes).fill({ survey_object: { [key]: true } }).concat(
                Array(d.aggregated_wash_summary[key].no).fill({ survey_object: { [key]: false } })
            )) : []
        );
        regions[district.region_id].aggregated_wash = aggregateWashIndicators(currentRegionWashData);
    });
    return Object.values(regions);
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submission_id');
    const tableName = 'wash';

    if (!submissionId) {
        return NextResponse.json({ message: 'Submission ID is required' }, { status: 400 });
    }

    try {
        const [result] = await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [submissionId]);
        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Record not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error(`Error deleting from ${tableName} (ID: ${submissionId}):`, error);
        return NextResponse.json({ message: 'Error deleting data', error: error.message }, { status: 500 });
    }
}

