import React from 'react';

// WHY: Compliance evidence requires uploading documents. A shared FileUpload component
// ensures consistent drag-and-drop zones, file size limits, and type validations across the app.
export const FileUpload = ({ onFileSelect, accept = '*/*' }) => {
  // TODO: Create a visual drag-and-drop area with Tailwind (e.g., 'border-2 border-dashed').
  // Use a hidden <input type="file" /> that is triggered when the area is clicked.
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:bg-gray-50">
      <label className="cursor-pointer">
        <span className="text-blue-600">Click to upload</span> or drag and drop
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
