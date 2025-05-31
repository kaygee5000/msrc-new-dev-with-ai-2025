'use client';

import React from 'react';
import RTP_Dashboard from '../../../../../components/RTP_Dashboard';
import { RTP_DataSourceProvider } from '../../../../../context/RTP_DataSourceContext';

/**
 * RTP Dashboard page component
 */
export default function RTPDashboardPage() {
  return (
    <RTP_DataSourceProvider>
      <RTP_Dashboard />
    </RTP_DataSourceProvider>
  );
}
