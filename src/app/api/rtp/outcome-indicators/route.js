import { NextResponse } from 'next/server';
import { calculateAllOutcomeIndicators } from '@/utils/rtpCalculations';

// Question ID mappings based on the database
const QUESTION_MAPPINGS = {
  // School Output questions
  boysEnrolledQuestion: 12,
  girlsEnrolledQuestion: 13,
  
  // Consolidated Checklist questions
  implementationPlanQuestion: 17,
  developmentPlanQuestion: 18,
  lessonPlanQuestion: 19,
  
  // Partners in Play questions for learning environments
  friendlyToneQuestion: 43,
  acknowledgingEffortQuestion: 44,
  pupilParticipationQuestion: 45,
  
  // Partners in Play questions for teacher skills
  teacherSkillQ29: 29,
  teacherSkillQ30: 30,
  teacherSkillQ31: 31,
  teacherSkillQ32: 32,
  teacherSkillQ33: 33,
  teacherSkillQ39: 39,
  teacherSkillQ45: 45,
  teacherSkillQ46: 46,
  teacherSkillQ48: 48,
  teacherSkillQ49: 49
};

/**
 * Calculate outcome indicators for a specific itinerary
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with calculated indicators
 */
export async function GET(req) {
  try {
    // Extract itinerary ID from the request URL
    const url = new URL(req.url);
    const itineraryId = url.searchParams.get('itineraryId');
    
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Missing required parameter: itineraryId' },
        { status: 400 }
      );
    }

    // Calculate all outcome indicators
    const indicators = await calculateAllOutcomeIndicators(itineraryId, QUESTION_MAPPINGS);
    
    return NextResponse.json({ 
      success: true, 
      data: indicators 
    });
  } catch (error) {
    console.error('Error calculating outcome indicators:', error);
    return NextResponse.json(
      { error: 'Failed to calculate outcome indicators' },
      { status: 500 }
    );
  }
}