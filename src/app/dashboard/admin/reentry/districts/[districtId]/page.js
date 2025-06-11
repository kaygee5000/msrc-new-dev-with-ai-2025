'use client';
import ReentryEntityDetailView from '@/components/reentry/ReentryEntityDetailView';

export default function DistrictDetailPage({ params }) {
  // Access districtId directly from params
  const { districtId } = params;
  
  // Define breadcrumbs for this page
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Reentry', href: '/dashboard/admin/reentry' },
    { label: 'Districts', href: '/dashboard/admin/reentry/districts' },
    { label: 'District Details' } // Current page (no href)
  ];
  
  return (
    <ReentryEntityDetailView
      entityType="district"
      entityId={districtId}
      breadcrumbs={breadcrumbs}
      fetchEntityData={null} // Using mock data for now
      fetchMetricsData={null} // Using mock data for now
      fetchHistoricalData={null} // Using mock data for now
      fetchSubmissionsData={null} // Using mock data for now
    />
  );
}
