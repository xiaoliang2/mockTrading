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

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  stockCode: string;
  stockName: string;
  price: number;
  quantity: number;
  totalAmount: number;
  feeRate: number;
  feeAmount: number;
  timestamp: Date;
  userNote: string;
  dateTag?: Date;
}

export interface PortfolioItem {
  id?: string;
  stockCode: string;
  stockName: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  profit: number;
  profitPercent: number;
  updatedAt?: Date;
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
