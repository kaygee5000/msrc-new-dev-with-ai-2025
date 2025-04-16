import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Helper: Build WHERE clause for filters
function buildWhere({ regionId, districtId, circuitId, schoolId, term }) {
  const where = [];
  const params = [];
  if (regionId) {
    where.push('reg.id = ?');
    params.push(regionId);
  }
  if (districtId) {
    where.push('d.id = ?');
    params.push(districtId);
  }
  if (circuitId) {
    where.push('c.id = ?');
    params.push(circuitId);
  }
  if (schoolId) {
    where.push('s.id = ?');
    params.push(schoolId);
  }
  if (term) {
    where.push('r.academic_term = ?');
    params.push(term);
  }
  return { where: where.length ? 'WHERE ' + where.join(' AND ') : '', params };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const districtId = searchParams.get('districtId');
    const circuitId = searchParams.get('circuitId');
    const schoolId = searchParams.get('schoolId');
    const term = searchParams.get('term');
    const { where, params } = buildWhere({ regionId, districtId, circuitId, schoolId, term });

    // Codes for each summary metric (update as needed to match your DB)
    const codeInSchool = 'PGISA'; // Pregnant girls in school
    const codeOutOfSchool = 'PGDOS'; // Pregnant girls out of school
    const codeReentry = 'GDRTS'; // Re-entry count

    // Query for each metric
    const [inSchoolRows] = await db.query(`
      SELECT SUM(COALESCE(r.response_number, 0)) as total
      FROM field_msrcghana_db.pregnancy_responses_raw r
      JOIN field_msrcghana_db.schools s ON r.school_id = s.id
      JOIN field_msrcghana_db.districts d ON s.district_id = d.id
      JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
      JOIN field_msrcghana_db.regions reg ON d.region_id = reg.id
      JOIN field_msrcghana_db.pregnancy_tracker_questions q ON r.question_id = q.id
      ${where ? where + ' AND' : 'WHERE'} q.code = ?
    `, [...params, codeInSchool]);
    const [outOfSchoolRows] = await db.query(`
      SELECT SUM(COALESCE(r.response_number, 0)) as total
      FROM field_msrcghana_db.pregnancy_responses_raw r
      JOIN field_msrcghana_db.schools s ON r.school_id = s.id
      JOIN field_msrcghana_db.districts d ON s.district_id = d.id
      JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
      JOIN field_msrcghana_db.regions reg ON d.region_id = reg.id
      JOIN field_msrcghana_db.pregnancy_tracker_questions q ON r.question_id = q.id
      ${where ? where + ' AND' : 'WHERE'} q.code = ?
    `, [...params, codeOutOfSchool]);
    const [reentryRows] = await db.query(`
      SELECT SUM(COALESCE(r.response_number, 0)) as total
      FROM field_msrcghana_db.pregnancy_responses_raw r
      JOIN field_msrcghana_db.schools s ON r.school_id = s.id
      JOIN field_msrcghana_db.districts d ON s.district_id = d.id
      JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
      JOIN field_msrcghana_db.regions reg ON d.region_id = reg.id
      JOIN field_msrcghana_db.pregnancy_tracker_questions q ON r.question_id = q.id
      ${where ? where + ' AND' : 'WHERE'} q.code = ?
    `, [...params, codeReentry]);

    return NextResponse.json({
      inSchool: inSchoolRows[0]?.total || 0,
      outOfSchool: outOfSchoolRows[0]?.total || 0,
      reentry: reentryRows[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error fetching reentry summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
