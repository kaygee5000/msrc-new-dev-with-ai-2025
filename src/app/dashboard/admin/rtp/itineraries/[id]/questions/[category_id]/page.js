'use client';
export const dynamic = 'force-dynamic';

import QuestionsManagementPage from '../page';

export default function QuestionsManagementPageWithCategory({ params }) {
  return <QuestionsManagementPage params={params} />;
}
