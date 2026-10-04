import React from 'react';
import { Modal } from './Modal';

/**
 * Reusable Confirmation Dialog Component.
 * 
 * WHY: Destructive actions (like deleting a record) or significant state transitions
 * (like submitting for final approval) require explicit user confirmation to prevent accidents.
 * Building this on top of our existing `<Modal />` keeps the codebase DRY (Don't Repeat Yourself)
 * and guarantees consistent backdrop and keyboard behavior.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the confirmation dialog is visible
 * @param {Function} props.onConfirm - Callback when user confirms the action
 * @param {Function} [props.onCancel] - Callback when user cancels or closes the dialog
 * @param {string} [props.title='Confirm Action'] - Title heading for the dialog
 * @param {string | React.ReactNode} props.message - Descriptive text explaining the consequence
 * @param {string} [props.confirmText] - Label on the confirm button (default: "Confirm" or "Delete" for danger)
 * @param {string} [props.cancelText='Cancel'] - Label on the cancel button
 * @param {'danger' | 'normal' | 'primary'} [props.variant='danger'] - Visual style ('danger' = red, 'normal'/'primary' = blue)
 * @param {boolean} [props.loading=false] - Whether confirmation is currently processing (disables buttons)
 */
export const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  // Determine default button label based on variant
  const defaultConfirmText = variant === 'danger' ? 'Delete' : 'Confirm';
  const resolvedConfirmText = confirmText || defaultConfirmText;

  // Visual styles for the confirm button based on variant
  const isDanger = variant === 'danger';
  const confirmButtonClasses = isDanger
    ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-xs'
    : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-xs';

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onCancel}
      title=""
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
      <div className="flex flex-col items-center text-center p-2">
        {/* Visual Icon */}
        {/* WHY: An icon instantly conveys whether the action is destructive (red warning) or informational (blue info) */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {isDanger ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Dialog Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Descriptive Message */}
        <div className="text-sm text-gray-500 mb-6 max-w-xs">{message}</div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 w-full">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${confirmButtonClasses}`}
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            <span>{loading ? 'Processing...' : resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
