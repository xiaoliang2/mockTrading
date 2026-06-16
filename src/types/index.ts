export interface Stock {
  id: string;
  name: string;
  code: string;
  price: number;
  recommendation: 'buy' | 'sell' | 'hold' | 'increase' | 'decrease';
  recommendationPrice: number;
  confidence: number;
  pe: number;
  dividend: number;
  position: number;
  targetPrice: number[];
  stopLoss: number;
}

export interface Position {
  stockId: string;
  stockName: string;
  stockCode: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

export interface Trade {
  id: string;
  stockId: string;
  stockName: string;
  stockCode: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  feeRate: number;
  totalCost: number;
  timestamp: Date;
}

export interface PortfolioStats {
  totalAssets: number;
  totalProfit: number;
  totalProfitPercent: number;
  initialCapital: number;
  availableCash: number;
}
