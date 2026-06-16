import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Bot, Loader2 } from 'lucide-react';
import { parseMarkdownReport, parseSimpleFormat } from '../utils/markdownParser';
import { parseExcelFile } from '../utils/excelParser';
import { parseWithAI, getAIConfig } from '../utils/aiService';
import { Stock } from '../types';

interface FileImporterProps {
  onStocksImported: (stocks: Stock[]) => void;
}

export function FileImporter({ onStocksImported }: FileImporterProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; count: number; method?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentStep('');

    try {
      let stocks: Stock[] = [];
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setCurrentStep('excel');
        stocks = await parseExcelFile(file);
        
        if (stocks.length > 0) {
          onStocksImported(stocks);
          setResult({
            success: true,
            message: 'Excel文件解析成功！',
            count: stocks.length,
            method: 'Excel解析',
          });
          return;
        }
        
        setError('Excel文件解析失败，请确保文件包含股票数据（名称、代码等列）');
        return;
      }
      
      const content = await file.text();
      
      setCurrentStep('normal');
      if (file.name.endsWith('.md')) {
        stocks = parseMarkdownReport(content);
      } else if (file.name.endsWith('.txt')) {
        stocks = parseSimpleFormat(content);
      } else {
        stocks = parseMarkdownReport(content);
      }

      if (stocks.length > 0) {
        onStocksImported(stocks);
        setResult({
          success: true,
          message: '文件解析成功！',
          count: stocks.length,
          method: '普通解析',
        });
        return;
      }

      stocks = parseSimpleFormat(content);
      if (stocks.length > 0) {
        onStocksImported(stocks);
        setResult({
          success: true,
          message: '文件解析成功！',
          count: stocks.length,
          method: '普通解析',
        });
        return;
      }

      const aiConfig = getAIConfig();
      if (!aiConfig.apiKey) {
        setError('普通解析失败，且未配置AI服务。请在AI配置中设置API Key以启用AI识别兜底功能。');
        return;
      }

      setCurrentStep('ai');
      const aiStocks = await parseWithAI(content);
      
      if (aiStocks.length > 0 && aiStocks.some(s => s.name)) {
        const convertedStocks: Stock[] = aiStocks.map((s, index) => ({
          id: `${index + 1}`,
          name: s.name || '',
          code: s.code || '',
          price: s.price,
          recommendation: s.recommendation || 'hold',
          recommendationPrice: s.recommendationPrice || s.price,
          confidence: s.confidence,
          pe: s.pe,
          dividend: s.dividend,
          position: s.position,
          targetPrice: s.targetPrice || [],
          stopLoss: s.stopLoss,
        })).filter(s => s.name);

        if (convertedStocks.length > 0) {
          onStocksImported(convertedStocks);
          setResult({
            success: true,
            message: 'AI识别解析成功！',
            count: convertedStocks.length,
            method: 'AI识别',
          });
          return;
        }
      }

      setError('普通解析和AI识别均失败，请检查文件格式或调整AI配置。');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解析失败';
      if (currentStep === 'ai') {
        setError(`AI识别失败: ${errorMessage}。请检查AI配置或使用普通解析格式。`);
      } else if (currentStep === 'excel') {
        setError(`Excel解析失败: ${errorMessage}。请确保Excel文件格式正确，包含股票名称和代码列。`);
      } else {
        setError(`解析失败: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  }, [onStocksImported]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          <h2 className="font-semibold">导入研判报告</h2>
        </div>
      </div>

      <div className="p-6">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".md,.txt,.docx,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            {loading ? '正在解析文件...' : '点击或拖拽文件到此处'}
          </p>
          <p className="text-sm text-gray-500">
            支持 .md、.txt、.docx、.xlsx、.xls 格式的研判报告
          </p>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-medium">{result.message}</p>
              {result.count > 0 && (
                <p className="text-sm">成功解析 {result.count} 只股票</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">支持的报告格式示例：</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• 股票名称（代码）：贵州茅台（600519）</p>
            <p>• 最新股价：1271.10元</p>
            <p>• 评级：买入/卖出/持有/增持/减持</p>
            <p>• 置信度：88分</p>
            <p>• PE TTM：19.21倍</p>
            <p>• 股息率：4.03%</p>
            <p>• 仓位：25%</p>
            <p>• 止损位：1180元</p>
            <p>• 建仓区间：1250-1300元</p>
          </div>
        </div>
      </div>
    </div>
  );
}
