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

  // Format date to shortest possible
  const formatShortDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

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
      {/* Only horizontal scroll - no vertical scroll */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full" style={{ minWidth: '1800px' }}>

          {/* ── HEAD ── */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase w-10">#</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Receipt</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">From</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">To</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Company</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Prepared</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Delivered</th>
              <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase w-12">Items</th>
              <th className="px-2 py-2 text-right text-xs font-bold text-gray-500 uppercase w-16">Prep</th>
              <th className="px-2 py-2 text-right text-xs font-bold text-gray-500 uppercase w-16">Del</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase w-20">Status</th>
              <th className="px-2 py-2 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>

          {/* ── BODY ── */}
          <tbody className="bg-white divide-y divide-gray-100">
            {deliveries.map((delivery, index) => {
              const drTotalPrepared  = delivery.totalPreparedQty  || 0;
              const drTotalDelivered = delivery.totalDeliveredQty || 0;

              const isDelivered = delivery.status === 'DELIVERED';
              const isPending   = delivery.status === 'PENDING';
              const isPreparing = delivery.status === 'PREPARING';

              const canDelete = isPending || isPreparing;
              const canEdit = !isDelivered && delivery.status !== 'CANCELLED' && delivery.status !== 'RETURNED';

              // Calculate the actual row number based on current page
              const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

              return (
                <tr key={delivery.id} className="hover:bg-blue-50/30 transition-colors">

                  {/* Row Number */}
                  <td className="px-2 py-2 text-center text-xs text-gray-500">
                    {rowNumber}
                  </td>

                  {/* Receipt # */}
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-900">{delivery.deliveryReceiptNumber}</div>
                  </td>

                  {/* From Warehouse */}
                  <td className="px-2 py-2">
                    {delivery.warehouses && delivery.warehouses.length > 0 ? (
                      <div className="text-xs text-gray-800">
                        {delivery.warehouses.map((wh, idx) => (
                          <div key={idx} className="truncate max-w-[100px]">
                            {wh.warehouseName}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* To Branch */}
                  <td className="px-2 py-2">
                    <div className="text-xs font-medium text-gray-800 truncate max-w-[100px]">
                      {delivery.branchName}
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-2 py-2">
                    <span className="text-xs text-gray-800 truncate max-w-[100px] block">
                      {delivery.companyName}
                    </span>
                  </td>

                  {/* Date Prepared */}
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                    {formatShortDate(delivery.datePrepared)}
                  </td>

                  {/* Date Delivered */}
                  <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                    {formatShortDate(delivery.dateDelivered)}
                  </td>

                  {/* Item Count */}
                  <td className="px-2 py-2 text-center text-xs font-bold text-gray-800">
                    {delivery.itemCount}
                  </td>

                  {/* Prepared Qty */}
                  <td className="px-2 py-2 text-right text-xs font-bold text-blue-700">
                    {drTotalPrepared > 0 ? drTotalPrepared : '—'}
                  </td>

                  {/* Delivered Qty */}
                  <td className="px-2 py-2 text-right text-xs font-bold text-green-700">
                    {isDelivered && drTotalDelivered > 0 ? drTotalDelivered : '—'}
                  </td>

                  {/* Status */}
                  <td className="px-2 py-2">
                    <span className={`px-1.5 py-0.5 inline-flex text-[10px] font-bold rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status === 'DELIVERED' ? 'DEL' : 
                       delivery.status === 'PENDING' ? 'PEND' :
                       delivery.status === 'PREPARING' ? 'PREP' :
                       delivery.status === 'CANCELLED' ? 'CNCL' :
                       delivery.status === 'RETURNED' ? 'RET' :
                       delivery.status === 'IN_TRANSIT' ? 'TRANS' : 
                       delivery.status.substring(0, 4)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-0.5">
                      {/* View */}
                      <button
                        onClick={() => onView(delivery)}
                        title="View"
                        className="p-1 rounded text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(delivery)}
                          title="Edit"
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(delivery.id)}
                          title="Delete"
                          className="p-1 rounded text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* Cancel */}
                      {isDelivered && (
                        <button
                          onClick={() => onCancel(delivery)}
                          title="Cancel"
                          className="p-1 rounded text-orange-600 hover:bg-orange-100"
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      {/* Print */}
                      <button
                        onClick={() => onPrint(delivery)}
                        title="Print"
                        className="p-1 rounded text-green-600 hover:bg-green-100"
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
            <tr className="bg-gray-100 border-t border-gray-300">
              <td colSpan={7} className="px-2 py-2 text-right">
                <span className="text-[10px] font-bold text-gray-500">Total ({deliveries.length})</span>
              </td>
              <td className="px-2 py-2 text-center text-xs font-bold text-gray-800">
                {grandTotalItems}
              </td>
              <td className="px-2 py-2 text-right text-xs font-bold text-blue-800">
                {grandTotalPrepared}
              </td>
              <td className="px-2 py-2 text-right text-xs font-bold text-green-800">
                {grandTotalDelivered}
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