'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 bg-white shadow-lg border-l-4 animate-fadeIn ${
            toast.type === 'success' ? 'border-success' :
            toast.type === 'error' ? 'border-error' :
            'border-info'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-info shrink-0 mt-0.5" />}
          <p className="text-sm text-charcoal flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-stone hover:text-charcoal transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
