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
      {/* Remove overflow-x-auto and min-width */}
      <div className="w-full">
        <table className="w-full table-auto">
          
          {/* ── HEAD ── */}
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt #</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">From</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prepared</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Delivered</th>
              <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-2 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Prep Qty</th>
              <th className="px-2 py-2 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Del Qty</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
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
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-900">{delivery.deliveryReceiptNumber}</div>
                    {delivery.preparedBy && (
                      <div className="text-[10px] text-gray-400">By: {delivery.preparedBy}</div>
                    )}
                  </td>

                  {/* From Warehouse */}
                  <td className="px-2 py-2">
                    {delivery.warehouses && delivery.warehouses.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <Package size={11} className="text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-800 truncate max-w-[80px]">
                          {delivery.warehouses[0].warehouseName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">—</span>
                    )}
                  </td>

                  {/* To Branch */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <Truck size={11} className="text-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">
                        {delivery.branchName}
                      </span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-2 py-2">
                    <span className="text-xs font-medium text-gray-800 truncate max-w-[80px] block">
                      {delivery.companyName}
                    </span>
                  </td>

                  {/* Date Prepared */}
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                    {delivery.datePrepared
                      ? new Date(delivery.datePrepared).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Date Delivered */}
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                    {delivery.dateDelivered
                      ? new Date(delivery.dateDelivered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Item Count */}
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1">
                      <Package size={12} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-800">{delivery.itemCount}</span>
                    </span>
                  </td>

                  {/* Prepared Qty */}
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    {drTotalPrepared > 0 ? (
                      <span className="text-xs font-bold text-blue-700">
                        {drTotalPrepared}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Delivered Qty */}
                  <td className="px-2 py-2 whitespace-nowrap text-right">
                    {isDelivered && drTotalDelivered > 0 ? (
                      <span className="text-xs font-bold text-green-700">
                        {drTotalDelivered}
                      </span>
                    ) : !isDelivered ? (
                      <span className="text-[10px] italic text-gray-400">—</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.customStatus || delivery.status}
                    </span>
                  </td>

                  {/* ── Actions ── */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-0.5">
                      {/* View */}
                      <button
                        onClick={() => onView(delivery)}
                        title="View details"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(delivery)}
                          title="Edit delivery"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(delivery.id)}
                          title="Delete delivery"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* Cancel */}
                      {isDelivered && (
                        <button
                          onClick={() => onCancel(delivery)}
                          title="Cancel delivery"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-orange-600 hover:bg-orange-100 transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      {/* Print */}
                      <button
                        onClick={() => onPrint(delivery)}
                        title="Print receipt"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                      >
                        <Printer size={14} />
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
              <td colSpan={6} className="px-2 py-2 text-right">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Page Totals ({deliveries.length})
                </span>
              </td>
              <td className="px-2 py-2 text-center">
                <span className="text-xs font-bold text-gray-800">{grandTotalItems}</span>
              </td>
              <td className="px-2 py-2 text-right">
                <span className="text-xs font-bold text-blue-800">{grandTotalPrepared}</span>
              </td>
              <td className="px-2 py-2 text-right">
                <span className="text-xs font-bold text-green-800">{grandTotalDelivered}</span>
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