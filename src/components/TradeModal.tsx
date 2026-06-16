import { useState, useEffect } from 'react';
import { X, ShoppingCart, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Stock } from '../types';
import { RECOMMENDATION_MAP } from '../data/stocks';
import { useTradingStore } from '../store/tradingStore';

interface TradeModalProps {
  stock: Stock | null;
  onClose: () => void;
}

export function TradeModal({ stock, onClose }: TradeModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [customFeeRate, setCustomFeeRate] = useState<string>('');
  const [showCustomFee, setShowCustomFee] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { buyStock, sellStock, getPosition, feeRate, availableCash } = useTradingStore();

  useEffect(() => {
    if (stock) {
      setPrice(stock.recommendationPrice.toString());
      setQuantity('100');
      setCustomFeeRate((feeRate * 100).toString());
      setTradeType(stock.recommendation === 'sell' || stock.recommendation === 'decrease' ? 'sell' : 'buy');
    }
  }, [stock, feeRate]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!stock) return null;

  const position = getPosition(stock.id);
  const actualFeeRate = showCustomFee ? parseFloat(customFeeRate) / 100 : feeRate;
  const tradePrice = parseFloat(price) || 0;
  const tradeQuantity = parseInt(quantity) || 0;
  const totalCost = tradeType === 'buy' 
    ? tradePrice * tradeQuantity * (1 + actualFeeRate)
    : tradePrice * tradeQuantity * (1 - actualFeeRate);

  const maxBuyQuantity = Math.floor(availableCash / (tradePrice * (1 + actualFeeRate)));
  const maxSellQuantity = position?.quantity || 0;

  const handleTrade = () => {
    if (tradePrice <= 0 || tradeQuantity <= 0) {
      setMessage({ type: 'error', text: '请输入有效的价格和数量' });
      return;
    }

    let success = false;
    if (tradeType === 'buy') {
      if (tradeQuantity > maxBuyQuantity) {
        setMessage({ type: 'error', text: '可用资金不足' });
        return;
      }
      success = buyStock(stock.id, tradePrice, tradeQuantity, actualFeeRate);
    } else {
      if (tradeQuantity > maxSellQuantity) {
        setMessage({ type: 'error', text: '持仓数量不足' });
        return;
      }
      success = sellStock(stock.id, tradePrice, tradeQuantity, actualFeeRate);
    }

    if (success) {
      setMessage({ type: 'success', text: `${tradeType === 'buy' ? '买入' : '卖出'}成功` });
      setTimeout(onClose, 1500);
    } else {
      setMessage({ type: 'error', text: '交易失败，请重试' });
    }
  };

  const recommendationColors: Record<string, string> = {
    buy: 'bg-green-100 text-green-700',
    sell: 'bg-red-100 text-red-700',
    hold: 'bg-gray-100 text-gray-700',
    increase: 'bg-blue-100 text-blue-700',
    decrease: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold">{stock.name} ({stock.code})</h2>
            <p className="text-blue-100 text-xs sm:text-sm">当前价: ¥{stock.price.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setTradeType('buy')}
              className={`flex-1 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                tradeType === 'buy'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-1 sm:mr-2" />
              买入
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`flex-1 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                tradeType === 'sell'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-1 sm:mr-2" />
              卖出
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">研判建议</label>
                <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${recommendationColors[stock.recommendation]}`}>
                  {RECOMMENDATION_MAP[stock.recommendation]}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">交易价格</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                placeholder="请输入交易价格"
              />
              <p className="text-xs text-gray-500 mt-1">研判建议价格: ¥{stock.recommendationPrice.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">交易数量（股）</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="100"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm sm:text-base"
                placeholder="请输入交易数量"
              />
              <p className="text-xs text-gray-500 mt-1">
                {tradeType === 'buy' ? `最多可买 ${maxBuyQuantity} 股` : `最多可卖 ${maxSellQuantity} 股`}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">交易费率</label>
                <button
                  onClick={() => setShowCustomFee(!showCustomFee)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                >
                  {showCustomFee ? '使用默认费率' : '自定义费率'}
                </button>
              </div>
              <input
                type="number"
                value={customFeeRate}
                onChange={(e) => setCustomFeeRate(e.target.value)}
                step="0.01"
                disabled={!showCustomFee}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 text-sm sm:text-base"
                placeholder="请输入费率百分比"
              />
              <p className="text-xs text-gray-500 mt-1">默认费率: {(feeRate * 100).toFixed(2)}%</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">交易金额</span>
                <span className="font-medium text-sm sm:text-base">¥{(tradePrice * tradeQuantity).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">手续费</span>
                <span className="font-medium text-sm sm:text-base">¥{(tradePrice * tradeQuantity * actualFeeRate).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-200">
                <span className="font-medium text-sm sm:text-base text-gray-800">
                  {tradeType === 'buy' ? '总支出' : '总收入'}
                </span>
                <span className={`font-bold text-base sm:text-lg ${tradeType === 'buy' ? 'text-red-600' : 'text-green-600'}`}>
                  {tradeType === 'buy' ? '-' : '+'}¥{totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {position && tradeType === 'sell' && (
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                  <span className="text-xs sm:text-sm font-medium text-orange-800">持仓信息</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-orange-700">持仓数量</span>
                  <span className="font-medium">{position.quantity}股</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-orange-700">持仓成本</span>
                  <span className="font-medium">¥{position.avgCost.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className={`mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg text-xs sm:text-sm font-medium ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleTrade}
            className={`w-full mt-4 sm:mt-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              tradeType === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            确认{tradeType === 'buy' ? '买入' : '卖出'}
          </button>
        </div>
      </div>
    </div>
  );
}
