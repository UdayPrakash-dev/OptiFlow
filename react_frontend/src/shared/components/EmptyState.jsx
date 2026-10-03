import React from 'react';

// WHY: When a list is empty (e.g., no audit logs or evidence), showing a blank screen is confusing.
// EmptyState explicitly tells the user there is no data and sometimes offers a call-to-action (like "Create New").
export const EmptyState = ({ title, description, action }) => {
  // TODO: Style this to be centered, usually with a light gray background and an icon.
  return (
    <div className="text-center p-8 border border-dashed text-gray-500">
      <h3 className="font-semibold">{title || 'No data found'}</h3>
      <p className="text-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
