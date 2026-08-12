'use client';

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status">
      <Loader2 className={`${sizeClass} animate-spin text-gold`} aria-hidden="true" />
      {label && <p className="text-sm text-stone">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <p className="text-error font-medium mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline">
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, message, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h3 className="heading-serif text-2xl text-charcoal mb-2">{title}</h3>
      <p className="text-stone max-w-md mb-6">{message}</p>
      {actionLabel && actionHref && (
        <a href={actionHref} className="btn-outline">
          {actionLabel}
        </a>
      )}
    </div>
  );
}
