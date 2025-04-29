'use client';
import React from 'react';
import Dashboard from './pages/Dashboard';
import { MockDataProvider } from './components/MockDataContext';

export default function RTPDashboardPage() {
  return (
    <MockDataProvider>
      <Dashboard />
    </MockDataProvider>
  );
}
