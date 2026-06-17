import { Stock } from '../types';
import * as XLSX from 'xlsx';

export async function parseExcelFile(file: File): Promise<Stock[]> {
  const stocks: Stock[] = [];

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      // 使用 header: 1 直接按行读取，第一行是列名
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false });

      if (rows.length < 2) continue;

      console.log('Total rows:', rows.length);
      console.log('Header row:', rows[0]);

      // 跳过第一行（表头），从第二行开始
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // 按列索引直接读取
        const id = String(row[0] ?? '').trim();
        const name = String(row[1] ?? '').trim();
        const code = String(row[2] ?? '').trim();
        const price = parseFloat(String(row[3] ?? '0')) || 0;
        const recommendation = String(row[4] ?? 'hold').trim();
        const confidence = parseInt(String(row[5] ?? '0')) || 0;
        const pe = parseFloat(String(row[6] ?? '0')) || 0;
        const dividend = parseFloat(String(row[7] ?? '0')) || 0;
        const position = parseFloat(String(row[8] ?? '0')) || 0;
        const rangeStr = String(row[9] ?? '').trim();
        const stopLoss = parseFloat(String(row[10] ?? '0')) || 0;
        const target1 = parseFloat(String(row[11] ?? '0')) || 0;
        const target2 = parseFloat(String(row[12] ?? '0')) || 0;
        const target3 = parseFloat(String(row[13] ?? '0')) || 0;
        const industry = String(row[14] ?? '').trim();

        if (!name || !code) continue;

        const targetPrices: number[] = [];
        if (target1 > 0) targetPrices.push(target1);
        if (target2 > 0) targetPrices.push(target2);
        if (target3 > 0) targetPrices.push(target3);

        console.log(`Row ${i}: name=${name}, code=${code}, target1=${target1}, target2=${target2}, target3=${target3} -> ${JSON.stringify(targetPrices)}`);

        let recPrice = price;
        if (rangeStr && rangeStr.includes('-')) {
          const parts = rangeStr.split('-').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
          if (parts.length >= 2) {
            recPrice = (parts[0] + parts[1]) / 2;
          }
        } else if (rangeStr) {
          recPrice = parseFloat(rangeStr) || price;
        }

        const validRec = ['buy', 'sell', 'hold', '增持', '减持', '买入', '卖出', '持有'];
        const cleanRec = validRec.includes(recommendation) ? recommendation : 'hold';

        stocks.push({
          id: id || `${i}`,
          name,
          code: code.padStart(6, '0'),
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
      }
    }
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('Excel文件解析失败，请确保文件格式正确');
  }

  return stocks;
}
