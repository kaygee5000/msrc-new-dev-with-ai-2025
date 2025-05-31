/**
 * RTP API Service
 * 
 * This service provides methods to fetch data from either mock data or the live API
 * based on the useMockData context value.
 */

import { 
  schoolOutputSubmissions, 
  districtOutputSubmissions, 
  consolidatedChecklistSubmissions, 
  partnersInPlaySubmissions,
  mockSubmissions,
  recentMockSubmissions
} from '../mock/mockSubmissions';

import { mockOutcomeIndicators, mockOutputIndicators } from '../mock/mockIndicators';
import { mockFilters } from '../mock/mockFilters';
import { mockDocumentUploads } from '../mock/mockDocumentUploads';

// Base URL for the live API
const API_BASE_URL = process.env.NEXT_PUBLIC_RTP_API_URL || 'https://api.msrc.org/rtp';

/**
 * Fetch data from either mock data or the live API
 * @param {string} endpoint - API endpoint to fetch from
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @param {object} mockDataSource - Mock data to return if useMockData is true
 * @returns {Promise<any>} - Promise resolving to the data
 */
async function fetchData(endpoint, useMockData, mockDataSource) {
  if (useMockData) {
    return Promise.resolve(mockDataSource);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get all submissions
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of submissions
 */
export async function getAllSubmissions(useMockData = true) {
  return fetchData('submissions', useMockData, mockSubmissions);
}

/**
 * Get recent submissions
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @param {number} limit - Number of submissions to return
 * @returns {Promise<Array>} - Promise resolving to an array of recent submissions
 */
export async function getRecentSubmissions(useMockData = true, limit = 200) {
  if (useMockData) {
    return Promise.resolve(recentMockSubmissions.slice(0, limit));
  }
  
  return fetchData(`submissions/recent?limit=${limit}`, useMockData);
}

/**
 * Get submission by ID
 * @param {string|number} id - Submission ID
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<object|null>} - Promise resolving to the submission or null if not found
 */
export async function getSubmissionById(id, useMockData = true) {
  if (useMockData) {
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    const submission = allSubmissions.find(sub => sub.id.toString() === id.toString());
    return Promise.resolve(submission || null);
  }
  
  return fetchData(`submissions/${id}`, useMockData);
}

/**
 * Get submissions by entity
 * @param {string} entityType - Entity type (school, district, region)
 * @param {string} entityName - Entity name
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of submissions
 */
export async function getSubmissionsByEntity(entityType, entityName, useMockData = true) {
  if (useMockData) {
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    let filteredSubmissions = [];
    
    if (entityType === 'school') {
      filteredSubmissions = allSubmissions.filter(sub => sub.school === entityName);
    } else if (entityType === 'district') {
      filteredSubmissions = allSubmissions.filter(sub => sub.district === entityName);
    } else if (entityType === 'region') {
      filteredSubmissions = entityName === 'All' ? 
        allSubmissions : 
        allSubmissions.filter(sub => sub.region === entityName);
    } else if (entityType === 'teacher') {
      filteredSubmissions = allSubmissions.filter(sub => sub.teacher === entityName);
    }
    
    return Promise.resolve(filteredSubmissions);
  }
  
  return fetchData(`submissions/by-entity/${entityType}/${encodeURIComponent(entityName)}`, useMockData);
}

/**
 * Get outcome indicators
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of outcome indicators
 */
export async function getOutcomeIndicators(useMockData = true) {
  return fetchData('indicators/outcome', useMockData, mockOutcomeIndicators);
}

/**
 * Get output indicators
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of output indicators
 */
export async function getOutputIndicators(useMockData = true) {
  return fetchData('indicators/output', useMockData, mockOutputIndicators);
}

/**
 * Get filters
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<object>} - Promise resolving to filter options
 */
export async function getFilters(useMockData = true) {
  return fetchData('filters', useMockData, mockFilters);
}

/**
 * Get document uploads
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of document uploads
 */
export async function getDocumentUploads(useMockData = true) {
  return fetchData('documents', useMockData, mockDocumentUploads);
}

export default {
  getAllSubmissions,
  getRecentSubmissions,
  getSubmissionById,
  getSubmissionsByEntity,
  getOutcomeIndicators,
  getOutputIndicators,
  getFilters,
  getDocumentUploads
};
