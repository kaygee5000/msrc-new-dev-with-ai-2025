/**
 * RTP Data Utilities
 * 
 * Common utility functions for processing RTP data
 */

/**
 * Format a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate percentage safely
 * @param {number} value - Numerator
 * @param {number} total - Denominator
 * @returns {number} - Percentage value
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Cap percentage value at 100%
 * @param {number} percentage - Percentage value
 * @returns {number} - Capped percentage value
 */
export function capPercentage(percentage) {
  if (!percentage || isNaN(percentage)) return 0;
  return Math.min(percentage, 100);
}

/**
 * Group submissions by entity
 * @param {Array} submissions - Array of submissions
 * @param {string} entityType - Entity type (school, district, region, teacher)
 * @returns {Object} - Submissions grouped by entity
 */
export function groupSubmissionsByEntity(submissions, entityType) {
  if (!submissions || !Array.isArray(submissions)) return {};
  
  return submissions.reduce((groups, submission) => {
    const entityName = submission[entityType];
    if (!entityName) return groups;
    
    if (!groups[entityName]) {
      groups[entityName] = [];
    }
    
    groups[entityName].push(submission);
    return groups;
  }, {});
}

/**
 * Calculate aggregate statistics for a group of submissions
 * @param {Array} submissions - Array of submissions
 * @returns {Object} - Aggregate statistics
 */
export function calculateStats(submissions) {
  if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
    return {
      count: 0,
      averageScore: 0,
      completionRate: 0,
      latestSubmission: null
    };
  }
  
  // Sort submissions by date (newest first)
  const sortedSubmissions = [...submissions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Calculate average score (if applicable)
  const scores = submissions
    .filter(sub => sub.score !== undefined && sub.score !== null)
    .map(sub => sub.score);
  
  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  
  // Calculate completion rate (if applicable)
  const completedCount = submissions.filter(sub => sub.completed).length;
  const completionRate = calculatePercentage(completedCount, submissions.length);
  
  return {
    count: submissions.length,
    averageScore: averageScore,
    completionRate: capPercentage(completionRate),
    latestSubmission: sortedSubmissions[0] || null
  };
}

const RTPDataUtils = {
  formatDate,
  calculatePercentage,
  capPercentage,
  groupSubmissionsByEntity,
  calculateStats
};

export default RTPDataUtils;
