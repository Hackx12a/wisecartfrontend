// src/components/modals/DeliveryViewModal.jsx
import React from 'react';
import { X, Printer, Edit2, Package, Truck, Check } from 'lucide-react';

const DeliveryViewModal = ({
  delivery,
  onClose,
  onEdit,
  onPrint,
  isLoading = false
}) => {
  const getStatusColor = (status) => {
    const colors = {
      PREPARING: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      CUSTOM: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading || !delivery) {
    return (
      <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading delivery details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Receipt #</label>
                <p className="text-lg font-semibold text-gray-900">{delivery.deliveryReceiptNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(delivery.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Prepared and Delivered Dates */}
            {(delivery.datePrepared || delivery.dateDelivered) && (
              <div className="grid grid-cols-2 gap-6">
                {delivery.datePrepared && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Prepared</label>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(delivery.datePrepared).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {delivery.dateDelivered && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date Delivered</label>
                    <p className="text-base font-semibold text-green-700">
                      {new Date(delivery.dateDelivered).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Branch and Company Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Delivered To (Branch)</label>
                  <p className="text-base font-semibold text-blue-900">{delivery.branch?.branchName}</p>
                  <p className="text-sm text-blue-700">Code: {delivery.branch?.branchCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">Company</label>
                  <p className="text-base font-semibold text-blue-900">{delivery.company?.companyName}</p>
                  <p className="text-sm text-blue-700">TIN: {delivery.company?.tin || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-blue-700 mb-1">Delivery Address</label>
                <p className="text-sm text-blue-800">
                  {delivery.branch?.address &&
                    `${delivery.branch.address}, ${delivery.branch.city || ''}, ${delivery.branch.province || ''}`.trim()}
                  {!delivery.branch?.address && 'No address specified'}
                </p>
              </div>
              {delivery.branch?.contactNumber && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">Contact Number</label>
                  <p className="text-sm text-blue-800">{delivery.branch.contactNumber}</p>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Delivery Prepared By</label>
                  <p className="text-base font-semibold text-green-900">{delivery.preparedBy || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Transmittal</label>
                  <p className="text-base text-green-900">{delivery.transmittal || 'Not specified'}</p>
                </div>
              </div>
              {delivery.remarks && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-green-700 mb-1">Delivery Remarks</label>
                  <p className="text-sm text-green-800 p-2 bg-white rounded">{delivery.remarks}</p>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-6">
              {delivery.purchaseOrderNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Order #</label>
                  <p className="text-base text-gray-900">{delivery.purchaseOrderNumber}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                  {delivery.customStatus || delivery.status}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Delivery Items ({delivery.items?.length || 0} items)
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU & UPC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prepared</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {delivery.items && delivery.items.length > 0 ? (
                      delivery.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.product?.productName || 'Unknown Product'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="font-medium">SKU:</span> {item.product?.sku || 'N/A'}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">UPC:</span> {item.product?.upc || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Package size={14} className="text-blue-500 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-gray-900">{item.warehouse?.warehouseName || 'N/A'}</div>
                                {item.warehouse?.warehouseCode && (
                                  <div className="text-xs text-gray-500">Code: {item.warehouse.warehouseCode}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-blue-700">
                            {item.preparedQty || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-700">
                            {item.deliveredQty || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.uom || 'pcs'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-gray-500 italic">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Completion Info */}
            {delivery.status === 'DELIVERED' && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="text-green-600" size={20} />
                  <h3 className="text-sm font-medium text-green-800">Delivery Completed</h3>
                </div>
                <p className="text-sm text-green-700">
                  This delivery has been marked as delivered. All items have been successfully transferred to the branch.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => onPrint(delivery)}
              className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md"
            >
              <Printer size={20} />
              <span>Print Receipt</span>
            </button>
            {delivery.status !== 'DELIVERED' && (
              <button
                onClick={() => onEdit(delivery)}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
              >
                <Edit2 size={20} />
                <span>Edit Delivery</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryViewModal;