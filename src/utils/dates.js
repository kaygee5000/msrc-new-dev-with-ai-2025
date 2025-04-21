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