/**
 * Playout Volume 指标分析模块
 * 负责处理 A PLAYOUT SIGNAL VOLUME 相关的所有分析功能
 * ES6 模块版本
 * 
 * 注意：此模块仅专注于 Playout Volume 数据处理，不依赖其他 metrics 模块
 * 各个模块之间的协调由 content.js 负责
 */

// ES6 箭头函数导出 - 获取指标数据（通用函数）
const getMetricData = (responseText, metricName) => {
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
          return {
            name: counter.name,
            counterId: counter.counter_id || counter.id || 8,
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

// ES6 箭头函数导出
export const getAPlayoutSignalVolumeData = (responseText) => {
  return getMetricData(responseText, 'A PLAYOUT SIGNAL VOLUME');
}

// ES6 箭头函数导出 - 生成模拟的 A PLAYOUT SIGNAL VOLUME 数据
export const generateMockAPlayoutSignalVolumeData = (dataPoints = 50) => {
  const baseTime = Date.now();
  const data = [];
  const valueRange = [5, 95];
  const baseValue = 50;
  const variation = 25;

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = baseTime + (i * 2000);
    let value = baseValue;

    if (i < dataPoints * 0.2) {
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.3;
    } else if (i < dataPoints * 0.6) {
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.8;
    } else if (i < dataPoints * 0.8) {
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]);
    } else {
      value = valueRange[0] + Math.random() * (valueRange[1] - valueRange[0]) * 0.4;
    }

    value += (Math.random() - 0.5) * variation;
    value = Math.max(valueRange[0], Math.min(valueRange[1], value));

    data.push({
      timestamp: timestamp,
      value: Math.round(value)
    });
  }

  return {
    name: 'A PLAYOUT SIGNAL VOLUME',
    counterId: 8,
    data: data
  };
}

// ES6 箭头函数导出 - 准备图表数据
export const prepareChartData = (data) => {
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

// ES6 箭头函数导出 - 创建 Playout Volume 图表
export const createPlayoutVolumeChart = (playoutSignalVolumeData) => {
  const canvas = document.getElementById('playoutVolumeChart');
  if (!canvas) return;

  const prepared = prepareChartData(playoutSignalVolumeData.data);

  if (window.playoutVolumeChartInstance) {
    window.playoutVolumeChartInstance.destroy();
  }

  window.playoutVolumeChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: prepared.labels,
      datasets: [{
        label: 'Playout Volume',
        data: prepared.values,
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#9b59b6',
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
        title: { display: true, text: 'A Playout Signal Volume 时间序列' },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              const i = context[0].dataIndex;
              const ts = playoutSignalVolumeData.data[i].timestamp;
              return new Date(ts).toLocaleString();
            },
            label: function(context) {
              return `Playout Volume: ${context.parsed.y}`;
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
          title: { display: true, text: 'Playout Volume' },
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
  getAPlayoutSignalVolumeData,
  generateMockAPlayoutSignalVolumeData,
  prepareChartData,
  createPlayoutVolumeChart
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.PlayoutVolumeMetrics = {
    getAPlayoutSignalVolumeData,
    generateMockAPlayoutSignalVolumeData,
    prepareChartData,
    createPlayoutVolumeChart
  };
}

console.log('✅ playout-volume.js ES6 模块已加载');
