import { create } from 'zustand';
import { Stock, Position, Trade, PortfolioStats } from '../types';
import { initialStocks } from '../data/stocks';

interface TradingState {
  stocks: Stock[];
  positions: Position[];
  trades: Trade[];
  availableCash: number;
  initialCapital: number;
  feeRate: number;
  
  setFeeRate: (rate: number) => void;
  buyStock: (stockId: string, price: number, quantity: number, feeRate: number) => boolean;
  sellStock: (stockId: string, price: number, quantity: number, feeRate: number) => boolean;
  updateStockPrice: (stockId: string, price: number) => void;
  updateRecommendation: (stockId: string, recommendation: Stock['recommendation']) => void;
  updateRecommendationPrice: (stockId: string, price: number) => void;
  resetPortfolio: () => void;
  setStocks: (stocks: Stock[]) => void;
  resetStocks: () => void;
  getStats: () => PortfolioStats;
  getPosition: (stockId: string) => Position | undefined;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  stocks: initialStocks,
  positions: [],
  trades: [],
  availableCash: 1000000,
  initialCapital: 1000000,
  feeRate: 0.0025,

  setFeeRate: (rate) => set({ feeRate: rate }),

  buyStock: (stockId, price, quantity, feeRate) => {
    const { availableCash, positions, stocks, trades } = get();
    const totalCost = price * quantity * (1 + feeRate);
    
    if (totalCost > availableCash) {
      return false;
    }

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return false;

    const existingPosition = positions.find(p => p.stockId === stockId);
    let newPositions: Position[];

    if (existingPosition) {
      const totalQuantity = existingPosition.quantity + quantity;
      const newAvgCost = (existingPosition.avgCost * existingPosition.quantity + price * quantity) / totalQuantity;
      newPositions = positions.map(p => 
        p.stockId === stockId 
          ? { ...p, quantity: totalQuantity, avgCost: newAvgCost, currentPrice: stock.price }
          : p
      );
    } else {
      newPositions = [
        ...positions,
        {
          stockId,
          stockName: stock.name,
          stockCode: stock.code,
          quantity,
          avgCost: price,
          currentPrice: stock.price,
        }
      ];
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      stockId,
      stockName: stock.name,
      stockCode: stock.code,
      type: 'buy',
      quantity,
      price,
      feeRate,
      totalCost,
      timestamp: new Date(),
    };

    set({
      availableCash: availableCash - totalCost,
      positions: newPositions,
      trades: [newTrade, ...trades],
    });

    return true;
  },

  sellStock: (stockId, price, quantity, feeRate) => {
    const { positions, stocks, trades, availableCash } = get();
    const position = positions.find(p => p.stockId === stockId);
    
    if (!position || position.quantity < quantity) {
      return false;
    }

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return false;

    const revenue = price * quantity * (1 - feeRate);
    let newPositions: Position[];

    if (position.quantity === quantity) {
      newPositions = positions.filter(p => p.stockId !== stockId);
    } else {
      newPositions = positions.map(p => 
        p.stockId === stockId 
          ? { ...p, quantity: p.quantity - quantity, currentPrice: stock.price }
          : p
      );
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      stockId,
      stockName: stock.name,
      stockCode: stock.code,
      type: 'sell',
      quantity,
      price,
      feeRate,
      totalCost: revenue,
      timestamp: new Date(),
    };

    set({
      availableCash: availableCash + revenue,
      positions: newPositions,
      trades: [newTrade, ...trades],
    });

    return true;
  },

  updateStockPrice: (stockId, price) => {
    set(state => ({
      stocks: state.stocks.map(s => 
        s.id === stockId ? { ...s, price } : s
      ),
      positions: state.positions.map(p => 
        p.stockId === stockId ? { ...p, currentPrice: price } : p
      ),
    }));
  },

  updateRecommendation: (stockId, recommendation) => {
    set(state => ({
      stocks: state.stocks.map(s => 
        s.id === stockId ? { ...s, recommendation } : s
      ),
    }));
  },

  updateRecommendationPrice: (stockId, price) => {
    set(state => ({
      stocks: state.stocks.map(s => 
        s.id === stockId ? { ...s, recommendationPrice: price } : s
      ),
    }));
  },

  resetPortfolio: () => {
    set({
      positions: [],
      trades: [],
      availableCash: 1000000,
      initialCapital: 1000000,
    });
  },

  setStocks: (stocks) => {
    set({ stocks });
  },

  resetStocks: () => {
    set({ stocks: initialStocks });
  },

  getStats: () => {
    const { positions, availableCash, initialCapital } = get();
    const totalStockValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const totalAssets = totalStockValue + availableCash;
    const totalProfit = totalAssets - initialCapital;
    const totalProfitPercent = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

    return {
      totalAssets,
      totalProfit,
      totalProfitPercent,
      initialCapital,
      availableCash,
    };
  },

  getPosition: (stockId) => {
    return get().positions.find(p => p.stockId === stockId);
  },
}));
