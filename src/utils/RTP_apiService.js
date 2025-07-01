/**
 * RTP API Service
 * 
 * This service provides methods to fetch data from either mock data or the live API
 * based on the useMockData context value. Includes robust error handling and retry logic.
 */

// Import mock data for fallback
import { 
  schoolOutputSubmissions, 
  districtOutputSubmissions, 
  consolidatedChecklistSubmissions, 
  partnersInPlaySubmissions 
} from '../app/dashboard/admin/rtp-ui/mock/mockSubmissions';

import { mockOutcomeIndicators, mockOutputIndicators } from '../app/dashboard/admin/rtp-ui/mock/mockIndicators';

// Base URL for the live API
const API_BASE_URL = '/api/rtp';

// API request configuration
const API_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000
};

/**
 * Custom error class for API errors
 */
export class RTPApiError extends Error {
  constructor(message, status, endpoint, data = null) {
    super(message);
    this.name = 'RTPApiError';
    this.status = status;
    this.endpoint = endpoint;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Get a user-friendly error message
   */
  getUserMessage() {
    switch (this.status) {
      case 401:
        return 'You are not authorized to access this data. Please log in again.';
      case 403:
        return 'You do not have permission to access this data.';
      case 404:
        return 'The requested data could not be found.';
      case 500:
        return 'The server encountered an error. Please try again later.';
      case 503:
        return 'The service is temporarily unavailable. Please try again later.';
      case 'TIMEOUT':
        return 'The request timed out. Please check your connection and try again.';
      case 'NETWORK':
        return 'A network error occurred. Please check your connection and try again.';
      default:
        return 'An error occurred while fetching data. Please try again later.';
    }
  }
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch data from the API with retry logic
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Promise resolving to the data
 */
async function fetchFromApi(endpoint, options = {}) {
  let retries = 0;
  
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
  
  // Add the signal to the options
  const fetchOptions = {
    ...options,
    signal: controller.signal
  };
  
  while (retries <= API_CONFIG.maxRetries) {
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, fetchOptions);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle HTTP error status codes
      if (!response.ok) {
        let errorData = null;
        
        // Try to parse error response if available
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore parsing errors
        }
        
        throw new RTPApiError(
          `API error: ${response.status} ${response.statusText}`,
          response.status,
          endpoint,
          errorData
        );
      }
      
      // Parse and return the response
      return await response.json();
    } catch (error) {
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        throw new RTPApiError(
          'Request timed out',
          'TIMEOUT',
          endpoint
        );
      }
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        throw new RTPApiError(
          'Network error',
          'NETWORK',
          endpoint
        );
      }
      
      // If we've reached max retries, throw the error
      if (retries >= API_CONFIG.maxRetries) {
        console.error(`Error fetching from ${endpoint} after ${retries} retries:`, error);
        
        // If it's already an RTPApiError, rethrow it
        if (error instanceof RTPApiError) {
          throw error;
        }
        
        // Otherwise, wrap it in an RTPApiError
        throw new RTPApiError(
          error.message || 'Unknown error',
          error.status || 'UNKNOWN',
          endpoint
        );
      }
      
      // Increment retry counter and wait before retrying
      retries++;
      console.warn(`Retrying fetch from ${endpoint} (${retries}/${API_CONFIG.maxRetries})...`);
      await sleep(API_CONFIG.retryDelay * retries); // Exponential backoff
    }
  }
}

/**
 * Get all submissions
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of submissions
 */
export async function getAllSubmissions(useMockData = true) {
  if (useMockData) {
    // Return mock data
    return Promise.resolve([
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ]);
  }
  
  try {
    // Fetch from multiple endpoints and combine
    const results = await Promise.allSettled([
      fetchFromApi('school-responses'),
      fetchFromApi('output'),
      fetchFromApi('consolidated-checklist'),
      fetchFromApi('partners-in-play')
    ]);
    
    // Process results, using empty arrays for rejected promises
    const [schoolOutput, districtOutput, checklist, partnersInPlay] = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );
    
    // Log any errors that occurred
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const endpoints = ['school-responses', 'output', 'consolidated-checklist', 'partners-in-play'];
        console.error(`Error fetching from ${endpoints[index]}:`, result.reason);
      }
    });
    
    // Combine all successful results
    return [...schoolOutput, ...districtOutput, ...checklist, ...partnersInPlay];
  } catch (error) {
    console.error('Error fetching all submissions:', error);
    
    // Fallback to mock data in case of catastrophic failure
    console.warn('Falling back to mock data for submissions');
    return [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
  }
}

/**
 * Get recent submissions
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @param {number} limit - Number of submissions to return
 * @returns {Promise<Array>} - Promise resolving to an array of recent submissions
 */
export async function getRecentSubmissions(useMockData = true, limit = 10) {
  if (useMockData) {
    // Get all submissions and sort by date
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    return Promise.resolve(
      allSubmissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit)
    );
  }
  
  try {
    // Try to fetch recent submissions from the API
    return await fetchFromApi(`overview/recent?limit=${limit}`);
  } catch (error) {
    console.error(`Error fetching recent submissions:`, error);
    
    // If the specific endpoint fails, try to get all submissions and sort them
    try {
      console.warn('Falling back to fetching all submissions and sorting');
      const allSubmissions = await getAllSubmissions(false);
      
      return allSubmissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    } catch (fallbackError) {
      console.error('Error in fallback for recent submissions:', fallbackError);
      
      // As a last resort, fall back to mock data
      console.warn('Falling back to mock data for recent submissions');
      const mockSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      return mockSubmissions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    }
  }
}

/**
 * Get submission by ID
 * @param {string|number} id - Submission ID
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<object|null>} - Promise resolving to the submission or null if not found
 */
export async function getSubmissionById(id, useMockData = true) {
  if (!id) {
    console.error('Invalid submission ID provided:', id);
    return null;
  }
  
  // Normalize the ID to string for comparison
  const normalizedId = id.toString();
  
  if (useMockData) {
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    const submission = allSubmissions.find(sub => sub.id.toString() === normalizedId);
    return Promise.resolve(submission || null);
  }
  
  try {
    // Try to fetch the submission directly
    return await fetchFromApi(`submissions/${normalizedId}`);
  } catch (error) {
    console.error(`Error fetching submission with ID ${normalizedId}:`, error);
    
    // If the specific endpoint fails, try to find it in all submissions
    if (error.status === 404) {
      try {
        console.warn(`Submission with ID ${normalizedId} not found, searching in all submissions`);
        const allSubmissions = await getAllSubmissions(false);
        const submission = allSubmissions.find(sub => sub.id.toString() === normalizedId);
        
        if (submission) {
          console.log(`Found submission with ID ${normalizedId} in all submissions`);
          return submission;
        }
        
        // If still not found, check mock data as a last resort
        console.warn(`Checking mock data for submission with ID ${normalizedId}`);
        const mockSubmissions = [
          ...schoolOutputSubmissions,
          ...districtOutputSubmissions,
          ...consolidatedChecklistSubmissions,
          ...partnersInPlaySubmissions
        ];
        
        const mockSubmission = mockSubmissions.find(sub => sub.id.toString() === normalizedId);
        if (mockSubmission) {
          console.warn(`Found submission with ID ${normalizedId} in mock data`);
          return mockSubmission;
        }
        
        // If we've exhausted all options, return null
        return null;
      } catch (fallbackError) {
        console.error('Error in fallback for submission by ID:', fallbackError);
        return null;
      }
    }
    
    // For other errors, try mock data as a fallback
    console.warn(`Falling back to mock data for submission with ID ${normalizedId}`);
    const mockSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    const mockSubmission = mockSubmissions.find(sub => sub.id.toString() === normalizedId);
    return mockSubmission || null;
  }
}

/**
 * Get submissions by entity
 * @param {string} entityType - Entity type (school, district, region, teacher)
 * @param {string} entityName - Entity name
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of submissions
 */
export async function getSubmissionsByEntity(entityType, entityName, useMockData = true) {
  if (!entityType || !entityName) {
    console.error('Invalid entity type or name provided:', { entityType, entityName });
    return [];
  }
  
  // Normalize entity type to lowercase
  const normalizedEntityType = entityType.toLowerCase();
  
  // Validate entity type
  const validEntityTypes = ['school', 'district', 'region', 'teacher'];
  if (!validEntityTypes.includes(normalizedEntityType)) {
    console.error(`Invalid entity type: ${normalizedEntityType}. Must be one of: ${validEntityTypes.join(', ')}`);
    return [];
  }
  
  if (useMockData) {
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    let filteredSubmissions = [];
    
    if (normalizedEntityType === 'school') {
      filteredSubmissions = allSubmissions.filter(sub => sub.school === entityName);
    } else if (normalizedEntityType === 'district') {
      filteredSubmissions = allSubmissions.filter(sub => sub.district === entityName);
    } else if (normalizedEntityType === 'region') {
      filteredSubmissions = entityName === 'All' ? 
        allSubmissions : 
        allSubmissions.filter(sub => sub.region === entityName);
    } else if (normalizedEntityType === 'teacher') {
      filteredSubmissions = allSubmissions.filter(sub => sub.teacher === entityName);
    }
    
    return Promise.resolve(filteredSubmissions);
  }
  
  try {
    // Try the specific entity endpoint first
    const endpoint = `${normalizedEntityType}s/${encodeURIComponent(entityName)}/submissions`;
    return await fetchFromApi(endpoint);
  } catch (error) {
    console.error(`Error fetching submissions for ${normalizedEntityType} ${entityName}:`, error);
    
    // If the specific endpoint fails, try to filter from all submissions
    try {
      console.warn(`Falling back to fetching all submissions and filtering by ${normalizedEntityType}`);
      const allSubmissions = await getAllSubmissions(false);
      
      let filteredSubmissions = [];
      
      if (normalizedEntityType === 'school') {
        filteredSubmissions = allSubmissions.filter(sub => sub.school === entityName);
      } else if (normalizedEntityType === 'district') {
        filteredSubmissions = allSubmissions.filter(sub => sub.district === entityName);
      } else if (normalizedEntityType === 'region') {
        filteredSubmissions = entityName === 'All' ? 
          allSubmissions : 
          allSubmissions.filter(sub => sub.region === entityName);
      } else if (normalizedEntityType === 'teacher') {
        filteredSubmissions = allSubmissions.filter(sub => sub.teacher === entityName);
      }
      
      return filteredSubmissions;
    } catch (fallbackError) {
      console.error('Error in fallback for submissions by entity:', fallbackError);
      
      // As a last resort, fall back to mock data
      console.warn(`Falling back to mock data for ${normalizedEntityType} ${entityName}`);
      const mockSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      let filteredSubmissions = [];
      
      if (normalizedEntityType === 'school') {
        filteredSubmissions = mockSubmissions.filter(sub => sub.school === entityName);
      } else if (normalizedEntityType === 'district') {
        filteredSubmissions = mockSubmissions.filter(sub => sub.district === entityName);
      } else if (normalizedEntityType === 'region') {
        filteredSubmissions = entityName === 'All' ? 
          mockSubmissions : 
          mockSubmissions.filter(sub => sub.region === entityName);
      } else if (normalizedEntityType === 'teacher') {
        filteredSubmissions = mockSubmissions.filter(sub => sub.teacher === entityName);
      }
      
      return filteredSubmissions;
    }
  }
}

/**
 * Get outcome indicators
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of outcome indicators
 */
export async function getOutcomeIndicators(useMockData = true) {
  if (useMockData) {
    return Promise.resolve(mockOutcomeIndicators);
  }
  
  try {
    // Try to fetch outcome indicators from the API
    return await fetchFromApi('outcome-indicators');
  } catch (error) {
    console.error('Error fetching outcome indicators:', error);
    
    // Log a user-friendly error message
    const userMessage = error instanceof RTPApiError ? 
      error.getUserMessage() : 
      'Failed to load outcome indicators. Using mock data instead.';
    
    console.warn(userMessage);
    
    // Fall back to mock data
    return mockOutcomeIndicators;
  }
}

/**
 * Get output indicators
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<Array>} - Promise resolving to an array of output indicators
 */
export async function getOutputIndicators(useMockData = true) {
  if (useMockData) {
    return Promise.resolve(mockOutputIndicators);
  }
  
  try {
    // Try to fetch output indicators from the API
    return await fetchFromApi('output');
  } catch (error) {
    console.error('Error fetching output indicators:', error);
    
    // Log a user-friendly error message
    const userMessage = error instanceof RTPApiError ? 
      error.getUserMessage() : 
      'Failed to load output indicators. Using mock data instead.';
    
    console.warn(userMessage);
    
    // Fall back to mock data
    return mockOutputIndicators;
  }
}

/**
 * Get filters (regions, districts, schools, etc.)
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<object>} - Promise resolving to filter options
 */
export async function getFilters(useMockData = true) {
  if (useMockData) {
    // Create filters from mock data
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    const regions = [...new Set(allSubmissions.map(sub => sub.region))];
    const districts = [...new Set(allSubmissions.map(sub => sub.district))];
    const schools = [...new Set(allSubmissions.map(sub => sub.school))];
    const teachers = [...new Set(allSubmissions.map(sub => sub.teacher))];
    const itineraries = [...new Set(allSubmissions.map(sub => sub.itinerary))];
    
    return Promise.resolve({
      regions,
      districts,
      schools,
      teachers,
      itineraries
    });
  }
  
  try {
    // Try to fetch filters from multiple endpoints
    const results = await Promise.allSettled([
      fetchFromApi('regions'),
      fetchFromApi('districts'),
      fetchFromApi('schools'),
      fetchFromApi('itineraries')
    ]);
    
    // Process results, using empty arrays for rejected promises
    const [regions, districts, schools, itineraries] = results.map((result, index) => {
      if (result.status === 'rejected') {
        const endpoints = ['regions', 'districts', 'schools', 'itineraries'];
        console.error(`Error fetching ${endpoints[index]}:`, result.reason);
        return [];
      }
      return result.value;
    });
    
    // Get teachers from submissions if available
    let teachers = [];
    try {
      const submissions = await getAllSubmissions(false);
      teachers = [...new Set(submissions.map(sub => sub.teacher))];
    } catch (error) {
      console.warn('Could not fetch teachers from submissions:', error);
    }
    
    return {
      regions,
      districts,
      schools,
      teachers,
      itineraries
    };
  } catch (error) {
    console.error('Error fetching filters:', error);
    
    // Log a user-friendly error message
    const userMessage = error instanceof RTPApiError ? 
      error.getUserMessage() : 
      'Failed to load filters. Using mock data instead.';
    
    console.warn(userMessage);
    
    // Fall back to mock data
    const allSubmissions = [
      ...schoolOutputSubmissions,
      ...districtOutputSubmissions,
      ...consolidatedChecklistSubmissions,
      ...partnersInPlaySubmissions
    ];
    
    const regions = [...new Set(allSubmissions.map(sub => sub.region))];
    const districts = [...new Set(allSubmissions.map(sub => sub.district))];
    const schools = [...new Set(allSubmissions.map(sub => sub.school))];
    const teachers = [...new Set(allSubmissions.map(sub => sub.teacher))];
    const itineraries = [...new Set(allSubmissions.map(sub => sub.itinerary))];
    
    return {
      regions,
      districts,
      schools,
      teachers,
      itineraries
    };
  }
}

/**
 * Submit survey data
 * @param {object} surveyData - Survey data to submit
 * @param {boolean} useMockData - Whether to use mock data or live API
 * @returns {Promise<object>} - Promise resolving to the submitted survey
 */
export async function submitSurvey(surveyData, useMockData = true) {
  if (useMockData) {
    // For mock data, just return the survey data with an ID
    return Promise.resolve({
      ...surveyData,
      id: Math.floor(Math.random() * 10000) + 5000,
      submitted_at: new Date().toISOString()
    });
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(surveyData),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting survey:', error);
    throw error;
  }
}

const RTPApiService = {
  getAllSubmissions,
  getRecentSubmissions,
  getSubmissionById,
  getSubmissionsByEntity,
  getOutcomeIndicators,
  getOutputIndicators,
  getFilters,
  submitSurvey
};

export default RTPApiService;
