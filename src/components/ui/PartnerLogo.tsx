import type { Partner } from '@/lib/types';

interface PartnerLogoProps {
  partner: Pick<Partner, 'name' | 'logo_url'>;
  /** Sizing (and any hover/transition) classes for the tile. */
  className?: string;
  /** Colours for the initial-letter tile, used only when no logo is on file. */
  fallbackClassName?: string;
  /** Type scale for the initial letter. */
  letterClassName?: string;
}

/**
 * A partner's logo, falling back to the first letter of its name.
 *
 * Only some partners have artwork on file, so both states have to look
 * deliberate side by side in the same list. The logo always sits on white:
 * every logo we hold is coloured artwork on a transparent background, and the
 * charcoal tile the letter uses would swallow the darker ones.
 */
export function PartnerLogo({
  partner,
  className = '',
  fallbackClassName = 'bg-charcoal text-gold',
  letterClassName = 'text-2xl',
}: PartnerLogoProps) {
  if (partner.logo_url) {
    return (
      <div
        className={`bg-white border border-bone-300 flex items-center justify-center shrink-0 p-1.5 ${className}`}
      >
        <img
          src={partner.logo_url}
          alt={partner.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center shrink-0 ${fallbackClassName} ${className}`}>
      <span className={`heading-serif font-bold ${letterClassName}`}>
        {partner.name.charAt(0)}
      </span>
    </div>
  );
}
