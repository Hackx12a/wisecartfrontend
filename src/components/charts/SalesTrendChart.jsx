import React from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { chartOptions } from '../../utils/chartUtils';
import { formatCurrency } from '../../utils/currencyUtils';

const SalesTrendChart = ({ chartData, sales, selectedYear }) => {
    return (
        <div className="relative w-full" style={{ height: '400px' }}>
            {sales.length > 0 ? (
                <div className="w-full h-full">
                    <Line
                        data={chartData}
                        options={{
                            ...chartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                ...chartOptions.plugins,
                                legend: {
                                    display: true,
                                    position: 'top',
                                    align: 'start',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true,
                                        pointStyle: 'circle',
                                        font: {
                                            size: 14,
                                            weight: 'bold'
                                        }
                                    }
                                },
                                title: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(229, 231, 235, 0.8)',
                                        drawBorder: false,
                                    },
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        color: '#6b7280',
                                        padding: 10,
                                        font: {
                                            size: 12
                                        },
                                        callback: function (value) {
                                            if (value >= 1000000) {
                                                return '₱' + (value / 1000000).toFixed(1) + 'M';
                                            }
                                            if (value >= 1000) {
                                                return '₱' + (value / 1000).toFixed(0) + 'K';
                                            }
                                            return '₱' + value.toFixed(0);
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Revenue (₱)',
                                        color: '#4b5563',
                                        font: {
                                            size: 14,
                                            weight: 'bold'
                                        },
                                        padding: { top: 20, bottom: 20 }
                                    }
                                },
                                x: {
                                    grid: {
                                        color: 'rgba(229, 231, 235, 0.5)',
                                    },
                                    border: {
                                        display: false
                                    },
                                    ticks: {
                                        color: '#6b7280',
                                        padding: 10,
                                        font: {
                                            size: 12
                                        }
                                    }
                                }
                            },
                            interaction: {
                                intersect: false,
                                mode: 'index',
                            },
                            elements: {
                                line: {
                                    tension: 0.4,
                                    borderWidth: 3
                                },
                                point: {
                                    radius: 5,
                                    hoverRadius: 8,
                                    borderWidth: 2,
                                    borderColor: '#ffffff'
                                }
                            }
                        }}
                    />
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <TrendingUp size={64} className="mb-4 opacity-50" />
                    <p className="text-xl font-semibold">No sales data available</p>
                    <p className="text-sm mt-2">Try selecting different filters or check back later</p>
                </div>
            )}
        </div>
    );
};

export default SalesTrendChart;