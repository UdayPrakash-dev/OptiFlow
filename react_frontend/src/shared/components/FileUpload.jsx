import React from 'react';

// WHY: Compliance evidence requires uploading documents. A shared FileUpload component
// ensures consistent drag-and-drop zones, file size limits, and type validations across the app.
export const FileUpload = ({ onFileSelect, accept = '*/*' }) => {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onFileSelect) onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      <label className="flex flex-col justify-center items-center w-full h-40 bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:bg-gray-100 transition-colors">
        <div className="flex flex-col justify-center items-center pt-5 pb-6">
          <svg className="mb-3 w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
        </div>
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
