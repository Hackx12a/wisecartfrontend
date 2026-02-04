import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import RPQTableRow from './components/RPQTableRow';
import RPQModal from './components/RPQModal';
import RPQViewModal from './components/RPQViewModal';

const ProductQuotationManagement = ({ rpqRequests: initialRequests, onRefresh }) => {
    const [rpqRequests, setRpqRequests] = useState(initialRequests || []);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchRpq, setSearchRpq] = useState('');
    const [showRpqModal, setShowRpqModal] = useState(false);
    const [viewingRpq, setViewingRpq] = useState(null);
    const [editingRpq, setEditingRpq] = useState(null);
    const [buttonLoading, setButtonLoading] = useState({});
    const [expandedRpqRows, setExpandedRpqRows] = useState({});

    useEffect(() => {
        setRpqRequests(initialRequests || []);
    }, [initialRequests]);

    const toggleRpqRow = (rpqId) => {
        setExpandedRpqRows(prev => ({
            ...prev,
            [rpqId]: !prev[rpqId]
        }));
    };

    const handleDeleteRpq = async (id) => {
        if (!window.confirm(
            'Are you sure you want to delete this quotation request?\n\n⚠️ Warning: This will also delete the associated Inventory Request.'
        )) return;

        const loadKey = `delete-rpq-${id}`;
        setButtonLoading(prev => ({ ...prev, [loadKey]: true }));
        setActionLoading(true);

        try {
            const response = await api.delete(`/quotation-requests/${id}`);
            if (response.success) {
                toast.success('✅ Quotation and inventory request deleted successfully');
                setRpqRequests(prev => prev.filter(req => req.id !== id));
                await onRefresh();
                window.dispatchEvent(new CustomEvent('rpqDeleted'));
            }
        } catch (error) {
            toast.error('Failed to delete quotation request');
        } finally {
            setButtonLoading(prev => ({ ...prev, [loadKey]: false }));
            setActionLoading(false);
        }
    };




    const setButtonLoadingState = (key, value) => {
        setButtonLoading(prev => ({ ...prev, [key]: value }));
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '-';
        return parseInt(num).toLocaleString('en-US');
    };

    const filteredRpqRequests = rpqRequests.filter(req =>
        req.controlNumber?.toLowerCase().includes(searchRpq.toLowerCase()) ||
        req.productName?.toLowerCase().includes(searchRpq.toLowerCase())
    );

    return (
        <div>
            <Toaster position="top-right" />
            <LoadingOverlay show={actionLoading} message="Processing..." />

            {/* Search */}
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
                                    <RPQTableRow
                                        key={req.id}
                                        req={req}
                                        handleDeleteRpq={handleDeleteRpq}
                                        setViewingRpq={setViewingRpq}
                                        setEditingRpq={setEditingRpq}
                                        setShowRpqModal={setShowRpqModal}
                                        expandedRpqRows={expandedRpqRows}
                                        toggleRpqRow={toggleRpqRow}
                                        buttonLoading={buttonLoading}
                                        formatNumber={formatNumber}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showRpqModal && (
                <RPQModal
                    editingRpq={editingRpq}
                    onClose={() => {
                        setShowRpqModal(false);
                        setEditingRpq(null);
                    }}
                    onSuccess={() => {
                        setShowRpqModal(false);
                        setEditingRpq(null);
                        onRefresh();
                    }}
                />
            )}

            {viewingRpq && (
                <RPQViewModal
                    rpq={viewingRpq}
                    onClose={() => setViewingRpq(null)}
                    onRefresh={onRefresh}
                    formatNumber={formatNumber}
                />
            )}
        </div>
    );
};

export default ProductQuotationManagement;