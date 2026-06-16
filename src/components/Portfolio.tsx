import { Wallet, TrendingUp, PieChart, RefreshCw } from 'lucide-react';
import { useTradingStore } from '../store/tradingStore';

export function Portfolio() {
  const { positions, stocks, availableCash, resetPortfolio, getStats } = useTradingStore();
  const stats = getStats();

  const totalStockValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
  const totalProfit = positions.reduce((sum, p) => sum + (p.currentPrice - p.avgCost) * p.quantity, 0);

  const handleReset = () => {
    if (confirm('确定要重置投资组合吗？所有持仓和交易记录将被清除。')) {
      resetPortfolio();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            <h2 className="font-semibold">我的持仓</h2>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Wallet className="w-4 h-4" />
              <span>可用资金</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">¥{availableCash.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <PieChart className="w-4 h-4" />
              <span>持仓市值</span>
            </div>
            <p className="text-lg font-bold text-gray-800 mt-1">¥{totalStockValue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>持仓收益</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>总收益率</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${stats.totalProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalProfitPercent >= 0 ? '+' : ''}{stats.totalProfitPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无持仓</p>
            <p className="text-sm text-gray-400 mt-1">点击股票卡片进行交易</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">股票名称</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">持仓数量</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">持仓成本</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">当前价格</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">持仓市值</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">盈亏</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">盈亏比</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position) => {
                  const stock = stocks.find(s => s.id === position.stockId);
                  const profit = (position.currentPrice - position.avgCost) * position.quantity;
                  const profitPercent = position.avgCost > 0 ? ((position.currentPrice - position.avgCost) / position.avgCost) * 100 : 0;
                  const marketValue = position.currentPrice * position.quantity;

                  return (
                    <tr key={position.stockId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{position.stockName}</div>
                        <div className="text-sm text-gray-500">{position.stockCode}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{position.quantity}</td>
                      <td className="py-3 px-4 text-right">¥{position.avgCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">¥{position.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium">¥{marketValue.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
