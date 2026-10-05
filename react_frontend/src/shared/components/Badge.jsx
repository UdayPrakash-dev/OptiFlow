import React from 'react';

// WHY: Badges are used to visually highlight statuses (e.g., 'pending', 'approved')
// or priorities (e.g., 'high', 'low'). Passing a 'status' prop makes it reusable.
export const Badge = ({ children, status = 'default', className = '' }) => {
  const baseStyles = 'inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full';
  
  const statusStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  const appliedStyle = statusStyles[status] || statusStyles.default;

  return (
    <span className={`${baseStyles} ${appliedStyle} ${className}`}>
      {children}
    </span>
  );
};
