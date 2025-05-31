'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const RTP_DataSourceContext = createContext({
  useMockData: true,
  toggleDataSource: () => {},
});

/**
 * Provider component for the RTP_DataSourceContext
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function RTP_DataSourceProvider({ children }) {
  // Initialize with the environment variable or default to true (mock data)
  const [useMockData, setUseMockData] = useState(true);
  
  // Load the preference from localStorage on mount (client-side only)
  useEffect(() => {
    const storedPreference = localStorage.getItem('rtpUseMockData');
    if (storedPreference !== null) {
      setUseMockData(storedPreference === 'true');
    } else {
      // If no stored preference, use the environment variable
      setUseMockData(process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false');
    }
  }, []);
  
  /**
   * Toggle between mock and live data
   */
  const toggleDataSource = () => {
    const newValue = !useMockData;
    setUseMockData(newValue);
    localStorage.setItem('rtpUseMockData', newValue.toString());
  };
  
  return (
    <RTP_DataSourceContext.Provider value={{ useMockData, toggleDataSource }}>
      {children}
    </RTP_DataSourceContext.Provider>
  );
}

/**
 * Hook to use the RTP_DataSourceContext
 * @returns {object} The context value
 */
export function useRTP_DataSource() {
  return useContext(RTP_DataSourceContext);
}

export default RTP_DataSourceContext;
