/**
 * 指标分析公共工具模块
 * 提供通用的指标分析功能和工具函数
 */

// 指标配置系统
const AUDIO_METRICS_CONFIG = {
  'AEC_DELAY': {
    name: 'Audio AEC Delay',
    displayName: '📊 Audio AEC Delay 统计',
    counterId: 5,
    color: '#667eea',
    backgroundColor: 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)',
    borderColor: '#667eea',
    icon: '📊',
    unit: 'ms',
    description: '音频回声消除延迟',
    thresholds: { low: 20, medium: 50, high: 100 }
  },
  'SIGNAL_LEVEL': {
    name: 'Audio Signal Level Nearin',
    displayName: '📈 Audio Signal Level Nearin 统计',
    counterId: 6,
    color: '#ff6b6b',
    backgroundColor: 'linear-gradient(135deg, #fff8f8 0%, #fce4ec 100%)',
    borderColor: '#ff6b6b',
    icon: '📈',
    unit: 'dB',
    description: '音频信号强度',
    thresholds: { low: 30, medium: 60, high: 90 }
  },
  'RECORD_VOLUME': {
    name: 'A RECORD SIGNAL VOLUME',
    displayName: '🎵 A RECORD SIGNAL VOLUME 统计',
    counterId: 7,
    color: '#4ecdc4',
    backgroundColor: 'linear-gradient(135deg, #f0fffe 0%, #e0f7fa 100%)',
    borderColor: '#4ecdc4',
    icon: '🎵',
    unit: '%',
    description: '录音音量',
    thresholds: { low: 20, medium: 50, high: 80 }
  },
  'ERROR_CODE': {
    name: 'Chat Engine Error Code',
    displayName: '⚠️ Chat Engine Error Code 统计',
    counterId: 0,
    color: '#ff9800',
    backgroundColor: 'linear-gradient(135deg, #fffbf0 0%, #f3e5f5 100%)',
    borderColor: '#ff9800',
    icon: '⚠️',
    unit: 'code',
    description: '聊天引擎错误代码',
    thresholds: { low: 0, medium: 0, high: 0 }
  }
};

// 获取所有指标配置
function getAllMetricsConfig() {
  return Object.values(AUDIO_METRICS_CONFIG);
}

// 根据指标名称获取配置
function getMetricConfig(metricName) {
  return Object.values(AUDIO_METRICS_CONFIG).find(config =>
    config.name === metricName || config.name.toUpperCase() === metricName.toUpperCase()
  );
}

// 通用数据获取函数
function getMetricData(responseText, metricName) {
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn(`getMetricData: responseText 不是有效的 JSON (${metricName})`);
    return null;
  }

  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim().toUpperCase() === metricName.toUpperCase() &&
          Array.isArray(counter.data)
        ) {
          const config = getMetricConfig(metricName);
          return {
            name: counter.name,
            counterId: counter.counter_id || counter.id || (config ? config.counterId : 0),
            data: counter.data.map(arr => ({
              timestamp: arr[0],
              value: arr[1]
            }))
          };
        }
      }
    }
  }
  return null;
}

// 通用模拟数据生成函数
function generateMockMetricData(metricName, dataPoints = 50) {
  const config = getMetricConfig(metricName);
  if (!config) {
    console.warn(`未找到指标配置: ${metricName}`);
    return null;
  }

  const baseTime = Date.now();
  const data = [];

  // 根据指标类型生成不同的模拟数据模式
  let valueRange, baseValue, variation;

  switch (metricName.toUpperCase()) {
    case 'AUDIO AEC DELAY':
      valueRange = [5, 150];
      baseValue = 50;
      variation = 20;
      break;
    case 'AUDIO SIGNAL LEVEL NEARIN':
      valueRange = [10, 100];
      baseValue = 60;
      variation = 15;
      break;
    case 'A RECORD SIGNAL VOLUME':
      valueRange = [5, 95];
      baseValue = 50;
      variation = 25;
      break;
    default:
      valueRange = [0, 100];
      baseValue = 50;
      variation = 20;
  }

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = baseTime + (i * 2000); // 每2秒一个数据点
    let value = baseValue;

    // 模拟不同的数据变化模式
    if (i < dataPoints * 0.2) {
      // 初始阶段
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.3;
    } else if (i < dataPoints * 0.6) {
      // 活跃期
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.8;
    } else if (i < dataPoints * 0.8) {
      // 峰值期
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]);
    } else {
      // 结束期
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.4;
    }

    // 添加随机波动
    value += (Math.random() - 0.5) * variation;
    value = Math.max(valueRange[0], Math.min(valueRange[1], value)); // 确保在范围内

    data.push({
      timestamp: timestamp,
      value: Math.round(value)
    });
  }

  return {
    name: config.name,
    counterId: config.counterId,
    data: data
  };
}

// 图表数据准备函数
function prepareChartData(data) {
  if (!data || !Array.isArray(data)) {
    return { labels: [], values: [] };
  }

  const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
  const labels = sortedData.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString();
  });
  const values = sortedData.map(point => point.value);

  return { labels, values };
}

// 计算平均值
function calculateAverageDelay(data) {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  const sum = data.reduce((acc, point) => acc + point.value, 0);
  return Math.round(sum / data.length);
}

// 计算最大值
function calculateMaxDelay(data) {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  return Math.max(...data.map(point => point.value));
}

// 计算变化次数
function calculateChangeCount(data) {
  if (!data || !Array.isArray(data) || data.length < 2) return 0;

  let changeCount = 0;
  for (let i = 1; i < data.length; i++) {
    const current = data[i].value;
    const previous = data[i - 1].value;
    const config = getMetricConfig(data[0].name || 'Unknown');
    const threshold = config ? getMetricThreshold(config.name) : 5;

    if (Math.abs(current - previous) > threshold) {
      changeCount++;
    }
  }
  return changeCount;
}

// 计算变化频率
function calculateChangeFrequency(data) {
  if (!data || !Array.isArray(data) || data.length < 2) return '0%';

  const changeCount = calculateChangeCount(data);
  const totalPoints = data.length;
  const frequency = (changeCount / (totalPoints - 1)) * 100;
  return frequency.toFixed(1) + '%';
}

// 获取指标变化阈值
function getMetricThreshold(metricName) {
  switch (metricName.toUpperCase()) {
    case 'AUDIO AEC DELAY':
      return 10; // AEC Delay 变化阈值
    case 'AUDIO SIGNAL LEVEL NEARIN':
      return 5;  // Signal Level 变化阈值
    case 'A RECORD SIGNAL VOLUME':
      return 8;  // Record Volume 变化阈值
    default:
      return 5;   // 默认阈值
  }
}

// 工具函数：格式化时间戳
function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// 工具函数：导出数据为CSV
function exportToCSV(data, filename) {
  const csvData = data.map(point =>
    `${formatTimestamp(point.timestamp)},${point.value}`
  ).join('\n');
  const csvContent = '时间戳,数值\n' + csvData;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 工具函数：显示通知
function showNotification(message, type = 'info') {
  // 这里可以实现通知显示逻辑
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// 工具函数：更新图表统计信息
function updateChartStats(data) {
  // 这里可以实现统计信息更新逻辑
  console.log('更新图表统计信息:', data);
}

// 工具函数：添加刷新按钮
function addRefreshButton() {
  // 这里可以实现刷新按钮添加逻辑
  console.log('添加刷新按钮');
}

// 将工具函数暴露到全局作用域，便于其他模块访问
window.getMetricConfig = getMetricConfig;
window.generateMockMetricData = generateMockMetricData;
window.getMetricData = getMetricData;
window.prepareChartData = prepareChartData;
window.calculateAverageDelay = calculateAverageDelay;
window.calculateMaxDelay = calculateMaxDelay;
window.calculateChangeCount = calculateChangeCount;
window.calculateChangeFrequency = calculateChangeFrequency;
window.getMetricThreshold = getMetricThreshold;
window.formatTimestamp = formatTimestamp;
window.exportToCSV = exportToCSV;
window.showNotification = showNotification;
window.updateChartStats = updateChartStats;
window.addRefreshButton = addRefreshButton;

// 公共工具接口
window.MetricsUtils = {
  AUDIO_METRICS_CONFIG,
  getAllMetricsConfig,
  getMetricConfig,
  getMetricData,
  generateMockMetricData,
  prepareChartData,
  calculateAverageDelay,
  calculateMaxDelay,
  calculateChangeCount,
  calculateChangeFrequency,
  getMetricThreshold,
  formatTimestamp,
  exportToCSV,
  showNotification,
  updateChartStats,
  addRefreshButton
};
