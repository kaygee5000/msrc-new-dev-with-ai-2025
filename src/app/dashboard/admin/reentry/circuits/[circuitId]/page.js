'use client';
import { use } from 'react';
import ReentryEntityDetailView from '@/components/reentry/ReentryEntityDetailView';

export default function CircuitDetailPage({ params }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const { circuitId } = unwrappedParams;
  
  // Define breadcrumbs for this page
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Reentry', href: '/dashboard/admin/reentry' },
    { label: 'Circuits', href: '/dashboard/admin/reentry/circuits' },
    { label: 'Circuit Details' } // Current page (no href)
  ];
  
  return (
    <ReentryEntityDetailView
      entityType="circuit"
      entityId={circuitId}
      breadcrumbs={breadcrumbs}
      fetchEntityData={null} // Using mock data for now
      fetchMetricsData={null} // Using mock data for now
      fetchHistoricalData={null} // Using mock data for now
      fetchSubmissionsData={null} // Using mock data for now
    />
  );
}
