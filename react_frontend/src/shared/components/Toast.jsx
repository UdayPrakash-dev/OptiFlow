import React from 'react';

// WHY: Toasts provide non-intrusive feedback (like "Saved successfully!" or "Error updating") 
// without interrupting the user's workflow like a modal or alert would.
export const Toast = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600'
  };

  const bgClass = typeStyles[type] || typeStyles.info;

  return (
    <div className={`fixed bottom-6 right-6 flex items-center w-full max-w-xs p-4 space-x-3 text-white ${bgClass} rounded-lg shadow-xl`} role="alert">
      <div className="text-sm font-medium flex-1">{message}</div>
      {onClose && (
        <button onClick={onClose} type="button" className="text-white hover:text-gray-200 focus:outline-none p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </div>
  );
};
