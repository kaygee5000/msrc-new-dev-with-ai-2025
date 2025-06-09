// API route for fetching TVET hierarchical entities
import { getConnection } from '../../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'region';
    const parentId = searchParams.get('parentId');
    
    const connection = await getConnection();
    
    let query = '';
    let params = [];
    
    switch (level) {
      case 'region':
        query = `
          SELECT DISTINCT r.id, r.name
          FROM regions r
          JOIN schools s ON s.region_id = r.id
          JOIN tvet_tracker_responses ttr ON ttr.school_id = s.id
          ORDER BY r.name
        `;
        break;
        
      case 'district':
        query = `
          SELECT DISTINCT d.id, d.name
          FROM districts d
          JOIN schools s ON s.district_id = d.id
          JOIN tvet_tracker_responses ttr ON ttr.school_id = s.id
          ${parentId ? 'WHERE d.region_id = ?' : ''}
          ORDER BY d.name
        `;
        if (parentId) params.push(parentId);
        break;
        
      case 'circuit':
        query = `
          SELECT DISTINCT c.id, c.name
          FROM circuits c
          JOIN schools s ON s.circuit_id = c.id
          JOIN tvet_tracker_responses ttr ON ttr.school_id = s.id
          ${parentId ? 'WHERE c.district_id = ?' : ''}
          ORDER BY c.name
        `;
        if (parentId) params.push(parentId);
        break;
        
      case 'school':
        query = `
          SELECT DISTINCT s.id, s.name
          FROM schools s
          JOIN tvet_tracker_responses ttr ON ttr.school_id = s.id
          ${parentId ? 'WHERE s.circuit_id = ?' : ''}
          ORDER BY s.name
        `;
        if (parentId) params.push(parentId);
        break;
        
      default:
        return Response.json(
          { success: false, error: 'Invalid level specified' },
          { status: 400 }
        );
    }
    
    const [rows] = await connection.execute(query, params);
    
    const entities = rows.map(row => ({
      id: row.id,
      name: row.name
    }));
    
    return Response.json({
      success: true,
      level,
      entities
    });
    
  } catch (error) {
    console.error('TVET Hierarchy API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch TVET hierarchy data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
