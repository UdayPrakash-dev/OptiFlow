import React from 'react';

// WHY: Data fetching takes time. A loader provides immediate visual feedback 
// so the user knows the app is working and hasn't frozen.
export const Loader = () => {
  // TODO: Create a CSS spinner using Tailwind (e.g., 'animate-spin border-t-blue-500 rounded-full w-8 h-8').
  return (
    <div className="flex justify-center items-center p-4">
      <span>Loading...</span>
    </div>
  );
};
