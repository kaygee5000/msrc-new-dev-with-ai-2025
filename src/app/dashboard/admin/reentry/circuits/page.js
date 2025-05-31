'use client';
import ReentryEntityListView from '@/components/reentry/ReentryEntityListView';

export default function CircuitsListPage() {
  return (
    <ReentryEntityListView
      entityType="circuits"
      title="Pregnancy & Re-entry: Circuits"
      description="View and analyze pregnancy and re-entry data across all circuits. Filter by metrics, search for specific circuits, and export data for reporting."
      parentEntity={null}
      fetchEntities={null} // Using mock data for now
      fetchSummary={null} // Using mock data for now
    />
  );
}
