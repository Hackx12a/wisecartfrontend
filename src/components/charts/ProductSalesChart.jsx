import React from 'react';
import { Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/currencyUtils';

const ProductSalesChart = ({ productChartData }) => {
  return (
    <div style={{ height: '350px' }}>
      <Line 
        data={productChartData} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  if (value >= 1000000) return '₱' + (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return '₱' + (value / 1000).toFixed(0) + 'K';
                  return '₱' + value;
                }
              }
            }
          }
        }} 
      />
    </div>
  );
};

export default ProductSalesChart;