import React from 'react';
import { Info, TrendingUpIcon, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const BusinessInsights = ({ insights, showInsights, setShowInsights }) => {
  if (!showInsights || insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-md p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
          <Info className="text-purple-600" size={20} />
          Business Insights
        </h3>
        <button
          onClick={() => setShowInsights(false)}
          className="text-purple-600 hover:text-purple-800"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          const typeColors = {
            positive: 'bg-green-100 border-green-300 text-green-800',
            warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
            info: 'bg-blue-100 border-blue-300 text-blue-800',
          };

          return (
            <div key={idx} className={`p-4 rounded-lg border ${typeColors[insight.type]}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${insight.type === 'positive' ? 'bg-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-200' : 'bg-blue-200'
                  }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm mt-1">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessInsights;