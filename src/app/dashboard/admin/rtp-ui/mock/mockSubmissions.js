// Import real data from mockDatabase
import { 
  teachers, 
  questions_school_output, 
  answers_school_output,
  questions_district_output,
  answers_district_output,
  questions_consolidated_checklist,
  answers_consolidated_checklist,
  questions_pip,
  answers_pip
} from './mockDatabase';

// Helper to generate random dates within the last 3 months
const generateRandomDate = () => {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - Math.floor(Math.random() * 90)); // Random day in last 90 days
  const hours = Math.floor(Math.random() * 12) + 8; // Between 8am and 8pm
  const minutes = Math.floor(Math.random() * 60);
  pastDate.setHours(hours, minutes, 0);
  return pastDate.toISOString();
};

// Generate mock submissions for school output surveys
export const schoolOutputSubmissions = answers_school_output.map((answer, index) => {
  const teacher = teachers.find(t => t.id === answer.teacher_id);
  const question = questions_school_output.find(q => q.id === answer.question_id);
  
  return {
    id: 1000 + index,
    teacher: teacher.name,
    school: teacher.school,
    district: teacher.district,
    region: teacher.region,
    circuit: teacher.circuit,
    itinerary: `Term ${Math.floor(Math.random() * 3) + 1} 2025`,
    survey_type: 'school_output',
    question_id: question.id,
    question_text: question.question,
    answer: answer.answer,
    submitted_at: generateRandomDate()
  };
});

// Generate mock submissions for district output surveys
export const districtOutputSubmissions = answers_district_output.map((answer, index) => {
  const question = questions_district_output.find(q => q.id === answer.question_id);
  
  return {
    id: 2000 + index,
    district: answer.district,
    region: answer.region,
    itinerary: `Term ${Math.floor(Math.random() * 3) + 1} 2025`,
    survey_type: 'district_output',
    question_id: question.id,
    question_text: question.question,
    answer: answer.answer,
    submitted_at: generateRandomDate()
  };
});

// Generate mock submissions for consolidated checklist
export const consolidatedChecklistSubmissions = answers_consolidated_checklist.map((answer, index) => {
  const question = questions_consolidated_checklist.find(q => q.id === answer.question_id);
  
  return {
    id: 3000 + index,
    school: answer.school,
    district: answer.district,
    region: answer.region,
    circuit: answer.circuit,
    itinerary: `Term ${Math.floor(Math.random() * 3) + 1} 2025`,
    survey_type: 'consolidated_checklist',
    question_id: question.id,
    question_text: question.question,
    answer: answer.answer,
    submitted_at: generateRandomDate()
  };
});

// Generate mock submissions for partners in play
export const partnersInPlaySubmissions = answers_pip.map((answer, index) => {
  const teacher = teachers.find(t => t.id === answer.teacher_id);
  const question = questions_pip.find(q => q.id === answer.question_id);
  
  return {
    id: 4000 + index,
    teacher: teacher.name,
    school: teacher.school,
    district: teacher.district,
    region: teacher.region,
    circuit: teacher.circuit,
    itinerary: `Term ${Math.floor(Math.random() * 3) + 1} 2025`,
    survey_type: 'partners_in_play',
    question_id: question.id,
    question_text: question.question,
    answer: answer.answer,
    submitted_at: generateRandomDate()
  };
});

// Export the generateRandomDate function for use in other mock data files
export { generateRandomDate };

// Combine all submissions and sort by date (most recent first)
export const mockSubmissions = [
  ...schoolOutputSubmissions,
  ...districtOutputSubmissions,
  ...consolidatedChecklistSubmissions,
  ...partnersInPlaySubmissions
].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

// For performance reasons, limit to the most recent 200 submissions
export const recentMockSubmissions = mockSubmissions.slice(0, 200);
