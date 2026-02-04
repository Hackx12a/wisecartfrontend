// src/components/filters/InventoryFilters.jsx
import React from 'react';
import { Search } from 'lucide-react';
import SearchableLocationDropdown from '../common/SearchableLocationDropdown';

const InventoryFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  fromWarehouseFilter,
  setFromWarehouseFilter,
  toWarehouseFilter,
  setToWarehouseFilter,
  fromBranchFilter,
  setFromBranchFilter,
  toBranchFilter,
  setToBranchFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  warehouses,
  branches,
  onClearFilters
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <div className="flex gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 border border-gray-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Inventory Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="TRANSFER">Transfer</option>
            <option value="RETURN">Return</option>
            <option value="DAMAGE">Damage</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">From Warehouse</label>
          <SearchableLocationDropdown
            locations={warehouses.map(wh => ({ id: wh.id, name: wh.warehouseName, code: wh.warehouseCode }))}
            value={fromWarehouseFilter}
            onChange={setFromWarehouseFilter}
            placeholder="All Warehouses"
            label="warehouses"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">To Warehouse</label>
          <SearchableLocationDropdown
            locations={warehouses.map(wh => ({ id: wh.id, name: wh.warehouseName, code: wh.warehouseCode }))}
            value={toWarehouseFilter}
            onChange={setToWarehouseFilter}
            placeholder="All Warehouses"
            label="warehouses"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">From Branch</label>
          <SearchableLocationDropdown
            locations={branches.map(br => ({ id: br.id, name: br.branchName, code: br.branchCode }))}
            value={fromBranchFilter}
            onChange={setFromBranchFilter}
            placeholder="All Branches"
            label="branches"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">To Branch</label>
          <SearchableLocationDropdown
            locations={branches.map(br => ({ id: br.id, name: br.branchName, code: br.branchCode }))}
            value={toBranchFilter}
            onChange={setToBranchFilter}
            placeholder="All Branches"
            label="branches"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition font-medium"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;