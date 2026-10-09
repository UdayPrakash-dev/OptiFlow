import React, { createContext, useContext, useState, useCallback } from 'react';

// WHY: Toasts deliver non-blocking feedback (saved changes, validation errors, API alerts).
// A central ToastProvider + useToast hook gives all 9 roles an effortless imperative API:
// toast.success("Saved!"), toast.error("Failed!"), while keeping the UI clean and handcrafted.

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const ICON_BG = {
  success: 'bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-500/20',
  error: 'bg-rose-50 dark:bg-rose-950/50 ring-1 ring-rose-500/20',
  warning: 'bg-amber-50 dark:bg-amber-950/50 ring-1 ring-amber-500/20',
  info: 'bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-500/20',
};

// Standalone Toast Card (used both inside Provider and standalone for backwards compatibility)
export const Toast = ({ message, type = 'info', onClose, className = '' }) => {
  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
    >
      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${ICON_BG[type] || ICON_BG.info}`}>
        {ICONS[type] || ICONS.info}
      </div>
      <p className="flex-1 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug pt-0.5">
        {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss toast"
          className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  // Convenience methods matching the user spec: toast.success(msg), toast.error(msg)
  const api = {
    addToast,
    removeToast,
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast viewport overlay fixed at top right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            message={t.message}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to consume toast anywhere in the component tree
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider to avoid crashes
    return {
      success: (msg) => console.log('[Toast:success]', msg),
      error: (msg) => console.error('[Toast:error]', msg),
      warning: (msg) => console.warn('[Toast:warning]', msg),
      info: (msg) => console.info('[Toast:info]', msg),
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
};

export default Toast;
