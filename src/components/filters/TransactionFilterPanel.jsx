import React from 'react';

const TransactionFilterPanel = ({
  showTransactionFilter,
  filters,
  updateFilter,
  clearFilters
}) => {
  if (!showTransactionFilter) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="TRANSFER">Transfer</option>
            <option value="RETURN">Return</option>
            <option value="DAMAGE">Damage</option>
            <option value="DELIVERY">Delivery</option>
            <option value="SALE">Sale</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Verified By</label>
          <input
            type="text"
            placeholder="Filter by verifier..."
            value={filters.verifiedBy}
            onChange={(e) => updateFilter('verifiedBy', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Min Items</label>
          <input
            type="number"
            placeholder="Min items..."
            value={filters.minItems}
            onChange={(e) => updateFilter('minItems', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Items</label>
          <input
            type="number"
            placeholder="Max items..."
            value={filters.maxItems}
            onChange={(e) => updateFilter('maxItems', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
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

export default TransactionFilterPanel;