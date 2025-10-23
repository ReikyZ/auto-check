/**
 * Record Volume 指标分析模块
 * 负责处理 A RECORD SIGNAL VOLUME 相关的所有分析功能
 * ES6 模块版本
 */

// 导入 metrics-utils 模块的函数
import { getMetricData, generateMockMetricData, prepareChartData } from './metrics-utils.js';

// ES6 箭头函数导出
export const getARecordSignalVolumeData = (responseText) => {
  return getMetricData(responseText, 'A RECORD SIGNAL VOLUME');
}

// ES6 箭头函数导出 - 生成模拟的 A RECORD SIGNAL VOLUME 数据（保持向后兼容）
export const generateMockARecordSignalVolumeData = () => {
  return generateMockMetricData('A RECORD SIGNAL VOLUME');
}

// ES6 箭头函数导出 - 创建 Record Volume 图表
export const createRecordVolumeChart = (recordSignalVolumeData) => {
  const canvas = document.getElementById('recordVolumeChart');
  if (!canvas) return;

  const prepared = prepareChartData(recordSignalVolumeData.data);

  if (window.recordVolumeChartInstance) {
    window.recordVolumeChartInstance.destroy();
  }

  window.recordVolumeChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: prepared.labels,
      datasets: [{
        label: 'Record Volume',
        data: prepared.values,
        borderColor: '#4ecdc4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#4ecdc4',
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
        title: { display: true, text: 'A Record Signal Volume 时间序列' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              const i = context[0].dataIndex;
              const ts = recordSignalVolumeData.data[i].timestamp;
              return new Date(ts).toLocaleString();
            },
            label: function(context) {
              return `Record Volume: ${context.parsed.y}`;
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
          title: { display: true, text: 'Record Volume' },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}

// ES6 箭头函数导出 - 创建组合图表
export const createCombinedChart = (aecDelayData, signalLevelData, recordSignalVolumeData) => {
  const canvas = document.getElementById('combinedChart');
  if (!canvas) return;

  const aecPrepared = prepareChartData(aecDelayData.data);
  const signalPrepared = prepareChartData(signalLevelData.data);
  const recordPrepared = prepareChartData(recordSignalVolumeData.data);

  if (window.combinedChartInstance) {
    window.combinedChartInstance.destroy();
  }

  window.combinedChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: aecPrepared.labels,
      datasets: [
        {
          label: 'AEC Delay (ms)',
          data: aecPrepared.values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Signal Level',
          data: signalPrepared.values,
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#ff6b6b',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'y1'
        },
        {
          label: 'Record Volume',
          data: recordPrepared.values,
          borderColor: '#4ecdc4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#4ecdc4',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'AEC Delay, Signal Level & Record Volume 组合分析' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              const i = context[0].dataIndex;
              const ts = aecDelayData.data[i].timestamp;
              return new Date(ts).toLocaleString();
            },
            label: function(context) {
              const dataset = context.dataset;
              let value = context.parsed.y;
              if (dataset.label === 'AEC Delay (ms)') {
                return `AEC Delay: ${value}ms`;
              } else if (dataset.label === 'Signal Level') {
                return `Signal Level: ${value}`;
              } else if (dataset.label === 'Record Volume') {
                return `Record Volume: ${value}`;
              }
              return `${dataset.label}: ${value}`;
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
          position: 'left',
          title: { display: true, text: 'AEC Delay (ms)' },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        },
        y1: {
          display: true,
          position: 'right',
          title: { display: true, text: 'Signal Level' },
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        },
        y2: {
          display: false,
          position: 'right',
          title: { display: true, text: 'Record Volume' },
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    }
  });
}

// ES6 默认导出
export default {
  getARecordSignalVolumeData,
  generateMockARecordSignalVolumeData,
  createRecordVolumeChart,
  createCombinedChart
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.RecordVolumeMetrics = {
    getARecordSignalVolumeData,
    generateMockARecordSignalVolumeData,
    createRecordVolumeChart,
    createCombinedChart
  };
}

console.log('✅ record-volume.js ES6 模块已加载');
