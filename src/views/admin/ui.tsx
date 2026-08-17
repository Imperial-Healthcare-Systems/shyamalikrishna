'use client';

import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

/**
 * Shared primitives for the admin portal.
 *
 * The admin screens were written with these Tailwind strings repeated inline;
 * pulling them out keeps the new recruitment screens visually identical to the
 * existing CMS ones without another round of copy-paste.
 */

export const INPUT =
  'w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100 disabled:text-gray-500';
export const LABEL = 'block text-sm font-medium text-gray-700 mb-1';
export const HINT = 'text-xs text-gray-500 mt-1';
export const BTN =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded transition-colors disabled:opacity-50 disabled:pointer-events-none min-h-[40px]';
export const BTN_PRIMARY = `${BTN} bg-gray-900 text-white hover:bg-gray-700`;
export const BTN_SECONDARY = `${BTN} border border-gray-300 text-gray-700 hover:bg-gray-50`;
export const BTN_DANGER = `${BTN} bg-red-600 text-white hover:bg-red-700`;
export const BTN_DANGER_GHOST = `${BTN} border border-red-300 text-red-600 hover:bg-red-50`;

export function AdminCard({
  title,
  description,
  actions,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {(title || actions) && (
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200">
          <div>
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const ALERT_STYLES: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: 'bg-red-50 border-red-200 text-red-800',
    icon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
  },
  success: {
    wrap: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />,
  },
  info: {
    wrap: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-4 h-4 shrink-0 mt-0.5" />,
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
  },
};

export function Alert({
  tone = 'info',
  children,
  onDismiss,
}: {
  tone?: AlertTone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const style = ALERT_STYLES[tone];
  return (
    <div
      className={`flex items-start gap-2 p-3 border rounded text-sm ${style.wrap}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {style.icon}
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="p-0.5 opacity-60 hover:opacity-100" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Confirmation dialog for anything destructive.
 *
 * `consequence` is a separate slot from `message` on purpose — the thing the
 * admin needs to read is what will be lost, and burying it in a paragraph is
 * how people click through it.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  consequence,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  message?: string;
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onCancel} />
      <div className="relative bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {consequence && (
          <p className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">{consequence}</p>
        )}
        {children && <div className="mt-3">{children}</div>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
          <button type="button" onClick={onCancel} disabled={busy} className={`${BTN_SECONDARY} flex-1`}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${tone === 'danger' ? BTN_DANGER : BTN_PRIMARY} flex-1`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const JOB_STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-800',
  closed: 'bg-gray-200 text-gray-700',
  archived: 'bg-gray-200 text-gray-700',
};

const APPLICATION_STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  under_review: 'bg-indigo-100 text-indigo-700',
  shortlisted: 'bg-violet-100 text-violet-700',
  interview: 'bg-amber-100 text-amber-800',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-200 text-gray-600',
};

const NOTIFICATION_STATUS_STYLES: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  pending: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-amber-100 text-amber-800',
};

export function StatusPill({
  value,
  label,
  kind,
}: {
  value: string;
  label: string;
  kind: 'job' | 'application' | 'notification' | 'active';
}) {
  let className = 'bg-gray-100 text-gray-600';
  if (kind === 'job') className = JOB_STATUS_STYLES[value] || className;
  if (kind === 'application') className = APPLICATION_STATUS_STYLES[value] || className;
  if (kind === 'notification') className = NOTIFICATION_STATUS_STYLES[value] || className;
  if (kind === 'active') className = value === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600';

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded whitespace-nowrap ${className}`}>{label}</span>
  );
}

/**
 * Wraps a table so it scrolls sideways on a phone instead of forcing the whole
 * page to. The admin does check applications from a phone.
 */
export function TableScroll({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">{children}</div>;
}

export const TH = 'text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap';
export const TD = 'px-4 py-3 text-gray-700 align-top';

/** Repeatable text-line editor for responsibilities / requirements / skills. */
export function ListEditor({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  // Stored as one string with newlines, which is what the database column has
  // always held. Editing it as rows is a presentation choice, so an admin who
  // pastes a block of text still gets a sensible result.
  const items = value ? value.split('\n') : [''];

  const update = (index: number, next: string) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy.join('\n'));
  };
  const add = () => onChange([...items, ''].join('\n'));
  const remove = (index: number) => {
    const copy = items.filter((_, i) => i !== index);
    onChange((copy.length ? copy : ['']).join('\n'));
  };

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-3 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={item}
              disabled={disabled}
              onChange={(e) => update(index, e.target.value)}
              placeholder={index === 0 ? placeholder : undefined}
              className={INPUT}
              aria-label={`${label} item ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={disabled || (items.length === 1 && !item)}
              className="mt-1 p-2 text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400"
              aria-label={`Remove ${label} item ${index + 1}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="mt-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
      >
        + Add item
      </button>
      {hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}
