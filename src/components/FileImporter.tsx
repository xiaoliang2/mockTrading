import { useState, useRef } from 'react';
import { Upload, FileText, X, Calendar } from 'lucide-react';
import { Stock } from '../types';
import { parseExcelFile } from '../utils/excelParser';
import { parseMarkdownFile } from '../utils/markdownParser';
import { parseWithAI } from '../utils/aiService';
import { DatePicker } from './DatePicker';

interface FileImporterProps {
  onStocksImported: (stocks: Stock[]) => void;
}

export function FileImporter({ onStocksImported }: FileImporterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<Date | null>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setMessage(null);
    setUploadedFile(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMessage(null);
    setUploadedFile(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const processFile = async () => {
    if (!uploadedFile) {
      setMessage({ type: 'error', text: '请先选择文件' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      let stocks: Stock[] = [];
      const fileName = uploadedFile.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        stocks = await parseExcelFile(uploadedFile);
      } else if (fileName.endsWith('.md')) {
        const text = await uploadedFile.text();
        stocks = parseMarkdownFile(text);
      }

      if (stocks.length === 0) {
        const text = await uploadedFile.text();
        const aiStocks = await parseWithAI(text);
        stocks = aiStocks.map((stock, idx) => ({
          ...stock,
          id: `${idx + 1}`,
        }));
      }

      if (stocks.length > 0) {
        const date = reportDate || new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const stocksWithDate = stocks.map(s => ({ ...s, date: dateStr }));

        // 保存到 MongoDB
        try {
          const response = await fetch('http://localhost:5000/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stocks: stocksWithDate,
              dateTag: dateStr
            })
          });
          const result = await response.json();
          if (result.success) {
            console.log('已保存到数据库:', result.count, '只股票');
          } else {
            console.error('保存到数据库失败:', result.message);
          }
        } catch (dbError) {
          console.error('保存到数据库出错:', dbError);
        }

        onStocksImported(stocksWithDate);
        setMessage({ type: 'success', text: `成功导入 ${stocks.length} 只股票` });
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: '未能从文件中提取股票数据' });
      }
    } catch (error) {
      console.error('File processing error:', error);
      setMessage({ type: 'error', text: '文件解析失败: ' + (error as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-medium hover:from-rose-700 hover:to-pink-700 transition-all shadow-sm"
      >
        <Upload className="w-4 h-4" />
        <span>导入研判报告</span>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h2 className="font-semibold">导入研判报告</h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3 flex-wrap">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-800 whitespace-nowrap">研判报告日期:</span>
                <DatePicker
                  selectedDate={{ date: reportDate }}
                  onChange={(value: { date: Date | null }) => setReportDate(value.date)}
                />
                {reportDate && (
                  <span className="text-xs text-blue-600 font-medium">
                {`${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`}
                  </span>
                )}
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.md,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">
                      {uploading ? '正在解析文件...' : '点击或拖拽文件到此处上传'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      支持 Excel (.xlsx, .xls) 和 Markdown (.md) 格式
                    </p>
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{uploadedFile.name}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={processFile}
                  disabled={!uploadedFile || uploading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? '解析中...' : '开始导入'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
