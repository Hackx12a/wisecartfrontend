import React, { useState, useMemo } from 'react';
import { Bell, X, Download, CheckCheck, Trash2, RefreshCw, AlertCircle, AlertTriangle, Info, CheckCircle, Database } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';

const AlertManagement = ({ showNotifications, setShowNotifications, alerts, loadAlerts }) => {
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
        (alert.product?.productName && alert.product.productName.toLowerCase().includes(query)) ||
        (alert.severity && alert.severity.toLowerCase().includes(query)) ||
        (alert.alertType && alert.alertType.toLowerCase().includes(query))
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
                onClick={async () => {
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
                        alert(`Downloaded and cleared ${deletedCount} resolved alerts`);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to process resolved alerts', err);
                    alert('Failed to process resolved alerts: ' + err.message);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Download resolved alerts as CSV and clear them from the system"
              >
                <Download size={18} />
                Download & Clear Resolved
              </button>

              {alerts.filter(a => !a.isResolved).length > 0 && (
                <button
                  onClick={async () => {
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
                        alert(`Resolved ${activeAlerts.length} alerts`);
                      } catch (err) {
                        console.error('Failed to resolve alerts', err);
                        alert('Failed to resolve alerts: ' + err.message);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck size={18} />
                  Resolve All
                </button>
              )}

              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

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

        <div className="flex-1 overflow-y-auto">
          {(() => {
            const tabAlerts = getFilteredAlerts;
            if (tabAlerts.length === 0) {
              return (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  {activeTab === 'active' ? (
                    <>
                      <CheckCircle className="text-green-500 mb-4" size={80} />
                      <p className="text-2xl font-semibold text-gray-700">No Active Alerts</p>
                      <p className="text-gray-500 text-lg mt-2">All alerts have been addressed</p>
                      {alerts.filter(a => a.isResolved).length > 0 && (
                        <button
                          onClick={() => setActiveTab('resolved')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View {alerts.filter(a => a.isResolved).length} Resolved Alerts
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <Database className="text-blue-500 mb-4" size={80} />
                      <p className="text-2xl font-semibold text-gray-700">No Resolved Alerts</p>
                      <p className="text-gray-500 text-lg mt-2">No alerts have been resolved yet</p>
                      {alerts.filter(a => !a.isResolved).length > 0 && (
                        <button
                          onClick={() => setActiveTab('active')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View {alerts.filter(a => !a.isResolved).length} Active Alerts
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            }

            return (
              <>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {tabAlerts.length} {activeTab === 'active' ? 'active' : 'resolved'} alerts
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {tabAlerts.map((alert, index) => {
                    let alertConfig = {
                      icon: AlertCircle,
                      iconColor: 'text-yellow-600',
                      bgColor: 'bg-yellow-50',
                      borderColor: 'border-yellow-200',
                      severityColor: 'bg-yellow-100 text-yellow-800'
                    };

                    if (alert.severity === 'CRITICAL') {
                      alertConfig = {
                        icon: AlertTriangle,
                        iconColor: 'text-red-600',
                        bgColor: 'bg-red-50',
                        borderColor: 'border-red-200',
                        severityColor: 'bg-red-100 text-red-800'
                      };
                    } else if (alert.severity === 'HIGH') {
                      alertConfig = {
                        icon: AlertTriangle,
                        iconColor: 'text-orange-600',
                        bgColor: 'bg-orange-50',
                        borderColor: 'border-orange-200',
                        severityColor: 'bg-orange-100 text-orange-800'
                      };
                    } else if (alert.severity === 'MEDIUM') {
                      alertConfig = {
                        icon: Info,
                        iconColor: 'text-blue-600',
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-blue-200',
                        severityColor: 'bg-blue-100 text-blue-800'
                      };
                    } else if (alert.severity === 'LOW') {
                      alertConfig = {
                        icon: Bell,
                        iconColor: 'text-gray-600',
                        bgColor: 'bg-gray-50',
                        borderColor: 'border-gray-200',
                        severityColor: 'bg-gray-100 text-gray-800'
                      };
                    }

                    if (alert.isResolved) {
                      alertConfig.icon = CheckCircle;
                      alertConfig.iconColor = 'text-green-600';
                      alertConfig.bgColor = 'bg-green-50';
                      alertConfig.borderColor = 'border-green-200';
                      alertConfig.severityColor = 'bg-green-100 text-green-800';
                    }

                    const Icon = alertConfig.icon;
                    const alertDate = (() => {
                      try {
                        if (alert.createdAt) {
                          const date = new Date(alert.createdAt);
                          return !isNaN(date.getTime()) ? date : new Date();
                        }
                      } catch (e) {
                        console.error('Error parsing alert date:', e);
                      }
                      return new Date();
                    })();

                    const resolvedDate = (() => {
                      try {
                        if (alert.resolvedAt) {
                          const date = new Date(alert.resolvedAt);
                          return !isNaN(date.getTime()) ? date : null;
                        }
                      } catch (e) {
                        console.error('Error parsing resolved date:', e);
                      }
                      return null;
                    })();

                    return (
                      <div
                        key={alert.id || index}
                        className={`p-6 hover:bg-gray-50 transition-colors ${alertConfig.bgColor} border-b ${alertConfig.borderColor}`}
                      >
                        <div className="flex gap-4">
                          <div className={`p-3 rounded-xl ${alertConfig.bgColor} ${alertConfig.iconColor} flex-shrink-0`}>
                            <Icon size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <h4 className="font-bold text-gray-900 text-lg truncate">
                                    {alert.title || `Alert #${alert.id || index + 1}`}
                                  </h4>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${alertConfig.severityColor}`}>
                                    {alert.severity || 'MEDIUM'}
                                  </span>
                                  {alert.alertType && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                      {alert.alertType.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                  {alert.isResolved && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                                      RESOLVED
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700 text-base">
                                  {alert.message || 'No message provided'}
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                                <div className="font-medium">
                                  {alertDate.toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs">
                                  {alertDate.toLocaleTimeString('en-PH', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                                {resolvedDate && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-xs text-gray-400">Resolved:</div>
                                    <div className="text-xs">
                                      {resolvedDate.toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {(alert.branch || alert.product || alert.currentValue !== null) && (
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                {alert.branch && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500">Branch</p>
                                    <p className="font-semibold text-gray-900 truncate">
                                      {alert.branch.branchName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{alert.branch.branchCode}</p>
                                  </div>
                                )}

                                {alert.product && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500">Product</p>
                                    <p className="font-semibold text-gray-900 truncate">
                                      {alert.product.productName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{alert.product.sku}</p>
                                  </div>
                                )}

                                {(alert.currentValue !== null || alert.thresholdValue !== null) && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500">
                                      {alert.currentValue !== null ? 'Current / Threshold' : 'Threshold'}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                      {alert.currentValue !== null && (
                                        <span className="font-bold text-lg">
                                          {alert.currentValue}
                                        </span>
                                      )}
                                      {alert.thresholdValue !== null && (
                                        <>
                                          {alert.currentValue !== null && (
                                            <span className="text-gray-400">/</span>
                                          )}
                                          <span className="font-semibold text-gray-700">
                                            {alert.thresholdValue}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {!alert.isResolved && (
                              <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  {alert.saleId && (
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                      Sale #{alert.saleId}
                                    </span>
                                  )}
                                  {alert.referenceId && (
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                      Ref: {alert.referenceId}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Mark alert "${alert.title}" as resolved?`)) {
                                        try {
                                          const response = await api.put(`/alerts/${alert.id}/resolve`, {
                                            resolvedBy: 'admin',
                                            notes: 'Resolved manually'
                                          });

                                          if (response.success) {
                                            setAlerts(prevAlerts =>
                                              prevAlerts.map(a =>
                                                a.id === alert.id
                                                  ? { ...a, isResolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'admin' }
                                                  : a
                                              )
                                            );
                                            await loadAlerts();
                                            alert('Alert resolved successfully');
                                          }
                                        } catch (err) {
                                          console.error('Failed to resolve alert', err);
                                          alert('Failed to resolve alert: ' + err.message);
                                        }
                                      }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <CheckCircle size={16} />
                                    Mark as Resolved
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

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
                        }
                      } catch (err) {
                        console.error('Failed to delete resolved alerts', err);
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

export default AlertManagement;