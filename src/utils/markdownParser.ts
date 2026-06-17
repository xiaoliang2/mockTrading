import { Stock } from '../types';

export function parseMarkdownReport(content: string): Stock[] {
  const stocks: Stock[] = [];
  
  // 按 ### 分割，每个 ### 开头的内容是一个股票
  const sections = content.split(/###\s+/).filter(s => s.trim().length > 0);
  
  sections.forEach((section) => {
    // 提取股票名称 - 在标题行中（第一行）
    const lines = section.split('\n');
    const titleLine = lines[0]?.trim() || '';
    
    // 跳过非股票内容（如"股票列表"、"投资组合汇总"等）
    if (titleLine.includes('股票列表') || titleLine.includes('汇总') || titleLine.includes('说明')) {
      return;
    }
    
    // 提取字段
    const nameMatch = section.match(/名称[：:]*\s*([^\n-]+)/);
    const codeMatch = section.match(/代码[：:]*\s*(\d{6})/);
    const priceMatch = section.match(/最新股价[：:]*\s*([\d.]+)/);
    const recMatch = section.match(/研判评级[：:]*\s*(买入|卖出|持有|增持|减持)/);
    const confidenceMatch = section.match(/置信度[：:]*\s*(\d+)/);
    const peMatch = section.match(/PE[\s]?TTM?[：:]*\s*([\d.]+)/);
    const dividendMatch = section.match(/股息率[：:]*\s*([\d.]+)/);
    const positionMatch = section.match(/建议仓位[：:]*\s*([\d.]+)/);
    const rangeMatch = section.match(/建仓区间[：:]*\s*([\d.-]+)/);
    const stopLossMatch = section.match(/止损位[：:]*\s*([\d.]+)/);
    const targetMatch = section.match(/目标价[：:]*\s*([\d.,\s]+)/);
    
    // 必须有名称和代码才算是有效股票
    if (!nameMatch) return;
    
    const name = nameMatch[1].trim();
    // 跳过汇总类标题
    if (name.includes('汇总') || name.includes('说明') || name.includes('使用')) {
      return;
    }
    
    // 计算建仓建议价格
    let recPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    if (rangeMatch) {
      const range = rangeMatch[1].trim();
      if (range.includes('-')) {
        const parts = range.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
        if (parts.length >= 2) {
          recPrice = (parts[0] + parts[1]) / 2;
        }
      } else {
        recPrice = parseFloat(range);
      }
    }
    
    // 解析目标价
    const targetPrices: number[] = [];
    if (targetMatch) {
      const targetStr = targetMatch[1];
      const priceMatches = targetStr.match(/[\d.]+/g);
      if (priceMatches) {
        priceMatches.forEach(p => {
          const val = parseFloat(p);
          if (!isNaN(val) && val > 0) {
            targetPrices.push(val);
          }
        });
      }
    }
    
    const stock: Stock = {
      id: `${stocks.length + 1}`,
      name: name,
      code: codeMatch ? codeMatch[1] : '',
      price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      recommendation: (recMatch ? recMatch[1] : 'hold') as Stock['recommendation'],
      recommendationPrice: recPrice,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
      pe: peMatch ? parseFloat(peMatch[1]) : 0,
      dividend: dividendMatch ? parseFloat(dividendMatch[1]) : 0,
      position: positionMatch ? parseFloat(positionMatch[1]) : 0,
      targetPrice: targetPrices.slice(0, 3),
      stopLoss: stopLossMatch ? parseFloat(stopLossMatch[1]) : 0,
    };
    
    stocks.push(stock);
  });
  
  // 如果按 ### 分割没有解析到股票，尝试备用方法
  if (stocks.length === 0) {
    return parseWithFallback(content);
  }
  
  return stocks;
}

function parseWithFallback(content: string): Stock[] {
  const stocks: Stock[] = [];
  
  // 匹配所有股票名称和代码
  const stockBlocks = content.split(/(?=###\s+[\u4e00-\u9fa5])/);
  
  stockBlocks.forEach((block) => {
    if (!block.trim()) return;
    
    const nameMatch = block.match(/名称[：:]*\s*([^\n-]+)/);
    if (!nameMatch) return;
    
    const name = nameMatch[1].trim();
    if (name.includes('汇总') || name.includes('说明')) return;
    
    const codeMatch = block.match(/代码[：:]*\s*(\d{6})/);
    const priceMatch = block.match(/最新股价[：:]*\s*([\d.]+)/);
    const recMatch = block.match(/研判评级[：:]*\s*(买入|卖出|持有|增持|减持)/);
    const confidenceMatch = block.match(/置信度[：:]*\s*(\d+)/);
    const peMatch = block.match(/PE[\s]?TTM?[：:]*\s*([\d.]+)/);
    const dividendMatch = block.match(/股息率[：:]*\s*([\d.]+)/);
    const positionMatch = block.match(/建议仓位[：:]*\s*([\d.]+)/);
    const rangeMatch = block.match(/建仓区间[：:]*\s*([\d.-]+)/);
    const stopLossMatch = block.match(/止损位[：:]*\s*([\d.]+)/);
    const targetMatch = block.match(/目标价[：:]*\s*([\d.,\s]+)/);
    
    let recPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    if (rangeMatch) {
      const range = rangeMatch[1].trim();
      if (range.includes('-')) {
        const parts = range.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
        if (parts.length >= 2) recPrice = (parts[0] + parts[1]) / 2;
      } else {
        recPrice = parseFloat(range);
      }
    }
    
    const targetPrices: number[] = [];
    if (targetMatch) {
      const priceMatches = targetMatch[1].match(/[\d.]+/g);
      if (priceMatches) {
        priceMatches.forEach(p => {
          const val = parseFloat(p);
          if (!isNaN(val) && val > 0) targetPrices.push(val);
        });
      }
    }
    
    stocks.push({
      id: `${stocks.length + 1}`,
      name: name,
      code: codeMatch ? codeMatch[1] : '',
      price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      recommendation: (recMatch ? recMatch[1] : 'hold') as Stock['recommendation'],
      recommendationPrice: recPrice,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
      pe: peMatch ? parseFloat(peMatch[1]) : 0,
      dividend: dividendMatch ? parseFloat(dividendMatch[1]) : 0,
      position: positionMatch ? parseFloat(positionMatch[1]) : 0,
      targetPrice: targetPrices.slice(0, 3),
      stopLoss: stopLossMatch ? parseFloat(stopLossMatch[1]) : 0,
    });
  });
  
  return stocks;
}

export function parseMarkdownFile(content: string): Stock[] {
  let stocks = parseMarkdownReport(content);
  
  if (stocks.length === 0) {
    stocks = parseSimpleFormat(content);
  }
  
  return stocks;
}

export function parseSimpleFormat(content: string): Stock[] {
  const stocks: Stock[] = [];
  const lines = content.split('\n');
  
  let currentStock: Partial<Stock> = {};
  
  lines.forEach((line, index) => {
    if (line.includes('股票名称') || line.includes('标的名称')) {
      if (Object.keys(currentStock).length > 0 && currentStock.name) {
        stocks.push(currentStock as Stock);
      }
      currentStock = { id: `${index}` };
    }
    
    const nameMatch = line.match(/(贵州茅台|招商银行|中国神华|药明康德|长江电力|[\u4e00-\u9fa5]{2,8})\s*\(?(\d{6})?\)?/);
    if (nameMatch && !currentStock.name) {
      currentStock.name = nameMatch[1];
      currentStock.code = nameMatch[2] || '';
    }
    
    const priceMatch = line.match(/价格[\s：:]*([\d.]+)/);
    if (priceMatch) currentStock.price = parseFloat(priceMatch[1]);
    
    const recMatch = line.match(/(买入|卖出|持有|增持|减持)/);
    if (recMatch) currentStock.recommendation = recMatch[1] as Stock['recommendation'];
    
    const recPriceMatch = line.match(/建议价[\s：:]*([\d.]+)/);
    if (recPriceMatch) currentStock.recommendationPrice = parseFloat(recPriceMatch[1]);
    
    const peMatch = line.match(/PE[\s：:]*([\d.]+)/);
    if (peMatch) currentStock.pe = parseFloat(peMatch[1]);
    
    const divMatch = line.match(/股息[\s：:]*([\d.]+)/);
    if (divMatch) currentStock.dividend = parseFloat(divMatch[1]);
    
    const confMatch = line.match(/置信度[\s：:]*(\d+)/);
    if (confMatch) currentStock.confidence = parseInt(confMatch[1]);
    
    const posMatch = line.match(/仓位[\s：:]*([\d.]+)/);
    if (posMatch) currentStock.position = parseFloat(posMatch[1]);
    
    const slMatch = line.match(/止损[\s：:]*([\d.]+)/);
    if (slMatch) currentStock.stopLoss = parseFloat(slMatch[1]);
  });
  
  if (Object.keys(currentStock).length > 0 && currentStock.name) {
    stocks.push(currentStock as Stock);
  }
  
  return stocks;
}
