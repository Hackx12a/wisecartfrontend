import React from 'react';
import SearchableBranchDropdown from '../common/SearchableBranchDropdown';

const BranchFilterPanel = ({
  showBranchFilter,
  branches,
  filters,
  updateFilter,
  clearFilters
}) => {
  if (!showBranchFilter) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <SearchableBranchDropdown
            branches={branches}
            value={filters.branch}
            onChange={(value) => updateFilter('branch', value)}
            placeholder="Select branch..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Min Total Stock</label>
          <input
            type="number"
            placeholder="Min total stock..."
            value={filters.minQty}
            onChange={(e) => updateFilter('minQty', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Total Stock</label>
          <input
            type="number"
            placeholder="Max total stock..."
            value={filters.maxQty}
            onChange={(e) => updateFilter('maxQty', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default BranchFilterPanel;