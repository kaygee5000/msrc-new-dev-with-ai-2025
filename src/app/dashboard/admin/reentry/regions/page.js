'use client';
import ReentryEntityListView from '@/components/reentry/ReentryEntityListView';

export default function RegionsListPage() {
  return (
    <ReentryEntityListView
      entityType="regions"
      title="Pregnancy & Re-entry: Regions"
      description="View and analyze pregnancy and re-entry data across all regions. Filter by metrics, search for specific regions, and export data for reporting."
      parentEntity={null}
      fetchEntities={null} // Using mock data for now
      fetchSummary={null} // Using mock data for now
    />
  );
}
