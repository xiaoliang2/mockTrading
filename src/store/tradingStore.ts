import { create } from 'zustand';
import { Stock, Transaction, PortfolioItem } from '../types';
import { stockAPI, transactionAPI, portfolioAPI, configAPI } from '../services/api';

interface TradingState {
  stocks: Stock[];
  transactions: Transaction[];
  portfolio: PortfolioItem[];
  availableFunds: number;
  initialCapital: number;
  feeRate: number;
  loading: boolean;
  error: string | null;
  
  setStocks: (stocks: Stock[]) => void;
  addStock: (stock: Stock) => void;
  removeStock: (id: string) => void;
  updateStock: (id: string, updates: Partial<Stock>) => void;
  resetStocks: () => void;
  
  addTransaction: (transaction: Transaction) => void;
  
  updatePortfolio: (item: PortfolioItem) => void;
  removeFromPortfolio: (stockCode: string) => void;
  resetPortfolio: () => void;
  
  setAvailableFunds: (funds: number) => void;
  setFeeRate: (rate: number) => void;
  
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
  
  buyStock: (stockId: string, price: number, quantity: number, feeRateParam?: number) => Promise<boolean>;
  sellStock: (stockId: string, price: number, quantity: number, feeRateParam?: number) => Promise<boolean>;
  
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  getStats: () => {
    initialCapital: number;
    totalAssets: number;
    totalProfit: number;
    totalProfitPercent: number;
    portfolioValue: number;
  };
  
  getPosition: (stockId: string) => PortfolioItem | undefined;
  positions: PortfolioItem[];
  availableCash: number;
}

const initialStocks: Stock[] = [
  {
    id: '1',
    name: '贵州茅台',
    code: '600519',
    price: 1271.10,
    recommendation: 'buy',
    recommendationPrice: 1250,
    confidence: 88,
    pe: 19.21,
    dividend: 4.03,
    position: 25,
    targetPrice: [1450, 1600, 1800],
    stopLoss: 1180,
  },
  {
    id: '2',
    name: '招商银行',
    code: '600036',
    price: 38.95,
    recommendation: 'buy',
    recommendationPrice: 38,
    confidence: 85,
    pe: 6.52,
    dividend: 7.66,
    position: 22,
    targetPrice: [45, 50, 55],
    stopLoss: 35,
  },
  {
    id: '3',
    name: '中国神华',
    code: '601088',
    price: 43.39,
    recommendation: 'buy',
    recommendationPrice: 42,
    confidence: 85,
    pe: 18.25,
    dividend: 7.02,
    position: 21,
    targetPrice: [48, 52, 56],
    stopLoss: 37,
  },
  {
    id: '4',
    name: '药明康德',
    code: '603259',
    price: 99.71,
    recommendation: 'buy',
    recommendationPrice: 100,
    confidence: 86,
    pe: 13.46,
    dividend: 2.8,
    position: 17,
    targetPrice: [130, 145, 160],
    stopLoss: 88,
  },
  {
    id: '5',
    name: '长江电力',
    code: '600900',
    price: 27.57,
    recommendation: 'buy',
    recommendationPrice: 27,
    confidence: 84,
    pe: 18.53,
    dividend: 3.7,
    position: 15,
    targetPrice: [30, 32, 35],
    stopLoss: 24,
  },
];

export const useTradingStore = create<TradingState>((set, get) => ({
  stocks: initialStocks,
  transactions: [],
  portfolio: [],
  availableFunds: 1000000,
  initialCapital: 1000000,
  feeRate: 0.25,
  loading: false,
  error: null,

  setStocks: (stocks) => set({ stocks }),
  
  addStock: (stock) => set((state) => ({
    stocks: [...state.stocks, stock]
  })),
  
  removeStock: (id) => set((state) => ({
    stocks: state.stocks.filter(s => s.id !== id)
  })),
  
  updateStock: (id, updates) => set((state) => ({
    stocks: state.stocks.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions]
  })),
  
  updatePortfolio: (item) => set((state) => {
    const existing = state.portfolio.find(p => p.stockCode === item.stockCode);
    if (existing) {
      return {
        portfolio: state.portfolio.map(p => 
          p.stockCode === item.stockCode ? item : p
        )
      };
    }
    return { portfolio: [...state.portfolio, item] };
  }),
  
  removeFromPortfolio: (stockCode) => set((state) => ({
    portfolio: state.portfolio.filter(p => p.stockCode !== stockCode)
  })),
  
  setAvailableFunds: (funds) => {
    set({ availableFunds: funds });
    configAPI.set('availableFunds', funds).catch(err => console.error('保存可用资金失败:', err));
  },

  setFeeRate: (rate) => {
    set({ feeRate: rate });
    configAPI.set('feeRate', rate).catch(err => console.error('保存费率失败:', err));
  },
  
  setError: (error) => set({ error }),
  
  setLoading: (loading) => set({ loading }),

  loadFromServer: async () => {
    try {
      get().setLoading(true);
      const [stocksRes, transactionsRes, portfolioRes, configRes] = await Promise.all([
        stockAPI.getAll(),
        transactionAPI.getAll(),
        portfolioAPI.getAll(),
        configAPI.getAll(),
      ]);
      
      const stocksData = stocksRes as unknown;
      const transactionsData = transactionsRes as unknown;
      const portfolioData = portfolioRes as unknown;
      const configData = configRes as unknown;
      
      const stocks = Array.isArray(stocksData) ? stocksData : ((stocksData as any)?.data || (stocksData as any)?.stocks || []);
      const transactions = Array.isArray(transactionsData) ? transactionsData : ((transactionsData as any)?.data || (transactionsData as any)?.transactions || []);
      const portfolio = Array.isArray(portfolioData) ? portfolioData : ((portfolioData as any)?.data || (portfolioData as any)?.portfolio || []);
      const config = ((configData as any)?.success === false) ? null : ((configData as any)?.configs || configData);
      
      if (stocks && stocks.length > 0) {
        const formattedStocks = stocks.map((s: any) => {
          const dateTag = s.dateTag || s.date;
          let date = dateTag;
          if (dateTag && typeof dateTag === 'string') {
            if (dateTag.includes('T')) {
              date = dateTag.split('T')[0];
            } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTag)) {
              const d = new Date(dateTag);
              date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
          }
          return { 
            ...s, 
            id: String(s._id || s.id),
            date: date 
          };
        });
        set({ stocks: formattedStocks });
      } else {
        set({ stocks: [] });
      }
      if (transactions && transactions.length > 0) {
        set({ transactions: transactions.map((t: any) => ({ ...t, id: String(t._id || t.id) })) });
      }
      if (portfolio && portfolio.length > 0) {
        set({ portfolio: portfolio.map((p: any) => ({ ...p, id: String(p._id || p.id) })) });
      }
      if (config && typeof config === 'object') {
        const updates: Partial<TradingState> = {};
        if (config.feeRate !== undefined) {
          updates.feeRate = config.feeRate;
        }
        if (config.availableFunds !== undefined) {
          updates.availableFunds = config.availableFunds;
        }
        if (config.initialCapital !== undefined) {
          updates.initialCapital = config.initialCapital;
        }
        if (Object.keys(updates).length > 0) {
          set(updates);
        }
      }
      get().setError(null);
    } catch (error) {
      console.error('Failed to load from server:', error);
      get().setError('从服务器加载数据失败，使用本地数据');
    } finally {
      get().setLoading(false);
    }
  },

  saveToServer: async () => {
    try {
      const { stocks, transactions, portfolio, availableFunds, feeRate } = get();
      await Promise.all([
        stockAPI.create(stocks),
        transactionAPI.create(transactions),
        configAPI.set('availableFunds', availableFunds),
        configAPI.set('feeRate', feeRate),
      ]);
      portfolio.forEach(item => {
        portfolioAPI.update(item);
      });
    } catch (error) {
      console.error('Failed to save to server:', error);
      get().setError('保存到服务器失败');
    }
  },

  buyStock: async (stockId, price, quantity, feeRateParam) => {
    const { stocks, availableFunds, feeRate: defaultFeeRate } = get();
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
      get().setError('股票不存在');
      return false;
    }
    const actualFeeRate = feeRateParam !== undefined ? feeRateParam : defaultFeeRate;
    const totalCost = price * quantity;
    const fee = totalCost * actualFeeRate;
    const totalWithFee = totalCost + fee;

    if (totalWithFee > availableFunds) {
      get().setError('余额不足');
      return false;
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'buy',
      stockCode: stock.code,
      stockName: stock.name,
      price,
      quantity,
      totalAmount: totalCost,
      feeRate: actualFeeRate,
      feeAmount: fee,
      timestamp: new Date(),
      userNote: '',
    };

    get().addTransaction(transaction);
    get().setAvailableFunds(availableFunds - totalWithFee);

    const existingPosition = get().portfolio.find(p => p.stockCode === stock.code);
    let newPosition: PortfolioItem;

    if (existingPosition) {
      const totalCostBasis = existingPosition.avgCost * existingPosition.quantity + totalCost;
      const totalQuantity = existingPosition.quantity + quantity;
      newPosition = {
        ...existingPosition,
        id: existingPosition.id,
        quantity: totalQuantity,
        avgCost: totalCostBasis / totalQuantity,
        currentPrice: stock.price,
        marketValue: totalQuantity * stock.price,
        profit: (stock.price - (totalCostBasis / totalQuantity)) * totalQuantity,
        profitPercent: ((stock.price - (totalCostBasis / totalQuantity)) / (totalCostBasis / totalQuantity)) * 100,
      };
    } else {
      newPosition = {
        id: `${stock.code}-${Date.now()}`,
        stockCode: stock.code,
        stockName: stock.name,
        quantity,
        avgCost: price,
        currentPrice: stock.price,
        marketValue: quantity * stock.price,
        profit: (stock.price - price) * quantity,
        profitPercent: ((stock.price - price) / price) * 100,
      };
    }

    get().updatePortfolio(newPosition);
    get().setError(null);

    // 保存到 MongoDB
    try {
      await transactionAPI.create(transaction);
      await portfolioAPI.update(newPosition);
    } catch (error) {
      console.error('保存到数据库失败:', error);
    }

    return true;
  },

  sellStock: async (stockId, price, quantity, feeRateParam) => {
    const { stocks, feeRate: defaultFeeRate, portfolio } = get();
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) {
      get().setError('股票不存在');
      return false;
    }
    const actualFeeRate = feeRateParam !== undefined ? feeRateParam : defaultFeeRate;
    const position = portfolio.find(p => p.stockCode === stock.code);

    if (!position || position.quantity < quantity) {
      get().setError('持仓不足');
      return false;
    }

    const totalValue = price * quantity;
    const fee = totalValue * actualFeeRate;
    const netProceeds = totalValue - fee;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'sell',
      stockCode: stock.code,
      stockName: stock.name,
      price,
      quantity,
      totalAmount: totalValue,
      feeRate: actualFeeRate,
      feeAmount: fee,
      timestamp: new Date(),
      userNote: '',
    };

    get().addTransaction(transaction);
    get().setAvailableFunds(get().availableFunds + netProceeds);

    const remainingQuantity = position.quantity - quantity;

    if (remainingQuantity <= 0) {
      get().removeFromPortfolio(stock.code);
    } else {
      const newPosition: PortfolioItem = {
        ...position,
        quantity: remainingQuantity,
        currentPrice: stock.price,
        marketValue: remainingQuantity * stock.price,
        profit: (stock.price - position.avgCost) * remainingQuantity,
        profitPercent: ((stock.price - position.avgCost) / position.avgCost) * 100,
      };
      get().updatePortfolio(newPosition);
    }

    get().setError(null);

    // 保存到 MongoDB
    try {
      await transactionAPI.create(transaction);
    } catch (error) {
      console.error('保存交易记录失败:', error);
    }

    return true;
  },

  getStats: () => {
    const { portfolio, availableFunds, initialCapital, stocks, transactions } = get();
    
    const portfolioValue = portfolio.reduce((sum, item) => {
      const stockRecords = stocks.filter(s => s.code === item.stockCode);
      const latestStock = stockRecords.sort((a, b) => new Date(b.dateTag).getTime() - new Date(a.dateTag).getTime())[0];
      const currentPrice = latestStock?.price || item.currentPrice;
      return sum + currentPrice * item.quantity;
    }, 0);
    
    const totalAssets = availableFunds + portfolioValue;
    const totalProfit = totalAssets - initialCapital;
    const totalProfitPercent = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;
    const totalFees = transactions.reduce((sum, t) => sum + (t.feeAmount || 0), 0);
    
    return {
      initialCapital,
      totalAssets,
      totalProfit,
      totalProfitPercent,
      portfolioValue,
      totalFees,
    };
  },
  
  getPosition: (stockId: string) => {
    const { portfolio, stocks } = get();
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return undefined;
    return portfolio.find(p => p.stockCode === stock.code);
  },
  
  resetStocks: async () => {
    try {
      await stockAPI.clearAll();
    } catch (error) {
      console.error('清除数据库股票数据失败:', error);
    }
    set({ stocks: [] });
  },
  
  resetPortfolio: async () => {
    const { initialCapital } = get();

    // 清除数据库中的持仓和交易记录
    try {
      await portfolioAPI.clearAll();
      await transactionAPI.clearAll();
      await configAPI.set('availableFunds', initialCapital);
    } catch (error) {
      console.error('清除数据库失败:', error);
    }

    // 清除本地状态
    set({ portfolio: [], transactions: [], availableFunds: initialCapital });
  },
  
  positions: [],
  
  availableCash: 1000000,
}));
