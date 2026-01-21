import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AlertBadge } from '../alerts/AlertBadge';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const StatCard = ({ card }) => {
  const Icon = card.icon;
  const bgColor = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  }[card.color];

  const trendIcon = card.trend > 0 ?
    <ArrowUpRight className="text-green-500" size={16} /> :
    card.trend < 0 ? <ArrowDownRight className="text-red-500" size={16} /> : null;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-5 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
            {card.trend !== undefined && trendIcon && (
              <div className="flex items-center gap-1">
                {trendIcon}
                <span className={`text-xs font-medium ${card.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trendLabel ? `${Math.abs(card.trend)} ${card.trendLabel}` : `${Math.abs(card.trend)}%`}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            {card.badge}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">{card.description}</p>
            {card.subtitle && (
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            )}
          </div>
        </div>
        <div className={`ml-4 p-3 rounded-xl ${bgColor} bg-opacity-10`}>
          <Icon size={24} className={`text-${card.color}-600`} />
        </div>
      </div>
      <div className={`mt-4 h-1 rounded-full ${bgColor} bg-opacity-20`}>
        <div className={`h-full rounded-full ${bgColor}`} style={{ width: '100%' }}></div>
      </div>
    </div>
  );
};

export default StatCard;