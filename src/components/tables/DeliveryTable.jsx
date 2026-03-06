// src/components/tables/DeliveryTable.jsx
import React from 'react';
import { Eye, Edit2, Trash2, Printer, Package, Truck } from 'lucide-react';
import Pagination from '../common/Pagination';

const DeliveryTable = ({
  deliveries = [],
  onView,
  onEdit,
  onDelete,
  onPrint,
  onPageChange,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  isLoading = false
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getStatusColor = (status) => {
    const colors = {
      PREPARING: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };


  const grandTotalPrepared = deliveries.reduce((sum, d) => sum + (d.totalPreparedQty || 0), 0);
  const grandTotalDelivered = deliveries.reduce((sum, d) => sum + (d.totalDeliveredQty || 0), 0);
  const grandTotalItems = deliveries.reduce((sum, d) => sum + (d.itemCount || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-500">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-12 text-center text-gray-500">No deliveries found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From (Warehouse)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To (Branch)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Prepared</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Delivered</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              {/* ── NEW: Prepared / Delivered qty columns ── */}
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prepared Qty</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered Qty</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {deliveries.map((delivery) => {
              // ── Per-DR totals: read pre-summed fields from the list response ──
              // delivery.items is empty in list view; quantities come from the backend directly.
              const drTotalPrepared = delivery.totalPreparedQty || 0;
              const drTotalDelivered = delivery.totalDeliveredQty || 0;

              return (
                <tr key={delivery.id} className="hover:bg-gray-50 transition">
                  {/* Receipt # */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{delivery.deliveryReceiptNumber}</div>
                    {delivery.preparedBy && (
                      <div className="text-sm text-gray-500">By: {delivery.preparedBy}</div>
                    )}
                  </td>

                  {/* From Warehouse */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {delivery.warehouses && delivery.warehouses.length > 0 ? (
                      <div className="space-y-1">
                        {delivery.warehouses.map((warehouse, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Package size={14} className="text-blue-500 flex-shrink-0" />
                            <div className="font-medium">{warehouse.warehouseName}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No warehouse</span>
                    )}
                  </td>

                  {/* To Branch */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Truck size={14} className="text-green-500 flex-shrink-0" />
                      <span className="font-medium text-[11px]">{delivery.branchName}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.companyName}
                  </td>

                  {/* Date Prepared */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.datePrepared
                      ? new Date(delivery.datePrepared).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Not prepared'}
                  </td>

                  {/* Date Delivered */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {delivery.dateDelivered
                      ? new Date(delivery.dateDelivered).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Not delivered'}
                  </td>

                  {/* Item count */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{delivery.itemCount}</span>
                    </div>
                  </td>

                  {/* ── Prepared Qty total for this DR ── */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {drTotalPrepared > 0 ? (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-sm font-bold text-blue-700">{drTotalPrepared}</span>
                        <span className="text-xs text-blue-500">pcs</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* ── Delivered Qty total for this DR ── */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {delivery.status === 'DELIVERED' && drTotalDelivered > 0 ? (
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-sm font-bold text-green-700">{drTotalDelivered}</span>
                        <span className="text-xs text-green-500">pcs</span>
                      </div>
                    ) : delivery.status !== 'DELIVERED' ? (
                      <span className="text-xs text-gray-400 italic">Pending</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(delivery.status)} w-fit`}>
                        {delivery.customStatus || delivery.status}
                      </span>
                      {delivery.status === 'DELIVERED' && delivery.dateDelivered && (
                        <div className="flex items-center gap-1 text-xs text-green-700">
                          <span className="font-medium">Delivered:</span>
                          <span>
                            {new Date(delivery.dateDelivered).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-gray-500">
                            {new Date(delivery.dateDelivered).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onView(delivery)} className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition" title="View">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => onEdit(delivery)} className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDelete(delivery.id)} className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition" title="Delete">
                        <Trash2 size={18} />
                      </button>
                      <button onClick={() => onPrint(delivery)} className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition" title="Print Receipt">
                        <Printer size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Grand totals footer row ─────────────────────────────────────── */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-300">
              {/* Label spans first 6 cols */}
              <td colSpan={6} className="px-6 py-3 text-right">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Page Totals ({deliveries.length} DR{deliveries.length !== 1 ? 's' : ''})
                </span>
              </td>

              {/* Total items */}
              <td className="px-6 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Package size={14} className="text-gray-500" />
                  <span className="text-sm font-bold text-gray-800">{grandTotalItems}</span>
                </div>
              </td>

              {/* Total prepared qty */}
              <td className="px-6 py-3 text-right whitespace-nowrap">
                <div className="inline-flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-blue-800">{grandTotalPrepared}</span>
                    <span className="text-xs text-blue-600">pcs</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">prepared</span>
                </div>
              </td>

              {/* Total delivered qty */}
              <td className="px-6 py-3 text-right whitespace-nowrap">
                <div className="inline-flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-green-800">{grandTotalDelivered}</span>
                    <span className="text-xs text-green-600">pcs</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">delivered</span>
                </div>
              </td>

              {/* Empty status + actions cols */}
              <td colSpan={2} className="px-6 py-3" />
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