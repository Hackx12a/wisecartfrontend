import React from 'react';
import { Search, X, Filter } from 'lucide-react';

const ProductFilterPanel = ({
  productSearchTerm,
  setProductSearchTerm,
  showVariationFilter,
  setShowVariationFilter
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Filter size={16} />
        Product Filters
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search products by name, SKU, or UPC..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={showVariationFilter}
          onChange={(e) => setShowVariationFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">All Products</option>
          <option value="BASE_ONLY">Base Products Only</option>
          <option value="VARIATION_ONLY">Variations Only</option>
        </select>
      </div>

      {(productSearchTerm || showVariationFilter !== 'ALL') && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              setProductSearchTerm('');
              setShowVariationFilter('ALL');
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1"
          >
            <X size={14} />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFilterPanel;