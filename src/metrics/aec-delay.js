/**
 * AEC Delay 指标分析模块
 * 负责处理 Audio AEC Delay 相关的所有分析功能
 * ES6 模块版本
 * 
 * 注意：此模块仅专注于 AEC Delay 数据处理，不依赖其他 metrics 模块
 * 各个模块之间的协调由 content.js 负责
 */

// ES6 箭头函数导出 - 查找AEC Delay数据
export const findAecDelayData = (countersData) => {
  for (const counter of countersData) {
    if (counter.aecDelayData) {
      return counter.aecDelayData;
    }
  }
  return null;
}

// 注意：showAecDelayAnalysis 函数已移除
// 组合多个指标的显示应由 content.js 负责协调各个模块调用

// ES6 箭头函数导出
export const generateAecDelayDataFromParsed = (parsed) => {
  // 期望结构: 数组 -> item.data(数组) -> counter.name === "Audio AEC Delay" 且 counter.data 数组 [timestamp, value]
  if (!parsed || !Array.isArray(parsed)) return null;
  for (const item of parsed) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (counter && counter.name === 'Audio AEC Delay' && Array.isArray(counter.data)) {
          return {
            name: counter.name,
            counterId: counter.counter_id || 5,
            data: counter.data.map(point => ({ timestamp: point[0], value: point[1] }))
          };
        }
      }
    }
  }
  return null;
}

// ES6 箭头函数导出
export const getAecDelayData = (responseText) => {
  // 解析 responseText，获取 "Audio AEC Delay" 的数据
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    // 如果 responseText 解析失败
    console.warn('getAecDelayData: responseText 不是有效的 JSON');
    return null;
  }

  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim().toUpperCase() === 'AUDIO AEC DELAY' &&
          Array.isArray(counter.data)
        ) {
          // 返回结构封装
          return {
            name: counter.name,
            counterId: counter.counter_id || counter.id || 5,
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

// ES6 箭头函数导出 - 生成模拟的AEC Delay数据
export const generateMockAecDelayData = (dataPoints = 50) => {
  const baseTime = Date.now();
  const data = [];
  const valueRange = [5, 150];
  const baseValue = 50;
  const variation = 20;

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
    name: 'Audio AEC Delay',
    counterId: 5,
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

// ES6 箭头函数导出 - 显示AEC Delay曲线图
export const showAecDelayChart = (aecDelayData) => {
  // 加载Chart.js库
  loadChartJs().then(() => {
    createAecDelayChart(aecDelayData);
  }).catch(error => {
    console.error('加载Chart.js失败:', error);
    showNotification('无法加载图表库', 'error');
  });
}

// ES6 箭头函数导出 - 创建AEC Delay图表
export const createAecDelayChart = (aecDelayData) => {
  // 1) 容器与画布：若不存在则创建，存在则复用
  let chartContainer = document.querySelector('.aec-delay-chart-container');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.className = 'aec-delay-chart-container';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <h3>📊 Audio AEC Delay 分析</h3>
        <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="chart-content">
        <canvas id="aecDelayChart" width="600" height="300"></canvas>
      </div>
      <div class="chart-footer">
        <div class="chart-stats">
          <div class="stat-item">
            <span class="stat-label">数据点</span>
            <span class="stat-value">${aecDelayData.data.length}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均延迟</span>
            <span class="stat-value">${calculateAverageDelay(aecDelayData.data)}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最大延迟</span>
            <span class="stat-value">${calculateMaxDelay(aecDelayData.data)}ms</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">变化次数</span>
            <span class="stat-value">${calculateChangeCount(aecDelayData.data)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">变化频率</span>
            <span class="stat-value">${calculateChangeFrequency(aecDelayData.data)}</span>
          </div>
        </div>
      </div>
    `;
    chartContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 700px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(chartContainer);
  } else {
    // 更新统计显示
    updateChartStats(aecDelayData.data);
  }

  const canvas = document.getElementById('aecDelayChart');
  if (!canvas) {
    showNotification('未找到图表画布', 'error');
    return;
  }

  // 2) 准备折线图数据
  const prepared = prepareChartData(aecDelayData.data);

  // 3) 若已存在实例则更新；否则新建折线图
  if (window.aecDelayChartInstance) {
    window.aecDelayChartInstance.data.labels = prepared.labels;
    window.aecDelayChartInstance.data.datasets[0].data = prepared.values;
    window.aecDelayChartInstance.update('none');
  } else {
    window.aecDelayChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: prepared.labels,
        datasets: [{
          label: 'AEC Delay (ms)',
          data: prepared.values,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#667eea',
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
          title: { display: true, text: 'Audio AEC Delay 时间序列' },
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
                return `Delay: ${context.parsed.y}ms`;
              }
            }
          },
          // 如果版本支持，启用抽稀
          decimation: { enabled: true, algorithm: 'lttb', samples: 200 }
        },
        scales: {
          x: {
            display: true,
            title: { display: true, text: '时间' },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            display: true,
            title: { display: true, text: 'Delay (ms)' },
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });
  }

}

// ES6 默认导出
export default {
  findAecDelayData,
  generateAecDelayDataFromParsed,
  getAecDelayData,
  generateMockAecDelayData,
  prepareChartData,
  showAecDelayChart,
  createAecDelayChart
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.AecDelayMetrics = {
    findAecDelayData,
    generateAecDelayDataFromParsed,
    getAecDelayData,
    generateMockAecDelayData,
    prepareChartData,
    showAecDelayChart,
    createAecDelayChart
  };
}

console.log('✅ aec-delay.js ES6 模块已加载');
