export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ParsedStockData {
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

const DEFAULT_CONFIG: AIConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
};

let aiConfig = { ...DEFAULT_CONFIG };

export function setAIConfig(config: Partial<AIConfig>) {
  aiConfig = { ...aiConfig, ...config };
}

export function getAIConfig(): AIConfig {
  return { ...aiConfig };
}

export async function parseWithAI(content: string): Promise<ParsedStockData[]> {
  if (!aiConfig.apiKey) {
    throw new Error('请先配置AI API Key');
  }

  const prompt = `
你是一个专业的股票研判报告解析助手。请从以下文本中提取股票信息，格式如下：

${content}

请按照JSON格式输出，包含以下字段：
- name: 股票名称（如：贵州茅台）
- code: 股票代码（如：600519）
- price: 最新股价（数字）
- recommendation: 评级，只能是 buy（买入）、sell（卖出）、hold（持有）、increase（增持）、decrease（减持）之一
- recommendationPrice: 建议买入/卖出价格（数字，取建仓区间中间值或建议价）
- confidence: 置信度分数（0-100）
- pe: PE值（数字）
- dividend: 股息率（数字，不含百分号）
- position: 建议仓位百分比（数字）
- targetPrice: 目标价格数组，最多3个（如：[1450, 1600, 1800]）
- stopLoss: 止损位（数字）

如果某个字段无法从文本中提取，填0或空数组。确保JSON格式正确，不要有多余内容。
  `.trim();

  try {
    const response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的金融数据解析助手，擅长从文本中提取股票信息。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(resultText);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new Error('AI返回格式不正确');
    }
  } catch (error) {
    console.error('AI解析失败:', error);
    throw error;
  }
}

export function validateAIConfig(config: Partial<AIConfig>): string[] {
  const errors: string[] = [];
  if (!config.baseUrl) {
    errors.push('请填写Base URL');
  } else if (!config.baseUrl.startsWith('http')) {
    errors.push('Base URL格式不正确');
  }
  if (!config.apiKey) {
    errors.push('请填写API Key');
  }
  return errors;
}
