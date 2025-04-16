// Utility functions to fetch data from the API endpoints

export const fetchRegions = async () => {
  const response = await fetch('/api/regions');
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
};

export const fetchDistricts = async () => {
  const response = await fetch('/api/districts');
  if (!response.ok) throw new Error('Failed to fetch districts');
  return response.json();
};

export const fetchCircuits = async () => {
  const response = await fetch('/api/circuits');
  if (!response.ok) throw new Error('Failed to fetch circuits');
  return response.json();
};

export const fetchSchools = async () => {
  const response = await fetch('/api/schools');
  if (!response.ok) throw new Error('Failed to fetch schools');
  return response.json();
};

// Existing API utility functions for interacting with the MCP MySQL server

/**
 * Base fetch function for API calls
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options (method, headers, body)
 * @returns {Promise<any>} - Response data
 */
async function fetchAPI(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`/api/${endpoint}`, mergedOptions);

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export { fetchAPI };

/**
 * Get a list of items from an endpoint
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - List of items
 */
export async function getList(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return fetchAPI(url);
}

/**
 * Get a single item by ID
 * @param {string} endpoint - API endpoint
 * @param {string|number} id - Item ID
 * @returns {Promise<Object>} - Item data
 */
export async function getOne(endpoint, id) {
  return fetchAPI(`${endpoint}/${id}`);
}

/**
 * Create a new item
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Item data
 * @returns {Promise<Object>} - Created item
 */
export async function createItem(endpoint, data) {
  return fetchAPI(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing item
 * @param {string} endpoint - API endpoint
 * @param {string|number} id - Item ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} - Updated item
 */
export async function updateItem(endpoint, id, data) {
  return fetchAPI(`${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete an item
 * @param {string} endpoint - API endpoint
 * @param {string|number} id - Item ID
 * @returns {Promise<void>}
 */
export async function deleteItem(endpoint, id) {
  return fetchAPI(`${endpoint}/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Send notification (email/SMS) to user
 * @param {Object} userData - User data including contact information
 * @param {string} notificationType - Type of notification (credentials, update, etc.)
 * @returns {Promise<Object>} - Notification result
 */
export async function sendNotification(userData, notificationType) {
  return fetchAPI('notifications/send', {
    method: 'POST',
    body: JSON.stringify({
      userData,
      notificationType,
    }),
  });
}