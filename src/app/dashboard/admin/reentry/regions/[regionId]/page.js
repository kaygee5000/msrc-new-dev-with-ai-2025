'use client';
import ReentryEntityDetailView from '@/components/reentry/ReentryEntityDetailView';

export default function RegionDetailPage({ params }) {
  // Access regionId directly from params
  const { regionId } = params;
  
  // Define breadcrumbs for this page
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Reentry', href: '/dashboard/admin/reentry' },
    { label: 'Regions', href: '/dashboard/admin/reentry/regions' },
    { label: 'Region Details' } // Current page (no href)
  ];
  
  return (
    <ReentryEntityDetailView
      entityType="region"
      entityId={regionId}
      breadcrumbs={breadcrumbs}
      fetchEntityData={null} // Using mock data for now
      fetchMetricsData={null} // Using mock data for now
      fetchHistoricalData={null} // Using mock data for now
      fetchSubmissionsData={null} // Using mock data for now
    />
  );
}
