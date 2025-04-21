import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  try {
    // Extract user info from request query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('role');
    const entityId = searchParams.get('entityId'); // region_id, district_id, or school_id

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'User ID and role are required', success: false }, { status: 400 });
    }

    let stats = {};
    let whereClauses = {};
    let joinClauses = {};

    // Set up query conditions based on user role
    switch(userRole) {
      case 'national':
        // National admin sees everything, no filters needed
        break;
      case 'regional':
        whereClauses.weekly = 'r.id = ?';
        whereClauses.termly = 'r.id = ?';
        joinClauses.weekly = `
          JOIN schools s ON wr.school_id = s.id
          JOIN districts d ON s.district_id = d.id
          JOIN regions r ON d.region_id = r.id
        `;
        joinClauses.termly = `
          JOIN schools s ON tr.school_id = s.id
          JOIN districts d ON s.district_id = d.id
          JOIN regions r ON d.region_id = r.id
        `;
        break;
      case 'district':
        whereClauses.weekly = 'd.id = ?';
        whereClauses.termly = 'd.id = ?';
        joinClauses.weekly = `
          JOIN schools s ON wr.school_id = s.id
          JOIN districts d ON s.district_id = d.id
        `;
        joinClauses.termly = `
          JOIN schools s ON tr.school_id = s.id
          JOIN districts d ON s.district_id = d.id
        `;
        break;
      case 'school':
        whereClauses.weekly = 's.id = ?';
        whereClauses.termly = 's.id = ?';
        joinClauses.weekly = `JOIN schools s ON wr.school_id = s.id`;
        joinClauses.termly = `JOIN schools s ON tr.school_id = s.id`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid user role', success: false }, { status: 400 });
    }

    // Weekly Reports Stats
    let weeklyQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        SUM(wr.boys_enrollment) as total_boys,
        SUM(wr.girls_enrollment) as total_girls,
        AVG(wr.boys_attendance_rate) as avg_boys_attendance,
        AVG(wr.girls_attendance_rate) as avg_girls_attendance,
        AVG(wr.facilitator_attendance_rate) as avg_facilitator_attendance
      FROM weekly_reports wr
    `;
    
    if (joinClauses.weekly) {
      weeklyQuery += joinClauses.weekly;
    }
    
    if (whereClauses.weekly && entityId) {
      weeklyQuery += ` WHERE ${whereClauses.weekly}`;
    }

    let params = [];
    if (whereClauses.weekly && entityId) {
      params.push(entityId);
    }

    const [weeklyStats] = await pool.query(weeklyQuery, params);
    stats.weekly = weeklyStats[0];

    // Termly Reports Stats
    let termlyQuery = `
      SELECT 
        COUNT(*) as total_submissions,
        AVG(tr.school_management_score) as avg_management_score,
        AVG(tr.school_grounds_score) as avg_grounds_score,
        AVG(tr.community_involvement_score) as avg_community_score
      FROM termly_reports tr
    `;
    
    if (joinClauses.termly) {
      termlyQuery += joinClauses.termly;
    }
    
    if (whereClauses.termly && entityId) {
      termlyQuery += ` WHERE ${whereClauses.termly}`;
    }

    params = [];
    if (whereClauses.termly && entityId) {
      params.push(entityId);
    }

    const [termlyStats] = await pool.query(termlyQuery, params);
    stats.termly = termlyStats[0];

    // Latest activity for this user's scope
    let activityQuery = `
      SELECT al.*, u.name as user_name, u.role
      FROM user_logs al
      JOIN users u ON al.user_id = u.id
    `;

    if (userRole !== 'national') {
      activityQuery += ` WHERE al.scope = ? AND al.entity_id = ?`;
      params = [userRole, entityId];
    }

    activityQuery += ` ORDER BY al.created_at DESC LIMIT 5`;

    const [activities] = await pool.query(activityQuery, params.length ? params : undefined);
    stats.activities = activities;

    return NextResponse.json({
      stats,
      success: true
    });
  } catch (error) {
    console.error('User dashboard stats error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}