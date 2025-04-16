import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Sample system configuration as fallback if DB query fails
const sampleConfig = {
  currentAcademicTerm: "Term 2 - 2024/2025",
  submissionFrequency: "termly"
};

export async function GET(request) {
  try {
    // Fetch academic terms from the latest_student_enrolments table
    const [termRows] = await db.query(`
      SELECT DISTINCT 
        term, 
        week_number,
        year 
      FROM 
        field_msrcghana_db.latest_student_enrolments
      ORDER BY 
        year DESC, 
        term DESC, 
        week_number DESC
      LIMIT 10
    `);
    
    if (termRows && termRows.length > 0) {
      // Format the academic terms
      const academicTerms = termRows.map(row => {
        return {
          id: `${row.term}-${row.week_number}-${row.year}`,
          label: `Term ${row.term} ${row.week_number ? '(Week ' + row.week_number + ')' : ''} - ${row.year}`,
          term: row.term,
          week: row.week_number,
          year: row.year
        };
      });
      
      // Get the most recent term as current
      const currentAcademicTerm = academicTerms[0]?.label || sampleConfig.currentAcademicTerm;
      
      // Return the formatted config
      const configObject = {
        currentAcademicTerm,
        availableTerms: academicTerms,
        submissionFrequency: "termly"
      };
      
      return NextResponse.json(configObject, { status: 200 });
    }
    
    // Fallback to sample config if no terms found
    console.log('No academic terms found in database, using sample config');
    return NextResponse.json(sampleConfig, { status: 200 });
  } catch (error) {
    console.error('Error fetching system configuration from database:', error);
    
    // In case of database error, fallback to sample config
    console.log('Database error, falling back to sample config');
    return NextResponse.json(sampleConfig, { status: 200 });
  }
}