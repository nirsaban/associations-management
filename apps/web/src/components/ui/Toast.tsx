'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2" dir="rtl">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 200);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const bgClass =
    toast.type === 'success'
      ? 'bg-secondary text-on-secondary'
      : toast.type === 'error'
        ? 'bg-error text-on-error'
        : 'bg-primary text-on-primary';

  return (
    <div
      className={`rounded-lg px-4 py-3 shadow-ambient-md text-body-md transition-all duration-200 ${bgClass} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {toast.message}
    </div>
  );
}
