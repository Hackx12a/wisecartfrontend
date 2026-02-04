// src/components/common/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  showingStart,
  showingEnd,
  totalItems
}) => {
  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Showing {showingStart} to {showingEnd} of {totalItems} results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed border-gray-200'
              : 'text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`min-w-[40px] px-3 py-2 text-sm rounded-lg border ${
                currentPage === number
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {number}
            </button>
          ))}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed border-gray-200'
              : 'text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;