// src/app/api/school-report/grounds/sanitation/route.js
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

    const tableName = 'school_sanitations';
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

    console.log("Query in sanitation: ", query, queryParams);
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
                    aggregatedData = await getCircuitLevelSanitationData(filters);
                    break;
                case 'district':
                    aggregatedData = await getDistrictLevelSanitationData(filters);
                    break;
                case 'region':
                    aggregatedData = await getRegionLevelSanitationData(filters);
                    break;
                default:
                    return NextResponse.json({ message: 'Invalid aggregation level specified.' }, { status: 400 });
            }
            return NextResponse.json(aggregatedData);
        }
    } catch (error) {
        console.error('Error fetching sanitation data:', error);
        return NextResponse.json({ message: 'Error fetching data', error: error.message }, { status: 500 });
    }
}

async function getSchoolSanitationDataForAggregation(filters) {
  // This function will fetch raw school sanitation data needed for aggregation
  // Similar to the original query but might need adjustments for broader fetching
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
      ss.sanitation_data_object
    FROM 
      school_sanitations ss
    JOIN 
      schools s ON ss.school_id = s.id
    JOIN 
      circuits c ON s.circuit_id = c.id
    JOIN 
      districts d ON c.district_id = d.id
    JOIN 
      regions r ON d.region_id = r.id
    WHERE 
      ss.year = ? AND ss.term = ?
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
  console.log("Results in sanitation: ", results);
  return results.map(row => {
    let parsedSanitationData = [];
    if (row.sanitation_data_object) {
      if (typeof row.sanitation_data_object === 'string') {
        try {
          parsedSanitationData = JSON.parse(row.sanitation_data_object);
        } catch (parseError) {
          console.error('Failed to parse sanitation_data_object string:', parseError, 'Raw data:', row.sanitation_data_object);
          // Fallback to empty array or handle error as appropriate
          parsedSanitationData = []; 
        }
      } else if (typeof row.sanitation_data_object === 'object') {
        // It's already an object (hopefully an array as expected)
        parsedSanitationData = Array.isArray(row.sanitation_data_object) ? row.sanitation_data_object : [];
      } else {
        console.warn('sanitation_data_object is of unexpected type:', typeof row.sanitation_data_object, 'Raw data:', row.sanitation_data_object);
        parsedSanitationData = [];
      }
    } else {
        // If sanitation_data_object is null or undefined, default to empty array
        parsedSanitationData = [];
    }
    return { ...row, sanitation_data_object: parsedSanitationData };
  });
}

function aggregateSanitationItems(items) {
    const aggregated = {};
    items.forEach(item => {
        const { measure_item, status } = item;
        if (!aggregated[measure_item]) {
            aggregated[measure_item] = { total: 0, statuses: {} };
        }
        aggregated[measure_item].total++;
        aggregated[measure_item].statuses[status] = (aggregated[measure_item].statuses[status] || 0) + 1;
    });
    return aggregated;
}

async function getCircuitLevelSanitationData(filters) {
    const schoolsData = await getSchoolSanitationDataForAggregation(filters);
    console.log("Schools data in sanitation: ", schoolsData);
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
                aggregated_sanitation: {}
            };
        }
        const schoolSanitationSummary = aggregateSanitationItems(school.sanitation_data_object);
       
        console.log("School sanitation summary in sanitation: ", schoolSanitationSummary);
        circuits[school.circuit_id].schools.push({
            school_id: school.school_id,
            school_name: school.school_name,
            sanitation_summary: schoolSanitationSummary // Store per-school summary
        });

        // Aggregate at circuit level
        school.sanitation_data_object.forEach(item => {
            const { measure_item, status } = item;
            const agg = circuits[school.circuit_id].aggregated_sanitation;
            if (!agg[measure_item]) {
                agg[measure_item] = { total: 0, statuses: {} };
            }
            agg[measure_item].total++;
            agg[measure_item].statuses[status] = (agg[measure_item].statuses[status] || 0) + 1;
        });
    });
    return Object.values(circuits);
}

async function getDistrictLevelSanitationData(filters) {
    const circuitData = await getCircuitLevelSanitationData(filters); // Reuse circuit aggregation
    const districts = {};

    circuitData.forEach(circuit => {
        if (!districts[circuit.district_id]) {
            districts[circuit.district_id] = {
                district_id: circuit.district_id,
                district_name: circuit.district_name,
                region_id: circuit.region_id,
                region_name: circuit.region_name,
                circuits: [],
                aggregated_sanitation: {}
            };
        }
        districts[circuit.district_id].circuits.push({
            circuit_id: circuit.circuit_id,
            circuit_name: circuit.circuit_name,
            // schools: circuit.schools, // Optionally include detailed school list
            aggregated_sanitation_summary: circuit.aggregated_sanitation // Store per-circuit summary
        });

        // Aggregate at district level from circuit aggregates
        Object.entries(circuit.aggregated_sanitation).forEach(([measure_item, item_data]) => {
            const agg = districts[circuit.district_id].aggregated_sanitation;
            if (!agg[measure_item]) {
                agg[measure_item] = { total: 0, statuses: {} };
            }
            agg[measure_item].total += item_data.total;
            Object.entries(item_data.statuses).forEach(([status, count]) => {
                agg[measure_item].statuses[status] = (agg[measure_item].statuses[status] || 0) + count;
            });
        });
    });
    return Object.values(districts);
}

async function getRegionLevelSanitationData(filters) {
    const districtData = await getDistrictLevelSanitationData(filters); // Reuse district aggregation
    const regions = {};

    districtData.forEach(district => {
        if (!regions[district.region_id]) {
            regions[district.region_id] = {
                region_id: district.region_id,
                region_name: district.region_name,
                districts: [],
                aggregated_sanitation: {}
            };
        }
        regions[district.region_id].districts.push({
            district_id: district.district_id,
            district_name: district.district_name,
            // circuits: district.circuits, // Optionally include detailed circuit list
            aggregated_sanitation_summary: district.aggregated_sanitation // Store per-district summary
        });

        // Aggregate at region level from district aggregates
        Object.entries(district.aggregated_sanitation).forEach(([measure_item, item_data]) => {
            const agg = regions[district.region_id].aggregated_sanitation;
            if (!agg[measure_item]) {
                agg[measure_item] = { total: 0, statuses: {} };
            }
            agg[measure_item].total += item_data.total;
            Object.entries(item_data.statuses).forEach(([status, count]) => {
                agg[measure_item].statuses[status] = (agg[measure_item].statuses[status] || 0) + count;
            });
        });
    });
    return Object.values(regions);
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submission_id');
    const tableName = 'school_sanitations';

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
