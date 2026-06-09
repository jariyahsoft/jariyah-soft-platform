'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto dismiss after 3000ms
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: triggerToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-danger shrink-0" />,
    info: <Info className="h-5 w-5 text-accent shrink-0" />,
  };

  const bgColors = {
    success: 'border-success/20 bg-bg-card text-text-primary shadow-lg dark:bg-bg-card',
    error: 'border-danger/20 bg-bg-card text-text-primary shadow-lg dark:bg-bg-card',
    info: 'border-accent/20 bg-bg-card text-text-primary shadow-lg dark:bg-bg-card',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 w-full p-4 border rounded-xl pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 ${bgColors[item.type]}`}
    >
      {icons[item.type]}
      <div className="flex-1 text-sm font-medium">{item.message}</div>
      <button
        onClick={onClose}
        className="rounded-lg p-0.5 text-text-secondary hover:bg-text-secondary/15 hover:text-text-primary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
