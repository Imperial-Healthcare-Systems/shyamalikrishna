'use client';

import { useState, FormEvent, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface EnquiryFormProps {
  sourcePage: string;
  enquiryType?: string;
  productId?: string;
  productName?: string;
  partnerName?: string;
  categorySlug?: string;
  compact?: boolean;
}

const ENQUIRY_TYPES = [
  'Product Enquiry',
  'Spare Parts Requirement',
  'Service Request',
  'Finance / EMI Consultation',
  'Subsidy Assistance',
  'Institutional / Bulk Purchase',
  'Other',
];

export function EnquiryForm({
  sourcePage,
  enquiryType: defaultType = 'Product Enquiry',
  productId,
  productName,
  partnerName,
  compact = false,
}: EnquiryFormProps) {
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
      lead_type: 'product_enquiry',
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      whatsapp: String(formData.get('whatsapp') || '') || null,
      email: String(formData.get('email') || '') || null,
      district_village: String(formData.get('district_village') || '') || null,
      enquiry_type: String(formData.get('enquiry_type') || defaultType),
      message: String(formData.get('message') || '') || null,
      product_id: productId || null,
      product_name: productName || null,
      partner_name: partnerName || null,
      category_name: null,
      tractor_hp: String(formData.get('tractor_hp') || '') || null,
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
      setErrorMsg('Could not submit your enquiry. Please try again or call us directly.');
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4" role="status">
        <CheckCircle2 className="w-12 h-12 text-success mb-4" />
        <p className="text-lg font-medium text-charcoal mb-2">
          {t('Thank you. Your enquiry has been received.', 'धन्यवाद। आपकी पूछताछ प्राप्त हो गई है।')}
        </p>
        <p className="text-sm text-stone max-w-md">
          {t(
            'A member of our team will be in touch within one business day.',
            'हमारी टीम का एक सदस्य एक कार्य दिवस के भीतर संपर्क करेगा।'
          )}
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 btn-ghost text-sm"
        >
          {t('Submit another enquiry', 'एक और पूछताछ भेजें')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot field */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website URL<input type="text" name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="name" className="label-field">
            {t('Full Name', 'पूरा नाम')} <span className="text-error">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="input-field"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label-field">
            {t('Phone Number', 'फ़ोन नंबर')} <span className="text-error">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="input-field"
            autoComplete="tel"
            pattern="[0-9+\-\s]{10,15}"
          />
        </div>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="whatsapp" className="label-field">
            {t('WhatsApp Number', 'व्हाट्सएप नंबर')}
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            className="input-field"
            autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="email" className="label-field">
            {t('Email Address', 'ईमेल पता')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input-field"
            autoComplete="email"
          />
        </div>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <div>
          <label htmlFor="district_village" className="label-field">
            {t('District / Village', 'ज़िला / गाँव')}
          </label>
          <input
            id="district_village"
            name="district_village"
            type="text"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="enquiry_type" className="label-field">
            {t('Enquiry Type', 'पूछताछ का प्रकार')}
          </label>
          <select id="enquiry_type" name="enquiry_type" className="input-field" defaultValue={defaultType}>
            {ENQUIRY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {productName && (
        <div>
          <label htmlFor="tractor_hp" className="label-field">
            {t('Your Tractor HP', 'आपके ट्रैक्टर का HP')}
          </label>
          <input
            id="tractor_hp"
            name="tractor_hp"
            type="text"
            className="input-field"
            placeholder={t('e.g. 50 HP', 'जैसे 50 HP')}
          />
        </div>
      )}

      <div>
        <label htmlFor="message" className="label-field">
          {t('Message', 'संदेश')}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="input-field resize-y"
        />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('Submitting…', 'भेजा जा रहा है…')}
          </>
        ) : (
          t('Send Enquiry', 'पूछताछ भेजें')
        )}
      </button>

      <p className="text-xs text-stone text-center">
        {t(
          'We respect your privacy. Your details are used only to respond to your enquiry.',
          'हम आपकी निजता का सम्मान करते हैं। आपके विवरण का उपयोग केवल आपकी पूछताछ का उत्तर देने के लिए किया जाता है।'
        )}
      </p>
    </form>
  );
}
