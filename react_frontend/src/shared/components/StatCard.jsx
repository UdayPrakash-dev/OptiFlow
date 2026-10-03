import React from 'react';

// WHY: The Executive Dashboard needs to display metrics (like total violations, active projects).
// A reusable StatCard keeps the visual layout of these metrics consistent.
export const StatCard = ({ title, value, trend, icon }) => {
  // TODO: Add Tailwind classes for a card look (e.g., 'bg-white shadow rounded-lg p-4').
  // Handle the 'trend' prop to show if a metric is up (green) or down (red).
  return (
    <div className="stat-card border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {trend && <div className="text-sm mt-1">{trend}</div>}
    </div>
  );
};
