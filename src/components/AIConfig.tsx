import { useState } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { setAIConfig, getAIConfig, validateAIConfig, AIConfig as AIConfigType } from '../utils/aiService';

const PRESET_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-sonnet',
  'claude-3-opus',
];

export function AIConfigPanel() {
  const currentConfig = getAIConfig();
  const [config, setConfig] = useState<AIConfigType>(currentConfig);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleSave = () => {
    const errors = validateAIConfig(config);
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('；') });
      return;
    }
    
    setAIConfig(config);
    setMessage({ type: 'success', text: 'AI配置保存成功！' });
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReset = () => {
    setConfig({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4',
    });
    setAIConfig({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4',
    });
    setMessage({ type: 'success', text: '已重置为默认配置' });
  };

  const handleModelSelect = (model: string) => {
    setConfig({ ...config, model });
    setShowModelDropdown(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          <h2 className="font-semibold">AI识别配置</h2>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
            解析兜底方案
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            当文件解析失败时，系统会尝试使用AI识别来提取股票信息。请配置您的AI服务提供商信息。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="如：https://api.openai.com/v1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="sk-..."
          />
          <p className="text-xs text-gray-500 mt-1">
            建议使用环境变量或安全方式存储API Key
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型名称
          </label>
          <div className="relative">
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              onClick={() => setShowModelDropdown(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
              placeholder="输入模型名称或选择预设"
            />
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showModelDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-2">
                  {PRESET_MODELS.map((model) => (
                    <button
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      className={`w-full px-4 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors ${
                        config.model === model ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 my-2"></div>
                  <p className="px-4 py-2 text-xs text-gray-500">
                    或直接在输入框中输入自定义模型名称
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            重置
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">支持的AI提供商</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-800">OpenAI</p>
              <p className="text-xs text-gray-500">https://api.openai.com/v1</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-800">Azure OpenAI</p>
              <p className="text-xs text-gray-500">https://xxx.openai.azure.com/openai/deployments/xxx</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-800">国内服务商</p>
              <p className="text-xs text-gray-500">如：豆包、讯飞星火等</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-800">自定义</p>
              <p className="text-xs text-gray-500">兼容OpenAI API格式</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
