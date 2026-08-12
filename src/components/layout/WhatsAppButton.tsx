'use client';

import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/lib/hooks';
import { whatsappLink } from '@/lib/utils';

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const whatsapp = settings?.whatsapp || '+91 7488095803';

  return (
    <a
      href={whatsappLink(whatsapp, 'Hello, I would like to enquire about agricultural machinery.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform min-h-[44px] min-w-[44px]"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
