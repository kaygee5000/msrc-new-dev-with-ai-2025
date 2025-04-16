import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Sample questions as fallback if DB query fails
const sampleQuestions = [
  {
    id: 1,
    code: 'PGISA',
    thematicArea: 'Girls Pregnancy',
    questionText: 'LHow many girls are pregnant and are in your school?',
    inputType: 'numeric',
    required: true,
    helperText: 'Track the number of girls who are pregnant and still attending school.'
  },
  {
    id: 2,
    code: 'PGDOS',
    thematicArea: 'Girls Pregnancy',
    questionText: 'THow many of girls are pregnant from your school and are currently not attending school?',
    inputType: 'numeric',
    required: true,
    helperText: 'Track the number of girls out of school due to pregnancy.'
  },
  {
    id: 3,
    code: 'GDRTS',
    thematicArea: 'Girls Re-entry',
    questionText: 'How many of the girls in your school who dropped out due to pregnancy are now back to school after childbirth?',
    inputType: 'numeric',
    required: true,
    helperText: 'Track the number of dropped out pregnant girls returning after childbirth.'
  },
  {
    id: 4,
    code: 'PGRTS',
    thematicArea: 'Girls Re-entry',
    questionText: 'How many of your pregnant girls returned to school after childbirth?',
    inputType: 'numeric',
    required: true,
    helperText: 'Track the number of pregnant girls returning after childbirth.'
  },
  {
    id: 5,
    code: 'SAPIS',
    thematicArea: 'Support Services',
    questionText: 'What activities are undertaken at the school to support pregnant learners in school stay in school?',
    inputType: 'text',
    required: true,
    helperText: 'Track teacher and learner supported activities to create enabling environment.'
  },
  {
    id: 6,
    code: 'FAPDO',
    thematicArea: 'Support Services',
    questionText: 'What follow-up activities are being implemented by the school to engage girls who drop out of school due to pregnancy?',
    inputType: 'text',
    required: true,
    helperText: 'Track teacher follow-up activities to facilitate re-entry.'
  },
  {
    id: 7,
    code: 'PGOUT',
    thematicArea: 'Girls Pregnancy',
    questionText: 'What was the outcome of the pregnancy?',
    inputType: 'choice',
    options: ["Live birth", "Miscarriage", "Still birth", "Ongoing pregnancy"],
    required: true,
    helperText: 'Track pregnancy outcomes for better support and intervention planning.'
  }
];

export async function GET(request) {
  try {
    // Query the live database for pregnancy questions
    const [rows] = await db.query(`
      SELECT 
        id,
        code,
        thematic_areas AS thematicAreas,
        question AS questionText,
        objective AS helperText,
        indicator,
        question_type AS questionType,
        options,
        class_levels AS classLevels,
        frequency
      FROM 
        pregnancy_tracker_questions
      WHERE 
        JSON_CONTAINS(thematic_areas, '"girls_pregnancy"') 
        OR JSON_CONTAINS(thematic_areas, '"girls_reentry"')
        OR JSON_CONTAINS(thematic_areas, '"support_services"')
      ORDER BY 
        id ASC
    `);
    
    // If we got results, transform them to the format our frontend expects
    if (rows && rows.length > 0) {
      const transformedQuestions = rows.map(question => {
        // Parse JSON strings to JavaScript objects
        const thematicAreas = typeof question.thematicAreas === 'string' 
          ? JSON.parse(question.thematicAreas) 
          : question.thematicAreas;
        
        const options = question.options && typeof question.options === 'string'
          ? JSON.parse(question.options)
          : question.options;
        
        // Map question_type to inputType
        let inputType = 'text';
        if (question.questionType === 'open_ended_numeric') {
          inputType = 'numeric';
        } else if (question.questionType === 'close_ended_single_choice') {
          inputType = 'choice';
        }
        
        // Map the first thematic area to a more user-friendly format
        const thematicArea = thematicAreas && thematicAreas.length > 0
          ? thematicAreas[0].replace('girls_', 'Girls ').replace('_', ' ').replace(/^\w/, c => c.toUpperCase())
          : 'Other';
        
        // Prepare the transformed question object
        return {
          id: question.id,
          code: question.code,
          thematicArea,
          questionText: question.questionText,
          inputType,
          options: options,
          required: true, // Assuming all questions are required
          helperText: question.helperText
        };
      });
      
      return NextResponse.json(transformedQuestions, { status: 200 });
    }
    
    // Fallback to sample data if no questions found in database
    console.log('No questions found in database, using sample data');
    return NextResponse.json(sampleQuestions, { status: 200 });
  } catch (error) {
    console.error('Error fetching pregnancy questions from database:', error);
    
    // In case of database error, fallback to sample data
    console.log('Database error, falling back to sample data:', error);
    return NextResponse.json(sampleQuestions, { status: 200 });
  }
}