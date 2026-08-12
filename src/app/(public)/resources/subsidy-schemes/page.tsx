import { Suspense } from 'react';
import { getFaqs, getResources } from '@/lib/data';
import { ResourceDetailPage } from '@/views/public/ResourceDetailPage';

export default async function Page() {
  const [resources, faqs] = await Promise.all([
    getResources('subsidy'),
    getFaqs(),
  ]);
  return (
    <Suspense fallback={null}>
      <ResourceDetailPage resourceType="subsidy" initialResources={resources} initialFaqs={faqs} />
    </Suspense>
  );
}
