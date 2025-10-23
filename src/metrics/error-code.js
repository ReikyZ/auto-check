/**
 * Error Code 指标分析模块
 * 负责处理 Chat Engine Error Code 相关的所有分析功能
 * ES6 模块版本
 */

// ES6 箭头函数导出 - 获取并聚合 Chat Engine Last Error 数据
export const getChatEngineErrorData = (responseText) => {
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getChatEngineErrorData: responseText 不是有效的 JSON');
    return null;
  }

  // 定义需要提取的错误指标名称
  const errorMetricNames = [
    'Chat Engine Last Error 1',
    'Chat Engine Last Error 2',
    'Chat Engine Last Error 3'
  ];

  // 提取所有错误指标的数据
  const allErrorData = [];
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (counter && typeof counter.name === 'string' && Array.isArray(counter.data)) {
          const name = counter.name.trim();
          if (errorMetricNames.includes(name)) {
            allErrorData.push(...counter.data);
          }
        }
      }
    }
  }

  // 按时间戳聚合数据，排除 null、-1、0 的值
  const aggregatedMap = new Map();

  // 辅助函数：检查是否为有效错误代码
  const isValidErrorCode = (value) => {
    return value !== null && value !== -1 && value !== 0;
  };

  // 辅助函数：添加错误代码到聚合映射
  const addErrorCode = (timestamp, value) => {
    if (isValidErrorCode(value)) {
      if (!aggregatedMap.has(timestamp)) {
        aggregatedMap.set(timestamp, []);
      }
      aggregatedMap.get(timestamp).push(value);
    }
  };

  // 聚合所有错误数据
  allErrorData.forEach(([timestamp, value]) => {
    addErrorCode(timestamp, value);
  });

  // 转换为数组格式，保留同一时间戳的所有错误代码
  const aggregatedData = Array.from(aggregatedMap.entries())
    .map(([timestamp, values]) =>
      values.map(value => ({ timestamp, value }))
    )
    .flat();

  // 如果没有任何有效数据，返回 null
  if (aggregatedData.length === 0) {
    return null;
  }

  return {
    name: 'Chat Engine Error Code',
    counterId: 0, // 聚合数据没有单一 counter_id
    data: aggregatedData
  };
}

// ES6 默认导出
export default {
  getChatEngineErrorData
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.ErrorCodeMetrics = {
    getChatEngineErrorData
  };
}

console.log('✅ error-code.js ES6 模块已加载');
