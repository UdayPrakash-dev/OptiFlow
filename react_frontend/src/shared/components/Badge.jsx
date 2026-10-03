import React from 'react';

// WHY: Badges are used to visually highlight statuses (e.g., 'pending', 'approved')
// or priorities (e.g., 'high', 'low'). Passing a 'type' or 'status' prop makes it reusable.
export const Badge = ({ children, status = 'default', className = '' }) => {
  // TODO: Map 'status' to specific background and text colors using Tailwind.
  // e.g., if status === 'success', use 'bg-green-100 text-green-800'
  return (
    <span className={`inline-block px-2 py-1 text-xs rounded-full ${className}`}>
      {children}
    </span>
  );
};
