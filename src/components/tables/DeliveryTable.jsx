// src/components/tables/DeliveryTable.jsx
import React from 'react';
import { Eye, Edit2, Trash2, Printer, Package, Truck, XCircle, Calendar, Building2, MapPin } from 'lucide-react';
import Pagination from '../common/Pagination';

const DeliveryTable = ({
  deliveries = [],
  onView,
  onEdit,
  onDelete,
  onCancel,
  onPrint,
  onPageChange,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  isLoading = false
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem  = Math.min(currentPage * itemsPerPage, totalItems);

  const getStatusColor = (status) => {
    const colors = {
      PENDING:    'bg-gray-100 text-gray-700 border-l-4 border-gray-400',
      PREPARING:  'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400',
      IN_TRANSIT: 'bg-purple-50 text-purple-800 border-l-4 border-purple-400',
      DELIVERED:  'bg-green-50 text-green-800 border-l-4 border-green-400',
      CANCELLED:  'bg-red-50 text-red-800 border-l-4 border-red-400',
      RETURNED:   'bg-orange-50 text-orange-800 border-l-4 border-orange-400',
    };
    return colors[status] || 'bg-gray-50 text-gray-800 border-l-4 border-gray-400';
  };

  const grandTotalPrepared  = deliveries.reduce((s, d) => s + (d.totalPreparedQty  || 0), 0);
  const grandTotalDelivered = deliveries.reduce((s, d) => s + (d.totalDeliveredQty || 0), 0);
  const grandTotalItems     = deliveries.reduce((s, d) => s + (d.itemCount         || 0), 0);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-gray-500 font-medium">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-20 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No deliveries found</p>
          <p className="text-gray-400 text-sm mt-2">Create a new delivery to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1800px' }}>
          
          {/* ── HEAD ── */}
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Receipt #</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From (Warehouse)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To (Branch)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Prepared</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Delivered</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Prepared Qty</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivered Qty</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          {/* ── BODY ── */}
          <tbody className="bg-white divide-y divide-gray-200">
            {deliveries.map((delivery, index) => {
              const drTotalPrepared  = delivery.totalPreparedQty  || 0;
              const drTotalDelivered = delivery.totalDeliveredQty || 0;

              const isDelivered = delivery.status === 'DELIVERED';
              const isPending   = delivery.status === 'PENDING';
              const isPreparing = delivery.status === 'PREPARING';
              const isCancelled = delivery.status === 'CANCELLED';
              const isReturned  = delivery.status === 'RETURNED';

              const canDelete = isPending || isPreparing;
              const canEdit   = !isDelivered && !isCancelled && !isReturned;

              return (
                <tr 
                  key={delivery.id} 
                  className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  {/* Receipt # */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono font-bold text-gray-900">{delivery.deliveryReceiptNumber}</span>
                      {delivery.preparedBy && (
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {delivery.preparedBy}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* From Warehouse */}
                  <td className="px-6 py-4">
                    {delivery.warehouses && delivery.warehouses.length > 0 ? (
                      <div className="space-y-2">
                        {delivery.warehouses.map((wh, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Building2 size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-800">{wh.warehouseName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">—</span>
                    )}
                  </td>

                  {/* To Branch */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-800">{delivery.branchName}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-800 font-medium">{delivery.companyName}</span>
                  </td>

                  {/* Date Prepared */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">
                        {formatDate(delivery.datePrepared)}
                      </span>
                    </div>
                  </td>

                  {/* Date Delivered */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">
                        {formatDate(delivery.dateDelivered)}
                      </span>
                    </div>
                  </td>

                  {/* Item Count */}
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                      <Package size={14} className="text-gray-500" />
                      <span className="text-sm font-bold text-gray-800">{delivery.itemCount}</span>
                    </div>
                  </td>

                  {/* Prepared Qty */}
                  <td className="px-6 py-4 text-right">
                    {drTotalPrepared > 0 ? (
                      <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                        {drTotalPrepared.toLocaleString()}
                        <span className="text-xs font-normal text-blue-500 ml-1">pcs</span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </td>

                  {/* Delivered Qty */}
                  <td className="px-6 py-4 text-right">
                    {isDelivered && drTotalDelivered > 0 ? (
                      <span className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                        {drTotalDelivered.toLocaleString()}
                        <span className="text-xs font-normal text-green-500 ml-1">pcs</span>
                      </span>
                    ) : !isDelivered ? (
                      <span className="text-sm italic text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                        Pending
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-bold rounded-r-lg ${getStatusColor(delivery.status)}`}>
                        {delivery.customStatus || delivery.status}
                      </span>
                      {isDelivered && delivery.dateDelivered && (
                        <span className="text-xs text-gray-500 ml-1">
                          {new Date(delivery.dateDelivered).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* View */}
                      <button
                        onClick={() => onView(delivery)}
                        title="View details"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-blue-600 hover:bg-blue-100 transition-all hover:scale-110"
                      >
                        <Eye size={20} />
                      </button>

                      {/* Edit */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(delivery)}
                          title="Edit delivery"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-all hover:scale-110"
                        >
                          <Edit2 size={20} />
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(delivery.id)}
                          title="Delete delivery"
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-600 hover:bg-red-100 transition-all hover:scale-110"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}

                      {/* Cancel */}
                      {isDelivered && (
                        <button
                          onClick={() => onCancel(delivery)}
                          title="Cancel delivery"
                          className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg text-orange-600 hover:bg-orange-100 transition-all hover:scale-105 font-medium text-sm"
                        >
                          <XCircle size={20} />
                          Cancel
                        </button>
                      )}

                      {/* Print */}
                      <button
                        onClick={() => onPrint(delivery)}
                        title="Print receipt"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-green-600 hover:bg-green-100 transition-all hover:scale-110"
                      >
                        <Printer size={20} />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* ── FOOTER totals ── */}
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
              <td colSpan={6} className="px-6 py-4 text-right">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Page Total — {deliveries.length} Delivery Record{deliveries.length !== 1 ? 's' : ''}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <Package size={14} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-800">{grandTotalItems}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-bold text-blue-800 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  {grandTotalPrepared.toLocaleString()}
                  <span className="text-xs text-blue-500 ml-1">pcs</span>
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-bold text-green-800 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  {grandTotalDelivered.toLocaleString()}
                  <span className="text-xs text-green-500 ml-1">pcs</span>
                </span>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>

        </table>
      </div>

      {totalItems > 0 && (
        <div className="border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onNextPage={() => onPageChange(currentPage + 1)}
            onPrevPage={() => onPageChange(currentPage - 1)}
            showingStart={indexOfFirstItem}
            showingEnd={indexOfLastItem}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
};

export default DeliveryTable;