'use client';
import ReentryEntityListView from '@/components/reentry/ReentryEntityListView';

export default function SchoolsListPage() {
  return (
    <ReentryEntityListView
      entityType="schools"
      title="Pregnancy & Re-entry: Schools"
      description="View and analyze pregnancy and re-entry data across all schools. Filter by metrics, search for specific schools, and export data for reporting."
      parentEntity={null}
      fetchEntities={null} // Using mock data for now
      fetchSummary={null} // Using mock data for now
    />
  );
}
