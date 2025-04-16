"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthUser, clearAuthUser, isAuthenticated, renewSession, isAdmin, isDataCollector, USER_TYPES, ADMIN_TYPES } from '@/utils/auth';

// Create authentication context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check for authenticated user on mount and page navigation
  useEffect(() => {
    const checkAuth = () => {
      const authUser = getAuthUser();
      setUser(authUser);
      
      // If authenticated, renew the session
      if (authUser) {
        renewSession();
      }
      
      setLoading(false);
    };

    checkAuth();
    
    // Setup listener for storage changes (for multi-tab support)
    const handleStorageChange = (event) => {
      if (event.key === 'msrc_auth') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  // Handle protected routes with role-based access control
  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/about', '/contact', '/reset-password'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Do NOT run any auth/role checks for /reentry routes
    if (pathname.startsWith('/reentry')) {
      return;
    }

    // Extra restriction: prevent dashboard users from accessing /reentry and vice versa
    if (isAuthenticated()) {
      const authUser = getAuthUser();
      // If user IS a Data Collector and tries to access /dashboard, redirect to /reentry
      if (pathname.startsWith('/dashboard') && authUser && authUser.type === USER_TYPES.DATA_COLLECTOR) {
        router.push('/reentry');
        return;
      }
    }

    // Check if user is authenticated for non-public routes
    if (!isAuthenticated() && !isPublicRoute) {
      router.push('/login');
      return;
    }
    
    // Role-based access control for authenticated users
    if (isAuthenticated() && !isPublicRoute) {
      // Dashboard routes are for admin users only
      if (pathname.startsWith('/dashboard') && !isAdmin()) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [loading, pathname, router]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    clearAuthUser();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};