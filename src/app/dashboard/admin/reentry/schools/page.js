'use client';
import ReentryEntityListView from '@/components/reentry/ReentryEntityListView';
import { useSearchParams } from 'next/navigation';

// Fetch function to get schools data from the API
async function fetchSchools({ page, limit, searchTerm, filters, sortBy, sortOrder }) {
  // Build query string manually to avoid any potential conflicts
  const queryParts = [];
  
  console.log("check availability:", page, limit, searchTerm, filters, sortBy, sortOrder);
  if (page) queryParts.push(`page=${encodeURIComponent(page)}`);
  if (limit) queryParts.push(`limit=${encodeURIComponent(limit)}`);
  if (searchTerm) queryParts.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
  if (filters?.regionId) queryParts.push(`regionId=${encodeURIComponent(filters.regionId)}`);
  if (filters?.districtId) queryParts.push(`districtId=${encodeURIComponent(filters.districtId)}`);
  if (filters?.circuitId) queryParts.push(`circuitId=${encodeURIComponent(filters.circuitId)}`);
  if (sortBy) queryParts.push(`sortBy=${encodeURIComponent(sortBy)}`);
  if (sortOrder) queryParts.push(`sortOrder=${encodeURIComponent(sortOrder)}`);
  
  const queryString = queryParts.join('&');
  console.log("Manual query string:", queryString, 'queryParts', queryParts);
  
  const res = await fetch(`/api/reentry/schools?${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch schools');
  const data = await res.json();
  // Return in the format expected by the component
  return {
    entities: data.data,
    pagination: data.pagination
  };
}

// Fetch function to get summary data from the API
async function fetchSummary(filters) {
  // Build query string manually to avoid any potential conflicts
  const queryParts = [];
  
  if (filters?.regionId) queryParts.push(`regionId=${encodeURIComponent(filters.regionId)}`);
  if (filters?.districtId) queryParts.push(`districtId=${encodeURIComponent(filters.districtId)}`);
  if (filters?.circuitId) queryParts.push(`circuitId=${encodeURIComponent(filters.circuitId)}`);
  
  const queryString = queryParts.join('&');
  console.log("Summary query string:", queryString);
  
  const res = await fetch(`/api/reentry/summary?${queryString}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  const data = await res.json();
  return data;
}

// Main component for the Schools List page
export default function SchoolsListPage() {
  // useSearchParams hook can only be used in a Client Component
  const searchParams = useSearchParams();
  
  // You can access URL search parameters here
  const initialSearchTerm = searchParams.get('searchTerm') || '';
  const initialRegionId = searchParams.get('regionId') || null;
  const initialDistrictId = searchParams.get('districtId') || null;
  const initialCircuitId = searchParams.get('circuitId') || null;
  
  console.log("URL search parameters:", {
    searchTerm: initialSearchTerm,
    regionId: initialRegionId,
    districtId: initialDistrictId,
    circuitId: initialCircuitId
  });
  
  // Initial filters based on URL parameters
  const initialFilters = {
    regionId: initialRegionId,
    districtId: initialDistrictId,
    circuitId: initialCircuitId
  };
  
  return (
    <ReentryEntityListView
      entityType="schools"
      title="Pregnancy & Re-entry: Schools"
      description="View and analyze pregnancy and re-entry data across all schools. Filter by metrics, search for specific schools, and export data for reporting."
      parentEntity={null}
      fetchEntities={fetchSchools}
      fetchSummary={fetchSummary}
      initialSearchTerm={initialSearchTerm}
      initialFilters={initialFilters}
    />
  );
}
