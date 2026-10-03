import React from 'react';

// WHY: We use a shared Button component to ensure all buttons across the app 
// have consistent styling (padding, rounded corners, hover states) and behavior.
export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  // TODO: Add actual Tailwind classes for base styles and variants.
  // base styles: e.g., 'px-4 py-2 rounded font-medium transition-colors'
  // primary: 'bg-blue-600 text-white hover:bg-blue-700'
  return (
    <button 
      className={`btn btn-${variant} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
