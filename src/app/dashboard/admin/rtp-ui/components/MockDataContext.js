'use client';
import { createContext, useContext, useState } from 'react';

const MockDataContext = createContext();

export function MockDataProvider({ children }) {
  const [useMockData, setUseMockData] = useState(true);
  return (
    <MockDataContext.Provider value={{ useMockData, setUseMockData }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockDataContext() {
  return useContext(MockDataContext);
}
