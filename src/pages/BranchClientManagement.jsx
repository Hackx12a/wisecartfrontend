import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Building2, Users, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Import your API service
// Make sure this path matches your project structure
import { api } from '../services/api';

// Searchable Dropdown Component
const SearchableDropdown = ({ options, value, onChange, placeholder, displayKey, valueKey, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt[valueKey] === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-left flex items-center justify-between bg-white"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption[displayKey] : placeholder}
        </span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-60">
            {!required && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition text-gray-500 italic text-sm"
              >
                -- None --
              </button>
            )}
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option[valueKey]}
                  type="button"
                  onClick={() => {
                    onChange(option[valueKey]);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition text-sm ${
                    value === option[valueKey] ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  {option[displayKey]}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BranchClientManagement = () => {
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' or 'clients'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    // Branch fields
    branchCode: '',
    branchName: '',
    branchAddress: '',
    branchCity: '',
    branchProvince: '',
    area: '',
    region: '',
    // Client fields
    clientName: '',
    tin: '',
    clientAddress: '',
    clientCity: '',
    clientProvince: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchesData, clientsData] = await Promise.all([
        api.get('/branches'),
        api.get('/clients')
      ]);
      setBranches(branchesData);
      setClients(clientsData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.branchCode || !formData.branchName || !formData.branchAddress || 
        !formData.branchCity || !formData.branchProvince || !formData.area || 
        !formData.region || !formData.clientName || !formData.tin || 
        !formData.clientAddress || !formData.clientCity || !formData.clientProvince) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        branchCode: formData.branchCode,
        branchName: formData.branchName,
        branchAddress: formData.branchAddress,
        branchCity: formData.branchCity,
        branchProvince: formData.branchProvince,
        area: formData.area,
        region: formData.region,
        clientName: formData.clientName,
        tin: formData.tin,
        clientAddress: formData.clientAddress,
        clientCity: formData.clientCity,
        clientProvince: formData.clientProvince,
      };

      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}/with-client`, payload);
        toast.success('Branch and Client updated successfully');
      } else {
        await api.post('/branches/with-client', payload);
        toast.success('Branch and Client created successfully');
      }

      setShowModal(false);
      resetForm();
      loadData();
      setCurrentPage(1); // Reset to first page after adding/editing
    } catch (error) {
      toast.error(error.message || 'Failed to save');
      console.error(error);
    }
  };

  const handleEdit = async (branch) => {
    setEditingBranch(branch);
    
    // Fetch client data for this branch
    try {
      const clientData = await api.get(`/clients/by-branch-id/${branch.id}`);
      
      setFormData({
        branchCode: branch.branchCode || '',
        branchName: branch.branchName || '',
        branchAddress: branch.address || '',
        branchCity: branch.city || '',
        branchProvince: branch.province || '',
        area: branch.area || '',
        region: branch.region || '',
        clientName: clientData.clientName || '',
        tin: clientData.tin || '',
        clientAddress: clientData.address || '',
        clientCity: clientData.city || '',
        clientProvince: clientData.province || '',
      });
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load client data');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch and its associated client?')) return;
    
    try {
      await api.delete(`/branches/${id}`);
      toast.success('Branch and Client deleted successfully');
      loadData();
      // If the last item on the current page is deleted, go to previous page
      if (currentItems.length % itemsPerPage === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      branchCode: '',
      branchName: '',
      branchAddress: '',
      branchCity: '',
      branchProvince: '',
      area: '',
      region: '',
      clientName: '',
      tin: '',
      clientAddress: '',
      clientCity: '',
      clientProvince: '',
    });
    setEditingBranch(null);
  };

  const filteredBranches = branches.filter(branch =>
    branch.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.tin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.branch?.branchName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentBranches = filteredBranches.slice(indexOfFirstItem, indexOfLastItem);
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPagesBranches = Math.ceil(filteredBranches.length / itemsPerPage);
  const totalPagesClients = Math.ceil(filteredClients.length / itemsPerPage);
  
  const totalPages = activeTab === 'branches' ? totalPagesBranches : totalPagesClients;
  const currentItems = activeTab === 'branches' ? currentBranches : currentClients;
  const totalItems = activeTab === 'branches' ? filteredBranches.length : filteredClients.length;

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Generate page numbers to display
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

  // Reset to page 1 when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branch & Client Management</h1>
        <p className="text-gray-600 mt-1">Manage branches and their associated clients</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('branches')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'branches'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} />
              Branches ({branches.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'clients'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Clients ({clients.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'branches' ? "Search by code, name, or city..." : "Search by client name, TIN, or branch..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Branch & Client
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'branches' ? (
        // Branches Table
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area/Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
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
                      <td className="px-6 py-4 text-sm text-gray-900">{branch.branchName}</td>
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
                        {clients.find(c => c.branch?.id === branch.id)?.clientName || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(branch)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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

          {/* Pagination for Branches */}
          {filteredBranches.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results count */}
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBranches.length)} of {filteredBranches.length} results
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                {/* Previous button */}
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

                {/* Page numbers */}
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

                {/* Next button */}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPagesBranches}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPagesBranches
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
      ) : (
        // Clients Table
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIN</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {filteredClients.length === 0 ? 'No clients found' : 'No clients on this page'}
                    </td>
                  </tr>
                ) : (
                  currentClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users size={20} className="text-green-600" />
                          </div>
                          <span className="font-medium text-gray-900">{client.clientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{client.tin}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{client.city}, {client.province}</div>
                        <div className="text-xs text-gray-500">{client.address}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {client.branch ? (
                          <div>
                            <div className="font-medium">{client.branch.branchName}</div>
                            <div className="text-xs text-gray-500">{client.branch.branchCode}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => client.branch && handleEdit(client.branch)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            disabled={!client.branch}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => client.branch && handleDelete(client.branch.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            disabled={!client.branch}
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

          {/* Pagination for Clients */}
          {filteredClients.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Results count */}
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClients.length)} of {filteredClients.length} results
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-2">
                {/* Previous button */}
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

                {/* Page numbers */}
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

                {/* Next button */}
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPagesClients}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPagesClients
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBranch ? 'Edit Branch & Client' : 'Add New Branch & Client'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Branch Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={20} />
                  Branch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter branch code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter branch name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchAddress"
                      value={formData.branchAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchCity"
                      value={formData.branchCity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branchProvince"
                      value={formData.branchProvince}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter province"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter area"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter region"
                    />
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tin"
                      value={formData.tin}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter Tax Identification Number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientAddress"
                      value={formData.clientAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter client address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientCity"
                      value={formData.clientCity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="clientProvince"
                      value={formData.clientProvince}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter province"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingBranch ? 'Update Branch & Client' : 'Create Branch & Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchClientManagement;