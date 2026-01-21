import React, { useState } from 'react';
import { Bell, X, RefreshCw, Download, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';
import AlertItem from './AlertItem';

const AlertManagementModal = ({ alerts, loadAlerts, onClose }) => {
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const tabAlerts = activeTab === 'active'
    ? alerts.filter(alert => !alert.isResolved)
    : alerts.filter(alert => alert.isResolved);

  const handleDownloadAndClear = async () => {
    try {
      const response = await api.get('/alerts/export');
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resolved-alerts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        const deleteResponse = await api.delete('/alerts/resolved');
        if (deleteResponse.success) {
          await loadAlerts();
          const deletedCount = deleteResponse.data || 0;
          toast.success(`Downloaded and cleared ${deletedCount} resolved alerts`);
        }
      }
    } catch (err) {
      console.error('Failed to process resolved alerts', err);
      toast.error('Failed to process resolved alerts: ' + err.message);
    }
  };

  const handleResolveAll = async () => {
    if (window.confirm(`Resolve all ${alerts.filter(a => !a.isResolved).length} active alerts?`)) {
      try {
        const activeAlerts = alerts.filter(alert => !alert.isResolved);
        for (const alert of activeAlerts) {
          await api.put(`/alerts/${alert.id}/resolve`, {
            resolvedBy: 'admin',
            notes: 'Resolved all via dashboard'
          });
        }
        await loadAlerts();
        toast.success(`Resolved ${activeAlerts.length} alerts`);
      } catch (err) {
        console.error('Failed to resolve alerts', err);
        toast.error('Failed to resolve alerts: ' + err.message);
      }
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-6xl h-5/6 bg-white rounded-2xl shadow-2xl z-50 border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="text-red-600" size={24} />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Alert Management</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {alerts.length === 0
                    ? 'No alerts at the moment'
                    : `${alerts.filter(a => !a.isResolved).length} active, ${alerts.filter(a => a.isResolved).length} resolved alerts`}
                </p>
              </div>
              {alerts.filter(a => !a.isResolved).length > 0 && (
                <span className="bg-red-600 text-white text-sm font-semibold rounded-full px-3 py-1">
                  {alerts.filter(a => !a.isResolved).length} active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadAndClear}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                Download & Clear Resolved
              </button>
              {alerts.filter(a => !a.isResolved).length > 0 && (
                <button
                  onClick={handleResolveAll}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck size={18} />
                  Resolve All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
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
          {tabAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              {activeTab === 'active' ? (
                <>
                  <CheckCircle className="text-green-500 mb-4" size={80} />
                  <p className="text-2xl font-semibold text-gray-700">No Active Alerts</p>
                  <p className="text-gray-500 text-lg mt-2">All alerts have been addressed</p>
                </>
              ) : (
                <>
                  <Database className="text-blue-500 mb-4" size={80} />
                  <p className="text-2xl font-semibold text-gray-700">No Resolved Alerts</p>
                  <p className="text-gray-500 text-lg mt-2">No alerts have been resolved yet</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {tabAlerts.length} {activeTab === 'active' ? 'active' : 'resolved'} alerts
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {tabAlerts.map((alert, index) => (
                  <AlertItem
                    key={alert.id || index}
                    alert={alert}
                    onResolve={loadAlerts}
                    isActive={activeTab === 'active'}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {alerts.length === 0 ? (
                'No alerts in the system'
              ) : (
                <>
                  {alerts.filter(a => !a.isResolved).length} active, {alerts.filter(a => a.isResolved).length} resolved alerts
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              {alerts.filter(a => a.isResolved).length > 0 && (
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete all ${alerts.filter(a => a.isResolved).length} resolved alerts?`)) {
                      try {
                        const response = await api.delete('/alerts/resolved');
                        if (response.success) {
                          await loadAlerts();
                          toast.success(`Deleted resolved alerts`);
                        }
                      } catch (err) {
                        console.error('Failed to delete resolved alerts', err);
                        toast.error('Failed to delete resolved alerts: ' + err.message);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Delete All Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertManagementModal;