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
  RTP_ADMIN: 'rtp_admin',      // Adding specific RTP admin role
  RTP_COLLECTOR: 'data_collector' // Adding RTP data collector role
};

// Define all admin types including RTP admin
export const ADMIN_TYPES = [
  USER_TYPES.NATIONAL_ADMIN,
  USER_TYPES.REGIONAL_ADMIN,
  USER_TYPES.DISTRICT_ADMIN,
  USER_TYPES.CIRCUIT_SUPERVISOR,
  USER_TYPES.RTP_ADMIN
];

// Routes that require admin access
export const ADMIN_ROUTES = [
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/admin/regions',
  '/dashboard/admin/districts', 
  '/dashboard/admin/circuits',
  '/dashboard/admin/schools',
  '/dashboard/admin/users',
  '/dashboard/admin/reentry',
  '/dashboard/admin/rtp',     // Adding the RTP admin route
  '/dashboard/reports',
  '/dashboard/analytics',
  '/dashboard/submissions',
  '/dashboard/settings'
];

// Check if a route requires admin privileges
export function isAdminRoute(pathname) {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

// Utility to check if localStorage is available (client-side only)
function hasLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Store authenticated user data with expiration time
 */
export function setAuthUser(user) {
  if (!user || !hasLocalStorage()) return;
  
  // Ensure both role and type are set for consistent checking
  const normalizedUser = {
    ...user,
    role: user.role || (ADMIN_TYPES.includes(user.type) ? ROLES.ADMIN : ROLES.DATA_COLLECTOR),
    type: user.type || (user.role === ROLES.ADMIN ? USER_TYPES.NATIONAL_ADMIN : USER_TYPES.DATA_COLLECTOR)
  };
  
  const authData = {
    user: normalizedUser,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Get the authenticated user if session is valid
 */
export function getAuthUser() {
  try {
    if (!hasLocalStorage()) return null;
    const authDataString = localStorage.getItem(AUTH_KEY);
    if (!authDataString) return null;
    
    const authData = JSON.parse(authDataString);
    
    // Check if the session has expired
    if (Date.now() > authData.expiresAt) {
      clearAuthUser();
      return null;
    }
    
    // Ensure both role and type exist on returned user for consistent checking
    if (authData.user && (!authData.user.role || !authData.user.type)) {
      authData.user.role = authData.user.role || (ADMIN_TYPES.includes(authData.user.type) ? ROLES.ADMIN : ROLES.DATA_COLLECTOR);
      authData.user.type = authData.user.type || (authData.user.role === ROLES.ADMIN ? USER_TYPES.NATIONAL_ADMIN : USER_TYPES.DATA_COLLECTOR);
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
 * Check if the authenticated user has a specific role
 * @param {string|string[]} roles - Role(s) to check
 * @returns {boolean} True if the user has any of the specified roles
 */
export function hasRole(roles) {
  const user = getAuthUser();
  if (!user || !user.role) return false;
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  return user.role === roles;
}

/**
 * Check if the current user is an admin (any admin type)
 */
export function isAdmin() {
  const user = getAuthUser();
  if (!user) return false;
  
  // Check both role and type for admin status
  return (user.role === ROLES.ADMIN || ADMIN_TYPES.includes(user.type));
}

/**
 * Check if the current user is a data collector
 */
export function isDataCollector() {
  const user = getAuthUser();
  if (!user) return false;
  
  // Check both role and type for data collector status
  return (user.role === ROLES.DATA_COLLECTOR || user.type === USER_TYPES.DATA_COLLECTOR);
}

/**
 * Check if the current user is authorized for RTP
 */
export function isRtpAuthorized() {
  const user = getAuthUser();
  if (!user) return false;
  
  // Only RTP collector role has access to RTP data collection routes
  return user.type === USER_TYPES.RTP_COLLECTOR;
}

/**
 * Check if the current user is authorized for Reentry
 */
export function isReentryAuthorized() {
  const user = getAuthUser();
  if (!user) return false;
  
  // Only data collectors of reentry type have access to reentry data collection routes
  return user.type === USER_TYPES.DATA_COLLECTOR;
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
  if (!hasLocalStorage()) return;
  console.log('Clearing auth user data from local storage');
  
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Save form data to local storage
 * @param {string} formId - Unique identifier for the form
 * @param {object} data - Form data to save
 */
export function saveFormData(formId, data) {
  try {
    if (!hasLocalStorage()) return;
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
    if (!hasLocalStorage()) return null;
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
    if (!hasLocalStorage()) return;
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
    if (!hasLocalStorage()) return;
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
    if (!hasLocalStorage()) return null;
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