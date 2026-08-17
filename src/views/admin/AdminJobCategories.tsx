'use client';

import { PageHeading } from '@/views/admin/ui';
import { LookupManager } from '@/views/admin/LookupManager';

export function AdminJobCategories() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Job Categories"
        subtitle="The departments a vacancy can be filed under. Add your own at any time — no developer needed."
      />

      <LookupManager
        endpoint="/admin-api/job-categories"
        noun="category"
        title="Categories"
        description="Shown as the category filter on the public careers page."
        countLabel="Jobs"
        supportsHindi
        supportsDescription
        footnote="Deactivating a category hides it when creating or editing a job, but jobs already filed under it stay exactly as they are and keep showing that category. Deleting is only allowed once no job uses the category."
      />
    </div>
  );
}
