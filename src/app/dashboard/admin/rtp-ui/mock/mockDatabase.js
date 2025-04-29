// AUTO-GENERATED MOCK DATA FOR RTP DASHBOARD DEMO
// Using real region, district, school, teacher names from dummydata generated.json
// Using real questions from rtp_indicator_questions.md

export const teachers = [
  { id: 1, name: 'KYEREH CLEMENT', staff_number: '1436636', region: 'BONO', district: 'JAMAN NORTH', circuit: 'GOKA', school: 'ASANTEKROM D/A PRIMARY' },
  { id: 2, name: 'BOATENG LINDA', staff_number: '784242', region: 'BONO', district: 'BEREKUM WEST', circuit: 'NSAPOR', school: 'NSAPOR METHODIST BASIC' },
  { id: 3, name: 'Enyam Mary', staff_number: '189040', region: 'ASHANTI', district: 'OBUASI EAST', circuit: 'KWABENAKWA', school: "POMPOSO R/C PRIMARY 'A'" },
  { id: 4, name: 'AKATA DANIELS REGINA', staff_number: '156739', region: 'OTI', district: 'BIAKOYE', circuit: 'WORAWORA', school: 'AKPOSO KABO R.C KG & PRIMARY SCHOOL' },
  { id: 5, name: 'MARTEY GLORIA', staff_number: '1428913', region: 'ASHANTI', district: 'AMANSIE WEST', circuit: 'PAKYI', school: 'PAKYI NO. 1 DA KG & PRIMARY' },
  // ...add more from your JSON as needed
];

// SCHOOL OUTPUT QUESTIONS (from mobile app)
export const questions_school_output = [
  { id: 1, question: 'Number of MALE Teacher Champions/Curriculum Leads who have received training on LtP by the District Teacher Support Team (DTST)', type: 'number' },
  { id: 2, question: 'Number of FEMALE Teacher Champions/Curriculum Leads who have received training on LtP by the District Teacher Support Team (DTST)', type: 'number' },
  { id: 3, question: 'Number of Training provided or organised this term through INSET', type: 'number' },
  { id: 4, question: 'Number of MALE teachers Trained in PBL and Safe School Environment', type: 'number' },
  { id: 5, question: 'Number of FEMALE teachers Trained in PBL and Safe School Environment', type: 'number' },
  { id: 6, question: 'Number of MALE teachers Trained in Early Childhood Education (ECE)', type: 'number' },
  { id: 7, question: 'Number of FEMALE teachers Trained in Early Childhood Education (ECE)', type: 'number' },
  { id: 8, question: 'Number of MALE teachers Trained in any other form of training', type: 'number' },
  { id: 9, question: 'Number of FEMALE teachers Trained in any other form of training', type: 'number' },
  { id: 10, question: 'Number of Male teachers in the school who have receive no training', type: 'number' },
  { id: 11, question: 'Number of FEMALE teachers in the school who have receive no training', type: 'number' },
  { id: 12, question: 'Number of BOYS enrolled', type: 'number' },
  { id: 13, question: 'Number of GIRLs enrolled', type: 'number' },
  { id: 14, question: 'Total number of BOYs with Special Needs/disabilities', type: 'number' },
  { id: 15, question: 'Total number of GIRLS with special needs/disabilities', type: 'number' },
  { id: 16, question: 'Number of coaching and mentoring support visits to your school this term', type: 'number' },
  { id: 17, question: 'Total number of MALE teachers who went on transfer (term/year)', type: 'number' },
  { id: 18, question: 'Total number of Female teachers who went on transfer (term/year)', type: 'number' }
];

// Generate plausible mock answers for each teacher and all school output questions
export const answers_school_output = teachers.flatMap((teacher) => 
  questions_school_output.map((question) => ({
    id: teacher.id * 100 + question.id,
    question_id: question.id,
    teacher_id: teacher.id,
    school: teacher.school,
    district: teacher.district,
    region: teacher.region,
    answer: generateMockAnswer(question.id, question.type)
  }))
);

// DISTRICT OUTPUT QUESTIONS
export const questions_district_output = [
  { id: 1, question: 'Number of District teacher support teams supported to develop teacher training plans for integration at school level CPD in 48 districts', type: 'number' },
  { id: 2, question: 'Number of trainings provided to District teacher support teams', type: 'number' },
  { id: 3, question: 'Number of district support teams\'s members trained with RTP staff support', type: 'number' },
  { id: 4, question: 'Number of Districts who in collaboration with district education officials have developed coaching and mentoring plan for 55 districts (3 regions)', type: 'number' },
  { id: 5, question: 'Number of District Teacher Support Teams (DST) trained in coaching and mentoring and school leadership in 55 districts', type: 'number' },
  { id: 6, question: 'Number of DTST members (M/F) trained in coaching and mentoring and school leadership in the 55 districts (disaggregated by type of training)', type: 'number' },
  { id: 7, question: 'Number of districts provided with financial support to conduct regular coaching and mentoring to trained teachers and support to schools - to 55 partner districts (DST)', type: 'number' },
  { id: 8, question: 'Number of Quarterly district planning and review meetings held with each of the 55 districts to gather updates, challenges and lessons (GALOP)', type: 'number' },
  { id: 9, question: 'Number of district officials attending the District planning and review meetings (disaggregated by sex)', type: 'number' },
  { id: 10, question: 'Number of schools visited in each quarter in the 55 districts to gather updates, challenges and lessons', type: 'number' },
  { id: 11, question: 'Number of Trainers (M/F) from 55 District Support Teams trained on the integration of LtP (15 trainers X 55 districts', type: 'number' },
  { id: 12, question: 'Number of quarterly planning and review meetings including monitoring and supervision visits conducted with national level GES', type: 'number' },
  { id: 13, question: 'Number of people attending the national planning and review meetings (disaggregated by category)', type: 'number' }
];

// Generate mock district output answers
const uniqueDistricts = [...new Set(teachers.map(t => t.district))];
export const answers_district_output = uniqueDistricts.flatMap((district) => 
  questions_district_output.map((question) => ({
    id: uniqueDistricts.indexOf(district) * 100 + question.id,
    question_id: question.id,
    district: district,
    region: teachers.find(t => t.district === district)?.region || '',
    answer: generateMockAnswer(question.id, question.type, 'district')
  }))
);

// CONSOLIDATED CHECKLIST QUESTIONS
export const questions_consolidated_checklist = [
  { id: 1, question: 'Level of Intervention', type: 'select', options: ['GALOP', 'Direct', 'Indirect'] },
  { id: 2, question: 'Full Name of Assessor', type: 'text' },
  { id: 3, question: 'Designation', type: 'text' },
  { id: 4, question: 'GPS of school', type: 'gps' },
  { id: 5, question: 'Region', type: 'select' },
  { id: 6, question: 'District', type: 'select' },
  { id: 7, question: 'Circuit', type: 'select' },
  { id: 8, question: 'Name of the School', type: 'select' },
  { id: 9, question: 'Level of School', type: 'select', options: ['Kindergarten', 'Primary'] },
  { id: 10, question: 'Academic Year', type: 'select' },
  { id: 11, question: 'Term', type: 'select' },
  { id: 12, question: 'Date of Assessment', type: 'date' },
  { id: 13, question: 'Number of Male Teachers Present', type: 'number' },
  { id: 14, question: 'Number of Female Teachers Present', type: 'number' },
  { id: 15, question: 'Number of Boys in Class', type: 'number' },
  { id: 16, question: 'Number of Girls in Class', type: 'number' },
  { id: 17, question: 'Does the school have an implementation plan such as documented/written plans on how Learning through Play (LtP) will be implemented (integrated into teaching practice) in their schools?', type: 'select', options: ['Yes', 'No'] },
  { id: 18, question: 'Does the school have written plans for implementing LtP?', type: 'select', options: ['Yes', 'No'] },
  { id: 19, question: 'Does the school has teachers\' who have prepared Lesson/learner plans that include LtP activities?', type: 'select', options: ['Yes', 'No'] },
  { id: 20, question: 'Are the teachers in the school trained in LTP Pedagogies (CoTT) modules.', type: 'select', options: ['Yes', 'No'] }
  // Additional questions can be added as needed
];

// Generate mock consolidated checklist answers
export const answers_consolidated_checklist = teachers.flatMap((teacher) => 
  questions_consolidated_checklist.map((question) => ({
    id: teacher.id * 100 + question.id,
    question_id: question.id,
    school: teacher.school,
    district: teacher.district,
    region: teacher.region,
    circuit: teacher.circuit,
    answer: generateMockAnswer(question.id, question.type, 'checklist')
  }))
);

// PARTNERS IN PLAY QUESTIONS
export const questions_pip = [
  { id: 1, question: 'Enumerator Name', type: 'text' },
  { id: 2, question: 'Level of intervention', type: 'select', options: ['GALOP', 'Direct', 'Indirect'] },
  { id: 3, question: 'GPS Location', type: 'gps' },
  { id: 4, question: 'In which region are you filling out this form?', type: 'select' },
  { id: 5, question: 'Name of District', type: 'select' },
  { id: 6, question: 'Name of Circuit', type: 'select' },
  { id: 7, question: 'Name of school', type: 'select' },
  { id: 8, question: 'Academic Year', type: 'text' },
  { id: 9, question: 'Term', type: 'select', options: ['First', 'Second', 'Third'] },
  { id: 10, question: 'Date of the Lesson Observation', type: 'date' },
  { id: 11, question: 'Full Name of the Teacher Observed', type: 'select' },
  { id: 12, question: 'Grade (Class)', type: 'select', options: ['KG1', 'KG2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6'] },
  { id: 13, question: 'Topic (Strand)', type: 'select' },
  { id: 14, question: 'Sub Topic/Sub Strand', type: 'text' },
  { id: 15, question: 'Reference Material', type: 'text' },
  { id: 16, question: 'Planned Time', type: 'text' },
  { id: 17, question: 'Activity Type', type: 'select', options: ['Demonstration Lesson', 'Peer Teaching'] },
  { id: 18, question: 'Sex of the Teacher', type: 'select', options: ['Male', 'Female'] },
  { id: 19, question: 'Has the teacher received training from RTP?', type: 'select', options: ['Yes', 'No'] },
  { id: 20, question: 'Subject taught in this lesson observation', type: 'select' },
  { id: 21, question: 'Language teacher used during lesson observation', type: 'multiselect', options: ['English', 'Ga', 'Dagbani', 'Ewe', 'Twi', 'Dangme', 'Other'] },
  { id: 22, question: 'Number of Girls Present', type: 'number' },
  { id: 23, question: 'Number of boys Present', type: 'number' },
  { id: 24, question: 'Number of Girls with special needs/disability present', type: 'number' },
  { id: 25, question: 'Number of Boys with special needs/disability present', type: 'number' },
  { id: 26, question: 'Are there sufficient tables and chairs for boys and girls?', type: 'select', options: ['Yes, equal distribution', 'More boys have tables and chairs', 'More girls have tables and chairs', 'No, tables and chairs are not sufficient for both girls and boys'] },
  { id: 27, question: 'Are there sufficient textbooks for boys and girls?', type: 'select', options: ['Yes, equal distribution', 'More boys have textbooks', 'More girls have textbooks', 'No, textbooks are not sufficient for both girls and boys', 'No textbooks at all'] },
  { id: 28, question: 'Are boys and girls distributed around the classroom?', type: 'select', options: ['Yes', 'No, boys are with boys and girls are with girls', 'No, girls sit in front and boys at the back', 'No, boys sit in front and girls at the back'] },
  { id: 29, question: 'Is there a learner plan with clear performance indicator available when requested from teacher?', type: 'select', options: ['Learner plan available with performance indicator', 'Learner plan available but no performance indicator', 'No learner plan available'] },
  { id: 30, question: 'Are performance indicators SMART and relevant to topics?', type: 'select', options: ['Performance indicators are irrelevant to topics/subtopics', 'Performance indicators are relevant to topics/sub-topics but generally in abstract terms', 'Performance indicators are clear and SMART, but NOT related to evaluations which are stated in lesson plan', 'Performance indicators are clear and SMART, and related to evaluations which are stated in lesson plan', 'Performance indicators s are clear and SMART and include at least 2 profile dimensions in the syllabus. (knowledge, understanding, application, process skills and attitudes)'] }
  // Additional questions can be added as needed
];

// Generate mock partners in play answers
export const answers_pip = teachers.flatMap((teacher) => 
  questions_pip.map((question) => ({
    id: teacher.id * 100 + question.id,
    question_id: question.id,
    teacher_id: teacher.id,
    school: teacher.school,
    district: teacher.district,
    region: teacher.region,
    circuit: teacher.circuit,
    answer: generateMockAnswer(question.id, question.type, 'pip')
  }))
);

// Helper function to generate plausible mock answers based on question type
function generateMockAnswer(questionId, type, surveyType = 'school') {
  switch (type) {
    case 'number':
      // Generate different ranges based on question context
      if (questionId <= 2) return Math.floor(Math.random() * 5 + 1).toString(); // 1-5 for champions
      if (questionId >= 12 && questionId <= 15) return Math.floor(Math.random() * 50 + 20).toString(); // 20-70 for enrollment
      if (questionId >= 22 && questionId <= 25 && surveyType === 'pip') return Math.floor(Math.random() * 30 + 15).toString(); // 15-45 for class size
      return Math.floor(Math.random() * 10 + 1).toString(); // 1-10 for other numbers
    
    case 'select':
      if (questionId === 1 && surveyType === 'checklist') {
        const options = ['GALOP', 'Direct', 'Indirect'];
        return options[Math.floor(Math.random() * options.length)];
      }
      if (questionId === 9 && surveyType === 'checklist') {
        return Math.random() > 0.6 ? 'Primary' : 'Kindergarten';
      }
      if (questionId === 17 || questionId === 18 || questionId === 19 || questionId === 20) {
        return Math.random() > 0.3 ? 'Yes' : 'No'; // 70% Yes for implementation questions
      }
      if (questionId === 26 || questionId === 27 || questionId === 28) {
        const options = ['Yes, equal distribution', 'More boys have tables and chairs', 'More girls have tables and chairs', 'No, tables and chairs are not sufficient for both girls and boys'];
        return options[Math.floor(Math.random() * options.length)];
      }
      // Default for other select questions
      return Math.random() > 0.5 ? 'Yes' : 'No';
    
    case 'text':
      if (questionId === 2 && surveyType === 'checklist') return 'Education Officer';
      if (questionId === 1 && surveyType === 'pip') return 'John Doe';
      return 'Sample text response';
    
    case 'date':
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setMonth(today.getMonth() - Math.floor(Math.random() * 3));
      return pastDate.toISOString().split('T')[0];
    
    case 'gps':
      // Generate random GPS coordinates in Ghana
      const lat = 5.5 + Math.random() * 5.5; // Between 5.5 and 11 (Ghana latitude range)
      const lng = -3.5 + Math.random() * 3; // Between -3.5 and -0.5 (Ghana longitude range)
      return `${lat.toFixed(6)},${lng.toFixed(6)}`;
    
    case 'multiselect':
      if (questionId === 21) {
        const languages = ['English', 'Twi'];
        if (Math.random() > 0.7) languages.push('Ga');
        if (Math.random() > 0.8) languages.push('Ewe');
        return languages.join(',');
      }
      return 'Option A,Option B';
    
    default:
      return 'N/A';
  }
}
