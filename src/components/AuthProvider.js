"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthUser, clearAuthUser, isAuthenticated, renewSession, isAdmin, isDataCollector, isRtpAuthorized, isReentryAuthorized, USER_TYPES, ADMIN_TYPES, ROLES } from '@/utils/auth';

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

    const publicRoutes = ['\/', '/login', '/about', '/contact', '/reset-password'];
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // Check if user is authenticated for non-public routes
    if (!isAuthenticated() && !isPublicRoute) {
      console.log('Redirecting to login, not authenticated for protected route:', pathname);
      router.push('/login');
      return;
    }
    
    // Get current authenticated user
    const authUser = getAuthUser();
    
    // Role-based access control for authenticated users
    if (isAuthenticated() && !isPublicRoute) {
      console.log("in AuthProvider isAuthenticated()", isAuthenticated(), "isPublicRoute", isPublicRoute);

      console.log("pathname.startsWith('/dashboard') ", pathname.startsWith('/dashboard'),
       "authUser.role", authUser.role, "ROLES.ADMIN",  ROLES.ADMIN, "ADMIN_TYPES", authUser.type);

      // All dashboard routes are for admin users only (checking both role and type)
      if (pathname.startsWith('/dashboard') && 
          !(authUser.role === ROLES.ADMIN || ADMIN_TYPES.includes(authUser.type))) {
        console.log('here Redirecting non-admin from dashboard route:', pathname);
        router.push('/unauthorized');
        return;
      }
      
      // RTP admin-specific dashboard route
      // if (pathname.startsWith('/dashboard/admin/rtp') && authUser.type !== USER_TYPES.RTP_ADMIN) {
      //   console.log('Redirecting non-RTP admin from RTP admin route:', pathname);
      //   router.push('/unauthorized');
      //   return;
      // }
      
      // RTP data collection routes - only RTP data collectors should access
      if (pathname.startsWith('/rtp') && !isRtpAuthorized()) {
        console.log('Redirecting unauthorized user from RTP collection route:', pathname);
        console.log('88 isRtpAuthorized',isRtpAuthorized(), pathname);
        router.push('/unauthorized');
        return;
      }
      
      // Reentry data collection routes - only reentry data collectors should access
      if (pathname.startsWith('/reentry') && !isReentryAuthorized()) {
        console.log('Redirecting unauthorized user from reentry collection route:', pathname);
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
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: isAuthenticated() }}>
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