import React from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import { chartOptions } from '../../utils/chartOptions';

const SalesTrendChart = ({ chartData }) => {
  const options = {
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
  };

  return <Line data={chartData} options={options} />;
};

export default SalesTrendChart;