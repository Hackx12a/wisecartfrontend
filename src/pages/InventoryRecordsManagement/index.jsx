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

// ─── Fixed Delete Error Modal with Perfect Alignment ─────────────────────
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
   * Parses the encoded ref string into a structured object.
   *
   * DR format:   "DR-0001 (qty:50|status:DELIVERED|from:Main Warehouse|to:Branch A)"
   * Sale format: "SALE-12 (qty:30|status:INVOICED|branch:Branch A|company:Company X)"
   * Legacy:      "DR-0001 (qty:5)"
   *
   * Returns: { label, qty, status, from, to, branch, company }
   */
  const parseRef = (raw) => {
    const parenMatch = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!parenMatch) return { label: raw, qty: null, status: null, from: null, to: null, branch: null, company: null };

    const label  = parenMatch[1].trim();
    const inside = parenMatch[2];

    const fields = {};
    inside.split('|').forEach(part => {
      const idx = part.indexOf(':');
      if (idx !== -1) {
        fields[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
      }
    });

    return {
      label,
      qty:     fields.qty     ? parseInt(fields.qty, 10) : null,
      status:  fields.status  || null,
      from:    fields.from    || null,
      to:      fields.to      || null,
      branch:  fields.branch  || null,
      company: fields.company || null,
    };
  };

  /**
   * Visual config per delivery status
   */
  const getStatusMeta = (status) => {
    switch (status) {
      case 'DELIVERED':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-400',
          icon: '✅',
          label: 'Delivered',
        };
      case 'IN_TRANSIT':
        return {
          bg: 'bg-yellow-400',
          text: 'text-yellow-900',
          border: 'border-yellow-300',
          icon: '🚚',
          label: 'In Transit',
        };
      case 'PREPARING':
        return {
          bg: 'bg-blue-400',
          text: 'text-white',
          border: 'border-blue-300',
          icon: '📋',
          label: 'Preparing',
        };
      case 'PENDING':
        return {
          bg: 'bg-gray-400',
          text: 'text-white',
          border: 'border-gray-300',
          icon: '⏳',
          label: 'Pending',
        };
      default:
        return {
          bg: 'bg-gray-300',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '📦',
          label: status || 'Unknown',
        };
    }
  };

  // Color scheme per conflict type
  const getConflictMeta = (hasDelivery, hasSale) => {
    if (hasDelivery && hasSale) return {
      borderColor: 'border-red-400',
      headerBg:    'bg-red-50',
      headerBorder:'border-b border-red-200',
      leftBar:     'bg-red-500',
      titleColor:  'text-red-900',
      icon:        '⚠️',
      label:       'Delivery + Sale Conflict',
      labelBg:     'bg-red-100 text-red-700',
    };
    if (hasDelivery) return {
      borderColor: 'border-blue-400',
      headerBg:    'bg-blue-50',
      headerBorder:'border-b border-blue-200',
      leftBar:     'bg-blue-500',
      titleColor:  'text-blue-900',
      icon:        '📦',
      label:       'Delivery Conflict',
      labelBg:     'bg-blue-100 text-blue-700',
    };
    return {
      borderColor: 'border-orange-400',
      headerBg:    'bg-orange-50',
      headerBorder:'border-b border-orange-200',
      leftBar:     'bg-orange-500',
      titleColor:  'text-orange-900',
      icon:        '🛒',
      label:       'Sale Conflict',
      labelBg:     'bg-orange-100 text-orange-700',
    };
  };

  const totalDeliveries    = products.reduce((s, [, v]) => s + v.deliveryReceipts.length, 0);
  const totalSales         = products.reduce((s, [, v]) => s + v.saleRefs.length, 0);
  const totalDeliveryQty   = products.reduce((s, [, v]) => s + v.deliveryReceipts.reduce((a, dr) => a + (parseRef(dr).qty ?? 0), 0), 0);
  const totalSaleQty       = products.reduce((s, [, v]) => s + v.saleRefs.reduce((a, r)  => a + (parseRef(r).qty  ?? 0), 0), 0);
  const grandTotalQty      = totalDeliveryQty + totalSaleQty;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal - Increased width for better spacing */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-red-200">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-5 bg-red-50 border-b border-red-100 flex-shrink-0">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-red-800">Cannot Delete Inventory Record</h2>
            <p className="text-sm text-red-500 mt-0.5">
              Stock has already been consumed by the transactions below
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Summary pills ── */}
        <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0 flex-wrap">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Conflicts:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
          {totalDeliveries > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700 shadow-sm">
              <Package size={11} />
              {totalDeliveries} DR{totalDeliveries !== 1 ? 's' : ''} · {totalDeliveryQty} pcs
            </span>
          )}
          {totalSales > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-semibold text-orange-700 shadow-sm">
              <ShoppingCart size={11} />
              {totalSales} sale{totalSales !== 1 ? 's' : ''} · {totalSaleQty} pcs
            </span>
          )}
          {grandTotalQty > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-300 rounded-full text-xs font-bold text-red-700 shadow-sm ml-auto">
              Total blocked: {grandTotalQty} pcs
            </span>
          )}
        </div>

        {/* ── Scrollable product cards ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {hasStructuredData ? (
            <>
              {products.map(([productName, { deliveryReceipts, saleRefs }], i) => {
                const meta = getConflictMeta(deliveryReceipts.length > 0, saleRefs.length > 0);
                const productDrQty   = deliveryReceipts.reduce((a, dr) => a + (parseRef(dr).qty ?? 0), 0);
                const productSaleQty = saleRefs.reduce((a, r) => a + (parseRef(r).qty ?? 0), 0);
                const productTotalQty = productDrQty + productSaleQty;
                
                return (
                  <div
                    key={i}
                    className={`rounded-xl border-2 ${meta.borderColor} overflow-hidden shadow-sm`}
                  >
                    {/* Product header row */}
                    <div className={`flex items-center gap-3 px-4 py-3 ${meta.headerBg} ${meta.headerBorder}`}>
                      <div className={`w-1 h-8 rounded-full ${meta.leftBar} flex-shrink-0`} />
                      <span className="text-base">{meta.icon}</span>
                      <span className={`font-semibold text-sm flex-1 min-w-0 truncate ${meta.titleColor}`}>
                        {productName}
                      </span>
                      {productTotalQty > 0 && (
                        <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-gray-300 text-gray-700 mr-1">
                          {productTotalQty} pcs total
                        </span>
                      )}
                      <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${meta.labelBg}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Conflict detail rows */}
                    <div className="px-4 py-3 bg-white space-y-4">

                      {/* ── Delivery receipts with status badges and route info ── */}
                      {deliveryReceipts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <Package size={12} className="text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                              Delivery Receipt{deliveryReceipts.length !== 1 ? 's' : ''}
                            </span>
                            <span className="ml-auto flex items-center gap-1.5">
                              <span className="bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {productDrQty} pcs
                              </span>
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {deliveryReceipts.length} DR{deliveryReceipts.length !== 1 ? 's' : ''}
                              </span>
                            </span>
                          </div>
                          
                          {/* Delivery Cards Grid - Fixed 2 columns for better alignment */}
                          <div className="grid grid-cols-2 gap-3">
                            {deliveryReceipts.map((dr, j) => {
                              const { label, qty, status, from, to } = parseRef(dr);
                              const sm = status ? getStatusMeta(status) : null;
                              return (
                                <div key={j} className="flex flex-col bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                                  {/* Main pill row */}
                                  <div className="flex items-stretch w-full">
                                    {/* DR number */}
                                    <div className="flex-none w-24 px-2 py-1.5 bg-blue-50 border-r border-blue-200">
                                      <span className="block text-xs font-mono font-medium text-blue-800 truncate" title={label}>
                                        {label}
                                      </span>
                                    </div>
                                    
                                    {/* Quantity */}
                                    {qty !== null && (
                                      <>
                                        <div className="flex-none w-16 px-2 py-1.5 bg-blue-500 border-r border-blue-300">
                                          <span className="block text-xs font-bold text-white text-center">
                                            {qty} pcs
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    
                                    {/* Status */}
                                    {sm && (
                                      <div className={`flex-1 min-w-0 px-2 py-1.5 ${sm.bg} flex items-center justify-center gap-1`}>
                                        <span>{sm.icon}</span>
                                        <span className={`text-xs font-bold truncate ${sm.text}`}>
                                          {sm.label}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* From → To route row */}
                                  {(from || to) && (
                                    <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-blue-100 text-[10px]">
                                      <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <span className="text-blue-400 flex-shrink-0">🏭</span>
                                        <span className="font-medium text-blue-700 truncate" title={from}>
                                          {from || '?'}
                                        </span>
                                      </div>
                                      <span className="text-gray-400 flex-shrink-0 mx-1">→</span>
                                      <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                                        <span className="font-medium text-green-700 truncate" title={to}>
                                          {to || '?'}
                                        </span>
                                        <span className="text-green-400 flex-shrink-0">🏪</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Status legend */}
                          {[...new Set(deliveryReceipts.map(dr => parseRef(dr).status).filter(Boolean))].length > 1 && (
                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-400 mr-1">Status:</span>
                              {[
                                { status: 'DELIVERED',  ...getStatusMeta('DELIVERED') },
                                { status: 'IN_TRANSIT', ...getStatusMeta('IN_TRANSIT') },
                                { status: 'PREPARING',  ...getStatusMeta('PREPARING') },
                                { status: 'PENDING',    ...getStatusMeta('PENDING') },
                              ]
                                .filter(s => deliveryReceipts.some(dr => parseRef(dr).status === s.status))
                                .map(s => (
                                  <span key={s.status} className="inline-flex items-center gap-1 text-xs text-gray-500">
                                    <span className={`w-2 h-2 rounded-full inline-block ${s.bg}`} />
                                    {s.icon} {s.label}
                                  </span>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Sales with branch and company info ── */}
                      {saleRefs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <ShoppingCart size={12} className="text-orange-500 flex-shrink-0" />
                            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                              Sale Reference{saleRefs.length !== 1 ? 's' : ''}
                            </span>
                            <span className="ml-auto flex items-center gap-1.5">
                              <span className="bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {productSaleQty} pcs
                              </span>
                              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                {saleRefs.length} sale{saleRefs.length !== 1 ? 's' : ''}
                              </span>
                            </span>
                          </div>
                          
                          {/* Sale Cards Grid - Fixed 2 columns for consistency */}
                          <div className="grid grid-cols-2 gap-3">
                            {saleRefs.map((ref, j) => {
                              const { label, qty, status, branch, company } = parseRef(ref);
                              return (
                                <div key={j} className="flex flex-col bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
                                  {/* Main pill row */}
                                  <div className="flex items-stretch w-full">
                                    {/* Reference number */}
                                    <div className="flex-none w-24 px-2 py-1.5 bg-orange-50 border-r border-orange-200">
                                      <span className="block text-xs font-mono font-medium text-orange-800 truncate" title={label}>
                                        {label}
                                      </span>
                                    </div>
                                    
                                    {/* Quantity */}
                                    {qty !== null && (
                                      <>
                                        <div className="flex-none w-16 px-2 py-1.5 bg-orange-500 border-r border-orange-300">
                                          <span className="block text-xs font-bold text-white text-center">
                                            {qty} pcs
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    
                                    {/* Status (if present) */}
                                    {status && (
                                      <div className={`flex-1 min-w-0 px-2 py-1.5 ${
                                        status === 'INVOICED' 
                                          ? 'bg-purple-500' 
                                          : 'bg-yellow-400'
                                      } flex items-center justify-center gap-1`}>
                                        <span className="text-xs font-bold text-white truncate">
                                          {status === 'INVOICED' ? '🧾 Invoiced' : '✅ Confirmed'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Branch + Company info row */}
                                  {(branch || company) && (
                                    <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-orange-100 text-[10px]">
                                      {branch && (
                                        <div className="flex items-center gap-1 min-w-0 flex-1">
                                          <span className="text-orange-400 flex-shrink-0">🏪</span>
                                          <span className="font-medium text-orange-700 truncate" title={branch}>
                                            {branch}
                                          </span>
                                        </div>
                                      )}
                                      {branch && company && (
                                        <span className="text-gray-300 flex-shrink-0 mx-1">·</span>
                                      )}
                                      {company && (
                                        <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                                          <span className="font-medium text-gray-600 truncate" title={company}>
                                            {company}
                                          </span>
                                          <span className="text-gray-400 flex-shrink-0">🏢</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
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

              {/* Footer note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>ℹ️ To delete this record,</strong> you must first void or cancel all the delivery receipts and sales listed above, then try again.
                </p>
              </div>
            </>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 rounded-xl p-4 border border-gray-200 leading-relaxed">
              {message}
            </pre>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Close
          </button>
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