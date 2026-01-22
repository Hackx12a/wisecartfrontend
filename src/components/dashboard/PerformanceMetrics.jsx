import React from 'react';
import { TrendingUp, Package, PieChart, Clock, ShoppingCart, Database } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import SearchableSelect from '../common/SearchableSelect';
import StatusBadge from '../common/StatusBadge';

const PerformanceMetrics = ({
    selectedYear,
    setSelectedYear,
    selectedCompany,
    setSelectedCompany,
    selectedBranch,
    setSelectedBranch,
    companies,
    branches,
    availableBranches,
    availableYears,
    chartData,
    chartOptions,
    monthlySalesData,
    productChartData,
    statusChartData,
    salesByStatus,
    recentSales,
    stats,
    sales,
    formatCurrency,
    formatNumber
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                            <TrendingUp className="text-blue-600" size={24} />
                            Active Sales Trend ({selectedYear})
                        </h3>
                        <p className="text-sm text-gray-500">Confirmed & Invoiced sales combined</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="min-w-[200px]">
                                <SearchableSelect
                                    value={selectedCompany}
                                    onChange={setSelectedCompany}
                                    options={[
                                        { value: 'all', label: 'All Companies' },
                                        ...companies.map(company => ({
                                            value: company.companyName,
                                            label: company.companyName
                                        }))
                                    ]}
                                    placeholder="Filter by Company"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="min-w-[200px]">
                                <SearchableSelect
                                    value={selectedBranch}
                                    onChange={setSelectedBranch}
                                    options={[
                                        {
                                            value: 'all',
                                            label: selectedCompany === 'all' ? 'All Branches' : 'All Branches'
                                        },
                                        ...availableBranches.map(branch => ({
                                            value: branch.branchName,
                                            label: branch.branchName
                                        }))
                                    ]}
                                    placeholder="Filter by Branch"
                                    disabled={selectedCompany === 'all' && availableBranches.length === 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="relative w-full" style={{ height: '400px' }}>
                    {sales.length > 0 && chartData && chartData.labels ? (
                        <Line
                            data={chartData}
                            options={{
                                ...chartOptions,
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(229, 231, 235, 0.8)',
                                        },
                                        ticks: {
                                            color: '#6b7280',
                                            padding: 10,
                                            callback: function (value) {
                                                if (value >= 1000000) {
                                                    return '₱' + (value / 1000000).toFixed(1) + 'M';
                                                }
                                                if (value >= 1000) {
                                                    return '₱' + (value / 1000).toFixed(0) + 'K';
                                                }
                                                return '₱' + value;
                                            }
                                        }
                                    },
                                    x: {
                                        grid: {
                                            color: 'rgba(229, 231, 235, 0.5)',
                                        },
                                        ticks: {
                                            color: '#6b7280',
                                            padding: 10,
                                        }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <TrendingUp size={64} className="mb-4 opacity-50" />
                            <p className="text-xl font-semibold">No sales data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Distribution & Recent Sales */}
            <div className="space-y-6">
                {/* Status Distribution */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="text-blue-600" size={20} />
                        Sales Status Overview
                    </h3>
                    {salesByStatus && Object.keys(salesByStatus.counts || {}).length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {Object.entries(salesByStatus.counts).map(([status, count]) => {
                                const revenue = salesByStatus.revenues?.[status] || 0;
                                const percentage = stats.totalSales > 0 ? ((count / stats.totalSales) * 100).toFixed(1) : 0;

                                return (
                                    <div key={status} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <StatusBadge status={status} />
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{count}</p>
                                                <p className="text-xs text-gray-500">sales</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Sales</span>
                                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenue)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-full rounded-full bg-green-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Database size={32} className="opacity-50 mx-auto mb-3" />
                                <p>No sales data</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Sales */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="text-gray-600" size={20} />
                            Recent Sales Activity
                        </h3>
                        <span className="text-sm text-gray-500">
                            {sales.length} total sales
                        </span>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentSales.length > 0 ? (
                            recentSales.map((sale, index) => {
                                const dateStr = sale.createdAt
                                    ? new Date(sale.createdAt).toLocaleDateString('en-PH', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : 'No date';

                                return (
                                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {sale.company?.companyName || 'Unknown Company'}
                                                </p>
                                                <StatusBadge
                                                    status={
                                                        (sale.status === 'CONFIRMED' || sale.status === 'INVOICED')
                                                            ? 'ACTIVE'
                                                            : sale.status || 'PENDING'
                                                    }
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {dateStr}
                                                {sale.branch?.branchName && ` • ${sale.branch.branchName}`}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-semibold text-gray-900">{formatCurrency(sale.totalAmount || 0)}</p>
                                            <p className="text-xs text-gray-500">
                                                {sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <ShoppingCart size={32} className="mx-auto mb-3 opacity-50" />
                                <p>No recent sales</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetrics;