/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date to DD MM YYYY format
 * @param {Date|string} date - Date object or date string
 * @param {boolean} includeDay - Whether to include day of week
 * @returns {string} - Formatted date string
 */
export function formatDate(date, includeDay = false) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  const dayOfWeek = includeDay ? 
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()] + ' ' 
    : '';
  
  return `${dayOfWeek}${day} ${month} ${year}`;
}

/**
 * Format a date with time to DD MM YYYY HH:MM format
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Formatted date string with time
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const formattedDate = formatDate(dateObj);
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${formattedDate} ${hours}:${minutes}`;
}

/**
 * Get a relative time string (e.g., "2 days ago")
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Relative time string
 */
export function getRelativeTimeString(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  // If more than a week, return the formatted date
  return formatDate(dateObj);
}

/**
 * Format a date in long format e.g. "Thursday, 14th February, 2024"
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Formatted date string in long format
 */
export function formatLongDate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const dayOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ][dateObj.getDay()];
  
  const day = dateObj.getDate();
  
  // Add ordinal suffix to day
  const dayWithSuffix = day + getOrdinalSuffix(day);
  
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][dateObj.getMonth()];
  
  const year = dateObj.getFullYear();
  
  return `${dayOfWeek}, ${dayWithSuffix} ${month}, ${year}`;
}

/**
 * Format a date in short format e.g. "14 March, 2025"
 * @param {Date|string} date - Date object or date string
 * @returns {string} - Formatted date string in short format
 */
export function formatShortDate(date) {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate();
  
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ][dateObj.getMonth()];
  
  const year = dateObj.getFullYear();
  
  return `${day} ${month}, ${year}`;
}

/**
 * Get ordinal suffix for a number (e.g. 1st, 2nd, 3rd, 4th)
 * @param {number} n - The number to get the suffix for
 * @returns {string} - The ordinal suffix (e.g., 'st', 'nd', 'rd', 'th')
 */
function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a last login date (using birth_date field)
 * @param {Date|string} date - Date object or date string (birth_date field)
 * @param {boolean} useLongFormat - Whether to use long format
 * @returns {string} - Formatted last login date
 */
export function formatLastLogin(date, useLongFormat = false) {
  return useLongFormat ? formatLongDate(date) : formatShortDate(date);
}