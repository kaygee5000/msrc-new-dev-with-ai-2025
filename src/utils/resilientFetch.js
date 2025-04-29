"use client";

/**
 * Enhanced fetch function that handles connection errors gracefully
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration options
 * @param {boolean} config.ignoreOffline - Whether to attempt the request even when offline
 * @param {Function} config.onOffline - Callback function called when offline is detected
 * @param {Function} config.onDatabaseError - Callback function called when a database error is detected
 * @param {any} config.fallbackData - Data to return when offline
 * @returns {Promise<Object>} - The response data or error object
 */
export async function resilientFetch(url, options = {}, config = {}) {
  const { 
    ignoreOffline = false, 
    onOffline, 
    onDatabaseError,
    fallbackData = null 
  } = config;
  
  // Check if browser is offline
  if (!ignoreOffline && typeof window !== 'undefined' && !window.navigator.onLine) {
    console.log('Network is offline, aborting fetch request');
    if (onOffline) onOffline();
    
    // Return fallback data if provided
    if (fallbackData !== null) {
      return { data: fallbackData, offline: true };
    }
    
    return { error: 'You are currently offline', offline: true };
  }
  
  try {
    // Add timeout to fetch requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timed out after 30 seconds');
    }, 30000); // 30 second timeout
    
    // If options already has a signal, we need to handle both signals
    const { signal: existingSignal, ...otherOptions } = options;
    
    // Create a composite signal if needed
    let signal = controller.signal;
    if (existingSignal) {
      // If the component unmounts and aborts its signal, we'll still abort our request
      existingSignal.addEventListener('abort', () => {
        controller.abort('Component signal was aborted');
      });
    }
    
    const response = await fetch(url, {
      ...otherOptions,
      signal,
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      
      // Check for specific database errors like ECONNRESET
      if (errorData.details && 
         (errorData.details.includes('ECONNRESET') || 
          errorData.details.includes('ER_') || 
          errorData.details.includes('ETIMEDOUT'))) {
        console.error('Database connection error:', errorData.details);
        
        if (onDatabaseError) onDatabaseError(errorData);
        
        // Return fallback data if provided
        if (fallbackData !== null) {
          return { data: fallbackData, dbError: true };
        }
        
        return { error: 'Database connection error', dbError: true, details: errorData.details };
      }
      
      return { error: errorData.message || 'An error occurred', status: response.status };
    }
    
    const data = await response.json();
    return { data };
  } catch (error) {
    // For AbortError, we don't want to log it as an error since it's often intentional
    // (e.g., component unmounting, navigation, etc.)
    if (error.name === 'AbortError') {
      console.log('Request was aborted:', error.message || 'No reason provided');
      
      // Only call onOffline if this was a timeout abort, not a component unmount
      if (error.message && error.message.includes('timed out') && onOffline) {
        onOffline();
      }
      
      return { 
        error: error.message || 'Request was aborted', 
        aborted: true,
        timeout: error.message && error.message.includes('timed out')
      };
    } else {
      console.error('Fetch error:', error);
    }
    
    // Network errors like ECONNRESET will typically trigger a TypeError
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('Network connection error');
      if (onOffline) onOffline();
      
      // Return fallback data if provided
      if (fallbackData !== null) {
        return { data: fallbackData, offline: true };
      }
      
      return { error: 'Network connection lost', offline: true };
    }
    
    // Database-specific errors
    if (error.code && (
        error.code.startsWith('ER_') || 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT')) {
      console.error('Database error:', error);
      
      if (onDatabaseError) onDatabaseError(error);
      
      // Return fallback data if provided
      if (fallbackData !== null) {
        return { data: fallbackData, dbError: true };
      }
      
      return { error: 'Database error: ' + error.message, dbError: true };
    }
    
    return { error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Get data from an API with offline handling
 * 
 * @param {string} url - The API URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Object>} - The API response data
 */
export async function getApi(url, options = {}, config = {}) {
  return resilientFetch(url, {
    method: 'GET',
    ...options
  }, config);
}

/**
 * Post data to an API with offline handling
 * 
 * @param {string} url - The API URL to post to
 * @param {Object} data - The data to post
 * @param {Object} options - Additional fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Object>} - The API response data
 */
export async function postApi(url, data, options = {}, config = {}) {
  return resilientFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data),
    ...options
  }, config);
}

/**
 * Put data to an API with offline handling
 * 
 * @param {string} url - The API URL to put to
 * @param {Object} data - The data to put
 * @param {Object} options - Additional fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Object>} - The API response data
 */
export async function putApi(url, data, options = {}, config = {}) {
  return resilientFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data),
    ...options
  }, config);
}

/**
 * Delete data from an API with offline handling
 * 
 * @param {string} url - The API URL to delete from
 * @param {Object} options - Additional fetch options
 * @param {Object} config - Additional configuration
 * @returns {Promise<Object>} - The API response data
 */
export async function deleteApi(url, options = {}, config = {}) {
  return resilientFetch(url, {
    method: 'DELETE',
    ...options
  }, config);
}

/**
 * Creates an AbortController that can be used to cancel requests when a component unmounts
 * @returns {AbortController} - An AbortController instance
 */
export function createRequestController() {
  return new AbortController();
}