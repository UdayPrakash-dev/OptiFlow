import React from 'react';

// WHY: When a list is empty (e.g., no audit logs or evidence), showing a blank screen is confusing.
// EmptyState explicitly tells the user there is no data and sometimes offers a call-to-action (like "Create New").
export const EmptyState = ({ title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      <h3 className="text-lg font-medium text-gray-900">{title || 'No data found'}</h3>
      <p className="mt-1 text-sm text-gray-500 text-center max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
