'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';

// Create the auth context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Function to do a full authentication check
  const doFullAuthCheck = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          
          // Cache the user data in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('msrc_user', JSON.stringify(data.user));
            localStorage.setItem('msrc_user_cache_time', Date.now().toString());
          }
          
          return data.user;
        } else {
          setUser(null);
          clearUserCache();
          return null;
        }
      } else {
        setUser(null);
        clearUserCache();
        return null;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
      setUser(null);
      clearUserCache();
      return null;
    }
  };

  // Function to clear user cache
  const clearUserCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('msrc_user');
      localStorage.removeItem('msrc_user_cache_time');
    }
  };

  // Function to refresh user data in background
  const refreshUserInBackground = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          
          // Update cache
          if (typeof window !== 'undefined') {
            localStorage.setItem('msrc_user', JSON.stringify(data.user));
            localStorage.setItem('msrc_user_cache_time', Date.now().toString());
          }
        } else {
          // If no user returned but we thought we were logged in, clear everything
          setUser(null);
          clearUserCache();
        }
      }
    } catch (err) {
      console.error('Background auth refresh failed:', err);
      // Don't clear cache on network errors to prevent poor offline experience
    }
  };

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // First check localStorage for cached user data
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('msrc_user');
        const cacheTime = localStorage.getItem('msrc_user_cache_time');
        
        // If we have a recent cache (less than 15 minutes old), use it
        if (cachedUser && cacheTime && (Date.now() - parseInt(cacheTime)) < 900000) {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          setLoading(false);
          
          // Still refresh in background for updated data
          refreshUserInBackground();
          return parsedUser;
        }
      }
      
      // If no valid cache, do a full auth check
      const userData = await doFullAuthCheck();
      return userData;
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to login
  const login = async (method, credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (method === 'credentials') {
        result = await signIn('credentials', {
          redirect: false,
          ...credentials
        });
      } else if (method === 'email') {
        result = await signIn('email', {
          redirect: false,
          email: credentials.email
        });
      } else if (method === 'otp') {
        // Handle OTP login
        const response = await fetch('/api/users/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to verify OTP');
        }
        
        result = { ok: true };
      }
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // Fetch user data after successful login and cache immediately
      const userData = await doFullAuthCheck();
      return userData;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // First call NextAuth's signOut function
      await signOut({ redirect: false });
      
      // Then call our custom logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'GET'
      });
      
      // Clear user data and cache
      setUser(null);
      clearUserCache();
      
      if (!response.ok) {
        console.error('Custom logout API failed, but NextAuth logout completed');
      }
      
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.message);
      
      // Still clear user data and cache on error
      setUser(null);
      clearUserCache();
    } finally {
      setLoading(false);
    }
  };

  // Function to set selected program
  const setSelectedProgram = (programId) => {
    if (user) {
      const updatedUser = {
        ...user,
        selectedProgram: programId
      };
      
      setUser(updatedUser);
      
      // Update cache with new selected program
      if (typeof window !== 'undefined') {
        localStorage.setItem('msrc_user', JSON.stringify(updatedUser));
        localStorage.setItem('msrc_user_cache_time', Date.now().toString());
      }
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    
    // Set up periodic refresh of auth state (every 5 minutes)
    const refreshInterval = setInterval(() => {
      if (user) {
        refreshUserInBackground();
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // The context value that will be supplied to any descendants of this provider
  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    setSelectedProgram,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
