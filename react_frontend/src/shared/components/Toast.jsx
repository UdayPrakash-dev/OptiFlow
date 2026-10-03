import React from 'react';

// WHY: Toasts provide non-intrusive feedback (like "Saved successfully!" or "Error updating") 
// without interrupting the user's workflow like a modal or alert would.
export const Toast = ({ message, type = 'info', onClose }) => {
  // TODO: Style this as a floating element (e.g., fixed position, bottom-right).
  // Different background colors based on type ('success', 'error', 'info').
  // Add a close button (X) that triggers onClose.
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded shadow-lg bg-gray-800 text-white`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold text-gray-400 hover:text-white">x</button>
    </div>
  );
};
