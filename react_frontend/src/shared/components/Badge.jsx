import React from 'react';

// WHY: Badges are used to visually highlight statuses (e.g., 'pending', 'approved')
// or priorities (e.g., 'high', 'low'). Passing a 'status' prop makes it reusable.
export const Badge = ({ children, status = 'default', className = '' }) => {
  const baseStyles = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap tracking-wide';
  
  const statusStyles = {
    default: 'bg-[#f1f5f9] text-[#64748b]', // badge-gray
    success: 'bg-[#ecfdf5] text-[#10b981]', // badge-green
    warning: 'bg-[#fffbeb] text-[#f59e0b]', // badge-orange
    danger:  'bg-[#fef2f2] text-[#ef4444]', // badge-red
    info:    'bg-[#eff6ff] text-[#3b82f6]'  // badge-blue
  };

  const appliedStyle = statusStyles[status] || statusStyles.default;

  return (
    <span className={`${baseStyles} ${appliedStyle} ${className}`} style={{ letterSpacing: '0.02em' }}>
      {children}
    </span>
  );
};

export default Badge;
