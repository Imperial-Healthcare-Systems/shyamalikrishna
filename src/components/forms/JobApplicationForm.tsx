'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2, AlertCircle, Upload, X } from 'lucide-react';

interface JobApplicationFormProps {
  jobId?: string;
  jobSlug?: string;
  jobTitle?: string;
  isGeneral?: boolean;
}

export function JobApplicationForm({ jobId, jobSlug, jobTitle, isGeneral = false }: JobApplicationFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be under 5 MB.');
        return;
      }
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const clearFile = () => {
    setResumeFile(null);
    setResumeFileName('');
  };

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

    const fullName = String(formData.get('full_name') || '');
    const email = String(formData.get('email') || '');
    const phone = String(formData.get('phone') || '');

    if (!fullName || !email || !phone) {
      setStatus('error');
      setErrorMsg('Name, email, and phone are required.');
      return;
    }

    if (!isGeneral && !resumeFile) {
      setStatus('error');
      setErrorMsg('Resume upload is required.');
      return;
    }

    let resumeUrl: string | null = null;
    if (resumeFile) {
      const fileExt = resumeFile.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(fileExt || '')) {
        setStatus('error');
        setErrorMsg('Resume must be a PDF or Word document.');
        return;
      }

      const filePath = `resumes/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, resumeFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setStatus('error');
        setErrorMsg('Could not upload resume. Please try again.');
        return;
      }

      // The bucket is private — store the object path. Admins fetch a
      // short-lived signed URL through the edge function to download it.
      resumeUrl = filePath;
    }

    const data = {
      job_id: jobId || null,
      job_slug: jobSlug || null,
      full_name: fullName,
      email,
      phone,
      current_location: String(formData.get('current_location') || '') || null,
      highest_qualification: String(formData.get('highest_qualification') || '') || null,
      years_of_experience: String(formData.get('years_of_experience') || '') || null,
      resume_url: resumeUrl,
      resume_filename: resumeFileName || null,
      cover_letter: String(formData.get('cover_letter') || '') || null,
      linkedin_url: String(formData.get('linkedin_url') || '') || null,
      portfolio_url: String(formData.get('portfolio_url') || '') || null,
      status: 'new',
      is_general: isGeneral,
    };

    const { error } = await supabase.from('job_applications').insert(data);

    if (error) {
      setStatus('error');
      setErrorMsg('Could not submit your application. Please try again.');
      return;
    }

    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-12 px-4" role="status">
        <CheckCircle2 className="w-14 h-14 text-success mb-4" />
        <h3 className="heading-serif text-2xl text-charcoal mb-2">Application Received</h3>
        <p className="text-stone max-w-md">
          Thank you for your interest in {jobTitle || 'joining Shyamali Krishna Automobile'}. Your application has been received and will be reviewed by our team. We will contact you if your profile matches our requirements.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website URL<input type="text" name="website_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ja-name" className="label-field">Full Name <span className="text-error">*</span></label>
          <input id="ja-name" name="full_name" type="text" required className="input-field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="ja-email" className="label-field">Email <span className="text-error">*</span></label>
          <input id="ja-email" name="email" type="email" required className="input-field" autoComplete="email" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ja-phone" className="label-field">Phone <span className="text-error">*</span></label>
          <input id="ja-phone" name="phone" type="tel" required className="input-field" autoComplete="tel" pattern="[0-9+\-\s]{10,15}" />
        </div>
        <div>
          <label htmlFor="ja-location" className="label-field">Current Location</label>
          <input id="ja-location" name="current_location" type="text" className="input-field" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ja-qualification" className="label-field">Highest Qualification</label>
          <input id="ja-qualification" name="highest_qualification" type="text" className="input-field" placeholder="e.g. B.Tech Mechanical" />
        </div>
        <div>
          <label htmlFor="ja-experience" className="label-field">Years of Experience</label>
          <input id="ja-experience" name="years_of_experience" type="text" className="input-field" placeholder="e.g. 3 years" />
        </div>
      </div>

      <div>
        <label htmlFor="ja-resume" className="label-field">
          Resume {isGeneral ? '(PDF/DOC, max 5 MB)' : <span className="text-error">* (PDF/DOC, max 5 MB)</span>}
        </label>
        {resumeFileName ? (
          <div className="flex items-center justify-between p-3 bg-bone border border-bone-300">
            <span className="text-sm text-charcoal truncate">{resumeFileName}</span>
            <button type="button" onClick={clearFile} className="text-stone hover:text-error transition-colors p-1" aria-label="Remove file">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label htmlFor="ja-resume" className="flex items-center gap-3 p-4 border-2 border-dashed border-bone-300 hover:border-gold cursor-pointer transition-colors min-h-[44px]">
            <Upload className="w-5 h-5 text-stone" />
            <span className="text-sm text-stone">Click to upload your resume</span>
            <input id="ja-resume" name="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="sr-only" />
          </label>
        )}
      </div>

      <div>
        <label htmlFor="ja-cover" className="label-field">Cover Letter</label>
        <textarea id="ja-cover" name="cover_letter" rows={4} className="input-field resize-y" placeholder="Tell us why you're a good fit…" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ja-linkedin" className="label-field">LinkedIn URL</label>
          <input id="ja-linkedin" name="linkedin_url" type="url" className="input-field" placeholder="https://linkedin.com/in/…" />
        </div>
        <div>
          <label htmlFor="ja-portfolio" className="label-field">Portfolio URL</label>
          <input id="ja-portfolio" name="portfolio_url" type="url" className="input-field" placeholder="https://…" />
        </div>
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
            Submitting…
          </>
        ) : (
          'Submit Application'
        )}
      </button>
    </form>
  );
}
