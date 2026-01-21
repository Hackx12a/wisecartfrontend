import React, { useState, useMemo } from 'react';
import { Users, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const CompanyTable = ({ companies, searchTerm, onView, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.tin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.branch?.branchName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentCompanies.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  {filteredCompanies.length === 0 ? 'No Companies found' : 'No companies on this page'}
                </td>
              </tr>
            ) : (
              currentCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users size={20} className="text-green-600" />
                      </div>
                      <span className="font-medium text-gray-900">{company.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{company.tin}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{company.city}, {company.province}</div>
                    <div className="text-xs text-gray-500">{company.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {company.branches && company.branches.length > 0 ? (
                      <div>
                        <div className="font-medium">{company.branches.length} Branch(es)</div>
                        <div className="text-xs text-gray-500">
                          {company.branches.slice(0, 2).map(b => b.branchName).join(', ')}
                          {company.branches.length > 2 && '...'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No branches</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(company)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View company details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(company)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit company"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(company.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete company"
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

      {filteredCompanies.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCompanies.length)} of {filteredCompanies.length} results
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

export default CompanyTable;