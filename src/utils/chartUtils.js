import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 12,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      callbacks: {
        label: function (context) {
          return `${context.dataset.label}: ₱${context.parsed.y.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(229, 231, 235, 0.5)',
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
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  }
};