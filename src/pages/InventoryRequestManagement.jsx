import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Search, X, Eye, Check,
    Building2, Package, ArrowRight, Loader2, FileText, ShoppingCart
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../services/api';
import LoadingOverlay from '../components/common/LoadingOverlay';
import PurchaseOrderManagement from './PurchaseOrderManagement';

const InventoryRequestManagement = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserName = currentUser.fullName || currentUser.name || currentUser.username || 'Unknown User';
    const [buttonLoading, setButtonLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const setButtonLoadingState = (key, value) => {
        setButtonLoading(prev => ({ ...prev, [key]: value }));
    };
    const [activeTab, setActiveTab] = useState('irr');
    const [irrRequests, setIrrRequests] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showIrrModal, setShowIrrModal] = useState(false);
    const [editingIrr, setEditingIrr] = useState(null);
    const [viewingIrr, setViewingIrr] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [irrFormData, setIrrFormData] = useState({
        supplierId: '',
        productId: '',
        variationId: '',
        uom: '',
        qty: '',
        remarks: ''
    });

    // RPQ State
    const [rpqRequests, setRpqRequests] = useState([]);
    const [showRpqModal, setShowRpqModal] = useState(false);
    const [editingRpq, setEditingRpq] = useState(null);
    const [viewingRpq, setViewingRpq] = useState(null);
    const [rpqFormData, setRpqFormData] = useState({
        supplierId: '',
        supplierName: '',
        supplierInfo: {},
        productId: '',
        productName: '',
        sku: '',
        variation: '',
        uom: '',
        mdr: '',
        qty: '',
        initialPaymentAmount: '',
        finalPaymentAmount: '',
        paymentInstruction: ''
    });

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchIrr, setSearchIrr] = useState('');
    const [searchRpq, setSearchRpq] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadSuppliers(),
                loadIrrRequests(),
                loadRpqRequests()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            if (response.success && response.data) {
                setSuppliers(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            toast.error('Failed to load suppliers');
        }
    };

    const loadIrrRequests = async () => {
        try {
            const response = await api.get('/inventory-requests');
            if (response && response.success) {
                const actualData = response.data?.data || response.data;
                const requests = Array.isArray(actualData) ? actualData : [];
                setIrrRequests(requests);
            } else {
                setIrrRequests([]);
                if (response && response.message) {
                    toast.error(response.message);
                }
            }
        } catch (error) {
            setIrrRequests([]);
            toast.error('Failed to load inventory requests');
        }
    };

    const loadRpqRequests = async () => {
        try {
            const response = await api.get('/quotation-requests');
            if (response && response.success) {
                const actualData = response.data?.data || response.data;
                const requests = Array.isArray(actualData) ? actualData : [];
                setRpqRequests(requests);
            } else {
                setRpqRequests([]);
                if (response && response.message) {
                    toast.error(response.message);
                }
            }
        } catch (error) {
            setRpqRequests([]);
            toast.error('Failed to load quotation requests');
        }
    };


    const tabs = [
        { id: 'irr', label: 'Inventory Request', icon: FileText, count: irrRequests.length },
        { id: 'rpq', label: 'Product Quotation', icon: Package, count: rpqRequests.length },
        { id: 'po', label: 'Purchase Orders & Payments', icon: ShoppingCart }
    ];

    const handleProductChange = (productId, product) => {
        if (!productId) {
            setIrrFormData({ ...irrFormData, productId: '', variationId: '' });
            setSelectedProduct(null);
            return;
        }
        setSelectedProduct(product);
        setIrrFormData({
            ...irrFormData,
            productId: parseInt(productId),
            variationId: product?.isVariation ? product.variationId : ''
        });
    };

    const generateControlNumber = (type, existingRequests) => {
        const year = new Date().getFullYear();
        const prefix = type === 'IRR' ? 'IRR' : 'RPQ';
        const yearRequests = existingRequests.filter(req =>
            req.controlNumber && req.controlNumber.startsWith(`${prefix}-${year}`)
        );
        const nextNumber = yearRequests.length + 1;
        return `${prefix}-${year}-${String(nextNumber).padStart(2, '0')}`;
    };

    const handleIrrSubmit = async (e) => {
        e.preventDefault();
        if (!irrFormData.supplierId || !irrFormData.productId) {
            toast.error('Please select supplier and product');
            return;
        }
        if (!irrFormData.qty || parseFloat(irrFormData.qty) <= 0) {
            toast.error('Please enter valid quantity');
            return;
        }

        setSubmitting(true);
        setActionLoading(true);
        try {
            let sku = '', upc = '', variationDisplay = '';
            if (selectedProduct.isVariation && selectedProduct.variations) {
                const variation = selectedProduct.variations.find(v => v.id === selectedProduct.variationId);
                if (variation) {
                    sku = variation.sku || '';
                    upc = variation.upc || '';
                    variationDisplay = variation.combinationDisplay || '';
                }
            } else {
                sku = selectedProduct.sku || '';
                upc = selectedProduct.upc || '';
            }

            const payload = {
                supplierId: parseInt(irrFormData.supplierId),
                productId: parseInt(irrFormData.productId),
                variationId: selectedProduct.isVariation ? selectedProduct.variationId : null,
                controlNumber: editingIrr ? editingIrr.controlNumber : generateControlNumber('IRR', irrRequests),
                requestor: currentUserName,
                uom: irrFormData.uom || 'PCS',
                qty: parseInt(irrFormData.qty),
                remarks: irrFormData.remarks || '',
                status: 'PENDING',
                productName: selectedProduct.productName || '',
                sku, upc, variation: variationDisplay
            };

            let response;
            if (editingIrr) {
                response = await api.put(`/inventory-requests/${editingIrr.id}`, payload);
            } else {
                response = await api.post('/inventory-requests', payload);
            }

            if (response.success) {
                toast.success(editingIrr ? 'Request updated successfully' : 'Request created successfully');
                setShowIrrModal(false);
                resetIrrForm();
                await loadIrrRequests();
            }
        } catch (error) {
            toast.error('Failed to save request');
        } finally {
            setActionLoading(false);
            setSubmitting(false);
        }
    };

    const handleSupplierChange = async (supplierId) => {
        setIrrFormData({ ...irrFormData, supplierId, productId: '', variationId: '' });
        setSelectedProduct(null);
        setSupplierProducts([]);

        if (!supplierId) {
            setSelectedSupplier(null);
            return;
        }

        const supplier = suppliers.find(s => s.id === parseInt(supplierId));
        setSelectedSupplier(supplier);

        setLoadingProducts(true);
        try {
            const response = await api.get(`/products/by-supplier/${supplierId}`);
            if (response.success && response.data && response.data.data) {
                const products = response.data.data;
                const flattenedProducts = [];
                products.forEach(product => {
                    if (product.variations && product.variations.length > 0) {
                        product.variations.forEach(variation => {
                            flattenedProducts.push({
                                ...product,
                                displayName: `${product.productName} - ${variation.combinationDisplay || variation.sku}`,
                                variationId: variation.id,
                                isVariation: true
                            });
                        });
                    } else {
                        flattenedProducts.push({
                            ...product,
                            displayName: product.productName,
                            isVariation: false
                        });
                    }
                });
                setSupplierProducts(flattenedProducts);
            }
        } catch (error) {
            toast.error('Failed to load supplier products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleProceedToRpq = async (irr) => {
        setButtonLoadingState('proceed-rpq', true);
        setActionLoading(true);
        try {
            const supplier = suppliers.find(s => s.id === irr.supplierId);
            const rpqPayload = {
                irrId: irr.id,
                controlNumber: generateControlNumber('RPQ', rpqRequests),
                requestor: currentUserName,
                supplierId: irr.supplierId,
                supplierName: supplier?.name || '',
                supplierInfo: {
                    contactPerson: supplier?.contactPerson || '',
                    contactNo: supplier?.contactNo || '',
                    email: supplier?.email || '',
                    address: supplier?.address || '',
                    modeOfPayment: supplier?.modeOfPayment || '',
                    bankName: supplier?.bankName || '',
                    accountNumber: supplier?.accountNumber || ''
                },
                productId: irr.productId,
                productName: irr.productName || '',
                sku: irr.sku || '',
                variation: irr.variation || '',
                uom: irr.uom || 'PCS',
                mdr: '',
                qty: irr.qty,
                initialPaymentAmount: 0,
                fullPaymentAmount: 0,
                paymentInstruction: '',
                status: 'DRAFT'
            };

            const response = await api.post('/quotation-requests', rpqPayload);
            if (response.success) {
                await api.patch(`/inventory-requests/${irr.id}`, { status: 'PROCEEDED_TO_RPQ' });
                toast.success('Successfully proceeded to RPQ');
                setShowIrrModal(false);
                resetIrrForm();
                await Promise.all([loadIrrRequests(), loadRpqRequests()]);
            }
        } catch (error) {
            toast.error('Failed to proceed to RPQ');
        } finally {
            setButtonLoadingState('proceed-rpq', false);
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const handleRpqSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setActionLoading(true);
        try {
            const payload = {
                ...rpqFormData,
                initialPaymentAmount: parseFloat(rpqFormData.initialPaymentAmount) || 0,
                finalPaymentAmount: parseFloat(rpqFormData.finalPaymentAmount) || 0,
                qty: parseInt(rpqFormData.qty),
                status: 'PENDING'
            };

            const response = await api.put(`/quotation-requests/${editingRpq.id}`, payload);
            if (response.success) {
                toast.success('Quotation request updated successfully');
                setShowRpqModal(false);
                resetRpqForm();
                await loadRpqRequests();
            }
        } catch (error) {
            toast.error('Failed to update quotation request');
        } finally {
            setSubmitting(false);
            setActionLoading(false);
        }
    };

    const handleConfirmProduct = async (rpq) => {
        if (!window.confirm('Confirm this product quotation?')) return;
        setButtonLoadingState('confirm-product', true);
        setActionLoading(true);
        try {
            const response = await api.patch(`/quotation-requests/${rpq.id}`, { status: 'CONFIRMED' });
            if (response.success) {
                const poResponse = await api.post(`/purchase-orders/from-quotation/${rpq.id}`, {});
                if (poResponse.success) {
                    toast.success('Product confirmed and purchase order created');
                    setViewingRpq(null);
                    await loadRpqRequests();
                }
            }
        } catch (error) {
            toast.error('Failed to confirm quotation');
        } finally {
            setButtonLoadingState('confirm-product', false);
            setActionLoading(false);
        }
    };

    const handleDeleteIrr = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        const loadKey = `delete-irr-${id}`;
        setButtonLoadingState(loadKey, true);
        setActionLoading(true);
        try {
            const response = await api.delete(`/inventory-requests/${id}`);
            if (response.success) {
                toast.success('Request deleted successfully');
                await loadIrrRequests();
            }
        } catch (error) {
            toast.error('Failed to delete request');
        } finally {
            setButtonLoadingState(loadKey, false);
            setActionLoading(false);
        }
    };

    const handleDeleteRpq = async (id) => {
        if (!window.confirm(
            'Are you sure you want to delete this quotation request?\n\n⚠️ Warning: This will also delete the associated Inventory Request.'
        )) return;
        const loadKey = `delete-rpq-${id}`;
        setButtonLoadingState(loadKey, true);
        setActionLoading(true);
        try {
            const response = await api.delete(`/quotation-requests/${id}`);
            if (response.success) {
                toast.success('✅ Quotation and inventory request deleted successfully');
                await Promise.all([loadRpqRequests(), loadIrrRequests()]);
            }
        } catch (error) {
            toast.error('Failed to delete quotation request');
        } finally {
            setButtonLoadingState(loadKey, false);
            setActionLoading(false);
        }
    };

    const resetIrrForm = () => {
        setIrrFormData({ supplierId: '', productId: '', variationId: '', uom: '', qty: '', remarks: '' });
        setSelectedSupplier(null);
        setSelectedProduct(null);
        setSupplierProducts([]);
        setEditingIrr(null);
    };

    const resetRpqForm = () => {
        setRpqFormData({
            supplierId: '',
            supplierName: '',
            supplierInfo: {},
            productId: '',
            productName: '',
            sku: '',
            variation: '',
            uom: '',
            mdr: '',
            qty: '',
            initialPaymentAmount: '',
            finalPaymentAmount: '',
            paymentInstruction: ''
        });
        setEditingRpq(null);
    };

    const filteredIrrRequests = irrRequests.filter(req =>
        req.controlNumber?.toLowerCase().includes(searchIrr.toLowerCase()) ||
        req.productName?.toLowerCase().includes(searchIrr.toLowerCase())
    );

    const filteredRpqRequests = rpqRequests.filter(req =>
        req.controlNumber?.toLowerCase().includes(searchRpq.toLowerCase()) ||
        req.productName?.toLowerCase().includes(searchRpq.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingOverlay show={true} message="Loading..." />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <Toaster position="top-right" />
            <LoadingOverlay show={actionLoading} message="Processing..." />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Procurement Management</h1>
                <p className="text-gray-600 mt-1">Manage inventory requests, quotations, and purchase orders</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'irr' && (
                <div>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by control number or product..."
                                value={searchIrr}
                                onChange={(e) => setSearchIrr(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => {
                                resetIrrForm();
                                setShowIrrModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={20} />
                            New Request
                        </button>
                    </div>

                    {/* IRR Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredIrrRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                No requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredIrrRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{req.controlNumber}</td>
                                                <td className="px-6 py-4 text-gray-900">{req.requestor}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{req.productName}</div>
                                                    {req.variation && (
                                                        <div className="text-xs text-gray-500">{req.variation}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">{req.qty} {req.uom}</td>
                                                <td className="px-6 py-4 text-gray-900">
                                                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'PROCEEDED_TO_RPQ'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {req.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewingIrr(req)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const loadKey = `edit-${req.id}`;
                                                                setButtonLoadingState(loadKey, true);
                                                                setActionLoading(true);

                                                                try {
                                                                    setEditingIrr(req);
                                                                    setIrrFormData({
                                                                        supplierId: req.supplierId,
                                                                        productId: req.productId,
                                                                        variationId: req.variationId || '',
                                                                        uom: req.uom || '',
                                                                        qty: req.qty,
                                                                        remarks: req.remarks || ''
                                                                    });

                                                                    if (req.supplierId) {
                                                                        const supplier = suppliers.find(s => s.id === req.supplierId);
                                                                        setSelectedSupplier(supplier);

                                                                        setLoadingProducts(true);
                                                                        try {
                                                                            const response = await api.get(`/products/by-supplier/${req.supplierId}`);
                                                                            if (response.success && response.data && response.data.data) {
                                                                                const products = response.data.data;

                                                                                const flattenedProducts = [];
                                                                                products.forEach(product => {
                                                                                    if (product.variations && product.variations.length > 0) {
                                                                                        product.variations.forEach(variation => {
                                                                                            flattenedProducts.push({
                                                                                                ...product,
                                                                                                displayName: `${product.productName} - ${variation.combinationDisplay || variation.sku}`,
                                                                                                variationId: variation.id,
                                                                                                isVariation: true
                                                                                            });
                                                                                        });
                                                                                    } else {
                                                                                        flattenedProducts.push({
                                                                                            ...product,
                                                                                            displayName: product.productName,
                                                                                            isVariation: false
                                                                                        });
                                                                                    }
                                                                                });

                                                                                setSupplierProducts(flattenedProducts);

                                                                                const selectedProd = flattenedProducts.find(p => {
                                                                                    if (req.variationId) {
                                                                                        return p.id === req.productId && p.variationId === req.variationId;
                                                                                    }
                                                                                    return p.id === req.productId;
                                                                                });

                                                                                if (selectedProd) {
                                                                                    setSelectedProduct(selectedProd);
                                                                                }
                                                                            }
                                                                        } finally {
                                                                            setLoadingProducts(false);
                                                                        }
                                                                    }

                                                                    setShowIrrModal(true);
                                                                } finally {
                                                                    setButtonLoadingState(loadKey, false);
                                                                    setActionLoading(false);
                                                                }
                                                            }}
                                                            disabled={req.status === 'PROCEEDED_TO_RPQ' || buttonLoading[`edit-${req.id}`]}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {buttonLoading[`edit-${req.id}`] ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Edit2 size={18} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteIrr(req.id)}
                                                            disabled={req.status === 'PROCEEDED_TO_RPQ' || buttonLoading[`delete-irr-${req.id}`]}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {buttonLoading[`delete-irr-${req.id}`] ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rpq' && (
                <div>
                    <div className="flex-1 relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by control number or product..."
                            value={searchRpq}
                            onChange={(e) => setSearchRpq(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* RPQ Table */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRpqRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                No quotation requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRpqRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{req.controlNumber}</td>
                                                <td className="px-6 py-4 text-gray-900">{req.requestor}</td>
                                                <td className="px-6 py-4 text-gray-900">{req.supplierName}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">{req.productName}</div>
                                                    {req.variation && (
                                                        <div className="text-xs text-gray-500">{req.variation}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-900">
                                                    {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'CONFIRMED'
                                                        ? 'bg-green-100 text-green-800'
                                                        : req.status === 'PENDING'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {req.status || 'DRAFT'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewingRpq(req)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingRpq(req);
                                                                setRpqFormData({
                                                                    supplierId: req.supplierId,
                                                                    supplierName: req.supplierName,
                                                                    supplierInfo: req.supplierInfo || {},
                                                                    productId: req.productId,
                                                                    productName: req.productName,
                                                                    sku: req.sku,
                                                                    variation: req.variation,
                                                                    uom: req.uom,
                                                                    mdr: req.mdr || '',
                                                                    qty: req.qty,
                                                                    initialPaymentAmount: req.initialPaymentAmount || '',
                                                                    finalPaymentAmount: req.finalPaymentAmount || '',
                                                                    paymentInstruction: req.paymentInstruction || ''
                                                                });
                                                                setShowRpqModal(true);
                                                            }}
                                                            disabled={req.status === 'CONFIRMED'}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRpq(req.id)}
                                                            disabled={req.status === 'CONFIRMED' || buttonLoading[`delete-rpq-${req.id}`]}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {buttonLoading[`delete-rpq-${req.id}`] ? (
                                                                <Loader2 size={18} className="animate-spin" />
                                                            ) : (
                                                                <Trash2 size={18} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* IRR Modal */}
            {showIrrModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingIrr ? 'Edit Request' : 'New Inventory Request'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowIrrModal(false);
                                    resetIrrForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleIrrSubmit} className="p-6 space-y-6">
                            {/* Supplier Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={irrFormData.supplierId}
                                    onChange={(e) => handleSupplierChange(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Supplier Details */}
                            {selectedSupplier && (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-gray-900 mb-3">Supplier Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Contact Person:</span>
                                            <span className="ml-2 text-gray-900">{selectedSupplier.contactPerson || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Contact No:</span>
                                            <span className="ml-2 text-gray-900">{selectedSupplier.contactNo || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2 text-gray-900">{selectedSupplier.email || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Type:</span>
                                            <span className="ml-2 text-gray-900">{selectedSupplier.type || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Product Selection */}
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={irrFormData.productId}
                                    onChange={(e) => {
                                        const selectedIndex = e.target.selectedIndex - 1; // -1 for the placeholder option
                                        if (selectedIndex >= 0) {
                                            const product = supplierProducts[selectedIndex];
                                            handleProductChange(e.target.value, product);
                                        } else {
                                            handleProductChange('', null);
                                        }
                                    }}
                                    required
                                    disabled={!irrFormData.supplierId || loadingProducts}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {loadingProducts ? 'Loading products...' : 'Select product'}
                                    </option>
                                    {supplierProducts.map((product, index) => (
                                        <option key={index} value={product.id}>
                                            {product.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Details */}
                            {selectedProduct && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">SKU:</span>
                                            <span className="ml-2 text-gray-900">
                                                {selectedProduct.isVariation
                                                    ? selectedProduct.variations?.find(v => v.id === selectedProduct.variationId)?.sku || '-'
                                                    : selectedProduct.sku || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">UPC:</span>
                                            <span className="ml-2 text-gray-900">
                                                {selectedProduct.isVariation
                                                    ? selectedProduct.variations?.find(v => v.id === selectedProduct.variationId)?.upc || '-'
                                                    : selectedProduct.upc || '-'}
                                            </span>
                                        </div>
                                        {selectedProduct.isVariation && selectedProduct.variations && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Variation:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {selectedProduct.variations.find(v => v.id === selectedProduct.variationId)?.combinationDisplay || '-'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}


                            {/* Control Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Control Number
                                </label>
                                <input
                                    type="text"
                                    value={editingIrr ? editingIrr.controlNumber : generateControlNumber('IRR', irrRequests)}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                />
                            </div>

                            {/* UOM and Quantity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UOM <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={irrFormData.uom}
                                        onChange={(e) => setIrrFormData({ ...irrFormData, uom: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select UOM</option>
                                        <option value="PCS">PCS (Pieces)</option>
                                        <option value="BOX">BOX</option>
                                        <option value="CTN">CTN (Carton)</option>
                                        <option value="KG">KG (Kilogram)</option>
                                        <option value="L">L (Liter)</option>
                                        <option value="M">M (Meter)</option>
                                        <option value="SET">SET</option>
                                        <option value="PACK">PACK</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={irrFormData.qty}
                                        onChange={(e) => setIrrFormData({ ...irrFormData, qty: e.target.value })}
                                        required
                                        min="1"
                                        step="1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter quantity"
                                    />
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks
                                </label>
                                <textarea
                                    value={irrFormData.remarks}
                                    onChange={(e) => setIrrFormData({ ...irrFormData, remarks: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter any remarks or special instructions..."
                                />
                            </div>


                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowIrrModal(false);
                                        resetIrrForm();
                                    }}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                {editingIrr && editingIrr.status !== 'PROCEEDED_TO_RPQ' && (
                                    <button
                                        type="button"
                                        onClick={() => handleProceedToRpq(editingIrr)}
                                        disabled={submitting || buttonLoading['proceed-rpq']}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {buttonLoading['proceed-rpq'] ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight size={18} />
                                                Proceed to RPQ
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            {editingIrr ? 'Updating...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        editingIrr ? 'Update Request' : 'Submit Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* IRR View Modal */}
            {viewingIrr && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                            <button
                                onClick={() => setViewingIrr(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600">Control Number:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.controlNumber}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Requestor:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.requestor}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Product:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.productName}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">SKU:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.sku || '-'}</p>
                                </div>
                                {viewingIrr.variation && (
                                    <div className="col-span-2">
                                        <span className="text-sm text-gray-600">Variation:</span>
                                        <p className="font-semibold text-gray-900">{viewingIrr.variation}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm text-gray-600">Quantity:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.qty} {viewingIrr.uom}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <p className="font-semibold text-gray-900">{viewingIrr.status || 'PENDING'}</p>
                                </div>
                                {viewingIrr.remarks && (
                                    <div className="col-span-2">
                                        <span className="text-sm text-gray-600">Remarks:</span>
                                        <p className="font-semibold text-gray-900">{viewingIrr.remarks}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RPQ Modal */}
            {showRpqModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                Edit Quotation Request
                            </h2>
                            <button
                                onClick={() => {
                                    setShowRpqModal(false);
                                    resetRpqForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRpqSubmit} className="p-6 space-y-6">
                            {/* Supplier Information */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 size={18} />
                                    Supplier Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-gray-600">Name:</span>
                                            <span className="ml-2 font-medium text-gray-900">{rpqFormData.supplierName}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Contact Person:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {rpqFormData.supplierInfo?.contactPerson || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Contact No:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {rpqFormData.supplierInfo?.contactNo || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {rpqFormData.supplierInfo?.email || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Arrangement */}
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <h3 className="font-semibold text-gray-900 mb-3">Payment Arrangement</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Initial Payment Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={rpqFormData.initialPaymentAmount}
                                            onChange={(e) => setRpqFormData({ ...rpqFormData, initialPaymentAmount: e.target.value })}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter amount"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Final Payment Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={rpqFormData.finalPaymentAmount}
                                            onChange={(e) => setRpqFormData({ ...rpqFormData, finalPaymentAmount: e.target.value })}
                                            step="0.01"
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Information */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Package size={18} />
                                    Product Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-600">Product Name:</span>
                                        <p className="font-medium text-gray-900">{rpqFormData.productName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">SKU:</span>
                                        <p className="font-medium text-gray-900">{rpqFormData.sku || '-'}</p>
                                    </div>
                                    {rpqFormData.variation && (
                                        <div className="col-span-2">
                                            <span className="text-sm text-gray-600">Variation:</span>
                                            <p className="font-medium text-gray-900">{rpqFormData.variation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        UOM
                                    </label>
                                    <input
                                        type="text"
                                        value={rpqFormData.uom}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        MDR (Minimum Order)
                                    </label>
                                    <input
                                        type="number"
                                        value={rpqFormData.mdr}
                                        onChange={(e) => setRpqFormData({ ...rpqFormData, mdr: e.target.value })}
                                        min="1"
                                        step="1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter MDR"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={rpqFormData.qty}
                                        onChange={(e) => setRpqFormData({ ...rpqFormData, qty: e.target.value })}
                                        required
                                        min="1"
                                        step="1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter quantity"
                                    />
                                </div>
                            </div>

                            {/* Payment Instruction */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Instruction
                                </label>
                                <textarea
                                    value={rpqFormData.paymentInstruction}
                                    onChange={(e) => setRpqFormData({ ...rpqFormData, paymentInstruction: e.target.value })}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter payment instructions, terms, or special conditions..."
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRpqModal(false);
                                        resetRpqForm();
                                    }}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Quotation'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RPQ View Modal */}
            {viewingRpq && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Quotation Request Details</h2>
                            <button
                                onClick={() => setViewingRpq(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                                <div>
                                    <span className="text-sm text-gray-600">Control Number:</span>
                                    <p className="font-semibold text-gray-900">{viewingRpq.controlNumber}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Requestor:</span>
                                    <p className="font-semibold text-gray-900">{viewingRpq.requestor}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Date:</span>
                                    <p className="font-semibold text-gray-900">
                                        {viewingRpq.createdAt ? new Date(viewingRpq.createdAt).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <p className="font-semibold text-gray-900">{viewingRpq.status || 'DRAFT'}</p>
                                </div>
                            </div>

                            {/* Supplier Info */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Supplier Information</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.supplierName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Contact Person:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.supplierInfo?.contactPerson || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Contact No:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.supplierInfo?.contactNo || '-'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.supplierInfo?.email || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Product:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.productName}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">SKU:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.sku || '-'}</p>
                                    </div>
                                    {viewingRpq.variation && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600">Variation:</span>
                                            <p className="font-medium text-gray-900">{viewingRpq.variation}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-600">UOM:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.uom}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Quantity:</span>
                                        <p className="font-medium text-gray-900">{viewingRpq.qty}</p>
                                    </div>
                                    {viewingRpq.mdr && (
                                        <div>
                                            <span className="text-gray-600">MDR:</span>
                                            <p className="font-medium text-gray-900">{viewingRpq.mdr}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="p-4 bg-amber-50 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Payment Arrangement</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Initial Payment Amount:</span>
                                        <p className="font-medium text-gray-900">
                                            {formatCurrency(viewingRpq.initialPaymentAmount)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Final Payment Amount:</span>
                                        <p className="font-medium text-gray-900">
                                            {formatCurrency(viewingRpq.finalPaymentAmount)}
                                        </p>
                                    </div>
                                    {viewingRpq.paymentInstruction && (
                                        <div className="col-span-2">
                                            <span className="text-gray-600">Payment Instruction:</span>
                                            <p className="font-medium text-gray-900">{viewingRpq.paymentInstruction}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            {viewingRpq.status !== 'CONFIRMED' && (
                                <div className="pt-4 border-t">
                                    <button
                                        onClick={() => handleConfirmProduct(viewingRpq)}
                                        disabled={buttonLoading['confirm-product']}
                                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                                    >
                                        {buttonLoading['confirm-product'] ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Confirming...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={20} />
                                                Confirm Product
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'po' && (
                <div className="border-t-4 border-gray-300 pt-12 mt-12">
                    <PurchaseOrderManagement />
                </div>
            )}
        </div>
    );
};
export default InventoryRequestManagement;