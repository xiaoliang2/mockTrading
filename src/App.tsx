import { useState } from 'react';
import { Stock } from './types';
import { Header } from './components/Header';
import { StockList } from './components/StockList';
import { Portfolio } from './components/Portfolio';
import { TradeHistory } from './components/TradeHistory';
import { Settings } from './components/Settings';
import { TradeModal } from './components/TradeModal';
import { PieChart, History, Settings as SettingsIcon } from 'lucide-react';

type TabType = 'stocks' | 'portfolio' | 'history' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('stocks');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const handleTrade = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleCloseModal = () => {
    setSelectedStock(null);
  };

  const tabs = [
    { id: 'stocks' as TabType, label: '股票列表', icon: PieChart },
    { id: 'portfolio' as TabType, label: '我的持仓', icon: PieChart },
    { id: 'history' as TabType, label: '交易记录', icon: History },
    { id: 'settings' as TabType, label: '系统设置', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 bg-white rounded-lg p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {activeTab === 'stocks' && (
            <div className="lg:col-span-3">
              <StockList onTrade={handleTrade} />
            </div>
          )}
          {activeTab === 'portfolio' && (
            <div className="lg:col-span-3">
              <Portfolio />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="lg:col-span-3">
              <TradeHistory />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="lg:col-span-2 xl:col-span-3">
              <Settings />
            </div>
          )}
        </div>
      </div>

      <TradeModal stock={selectedStock} onClose={handleCloseModal} />
    </div>
  );
}

export default App;
