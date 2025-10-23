/**
 * Signal Level 指标分析模块
 * 负责处理 Audio Signal Level Nearin 相关的所有分析功能
 * ES6 模块版本
 */

// 导入 metrics-utils 模块的函数
import { generateMockMetricData, prepareChartData } from './metrics-utils.js';

// ES6 箭头函数导出
export const getAudioSignalLevelNearinData = (responseText) => {
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getAudioSignalLevelNearinData: responseText 不是有效的 JSON');
    return null;
  }

  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim().toUpperCase() === 'AUDIO SIGNAL LEVEL NEARIN' &&
          Array.isArray(counter.data)
        ) {
          return {
            name: counter.name,
            counterId: counter.counter_id || counter.id || 6,
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

// ES6 箭头函数导出 - 生成模拟的 Audio Signal Level Nearin 数据（保持向后兼容）
export const generateMockAudioSignalLevelNearinData = () => {
  return generateMockMetricData('Audio Signal Level Nearin');
}

// ES6 箭头函数导出 - 创建 Signal Level 图表
export const createSignalLevelChart = (signalLevelData) => {
  const canvas = document.getElementById('signalLevelChart');
  if (!canvas) return;

  const prepared = prepareChartData(signalLevelData.data);

  if (window.signalLevelChartInstance) {
    window.signalLevelChartInstance.destroy();
  }

  window.signalLevelChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: prepared.labels,
      datasets: [{
        label: 'Signal Level',
        data: prepared.values,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#ff6b6b',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'Audio Signal Level Nearin 时间序列' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              const i = context[0].dataIndex;
              const ts = signalLevelData.data[i].timestamp;
              return new Date(ts).toLocaleString();
            },
            label: function(context) {
              return `Signal Level: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: '时间' },
          ticks: { autoSkip: true, maxTicksLimit: 10 }
        },
        y: {
          display: true,
          title: { display: true, text: 'Signal Level' },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}

// ES6 默认导出
export default {
  getAudioSignalLevelNearinData,
  generateMockAudioSignalLevelNearinData,
  createSignalLevelChart
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.SignalLevelMetrics = {
    getAudioSignalLevelNearinData,
    generateMockAudioSignalLevelNearinData,
    createSignalLevelChart
  };
}

console.log('✅ signal-level.js ES6 模块已加载');
