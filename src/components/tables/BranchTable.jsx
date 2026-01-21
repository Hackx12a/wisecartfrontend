import React, { useState, useMemo } from 'react';
import { Building2, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const BranchTable = ({ branches, searchTerm, onView, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredBranches = useMemo(() => {
    return branches.filter(branch =>
      branch.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBranches = filteredBranches.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area/Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentBranches.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  {filteredBranches.length === 0 ? 'No branches found' : 'No branches on this page'}
                </td>
              </tr>
            ) : (
              currentBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 size={20} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{branch.branchCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {branch.branchName}
                    <div className="text-xs text-gray-500">Branch TIN: {branch.tin}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{branch.city}, {branch.province}</div>
                    <div className="text-xs text-gray-500">{branch.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {branch.area && <div>Area: {branch.area}</div>}
                    {branch.region && <div>Region: {branch.region}</div>}
                    {!branch.area && !branch.region && '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {branch.company ? (
                      <div>
                        <div className="font-medium">{branch.company.companyName}</div>
                        {branch.company.tin && (
                          <div className="text-xs text-gray-500">Company TIN: {branch.company.tin}</div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(branch)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(branch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit branch"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(branch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete branch"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filteredBranches.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBranches.length)} of {filteredBranches.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed border-gray-200'
                  : 'text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`min-w-[40px] px-3 py-2 text-sm rounded-lg border ${
                    currentPage === number
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${
                currentPage === totalPages
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

export default BranchTable;