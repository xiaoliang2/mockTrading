const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/mockTrading', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => console.error('MongoDB 连接失败:', err));

const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  filepath: String,
  uploadTime: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
  parsedStocks: { type: Array, default: [] },
  error: String,
  dateTag: { type: Date, default: Date.now }
});

const StockSchema = new mongoose.Schema({
  name: String,
  code: String,
  price: Number,
  recommendation: String,
  recommendationPrice: Number,
  confidence: Number,
  pe: Number,
  dividend: Number,
  position: Number,
  targetPrice: { type: Array, default: [] },
  stopLoss: Number,
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  createdAt: { type: Date, default: Date.now },
  dateTag: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['buy', 'sell'] },
  stockCode: String,
  stockName: String,
  price: Number,
  quantity: Number,
  totalAmount: Number,
  feeRate: Number,
  feeAmount: Number,
  timestamp: { type: Date, default: Date.now },
  dateTag: { type: Date, default: Date.now },
  userNote: String
});

const PortfolioSchema = new mongoose.Schema({
  stockCode: String,
  stockName: String,
  quantity: Number,
  avgCost: Number,
  currentPrice: Number,
  marketValue: Number,
  profit: Number,
  profitPercent: Number,
  updatedAt: { type: Date, default: Date.now }
});

const DailySnapshotSchema = new mongoose.Schema({
  date: { type: Date, unique: true },
  totalAssets: Number,
  availableFunds: Number,
  portfolioValue: Number,
  totalProfit: Number,
  totalTransactions: Number,
  createdAt: { type: Date, default: Date.now }
});

const UserConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updatedAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', FileSchema);
const Stock = mongoose.model('Stock', StockSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
const DailySnapshot = mongoose.model('DailySnapshot', DailySnapshotSchema);
const UserConfig = mongoose.model('UserConfig', UserConfigSchema);

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      status: 'uploaded',
      dateTag: new Date()
    });
    await file.save();
    res.json({ success: true, fileId: file._id, message: '文件上传成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query = { uploadTime: { $gte: targetDate, $lt: nextDate } };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = { uploadTime: { $gte: start, $lte: end } };
    }
    
    const files = await File.find(query).sort({ uploadTime: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/files/by-date', async (req, res) => {
  try {
    const files = await File.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$uploadTime' },
            month: { $month: '$uploadTime' },
            day: { $dayOfMonth: '$uploadTime' }
          },
          count: { $sum: 1 },
          files: { $push: '$$ROOT' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);
    
    const result = files.map(group => ({
      date: `${group._id.year}-${String(group._id.month).padStart(2, '0')}-${String(group._id.day).padStart(2, '0')}`,
      count: group.count,
      files: group.files
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/files/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    res.json(file);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }
    res.json({ success: true, message: '文件删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/stocks', async (req, res) => {
  try {
    const stocks = req.body.stocks;
    const dateTag = req.body.dateTag || new Date();
    
    if (!Array.isArray(stocks)) {
      return res.status(400).json({ success: false, message: '数据格式错误' });
    }

    const stocksWithDate = stocks.map(stock => ({
      ...stock,
      dateTag: new Date(dateTag)
    }));
    
    const savedStocks = await Stock.insertMany(stocksWithDate);
    res.json({ success: true, count: savedStocks.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/stocks', async (req, res) => {
  try {
    const { date, startDate, endDate, latest } = req.query;
    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query = { dateTag: { $gte: targetDate, $lt: nextDate } };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = { dateTag: { $gte: start, $lte: end } };
    }
    
    let stocks = await Stock.find(query).sort({ createdAt: -1 });
    
    if (latest === 'true') {
      const latestByCode = {};
      stocks.forEach(stock => {
        if (!latestByCode[stock.code] || stock.createdAt > latestByCode[stock.code].createdAt) {
          latestByCode[stock.code] = stock;
        }
      });
      stocks = Object.values(latestByCode);
    }
    
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/stocks/by-date', async (req, res) => {
  try {
    const stocks = await Stock.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$dateTag' },
            month: { $month: '$dateTag' },
            day: { $dayOfMonth: '$dateTag' }
          },
          count: { $sum: 1 },
          stocks: { $push: '$$ROOT' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);
    
    const result = stocks.map(group => ({
      date: `${group._id.year}-${String(group._id.month).padStart(2, '0')}-${String(group._id.day).padStart(2, '0')}`,
      count: group.count,
      stocks: group.stocks
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/stocks/:id', async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: '股票不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      dateTag: new Date()
    });
    await transaction.save();
    res.json({ success: true, transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query = { dateTag: { $gte: targetDate, $lt: nextDate } };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = { dateTag: { $gte: start, $lte: end } };
    }
    
    const transactions = await Transaction.find(query).sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/transactions/by-date', async (req, res) => {
  try {
    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$dateTag' },
            month: { $month: '$dateTag' },
            day: { $dayOfMonth: '$dateTag' }
          },
          count: { $sum: 1 },
          totalBuyAmount: { $sum: { $cond: [{ $eq: ['$type', 'buy'] }, '$totalAmount', 0] } },
          totalSellAmount: { $sum: { $cond: [{ $eq: ['$type', 'sell'] }, '$totalAmount', 0] } },
          transactions: { $push: '$$ROOT' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);
    
    const result = transactions.map(group => ({
      date: `${group._id.year}-${String(group._id.month).padStart(2, '0')}-${String(group._id.day).padStart(2, '0')}`,
      count: group.count,
      totalBuyAmount: group.totalBuyAmount,
      totalSellAmount: group.totalSellAmount,
      transactions: group.transactions
    }));
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/portfolio', async (req, res) => {
  try {
    const { stockCode, stockName, quantity, avgCost, currentPrice } = req.body;
    
    let portfolio = await Portfolio.findOne({ stockCode });
    
    if (portfolio) {
      const totalCost = portfolio.avgCost * portfolio.quantity + avgCost * quantity;
      const totalQuantity = portfolio.quantity + quantity;
      portfolio.quantity = totalQuantity;
      portfolio.avgCost = totalCost / totalQuantity;
    } else {
      portfolio = new Portfolio({
        stockCode,
        stockName,
        quantity,
        avgCost,
        currentPrice
      });
    }
    
    portfolio.currentPrice = currentPrice;
    portfolio.marketValue = portfolio.quantity * currentPrice;
    portfolio.profit = (currentPrice - portfolio.avgCost) * portfolio.quantity;
    portfolio.profitPercent = ((currentPrice - portfolio.avgCost) / portfolio.avgCost) * 100;
    portfolio.updatedAt = Date.now();
    
    await portfolio.save();
    res.json({ success: true, portfolio });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await Portfolio.find().sort({ marketValue: -1 });
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/portfolio/:stockCode', async (req, res) => {
  try {
    const { quantity, currentPrice } = req.body;
    let portfolio = await Portfolio.findOne({ stockCode: req.params.stockCode });
    
    if (!portfolio) {
      return res.status(404).json({ success: false, message: '持仓不存在' });
    }
    
    portfolio.quantity += quantity;
    portfolio.currentPrice = currentPrice;
    portfolio.marketValue = portfolio.quantity * currentPrice;
    portfolio.profit = (currentPrice - portfolio.avgCost) * portfolio.quantity;
    portfolio.profitPercent = ((currentPrice - portfolio.avgCost) / portfolio.avgCost) * 100;
    portfolio.updatedAt = Date.now();
    
    if (portfolio.quantity <= 0) {
      await portfolio.deleteOne();
      res.json({ success: true, message: '持仓已清空' });
    } else {
      await portfolio.save();
      res.json({ success: true, portfolio });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/portfolio/:stockCode', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ stockCode: req.params.stockCode });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: '持仓不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/daily-snapshot', async (req, res) => {
  try {
    const { totalAssets, availableFunds, portfolioValue, totalProfit, totalTransactions } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let snapshot = await DailySnapshot.findOne({ date: today });
    
    if (snapshot) {
      snapshot.totalAssets = totalAssets;
      snapshot.availableFunds = availableFunds;
      snapshot.portfolioValue = portfolioValue;
      snapshot.totalProfit = totalProfit;
      snapshot.totalTransactions = totalTransactions;
    } else {
      snapshot = new DailySnapshot({
        date: today,
        totalAssets,
        availableFunds,
        portfolioValue,
        totalProfit,
        totalTransactions
      });
    }
    
    await snapshot.save();
    res.json({ success: true, snapshot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/daily-snapshot', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let query = {};
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query = { date: targetDate };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = { date: { $gte: start, $lte: end } };
    }
    
    const snapshots = await DailySnapshot.find(query).sort({ date: -1 });
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { dateTag: { $gte: start, $lte: end } };
    }
    
    const [files, transactions, stocks] = await Promise.all([
      File.countDocuments(dateFilter),
      Transaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalBuy: { $sum: { $cond: [{ $eq: ['$type', 'buy'] }, '$totalAmount', 0] } },
            totalSell: { $sum: { $cond: [{ $eq: ['$type', 'sell'] }, '$totalAmount', 0] } },
            count: { $sum: 1 }
          }
        }
      ]),
      Stock.countDocuments(dateFilter)
    ]);
    
    const stats = {
      totalFiles: files,
      totalTransactions: transactions[0]?.count || 0,
      totalBuyAmount: transactions[0]?.totalBuy || 0,
      totalSellAmount: transactions[0]?.totalSell || 0,
      totalStocks: stocks,
      dateRange: startDate && endDate ? `${startDate} - ${endDate}` : '全部时间'
    };
    
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const { key, value } = req.body;
    let config = await UserConfig.findOne({ key });
    
    if (config) {
      config.value = value;
    } else {
      config = new UserConfig({ key, value });
    }
    
    config.updatedAt = Date.now();
    await config.save();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/config/:key', async (req, res) => {
  try {
    const config = await UserConfig.findOne({ key: req.params.key });
    if (!config) {
      return res.json({ success: true, value: null });
    }
    res.json({ success: true, value: config.value });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const configs = await UserConfig.find();
    const result = {};
    configs.forEach(c => {
      result[c.key] = c.value;
    });
    res.json({ success: true, configs: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
