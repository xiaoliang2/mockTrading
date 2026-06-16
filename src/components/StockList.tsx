import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Target } from 'lucide-react';
import { Stock } from '../types';
import { RECOMMENDATION_MAP } from '../data/stocks';
import { useTradingStore } from '../store/tradingStore';

interface StockCardProps {
  stock: Stock;
  onTrade: (stock: Stock) => void;
}

function StockCard({ stock, onTrade }: StockCardProps) {
  const position = useTradingStore(state => state.getPosition(stock.id));
  const [expanded, setExpanded] = useState(false);

  const recommendationColors: Record<string, string> = {
    buy: 'bg-green-100 text-green-700',
    sell: 'bg-red-100 text-red-700',
    hold: 'bg-gray-100 text-gray-700',
    increase: 'bg-blue-100 text-blue-700',
    decrease: 'bg-orange-100 text-orange-700',
  };

  const profit = position ? (stock.price - position.avgCost) * position.quantity : 0;
  const profitPercent = position && position.avgCost > 0 ? ((stock.price - position.avgCost) / position.avgCost) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2 sm:gap-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{stock.name}</h3>
              <span className="text-xs sm:text-sm text-gray-500">{stock.code}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${recommendationColors[stock.recommendation]}`}>
                {RECOMMENDATION_MAP[stock.recommendation]}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">¥{stock.price.toFixed(2)}</span>
              <span className={`text-xs sm:text-sm ${stock.price >= stock.recommendationPrice ? 'text-green-600' : 'text-red-600'}`}>
                {stock.price >= stock.recommendationPrice ? '↑' : '↓'} {Math.abs(stock.price - stock.recommendationPrice).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={() => onTrade(stock)}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            交易
          </button>
        </div>

        <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
            <span className="text-gray-500">PE:</span>
            <span className="font-medium text-gray-700">{stock.pe}x</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
            <span className="text-gray-500">置信度:</span>
            <span className="font-medium text-gray-700">{stock.confidence}分</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            <span className="text-gray-500">股息率:</span>
            <span className="font-medium text-gray-700">{stock.dividend}%</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
            <span className="text-gray-500">止损:</span>
            <span className="font-medium text-gray-700">¥{stock.stopLoss}</span>
          </div>
        </div>

        {position && (
          <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm gap-2">
              <span className="text-gray-500">持仓: {position.quantity}股</span>
              <span className="text-gray-500">成本: ¥{position.avgCost.toFixed(2)}</span>
              <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
        >
          {expanded ? '收起详情' : '查看目标价'}
          <TrendingDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-500 mb-2">目标价位:</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {stock.targetPrice.map((price, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">目标{index + 1}</p>
                  <p className="font-medium text-gray-800 text-sm">¥{price}</p>
                  <p className="text-xs text-green-600">+{((price - stock.price) / stock.price * 100).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StockList({ onTrade }: { onTrade: (stock: Stock) => void }) {
  const stocks = useTradingStore(state => state.stocks);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {stocks.map(stock => (
        <StockCard key={stock.id} stock={stock} onTrade={onTrade} />
      ))}
    </div>
  );
}
