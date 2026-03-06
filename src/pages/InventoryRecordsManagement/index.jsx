// src/pages/InventoryRecordsManagement/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check, X, AlertTriangle, Package, ShoppingCart } from 'lucide-react';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import InventoryFilters from '../../components/filters/InventoryFilters';
import InventoryTable from '../../components/tables/InventoryTable';
import InventoryFormModal from '../../components/modals/InventoryFormModal';
import InventoryViewModal from '../../components/modals/InventoryViewModal';
import Pagination from '../../components/common/Pagination';
import useInventory from '../../hooks/data/useInventory';
import usePagination from '../../hooks/ui/usePagination';
import { getCurrentUser, isAdmin } from '../../utils/authUtils';
import { api } from '../../services/api';

// ─── Enterprise-Grade Delete Error Modal with Perfectly Aligned DR Cards ───
const DeleteErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  const lines = message.split('\n');

  // Parse into product → { deliveryReceipts[], saleRefs[] }
  const productMap = {};
  let inDeliveries = false;
  let inSales = false;
  let currentKey = null;

  lines.forEach(line => {
    if (line.includes('USED IN DELIVERIES')) { inDeliveries = true; inSales = false; return; }
    if (line.includes('USED IN SALES'))      { inSales = true; inDeliveries = false; return; }

    if (inDeliveries || inSales) {
      if (line.trim().startsWith('•')) {
        currentKey = line.trim().replace('•', '').trim();
        if (!productMap[currentKey]) productMap[currentKey] = { deliveryReceipts: [], saleRefs: [] };
      } else if (line.trim().startsWith('-') && currentKey) {
        const val = line.trim().replace(/^-\s*/, '').trim();
        if (inDeliveries) productMap[currentKey].deliveryReceipts.push(val);
        if (inSales)      productMap[currentKey].saleRefs.push(val);
      }
    }
  });

  const products = Object.entries(productMap);
  const hasStructuredData = products.length > 0;

  /**
   * Parses: "DR-0001 (qty:5|status:DELIVERED)"
   *      or "DR-0001 (qty:5)"            ← legacy / sales
   * Returns: { label, qty, status }
   */
  const parseRef = (raw) => {
    const fullMatch = raw.match(/^(.+?)\s*\(qty:(\d+)\|status:([^)]+)\)\s*$/);
    if (fullMatch) {
      return {
        label: fullMatch[1].trim(),
        qty: parseInt(fullMatch[2], 10),
        status: fullMatch[3].trim(),
      };
    }
    const simpleMatch = raw.match(/^(.+?)\s*\(qty:(\d+)\)\s*$/);
    if (simpleMatch) {
      return { label: simpleMatch[1].trim(), qty: parseInt(simpleMatch[2], 10), status: null };
    }
    return { label: raw, qty: null, status: null };
  };

  // Professional status configurations with semantic colors
  const statusConfig = {
    DELIVERED: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: '✓',
      label: 'Delivered',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    IN_TRANSIT: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: '⟳',
      label: 'In Transit',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    PREPARING: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: '⚙',
      label: 'Preparing',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    PENDING: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
      icon: '⏱',
      label: 'Pending',
      badge: 'bg-slate-50 text-slate-700 border-slate-200',
    },
  };

  const getStatusMeta = (status) => {
    return statusConfig[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      dot: 'bg-gray-500',
      icon: '•',
      label: status || 'Unknown',
      badge: 'bg-gray-50 text-gray-700 border-gray-200',
    };
  };

  // Sophisticated conflict type configurations
  const conflictThemes = {
    mixed: {
      border: 'border-l-4 border-l-rose-500',
      headerBg: 'bg-gradient-to-r from-rose-50/80 to-amber-50/80',
      icon: '⚠️',
      label: 'Mixed Transaction Conflict',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      accent: 'text-rose-600',
      shadow: 'shadow-rose-100',
    },
    delivery: {
      border: 'border-l-4 border-l-blue-500',
      headerBg: 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80',
      icon: '📦',
      label: 'Delivery Conflict',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      accent: 'text-blue-600',
      shadow: 'shadow-blue-100',
    },
    sale: {
      border: 'border-l-4 border-l-orange-500',
      headerBg: 'bg-gradient-to-r from-orange-50/80 to-amber-50/80',
      icon: '🛒',
      label: 'Sale Conflict',
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      accent: 'text-orange-600',
      shadow: 'shadow-orange-100',
    },
  };

  const getConflictTheme = (hasDelivery, hasSale) => {
    if (hasDelivery && hasSale) return conflictThemes.mixed;
    if (hasDelivery) return conflictThemes.delivery;
    return conflictThemes.sale;
  };

  // Calculate totals
  const totals = products.reduce((acc, [, { deliveryReceipts, saleRefs }]) => {
    deliveryReceipts.forEach(dr => {
      const { qty } = parseRef(dr);
      if (qty) acc.deliveryQty += qty;
    });
    saleRefs.forEach(s => {
      const { qty } = parseRef(s);
      if (qty) acc.saleQty += qty;
    });
    acc.deliveryCount += deliveryReceipts.length;
    acc.saleCount += saleRefs.length;
    return acc;
  }, { deliveryCount: 0, saleCount: 0, deliveryQty: 0, saleQty: 0 });

  const totalBlockedQty = totals.deliveryQty + totals.saleQty;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Premium backdrop with multi-layer blur */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-900/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal with elevated design - ENLARGED WIDTH */}
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/20">
        
        {/* Glass background with subtle gradient */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-slate-50/90" />
        
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500" />

        {/* Content container */}
        <div className="relative flex flex-col max-h-[90vh]">

          {/* ── Premium Header with Impact Summary ── */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-200/50">
            <div className="flex items-start gap-5">
              {/* Warning icon with glow - ENLARGED */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-rose-500/20 rounded-xl blur-lg" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <AlertTriangle size={32} className="text-white" />
                </div>
              </div>

              {/* Title section */}
              <div className="flex-1 min-w-0">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Delete Blocked
                </h2>
                <p className="text-base text-slate-600">
                  This inventory record cannot be deleted because stock has been allocated to active transactions
                </p>
              </div>

              {/* Close button - ENLARGED */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Impact metrics dashboard - ENLARGED GRID */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Products</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{products.length}</span>
                  <span className="text-sm text-slate-600">affected</span>
                </div>
              </div>
              
              {totals.deliveryCount > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200/50">
                  <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Deliveries</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-blue-700">{totals.deliveryCount}</span>
                    <span className="text-sm text-blue-600">DRs</span>
                  </div>
                  <div className="text-xs text-blue-600/80 mt-1">{totals.deliveryQty} units</div>
                </div>
              )}
              
              {totals.saleCount > 0 && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200/50">
                  <div className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">Sales</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-orange-700">{totals.saleCount}</span>
                    <span className="text-sm text-orange-600">orders</span>
                  </div>
                  <div className="text-xs text-orange-600/80 mt-1">{totals.saleQty} units</div>
                </div>
              )}
              
              {totalBlockedQty > 0 && (
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200/50">
                  <div className="text-xs font-medium text-rose-600 uppercase tracking-wider mb-1">Total Blocked</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-rose-700">{totalBlockedQty}</span>
                    <span className="text-sm text-rose-600">units</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── Scrollable Product Cards with Custom Scrollbar ─── */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300">
            {hasStructuredData ? (
              <>
                {products.map(([productName, { deliveryReceipts, saleRefs }], index) => {
                  const theme = getConflictTheme(deliveryReceipts.length > 0, saleRefs.length > 0);
                  const productDrQty = deliveryReceipts.reduce((a, dr) => a + (parseRef(dr).qty ?? 0), 0);
                  const productSaleQty = saleRefs.reduce((a, r) => a + (parseRef(r).qty ?? 0), 0);
                  
                  return (
                    <div
                      key={index}
                      className={`group relative rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${theme.border}`}
                    >
                      {/* Product Header - ENLARGED */}
                      <div className={`px-6 py-5 ${theme.headerBg} border-b border-slate-200/50`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="text-2xl filter drop-shadow-sm">{theme.icon}</span>
                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold text-slate-900 truncate">
                                {productName}
                              </h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${theme.badge}`}>
                                  {theme.label}
                                </span>
                                {(productDrQty + productSaleQty) > 0 && (
                                  <span className="text-sm text-slate-500">
                                    {productDrQty + productSaleQty} units affected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {productDrQty > 0 && productSaleQty > 0 && (
                            <div className="flex gap-2 ml-4">
                              {productDrQty > 0 && (
                                <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200">
                                  📦 {productDrQty}
                                </span>
                              )}
                              {productSaleQty > 0 && (
                                <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md border border-orange-200">
                                  🛒 {productSaleQty}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Transactions Details - ENLARGED */}
                      <div className="p-6 space-y-5">
                        {/* Delivery Receipts - PERFECTLY ALIGNED GRID */}
                        {deliveryReceipts.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Package size={16} className="text-blue-700" />
                                </div>
                                <span className="text-base font-semibold text-blue-900">
                                  Delivery Receipts
                                </span>
                              </div>
                              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                                {deliveryReceipts.length} item{deliveryReceipts.length !== 1 ? 's' : ''} · {productDrQty} units
                              </span>
                            </div>
                            
                            {/* PERFECTLY ALIGNED DR CARDS - 3 column grid for wider modal */}
                            <div className="grid grid-cols-3 gap-3">
                              {deliveryReceipts.map((dr, idx) => {
                                const { label, qty, status } = parseRef(dr);
                                const statusMeta = status ? getStatusMeta(status) : null;
                                
                                return (
                                  <div
                                    key={idx}
                                    className="group/receipt w-full"
                                  >
                                    {/* Fixed width card with consistent layout - ENLARGED */}
                                    <div className="flex w-full bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all duration-200 overflow-hidden">
                                      {/* DR Number - Fixed width */}
                                      <div className="flex-none w-28 px-3 py-2 bg-slate-50 border-r border-slate-200">
                                        <span className="block text-sm font-mono font-medium text-slate-700 truncate" title={label}>
                                          {label}
                                        </span>
                                      </div>
                                      
                                      {/* Quantity - Fixed width */}
                                      {qty && (
                                        <>
                                          <div className="flex-none w-20 px-3 py-2 bg-white border-r border-slate-200">
                                            <span className="block text-sm font-semibold text-slate-900 text-center">
                                              {qty} pcs
                                            </span>
                                          </div>
                                        </>
                                      )}
                                      
                                      {/* Status - Takes remaining space */}
                                      {statusMeta && (
                                        <div className="flex-1 min-w-0 px-3 py-2 bg-white">
                                          <div className={`flex items-center justify-center gap-1.5 text-sm font-medium ${statusMeta.text}`}>
                                            <span className={`w-2 h-2 rounded-full ${statusMeta.dot} flex-shrink-0`} />
                                            <span className="truncate">{statusMeta.label}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Status Legend */}
                            {[...new Set(deliveryReceipts.map(dr => parseRef(dr).status).filter(Boolean))].length > 1 && (
                              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                                <span className="text-sm text-slate-400">Status:</span>
                                {Object.entries(statusConfig)
                                  .filter(([status]) => 
                                    deliveryReceipts.some(dr => parseRef(dr).status === status)
                                  )
                                  .map(([status, config]) => (
                                    <div key={status} className="flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                      <span className="text-sm text-slate-600">{config.label}</span>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sales - PERFECTLY ALIGNED GRID */}
                        {saleRefs.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <ShoppingCart size={16} className="text-orange-700" />
                                </div>
                                <span className="text-base font-semibold text-orange-900">
                                  Sales Orders
                                </span>
                              </div>
                              <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-medium">
                                {saleRefs.length} item{saleRefs.length !== 1 ? 's' : ''} · {productSaleQty} units
                              </span>
                            </div>
                            
                            {/* PERFECTLY ALIGNED SALE CARDS - 3 column grid */}
                            <div className="grid grid-cols-3 gap-3">
                              {saleRefs.map((ref, idx) => {
                                const { label, qty } = parseRef(ref);
                                return (
                                  <div
                                    key={idx}
                                    className="group/receipt w-full"
                                  >
                                    {/* Fixed width card with consistent layout - ENLARGED */}
                                    <div className="flex w-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                      {/* Reference Number - Fixed width */}
                                      <div className="flex-none w-28 px-3 py-2 bg-slate-50 border-r border-slate-200">
                                        <span className="block text-sm font-mono font-medium text-slate-700 truncate" title={label}>
                                          {label}
                                        </span>
                                      </div>
                                      
                                      {/* Quantity - Takes remaining space */}
                                      {qty && (
                                        <div className="flex-1 px-3 py-2 bg-white">
                                          <span className="block text-sm font-semibold text-slate-900 text-center">
                                            {qty} pcs
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Resolution Guide - ENLARGED */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-6 border border-amber-200/60 mt-8">
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-200/50 rounded-xl flex items-center justify-center">
                      <span className="text-3xl">📋</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-amber-900 mb-2">Required Actions</h4>
                      <p className="text-base text-amber-800/90 leading-relaxed">
                        Before deleting this inventory record, you must void or cancel all associated 
                        delivery receipts and sales orders. Once all transactions are voided, the stock 
                        will be released and you can safely delete this record.
                      </p>
                      <div className="flex items-center gap-6 mt-4 text-sm text-amber-700">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Void deliveries first
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Cancel sales orders
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Retry deletion
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                  {message}
                </pre>
              </div>
            )}
          </div>

          {/* ─── Footer with Actions - ENLARGED ─── */}
          <div className="relative flex-shrink-0 px-8 py-5 border-t border-slate-200/50 bg-gradient-to-b from-white to-slate-50/50">
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl hover:from-slate-900 hover:to-slate-950 transition-all duration-200 shadow-lg shadow-slate-900/20"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const InventoryRecordsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('');
  const [fromBranchFilter, setFromBranchFilter] = useState('');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('');
  const [toBranchFilter, setToBranchFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // ── NEW: error modal state ────────────────────────────
  const [deleteErrorMessage, setDeleteErrorMessage] = useState(null);

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedProductForAdd, setSelectedProductForAdd] = useState('');
  const [tempQuantity, setTempQuantity] = useState(1);

  const [formData, setFormData] = useState({
    inventoryType: 'STOCK_IN',
    fromWarehouseId: '',
    toWarehouseId: '',
    fromBranchId: '',
    toBranchId: '',
    dateProcessed: new Date().toISOString().split('T')[0],
    processedBy: getCurrentUser(),
    remarks: '',
    status: 'PENDING',
    confirmedBy: '',
    items: []
  });

  // Custom hooks
  const {
    inventories,
    loading,
    canModifyStatus,
    warehouseStocks,
    branchStocks,
    loadingStocks,
    loadData,
    loadLocationStock,
    checkCanModify,
    confirmInventory,
    deleteInventory,
    updateInventory,
    createInventory,
    setWarehouseStocks,
    setBranchStocks
  } = useInventory();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setActionLoading(true);
        setLoadingMessage('Loading data...');

        const [productsRes, warehousesRes, branchesRes] = await Promise.all([
          api.get('/products'),
          api.get('/warehouse'),
          api.get('/branches')
        ]);

        const productsData = productsRes.success ? productsRes.data || [] : [];
        const warehousesData = warehousesRes.success ? warehousesRes.data || [] : [];
        const branchesData = branchesRes.success ? branchesRes.data || [] : [];

        setProducts(productsData);
        setWarehouses(warehousesData);
        setBranches(branchesData);

        await loadData();
      } catch (error) {
        console.error('Failed to load initial data', error);
        alert('Failed to load data: ' + error.message);
      } finally {
        setActionLoading(false);
        setLoadingMessage('');
      }
    };

    loadInitialData();
  }, [loadData]);

  // Memoized product options
  const productOptions = useMemo(() => {
    return products.flatMap(p => {
      if (p.variations && p.variations.length > 0) {
        return p.variations.map(v => {
          const uniqueId = `${p.id}_${v.id}`;
          const displayName = p.productName;
          const upc = v.upc || p.upc || 'No UPC';
          const sku = v.sku || p.sku || 'No SKU';

          return {
            id: uniqueId,
            parentProductId: p.id,
            variationId: v.id,
            originalProductId: p.id,
            originalVariationId: v.id,
            name: displayName,
            subLabel: v.combinationDisplay || 'Variation',
            fullName: p.productName,
            upc: upc,
            sku: sku,
            price: v.price || p.price,
            isVariation: true
          };
        });
      } else {
        const uniqueId = `prod_${p.id}`;
        const upc = p.upc || 'No UPC';
        const sku = p.sku || 'No SKU';
        const displayName = p.productName;

        return [{
          id: uniqueId,
          parentProductId: p.id,
          variationId: null,
          originalProductId: p.id,
          originalVariationId: null,
          name: displayName,
          subLabel: 'No variations',
          fullName: p.productName,
          upc: upc,
          sku: sku,
          price: p.price,
          isVariation: false
        }];
      }
    });
  }, [products]);

  // Filter inventories
  const filteredInventories = inventories.filter(inventory => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      inventory.processedBy?.toLowerCase().includes(searchLower) ||
      inventory.remarks?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'ALL' || inventory.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || inventory.inventoryType === typeFilter;

    const matchesFromWarehouse = !fromWarehouseFilter || inventory.fromWarehouse?.id === parseInt(fromWarehouseFilter);
    const matchesToWarehouse = !toWarehouseFilter || inventory.toWarehouse?.id === parseInt(toWarehouseFilter);
    const matchesFromBranch = !fromBranchFilter || inventory.fromBranch?.id === parseInt(fromBranchFilter);
    const matchesToBranch = !toBranchFilter || inventory.toBranch?.id === parseInt(toBranchFilter);

    const inventoryDate = new Date(inventory.dateProcessed);
    const matchesStartDate = !startDateFilter || inventoryDate >= new Date(startDateFilter);
    const matchesEndDate = !endDateFilter || inventoryDate <= new Date(endDateFilter + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesType &&
      matchesFromWarehouse && matchesToWarehouse &&
      matchesFromBranch && matchesToBranch &&
      matchesStartDate && matchesEndDate;
  });

  // Sort by status (PENDING first, then CONFIRMED)
  const sortedInventories = [...filteredInventories].sort((a, b) => {
    const isAConfirmed = a.status === 'CONFIRMED' ? 1 : 0;
    const isBConfirmed = b.status === 'CONFIRMED' ? 1 : 0;
    if (isAConfirmed !== isBConfirmed) {
      return isAConfirmed - isBConfirmed;
    }
    return 0;
  });

  // Pagination
  const {
    currentPage,
    setCurrentPage,
    currentItems: currentInventories,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    nextPage,
    prevPage
  } = usePagination(sortedInventories, 10);

  // Modal handlers
  const handleOpenModal = async (mode, inventory = null) => {
    setModalMode(mode);

    if (mode === 'create') {
      setSelectedInventory(null);
      setFormData({
        inventoryType: 'STOCK_IN',
        fromWarehouseId: '',
        toWarehouseId: '',
        fromBranchId: '',
        toBranchId: '',
        dateProcessed: new Date().toISOString().split('T')[0],
        processedBy: getCurrentUser(),
        remarks: '',
        status: 'PENDING',
        confirmedBy: '',
        items: []
      });
      setWarehouseStocks({});
      setBranchStocks({});
      setShowModal(true);
    } else if (mode === 'edit' && inventory) {
      if (inventory.status === 'CONFIRMED') {
        alert('⚠️ CONFIRMED INVENTORY CANNOT BE EDITED\n\n' +
          'Once an inventory is confirmed, it cannot be edited.\n\n' +
          'Stock changes have been applied to the system.\n\n' +
          'If you need to make changes:\n' +
          '1. Delete this record (admin only, if stock hasn\'t been used)\n' +
          '2. Create a new inventory record with the correct information\n\n' +
          'Contact your administrator for assistance.');
        return;
      }

      try {
        setActionLoading(true);
        setLoadingMessage('Loading inventory details...');

        const fullInventoryRes = await api.get(`/inventories/${inventory.id}`);
        if (!fullInventoryRes.success) {
          throw new Error(fullInventoryRes.error || 'Failed to load inventory');
        }

        const fullInventory = fullInventoryRes.data;
        setSelectedInventory(fullInventory);

        setFormData({
          inventoryType: fullInventory.inventoryType,
          fromWarehouseId: fullInventory.fromWarehouse?.id || '',
          toWarehouseId: fullInventory.toWarehouse?.id || '',
          fromBranchId: fullInventory.fromBranch?.id || '',
          toBranchId: fullInventory.toBranch?.id || '',
          dateProcessed: fullInventory.dateProcessed,
          processedBy: fullInventory.processedBy,
          remarks: fullInventory.remarks || '',
          status: 'PENDING',
          confirmedBy: fullInventory.confirmedBy || '',
          items: fullInventory.items.map(item => ({
            productId: item.product.id,
            variationId: item.variationId || null,
            quantity: item.quantity
          }))
        });

        setWarehouseStocks({});
        setBranchStocks({});

        for (let i = 0; i < fullInventory.items.length; i++) {
          const item = fullInventory.items[i];
          if (item.product?.id) {
            const locationType = fullInventory.fromWarehouse ? 'warehouse' : fullInventory.fromBranch ? 'branch' :
              fullInventory.toWarehouse ? 'warehouse' : 'branch';
            const locationId = fullInventory.fromWarehouse?.id || fullInventory.fromBranch?.id ||
              fullInventory.toWarehouse?.id || fullInventory.toBranch?.id;

            if (locationId && locationType) {
              await loadLocationStock(
                item.product.id,
                item.variationId || null,
                i,
                locationId,
                locationType
              );
            }
          }
        }

        setActionLoading(false);
        setLoadingMessage('');
        setShowModal(true);
      } catch (error) {
        console.error('Failed to load inventory details');
        alert('Failed to load inventory details: ' + error.message);
        setActionLoading(false);
        setLoadingMessage('');
      }
    } else if (mode === 'view' && inventory) {
      try {
        setActionLoading(true);
        setLoadingMessage('Loading inventory details...');

        const fullInventoryRes = await api.get(`/inventories/${inventory.id}`);
        if (fullInventoryRes.success) {
          setSelectedInventory(fullInventoryRes.data);
        }

        setActionLoading(false);
        setLoadingMessage('');
        setShowModal(true);
      } catch (error) {
        console.error('Failed to load inventory details:', error);
        setActionLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInventory(null);
    setSelectedProductForAdd('');
    setWarehouseStocks({});
    setBranchStocks({});
  };

  // Form handlers
  const handleAddProductToTable = () => {
    if (!selectedProductForAdd) {
      alert('Please select a product first');
      return;
    }

    const selectedOption = productOptions.find(opt => opt.id === selectedProductForAdd);
    if (!selectedOption) {
      alert('Product not found');
      return;
    }

    const isDuplicate = formData.items.some((item) => {
      return (
        item.productId === selectedOption.parentProductId &&
        item.variationId === selectedOption.variationId
      );
    });

    if (isDuplicate) {
      alert('⚠️ This product variation is already added!\n\nPlease select a different variation or update the quantity of the existing item.');
      return;
    }

    if (formData.inventoryType !== 'STOCK_IN') {
      const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
        formData.toWarehouseId || formData.toBranchId;

      if (hasLocation) {
        const stockInfo = getItemStockInfo(-1, selectedOption.parentProductId, selectedOption.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (availableQty === 0) {
            alert('❌ Cannot add this product!\n\n' +
              `Product: ${selectedOption.fullName}\n` +
              `Available Stock: ${availableQty}\n\n` +
              'This product has no available stock at the selected location.\n' +
              'Please select a different product or location.');
            return;
          }
        }
      }
    }

    const newItem = {
      productId: selectedOption.parentProductId,
      variationId: selectedOption.variationId,
      quantity: 1
    };

    const newItems = [...formData.items, newItem];
    setFormData({ ...formData, items: newItems });

    const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
      formData.toWarehouseId || formData.toBranchId;

    if (hasLocation) {
      setTimeout(() => {
        const locationType = formData.fromWarehouseId ? 'warehouse' : formData.fromBranchId ? 'branch' :
          formData.toWarehouseId ? 'warehouse' : 'branch';
        const locationId = formData.fromWarehouseId || formData.fromBranchId ||
          formData.toWarehouseId || formData.toBranchId;

        loadLocationStock(
          selectedOption.originalProductId,
          selectedOption.originalVariationId,
          newItems.length - 1,
          locationId,
          locationType
        );
      }, 0);
    }

    setSelectedProductForAdd('');
  };

  const handleItemChange = async (index, field, value) => {
    const newItems = [...formData.items];

    if (field === 'productId') {
      const selectedOption = productOptions.find(opt => opt.id === value);
      if (selectedOption) {
        const isDuplicate = formData.items.some((item, idx) => {
          if (idx === index) return false;
          return (
            item.productId === selectedOption.parentProductId &&
            item.variationId === selectedOption.variationId
          );
        });

        if (isDuplicate) {
          alert('⚠️ This product variation is already added!\n\nPlease select a different variation or update the quantity of the existing item.');
          return;
        }

        newItems[index] = {
          ...newItems[index],
          productId: selectedOption.parentProductId,
          variationId: selectedOption.variationId,
        };

        setFormData({ ...formData, items: newItems });

        const hasLocation = formData.fromWarehouseId || formData.fromBranchId ||
          formData.toWarehouseId || formData.toBranchId;

        if (hasLocation) {
          setTimeout(() => {
            const locationType = formData.fromWarehouseId ? 'warehouse' : formData.fromBranchId ? 'branch' :
              formData.toWarehouseId ? 'warehouse' : 'branch';
            const locationId = formData.fromWarehouseId || formData.fromBranchId ||
              formData.toWarehouseId || formData.toBranchId;

            loadLocationStock(
              selectedOption.originalProductId,
              selectedOption.originalVariationId,
              index,
              locationId,
              locationType
            );
          }, 0);
        }
        return;
      }
    } else if (field === 'quantity') {
      const newQuantity = parseInt(value) || 1;

      if (formData.inventoryType !== 'STOCK_IN') {
        const item = newItems[index];
        const stockInfo = getItemStockInfo(index, item.productId, item.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (newQuantity > availableQty) {
            const selectedOption = productOptions.find(opt =>
              opt.originalProductId === item.productId &&
              opt.originalVariationId === item.variationId
            );

            alert('❌ Quantity Exceeds Available Stock!\n\n' +
              `Product: ${selectedOption?.fullName || 'Unknown'}\n` +
              `Available Stock: ${availableQty}\n` +
              `Requested Quantity: ${newQuantity}\n\n` +
              'Please enter a quantity that does not exceed the available stock.');
            return;
          }
        }
      }

      newItems[index][field] = newQuantity;
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });

    const newWarehouseStocks = { ...warehouseStocks };
    const newBranchStocks = { ...branchStocks };

    Object.keys(warehouseStocks).forEach(key => {
      if (key.startsWith(`${index}_`)) {
        delete newWarehouseStocks[key];
      }
    });

    Object.keys(branchStocks).forEach(key => {
      if (key.startsWith(`${index}_`)) {
        delete newBranchStocks[key];
      }
    });

    setWarehouseStocks(newWarehouseStocks);
    setBranchStocks(newBranchStocks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.processedBy) {
      alert('Please enter processed by name');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const duplicates = formData.items.filter((item, index) =>
      formData.items.findIndex(i =>
        i.productId === item.productId &&
        i.variationId === item.variationId
      ) !== index
    );

    if (duplicates.length > 0) {
      alert('Error: Duplicate items detected!');
      return;
    }

    if (formData.inventoryType !== 'STOCK_IN') {
      const stockErrors = [];
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        const stockInfo = getItemStockInfo(i, item.productId, item.variationId);
        if (stockInfo) {
          const availableQty = stockInfo.availableQuantity ?? stockInfo.quantity ?? 0;
          if (item.quantity > availableQty) {
            const selectedOption = productOptions.find(opt =>
              opt.originalProductId === item.productId &&
              opt.originalVariationId === item.variationId
            );
            stockErrors.push({
              product: selectedOption?.fullName || `Product ${item.productId}`,
              requested: item.quantity,
              available: availableQty
            });
          }
        }
      }

      if (stockErrors.length > 0) {
        const errorMessage = '❌ Cannot submit - Stock availability issues:\n\n' +
          stockErrors.map(err =>
            `• ${err.product}\n  Requested: ${err.requested} | Available: ${err.available}`
          ).join('\n\n') +
          '\n\nPlease adjust quantities or remove items with insufficient stock.';
        alert(errorMessage);
        return;
      }
    }

    try {
      setActionLoading(true);
      setLoadingMessage(modalMode === 'create' ? 'Creating inventory record...' : 'Updating inventory record...');

      const payload = {
        ...formData,
        status: 'PENDING'
      };

      if (modalMode === 'create') {
        await createInventory(payload);
        alert('Inventory record created successfully as PENDING!');
      } else {
        await updateInventory(selectedInventory.id, payload);
        alert('Inventory record updated successfully!');
      }

      handleCloseModal();
      await loadData();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to save inventory:', error);
      alert('Failed to save inventory: ' + error.message);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleConfirmInventory = async (inventory, confirmedByUser = null) => {
    let locationInfo = '';
    if (inventory.inventoryType === 'STOCK_IN') {
      locationInfo = `\n📦 Adding stock to: ${inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName}`;
    } else if (inventory.inventoryType === 'TRANSFER') {
      const from = inventory.fromWarehouse?.warehouseName || inventory.fromBranch?.branchName;
      const to = inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName;
      locationInfo = `\n📦 Transfer from: ${from}\n📍 Transfer to: ${to}`;
    } else if (inventory.inventoryType === 'RETURN') {
      const from = inventory.fromBranch?.branchName;
      const to = inventory.toWarehouse?.warehouseName;
      locationInfo = `\n📦 Return from: ${from}\n📍 Return to: ${to}`;
    } else if (inventory.inventoryType === 'DAMAGE') {
      locationInfo = `\n📦 Mark damaged at: ${inventory.toWarehouse?.warehouseName || inventory.toBranch?.branchName}`;
    }

    const itemCount = inventory.items?.length || 0;
    const totalQty = inventory.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    const confirmMessage = `Are you sure you want to confirm this ${inventory.inventoryType} record?${locationInfo}\n\n📊 Items: ${itemCount}\n📦 Total Quantity: ${totalQty}\n\n⚠️ This will update stock levels and cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    const currentUser = confirmedByUser || getCurrentUser() || 'System';

    try {
      setActionLoading(true);
      setLoadingMessage('Confirming inventory...');

      await confirmInventory(inventory.id, currentUser);

      alert(`✅ Inventory confirmed successfully!\n\n${inventory.inventoryType} record has been processed and stock levels have been updated.`);
      await loadData();
    } catch (error) {
      console.error('Failed to confirm inventory:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`❌ Failed to confirm inventory:\n\n${errorMsg}\n\nPlease check stock availability and try again.`);
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  // ── FIXED: handleDelete now uses a scrollable modal for long error messages ──
  const handleDelete = async (id) => {
    const inventory = inventories.find(inv => inv.id === id);
    const userRole = localStorage.getItem('userRole') || 'USER';

    if (inventory && inventory.status === 'CONFIRMED') {
      if (userRole !== 'ADMIN') {
        alert('⚠️ PERMISSION DENIED\n\nOnly administrators can delete CONFIRMED inventory records.\n\nPlease contact your system administrator if you need to delete this record.');
        return;
      }

      const confirmDelete = window.confirm(
        '⚠️ Warning: Deleting CONFIRMED Inventory\n\n' +
        'This inventory has been confirmed and stock changes have been applied.\n\n' +
        'Deleting will:\n' +
        '• Permanently remove this inventory record\n' +
        '• Reverse all stock changes that were applied\n' +
        '• Cannot be undone\n\n' +
        'Are you absolutely sure you want to delete this record?'
      );

      if (!confirmDelete) return;

    } else {
      if (!window.confirm('Are you sure you want to delete this inventory record?')) {
        return;
      }
    }

    try {
      setActionLoading(true);
      setLoadingMessage('Deleting inventory record...');

      const result = await deleteInventory(id);

      if (result && result.success === false) {
        // ── Show full error in scrollable modal instead of truncating alert ──
        setDeleteErrorMessage(result.error || 'Failed to delete inventory');
        return;
      }

      alert('✅ Inventory deleted successfully');
      await loadData();

      if (filteredInventories.length % 10 === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      const errorMsg = error.message || 'Failed to delete inventory';

      // ── Use modal for errors that contain DR receipt lists (long messages) ──
      if (
        errorMsg.includes('USED IN DELIVERIES') ||
        errorMsg.includes('USED IN SALES') ||
        errorMsg.includes('Cannot delete') ||
        errorMsg.length > 200
      ) {
        setDeleteErrorMessage(errorMsg);
      } else {
        alert('❌ ' + errorMsg);
      }
    } finally {
      setActionLoading(false);
      setLoadingMessage('');
    }
  };

  const handleInventoryTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      inventoryType: type,
      fromWarehouseId: (type === 'STOCK_IN' || type === 'DAMAGE') ? '' : prev.fromWarehouseId,
      fromBranchId: (type === 'STOCK_IN' || type === 'DAMAGE') ? '' : prev.fromBranchId,
      items: []
    }));
    setWarehouseStocks({});
    setBranchStocks({});
  };

  const handleLocationChange = async (type, val) => {
    const [locationType, locationId] = val ? val.split('|') : [null, null];
    const warehouseId = locationType === 'warehouse' ? (locationId ? parseInt(locationId, 10) : null) : null;
    const branchId = locationType === 'branch' ? (locationId ? parseInt(locationId, 10) : null) : null;

    const newFormData = {
      ...formData,
      [`${type}WarehouseId`]: warehouseId,
      [`${type}BranchId`]: branchId
    };

    setFormData(newFormData);
    setWarehouseStocks({});
    setBranchStocks({});

    if (newFormData.items.length > 0 && (warehouseId || branchId)) {
      for (let i = 0; i < newFormData.items.length; i++) {
        const item = newFormData.items[i];
        if (item.productId) {
          setTimeout(() => {
            loadLocationStock(
              item.productId,
              item.variationId,
              i,
              warehouseId || branchId,
              warehouseId ? 'warehouse' : 'branch'
            );
          }, 100);
        }
      }
    }
  };

  const getItemStockInfo = (itemIndex, productId, variationId) => {
    let locationId = null;
    const actualProductId = productId;

    const createStockKey = (locId) => {
      return variationId
        ? `${itemIndex}_${actualProductId}_${variationId}_${locId}`
        : `${itemIndex}_${actualProductId}_${locId}`;
    };

    if (formData.fromWarehouseId) {
      locationId = formData.fromWarehouseId;
      const warehouseKey = createStockKey(locationId);
      return warehouseStocks[warehouseKey];
    } else if (formData.fromBranchId) {
      locationId = formData.fromBranchId;
      const branchKey = createStockKey(locationId);
      return branchStocks[branchKey];
    } else if (formData.toWarehouseId) {
      locationId = formData.toWarehouseId;
      const warehouseKey = createStockKey(locationId);
      return warehouseStocks[warehouseKey];
    } else if (formData.toBranchId) {
      locationId = formData.toBranchId;
      const branchKey = createStockKey(locationId);
      return branchStocks[branchKey];
    }

    return null;
  };

  const clearAllFilters = () => {
    setTypeFilter('ALL');
    setFromWarehouseFilter('');
    setToWarehouseFilter('');
    setFromBranchFilter('');
    setToBranchFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  return (
    <>
      <LoadingOverlay show={loading || actionLoading} message={loadingMessage || ''} />

      {/* ── Scrollable Delete Error Modal ── */}
      <DeleteErrorModal
        message={deleteErrorMessage}
        onClose={() => setDeleteErrorMessage(null)}
      />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="p-6 max-w-full mx-auto px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Records Management</h1>
            <p className="text-gray-600">Track and manage inventory movements</p>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Plus size={20} />
              <span>New Inventory Record</span>
            </button>
          </div>

          {/* Filters */}
          <InventoryFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            fromWarehouseFilter={fromWarehouseFilter}
            setFromWarehouseFilter={setFromWarehouseFilter}
            toWarehouseFilter={toWarehouseFilter}
            setToWarehouseFilter={setToWarehouseFilter}
            fromBranchFilter={fromBranchFilter}
            setFromBranchFilter={setFromBranchFilter}
            toBranchFilter={toBranchFilter}
            setToBranchFilter={setToBranchFilter}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            warehouses={warehouses}
            branches={branches}
            onClearFilters={clearAllFilters}
          />

          {/* Table */}
          <InventoryTable
            inventories={currentInventories}
            onView={(inventory) => handleOpenModal('view', inventory)}
            onEdit={(inventory) => handleOpenModal('edit', inventory)}
            onDelete={handleDelete}
            onConfirm={handleConfirmInventory}
            actionLoading={actionLoading}
            canModifyStatus={canModifyStatus}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
          />

          {/* Pagination */}
          {sortedInventories.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              showingStart={indexOfFirstItem + 1}
              showingEnd={Math.min(indexOfLastItem, sortedInventories.length)}
              totalItems={sortedInventories.length}
            />
          )}

          {/* Modals */}
          {showModal && (modalMode === 'create' || modalMode === 'edit') && (
            <InventoryFormModal
              showModal={showModal}
              modalMode={modalMode}
              selectedInventory={selectedInventory}
              formData={formData}
              setFormData={setFormData}
              products={products}
              warehouses={warehouses}
              branches={branches}
              loadingStocks={loadingStocks}
              warehouseStocks={warehouseStocks}
              branchStocks={branchStocks}
              onClose={handleCloseModal}
              onSubmit={handleSubmit}
              onAddProduct={handleAddProductToTable}
              onRemoveItem={handleRemoveItem}
              onItemChange={handleItemChange}
              onInventoryTypeChange={handleInventoryTypeChange}
              onLocationChange={handleLocationChange}
              selectedProductForAdd={selectedProductForAdd}
              setSelectedProductForAdd={setSelectedProductForAdd}
              tempQuantity={tempQuantity}
              setTempQuantity={setTempQuantity}
              onConfirmInventory={handleConfirmInventory}
            />
          )}

          {showModal && modalMode === 'view' && selectedInventory && (
            <InventoryViewModal
              selectedInventory={selectedInventory}
              onClose={handleCloseModal}
              onConfirm={handleConfirmInventory}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default InventoryRecordsManagement;