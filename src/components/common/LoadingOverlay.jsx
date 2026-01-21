import React from 'react';

export const LoadingOverlay = ({ show, message = 'Loading...' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{message}</p>
            <p className="text-sm text-gray-600 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;