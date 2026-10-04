import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable Modal Component.
 * 
 * WHY: Modals are used for task creation, user editing, file previews, and confirmations.
 * Using `createPortal` mounts the modal directly into `document.body`, preventing it from
 * being clipped by parent CSS overflow or z-index stacking issues.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility of the modal
 * @param {Function} props.onClose - Callback triggered when the modal is closed
 * @param {string | React.ReactNode} [props.title] - Modal title in the header bar
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} [props.footer] - Action buttons in the footer bar
 * @param {'sm' | 'md' | 'lg' | 'xl' | 'full'} [props.size='md'] - Max width size of the dialog
 * @param {boolean} [props.closeOnBackdrop=true] - Whether clicking the dark overlay closes the modal
 * @param {boolean} [props.closeOnEscape=true] - Whether pressing the 'Escape' key closes the modal
 * @param {string} [props.className=''] - Additional custom classes for the modal card
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
}) => {
  // WHY: Listen for the 'Escape' key to provide standard keyboard accessibility.
  // Also lock background body scrolling so the background page doesn't scroll under the modal.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose?.();
      }
    };

    // Save original overflow style to restore on unmount or when modal closes
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // If the modal is closed, don't render anything into the DOM
  if (!isOpen) return null;

  // Map size prop to Tailwind max-width classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }[size] || 'max-w-lg';

  // Handle clicking on the backdrop
  const handleBackdropClick = (e) => {
    // WHY: Make sure the click was directly on the backdrop container, not inside the modal card.
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose?.();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Dark Backdrop Overlay */}
      {/* WHY: Backdrop dims the background and focuses user attention on the modal content */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* 2. Modal Card Container */}
      <div
        className={`relative w-full ${sizeClasses} bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] z-10 transform transition-all animate-scale-up ${className}`}
      >
        {/* Header Bar */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            {title ? (
              <h3
                id="modal-title"
                className="text-lg font-semibold text-gray-900 truncate"
              >
                {title}
              </h3>
            ) : (
              <div />
            )}

            {/* Close Button ('X') */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        {/* WHY: overflow-y-auto allows internal scrolling if the content exceeds max height */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-700 text-sm">
          {children}
        </div>

        {/* Modal Footer (Optional Action Buttons) */}
        {footer && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render directly into body
  return createPortal(modalContent, document.body);
};
