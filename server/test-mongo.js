const mongoose = require('mongoose');

const mongoUri = 'mongodb://admin:password@localhost:27017/mockTrading?authSource=admin';

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB 连接成功');
    
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('Test', testSchema);
    const testDoc = new TestModel({ name: 'test' });
    await testDoc.save();
    console.log('文档插入成功');
    
    const docs = await TestModel.find();
    console.log('查询结果:', docs);
    
    await mongoose.disconnect();
    console.log('连接已断开');
  } catch (err) {
    console.error('错误:', err);
    process.exit(1);
  }
}

testConnection();