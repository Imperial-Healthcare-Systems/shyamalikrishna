'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ServiceEnquiryFormProps {
  serviceType: string;
  sourcePage: string;
}

export function ServiceEnquiryForm({ serviceType, sourcePage }: ServiceEnquiryFormProps) {
  const { t } = useLang();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const honeypot = formData.get('website_url');
    if (honeypot) {
      setStatus('success');
      return;
    }

    const data = {
      lead_type: 'service',
      service_type: serviceType,
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      whatsapp: String(formData.get('whatsapp') || '') || null,
      email: String(formData.get('email') || '') || null,
      district_village: String(formData.get('district_village') || '') || null,
      message: String(formData.get('message') || '') || null,
      source_page: sourcePage,
      language: 'en',
      status: 'new',
    };

    if (!data.name || !data.phone) {
      setStatus('error');
      setErrorMsg('Name and phone number are required.');
      return;
    }

    const { error } = await supabase.from('leads').insert(data);

    if (error) {
      setStatus('error');
      setErrorMsg('Could not submit your request. Please try again.');
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4" role="status">
        <CheckCircle2 className="w-12 h-12 text-success mb-4" />
        <p className="text-lg font-medium text-charcoal mb-2">
          {t('Request received.', 'अनुरोध प्राप्त हुआ।')}
        </p>
        <p className="text-sm text-stone max-w-md">
          {t(
            'Thank you. Our team will be in touch within one business day.',
            'धन्यवाद। हमारी टीम एक कार्य दिवस के भीतर संपर्क करेगी।'
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website URL<input type="text" name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="se-name" className="label-field">
            {t('Full Name', 'पूरा नाम')} <span className="text-error">*</span>
          </label>
          <input id="se-name" name="name" type="text" required className="input-field" />
        </div>
        <div>
          <label htmlFor="se-phone" className="label-field">
            {t('Phone Number', 'फ़ोन नंबर')} <span className="text-error">*</span>
          </label>
          <input id="se-phone" name="phone" type="tel" required className="input-field" pattern="[0-9+\-\s]{10,15}" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="se-whatsapp" className="label-field">
            {t('WhatsApp Number', 'व्हाट्सएप नंबर')}
          </label>
          <input id="se-whatsapp" name="whatsapp" type="tel" className="input-field" />
        </div>
        <div>
          <label htmlFor="se-email" className="label-field">
            {t('Email Address', 'ईमेल पता')}
          </label>
          <input id="se-email" name="email" type="email" className="input-field" />
        </div>
      </div>

      <div>
        <label htmlFor="se-district" className="label-field">
          {t('District / Village', 'ज़िला / गाँव')}
        </label>
        <input id="se-district" name="district_village" type="text" className="input-field" />
      </div>

      <div>
        <label htmlFor="se-message" className="label-field">
          {t('How can we help?', 'हम आपकी कैसे मदद कर सकते हैं?')}
        </label>
        <textarea id="se-message" name="message" rows={4} className="input-field resize-y" />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('Submitting…', 'भेजा जा रहा है…')}
          </>
        ) : (
          t('Submit Request', 'अनुरोध भेजें')
        )}
      </button>
    </form>
  );
}
