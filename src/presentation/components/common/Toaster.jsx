import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toasts = [];
let listeners = [];

const notify = (toast) => {
  toasts.push(toast);
  listeners.forEach(listener => listener([...toasts]));
  
  // Auto remove after 3-5 seconds based on type
  const duration = toast.type === 'error' ? 5000 : 3000;
  setTimeout(() => {
    removeToast(toast.id);
  }, duration);
};

const removeToast = (id) => {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener([...toasts]));
  }
};

export const toast = {
  success: (message, options) => {
    notify({ id: Date.now(), type: 'success', message, ...options });
  },
  error: (message, options) => {
    notify({ id: Date.now(), type: 'error', message, ...options });
  },
  warning: (message, options) => {
    notify({ id: Date.now(), type: 'warning', message, ...options });
  },
  info: (message, options) => {
    notify({ id: Date.now(), type: 'info', message, ...options });
  }
};

export const Toaster = () => {
  const [items, setItems] = React.useState([]);

  useEffect(() => {
    const listener = (newToasts) => setItems(newToasts);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" style={{ pointerEvents: 'none' }}>
      {items.map((item) => {
        const Icon = icons[item.type];
        return (
          <div
            key={item.id}
            className={`max-w-md w-full rounded-lg border shadow-lg p-4 ${colors[item.type]} animate-in slide-in-from-right fade-in`}
            style={{ pointerEvents: 'auto', animationDuration: '300ms' }}
          >
            <div className="flex items-start gap-3">
              {Icon && (
                <Icon className={`w-5 h-5 ${iconColors[item.type]} flex-shrink-0 mt-0.5`} />
              )}
              <div className="flex-1 text-sm font-medium">{item.message}</div>
              <button
                onClick={() => removeToast(item.id)}
                className={`flex-shrink-0 ${iconColors[item.type]} hover:opacity-70 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

