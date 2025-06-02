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

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          return data.user;
        } else {
          setUser(null);
          return null;
        }
      } else {
        setUser(null);
        return null;
      }
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
      
      // Fetch user data after successful login
      const userData = await checkAuth();
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
        method: 'GET'  // Changed from POST to GET to match the API implementation
      });
      
      if (response.ok) {
        setUser(null);
        router.push('/login');
      } else {
        console.error('Custom logout API failed, but NextAuth logout completed');
        // Don't throw error since NextAuth logout already succeeded
        setUser(null);
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to set selected program
  const setSelectedProgram = (programId) => {
    if (user) {
      setUser({
        ...user,
        selectedProgram: programId
      });
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
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
