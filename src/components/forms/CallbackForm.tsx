'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface CallbackFormProps {
  sourcePage: string;
  productName?: string;
  compact?: boolean;
}

export function CallbackForm({ sourcePage, productName, compact = true }: CallbackFormProps) {
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
      lead_type: 'callback',
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      preferred_callback_time: String(formData.get('preferred_time') || '') || null,
      message: String(formData.get('message') || '') || null,
      product_name: productName || null,
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
      setErrorMsg('Could not submit your request. Please try again or call us directly.');
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-6 px-4" role="status">
        <CheckCircle2 className="w-10 h-10 text-success mb-3" />
        <p className="text-base font-medium text-charcoal mb-1">
          {t('Callback request received.', 'कॉलबैक अनुरोध प्राप्त हुआ।')}
        </p>
        <p className="text-sm text-stone">
          {t('We will call you back within one business day.', 'हम एक कार्य दिवस के भीतर आपको कॉल करेंगे।')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website URL<input type="text" name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className={compact ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
        <div>
          <label htmlFor="cb-name" className="label-field">
            {t('Name', 'नाम')} <span className="text-error">*</span>
          </label>
          <input id="cb-name" name="name" type="text" required className="input-field" />
        </div>
        <div>
          <label htmlFor="cb-phone" className="label-field">
            {t('Phone', 'फ़ोन')} <span className="text-error">*</span>
          </label>
          <input id="cb-phone" name="phone" type="tel" required className="input-field" pattern="[0-9+\-\s]{10,15}" />
        </div>
      </div>

      <div>
        <label htmlFor="cb-time" className="label-field">
          {t('Preferred callback time', 'पसंदीदा कॉलबैक समय')}
        </label>
        <input id="cb-time" name="preferred_time" type="text" className="input-field" placeholder={t('e.g. Tomorrow morning', 'जैसे कल सुबह')} />
      </div>

      {!compact && (
        <div>
          <label htmlFor="cb-message" className="label-field">
            {t('Message', 'संदेश')}
          </label>
          <textarea id="cb-message" name="message" rows={3} className="input-field resize-y" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn-gold w-full">
        {status === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('Submitting…', 'भेजा जा रहा है…')}
          </>
        ) : (
          t('Request Callback', 'कॉलबैक अनुरोध करें')
        )}
      </button>
    </form>
  );
}
