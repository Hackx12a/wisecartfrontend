import React from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTransactionDisplayInfo } from '../../../utils/transactionHelpers';

const TransactionTable = ({ 
  currentInventories, 
  filteredInventories, 
  indexOfFirstItem, 
  indexOfLastItem,
  currentPage,
  totalPages,
  setCurrentPage,
  viewingId,
  deletingId,
  handleViewTransaction,
  calculateTotalQuantity 
}) => {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">All Transactions</h2>
        <p className="text-sm text-gray-600 mt-1">Showing inventory, transfer in/out, delivery, and sales records</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From → To</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentInventories.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  {filteredInventories.length === 0 ? 'No transactions found' : 'No transactions on this page'}
                </td>
              </tr>
            ) : (
              currentInventories.map((transaction) => {
                const displayInfo = getTransactionDisplayInfo(transaction);
                const transactionDate = new Date(transaction.verificationDate || transaction.createdAt);

                return (
                  <tr key={`transaction-${transaction.id}-${transaction.inventoryType}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${displayInfo.typeColor}`}>
                          {displayInfo.typeLabel}
                        </span>
                        {transaction.isDeleted && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300 shadow-sm">
                            🗑️ DELETED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[250px]">
                        <div className="text-gray-900">
                          {transaction.inventoryType === 'DELIVERY' ?
                            `${transaction.fromWarehouse?.warehouseName || 'Warehouse'} → ${transaction.toBranch?.branchName || 'Branch'}` :
                            transaction.inventoryType === 'SALE' ?
                              `${transaction.fromBranch?.branchName || 'Branch'} → Sale` :
                              transaction.inventoryType === 'STOCK_IN' ?
                                `Stock In → ${transaction.toWarehouse?.warehouseName || transaction.toBranch?.branchName || '-'}` :
                                transaction.inventoryType === 'DAMAGE' ?
                                  `${transaction.toWarehouse?.warehouseName || transaction.toBranch?.branchName || '-'} (Damage)` :
                                  `${(transaction.fromWarehouse?.warehouseName || transaction.fromBranch?.branchName || '-')} → ${(transaction.toWarehouse?.warehouseName || transaction.toBranch?.branchName || '-')}`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-sm">{transaction.items?.length || 0}</td>
                    <td className="px-3 py-3 text-center text-sm font-medium text-blue-600">
                      {calculateTotalQuantity(transaction.items).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        if (!transactionDate || isNaN(transactionDate.getTime())) {
                          return (
                            <>
                              <div>N/A</div>
                              <div className="text-xs text-gray-500">--:--</div>
                            </>
                          );
                        }
                        return (
                          <>
                            <div>
                              {transactionDate.toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transactionDate.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewTransaction(transaction)}
                        disabled={viewingId === transaction.id || deletingId === transaction.id}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition ${viewingId === transaction.id || deletingId === transaction.id
                          ? 'bg-gray-300 text-gray-500 cursor-wait'
                          : 'text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        {viewingId === transaction.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            View Details
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredInventories.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInventories.length)} of {filteredInventories.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${currentPage === 1
                ? 'text-gray-400 cursor-not-allowed border-gray-200'
                : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(num =>
                  num === 1 ||
                  num === totalPages ||
                  (num >= currentPage - 1 && num <= currentPage + 1)
                )
                .map((number, index, array) => {
                  const showEllipsis = index < array.length - 1 && array[index + 1] !== number + 1;
                  return (
                    <React.Fragment key={number}>
                      <button
                        onClick={() => setCurrentPage(number)}
                        className={`min-w-[36px] px-2 py-1 text-sm rounded-lg border ${currentPage === number
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                          }`}
                      >
                        {number}
                      </button>
                      {showEllipsis && (
                        <span className="px-1 text-gray-500">...</span>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed border-gray-200'
                : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;