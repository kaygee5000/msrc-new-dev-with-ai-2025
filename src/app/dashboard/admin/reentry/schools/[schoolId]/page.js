'use client';
import { useEffect } from 'react';
import ReentryEntityDetailView from '@/components/reentry/ReentryEntityDetailView';

export default function SchoolDetailPage({ params }) {
  // Access schoolId directly from params
  const { schoolId } = params;
  
  // Define breadcrumbs for this page
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/admin' },
    { label: 'Reentry', href: '/dashboard/admin/reentry' },
    { label: 'Schools', href: '/dashboard/admin/reentry/schools' },
    { label: 'School Details' } // Current page (no href)
  ];
  
  // You can implement custom fetch functions here if needed
  // or pass null to use the mock data in the component
  const fetchSchoolData = async (entityType, entityId) => {
    // In a real implementation, this would fetch data from your API
    // Example:
    // const response = await fetch(`/api/reentry/schools/${entityId}`);
    // return await response.json();
    
    // For now, we'll use the mock data in the component
    return null;
  };
  
  return (
    <ReentryEntityDetailView
      entityType="school"
      entityId={schoolId}
      breadcrumbs={breadcrumbs}
      fetchEntityData={null} // Using mock data for now
      fetchMetricsData={null} // Using mock data for now
      fetchHistoricalData={null} // Using mock data for now
      fetchSubmissionsData={null} // Using mock data for now
    />
  );
}