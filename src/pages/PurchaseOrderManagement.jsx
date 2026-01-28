import React, { useState, useEffect } from 'react';
import {
    Eye, Edit2, Trash2, Search, X, DollarSign, Upload, Download,
    FileText, CheckCircle, Loader2, CreditCard, Package, Calendar, User, Mail, Box, Hash, Scale
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api } from '../services/api';
import LoadingOverlay from '../components/common/LoadingOverlay';

const PurchaseOrderManagement = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [paymentOrders, setPaymentOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchPO, setSearchPO] = useState('');
    const [searchPayment, setSearchPayment] = useState('');
    const [activeTab, setActiveTab] = useState('purchase-orders');

    const [viewingPO, setViewingPO] = useState(null);
    const [editingPO, setEditingPO] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPOForPayment, setSelectedPOForPayment] = useState(null);
    const [viewingPayments, setViewingPayments] = useState(null);
    const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const [poFormData, setPoFormData] = useState({
        unitPrice: '',
        totalAmount: '',
        date: ''
    });

    const [paymentFormData, setPaymentFormData] = useState({
        modeOfPayment: '',
        paymentDetails: '',
        productAmount: '',
        processingFee: '0',
        dollarAmount: '0',
        pesoAmount: '0'
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadPurchaseOrders(),
                loadPaymentOrders()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPurchaseOrders = async () => {
        try {
            const response = await api.get('/purchase-orders');
            if (response.success && response.data) {
                const actualData = response.data.data || response.data;
                const orders = Array.isArray(actualData) ? actualData : [];
                setPurchaseOrders(orders);
            } else {
                setPurchaseOrders([]);
            }
        } catch (error) {
            console.error('Purchase orders error:', error);
            toast.error('Failed to load purchase orders');
            setPurchaseOrders([]);
        }
    };

    const loadPaymentOrders = async () => {
        try {
            const response = await api.get('/purchase-orders');
            if (response.success && response.data) {
                const actualData = response.data.data || response.data;
                const orders = Array.isArray(actualData) ? actualData : [];

                const submitted = orders.filter(po =>
                    po.paymentStatus === 'PAYMENT_PENDING' ||
                    po.paymentStatus === 'PARTIAL_PAID' ||
                    po.paymentStatus === 'FULL_PAID'
                );
                setPaymentOrders(submitted);
            } else {
                setPaymentOrders([]);
            }
        } catch (error) {
            console.error('Payment orders error:', error);
            setPaymentOrders([]);
        }
    };

    const getPaymentModeLabel = (mode, supplierInfo) => {
        if (mode === 'TELEGRAPHIC_TRANSFER') {
            const bankName = supplierInfo?.bankName || '';
            const accountNumber = supplierInfo?.accountNumber || '';
            if (bankName && accountNumber) {
                return `Telegraphic Transfer - ${bankName} (${accountNumber})`;
            }
            return 'Telegraphic Transfer';
        } else if (mode === 'OTHER') {
            const otherDetails = supplierInfo?.otherPaymentDetails || '';
            if (otherDetails) {
                return `Other - ${otherDetails.length > 50 ? otherDetails.substring(0, 50) + '...' : otherDetails}`;
            }
            return 'Other';
        }
        return mode;
    };

    const handleEditPO = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                unitPrice: parseFloat(poFormData.unitPrice),
                totalAmount: parseFloat(poFormData.totalAmount),
                date: poFormData.date || null
            };

            const response = await api.put(`/purchase-orders/${editingPO.id}`, payload);
            if (response.success) {
                toast.success('Purchase order updated successfully - Product unit cost updated');
                setEditingPO(null);
                await loadPurchaseOrders();
                window.dispatchEvent(new Event('productUpdated'));
            }
        } catch (error) {
            toast.error('Failed to update purchase order');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitOrder = async (po) => {
        if (!po.unitPrice || po.unitPrice <= 0) {
            toast.error('Please set unit price before submitting');
            return;
        }

        setLoadingMessage('Submitting purchase order...');
        setIsLoadingOverlay(true);
        setActionLoading(true);
        try {
            const response = await api.post(`/purchase-orders/${po.id}/submit`, {});
            if (response.success) {
                toast.success('Purchase order submitted successfully');
                await loadInitialData();
            }
        } catch (error) {
            toast.error('Failed to submit purchase order');
        } finally {
            setIsLoadingOverlay(false);
            setActionLoading(false);
        }
    };

    const handlePayNow = async (po) => {
        setLoadingMessage('Preparing payment form...');
        setIsLoadingOverlay(true);
        try {
            setSelectedPOForPayment(po);
            setPaymentFormData({
                modeOfPayment: po.modeOfPayment || '',
                paymentDetails: '',
                productAmount: '',
                processingFee: '0',
                dollarAmount: '0',
                pesoAmount: '0'
            });
            setShowPaymentModal(true);
        } finally {
            setIsLoadingOverlay(false);
        }
    };


    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setLoadingMessage('Recording payment...');
        setIsLoadingOverlay(true);
        setActionLoading(true);
        try {
            const payload = {
                purchaseOrderId: selectedPOForPayment.id,
                modeOfPayment: paymentFormData.modeOfPayment,
                paymentDetails: paymentFormData.paymentDetails,
                productAmount: parseFloat(paymentFormData.productAmount),
                processingFee: parseFloat(paymentFormData.processingFee || 0),
                dollarAmount: parseFloat(paymentFormData.dollarAmount || 0),
                pesoAmount: parseFloat(paymentFormData.pesoAmount || 0)
            };

            const response = await api.post('/payments', payload);
            if (response.success) {
                toast.success('Payment recorded successfully');
                setShowPaymentModal(false);
                await loadInitialData();
            }
        } catch (error) {
            toast.error('Failed to record payment');
        } finally {
            setIsLoadingOverlay(false);
            setActionLoading(false);
        }
    };

    const handleViewPayments = async (po) => {
        try {
            setLoadingMessage('Loading payment history...');
            setIsLoadingOverlay(true);

            const response = await api.get(`/payments/purchase-order/${po.id}`);

            if (response.success) {
                const paymentsData = response.data || [];
                const paymentsArray = Array.isArray(paymentsData) ? paymentsData :
                    paymentsData.data ? paymentsData.data :
                        paymentsData.payments ? paymentsData.payments : [];

                setViewingPayments({
                    po: po,
                    payments: paymentsArray
                });
            } else {
                toast.error('Failed to load payments');
                setViewingPayments({
                    po: po,
                    payments: []
                });
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            toast.error('Failed to load payments');
            setViewingPayments({
                po: po,
                payments: []
            });
        } finally {
            setIsLoadingOverlay(false);
        }
    };

    const calculateTotalPayment = () => {
        const productAmount = parseFloat(paymentFormData.productAmount) || 0;
        const processingFee = parseFloat(paymentFormData.processingFee) || 0;
        return productAmount + processingFee;
    };

    const calculatePercentage = () => {
        if (!selectedPOForPayment || !selectedPOForPayment.totalAmount) return 0;
        const total = calculateTotalPayment();
        return ((total / selectedPOForPayment.totalAmount) * 100).toFixed(2);
    };

    const getPaymentStatusBadge = (status) => {
        const statusMap = {
            'PAYMENT_PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Payment Pending' },
            'PARTIAL_PAID': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Partial Paid' },
            'FULL_PAID': { bg: 'bg-green-100', text: 'text-green-800', label: 'Full Paid' }
        };
        const badge = statusMap[status] || statusMap['PAYMENT_PENDING'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const filteredPurchaseOrders = purchaseOrders.filter(po =>
        po.controlNumber?.toLowerCase().includes(searchPO.toLowerCase()) ||
        po.productName?.toLowerCase().includes(searchPO.toLowerCase())
    );

    const filteredPaymentOrders = paymentOrders.filter(po =>
        po.controlNumber?.toLowerCase().includes(searchPayment.toLowerCase()) ||
        po.productName?.toLowerCase().includes(searchPayment.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <>
            <LoadingOverlay show={isLoadingOverlay} message={loadingMessage} />
            <div className="p-6 max-w-full mx-auto px-8">
                <Toaster position="top-right" />
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Order Management</h1>
                    <p className="text-gray-600 mt-1">Manage purchase orders and payments</p>
                </div>

                {/* Tabs Navigation */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('purchase-orders')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'purchase-orders'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Package className="inline w-4 h-4 mr-2" />
                                Inventory Purchase Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <CreditCard className="inline w-4 h-4 mr-2" />
                                Payment of Purchase Orders
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Inventory Purchase Order Section */}
                {activeTab === 'purchase-orders' && (
                    <div>
                        <div className="flex-1 relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by control number or product..."
                                value={searchPO}
                                onChange={(e) => setSearchPO(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control #</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredPurchaseOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                    No purchase orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPurchaseOrders.map((po) => (
                                                <tr key={po.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{po.controlNumber}</td>
                                                    <td className="px-6 py-4 text-gray-900">{po.supplierName}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{po.productName}</div>
                                                        {po.variation && (
                                                            <div className="text-xs text-gray-500">{po.variation}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900">{po.qty} {po.uom}</td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        ₱{po.totalAmount ? po.totalAmount.toFixed(2) : '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4">{getPaymentStatusBadge(po.paymentStatus)}</td>
                                                    {/* In the Purchase Orders table actions column */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setViewingPO(po)}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingPO(po);
                                                                    setPoFormData({
                                                                        unitPrice: po.unitPrice || '',
                                                                        totalAmount: po.totalAmount || '',
                                                                        date: po.date || ''
                                                                    });
                                                                }}
                                                                // Disable edit when not PAYMENT_PENDING
                                                                disabled={po.paymentStatus !== 'PAYMENT_PENDING'}
                                                                className={`p-2 ${po.paymentStatus !== 'PAYMENT_PENDING' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'} rounded-lg`}
                                                                title={po.paymentStatus !== 'PAYMENT_PENDING' ? 'Cannot edit paid orders' : 'Edit'}
                                                            >
                                                                <Edit2 size={18} />
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

                {/* Payment of Purchase Order Section */}
                {activeTab === 'payments' && (
                    <div>
                        <div className="flex-1 relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by control number or product..."
                                value={searchPayment}
                                onChange={(e) => setSearchPayment(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control #</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredPaymentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                    No payment orders found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPaymentOrders.map((po) => (
                                                <tr key={po.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{po.controlNumber}</td>
                                                    <td className="px-6 py-4 text-gray-900">{po.supplierName}</td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        ₱{po.totalAmount ? po.totalAmount.toFixed(2) : '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        ₱{po.totalPaid ? po.totalPaid.toFixed(2) : '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-900">
                                                        ₱{po.remainingBalance ? po.remainingBalance.toFixed(2) : '0.00'}
                                                    </td>
                                                    <td className="px-6 py-4">{getPaymentStatusBadge(po.paymentStatus)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewPayments(po)}
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                                title="View Payments"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePayNow(po)}
                                                                disabled={po.paymentStatus === 'FULL_PAID' || isLoadingOverlay}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                            >
                                                                {isLoadingOverlay ? (
                                                                    <Loader2 className="animate-spin" size={18} />
                                                                ) : (
                                                                    <CreditCard size={18} />
                                                                )}
                                                                {isLoadingOverlay ? 'Loading...' : 'Pay Now'}
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

                {/* View PO Modal */}
                {viewingPO && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Purchase Order Details</h2>
                                <button onClick={() => setViewingPO(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-600">Control Number:</span>
                                        <p className="font-semibold text-gray-900">{viewingPO.controlNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <div className="mt-1">{getPaymentStatusBadge(viewingPO.paymentStatus)}</div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-3">Supplier Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Name:</span>
                                            <p className="font-medium text-gray-900">{viewingPO.supplierName}</p>
                                        </div>
                                        {viewingPO.supplierInfo?.contactPerson && (
                                            <div>
                                                <span className="text-gray-600">Contact Person:</span>
                                                <p className="font-medium text-gray-900">{viewingPO.supplierInfo.contactPerson}</p>
                                            </div>
                                        )}
                                        {viewingPO.supplierInfo?.email && (
                                            <div>
                                                <span className="text-gray-600">Email:</span>
                                                <p className="font-medium text-gray-900">{viewingPO.supplierInfo.email}</p>
                                            </div>
                                        )}
                                        {viewingPO.supplierInfo?.phone && (
                                            <div>
                                                <span className="text-gray-600">Phone:</span>
                                                <p className="font-medium text-gray-900">{viewingPO.supplierInfo.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Product:</span>
                                            <p className="font-medium text-gray-900">{viewingPO.productName}</p>
                                        </div>
                                        {viewingPO.variation && (
                                            <div>
                                                <span className="text-gray-600">Variation:</span>
                                                <p className="font-medium text-blue-700">{viewingPO.variation}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-600">SKU:</span>
                                            <p className="font-medium text-gray-900">{viewingPO.sku || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Quantity:</span>
                                            <p className="font-medium text-gray-900">{viewingPO.qty} {viewingPO.uom}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Unit Price:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{viewingPO.unitPrice ? viewingPO.unitPrice.toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Amount:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{viewingPO.totalAmount ? viewingPO.totalAmount.toFixed(2) : '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleSubmitOrder(viewingPO)}
                                        disabled={viewingPO.paymentStatus !== 'PAYMENT_PENDING' || !viewingPO.unitPrice}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Submit Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {editingPO && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Edit Purchase Order</h2>
                                <button onClick={() => setEditingPO(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleEditPO} className="p-6 space-y-6">

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-600">Control Number:</span>
                                        <p className="font-semibold text-gray-900">{editingPO.controlNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Status:</span>
                                        <div className="mt-1">{getPaymentStatusBadge(editingPO.paymentStatus)}</div>
                                    </div>
                                </div>


                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <User size={18} className="text-blue-600" />
                                        Supplier Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <User size={14} />
                                                Name:
                                            </span>
                                            <p className="font-medium text-gray-900 mt-1">{editingPO.supplierName}</p>
                                        </div>
                                        {editingPO.supplierInfo?.contactPerson && (
                                            <div>
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <User size={14} />
                                                    Contact Person:
                                                </span>
                                                <p className="font-medium text-gray-900 mt-1">{editingPO.supplierInfo.contactPerson}</p>
                                            </div>
                                        )}
                                        {editingPO.supplierInfo?.email && (
                                            <div className="col-span-2 md:col-span-1">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <Mail size={14} />
                                                    Email:
                                                </span>
                                                <p className="font-medium text-gray-900 mt-1">{editingPO.supplierInfo.email}</p>
                                            </div>
                                        )}
                                        {editingPO.supplierInfo?.phone && (
                                            <div className="col-span-2 md:col-span-1">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    <Phone size={14} />
                                                    Phone:
                                                </span>
                                                <p className="font-medium text-gray-900 mt-1">{editingPO.supplierInfo.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Package size={18} className="text-gray-600" />
                                        Product Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                        <div>
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <Box size={14} />
                                                Product:
                                            </span>
                                            <p className="font-medium text-gray-900 mt-1">{editingPO.productName}</p>
                                        </div>
                                        {editingPO.variation && (
                                            <div>
                                                <span className="text-gray-600">Variation:</span>
                                                <p className="font-medium text-blue-700 mt-1">{editingPO.variation}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <Hash size={14} />
                                                SKU:
                                            </span>
                                            <p className="font-medium text-gray-900 mt-1">{editingPO.sku || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 flex items-center gap-1">
                                                <Scale size={14} />
                                                Quantity:
                                            </span>
                                            <p className="font-medium text-gray-900 mt-1">{editingPO.qty} {editingPO.uom}</p>
                                        </div>
                                    </div>


                                    <div className="p-3 bg-white rounded border">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Pricing</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-sm text-gray-600">Current Unit Price:</span>
                                                <p className="font-medium text-gray-900">
                                                    {editingPO.unitPrice ? editingPO.unitPrice.toFixed(2) : '0.00'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">Current Total:</span>
                                                <p className="font-medium text-gray-900">
                                                    {editingPO.totalAmount ? editingPO.totalAmount.toFixed(2) : '0.00'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Edit2 size={18} className="text-amber-600" />
                                        Edit Purchase Order Details
                                    </h3>

                                    <div className="space-y-4">

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                <Calendar className="inline w-4 h-4 mr-1" />
                                                Date
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="date"
                                                    value={poFormData.date}
                                                    onChange={(e) => setPoFormData({ ...poFormData, date: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                                />
                                            </div>
                                        </div>


                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ₱ Unit Price <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    value={poFormData.unitPrice}
                                                    onChange={(e) => setPoFormData({ ...poFormData, unitPrice: e.target.value })}
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter unit price"
                                                />
                                            </div>
                                        </div>

                                        {/* Total Amount field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ₱ Total Amount <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={poFormData.totalAmount}
                                                onChange={(e) => setPoFormData({ ...poFormData, totalAmount: e.target.value })}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter total amount"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPO(null)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || isLoadingOverlay}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {actionLoading || isLoadingOverlay ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin" size={18} />
                                                Recording...
                                            </span>
                                        ) : 'Record Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && selectedPOForPayment && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">PO Number:</span>
                                            <p className="font-medium text-gray-900">{selectedPOForPayment.controlNumber}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Amount:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{selectedPOForPayment.totalAmount?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Paid:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{selectedPOForPayment.totalPaid?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Remaining:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{selectedPOForPayment.remainingBalance?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mode of Payment <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={paymentFormData.modeOfPayment}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, modeOfPayment: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select payment mode</option>
                                        <option value="CASH">Cash</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="CHECK">Check</option>
                                        <option value="CREDIT_CARD">Credit Card</option>

                                        {/* Show supplier's payment mode with details if available */}
                                        {selectedPOForPayment?.modeOfPayment === 'TELEGRAPHIC_TRANSFER' && (
                                            <option value="TELEGRAPHIC_TRANSFER">
                                                {getPaymentModeLabel('TELEGRAPHIC_TRANSFER', selectedPOForPayment.supplierInfo)}
                                            </option>
                                        )}

                                        {selectedPOForPayment?.modeOfPayment === 'OTHER' && (
                                            <option value="OTHER">
                                                {getPaymentModeLabel('OTHER', selectedPOForPayment.supplierInfo)}
                                            </option>
                                        )}

                                        {/* Show both options if no specific mode from supplier */}
                                        {!selectedPOForPayment?.modeOfPayment && (
                                            <>
                                                <option value="TELEGRAPHIC_TRANSFER">Telegraphic Transfer</option>
                                                <option value="OTHER">Other</option>
                                            </>
                                        )}
                                    </select>

                                    {selectedPOForPayment?.modeOfPayment && selectedPOForPayment?.supplierInfo && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Supplier Payment Details:</p>
                                            {selectedPOForPayment.modeOfPayment === 'TELEGRAPHIC_TRANSFER' && (
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    {selectedPOForPayment.supplierInfo.bankName && (
                                                        <p><span className="font-medium">Bank Name:</span> {selectedPOForPayment.supplierInfo.bankName}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.bankAddress && (
                                                        <p><span className="font-medium">Bank Address:</span> {selectedPOForPayment.supplierInfo.bankAddress}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.accountNumber && (
                                                        <p><span className="font-medium">Account Number:</span> {selectedPOForPayment.supplierInfo.accountNumber}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.swiftCode && (
                                                        <p><span className="font-medium">SWIFT Code:</span> {selectedPOForPayment.supplierInfo.swiftCode}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.beneficiaryName && (
                                                        <p><span className="font-medium">Beneficiary Name:</span> {selectedPOForPayment.supplierInfo.beneficiaryName}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.beneficiaryAddress && (
                                                        <p><span className="font-medium">Beneficiary Address:</span> {selectedPOForPayment.supplierInfo.beneficiaryAddress}</p>
                                                    )}
                                                    {selectedPOForPayment.supplierInfo.bankCountry && (
                                                        <p><span className="font-medium">Bank Country:</span> {selectedPOForPayment.supplierInfo.bankCountry}</p>
                                                    )}
                                                </div>
                                            )}
                                            {selectedPOForPayment.modeOfPayment === 'OTHER' && selectedPOForPayment.supplierInfo.otherPaymentDetails && (
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap">{selectedPOForPayment.supplierInfo.otherPaymentDetails}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Details
                                    </label>
                                    <textarea
                                        value={paymentFormData.paymentDetails}
                                        onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDetails: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter payment details (e.g., reference number, bank details...)"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product Amount (₱) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentFormData.productAmount}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, productAmount: e.target.value })}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Processing/Service Fee (₱)
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentFormData.processingFee}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, processingFee: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dollar Amount ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentFormData.dollarAmount}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, dollarAmount: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Peso Amount (₱)
                                        </label>
                                        <input
                                            type="number"
                                            value={paymentFormData.pesoAmount}
                                            onChange={(e) => setPaymentFormData({ ...paymentFormData, pesoAmount: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Payment Total:</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                ₱{calculateTotalPayment().toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Percentage:</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {calculatePercentage()}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Recording...' : 'Record Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Payments Modal */}
                {viewingPayments && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                                <button onClick={() => setViewingPayments(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">PO Number:</span>
                                            <p className="font-medium text-gray-900">{viewingPayments.po.controlNumber}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total Amount:</span>
                                            <p className="font-medium text-gray-900">
                                                ₱{viewingPayments.po.totalAmount?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Status:</span>
                                            <div className="mt-1">{getPaymentStatusBadge(viewingPayments.po.paymentStatus)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Payment Records</h3>
                                    {!viewingPayments.payments || viewingPayments.payments.length === 0 ? (
                                        <p className="text-center text-gray-500 py-8">No payments recorded yet</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {Array.isArray(viewingPayments.payments) && viewingPayments.payments.map((payment) => (
                                                <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <span className="font-semibold text-gray-900">
                                                                Payment #{payment.paymentNumber || payment.id}
                                                            </span>
                                                            <p className="text-sm text-gray-600">
                                                                {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'No date'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-lg text-gray-900">
                                                                ₱{payment.totalAmount?.toFixed(2) || '0.00'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {payment.percentageOfTotal?.toFixed(2) || '0.00'}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Mode:</span>
                                                            <span className="ml-2 text-gray-900">{payment.modeOfPayment || 'N/A'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-600">Product Amount:</span>
                                                            <span className="ml-2 text-gray-900">
                                                                ₱{payment.productAmount?.toFixed(2) || '0.00'}
                                                            </span>
                                                        </div>
                                                        {/* NEW: Show dollar amount */}
                                                        {payment.dollarAmount > 0 && (
                                                            <div>
                                                                <span className="text-gray-600">Dollar Amount:</span>
                                                                <span className="ml-2 text-gray-900">
                                                                    ${payment.dollarAmount?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {payment.processingFee > 0 && (
                                                            <div>
                                                                <span className="text-gray-600">Processing Fee:</span>
                                                                <span className="ml-2 text-gray-900">
                                                                    ₱{payment.processingFee?.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {payment.paymentDetails && (
                                                            <div className="col-span-2">
                                                                <span className="text-gray-600">Details:</span>
                                                                <p className="text-gray-900 mt-1">{payment.paymentDetails}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <span className="text-sm text-gray-600">Total Paid:</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                ₱{viewingPayments.po.totalPaid?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Remaining Balance:</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                ₱{viewingPayments.po.remainingBalance?.toFixed(2) || '0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-600">Progress:</span>
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {viewingPayments.po.totalAmount > 0
                                                    ? ((viewingPayments.po.totalPaid / viewingPayments.po.totalAmount) * 100).toFixed(2)
                                                    : '0.00'}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default PurchaseOrderManagement;