// src/components/tables/DeliveryTable.jsx
import React from 'react';
import { Eye, Edit2, Trash2, Printer, Package, Truck, XCircle } from 'lucide-react';
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
      PENDING:    'bg-gray-100 text-gray-700',
      PREPARING:  'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED:  'bg-green-100 text-green-800',
      CANCELLED:  'bg-red-100 text-red-800',
      RETURNED:   'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const grandTotalPrepared  = deliveries.reduce((s, d) => s + (d.totalPreparedQty  || 0), 0);
  const grandTotalDelivered = deliveries.reduce((s, d) => s + (d.totalDeliveredQty || 0), 0);
  const grandTotalItems     = deliveries.reduce((s, d) => s + (d.itemCount         || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="mt-3 text-gray-500">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-16 text-center text-gray-500">No deliveries found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1400px' }}>
          
          {/* ── HEAD ── */}
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Receipt #</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">From (Warehouse)</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">To (Branch)</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Date Prepared</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Date Delivered</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">Prepared Qty</th>
              <th className="px-4 py-3 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">Delivered Qty</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          {/* ── BODY ── */}
          <tbody className="bg-white divide-y divide-gray-100">
            {deliveries.map((delivery) => {
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
                <tr key={delivery.id} className="hover:bg-blue-50/30 transition-colors">

                  {/* Receipt # */}
                  <td className="px-4 py-3 align-top">
                    <div className="text-sm font-bold text-gray-900">{delivery.deliveryReceiptNumber}</div>
                    {delivery.preparedBy && (
                      <div className="text-xs text-gray-500 mt-1">By: {delivery.preparedBy}</div>
                    )}
                  </td>

                  {/* From Warehouse */}
                  <td className="px-4 py-3 align-top">
                    {delivery.warehouses && delivery.warehouses.length > 0 ? (
                      <div className="space-y-2">
                        {delivery.warehouses.map((wh, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Package size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-800">{wh.warehouseName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No warehouse</span>
                    )}
                  </td>

                  {/* To Branch */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-start gap-2">
                      <Truck size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-gray-800">{delivery.branchName}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-3 align-top">
                    <span className="text-sm text-gray-800">{delivery.companyName}</span>
                  </td>

                  {/* Date Prepared */}
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {delivery.datePrepared
                        ? new Date(delivery.datePrepared).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : '—'}
                    </span>
                  </td>

                  {/* Date Delivered */}
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {delivery.dateDelivered
                        ? new Date(delivery.dateDelivered).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : '—'}
                    </span>
                  </td>

                  {/* Item Count */}
                  <td className="px-4 py-3 align-top text-center">
                    <span className="inline-flex items-center gap-1">
                      <Package size={14} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-800">{delivery.itemCount}</span>
                    </span>
                  </td>

                  {/* Prepared Qty */}
                  <td className="px-4 py-3 align-top text-right">
                    {drTotalPrepared > 0 ? (
                      <span className="text-sm font-bold text-blue-700">
                        {drTotalPrepared}
                        <span className="text-xs font-normal text-blue-500 ml-1">pcs</span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </td>

                  {/* Delivered Qty */}
                  <td className="px-4 py-3 align-top text-right">
                    {isDelivered && drTotalDelivered > 0 ? (
                      <span className="text-sm font-bold text-green-700">
                        {drTotalDelivered}
                        <span className="text-xs font-normal text-green-500 ml-1">pcs</span>
                      </span>
                    ) : !isDelivered ? (
                      <span className="text-sm italic text-gray-400">Pending</span>
                    ) : (
                      <span className="text-sm text-gray-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 align-top">
                    <div>
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${getStatusColor(delivery.status)}`}>
                        {delivery.customStatus || delivery.status}
                      </span>
                      {isDelivered && delivery.dateDelivered && (
                        <div className="text-xs text-green-600 mt-1.5 font-medium">
                          {new Date(delivery.dateDelivered).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* View */}
                      <button
                        onClick={() => onView(delivery)}
                        title="View details"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Edit */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(delivery)}
                          title="Edit delivery"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(delivery.id)}
                          title="Delete delivery"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      {/* Cancel */}
                      {isDelivered && (
                        <button
                          onClick={() => onCancel(delivery)}
                          title="Cancel delivery"
                          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-orange-600 hover:bg-orange-100 transition-colors font-medium text-sm"
                        >
                          <XCircle size={18} />
                          Cancel
                        </button>
                      )}

                      {/* Print */}
                      <button
                        onClick={() => onPrint(delivery)}
                        title="Print receipt"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                      >
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

          {/* ── FOOTER totals ── */}
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td colSpan={6} className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-gray-500">
                  Page Totals — {deliveries.length} DR{deliveries.length !== 1 ? 's' : ''}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center gap-1">
                  <Package size={14} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-800">{grandTotalItems}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-blue-800">{grandTotalPrepared}</span>
                <span className="text-xs text-blue-500 ml-1">pcs</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-green-800">{grandTotalDelivered}</span>
                <span className="text-xs text-green-500 ml-1">pcs</span>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>

        </table>
      </div>

      {totalItems > 0 && (
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
      )}
    </div>
  );
};

export default DeliveryTable;