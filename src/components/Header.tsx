import { TrendingUp, Wallet, Percent } from 'lucide-react';
import { useTradingStore } from '../store/tradingStore';

export function Header() {
  const stats = useTradingStore(state => state.getStats());
  const feeRate = useTradingStore(state => state.feeRate);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">股票模拟交易系统</h1>
              <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">基于投资研判报告的模拟交易平台</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 sm:px-4 py-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              <div>
                <p className="text-xs text-blue-200">初始资金</p>
                <p className="font-semibold text-sm sm:text-base">¥{stats.initialCapital.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 sm:px-4 py-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: stats.totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-200">总收益</p>
                <p className={`font-semibold text-sm sm:text-base ${stats.totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {stats.totalProfit >= 0 ? '+' : ''}¥{stats.totalProfit.toLocaleString()}
                  <span className="text-xs sm:text-sm ml-1 hidden sm:inline">({stats.totalProfitPercent >= 0 ? '+' : ''}{stats.totalProfitPercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 sm:px-4 py-2">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
              <div>
                <p className="text-xs text-blue-200">费率</p>
                <p className="font-semibold text-sm sm:text-base">{(feeRate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
