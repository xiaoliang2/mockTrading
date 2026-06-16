import { useState } from 'react';
import { History, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useTradingStore } from '../store/tradingStore';
import { DatePicker } from './DatePicker';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export function TradeHistory() {
  const transactions = useTradingStore(state => state.transactions);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filterTransactionsByDate = () => {
    if (!dateRange.startDate) return transactions;
    
    const start = new Date(dateRange.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = dateRange.endDate 
      ? new Date(dateRange.endDate)
      : new Date();
    end.setHours(23, 59, 59, 999);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.timestamp);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const filteredTrades = filterTransactionsByDate();

  const clearFilter = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h2 className="font-semibold">交易记录</h2>
            <span className="ml-auto text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {filteredTrades.length} 条
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <DatePicker 
            selectedRange={dateRange} 
            onChange={setDateRange} 
          />
          {dateRange.startDate && (
            <button
              onClick={clearFilter}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {dateRange.startDate ? '该时间段暂无交易记录' : '暂无交易记录'}
            </p>
            <p className="text-sm text-gray-400 mt-1">进行交易后将在此显示</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredTrades.map((trade) => (
              <div
                key={trade.id}
                className={`p-4 rounded-lg border ${
                  trade.type === 'buy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        trade.type === 'buy' ? 'bg-green-200' : 'bg-red-200'
                      }`}
                    >
                      {trade.type === 'buy' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-700" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {trade.stockName} ({trade.stockCode})
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(trade.timestamp)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      trade.type === 'buy' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {trade.type === 'buy' ? '买入' : '卖出'} {trade.quantity}股
                    </div>
                    <div className="text-sm text-gray-500">
                      成交价: ¥{trade.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium ${
                      trade.type === 'buy' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {trade.type === 'buy' ? '-' : '+'}¥{trade.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex justify-between">
                  <span>手续费: ¥{trade.feeAmount.toFixed(2)}</span>
                  <span>费率: {trade.feeRate.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
