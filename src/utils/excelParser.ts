import { Stock } from '../types';

export async function parseExcelFile(file: File): Promise<Stock[]> {
  const stocks: Stock[] = [];
  
  try {
    const data = await file.arrayBuffer();
    const workbook = await readExcel(data);
    
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = worksheetToJson(worksheet);
      
      if (jsonData.length > 0 && isStockData(jsonData)) {
        const parsedStocks = parseStockData(jsonData);
        stocks.push(...parsedStocks);
      }
    }
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Excel文件解析失败，请确保文件格式正确');
  }
  
  return stocks;
}

async function readExcel(data: ArrayBuffer): Promise<{ SheetNames: string[]; Sheets: Record<string, any> }> {
  // 简化版本：使用 XLSX 库解析
  // @ts-ignore
  if (typeof XLSX !== 'undefined') {
    // @ts-ignore
    return XLSX.read(data, { type: 'array' });
  }
  
  // 备用：尝试使用原生方式解析（简化版，仅支持基本格式）
  return parseExcelFallback(data);
}

function parseExcelFallback(data: ArrayBuffer): { SheetNames: string[]; Sheets: Record<string, any> } {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(data);
  
  if (text.includes('<?xml') || text.includes('xl/')) {
    return parseXlsxXml(text);
  }
  
  return parseCsv(text);
}

function parseXlsxXml(text: string): { SheetNames: string[]; Sheets: Record<string, any> } {
  const sheetNames: string[] = [];
  const sheets: Record<string, any> = {};
  
  const sheetNameRegex = /<sheet name="([^"]+)"[^>]*\/>/g;
  let match;
  while ((match = sheetNameRegex.exec(text)) !== null) {
    sheetNames.push(match[1]);
  }
  
  sheetNames.forEach(name => {
    sheets[name] = { '!ref': 'A1:Z100' };
  });
  
  return { SheetNames: sheetNames, Sheets: sheets };
}

function parseCsv(text: string): { SheetNames: string[]; Sheets: Record<string, any> } {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }
  
  return {
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {
        '!ref': `A1:${String.fromCharCode(65 + headers.length - 1)}${lines.length}`,
        _data: rows
      }
    }
  };
}

function worksheetToJson(worksheet: any): any[] {
  if (worksheet._data) {
    return worksheet._data;
  }
  
  const result: any[] = [];
  const range = worksheet['!ref'];
  if (!range) return result;
  
  const [, startCol, startRow, endCol, endRow] = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/) || [];
  
  if (!startCol || !endCol || !startRow || !endRow) {
    return guessWorksheetData(worksheet);
  }
  
  const headers: string[] = [];
  const startColNum = colToNum(startCol);
  const endColNum = colToNum(endCol);
  const startRowNum = parseInt(startRow);
  const endRowNum = parseInt(endRow);
  
  for (let col = startColNum; col <= endColNum; col++) {
    const cell = worksheet[`${numToCol(col)}${startRowNum}`];
    headers.push(cell ? (cell.v || cell.w || '') : '');
  }
  
  for (let row = startRowNum + 1; row <= endRowNum; row++) {
    const rowData: any = {};
    for (let col = startColNum; col <= endColNum; col++) {
      const cell = worksheet[`${numToCol(col)}${row}`];
      rowData[headers[col - startColNum]] = cell ? (cell.v || cell.w || '') : '';
    }
    if (Object.values(rowData).some(v => v && v.toString().trim())) {
      result.push(rowData);
    }
  }
  
  return result;
}

function guessWorksheetData(worksheet: any): any[] {
  const result: any[] = [];
  const cells = Object.keys(worksheet).filter(k => k.match(/^[A-Z]+\d+$/));
  
  if (cells.length === 0) return result;
  
  const rows = new Set(cells.map(c => parseInt(c.match(/\d+/)?.[0] || '0')));
  const cols = new Set(cells.map(c => c.match(/^[A-Z]+/)?.[0] || ''));
  
  const rowArray = Array.from(rows).sort((a, b) => a - b);
  const colArray = Array.from(cols).sort();
  
  const headers: string[] = [];
  const firstRow = rowArray[0];
  colArray.forEach(col => {
    const cell = worksheet[`${col}${firstRow}`];
    headers.push(cell ? (cell.v || cell.w || col) : col);
  });
  
  for (let i = 1; i < rowArray.length; i++) {
    const rowData: any = {};
    colArray.forEach((col, idx) => {
      const cell = worksheet[`${col}${rowArray[i]}`];
      rowData[headers[idx]] = cell ? (cell.v || cell.w || '') : '';
    });
    if (Object.values(rowData).some(v => v && v.toString().trim())) {
      result.push(rowData);
    }
  }
  
  return result;
}

function colToNum(col: string): number {
  let num = 0;
  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }
  return num;
}

function numToCol(num: number): string {
  let col = '';
  while (num > 0) {
    num--;
    col = String.fromCharCode(65 + (num % 26)) + col;
    num = Math.floor(num / 26);
  }
  return col;
}

function isStockData(data: any[]): boolean {
  if (data.length === 0) return false;
  
  const firstRow = data[0];
  const keys = Object.keys(firstRow).map(k => k.toLowerCase());
  
  const stockKeys = ['名称', '代码', '股票', 'stock', 'code', 'name'];
  return stockKeys.some(key => keys.includes(key) || keys.some(k => k.includes(key)));
}

function parseStockData(data: any[]): Stock[] {
  const stocks: Stock[] = [];
  
  data.forEach((row, idx) => {
    const name = findValue(row, ['名称', '股票名称', '股票', 'name', 'stock', '证券名称']);
    const code = findValue(row, ['代码', '股票代码', '证券代码', 'code', 'stockcode', 'stock_code']);
    
    if (!name || !code) return;
    
    const price = parseFloat(findValue(row, ['最新股价', '价格', '现价', 'currentprice', 'price', '最新价']) || '0');
    const recommendation = findValue(row, ['研判评级', '评级', '建议', 'recommendation', 'rating']) || 'hold';
    const confidence = parseInt(findValue(row, ['置信度', 'confidence', 'score']) || '0');
    const pe = parseFloat(findValue(row, ['PE', '市盈率', 'pe', 'ttm', 'pettm']) || '0');
    const dividend = parseFloat(findValue(row, ['股息率', '股息', 'dividend', 'yield']) || '0');
    const position = parseFloat(findValue(row, ['建议仓位', '仓位', 'position', 'weight']) || '0');
    const stopLoss = parseFloat(findValue(row, ['止损位', '止损', 'stoploss', 'stop_loss']) || '0');
    const rangeStr = findValue(row, ['建仓区间', '区间', 'range', 'buyrange']);
    const targetStr = findValue(row, ['目标价', '目标', 'target', 'targetprice']);
    
    let recPrice = price;
    if (rangeStr) {
      if (rangeStr.includes('-')) {
        const parts = rangeStr.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
        if (parts.length >= 2) {
          recPrice = (parts[0] + parts[1]) / 2;
        }
      } else {
        recPrice = parseFloat(rangeStr) || price;
      }
    }
    
    const targetPrices: number[] = [];
    if (targetStr) {
      const priceMatches = targetStr.match(/[\d.]+/g);
      if (priceMatches) {
        priceMatches.forEach(p => {
          const val = parseFloat(p);
          if (!isNaN(val) && val > 0) targetPrices.push(val);
        });
      }
    }
    
    const validRec = ['buy', 'sell', 'hold', '增持', '减持', '买入', '卖出', '持有'];
    const cleanRec = validRec.includes(recommendation) ? recommendation : 'hold';
    
    stocks.push({
      id: `${idx + 1}`,
      name: name.trim(),
      code: code.toString().padStart(6, '0'),
      price,
      recommendation: cleanRec as Stock['recommendation'],
      recommendationPrice: recPrice,
      confidence,
      pe,
      dividend,
      position,
      targetPrice: targetPrices.slice(0, 3),
      stopLoss,
    });
  });
  
  return stocks;
}

function findValue(row: any, keys: string[]): string | undefined {
  for (const key of keys) {
    const foundKey = Object.keys(row).find(k => 
      k.toLowerCase() === key.toLowerCase() || 
      k.toLowerCase().includes(key.toLowerCase())
    );
    if (foundKey) {
      const val = row[foundKey];
      return val !== undefined && val !== null ? val.toString() : undefined;
    }
  }
  return undefined;
}
