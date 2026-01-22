import React, { useState, useMemo } from 'react';
import { Bell, X, Trash2, CheckCheck, Download, RefreshCw, AlertTriangle, Info, CheckCircle, Database, Search } from 'lucide-react';

const AlertManagementModal = ({ showNotifications, setShowNotifications, alerts, loadAlerts }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const getFilteredAlerts = useMemo(() => {
    let filtered = [...alerts];
    if (activeTab === 'active') {
      filtered = filtered.filter(alert => !alert.isResolved);
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(alert => alert.isResolved);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert =>
        (alert.title && alert.title.toLowerCase().includes(query)) ||
        (alert.message && alert.message.toLowerCase().includes(query)) ||
        (alert.branch?.branchName && alert.branch.branchName.toLowerCase().includes(query)) ||
        (alert.product?.productName && alert.product.productName.toLowerCase().includes(query))
      );
    }

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.alertType === filterType);
    }

    return filtered;
  }, [alerts, activeTab, searchQuery, filterSeverity, filterType]);

  if (!showNotifications) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 transition-opacity"
        onClick={() => setShowNotifications(false)}
      />
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-6xl h-5/6 bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="text-red-600" size={24} />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Alert Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {alerts.filter(a => !a.isResolved).length} active, {alerts.filter(a => a.isResolved).length} resolved alerts
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === 'active' ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Alerts ({alerts.filter(a => !a.isResolved).length})
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${activeTab === 'resolved' ? 'bg-white border-t border-l border-r border-gray-200 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('resolved')}
          >
            Resolved ({alerts.filter(a => a.isResolved).length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {getFilteredAlerts.map((alert, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{alert.title}</h4>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-bold uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-700">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertManagementModal;