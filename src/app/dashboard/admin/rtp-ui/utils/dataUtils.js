'use client';

/**
 * Ensures a percentage value doesn't exceed 100%
 * @param {number} value - The percentage value to cap
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {number} - The capped percentage value
 */
export const capPercentage = (value, precision = 1) => {
  // First cap the value at 100
  const capped = Math.min(value, 100);
  // Then format to the specified precision
  return Number(capped.toFixed(precision));
};

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Safely calculates a percentage
 * @param {number} numerator - The top number
 * @param {number} denominator - The bottom number
 * @param {number} precision - Number of decimal places (default: 1)
 * @returns {number} - The percentage, capped at 100%
 */
export const calculatePercentage = (numerator, denominator, precision = 1) => {
  if (!denominator) return 0;
  const percentage = (numerator / denominator) * 100;
  return capPercentage(percentage, precision);
};
