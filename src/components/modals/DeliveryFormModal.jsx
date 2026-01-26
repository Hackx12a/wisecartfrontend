// src/components/modals/DeliveryFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Package, ChevronDown } from 'lucide-react';
import SearchableDropdown from '../common/SearchableDropdown';
import VariationSearchableDropdown from '../common/VariationSearchableDropdown';
import { api } from '../../services/api';
import { formatDateForInput } from '../../utils/dateUtils';

const DeliveryFormModal = ({
    mode,
    delivery,
    onClose,
    onSave,
    branches,
    products,
    warehouses,
    companies,
    isLoading = false
}) => {
    const [formData, setFormData] = useState({
        branchId: '',
        date: '',
        deliveryReceiptNumber: '',
        purchaseOrderNumber: '',
        transmittal: '',
        preparedBy: '',
        status: 'PREPARING',
        customStatus: '',
        remarks: '',
        items: [],
        selectedWarehouseId: '',
        datePrepared: '',
        dateDelivered: ''
    });

    const [branchInfo, setBranchInfo] = useState(null);
    const [warehouseStocks, setWarehouseStocks] = useState({});
    const [loadingStocks, setLoadingStocks] = useState({});
    const [stockErrors, setStockErrors] = useState({});
    const [showBranchDetails, setShowBranchDetails] = useState(true);

    // In your DeliveryFormModal.jsx, update the useEffect section:

    // In src/components/modals/DeliveryFormModal.jsx, update the useEffect for edit mode:

    useEffect(() => {
        if (mode === 'create') {
            const now = new Date();
            const localISOString = formatDateForInput(now.toISOString());

            setFormData({
                branchId: '',
                date: localISOString,
                deliveryReceiptNumber: '',
                purchaseOrderNumber: '',
                transmittal: '',
                preparedBy: localStorage.getItem('fullName') || localStorage.getItem('username') || '',
                status: 'PREPARING',
                customStatus: '',
                remarks: '',
                items: [],
                selectedWarehouseId: '',
                datePrepared: localISOString,
                dateDelivered: ''
            });
            setBranchInfo(null);
        } else if (mode === 'edit' && delivery) {
            // Safely access delivery items
            const items = delivery.items || [];
            const selectedWarehouseId = items.length > 0 && items[0]?.warehouse?.id
                ? items[0].warehouse.id
                : '';

            // Load delivery data
            setFormData({
                branchId: delivery.branch?.id || delivery.branchId || '',
                date: delivery.date ? formatDateForInput(delivery.date) : formatDateForInput(new Date()),
                deliveryReceiptNumber: delivery.deliveryReceiptNumber || '',
                purchaseOrderNumber: delivery.purchaseOrderNumber || '',
                transmittal: delivery.transmittal || '',
                preparedBy: delivery.preparedBy || '',
                status: delivery.status || 'PREPARING',
                customStatus: delivery.customStatus || '',
                remarks: delivery.remarks || '',
                selectedWarehouseId: selectedWarehouseId,
                datePrepared: delivery.datePrepared ? formatDateForInput(delivery.datePrepared) : formatDateForInput(delivery.date || new Date()),
                dateDelivered: delivery.dateDelivered ? formatDateForInput(delivery.dateDelivered) : '',
                items: items.map(item => ({
                    productId: item.product?.id || item.productId || '',
                    variationId: item.variationId || item.variation?.id || null,
                    quantity: item.quantity || 0,
                    preparedQty: item.preparedQty || '',
                    deliveredQty: item.deliveredQty || '',
                    uom: item.uom || '',
                    warehouseId: item.warehouse?.id || '',
                    originalPreparedQty: item.preparedQty || 0,
                    // Store the formatted ID for the dropdown
                    formattedProductId: item.formattedProductId || (item.variationId
                        ? `${item.product?.id || item.productId}_${item.variationId}`
                        : `prod_${item.product?.id || item.productId}`)
                }))
            });

            if (delivery.branch && delivery.branch.company) {
                setBranchInfo({
                    companyName: delivery.branch.company.companyName || '',
                    tin: delivery.branch.company.tin || '',
                    fullAddress: `${delivery.branch.company.address || ''}, ${delivery.branch.company.city || ''}, ${delivery.branch.company.province || ''}`.trim(),
                    branchName: delivery.branch.branchName || '',
                    branchCode: delivery.branch.branchCode || '',
                    branchAddress: `${delivery.branch.address || ''}, ${delivery.branch.city || ''}, ${delivery.branch.province || ''}`.trim(),
                    branchTin: delivery.branch.tin || '',
                    branchContactNumber: delivery.branch.contactNumber || ''
                });
            } else {
                setBranchInfo(null);
            }
        }
    }, [mode, delivery]);



    const branchOptions = branches ? branches.map(b => ({
        id: b.id,
        name: `${b.branchName || 'Unknown'} (${b.branchCode || 'N/A'})`
    })) : [];

    const warehouseOptions = warehouses ? warehouses.map(w => ({
        id: w.id,
        name: `${w.warehouseName || 'Unknown'} (${w.warehouseCode || 'N/A'})`
    })) : [];

    const productOptions = products ? products.flatMap(p => {
        if (!p) return [];

        if (p.variations && p.variations.length > 0) {
            return p.variations.map(v => ({
                id: `${p.id}_${v.id}`,
                parentProductId: p.id,
                variationId: v.id,
                name: `${v.upc || 'N/A'} - ${p.productName || 'Unknown'} - ${v.sku || 'N/A'}`,
                subLabel: v.combinationDisplay || (v.attributes ? Object.entries(v.attributes || {})
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ') : 'Variation'),
                fullName: p.productName || 'Unknown Product',
                upc: v.upc,
                sku: v.sku,
                price: v.price || p.price || 0,
                isVariation: true
            }));
        } else {
            return [{
                id: `prod_${p.id}`,
                parentProductId: p.id,
                variationId: null,
                name: `${p.upc || 'N/A'} - ${p.productName || 'Unknown'} - ${p.sku || 'N/A'}`,
                subLabel: 'No variations',
                fullName: p.productName || 'Unknown Product',
                upc: p.upc,
                sku: p.sku,
                price: p.price || 0,
                isVariation: false
            }];
        }
    }) : [];


    const findProductOption = (productId, variationId = null) => {
        if (!productId) return null;

        if (variationId) {
            return productOptions.find(opt =>
                opt.parentProductId === productId && opt.variationId === variationId
            );
        } else {
            return productOptions.find(opt =>
                opt.parentProductId === productId && !opt.variationId
            );
        }
    };

    const loadWarehouseStock = async (warehouseId, productId, variationId, itemIndex) => {
        if (!warehouseId || !productId) return;
        const stockKey = variationId
            ? `${itemIndex}_${productId}_${variationId}_${warehouseId}`
            : `${itemIndex}_${productId}_${warehouseId}`;

        setLoadingStocks(prev => ({ ...prev, [stockKey]: true }));
        setStockErrors(prev => ({ ...prev, [stockKey]: null }));

        try {
            const endpoint = variationId
                ? `/stocks/warehouses/${warehouseId}/products/${productId}/variations/${variationId}`
                : `/stocks/warehouses/${warehouseId}/products/${productId}`;

            const stock = await api.get(endpoint);
            const stockData = stock.success ? stock.data : stock;

            setWarehouseStocks(prev => ({
                ...prev,
                [stockKey]: stockData || { quantity: 0, availableQuantity: 0 }
            }));
        } catch (error) {
            console.error('Failed to load stock information:', error);
            setWarehouseStocks(prev => ({
                ...prev,
                [stockKey]: { quantity: 0, availableQuantity: 0 }
            }));
            setStockErrors(prev => ({
                ...prev,
                [stockKey]: 'Failed to load stock'
            }));
        } finally {
            setLoadingStocks(prev => ({ ...prev, [stockKey]: false }));
        }
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...formData.items];

        if (field === 'preparedQty' || field === 'deliveredQty') {
            newItems[index][field] = value === '' ? '' : parseInt(value) || 0;
        } else if (field === 'productId') {
            const selectedOption = productOptions.find(opt => opt.id === value);

            if (selectedOption) {
                newItems[index] = {
                    ...newItems[index],
                    productId: selectedOption.parentProductId,
                    variationId: selectedOption.variationId || null
                };

                setFormData({ ...formData, items: newItems });

                if (newItems[index].warehouseId) {
                    setTimeout(() => {
                        loadWarehouseStock(
                            newItems[index].warehouseId,
                            selectedOption.parentProductId,
                            selectedOption.variationId,
                            index
                        );
                    }, 0);
                }
                return;
            }
        } else {
            newItems[index][field] = value;
        }

        setFormData({ ...formData, items: newItems });

        if (field === 'warehouseId') {
            const item = newItems[index];

            if (item.productId && value) {
                setTimeout(() => {
                    loadWarehouseStock(value, item.productId, item.variationId, index);
                }, 100);
            }

            newItems[index].preparedQty = '';
            newItems[index].deliveredQty = '';
            newItems[index].uom = '';
            setFormData({ ...formData, items: newItems });
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: '',
                preparedQty: '',
                deliveredQty: '',
                uom: '',
                warehouseId: formData.selectedWarehouseId || '',
                originalPreparedQty: 0
            }]
        });
    };

    const handleRemoveItem = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const handleBranchChange = (branchId) => {
        setFormData({ ...formData, branchId });
        if (branchId) {
            const branch = branches.find(b => b.id === branchId);
            if (branch && branch.company) {
                setBranchInfo({
                    companyName: branch.company.companyName,
                    tin: branch.company.tin,
                    fullAddress: `${branch.company.address || ''}, ${branch.company.city || ''}, ${branch.company.province || ''}`.trim(),
                    branchName: branch.branchName,
                    branchCode: branch.branchCode,
                    branchAddress: `${branch.address || ''}, ${branch.city || ''}, ${branch.province || ''}`.trim(),
                    branchTin: branch.tin || '',
                    branchContactNumber: branch.contactNumber || ''
                });
            }
        } else {
            setBranchInfo(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };



    const getStatusDropdownBgColor = (status) => {
        const colors = {
            PREPARING: 'bg-yellow-50 border-yellow-200',
            IN_TRANSIT: 'bg-purple-50 border-purple-200',
            DELIVERED: 'bg-green-50 border-green-200',
            CANCELLED: 'bg-red-50 border-red-200'
        };
        return colors[status] || 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
                <div className="p-8 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'create' ? 'Create New Delivery' : 'Edit Delivery'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        disabled={isLoading}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        {/* Branch Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Branch *
                                {(formData.status === 'IN_TRANSIT' || formData.status === 'DELIVERED' || formData.status === 'CANCELLED') && (
                                    <span className="ml-2 text-xs text-orange-600">(Locked - Cannot change in {formData.status} status)</span>
                                )}
                            </label>
                            <SearchableDropdown
                                options={branchOptions}
                                value={formData.branchId}
                                onChange={handleBranchChange}
                                placeholder="Select Branch"
                                displayKey="name"
                                valueKey="id"
                                required
                                disabled={formData.status === 'IN_TRANSIT' || formData.status === 'DELIVERED' || formData.status === 'CANCELLED'}
                            />
                        </div>

                        {/* Branch Details */}
                        {branchInfo && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`bg-green-50 rounded-lg border border-green-200 transition-all duration-300 ${showBranchDetails ? 'h-auto' : 'h-[60px]'}`}>
                                    <button
                                        type="button"
                                        onClick={() => setShowBranchDetails(!showBranchDetails)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-green-100 transition rounded-lg"
                                    >
                                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Branch Details
                                        </h3>
                                        <ChevronDown
                                            size={20}
                                            className={`text-green-600 transition-transform ${showBranchDetails ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ${showBranchDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {showBranchDetails && (
                                            <div className="px-4 pb-4 space-y-2">
                                                <div className="flex items-start">
                                                    <span className="text-xs text-green-600 font-medium min-w-20">Branch:</span>
                                                    <span className="text-sm text-green-900 font-semibold ml-2">{branchInfo.branchName}</span>
                                                </div>
                                                <div className="flex items-start">
                                                    <span className="text-xs text-green-600 font-medium min-w-20">Code:</span>
                                                    <span className="text-sm text-green-900 ml-2">{branchInfo.branchCode}</span>
                                                </div>
                                                {branchInfo.branchTin && (
                                                    <div className="flex items-start">
                                                        <span className="text-xs text-green-600 font-medium min-w-20">TIN:</span>
                                                        <span className="text-sm text-green-900 ml-2">{branchInfo.branchTin}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-start">
                                                    <span className="text-xs text-green-600 font-medium min-w-20">Address:</span>
                                                    <span className="text-sm text-green-900 ml-2">{branchInfo.branchAddress}</span>
                                                </div>
                                                {branchInfo.branchContactNumber && (
                                                    <div className="flex items-start">
                                                        <span className="text-xs text-green-600 font-medium min-w-20">Contact:</span>
                                                        <span className="text-sm text-green-900 ml-2">{branchInfo.branchContactNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delivery Receipt & Purchase Order */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Receipt # *</label>
                                <input
                                    type="text"
                                    value={formData.deliveryReceiptNumber}
                                    onChange={(e) => setFormData({ ...formData, deliveryReceiptNumber: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Purchase Order #</label>
                                <input
                                    type="text"
                                    value={formData.purchaseOrderNumber}
                                    onChange={(e) => setFormData({ ...formData, purchaseOrderNumber: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        {/* Transmittal & Prepared By */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Transmittal</label>
                                <input
                                    type="text"
                                    value={formData.transmittal}
                                    onChange={(e) => setFormData({ ...formData, transmittal: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Prepared By</label>
                                <input
                                    type="text"
                                    value={formData.preparedBy}
                                    onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>
                        </div>

                        {/* Status (only for edit mode) */}
                        {mode === 'edit' && delivery && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value;

                                        if (newStatus === 'PREPARING') {
                                            setFormData({
                                                ...formData,
                                                status: newStatus,
                                                dateDelivered: ''
                                            });
                                        } else if (newStatus === 'IN_TRANSIT') {
                                            setFormData({
                                                ...formData,
                                                status: newStatus,
                                                dateDelivered: ''
                                            });
                                        } else if (newStatus === 'DELIVERED') {
                                            const updatedItems = formData.items.map(item => ({
                                                ...item,
                                                deliveredQty: item.deliveredQty || item.preparedQty
                                            }));
                                            const now = new Date();
                                            const localISOString = formatDateForInput(now.toISOString());

                                            setFormData({
                                                ...formData,
                                                status: newStatus,
                                                dateDelivered: formData.dateDelivered || localISOString,
                                                items: updatedItems
                                            });
                                        } else if (newStatus === 'CANCELLED') {
                                            setFormData({
                                                ...formData,
                                                status: newStatus,
                                                dateDelivered: ''
                                            });
                                        } else {
                                            const updatedItems = formData.items.map(item => ({
                                                ...item,
                                                deliveredQty: ''
                                            }));
                                            setFormData({
                                                ...formData,
                                                status: newStatus,
                                                dateDelivered: '',
                                                items: updatedItems
                                            });
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${getStatusDropdownBgColor(formData.status)}`}
                                >
                                    {(delivery.status === 'PREPARING' || !delivery.status) && (
                                        <>
                                            <option value="PREPARING">PREPARING</option>
                                            <option value="IN_TRANSIT">IN_TRANSIT</option>
                                        </>
                                    )}
                                    {delivery.status === 'IN_TRANSIT' && (
                                        <>
                                            <option value="IN_TRANSIT">IN_TRANSIT</option>
                                            <option value="DELIVERED">DELIVERED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                        </>
                                    )}
                                    {(delivery.status === 'DELIVERED' || delivery.status === 'CANCELLED') && (
                                        <option value={delivery.status}>{delivery.status}</option>
                                    )}
                                </select>
                            </div>
                        )}

                        {/* Remarks */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Remarks</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                rows="3"
                            />
                        </div>

                        {/* Date Prepared & Date Delivered */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Date Prepared *
                                    {mode === 'edit' && formData.status !== 'PREPARING' && (
                                        <span className="ml-2 text-xs text-orange-600">(Locked - cannot change after PREPARING status)</span>
                                    )}
                                    {mode === 'edit' && formData.status === 'PREPARING' && (
                                        <span className="ml-2 text-xs text-green-600">(Editable in PREPARING status)</span>
                                    )}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={
                                        formData.datePrepared
                                            ? (() => {
                                                let cleanDate = formData.datePrepared.replace('Z', '').split('.')[0].split('+')[0];
                                                if (cleanDate.length > 16) {
                                                    cleanDate = cleanDate.substring(0, 16);
                                                }
                                                return cleanDate;
                                            })()
                                            : ''
                                    }
                                    onChange={(e) => {
                                        if (mode === 'create' || (mode === 'edit' && formData.status === 'PREPARING')) {
                                            const localDateTimeStr = e.target.value;
                                            const isoWithoutZ = localDateTimeStr + ':00';

                                            setFormData({
                                                ...formData,
                                                datePrepared: isoWithoutZ
                                            });
                                        }
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 transition ${mode === 'edit' && formData.status !== 'PREPARING'
                                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-blue-500 bg-white'
                                        }`}
                                    disabled={mode === 'edit' && formData.status !== 'PREPARING'}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Date Delivered
                                    {formData.status !== 'DELIVERED' && (
                                        <span className="ml-2 text-xs text-orange-600">(Enabled only when status is DELIVERED)</span>
                                    )}
                                    {formData.status === 'DELIVERED' && (
                                        <span className="ml-2 text-xs text-orange-600">(Required for DELIVERED status)</span>
                                    )}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={
                                        formData.dateDelivered
                                            ? (() => {
                                                let cleanDate = formData.dateDelivered.replace('Z', '').split('.')[0].split('+')[0];
                                                if (cleanDate.length > 16) {
                                                    cleanDate = cleanDate.substring(0, 16);
                                                }
                                                return cleanDate;
                                            })()
                                            : formData.status === 'DELIVERED'
                                                ? (() => {
                                                    const now = new Date();
                                                    const year = now.getFullYear();
                                                    const month = String(now.getMonth() + 1).padStart(2, '0');
                                                    const day = String(now.getDate()).padStart(2, '0');
                                                    const hours = String(now.getHours()).padStart(2, '0');
                                                    const minutes = String(now.getMinutes()).padStart(2, '0');
                                                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                                                })()
                                                : ''
                                    }
                                    onChange={(e) => {
                                        const localDateTimeStr = e.target.value;
                                        const isoWithoutZ = localDateTimeStr + ':00';
                                        setFormData({
                                            ...formData,
                                            dateDelivered: isoWithoutZ
                                        });
                                    }}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 transition ${formData.status === 'DELIVERED'
                                        ? 'border-gray-300 focus:ring-blue-500 bg-white'
                                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                        }`}
                                    disabled={formData.status !== 'DELIVERED'}
                                    required={formData.status === 'DELIVERED'}
                                />
                            </div>
                        </div>

                        {/* Warehouse Selection */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Warehouse (applies to all items) *
                                {formData.status === 'PREPARING' ? (
                                    <span className="ml-2 text-xs text-green-600">(Editable)</span>
                                ) : (
                                    <span className="ml-2 text-xs text-orange-600">(Locked in {formData.status} status)</span>
                                )}
                            </label>
                            <SearchableDropdown
                                options={warehouseOptions}
                                value={formData.selectedWarehouseId}
                                onChange={(value) => {
                                    const newItems = formData.items.map(item => ({
                                        ...item,
                                        warehouseId: value
                                    }));
                                    setFormData({
                                        ...formData,
                                        selectedWarehouseId: value,
                                        items: newItems
                                    });
                                }}
                                placeholder="Select Warehouse"
                                displayKey="name"
                                valueKey="id"
                                required
                                disabled={formData.status === 'IN_TRANSIT' || formData.status === 'DELIVERED'}
                            />
                        </div>

                        {/* Items Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Items *</label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Warehouse selection is required for all items
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition font-medium"
                                >
                                    <Plus size={16} />
                                    Add Product
                                </button>
                            </div>

                            {formData.items.length === 0 && (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-gray-500">No items added yet. Click "Add Product" to start.</p>
                                </div>
                            )}

                            {formData.items.map((item, i) => {
                                const stockKey = item.variationId
                                    ? `${i}_${item.productId}_${item.variationId}_${item.warehouseId}`
                                    : `${i}_${item.productId}_${item.warehouseId}`;

                                const stockInfo = warehouseStocks[stockKey];
                                const isLoadingStock = loadingStocks[stockKey];

                                const effectiveAvailable = mode === 'edit'
                                    ? (stockInfo?.availableQuantity || 0) + (item.originalPreparedQty || 0)
                                    : (stockInfo?.availableQuantity || 0);

                                const hasInsufficientStock = stockInfo && item.preparedQty > effectiveAvailable;

                                const isDelivered = formData.status === 'DELIVERED';
                                const isInTransit = formData.status === 'IN_TRANSIT';
                                const isPreparing = formData.status === 'PREPARING';

                                return (
                                    <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                        {/* Product Selection */}
                                        <div className="mb-4">
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                Product *
                                            </label>

                                            <VariationSearchableDropdown
                                                options={productOptions}
                                                value={item.formattedProductId || (
                                                    item.variationId
                                                        ? `${item.productId}_${item.variationId}`
                                                        : `prod_${item.productId}`
                                                )}
                                                onChange={(value) => handleItemChange(i, 'productId', value)}
                                                placeholder="Select Product Variation"
                                                required
                                                formData={formData}
                                                index={i}
                                                disabled={isDelivered || isInTransit}
                                            />
                                        </div>

                                        {/* Warehouse Display */}
                                        <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Package size={16} className="text-blue-600" />
                                                <span className="font-medium text-blue-900">Warehouse:</span>
                                                <span className="text-blue-700">
                                                    {warehouseOptions.find(w => w.id === item.warehouseId)?.name || 'Not selected'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Two-Quantity System */}
                                        <div className="grid gap-4 mb-3" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                                    Prepared Qty (For Reservation) *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.preparedQty || ''}
                                                    onChange={(e) => handleItemChange(i, 'preparedQty', e.target.value)}
                                                    className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm font-medium"
                                                    min="0"
                                                    disabled={isDelivered}
                                                    placeholder="Enter prepared quantity"
                                                    required
                                                />
                                                {(item.preparedQty === '' || item.preparedQty === 0 || item.preparedQty < 1) && (
                                                    <p className="text-red-500 text-xs mt-1">Prepared quantity required (min 1)</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    This quantity will be reserved from warehouse stock
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                                        Delivered Qty (Actual Received) *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.deliveredQty || ''}
                                                        onChange={(e) => handleItemChange(i, 'deliveredQty', e.target.value)}
                                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition text-sm font-medium ${isDelivered
                                                            ? 'border-green-300 bg-green-50 focus:ring-green-500'
                                                            : 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                                            }`}
                                                        min="0"
                                                        max={(stockInfo?.availableQuantity || 0) + (item.preparedQty || 0)}
                                                        disabled={!isDelivered}
                                                        placeholder={isDelivered ? "Enter delivered quantity" : "Set when delivered"}
                                                        required={isDelivered}
                                                    />
                                                    {isDelivered && (item.deliveredQty === '' || item.deliveredQty === 0 || item.deliveredQty < 1) && (
                                                        <p className="text-red-500 text-xs mt-1">Delivered quantity required (min 1)</p>
                                                    )}
                                                    {isDelivered && item.deliveredQty > ((stockInfo?.availableQuantity || 0) + (item.preparedQty || 0)) && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            Cannot exceed available + prepared quantity ({(stockInfo?.availableQuantity || 0) + (item.preparedQty || 0)})
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {isDelivered
                                                            ? `Max: ${(stockInfo?.availableQuantity || 0) + (item.preparedQty || 0)} (Available: ${stockInfo?.availableQuantity || 0} + Prepared: ${item.preparedQty || 0})`
                                                            : "Enter this after changing status to DELIVERED"}
                                                    </p>
                                                </div>

                                                {/* UOM */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                                        UOM (Unit of Measure)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={item.uom || ''}
                                                        onChange={(e) => handleItemChange(i, 'uom', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm"
                                                        placeholder="pcs, box, kg, etc."
                                                        disabled={isDelivered || isInTransit}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stock Information */}
                                        {isLoadingStock && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                                <div className="flex items-center gap-2 text-blue-600 text-xs">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Loading stock information...</span>
                                                </div>
                                            </div>
                                        )}

                                        {!isLoadingStock && stockInfo && (
                                            <div className={`mt-2 p-2 rounded border ${hasInsufficientStock ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                                                }`}>
                                                <div className={`text-xs ${hasInsufficientStock ? 'text-red-700' : 'text-blue-700'}`}>
                                                    <div className="space-y-1">
                                                        <div className="font-semibold text-sm">
                                                            Available Stock: {stockInfo.availableQuantity || 0}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Total: {stockInfo.quantity || 0} | Reserved: {stockInfo.reservedQuantity || 0}
                                                        </div>
                                                        {mode === 'edit' && item.originalPreparedQty > 0 && (
                                                            <div className="text-xs text-blue-600">
                                                                Originally Reserved: {item.originalPreparedQty}
                                                                <div className="font-semibold text-green-700">
                                                                    Effective Available: {(stockInfo.availableQuantity || 0) + (item.originalPreparedQty || 0)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {hasInsufficientStock && mode === 'edit' && (
                                                    <div className="text-orange-600 text-xs mt-1 font-medium">
                                                        ℹ️ Note: Your originally reserved {item.originalPreparedQty} units are included in available stock for editing
                                                    </div>
                                                )}
                                                {hasInsufficientStock && mode !== 'edit' && (
                                                    <div className="text-red-600 text-xs mt-1 font-medium">
                                                        ⚠️ Prepared quantity exceeds available stock!
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Remove Button - Only in PREPARING status */}
                                        {isPreparing && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(i)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium mt-4"
                                            >
                                                <Trash2 size={16} />
                                                Remove Item
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                            disabled={isLoading}
                        >
                            {mode === 'create' ? 'Create Delivery' : 'Update Delivery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryFormModal;