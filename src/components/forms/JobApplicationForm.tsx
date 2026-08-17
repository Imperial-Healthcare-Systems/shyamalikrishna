'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, AlertCircle, Upload, X, FileText } from 'lucide-react';
import { useLang } from '@/lib/i18n';

interface JobApplicationFormProps {
  jobSlug?: string;
  jobTitle?: string;
  /** Names of the locations this job is open in. One entry preselects it. */
  locations?: string[];
  isGeneral?: boolean;
}

/** Mirrors the server limit in lib/server/cv-upload.ts. */
const MAX_CV_BYTES = 4 * 1024 * 1024;
const MAX_CV_MB = 4;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];
const ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function JobApplicationForm({
  jobSlug,
  jobTitle,
  locations = [],
  isGeneral = false,
}: JobApplicationFormProps) {
  const { t } = useLang();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Belt and braces against a double submit: `status` covers the React render
  // path, and this ref covers the window between two fast clicks where a state
  // update has not been committed yet. The server de-duplicates as well, so a
  // retried request cannot create a second record either.
  const submitting = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError(t('Only PDF, DOC and DOCX files are accepted.', 'केवल PDF, DOC और DOCX फ़ाइलें स्वीकार्य हैं।'));
      e.target.value = '';
      return;
    }
    // Checked here as well as on the server so the applicant gets a clear
    // message instead of the platform rejecting an oversized request body.
    if (file.size > MAX_CV_BYTES) {
      setFileError(
        t(`File is too large. Maximum size is ${MAX_CV_MB} MB.`, `फ़ाइल बहुत बड़ी है। अधिकतम आकार ${MAX_CV_MB} MB है।`)
      );
      e.target.value = '';
      return;
    }
    if (file.size === 0) {
      setFileError(t('That file appears to be empty.', 'वह फ़ाइल खाली प्रतीत होती है।'));
      e.target.value = '';
      return;
    }
    setResumeFile(file);
  };

  const clearFile = () => {
    setResumeFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return;

    setErrorMsg('');
    setFileError('');

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    if (!resumeFile) {
      setFileError(t('Please attach your CV/resume.', 'कृपया अपना CV/रिज्यूमे संलग्न करें।'));
      setStatus('error');
      setErrorMsg(t('A CV is required to apply.', 'आवेदन के लिए CV आवश्यक है।'));
      return;
    }

    submitting.current = true;
    setStatus('loading');

    formData.set('job_slug', isGeneral ? 'general-application' : jobSlug || '');
    formData.set('resume', resumeFile, resumeFile.name);

    try {
      const response = await fetch('/api/careers/apply', { method: 'POST', body: formData });

      // A 413 from the platform edge arrives as HTML, not JSON.
      let payload: { success?: boolean; error?: string } = {};
      try {
        payload = await response.json();
      } catch {
        payload = {
          error:
            response.status === 413
              ? t(`File is too large. Maximum size is ${MAX_CV_MB} MB.`, `फ़ाइल बहुत बड़ी है। अधिकतम आकार ${MAX_CV_MB} MB है।`)
              : t('Something went wrong. Please try again.', 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'),
        };
      }

      if (!response.ok || !payload.success) {
        submitting.current = false;
        setStatus('error');
        setErrorMsg(payload.error || t('Could not submit your application. Please try again.', 'आपका आवेदन जमा नहीं हो सका।'));
        return;
      }

      // Deliberately leaves `submitting` locked — the form is replaced by the
      // confirmation, so there is nothing left to submit.
      setStatus('success');
    } catch {
      submitting.current = false;
      setStatus('error');
      setErrorMsg(
        t(
          'We could not reach the server. Please check your connection and try again.',
          'सर्वर से संपर्क नहीं हो सका। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।'
        )
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-12 px-4" role="status">
        <CheckCircle2 className="w-14 h-14 text-success mb-4" />
        <h3 className="heading-serif text-2xl text-charcoal mb-3">
          {t('Your application has been submitted successfully.', 'आपका आवेदन सफलतापूर्वक जमा हो गया है।')}
        </h3>
        <p className="text-stone max-w-md leading-relaxed">
          {t(
            `Thank you for your interest in ${jobTitle || 'joining Shyamali Krishna Automobile'}. Our team will review your application and contact you if your profile matches our requirements.`,
            `${jobTitle || 'श्यामली कृष्णा ऑटोमोबाइल'} में आपकी रुचि के लिए धन्यवाद। हमारी टीम आपके आवेदन की समीक्षा करेगी और यदि आपकी प्रोफ़ाइल हमारी आवश्यकताओं से मेल खाती है तो संपर्क करेगी।`
          )}
        </p>
        <Link href="/careers" className="btn-outline mt-8">
          {t('View other openings', 'अन्य रिक्तियां देखें')}
        </Link>
      </div>
    );
  }

  const busy = status === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Bot trap. Positioned off-canvas rather than display:none so that
          scripted fillers still see it as a real field. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Website URL
          <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset disabled={busy} className="space-y-5">
        <legend className="sr-only">{t('Your details', 'आपका विवरण')}</legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ja-name" className="label-field">
              {t('Full Name', 'पूरा नाम')} <span className="text-error">*</span>
            </label>
            <input
              id="ja-name"
              name="full_name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              className="input-field"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="ja-email" className="label-field">
              {t('Email Address', 'ईमेल पता')} <span className="text-error">*</span>
            </label>
            <input
              id="ja-email"
              name="email"
              type="email"
              required
              maxLength={254}
              className="input-field"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ja-phone" className="label-field">
              {t('Phone Number', 'फ़ोन नंबर')} <span className="text-error">*</span>
            </label>
            <input
              id="ja-phone"
              name="phone"
              type="tel"
              required
              className="input-field"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+91 XXXXXXXXXX"
            />
          </div>
          <div>
            <label htmlFor="ja-position" className="label-field">
              {t('Position', 'पद')} <span className="text-error">*</span>
            </label>
            {/* Readonly, not a select: the position comes from the job the
                applicant opened, and letting them retype it would let them
                apply for one thing while labelling it another. */}
            <input
              id="ja-position"
              type="text"
              value={isGeneral ? t('General Application', 'सामान्य आवेदन') : jobTitle || ''}
              readOnly
              className="input-field bg-bone-50 text-stone cursor-default"
              aria-describedby="ja-position-help"
            />
            <p id="ja-position-help" className="text-xs text-stone mt-1">
              {t('Selected from the position you opened.', 'आपके द्वारा खोले गए पद से चुना गया।')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ja-location" className="label-field">
              {t('Preferred Location', 'पसंदीदा स्थान')}
              {locations.length > 0 && <span className="text-error"> *</span>}
            </label>
            {locations.length > 0 ? (
              <select
                id="ja-location"
                name="preferred_location"
                required
                defaultValue={locations.length === 1 ? locations[0] : ''}
                className="input-field"
              >
                {locations.length > 1 && (
                  <option value="">{t('Select a location…', 'स्थान चुनें…')}</option>
                )}
                {locations.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                id="ja-location"
                name="preferred_location"
                type="text"
                maxLength={120}
                className="input-field"
                placeholder={t('e.g. Nawada', 'जैसे नवादा')}
              />
            )}
          </div>
          <div>
            <label htmlFor="ja-experience" className="label-field">{t('Experience', 'अनुभव')}</label>
            <input
              id="ja-experience"
              name="years_of_experience"
              type="text"
              maxLength={80}
              className="input-field"
              placeholder={t('e.g. 3 years, or Fresher', 'जैसे 3 वर्ष, या फ्रेशर')}
            />
          </div>
        </div>

        {/* CV upload */}
        <div>
          <label htmlFor="ja-resume" className="label-field">
            {t('Upload CV / Resume', 'CV / रिज्यूमे अपलोड करें')} <span className="text-error">*</span>
          </label>

          {resumeFile ? (
            <div className="flex items-center justify-between gap-3 p-3 bg-bone border border-bone-300">
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-gold shrink-0" />
                <span className="text-sm text-charcoal truncate">{resumeFile.name}</span>
                <span className="text-xs text-stone shrink-0">
                  ({(resumeFile.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="text-stone hover:text-error transition-colors p-2 shrink-0"
                aria-label={t('Remove file', 'फ़ाइल हटाएं')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="ja-resume"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-bone-300 hover:border-gold cursor-pointer transition-colors min-h-[44px]"
            >
              <Upload className="w-5 h-5 text-stone shrink-0" />
              <span className="text-sm text-stone">
                {t('Click to upload your CV', 'अपना CV अपलोड करने के लिए क्लिक करें')}
              </span>
            </label>
          )}

          {/* Kept outside the conditional so the input is never unmounted
              while it holds a selected file. */}
          <input
            ref={fileInputRef}
            id="ja-resume"
            name="resume_input"
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
            aria-describedby="ja-resume-help"
          />

          <p id="ja-resume-help" className="text-xs text-stone mt-1.5">
            {t(
              `PDF, DOC or DOCX. Maximum ${MAX_CV_MB} MB. Required.`,
              `PDF, DOC या DOCX। अधिकतम ${MAX_CV_MB} MB। आवश्यक।`
            )}
          </p>

          {fileError && (
            <p className="flex items-start gap-1.5 text-sm text-error mt-2" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {fileError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ja-address" className="label-field">{t('Address', 'पता')}</label>
          <textarea
            id="ja-address"
            name="address"
            rows={2}
            maxLength={500}
            className="input-field resize-y"
            placeholder={t('Village / town, district', 'गांव / कस्बा, ज़िला')}
          />
        </div>

        <div>
          <label htmlFor="ja-cover" className="label-field">{t('Cover Note', 'कवर नोट')}</label>
          <textarea
            id="ja-cover"
            name="cover_letter"
            rows={4}
            maxLength={4000}
            className="input-field resize-y"
            placeholder={t("Tell us why you're a good fit…", 'बताएं कि आप इस भूमिका के लिए उपयुक्त क्यों हैं…')}
          />
        </div>
      </fieldset>

      {status === 'error' && errorMsg && (
        <div
          className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 text-error text-sm"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('Submitting…', 'जमा हो रहा है…')}
          </>
        ) : (
          t('Submit Application', 'आवेदन जमा करें')
        )}
      </button>

      <p className="text-xs text-stone text-center">
        {t(
          'Fields marked * are required.',
          '* चिह्नित फ़ील्ड आवश्यक हैं।'
        )}
      </p>
    </form>
  );
}
