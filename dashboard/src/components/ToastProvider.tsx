import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastNotificationProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastNotification({ toast, onRemove }: ToastNotificationProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500/90 to-green-600/90',
          border: 'border-green-400/50',
          icon: '✅'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/90 to-red-600/90',
          border: 'border-red-400/50',
          icon: '❌'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500/90 to-orange-600/90',
          border: 'border-orange-400/50',
          icon: '⚠️'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500/90 to-blue-600/90',
          border: 'border-blue-400/50',
          icon: 'ℹ️'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-500/90 to-slate-600/90',
          border: 'border-slate-400/50',
          icon: '📢'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`${styles.bg} backdrop-blur-xl border ${styles.border} rounded-xl p-4 shadow-xl max-w-sm transform transition-all duration-300 animate-in slide-in-from-right`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm mb-1">{toast.title}</h4>
          <p className="text-white/90 text-xs leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white/70 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Pre-configured toast helpers
export const showSuccess = (title: string, message: string, duration?: number) => {
  return { type: 'success' as const, title, message, duration };
};

export const showError = (title: string, message: string, duration?: number) => {
  return { type: 'error' as const, title, message, duration };
};

export const showWarning = (title: string, message: string, duration?: number) => {
  return { type: 'warning' as const, title, message, duration };
};

export const showInfo = (title: string, message: string, duration?: number) => {
  return { type: 'info' as const, title, message, duration };
};