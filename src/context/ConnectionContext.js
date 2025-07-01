"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { getApi } from '@/utils/resilientFetch';

const ConnectionContext = createContext({
  isOnline: true,
  lastOnline: null,
  hasDatabaseError: false,
  databaseErrorDetail: null,
  checkConnection: () => {},
});

export function ConnectionProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState(new Date());
  const [connectionChecking, setConnectionChecking] = useState(false);
  const [hasDatabaseError, setHasDatabaseError] = useState(false);
  const [databaseErrorDetail, setDatabaseErrorDetail] = useState(null);

  // Check if we're in development mode
  const isDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     process.env.NODE_ENV === 'development' || 
     process.env.DEV_MODE === 'true');

  // Function to actively check connection by sending a ping request
  const checkConnection = useCallback(async () => {
    if (connectionChecking) return;
    
    setConnectionChecking(true);
    try {
      // Use our enhanced resilient fetch to check connection
      const timestamp = new Date().getTime();
      const { data, error, offline, dbError, details } = await getApi(`/api/ping?t=${timestamp}`, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        cache: 'no-store',
      }, {
        onDatabaseError: (errData) => {
          setHasDatabaseError(true);
          setDatabaseErrorDetail(errData.message || errData.details || 'Database error occurred');
          console.error('Database error detected during connection check:', errData);
        }
      });
      
      if (error || offline) {
        setIsOnline(false);
        console.log('❌ Connection check failed:', error || 'Offline');
      } else if (dbError) {
        // We're online but have database issues
        setIsOnline(true); // We do have network connectivity
        setHasDatabaseError(true);
        setDatabaseErrorDetail(details || 'Database error');
        console.log('⚠️ Database error detected:', details);
        setLastOnline(new Date());
      } else if (data) {
        if (!isOnline) {
          setIsOnline(true);
          console.log('🌐 Connection restored');
        }
        // Clear any database error state if it was set
        if (hasDatabaseError) {
          setHasDatabaseError(false);
          setDatabaseErrorDetail(null);
          console.log('✅ Database connection restored');
        }
        setLastOnline(new Date());
      }
    } catch (error) {
      setIsOnline(false);
      console.log('❌ Connection check failed:', error);
      
      // Check for database-specific errors
      if (error.code && (error.code.startsWith('ER_') || 
                         error.code === 'ECONNRESET' || 
                         error.code === 'ETIMEDOUT')) {
        setHasDatabaseError(true);
        setDatabaseErrorDetail(error.message || 'Database error');
      }
    } finally {
      setConnectionChecking(false);
    }
  }, [connectionChecking, isOnline, hasDatabaseError]);

  // Handle browser online/offline events
  useEffect(() => {
    // Skip connection checks in development mode if DEV_MODE_SKIP_PING is set
    if (isDev && process.env.DEV_MODE_SKIP_PING === 'true') {
      console.log('🔄 Skipping connection checks in development mode');
      return () => {}; // Return empty cleanup function
    }

    const handleOnline = () => {
      checkConnection(); // Verify connection is truly restored with a server ping
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Browser went offline');
    };

    // Check connection status immediately when component mounts
    checkConnection();

    // Set up interval to periodically check connection (every 30 seconds)
    const intervalId = setInterval(checkConnection, 30000);

    // Listen for browser's online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, isDev]);

  // Create value object
  const value = {
    isOnline,
    lastOnline,
    hasDatabaseError,
    databaseErrorDetail,
    checkConnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}