/**
 * Authentication and session management utilities
 */

const AUTH_KEY = 'msrc_auth';
const FORM_DATA_KEY = 'msrc_form_data';

// 12 hours in milliseconds
const SESSION_DURATION = 12 * 60 * 60 * 1000;

// User roles
export const ROLES = {
  ADMIN: 'admin',
  DATA_COLLECTOR: 'data_collector',
};

// User types (roles)
export const USER_TYPES = {
  NATIONAL_ADMIN: 'national_admin',
  REGIONAL_ADMIN: 'regional_admin',
  DISTRICT_ADMIN: 'district_admin',
  CIRCUIT_SUPERVISOR: 'circuit_supervisor',
  HEAD_TEACHER: 'head_teacher',
  DATA_COLLECTOR: 'data_collector',
};

export const ADMIN_TYPES = [
  USER_TYPES.NATIONAL_ADMIN,
  USER_TYPES.REGIONAL_ADMIN,
  USER_TYPES.DISTRICT_ADMIN,
  USER_TYPES.CIRCUIT_SUPERVISOR
];

/**
 * Store authenticated user data with expiration time
 */
export function setAuthUser(user) {
  if (!user) return;
  
  const authData = {
    user,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Get the authenticated user if session is valid
 */
export function getAuthUser() {
  try {
    const authDataString = localStorage.getItem(AUTH_KEY);
    if (!authDataString) return null;
    
    const authData = JSON.parse(authDataString);
    
    // Check if the session has expired
    if (Date.now() > authData.expiresAt) {
      clearAuthUser();
      return null;
    }
    
    return authData.user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (session is valid)
 */
export function isAuthenticated() {
  return getAuthUser() !== null;
}

/**
 * Check if the authenticated user has a specific type
 * @param {string|string[]} types - Type(s) to check
 * @returns {boolean} True if the user has any of the specified types
 */
export function hasType(types) {
  const user = getAuthUser();
  if (!user || !user.type) return false;
  if (Array.isArray(types)) {
    return types.includes(user.type);
  }
  return user.type === types;
}

/**
 * Check if the current user is an admin (any admin type)
 */
export function isAdmin() {
  return hasType(ADMIN_TYPES);
}

/**
 * Check if the current user is a data collector
 */
export function isDataCollector() {
  return hasType(USER_TYPES.DATA_COLLECTOR);
}

/**
 * Renew the session expiration time
 */
export function renewSession() {
  const user = getAuthUser();
  if (user) {
    setAuthUser(user);
  }
}

/**
 * Clear auth data from storage
 */
export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Save form data to local storage
 * @param {string} formId - Unique identifier for the form
 * @param {object} data - Form data to save
 */
export function saveFormData(formId, data) {
  try {
    const user = getAuthUser();
    if (!user) return; // Only save data for authenticated users
    
    // Get existing form data
    const storedDataString = localStorage.getItem(FORM_DATA_KEY);
    const storedData = storedDataString ? JSON.parse(storedDataString) : {};
    
    // Create a unique key using user ID and form ID
    const key = `${user.id}_${formId}`;
    
    // Save the new data
    storedData[key] = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(storedData));
  } catch (error) {
    console.error('Error saving form data:', error);
  }
}

/**
 * Get saved form data from local storage
 * @param {string} formId - Unique identifier for the form
 * @returns {object|null} The saved form data or null if not found
 */
export function getFormData(formId) {
  try {
    const user = getAuthUser();
    if (!user) return null;
    
    const storedDataString = localStorage.getItem(FORM_DATA_KEY);
    if (!storedDataString) return null;
    
    const storedData = JSON.parse(storedDataString);
    const key = `${user.id}_${formId}`;
    
    return storedData[key]?.data || null;
  } catch (error) {
    console.error('Error getting form data:', error);
    return null;
  }
}

/**
 * Clear saved form data for a specific form
 * @param {string} formId - Unique identifier for the form
 */
export function clearFormData(formId) {
  try {
    const user = getAuthUser();
    if (!user) return;
    
    const storedDataString = localStorage.getItem(FORM_DATA_KEY);
    if (!storedDataString) return;
    
    const storedData = JSON.parse(storedDataString);
    const key = `${user.id}_${formId}`;
    
    if (storedData[key]) {
      delete storedData[key];
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(storedData));
    }
  } catch (error) {
    console.error('Error clearing form data:', error);
  }
}

/**
 * Track the current page and selection state
 * @param {string} page - Current page path
 * @param {object} state - Current UI state (selections, filters, etc)
 */
export function saveNavigationState(page, state) {
  try {
    const user = getAuthUser();
    if (!user) return;
    
    const navStateKey = `msrc_nav_${user.id}`;
    localStorage.setItem(navStateKey, JSON.stringify({ page, state, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error saving navigation state:', error);
  }
}

/**
 * Get the last saved navigation state
 * @returns {object|null} The saved navigation state or null
 */
export function getNavigationState() {
  try {
    const user = getAuthUser();
    if (!user) return null;
    
    const navStateKey = `msrc_nav_${user.id}`;
    const stateString = localStorage.getItem(navStateKey);
    
    return stateString ? JSON.parse(stateString) : null;
  } catch (error) {
    console.error('Error getting navigation state:', error);
    return null;
  }
}