import type { Job } from '@/lib/types';

interface JobBannerProps {
  job: Pick<Job, 'title' | 'image_url'> | null | undefined;
}

/**
 * The poster uploaded with a job, shown above the dark heading block on both
 * the job page and the apply page.
 *
 * Rendered whole, never cropped. `object-cover` would be the obvious choice
 * for a banner and is wrong here: these are recruitment posters carrying their
 * own text — salary, locations, phone numbers — right to the edges, and
 * cropping to a fixed height throws exactly that away. Capped at the banner's
 * native width so a wide screen cannot upscale it into softness.
 */
export function JobBanner({ job }: JobBannerProps) {
  if (!job?.image_url) return null;

  return (
    <div className="bg-charcoal">
      <img
        src={job.image_url}
        alt={job.title ? `${job.title} — Shyamali Krishna Automobile` : 'Job banner'}
        className="block w-full h-auto mx-auto max-w-[1672px]"
        width={1672}
        height={941}
        fetchPriority="high"
      />
    </div>
  );
}
