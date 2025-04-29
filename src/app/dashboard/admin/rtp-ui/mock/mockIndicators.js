// Mock data for outcome and output indicators
import { 
  teachers, 
  answers_school_output, 
  questions_school_output,
  answers_district_output,
  questions_district_output,
  answers_consolidated_checklist,
  questions_consolidated_checklist,
  answers_pip,
  questions_pip 
} from './mockDatabase';

// Import utility functions for data handling
import { capPercentage, calculatePercentage } from '../utils/dataUtils';

// Helper functions for calculations
const sumAnswers = (answers, questionId) => {
  return answers
    .filter(a => a.question_id === questionId)
    .reduce((sum, a) => sum + Number(a.answer || 0), 0);
};

const countYesAnswers = (answers, questionId) => {
  return answers
    .filter(a => a.question_id === questionId && a.answer === 'Yes')
    .length;
};

// Calculate all output indicators from mock answers
function calcOutputIndicators() {
  // Create a comprehensive set of output indicators
  const outputIndicators = [];
  
  // Categorize questions by type
  const categorizeQuestion = (questionText) => {
    // Teacher capacity building questions
    if (questionText.includes('training') || 
        questionText.includes('trained') || 
        questionText.includes('capacity') || 
        questionText.includes('workshop')) {
      return 'teacher_capacity';
    }
    // Curriculum implementation questions
    else if (questionText.includes('curriculum') || 
             questionText.includes('lesson plan') || 
             questionText.includes('teaching material') || 
             questionText.includes('syllabus')) {
      return 'curriculum';
    }
    // Student engagement questions
    else if (questionText.includes('student') || 
             questionText.includes('learner') || 
             questionText.includes('participation') || 
             questionText.includes('attendance')) {
      return 'student_engagement';
    }
    // Default category
    return 'teacher_capacity';
  };
  
  // Process each output question and create an indicator
  questions_school_output.forEach(question => {
    // Group by region
    const by_region = {};
    const by_district = {};
    const by_school = {};
    const by_teacher = {};
    
    // Process answers for this question
    const relevantAnswers = answers_school_output.filter(a => a.question_id === question.id);
    
    // Group by region
    teachers.forEach(teacher => {
      const region = teacher.region;
      const district = teacher.district;
      const school = teacher.school;
      
      if (!by_region[region]) by_region[region] = 0;
      if (!by_district[district]) by_district[district] = 0;
      if (!by_school[school]) by_school[school] = 0;
      by_teacher[teacher.name] = 0;
      
      const answer = relevantAnswers.find(a => a.teacher_id === teacher.id);
      if (answer) {
        const value = Number(answer.answer || 0);
        by_region[region] += value;
        by_district[district] += value;
        by_school[school] += value;
        by_teacher[teacher.name] = value;
      }
    });
    
    // Calculate total
    const total = Object.values(by_region).reduce((sum, val) => sum + val, 0);
    
    // Create the indicator
    outputIndicators.push({
      id: `out${question.id}`,
      name: question.question,
      value: total,
      category: 'school_output',
      subcategory: categorizeQuestion(question.question),
      trend: Math.random() > 0.3 ? 'up' : 'down', // Random trend for demo
      breakdown: {
        by_region: Object.entries(by_region).map(([region, value]) => ({ region, value })),
        by_district: Object.entries(by_district).map(([district, value]) => ({ district, value })),
        by_school: Object.entries(by_school).map(([school, value]) => ({ school, value })),
        by_teacher: Object.entries(by_teacher).map(([teacher, value]) => ({ teacher, value }))
      },
      calculation_trace: [
        { step: 'Total responses', value: relevantAnswers.length },
        { step: 'Sum of all values', value: total },
        { step: 'Calculation', formula: 'Sum of all reported values', result: total }
      ]
    });
  });
  
  // Categorize district questions by type
  const categorizeDistrictQuestion = (questionText) => {
    // District support questions
    if (questionText.includes('support') || 
        questionText.includes('resource') || 
        questionText.includes('funding') || 
        questionText.includes('assistance')) {
      return 'district_support';
    }
    // Monitoring questions
    else if (questionText.includes('monitor') || 
             questionText.includes('evaluation') || 
             questionText.includes('assessment') || 
             questionText.includes('visit') ||
             questionText.includes('report')) {
      return 'monitoring';
    }
    // Default category
    return 'district_support';
  };
  
  // Add district output indicators
  questions_district_output.forEach(question => {
    // Group by region
    const by_region = {};
    const by_district = {};
    
    // Process answers for this question
    const relevantAnswers = answers_district_output.filter(a => a.question_id === question.id);
    
    relevantAnswers.forEach(answer => {
      const region = answer.region;
      const district = answer.district;
      
      if (!by_region[region]) by_region[region] = 0;
      if (!by_district[district]) by_district[district] = 0;
      
      const value = Number(answer.answer || 0);
      by_region[region] += value;
      by_district[district] += value;
    });
    
    // Calculate total
    const total = Object.values(by_region).reduce((sum, val) => sum + val, 0);
    
    // Create the indicator
    outputIndicators.push({
      id: `out_district_${question.id}`,
      name: question.question,
      value: total,
      category: 'district_output',
      subcategory: categorizeDistrictQuestion(question.question),
      trend: Math.random() > 0.3 ? 'up' : 'down', // Random trend for demo
      breakdown: {
        by_region: Object.entries(by_region).map(([region, value]) => ({ region, value })),
        by_district: Object.entries(by_district).map(([district, value]) => ({ district, value }))
      },
      calculation_trace: [
        { step: 'Total responses', value: relevantAnswers.length },
        { step: 'Sum of all values', value: total },
        { step: 'Calculation', formula: 'Sum of all reported values', result: total }
      ]
    });
  });
  
  return outputIndicators;
}

// Calculate all outcome indicators from mock answers according to client requirements
function calcOutcomeIndicators() {
  const outcomeIndicators = [];
  
  // 1. Total primary school enrollment (KG 1-Basic 6)
  // This comes from the core mSRC system, segregated by GALOP 13, GALOP 3, Direct, etc.
  const enrollmentData = calculateEnrollment();
  outcomeIndicators.push(enrollmentData);
  
  // 2. Primary School dropout rate
  const dropoutRateData = calculateDropoutRate();
  outcomeIndicators.push(dropoutRateData);
  
  // 3. Percentage of Schools with implementation plans
  // Formula: (Number of schools with implementation plans / Total number of schools reached) x 100
  // Data comes from Consolidated Checklist Outcome Question #17, all schools that answered YES
  const implementationPlansData = calculateImplementationPlansPercentage();
  outcomeIndicators.push(implementationPlansData);
  
  // 4. Percentage of schools that have school development plans that include LtP and/or holistic skills assessment
  // Formula: (Number of schools with development plans that include LtP or holistic skills / Total number of schools reached) x 100
  // Data comes from Consolidated Checklist Outcome Question #18, schools that uploaded a document
  const developmentPlansData = calculateDevelopmentPlansPercentage();
  outcomeIndicators.push(developmentPlansData);
  
  // 5. Number of Schools reached under that itinerary
  const schoolsReachedData = calculateSchoolsReached();
  outcomeIndicators.push(schoolsReachedData);
  
  // 6. Percentage of district officials that score satisfactorily (70% or higher) on tests of knowledge and skills
  // Display text only, no calculation needed
  const districtOfficialsData = {
    id: 'oi6',
    name: 'Percentage of district officials that score satisfactorily (70% or higher) on tests of knowledge and skills of coaching and mentoring on PBL (M/F)',
    value: 'N/A', // Not calculated as per requirements
    trend: null,
    breakdown: {},
    calculation_trace: [
      { step: 'Note', value: 'This indicator is displayed for reference only and is not calculated' }
    ]
  };
  outcomeIndicators.push(districtOfficialsData);
  
  // 7. Percentage of teachers with lessons plans that include LtP
  // Formula: (Number of teachers' lesson plans assessed to have included LtP / Total number of teachers' lesson plans assessed) x 100
  // Data comes from Consolidated Checklist Outcome Question #19
  const teacherLessonPlansData = calculateTeacherLessonPlansPercentage();
  outcomeIndicators.push(teacherLessonPlansData);
  
  // 8. Percentage learning environments that show evidence of LtP methods or manipulative
  // Formula: (Number of lessons that engage Learners in Child centered learning / Total number of lessons observed) x 100
  // Data comes from Partners in Play Questions 43, 44, and 45
  const ltpLearningEnvironmentsData = calculateLtPLearningEnvironments();
  outcomeIndicators.push(ltpLearningEnvironmentsData);
  
  // 9. Percentage of Teachers who have the skills to facilitate LtP in their learning environments
  // Formula: (Number of teachers observed who demonstrated LtP skills / Total number of teachers observed) x 100
  // Data comes from Partners in Play Questions 29, 30, 31, 32, 33, 39, 45, 46, 48, and 49
  const teachersWithLtPSkillsData = calculateTeachersWithLtPSkills();
  outcomeIndicators.push(teachersWithLtPSkillsData);
  
  return outcomeIndicators;
}

// Helper function to calculate primary school dropout rate
function calculateDropoutRate() {
  // Mock dropout rate data by region and district
  const by_region = {};
  const by_district = {};
  const by_school = {};
  
  // Initialize regions and districts
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { enrolled: 0, dropout: 0 };
    if (!by_district[district]) by_district[district] = { enrolled: 0, dropout: 0 };
    if (!by_school[school]) by_school[school] = { enrolled: 0, dropout: 0 };
  });
  
  // Calculate mock dropout numbers based on enrollment data
  // Using school output questions about enrollment and dropouts
  answers_school_output.forEach(answer => {
    if (answer.question_id === 12 || answer.question_id === 13) { // Enrollment questions
      const teacher = teachers.find(t => t.id === answer.teacher_id);
      if (teacher) {
        const region = teacher.region;
        const district = teacher.district;
        const school = teacher.school;
        const value = Number(answer.answer || 0);
        
        by_region[region].enrolled += value;
        by_district[district].enrolled += value;
        by_school[school].enrolled += value;
      }
    }
  });
  
  // Generate mock dropout data (around 3-8% of enrollment)
  Object.keys(by_region).forEach(region => {
    by_region[region].dropout = Math.round(by_region[region].enrolled * (0.03 + Math.random() * 0.05));
  });
  
  Object.keys(by_district).forEach(district => {
    by_district[district].dropout = Math.round(by_district[district].enrolled * (0.03 + Math.random() * 0.05));
  });
  
  Object.keys(by_school).forEach(school => {
    by_school[school].dropout = Math.round(by_school[school].enrolled * (0.03 + Math.random() * 0.05));
  });
  
  // Calculate total dropout rate
  const totalEnrolled = Object.values(by_region).reduce((sum, data) => sum + data.enrolled, 0);
  const totalDropout = Object.values(by_region).reduce((sum, data) => sum + data.dropout, 0);
  const dropoutRate = totalEnrolled > 0 ? (totalDropout / totalEnrolled) * 100 : 0;
  
  return {
    id: 'oi2',
    name: 'Primary School dropout rate',
    value: Number(dropoutRate.toFixed(1)),
    trend: 'down', // Lower dropout rate is better
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({
        region,
        value: data.enrolled > 0 ? Number(((data.dropout / data.enrolled) * 100).toFixed(1)) : 0
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({
        district,
        value: data.enrolled > 0 ? Number(((data.dropout / data.enrolled) * 100).toFixed(1)) : 0
      })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.enrolled > 0)
        .map(([school, data]) => ({
          school,
          value: Number(((data.dropout / data.enrolled) * 100).toFixed(1))
        }))
    },
    calculation_trace: [
      { step: 'Total enrollment', value: totalEnrolled },
      { step: 'Total dropouts', value: totalDropout },
      { step: 'Calculation', formula: `${totalDropout}/${totalEnrolled}*100`, result: Number(dropoutRate.toFixed(1)) }
    ]
  };
}

// Helper function to calculate teacher training percentage
function calculateTeacherTrainingPercentage() {
  let trainedCount = 0;
  const by_region = {};
  const by_district = {};
  const by_school = {};
  const by_teacher = {};
  
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { total: 0, trained: 0 };
    if (!by_district[district]) by_district[district] = { total: 0, trained: 0 };
    if (!by_school[school]) by_school[school] = { total: 0, trained: 0 };
    
    by_region[region].total++;
    by_district[district].total++;
    by_school[school].total++;
    
    const maleAns = answers_school_output.find(a => a.teacher_id === teacher.id && a.question_id === 1);
    const femaleAns = answers_school_output.find(a => a.teacher_id === teacher.id && a.question_id === 2);
    const isTrained = (maleAns && Number(maleAns.answer) > 0) || (femaleAns && Number(femaleAns.answer) > 0);
    
    by_teacher[teacher.name] = isTrained;
    
    if (isTrained) {
      trainedCount++;
      by_region[region].trained++;
      by_district[district].trained++;
      by_school[school].trained++;
    }
  });
  
  // Use the utility function to calculate and cap the percentage
  const percent = calculatePercentage(trainedCount, teachers.length);
  
  return {
    id: 'oi1',
    name: 'Percentage of Teachers Trained',
    value: percent,
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({ 
        region, 
        value: calculatePercentage(data.trained, data.total)
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({ 
        district, 
        value: calculatePercentage(data.trained, data.total)
      })),
      by_school: Object.entries(by_school).map(([school, data]) => ({ 
        school, 
        value: calculatePercentage(data.trained, data.total)
      })),
      by_teacher: Object.entries(by_teacher).map(([teacher, value]) => ({ teacher, value }))
    },
    calculation_trace: [
      { step: 'Total teachers', value: teachers.length },
      { step: 'Teachers trained', value: trainedCount },
      { step: 'Calculation', formula: `${trainedCount}/${teachers.length}*100`, result: Number(percent.toFixed(1)) }
    ]
  };
}

// Helper function to calculate development plans percentage
function calculateDevelopmentPlansPercentage() {
  // This calculates the percentage of schools with development plans that include LtP or holistic skills
  // Formula: (Number of schools with development plans that include LtP or holistic skills / Total number of schools reached) x 100
  // Data comes from Consolidated Checklist Outcome Question #18, schools that uploaded a document
  
  const by_region = {};
  const by_district = {};
  const schools = new Set();
  const schoolsWithPlans = new Set();
  
  // Group schools by region and district
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { total: 0, withPlans: 0 };
    if (!by_district[district]) by_district[district] = { total: 0, withPlans: 0 };
    
    schools.add(school);
  });
  
  // Count schools with development plans (from Consolidated Checklist Q18 - document uploads)
  answers_consolidated_checklist.forEach(answer => {
    if (answer.question_id === 18 && answer.has_upload) { // Question 18 with document upload
      const school = answer.school;
      const region = answer.region;
      const district = answer.district;
      
      schoolsWithPlans.add(school);
      
      if (by_region[region]) by_region[region].withPlans++;
      if (by_district[district]) by_district[district].withPlans++;
    }
  });
  
  // Count total schools by region and district
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    // Only count each school once per region/district
    if (!by_region[region][school]) {
      by_region[region].total++;
      by_region[region][school] = true;
    }
    
    if (!by_district[district][school]) {
      by_district[district].total++;
      by_district[district][school] = true;
    }
  });
  
  // Calculate percentages
  const totalSchools = schools.size;
  const schoolsWithPlansCount = schoolsWithPlans.size;
  const percentage = totalSchools > 0 ? (schoolsWithPlansCount / totalSchools) * 100 : 0;
  
  return {
    id: 'oi4',
    name: 'Percentage of schools that have school development plans that include LtP and/or holistic skills assessment',
    value: Number(percentage.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({
        region,
        value: data.total > 0 ? Number(((data.withPlans / data.total) * 100).toFixed(1)) : 0
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({
        district,
        value: data.total > 0 ? Number(((data.withPlans / data.total) * 100).toFixed(1)) : 0
      }))
    },
    calculation_trace: [
      { step: 'Total schools reached', value: totalSchools },
      { step: 'Schools with development plans that include LtP or holistic skills', value: schoolsWithPlansCount },
      { step: 'Calculation', formula: `${schoolsWithPlansCount}/${totalSchools}*100`, result: Number(percentage.toFixed(1)) }
    ]
  };
}

// Helper function to calculate number of schools reached
function calculateSchoolsReached() {
  // Count the number of schools reached under the current itinerary
  const by_region = {};
  const by_district = {};
  const schools = new Set();
  
  // Group schools by region and district
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = new Set();
    if (!by_district[district]) by_district[district] = new Set();
    
    by_region[region].add(school);
    by_district[district].add(school);
    schools.add(school);
  });
  
  return {
    id: 'oi5',
    name: 'Number of Schools reached',
    value: schools.size,
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, schoolsSet]) => ({
        region,
        value: schoolsSet.size
      })),
      by_district: Object.entries(by_district).map(([district, schoolsSet]) => ({
        district,
        value: schoolsSet.size
      }))
    },
    calculation_trace: [
      { step: 'Total unique schools reached', value: schools.size },
      { step: 'Calculation method', formula: 'Count of unique schools visited', result: schools.size }
    ]
  };
}

// Helper function to calculate implementation plans percentage
function calculateImplementationPlansPercentage() {
  const schoolsWithPlans = {};
  const totalSchools = {};
  const by_region = {};
  const by_district = {};
  
  // Count schools with implementation plans (question 17 in consolidated checklist)
  answers_consolidated_checklist.forEach(answer => {
    if (answer.question_id === 17) {
      const region = answer.region;
      const district = answer.district;
      const school = answer.school;
      
      if (!by_region[region]) by_region[region] = { total: 0, withPlans: 0 };
      if (!by_district[district]) by_district[district] = { total: 0, withPlans: 0 };
      
      if (!totalSchools[school]) {
        totalSchools[school] = true;
        by_region[region].total++;
        by_district[district].total++;
      }
      
      if (answer.answer === 'Yes' && !schoolsWithPlans[school]) {
        schoolsWithPlans[school] = true;
        by_region[region].withPlans++;
        by_district[district].withPlans++;
      }
    }
  });
  
  const totalSchoolCount = Object.keys(totalSchools).length;
  const schoolsWithPlansCount = Object.keys(schoolsWithPlans).length;
  const percent = totalSchoolCount > 0 ? (schoolsWithPlansCount / totalSchoolCount) * 100 : 0;
  
  return {
    id: 'oi3',
    name: 'Percentage of Schools with Implementation Plans',
    value: Number(percent.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({ 
        region, 
        value: data.total > 0 ? Number(((data.withPlans / data.total) * 100).toFixed(1)) : 0 
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({ 
        district, 
        value: data.total > 0 ? Number(((data.withPlans / data.total) * 100).toFixed(1)) : 0 
      })),
      by_school: Object.keys(totalSchools).map(school => ({ 
        school, 
        value: schoolsWithPlans[school] ? 100 : 0 
      }))
    },
    calculation_trace: [
      { step: 'Total schools', value: totalSchoolCount },
      { step: 'Schools with implementation plans', value: schoolsWithPlansCount },
      { step: 'Calculation', formula: `${schoolsWithPlansCount}/${totalSchoolCount}*100`, result: Number(percent.toFixed(1)) }
    ]
  };
}

// Helper function to calculate percentage of teachers with lesson plans that include LtP
function calculateTeacherLessonPlansPercentage() {
  // Formula: (Number of teachers' lesson plans assessed to have included LtP / Total number of teachers' lesson plans assessed) x 100
  // Data comes from Consolidated Checklist Outcome Question #19
  
  const by_region = {};
  const by_district = {};
  const by_school = {};
  
  let totalAssessed = 0;
  let totalIncludingLtP = 0;
  
  // Initialize data structures
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { assessed: 0, includingLtP: 0 };
    if (!by_district[district]) by_district[district] = { assessed: 0, includingLtP: 0 };
    if (!by_school[school]) by_school[school] = { assessed: 0, includingLtP: 0 };
  });
  
  // Process answers from Consolidated Checklist Q19
  answers_consolidated_checklist.forEach(answer => {
    if (answer.question_id === 19) { // Lesson plans that include LtP
      const region = answer.region;
      const district = answer.district;
      const school = answer.school;
      
      // Count as assessed
      by_region[region].assessed++;
      by_district[district].assessed++;
      by_school[school].assessed++;
      totalAssessed++;
      
      // If answer is Yes, count as including LtP
      if (answer.answer === 'Yes') {
        by_region[region].includingLtP++;
        by_district[district].includingLtP++;
        by_school[school].includingLtP++;
        totalIncludingLtP++;
      }
    }
  });
  
  // Calculate percentage
  const percentage = totalAssessed > 0 ? (totalIncludingLtP / totalAssessed) * 100 : 0;
  
  return {
    id: 'oi7',
    name: 'Percentage of teachers with lessons plans that include LtP',
    value: Number(percentage.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region)
        .filter(([_, data]) => data.assessed > 0)
        .map(([region, data]) => ({
          region,
          value: Number(((data.includingLtP / data.assessed) * 100).toFixed(1))
        })),
      by_district: Object.entries(by_district)
        .filter(([_, data]) => data.assessed > 0)
        .map(([district, data]) => ({
          district,
          value: Number(((data.includingLtP / data.assessed) * 100).toFixed(1))
        })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.assessed > 0)
        .map(([school, data]) => ({
          school,
          value: Number(((data.includingLtP / data.assessed) * 100).toFixed(1))
        }))
    },
    calculation_trace: [
      { step: 'Total teachers\'lesson plans assessed', value: totalAssessed },
      { step: 'Teachers\'lesson plans that include LtP', value: totalIncludingLtP },
      { step: 'Calculation', formula: `${totalIncludingLtP}/${totalAssessed}*100`, result: Number(percentage.toFixed(1)) }
    ]
  };
}

// Helper function to calculate percentage of teachers with LtP skills
function calculateTeachersWithLtPSkills() {
  // This calculates the percentage of teachers who have the skills to facilitate LtP in their learning environments
  // Formula: (Number of teachers observed who demonstrated LtP skills / Total number of teachers observed) x 100
  // Data comes from Partners in Play Questions 29, 30, 31, 32, 33, 39, 45, 46, 48, and 49
  
  const by_region = {};
  const by_district = {};
  const by_school = {};
  const teacherScores = {};
  
  // Initialize data structures
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { observed: 0, aboveAverage: 0 };
    if (!by_district[district]) by_district[district] = { observed: 0, aboveAverage: 0 };
    if (!by_school[school]) by_school[school] = { observed: 0, aboveAverage: 0 };
    
    teacherScores[teacher.id] = {
      teacher: teacher.name,
      gender: teacher.gender || 'Unknown',
      region: region,
      district: district,
      school: school,
      observed: false,
      q29Score: 0, // Lesson plan with performance indicator
      q30Score: 0, // Are performance indicators SMART and relevant to topic
      q31Score: 0, // Does the lesson plan include interactive group activities
      q32Score: 0, // Has the Teacher stated appropriate TLRs
      q33Score: 0, // Are the Learning Objectives performance indicators for the lesson made clear
      q39Score: 0, // Does the teacher use appropriate questioning skills
      q45Score: 0, // Does teacher allow pupils to participate in class
      q46Score: 0, // Did the teacher form small groups to undertake tasks
      q48Score: 0, // Did the teacher create space for discussion
      q49Score: 0, // Does teacher make evaluation of the lesson taught
      totalScore: 0
    };
  });
  
  // Process answers for questions 29, 30, 31, 32, 33, 39, 45, 46, 48, and 49
  answers_pip.forEach(answer => {
    const teacherId = answer.teacher_id;
    if (!teacherScores[teacherId]) return;
    
    // Mark teacher as observed for any of these questions
    if ([29, 30, 31, 32, 33, 39, 45, 46, 48, 49].includes(answer.question_id)) {
      teacherScores[teacherId].observed = true;
    }
    
    // Question 29: Lesson plan with performance indicator
    if (answer.question_id === 29) {
      if (answer.answer === 'Learner plan available with performance indicator') {
        teacherScores[teacherId].q29Score = 2;
      } else if (answer.answer === 'Learner plan available but no performance indicator') {
        teacherScores[teacherId].q29Score = 1;
      } else if (answer.answer === 'No learner plan available') {
        teacherScores[teacherId].q29Score = 0;
      }
    }
    
    // Question 30: Are performance indicators SMART and relevant to topic
    else if (answer.question_id === 30) {
      if (answer.answer === 'Performance indicators are irrelevant to topics/subtopics') {
        teacherScores[teacherId].q30Score = 1;
      } else if (answer.answer === 'Performance indicators are relevant to topics/sub-topics but generally in abstract terms') {
        teacherScores[teacherId].q30Score = 2;
      } else if (answer.answer === 'Performance indicators are clear and SMART, but NOT related to evaluations which are stated in lesson plan') {
        teacherScores[teacherId].q30Score = 3;
      } else if (answer.answer === 'Performance indicators are clear and SMART, and related to evaluations which are stated in lesson plan') {
        teacherScores[teacherId].q30Score = 4;
      } else if (answer.answer === 'Performance indicators s are clear and SMART and include at least 2 profile dimensions in the syllabus') {
        teacherScores[teacherId].q30Score = 5;
      }
    }
    
    // Question 31: Does the lesson plan include interactive group activities
    else if (answer.question_id === 31) {
      if (answer.answer === 'Yes, two or more are included') {
        teacherScores[teacherId].q31Score = 2;
      } else if (answer.answer === 'Yes, one is included') {
        teacherScores[teacherId].q31Score = 1;
      } else if (answer.answer === 'No, none is included') {
        teacherScores[teacherId].q31Score = 0;
      }
    }
    
    // Question 32: Has the Teacher stated appropriate TLRs
    else if (answer.question_id === 32) {
      if (answer.answer === 'Teacher did Not state TLRs') {
        teacherScores[teacherId].q32Score = 1;
      } else if (answer.answer === 'TLRs stated BUT not related to lesson objectives') {
        teacherScores[teacherId].q32Score = 2;
      } else if (answer.answer === 'TLRs stated and are relevant to lesson objectives') {
        teacherScores[teacherId].q32Score = 3;
      } else if (answer.answer === 'TLRs are stated and indicated in suitable development stages of lesson') {
        teacherScores[teacherId].q32Score = 4;
      }
    }
    
    // Question 33: Are the Learning Objectives performance indicators for the lesson made clear
    else if (answer.question_id === 33) {
      if (answer.answer === 'Yes, written on chalkboard' || 
          answer.answer === 'Yes, explained by teacher' || 
          answer.answer === 'Yes, explained by teacher and written on board' || 
          answer.answer === 'Yes, other means (specify)') {
        teacherScores[teacherId].q33Score = 1;
      } else if (answer.answer === 'No') {
        teacherScores[teacherId].q33Score = 0;
      }
    }
    
    // Question 39: Does the teacher use appropriate questioning skills
    else if (answer.question_id === 39) {
      if (answer.answer === 'Teacher does not ask questions at all in lesson') {
        teacherScores[teacherId].q39Score = 1;
      } else if (answer.answer === 'Teacher asks only low order (recall) and rhetorical questions such as yes-or-no questions') {
        teacherScores[teacherId].q39Score = 2;
      } else if (answer.answer === 'Teacher asks well-balanced low / high order questions, pauses and calls on volunteers to respond') {
        teacherScores[teacherId].q39Score = 3;
      } else if (answer.answer === 'Teacher asks low/ high order questions which promote higher order responses and encourages even non-volunteers to respond or ask questions') {
        teacherScores[teacherId].q39Score = 4;
      } else if (answer.answer === 'Teacher asks low / high order questions, one at a time and sequenced in order of difficulty which is suited to the level of pupils') {
        teacherScores[teacherId].q39Score = 5;
      }
    }
    
    // Question 45: Does teacher allow pupils to participate in class
    else if (answer.question_id === 45) {
      if (answer.answer === 'Teacher keeps talking without involving pupils') {
        teacherScores[teacherId].q45Score = 1;
      } else if (answer.answer === 'Teacher introduces activities which arouse pupils\'interests but demonstrates them by teacher him / herself') {
        teacherScores[teacherId].q45Score = 2;
      } else if (answer.answer === 'Teacher introduces activities, and pupils participate in it actively and with interests') {
        teacherScores[teacherId].q45Score = 3;
      } else if (answer.answer === 'Teacher introduces activities that equip pupils with generic skills through problem solving') {
        teacherScores[teacherId].q45Score = 4;
      } else if (answer.answer === 'Teacher introduces activities that promote mutual learning among pupils') {
        teacherScores[teacherId].q45Score = 5;
      }
    }
    
    // Question 46: Did the teacher form small groups to undertake tasks
    else if (answer.question_id === 46) {
      if (answer.answer === 'Yes, mixed group') {
        teacherScores[teacherId].q46Score = 4;
      } else if (answer.answer === 'Yes, Boys only' || answer.answer === 'Yes, Girls only') {
        teacherScores[teacherId].q46Score = 3;
      } else if (answer.answer === 'Not at all') {
        teacherScores[teacherId].q46Score = 0;
      }
    }
    
    // Question 48: Did the teacher create space for discussion
    else if (answer.question_id === 48) {
      if (answer.answer === 'Frequently') {
        teacherScores[teacherId].q48Score = 2;
      } else if (answer.answer === 'Sometimes, but not regularly') {
        teacherScores[teacherId].q48Score = 1;
      } else if (answer.answer === 'Not at all') {
        teacherScores[teacherId].q48Score = 0;
      }
    }
    
    // Question 49: Does teacher make evaluation of the lesson taught
    else if (answer.question_id === 49) {
      if (answer.answer === 'Teacher makes no evaluation of lesson') {
        teacherScores[teacherId].q49Score = 1;
      } else if (answer.answer === 'Teacher assesses pupils\' knowledge / understanding during the lesson, but the assessment is not related to objectives/core competencies of lesson') {
        teacherScores[teacherId].q49Score = 2;
      } else if (answer.answer === 'Teacher assesses pupils\' knowledge / understanding during the lesson which are related to objectives/ core competencies of lesson') {
        teacherScores[teacherId].q49Score = 3;
      } else if (answer.answer === 'Teacher assesses pupils\' understanding during lesson (formative assessment) and restructures the development of lesson based on the result of evaluation of pupils\' understanding') {
        teacherScores[teacherId].q49Score = 4;
      } else if (answer.answer === 'Teacher assesses pupils\' readiness / understanding / achievement in the lesson using appropriate questions based on at least 2 profile dimensions in syllabus') {
        teacherScores[teacherId].q49Score = 5;
      }
    }
    
    // Calculate total score for this teacher
    teacherScores[teacherId].totalScore = 
      teacherScores[teacherId].q29Score + 
      teacherScores[teacherId].q30Score + 
      teacherScores[teacherId].q31Score + 
      teacherScores[teacherId].q32Score + 
      teacherScores[teacherId].q33Score + 
      teacherScores[teacherId].q39Score + 
      teacherScores[teacherId].q45Score + 
      teacherScores[teacherId].q46Score + 
      teacherScores[teacherId].q48Score + 
      teacherScores[teacherId].q49Score;
  });
  
  // Filter to only include teachers who were observed
  const observedTeachers = Object.values(teacherScores).filter(t => t.observed);
  
  // Calculate average score across all observed teachers
  const totalScores = observedTeachers.reduce((sum, t) => sum + t.totalScore, 0);
  const averageScore = observedTeachers.length > 0 ? totalScores / observedTeachers.length : 0;
  
  // Count teachers above average by region, district, school, and gender
  const teachersAboveAverage = observedTeachers.filter(t => t.totalScore > averageScore);
  
  // Count by gender
  const maleTeachers = observedTeachers.filter(t => t.gender === 'Male');
  const femaleTeachers = observedTeachers.filter(t => t.gender === 'Female');
  const maleAboveAverage = teachersAboveAverage.filter(t => t.gender === 'Male');
  const femaleAboveAverage = teachersAboveAverage.filter(t => t.gender === 'Female');
  
  // Calculate percentages
  const overallPercentage = observedTeachers.length > 0 ? 
    (teachersAboveAverage.length / observedTeachers.length) * 100 : 0;
  
  const malePercentage = maleTeachers.length > 0 ? 
    (maleAboveAverage.length / maleTeachers.length) * 100 : 0;
  
  const femalePercentage = femaleTeachers.length > 0 ? 
    (femaleAboveAverage.length / femaleTeachers.length) * 100 : 0;
  
  // Count by region, district, and school
  observedTeachers.forEach(teacher => {
    by_region[teacher.region].observed++;
    by_district[teacher.district].observed++;
    by_school[teacher.school].observed++;
    
    if (teacher.totalScore > averageScore) {
      by_region[teacher.region].aboveAverage++;
      by_district[teacher.district].aboveAverage++;
      by_school[teacher.school].aboveAverage++;
    }
  });
  
  return {
    id: 'oi9',
    name: 'Percentage of Teachers who have the skills to facilitate LtP in their learning environments with their children in accordance with the LtP Principles (M/F)',
    value: Number(overallPercentage.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region)
        .filter(([_, data]) => data.observed > 0)
        .map(([region, data]) => ({
          region,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_district: Object.entries(by_district)
        .filter(([_, data]) => data.observed > 0)
        .map(([district, data]) => ({
          district,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.observed > 0)
        .map(([school, data]) => ({
          school,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_gender: [
        {
          gender: 'Male',
          observed: maleTeachers.length,
          aboveAverage: maleAboveAverage.length,
          value: Number(malePercentage.toFixed(1))
        },
        {
          gender: 'Female',
          observed: femaleTeachers.length,
          aboveAverage: femaleAboveAverage.length,
          value: Number(femalePercentage.toFixed(1))
        }
      ],
      by_teacher: observedTeachers.map(t => ({
        teacher: t.teacher,
        gender: t.gender,
        score: t.totalScore,
        aboveAverage: t.totalScore > averageScore,
        value: t.totalScore
      }))
    },
    calculation_trace: [
      { step: 'Total teachers observed', value: observedTeachers.length },
      { step: 'Average score across all teachers', value: Number(averageScore.toFixed(2)) },
      { step: 'Teachers scoring above average', value: teachersAboveAverage.length },
      { step: 'Male teachers above average', value: `${maleAboveAverage.length}/${maleTeachers.length} (${malePercentage.toFixed(1)}%)` },
      { step: 'Female teachers above average', value: `${femaleAboveAverage.length}/${femaleTeachers.length} (${femalePercentage.toFixed(1)}%)` },
      { step: 'Calculation', formula: `${teachersAboveAverage.length}/${observedTeachers.length}*100`, result: Number(overallPercentage.toFixed(1)) }
    ]
  };
}

// Helper function to calculate gender responsive teaching
function calculateGenderResponsiveTeaching() {
  // Using Partners in Play questions about gender responsiveness (questions 40, 41, 42)
  const teachersObserved = new Set();
  const teachersResponsive = new Set();
  const by_region = {};
  const by_district = {};
  const by_school = {};
  const by_teacher = {};
  
  // Process each teacher's answers
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { observed: 0, responsive: 0 };
    if (!by_district[district]) by_district[district] = { observed: 0, responsive: 0 };
    if (!by_school[school]) by_school[school] = { observed: 0, responsive: 0 };
    
    // Check if teacher was observed (has any PIP answers)
    const teacherPipAnswers = answers_pip.filter(a => a.teacher_id === teacher.id);
    if (teacherPipAnswers.length > 0) {
      teachersObserved.add(teacher.id);
      by_region[region].observed++;
      by_district[district].observed++;
      by_school[school].observed++;
      
      // Check gender responsiveness questions
      const q40 = teacherPipAnswers.find(a => a.question_id === 40)?.answer;
      const q41 = teacherPipAnswers.find(a => a.question_id === 41)?.answer;
      const q42 = teacherPipAnswers.find(a => a.question_id === 42)?.answer;
      
      // Consider teacher responsive if they encourage both genders in at least 2 of 3 questions
      const isResponsive = [
        q40 === 'Frequently' || q40 === 'Sometimes, but not regularly',
        q41 === 'Frequently' || q41 === 'Sometimes, but not regularly',
        q42 === 'Both'
      ].filter(Boolean).length >= 2;
      
      by_teacher[teacher.name] = isResponsive;
      
      if (isResponsive) {
        teachersResponsive.add(teacher.id);
        by_region[region].responsive++;
        by_district[district].responsive++;
        by_school[school].responsive++;
      }
    }
  });
  
  const observedCount = teachersObserved.size;
  const responsiveCount = teachersResponsive.size;
  const percent = observedCount > 0 ? (responsiveCount / observedCount) * 100 : 0;
  
  return {
    id: 'oi3',
    name: 'Percentage of Teachers Using Gender-Responsive Practices',
    value: Number(percent.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({ 
        region, 
        value: data.observed > 0 ? Number(((data.responsive / data.observed) * 100).toFixed(1)) : 0 
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({ 
        district, 
        value: data.observed > 0 ? Number(((data.responsive / data.observed) * 100).toFixed(1)) : 0 
      })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.observed > 0)
        .map(([school, data]) => ({ 
          school, 
          value: Number(((data.responsive / data.observed) * 100).toFixed(1))
        })),
      by_teacher: Object.entries(by_teacher).map(([teacher, value]) => ({ teacher, value }))
    },
    calculation_trace: [
      { step: 'Teachers observed', value: observedCount },
      { step: 'Teachers using gender-responsive practices', value: responsiveCount },
      { step: 'Calculation', formula: `${responsiveCount}/${observedCount}*100`, result: Number(percent.toFixed(1)) }
    ]
  };
}

// Helper function to calculate percentage of learning environments showing evidence of LtP methods
function calculateLtPLearningEnvironments() {
  // This calculates the percentage of learning environments that show evidence of LtP methods
  // Formula: (Number of lessons that engage Learners in Child centered learning / Total number of lessons observed) x 100
  // Data comes from Partners in Play Questions 43, 44, and 45
  
  const by_region = {};
  const by_district = {};
  const by_school = {};
  const teacherScores = {};
  const teacherGender = {};
  
  // Get gender information for each teacher
  teachers.forEach(teacher => {
    teacherGender[teacher.id] = teacher.gender || 'Unknown';
  });
  
  // Initialize data structures
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { observed: 0, aboveAverage: 0 };
    if (!by_district[district]) by_district[district] = { observed: 0, aboveAverage: 0 };
    if (!by_school[school]) by_school[school] = { observed: 0, aboveAverage: 0 };
    
    teacherScores[teacher.id] = {
      teacher: teacher.name,
      gender: teacher.gender || 'Unknown',
      region: region,
      district: district,
      school: school,
      observed: false,
      q43Score: 0,
      q44Score: 0,
      q45Score: 0,
      totalScore: 0
    };
  });
  
  // Process answers for questions 43, 44, and 45
  answers_pip.forEach(answer => {
    const teacherId = answer.teacher_id;
    if (!teacherScores[teacherId]) return;
    
    // Question 43: Does the teacher speak in a friendly tone
    if (answer.question_id === 43) {
      teacherScores[teacherId].observed = true;
      
      // Score based on answer
      if (answer.answer === 'Frequently') {
        teacherScores[teacherId].q43Score = 5;
      } else if (answer.answer === 'Sometimes, but not regularly') {
        teacherScores[teacherId].q43Score = 4;
      } else if (answer.answer === 'Only with boys' || answer.answer === 'Only with girls') {
        teacherScores[teacherId].q43Score = 3;
      } else if (answer.answer === 'Not at all') {
        teacherScores[teacherId].q43Score = 0;
      }
    }
    
    // Question 44: Does the teacher actively acknowledge student effort when they give incorrect answers
    else if (answer.question_id === 44) {
      teacherScores[teacherId].observed = true;
      
      // Score based on answer
      if (answer.answer === 'Frequently') {
        teacherScores[teacherId].q44Score = 5;
      } else if (answer.answer === 'Sometimes, but not regularly') {
        teacherScores[teacherId].q44Score = 4;
      } else if (answer.answer === 'Only with boys' || answer.answer === 'Only with girls') {
        teacherScores[teacherId].q44Score = 3;
      } else if (answer.answer === 'Not at all') {
        teacherScores[teacherId].q44Score = 0;
      }
    }
    
    // Question 45: Does the teacher allow pupils to participate in class
    else if (answer.question_id === 45) {
      teacherScores[teacherId].observed = true;
      
      // Score based on answer
      if (answer.answer === 'Teacher introduces activities that promote mutual learning among pupils') {
        teacherScores[teacherId].q45Score = 5;
      } else if (answer.answer === 'Teacher introduces activities that equip pupils with generic skills through problem solving') {
        teacherScores[teacherId].q45Score = 4;
      } else if (answer.answer === 'Teacher introduces activities, and pupils participate in it actively and with interests') {
        teacherScores[teacherId].q45Score = 3;
      } else if (answer.answer === 'Teacher introduces activities which arouse pupils\'interests but demonstrates them by teacher him / herself') {
        teacherScores[teacherId].q45Score = 2;
      } else if (answer.answer === 'Teacher keeps talking without involving pupils') {
        teacherScores[teacherId].q45Score = 1;
      }
    }
    
    // Calculate total score for this teacher
    teacherScores[teacherId].totalScore = 
      teacherScores[teacherId].q43Score + 
      teacherScores[teacherId].q44Score + 
      teacherScores[teacherId].q45Score;
  });
  
  // Filter to only include teachers who were observed
  const observedTeachers = Object.values(teacherScores).filter(t => t.observed);
  
  // Calculate average score across all observed teachers
  const totalScores = observedTeachers.reduce((sum, t) => sum + t.totalScore, 0);
  const averageScore = observedTeachers.length > 0 ? totalScores / observedTeachers.length : 0;
  
  // Count teachers above average by region, district, school, and gender
  const teachersAboveAverage = observedTeachers.filter(t => t.totalScore > averageScore);
  
  // Count by gender
  const maleTeachers = observedTeachers.filter(t => t.gender === 'Male');
  const femaleTeachers = observedTeachers.filter(t => t.gender === 'Female');
  const maleAboveAverage = teachersAboveAverage.filter(t => t.gender === 'Male');
  const femaleAboveAverage = teachersAboveAverage.filter(t => t.gender === 'Female');
  
  // Calculate percentages
  const overallPercentage = observedTeachers.length > 0 ? 
    (teachersAboveAverage.length / observedTeachers.length) * 100 : 0;
  
  const malePercentage = maleTeachers.length > 0 ? 
    (maleAboveAverage.length / maleTeachers.length) * 100 : 0;
  
  const femalePercentage = femaleTeachers.length > 0 ? 
    (femaleAboveAverage.length / femaleTeachers.length) * 100 : 0;
  
  // Count by region, district, and school
  observedTeachers.forEach(teacher => {
    by_region[teacher.region].observed++;
    by_district[teacher.district].observed++;
    by_school[teacher.school].observed++;
    
    if (teacher.totalScore > averageScore) {
      by_region[teacher.region].aboveAverage++;
      by_district[teacher.district].aboveAverage++;
      by_school[teacher.school].aboveAverage++;
    }
  });
  
  return {
    id: 'oi8',
    name: 'Percentage learning environments that show evidence of LtP methods or manipulative',
    value: Number(overallPercentage.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region)
        .filter(([_, data]) => data.observed > 0)
        .map(([region, data]) => ({
          region,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_district: Object.entries(by_district)
        .filter(([_, data]) => data.observed > 0)
        .map(([district, data]) => ({
          district,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.observed > 0)
        .map(([school, data]) => ({
          school,
          value: Number(((data.aboveAverage / data.observed) * 100).toFixed(1))
        })),
      by_gender: [
        {
          gender: 'Male',
          observed: maleTeachers.length,
          aboveAverage: maleAboveAverage.length,
          value: Number(malePercentage.toFixed(1))
        },
        {
          gender: 'Female',
          observed: femaleTeachers.length,
          aboveAverage: femaleAboveAverage.length,
          value: Number(femalePercentage.toFixed(1))
        }
      ],
      by_teacher: observedTeachers.map(t => ({
        teacher: t.teacher,
        gender: t.gender,
        score: t.totalScore,
        aboveAverage: t.totalScore > averageScore,
        value: t.totalScore
      }))
    },
    calculation_trace: [
      { step: 'Total teachers observed', value: observedTeachers.length },
      { step: 'Average score across all teachers', value: Number(averageScore.toFixed(2)) },
      { step: 'Teachers scoring above average', value: teachersAboveAverage.length },
      { step: 'Male teachers above average', value: `${maleAboveAverage.length}/${maleTeachers.length} (${malePercentage.toFixed(1)}%)` },
      { step: 'Female teachers above average', value: `${femaleAboveAverage.length}/${femaleTeachers.length} (${femalePercentage.toFixed(1)}%)` },
      { step: 'Calculation', formula: `${teachersAboveAverage.length}/${observedTeachers.length}*100`, result: Number(overallPercentage.toFixed(1)) }
    ]
  };
}

// Helper function to calculate play-based learning implementation
function calculatePlayBasedLearning() {
  // Using Partners in Play questions about play-based learning (questions 52-60)
  const teachersObserved = new Set();
  const teachersImplementing = new Set();
  const by_region = {};
  const by_district = {};
  const by_school = {};
  const by_teacher = {};
  
  // Process each teacher's answers
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { observed: 0, implementing: 0 };
    if (!by_district[district]) by_district[district] = { observed: 0, implementing: 0 };
    if (!by_school[school]) by_school[school] = { observed: 0, implementing: 0 };
    
    // Check if teacher was observed (has any PIP answers)
    const teacherPipAnswers = answers_pip.filter(a => a.teacher_id === teacher.id);
    if (teacherPipAnswers.length > 0) {
      teachersObserved.add(teacher.id);
      by_region[region].observed++;
      by_district[district].observed++;
      by_school[school].observed++;
      
      // Check play-based learning questions (using a subset of questions for demo)
      const playBasedAnswers = teacherPipAnswers.filter(a => 
        a.question_id >= 52 && a.question_id <= 60 && a.answer === 'Yes'
      );
      
      // Consider teacher implementing if they have at least 3 'Yes' answers
      const isImplementing = playBasedAnswers.length >= 3;
      by_teacher[teacher.name] = isImplementing;
      
      if (isImplementing) {
        teachersImplementing.add(teacher.id);
        by_region[region].implementing++;
        by_district[district].implementing++;
        by_school[school].implementing++;
      }
    }
  });
  
  const observedCount = teachersObserved.size;
  const implementingCount = teachersImplementing.size;
  const percent = observedCount > 0 ? (implementingCount / observedCount) * 100 : 0;
  
  return {
    id: 'oi4',
    name: 'Percentage of Teachers Implementing Play-Based Learning',
    value: Number(percent.toFixed(1)),
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({ 
        region, 
        value: data.observed > 0 ? Number(((data.implementing / data.observed) * 100).toFixed(1)) : 0 
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({ 
        district, 
        value: data.observed > 0 ? Number(((data.implementing / data.observed) * 100).toFixed(1)) : 0 
      })),
      by_school: Object.entries(by_school)
        .filter(([_, data]) => data.observed > 0)
        .map(([school, data]) => ({ 
          school, 
          value: Number(((data.implementing / data.observed) * 100).toFixed(1))
        })),
      by_teacher: Object.entries(by_teacher).map(([teacher, value]) => ({ teacher, value }))
    },
    calculation_trace: [
      { step: 'Teachers observed', value: observedCount },
      { step: 'Teachers implementing play-based learning', value: implementingCount },
      { step: 'Calculation', formula: `${implementingCount}/${observedCount}*100`, result: Number(percent.toFixed(1)) }
    ]
  };
}

// Helper function to calculate enrollment data
function calculateEnrollment() {
  // Using school output questions about enrollment (questions 12-13)
  const boysEnrolled = sumAnswers(answers_school_output, 12);
  const girlsEnrolled = sumAnswers(answers_school_output, 13);
  const totalEnrolled = boysEnrolled + girlsEnrolled;
  
  // Calculate by region and district
  const by_region = {};
  const by_district = {};
  const by_school = {};
  
  teachers.forEach(teacher => {
    const region = teacher.region;
    const district = teacher.district;
    const school = teacher.school;
    
    if (!by_region[region]) by_region[region] = { boys: 0, girls: 0 };
    if (!by_district[district]) by_district[district] = { boys: 0, girls: 0 };
    if (!by_school[school]) by_school[school] = { boys: 0, girls: 0 };
    
    const boysAnswer = answers_school_output.find(a => a.teacher_id === teacher.id && a.question_id === 12);
    const girlsAnswer = answers_school_output.find(a => a.teacher_id === teacher.id && a.question_id === 13);
    
    if (boysAnswer) by_region[region].boys += Number(boysAnswer.answer || 0);
    if (girlsAnswer) by_region[region].girls += Number(girlsAnswer.answer || 0);
    
    if (boysAnswer) by_district[district].boys += Number(boysAnswer.answer || 0);
    if (girlsAnswer) by_district[district].girls += Number(girlsAnswer.answer || 0);
    
    if (boysAnswer) by_school[school].boys += Number(boysAnswer.answer || 0);
    if (girlsAnswer) by_school[school].girls += Number(girlsAnswer.answer || 0);
  });
  
  return {
    id: 'oi1',
    name: 'Total Primary School Enrollment',
    value: totalEnrolled,
    trend: 'up',
    breakdown: {
      by_region: Object.entries(by_region).map(([region, data]) => ({ 
        region, 
        value: data.boys + data.girls,
        details: `Boys: ${data.boys}, Girls: ${data.girls}`
      })),
      by_district: Object.entries(by_district).map(([district, data]) => ({ 
        district, 
        value: data.boys + data.girls,
        details: `Boys: ${data.boys}, Girls: ${data.girls}`
      })),
      by_school: Object.entries(by_school).map(([school, data]) => ({ 
        school, 
        value: data.boys + data.girls,
        details: `Boys: ${data.boys}, Girls: ${data.girls}`
      }))
    },
    calculation_trace: [
      { step: 'Boys enrolled', value: boysEnrolled },
      { step: 'Girls enrolled', value: girlsEnrolled },
      { step: 'Total enrollment', formula: `${boysEnrolled} + ${girlsEnrolled}`, result: totalEnrolled }
    ]
  };
}

// Export the calculated indicators
export const mockOutputIndicators = calcOutputIndicators();
export const mockOutcomeIndicators = calcOutcomeIndicators();
