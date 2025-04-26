/*
 * API Route: /api/teachers/stats/route
 * Description: Provides statistics and aggregated data about teachers
 * Query Parameters:
 *   - districtId: Filter stats by district
 *   - schoolId: Filter stats by school
 *   - fromDate: Start date for time-based metrics (YYYY-MM-DD)
 *   - toDate: End date for time-based metrics (YYYY-MM-DD)
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('districtId');
    const schoolId = searchParams.get('schoolId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    const statsPromises = [];
    const queryParams = [];
    let whereClause = 'WHERE t.deleted_at IS NULL';
    
    // Add filters to where clause
    if (districtId) {
      whereClause += ' AND s.district_id = ?';
      queryParams.push(parseInt(districtId));
    }
    
    if (schoolId) {
      whereClause += ' AND t.current_school_id = ?';
      queryParams.push(parseInt(schoolId));
    }
    
    // Date range filter for transfers or other time-based metrics
    let dateRangeClause = '';
    if (fromDate) {
      dateRangeClause += ' AND tt.transfer_date >= ?';
      queryParams.push(fromDate);
    }
    
    if (toDate) {
      dateRangeClause += ' AND tt.transfer_date <= ?';
      queryParams.push(toDate);
    }
    
    // 1. Total teacher count
    const totalCountQuery = `
      SELECT COUNT(*) as total_teachers
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
    `;
    statsPromises.push(db.query(totalCountQuery, queryParams));
    
    // 2. Teachers by gender
    const genderDistributionQuery = `
      SELECT 
        gender,
        COUNT(*) as count
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
      GROUP BY gender
    `;
    statsPromises.push(db.query(genderDistributionQuery, queryParams));
    
    // 3. Teachers by qualification
    const qualificationDistributionQuery = `
      SELECT 
        qualification,
        COUNT(*) as count
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
      GROUP BY qualification
    `;
    statsPromises.push(db.query(qualificationDistributionQuery, queryParams));
    
    // 4. Headteacher count
    const headteacherCountQuery = `
      SELECT 
        COUNT(*) as total_headteachers
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
      AND t.is_headteacher = 1
    `;
    statsPromises.push(db.query(headteacherCountQuery, queryParams));
    
    // 5. Teachers by status
    const statusDistributionQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
      GROUP BY status
    `;
    statsPromises.push(db.query(statusDistributionQuery, queryParams));
    
    // 6. Teachers by rank
    const rankDistributionQuery = `
      SELECT 
        rank,
        COUNT(*) as count
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      ${whereClause}
      GROUP BY rank
    `;
    statsPromises.push(db.query(rankDistributionQuery, queryParams));
    
    // 7. Recent transfers (if teacher_transfers table exists)
    // Use a try-catch as this table might not exist yet
    let recentTransfers = [];
    try {
      const transfersQuery = `
        SELECT 
          tt.id,
          tt.teacher_id,
          CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
          fs.name as from_school,
          ts.name as to_school,
          tt.transfer_date,
          tt.reason
        FROM teacher_transfers tt
        JOIN teachers t ON tt.teacher_id = t.id
        LEFT JOIN schools fs ON tt.from_school_id = fs.id
        LEFT JOIN schools ts ON tt.to_school_id = ts.id
        WHERE t.deleted_at IS NULL
        ${dateRangeClause}
        ORDER BY tt.transfer_date DESC
        LIMIT 50
      `;
      
      const [transfers] = await db.query(transfersQuery, queryParams);
      recentTransfers = transfers;
    } catch (error) {
      console.warn('Could not fetch teacher transfers. Table might not exist.', error);
    }
    
    // 8. Schools without headteachers
    const schoolsWithoutHeadteachersQuery = `
      SELECT 
        s.id, 
        s.name,
        d.name as district_name
      FROM schools s
      JOIN districts d ON s.district_id = d.id
      WHERE s.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM teachers t 
        WHERE t.current_school_id = s.id 
        AND t.is_headteacher = 1
        AND t.deleted_at IS NULL
      )
    `;
    statsPromises.push(db.query(schoolsWithoutHeadteachersQuery));
    
    // Execute all queries in parallel
    const [
      [totalCount],
      [genderDistribution],
      [qualificationDistribution],
      [headteacherCount],
      [statusDistribution],
      [rankDistribution],
      [schoolsWithoutHeadteachers]
    ] = await Promise.all(statsPromises);
    
    // Format response
    const statistics = {
      total_teachers: totalCount[0].total_teachers,
      total_headteachers: headteacherCount[0].total_headteachers,
      gender_distribution: genderDistribution,
      qualification_distribution: qualificationDistribution,
      status_distribution: statusDistribution,
      rank_distribution: rankDistribution,
      schools_without_headteachers: schoolsWithoutHeadteachers,
      recent_transfers: recentTransfers
    };
    
    return NextResponse.json({
      status: 'success',
      statistics
    });
    
  } catch (error) {
    console.error('Error fetching teacher statistics:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch teacher statistics', details: error.message },
      { status: 500 }
    );
  }
}