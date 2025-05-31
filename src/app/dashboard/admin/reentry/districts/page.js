'use client';
import ReentryEntityListView from '@/components/reentry/ReentryEntityListView';

export default function DistrictsListPage() {
  return (
    <ReentryEntityListView
      entityType="districts"
      title="Pregnancy & Re-entry: Districts"
      description="View and analyze pregnancy and re-entry data across all districts. Filter by metrics, search for specific districts, and export data for reporting."
      parentEntity={null}
      fetchEntities={null} // Using mock data for now
      fetchSummary={null} // Using mock data for now
    />
  );
}
