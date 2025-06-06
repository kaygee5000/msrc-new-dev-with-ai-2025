// Utility functions to aggregate statistics across multiple records

export function aggregateEnrollment(rows) {
  if (!rows || rows.length === 0) return null;
  // Sum boys and girls (normal + special)
  const totalBoys = rows.reduce((sum, r) => sum + ((r.normal_boys_total || 0) + (r.special_boys_total || 0)), 0);
  const totalGirls = rows.reduce((sum, r) => sum + ((r.normal_girls_total || 0) + (r.special_girls_total || 0)), 0);
  const totalStudents = rows.reduce((sum, r) => sum + (r.total_population || 0), 0);
  return {
    totalStudents,
    genderDistribution: { boys: totalBoys, girls: totalGirls }
  };
}

export function aggregateStudentAttendance(rows) {
  if (!rows || rows.length === 0) return null;
  const totalEnrolled = rows.reduce((sum, r) => sum + (r.total_population || 0), 0);
  const totalPresent = rows.reduce((sum, r) => sum + ((r.normal_boys_total || 0) + (r.normal_girls_total || 0) + (r.special_boys_total || 0) + (r.special_girls_total || 0)), 0);
  const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;
  return {
    totalEnrolled,
    totalPresent,
    attendanceRate: parseFloat(attendanceRate.toFixed(2))
  };
}

export function aggregateTeacherAttendance(rows) {
  if (!rows || rows.length === 0) return null;
  const totalTeachers = rows.length;
  const totalSessionDays = rows.reduce((sum, r) => sum + (r.school_session_days || 0), 0);
  const totalPresent = rows.reduce((sum, r) => sum + (r.days_present || 0), 0);
  const attendanceRate = totalSessionDays > 0 ? (totalPresent / totalSessionDays) * 100 : 0;
  // Exercise completion rate
  const totalExercisesGiven = rows.reduce((sum, r) => sum + (r.excises_given || 0), 0);
  const totalExercisesMarked = rows.reduce((sum, r) => sum + (r.excises_marked || 0), 0);
  const exerciseCompletionRate = totalExercisesGiven > 0 ? (totalExercisesMarked / totalExercisesGiven) * 100 : 0;
  return {
    totalTeachers,
    attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    exerciseCompletionRate: parseFloat(exerciseCompletionRate.toFixed(2))
  };
}
