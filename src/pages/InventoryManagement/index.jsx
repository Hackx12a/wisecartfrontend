import React, { useState, useEffect } from 'react';
import { Search, BarChart3, Building, Store, Package } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Hooks
import { useInventoryData } from '../../hooks/data/useInventoryData';
import { useTransactionHandlers } from '../../hooks/useTransactionHandlers';
import { useFilters } from '../../hooks/ui/useFilters';
import { usePaginationControl } from '../../hooks/ui/usePaginationControl';

// Components
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import ProductTransactionsModal from '../../components/modals/ProductTransactionsModal';
import ProductSummaryTable from '../../components/tables/InventoryManagement/ProductSummaryTable';
import WarehouseStockTable from '../../components/tables/InventoryManagement/WarehouseStockTable';
import BranchStockTable from '../../components/tables/InventoryManagement/BranchStockTable';
import TransactionTable from '../../components/tables/InventoryManagement/TransactionTable';
import ProductFilterPanel from '../../components/filters/ProductFilterPanel';
import WarehouseFilterPanel from '../../components/filters/WarehouseFilterPanel';
import BranchFilterPanel from '../../components/filters/BranchFilterPanel';
import TransactionFilterPanel from '../../components/filters/TransactionFilterPanel';

// Utils
import { calculateTotalQuantity } from '../../utils/transactionHelpers';
import {
  filterProductSummaries,
  filterWarehouseStocks,
  filterBranchStocks,
  filterInventories
} from '../../utils/inventoryFilters';

const InventoryManagement = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [showVariationFilter, setShowVariationFilter] = useState('ALL');
  const [showWarehouseFilter, setShowWarehouseFilter] = useState(true);
  const [showBranchFilter, setShowBranchFilter] = useState(true);
  const [showTransactionFilter, setShowTransactionFilter] = useState(true);

  // Custom Hooks
  const {
    inventories,
    products,
    productSummaries,
    warehouses,
    branches,
    warehouseStocks,
    branchStocks,
    sales,
    companies,
    loading,
    actionLoading,
    loadingMessage,
    deletingId,
    viewingId,
    setInventories,
    setWarehouseStocks,
    setBranchStocks,
    setProductSummaries,
    setActionLoading,
    setLoadingMessage,
    setViewingId,
    loadData,
    handleDelete
  } = useInventoryData();

  const transactionHandlers = useTransactionHandlers();

  // Filter hooks
  const warehouseFilters = useFilters({
    warehouse: '',
    minQty: '',
    maxQty: '',
    startDate: '',
    endDate: ''
  });

  const branchFilters = useFilters({
    branch: '',
    minQty: '',
    maxQty: '',
    startDate: '',
    endDate: ''
  });

  const transactionFilters = useFilters({
    type: 'ALL',
    verifiedBy: '',
    startDate: '',
    endDate: '',
    minItems: '',
    maxItems: ''
  });

  // Pagination hooks
  const productPagination = usePaginationControl(10);
  const stockPagination = usePaginationControl(10);
  const transactionPagination = usePaginationControl(10);

  // Filtered data
  const filteredProductSummaries = filterProductSummaries(productSummaries, productSearchTerm, showVariationFilter);
  const filteredWarehouseStocks = filterWarehouseStocks(warehouseStocks, stockSearchTerm, warehouseFilters.filters);
  const filteredBranchStocks = filterBranchStocks(branchStocks, stockSearchTerm, branchFilters.filters);
  const filteredInventories = filterInventories(inventories, searchTerm, transactionFilters.filters, warehouses, branches);

  // Paginated data
  const currentProductSummaries = productPagination.getPageItems(filteredProductSummaries);
  const currentWarehouseStocks = stockPagination.getPageItems(filteredWarehouseStocks);
  const currentBranchStocks = stockPagination.getPageItems(filteredBranchStocks);
  const currentInventories = transactionPagination.getPageItems(filteredInventories);

  // Total pages
  const productTotalPages = productPagination.getTotalPages(filteredProductSummaries.length);
  const warehouseStockTotalPages = stockPagination.getTotalPages(filteredWarehouseStocks.length);
  const branchStockTotalPages = stockPagination.getTotalPages(filteredBranchStocks.length);
  const transactionTotalPages = transactionPagination.getTotalPages(filteredInventories.length);

  // Set up global loadData
  useEffect(() => {
    loadData();
    window.loadData = loadData;

    return () => {
      delete window.loadData;
    };
  }, [loadData]);

  // Handler functions
  const handleViewTransaction = (transaction) => {
    transactionHandlers.handleViewTransaction(
      transaction,
      setActionLoading,
      setLoadingMessage,
      setViewingId
    );
  };

  const handleViewTransactions = (product, showStock = false) => {
    transactionHandlers.handleViewTransactions(
      product,
      showStock,
      setActionLoading,
      setLoadingMessage
    );
  };

  const handleViewStockTransactions = (stock, locationType) => {
    transactionHandlers.handleViewStockTransactions(
      stock,
      locationType,
      setActionLoading,
      setLoadingMessage
    );
  };

  const handleDeleteTransaction = (id) => {
    handleDelete(
      id,
      inventories,
      setInventories,
      setWarehouseStocks,
      setBranchStocks,
      setProductSummaries
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingOverlay show={true} message="Loading" />
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay show={loading || actionLoading} message={loadingMessage || 'Loading...'} />
      <div className="p-6 max-w-full mx-auto">
        <Toaster position="top-right" />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Track stock movements across warehouses and branches with delivery integration</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <BarChart3 className="inline w-4 h-4 mr-2" />
                Product Summary
              </button>
              <button
                onClick={() => setActiveTab('warehouse-stocks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'warehouse-stocks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Building className="inline w-4 h-4 mr-2" />
                Warehouse Stocks
              </button>
              <button
                onClick={() => setActiveTab('branch-stocks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'branch-stocks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Store className="inline w-4 h-4 mr-2" />
                Branch Stocks
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Package className="inline w-4 h-4 mr-2" />
                Transactions
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'products' && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or UPC..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <ProductFilterPanel
              productSearchTerm={productSearchTerm}
              setProductSearchTerm={setProductSearchTerm}
              showVariationFilter={showVariationFilter}
              setShowVariationFilter={setShowVariationFilter}
            />

            <ProductSummaryTable
              currentProductSummaries={currentProductSummaries}
              filteredProductSummaries={filteredProductSummaries}
              productIndexOfFirstItem={productPagination.getIndexOfFirstItem()}
              productIndexOfLastItem={productPagination.getIndexOfLastItem(filteredProductSummaries.length)}
              handleViewTransactions={handleViewTransactions}
              productCurrentPage={productPagination.currentPage}
              productTotalPages={productTotalPages}
              setProductCurrentPage={productPagination.setCurrentPage}
            />
          </div>
        )}

        {activeTab === 'warehouse-stocks' && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search warehouse stocks by product name, warehouse, or SKU..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <WarehouseFilterPanel
              showWarehouseFilter={showWarehouseFilter}
              warehouses={warehouses}
              filters={warehouseFilters.filters}
              updateFilter={warehouseFilters.updateFilter}
              clearFilters={warehouseFilters.clearFilters}
            />

            <WarehouseStockTable
              currentWarehouseStocks={currentWarehouseStocks}
              filteredWarehouseStocks={filteredWarehouseStocks}
              stockIndexOfFirstItem={stockPagination.getIndexOfFirstItem()}
              stockIndexOfLastItem={stockPagination.getIndexOfLastItem(filteredWarehouseStocks.length)}
              handleViewStockTransactions={handleViewStockTransactions}
              stockCurrentPage={stockPagination.currentPage}
              warehouseStockTotalPages={warehouseStockTotalPages}
              setStockCurrentPage={stockPagination.setCurrentPage}
            />
          </div>
        )}

        {activeTab === 'branch-stocks' && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search branch stocks by product name, branch, or SKU..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <BranchFilterPanel
              showBranchFilter={showBranchFilter}
              branches={branches}
              filters={branchFilters.filters}
              updateFilter={branchFilters.updateFilter}
              clearFilters={branchFilters.clearFilters}
            />

            <BranchStockTable
              currentBranchStocks={currentBranchStocks}
              filteredBranchStocks={filteredBranchStocks}
              stockIndexOfFirstItem={stockPagination.getIndexOfFirstItem()}
              stockIndexOfLastItem={stockPagination.getIndexOfLastItem(filteredBranchStocks.length)}
              handleViewStockTransactions={handleViewStockTransactions}
              stockCurrentPage={stockPagination.currentPage}
              branchStockTotalPages={branchStockTotalPages}
              setStockCurrentPage={stockPagination.setCurrentPage}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <TransactionFilterPanel
              showTransactionFilter={showTransactionFilter}
              filters={transactionFilters.filters}
              updateFilter={transactionFilters.updateFilter}
              clearFilters={transactionFilters.clearFilters}
            />

            <TransactionTable
              currentInventories={currentInventories}
              filteredInventories={filteredInventories}
              indexOfFirstItem={transactionPagination.getIndexOfFirstItem()}
              indexOfLastItem={transactionPagination.getIndexOfLastItem(filteredInventories.length)}
              currentPage={transactionPagination.currentPage}
              totalPages={transactionTotalPages}
              setCurrentPage={transactionPagination.setCurrentPage}
              viewingId={viewingId}
              deletingId={deletingId}
              handleViewTransaction={handleViewTransaction}
              handleDelete={handleDeleteTransaction}
              calculateTotalQuantity={calculateTotalQuantity}
            />
          </>
        )}

        <ProductTransactionsModal
          product={transactionHandlers.selectedProduct}
          transactions={transactionHandlers.productTransactions}
          isOpen={transactionHandlers.showTransactionsModal}
          onClose={() => transactionHandlers.setShowTransactionsModal(false)}
          showStockDetails={transactionHandlers.showStockDetails}
          warehouseStocks={warehouseStocks}
          branchStocks={branchStocks}
        />
      </div>
    </>
  );
};

export default InventoryManagement;