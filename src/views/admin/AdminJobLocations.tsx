'use client';

import { PageHeading } from '@/views/admin/ui';
import { LookupManager } from '@/views/admin/LookupManager';

/**
 * Locations and employment types share a page.
 *
 * Both are short lists that are set up once and rarely touched, and giving each
 * its own sidebar entry would push the recruitment section past the point where
 * a non-technical admin can scan it.
 */
export function AdminJobLocations() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Locations & Employment Types"
        subtitle="The towns you hire in and the kinds of engagement you offer. Both lists are yours to extend."
      />

      <LookupManager
        endpoint="/admin-api/job-locations"
        noun="location"
        title="Locations"
        description="A job can be open in one town or several. Applicants pick their preferred location when it has more than one."
        countLabel="Jobs"
        supportsHindi
        footnote="Deactivating a location hides it when creating or editing a job while leaving existing jobs intact. Deleting is only allowed once no job references the location."
      />

      <LookupManager
        endpoint="/admin-api/employment-types"
        noun="employment type"
        title="Employment Types"
        description="Full Time, Part Time, Contract, Internship, Temporary — plus anything else you need."
        countLabel="Jobs"
        footnote="Renaming an employment type updates every job that uses it. Deleting is only allowed once no job uses it."
      />
    </div>
  );
}
