import { useState } from 'react';
import { Settings as SettingsIcon, Percent, DollarSign, RotateCcw } from 'lucide-react';
import { useTradingStore } from '../store/tradingStore';
import { FileImporter } from './FileImporter';
import { AIConfigPanel } from './AIConfig';
import { Stock } from '../types';

export function Settings() {
  const { feeRate, availableCash, setFeeRate: updateFeeRate, setStocks, resetStocks, stocks } = useTradingStore();
  const [customRate, setCustomRate] = useState((feeRate * 100).toString());

  const handleSave = () => {
    const rate = parseFloat(customRate) / 100;
    if (rate >= 0 && rate <= 1) {
      updateFeeRate(rate);
    }
  };

  const handleStocksImported = (newStocks: Stock[]) => {
    setStocks(newStocks);
  };

  const handleResetStocks = () => {
    if (confirm('确定要重置股票列表吗？将恢复为默认的5只股票。')) {
      resetStocks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 to-gray-700 text-white p-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            <h2 className="font-semibold">系统设置</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <label className="font-medium text-gray-800">账户资金</label>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">可用资金</span>
                <span className="font-semibold text-gray-900">¥{availableCash.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-5 h-5 text-purple-600" />
              <label className="font-medium text-gray-800">默认交易费率</label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="请输入费率百分比"
              />
              <span className="text-gray-500">%</span>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">提示：买入时手续费 = 成交金额 × 费率，卖出时手续费 = 成交金额 × 费率</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-2">使用说明</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 研判报告中的买入建议将自动填充建议价格作为默认交易价格</li>
              <li>• 您可以手动修改交易价格和数量</li>
              <li>• 增持操作：先买入一定数量，再根据增持比例调整持仓</li>
              <li>• 减持操作：根据减持比例卖出相应数量的股票</li>
              <li>• 持有操作：保持当前持仓不变</li>
              <li>• 系统会自动计算包含手续费的实际成本和收益</li>
            </ul>
          </div>
        </div>
      </div>

      <FileImporter onStocksImported={handleStocksImported} />

      <AIConfigPanel />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <h2 className="font-semibold">重置股票列表</h2>
            </div>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              当前 {stocks.length} 只股票
            </span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">点击下方按钮将股票列表恢复为默认的5只核心标的（贵州茅台、招商银行、中国神华、药明康德、长江电力）。</p>
          <button
            onClick={handleResetStocks}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            恢复默认股票列表
          </button>
        </div>
      </div>
    </div>
  );
}
