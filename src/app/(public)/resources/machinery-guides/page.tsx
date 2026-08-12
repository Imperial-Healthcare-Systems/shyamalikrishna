import { Suspense } from 'react';
import { getFaqs, getResources } from '@/lib/data';
import { ResourceDetailPage } from '@/views/public/ResourceDetailPage';

// Re-render at most every 5 minutes so catalogue edits (new product
// images, copy changes) reach the live site without a redeploy.
export const revalidate = 300;

export default async function Page() {
  const [resources, faqs] = await Promise.all([
    getResources('guide'),
    getFaqs(),
  ]);
  return (
    <Suspense fallback={null}>
      <ResourceDetailPage resourceType="guide" initialResources={resources} initialFaqs={faqs} />
    </Suspense>
  );
}
