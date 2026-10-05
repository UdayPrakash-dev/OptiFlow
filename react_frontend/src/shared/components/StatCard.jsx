import React from 'react';

// WHY: The Executive Dashboard needs to display metrics (like total violations, active projects).
// A reusable StatCard keeps the visual layout of these metrics consistent.
export const StatCard = ({ title, value, trend, icon }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline text-3xl font-bold text-gray-900">
        {value}
      </div>
      {trend && (
        <div className={`mt-2 text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend} from last month
        </div>
      )}
    </div>
  );
};
