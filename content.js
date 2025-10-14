// 等待页面加载完成
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// 创建Auto Check按钮
function createAutoCheckButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-light btn-sm auto-check-btn';
  button.innerHTML = 'Auto Check';
  button.title = '自动检查';
  
  // 添加点击事件
  button.addEventListener('click', function() {
    console.log('Auto Check 按钮被点击');
    
    // 这里可以添加您的自动检查逻辑
    performAutoCheck();
    
    // 按钮点击效果
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  });
  
  return button;
}

// 执行自动检查逻辑
async function performAutoCheck() {
  try {
    // 获取当前页面的相关信息
    const url = window.location.href;
    const title = document.title;
    
    console.log('执行自动检查:', { url, title });
    
    // 显示检查开始通知
    showNotification('正在分析AEC Delay数据...', 'info');
    
    // 模拟获取AEC Delay数据并显示图表
    setTimeout(() => {
      showAecDelayAnalysis();
    }, 500);
    
  } catch (error) {
    console.error('自动检查过程中出现错误:', error);
    showNotification('自动检查失败: ' + error.message, 'error');
  }
}

// 开始网络请求监听
function startNetworkMonitoring() {
  chrome.runtime.sendMessage(
    { type: 'START_NETWORK_MONITORING' },
    (response) => {
      if (response && response.success) {
        console.log('网络监听启动成功');
      } else {
        console.error('网络监听启动失败:', response);
      }
    }
  );
}

// 停止网络请求监听
function stopNetworkMonitoring() {
  chrome.runtime.sendMessage(
    { type: 'STOP_NETWORK_MONITORING' },
    (response) => {
      if (response && response.success) {
        console.log('网络监听停止成功');
      }
    }
  );
}

// 获取counters数据
async function getCountersData() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'GET_COUNTERS_DATA' },
      (response) => {
        if (response && response.success) {
          console.log('获取到counters数据:', response.counters);
          displayCountersData(response.counters);
          resolve(response.counters);
        } else {
          console.error('获取counters数据失败:', response);
          showNotification('未找到counters数据', 'error');
          resolve([]);
        }
      }
    );
  });
}

// 显示counters数据
function displayCountersData(countersData) {
  if (!countersData || countersData.length === 0) {
    showNotification('未发现包含counters的网络请求', 'info');
    return;
  }

  // 检查是否有AEC Delay数据
  const aecDelayData = findAecDelayData(countersData);
  if (aecDelayData) {
    showAecDelayChart(aecDelayData);
  }
  
  // 创建数据展示面板
  const panel = document.createElement('div');
  panel.className = 'auto-check-data-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3>🔍 Counters数据 (${countersData.length}条)</h3>
      <button class="close-panel" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="panel-content">
      ${countersData.map((counter, index) => `
        <div class="counter-item">
          <div class="counter-header">
            <span class="counter-index">#${index + 1}</span>
            <span class="counter-method">${counter.method}</span>
            <span class="counter-status">${counter.statusCode || 'N/A'}</span>
          </div>
          <div class="counter-url">${counter.url}</div>
          ${counter.bodyText ? `
            <div class="counter-body">
              <details>
                <summary>请求体内容</summary>
                <pre>${formatCounterBody(counter.bodyText)}</pre>
              </details>
            </div>
          ` : ''}
          ${counter.parsedBody ? `
            <div class="counter-json">
              <details>
                <summary>解析后的JSON</summary>
                <pre>${JSON.stringify(counter.parsedBody, null, 2)}</pre>
              </details>
            </div>
          ` : ''}
          <div class="counter-time">时间: ${new Date(counter.timestamp).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
    <div class="panel-footer">
      <button class="copy-all-btn" onclick="copyAllCountersData()">复制所有数据</button>
      <button class="export-btn" onclick="exportCountersData()">导出数据</button>
    </div>
  `;
  
  // 添加样式
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  document.body.appendChild(panel);
  
  // 添加复制和导出功能到全局
  window.copyAllCountersData = () => {
    const text = countersData.map(counter => 
      `URL: ${counter.url}\n方法: ${counter.method}\n状态: ${counter.statusCode}\n时间: ${new Date(counter.timestamp).toLocaleString()}\n内容: ${counter.bodyText || 'N/A'}\n---\n`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      showNotification('数据已复制到剪贴板', 'success');
    });
  };
  
  window.exportCountersData = () => {
    const dataStr = JSON.stringify(countersData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `counters-data-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('数据已导出', 'success');
  };
  
  showNotification(`发现${countersData.length}条counters数据`, 'success');
}

// 格式化counters数据内容
function formatCounterBody(bodyText) {
  try {
    // 尝试美化JSON
    const parsed = JSON.parse(bodyText);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    // 不是JSON，返回原始文本
    return bodyText;
  }
}

// 查找AEC Delay数据
function findAecDelayData(countersData) {
  for (const counter of countersData) {
    if (counter.aecDelayData) {
      return counter.aecDelayData;
    }
  }
  return null;
}

// 显示AEC Delay分析弹窗
function showAecDelayAnalysis() {
  // 加载Chart.js库
  loadChartJs().then(() => {
    // 生成模拟的AEC Delay数据
    const aecDelayData = generateMockAecDelayData();
    if (window.Chart) {
      createAecDelayChart(aecDelayData);
    } else {
      createFallbackChart(aecDelayData);
    }
  }).catch(error => {
    console.error('加载Chart.js失败:', error);
    // 即使失败也显示备用图表
    const aecDelayData = generateMockAecDelayData();
    createFallbackChart(aecDelayData);
  });
}

// 生成模拟的AEC Delay数据
function generateMockAecDelayData() {
  const baseTime = Date.now();
  const data = [];
  
  // 生成50个数据点，模拟真实的AEC Delay变化
  for (let i = 0; i < 50; i++) {
    const timestamp = baseTime + (i * 2000); // 每2秒一个数据点
    let delay = 0;
    
    // 模拟不同的音频场景
    if (i < 10) {
      // 初始阶段，低延迟
      delay = Math.random() * 15 + 5;
    } else if (i >= 10 && i < 20) {
      // 音频开始，延迟增加
      delay = Math.random() * 30 + 40;
    } else if (i >= 20 && i < 35) {
      // 音频活跃期，较高延迟
      delay = Math.random() * 40 + 80;
    } else if (i >= 35 && i < 45) {
      // 延迟峰值期
      delay = Math.random() * 50 + 120;
    } else {
      // 音频结束，延迟下降
      delay = Math.random() * 20 + 15;
    }
    
    // 添加一些随机波动
    delay += (Math.random() - 0.5) * 15;
    delay = Math.max(0, delay); // 确保不为负数
    
    data.push({
      timestamp: timestamp,
      value: Math.round(delay)
    });
  }
  
  return {
    name: "Audio AEC Delay",
    counterId: 5,
    data: data
  };
}

// 显示AEC Delay曲线图
function showAecDelayChart(aecDelayData) {
  // 加载Chart.js库
  loadChartJs().then(() => {
    createAecDelayChart(aecDelayData);
  }).catch(error => {
    console.error('加载Chart.js失败:', error);
    showNotification('无法加载图表库', 'error');
  });
}

// 加载Chart.js库
function loadChartJs() {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载
    if (window.Chart) {
      resolve();
      return;
    }

    // 使用指定的Chart.js库地址
    const chartJsUrl = 'https://arnoldlisenan.oss-cn-hangzhou.aliyuncs.com/Private/js/chart.js';
    
    const script = document.createElement('script');
    script.src = chartJsUrl;
    
    script.onload = () => {
      console.log(`Chart.js从${chartJsUrl}加载成功`);
      resolve();
    };
    
    script.onerror = () => {
      console.error(`Chart.js从${chartJsUrl}加载失败`);
      // 如果指定地址失败，尝试备用CDN源
      console.log('尝试备用CDN源...');
      loadChartJsFallback().then(resolve).catch(() => {
        console.warn('所有Chart.js源都失败，使用内置图表');
        resolve(); // 仍然resolve，让备用图表显示
      });
    };
    
    document.head.appendChild(script);
  });
}

// 备用Chart.js加载函数
function loadChartJsFallback() {
  return new Promise((resolve, reject) => {
    // 备用CDN源
    const fallbackSources = [
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.js',
      'https://unpkg.com/chart.js@4.4.8/dist/chart.umd.js',
      'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.8/chart.umd.js'
    ];

    let currentIndex = 0;
    
    function tryLoadFallbackScript(index) {
      if (index >= fallbackSources.length) {
        reject(new Error('所有备用CDN源都失败'));
        return;
      }

      const script = document.createElement('script');
      script.src = fallbackSources[index];
      script.onload = () => {
        console.log(`Chart.js从备用源${fallbackSources[index]}加载成功`);
        resolve();
      };
      script.onerror = () => {
        console.warn(`备用CDN源${fallbackSources[index]}加载失败，尝试下一个`);
        currentIndex++;
        tryLoadFallbackScript(currentIndex);
      };
      document.head.appendChild(script);
    }

    tryLoadFallbackScript(0);
  });
}

// 创建AEC Delay图表
function createAecDelayChart(aecDelayData) {
  // 创建图表容器
  const chartContainer = document.createElement('div');
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
      </div>
      <div class="chart-controls">
        <button class="chart-btn" onclick="exportChartData()">导出数据</button>
        <button class="chart-btn" onclick="refreshChart()">刷新数据</button>
      </div>
    </div>
  `;

  // 添加样式
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

  // 准备图表数据
  const chartData = prepareChartData(aecDelayData.data);
  
  // 创建图表
  const ctx = document.getElementById('aecDelayChart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'AEC Delay (ms)',
        data: chartData.values,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Audio AEC Delay 时间序列',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex;
              const timestamp = aecDelayData.data[index].timestamp;
              return new Date(timestamp).toLocaleString();
            },
            label: function(context) {
              return `Delay: ${context.parsed.y}ms`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: '时间'
          },
          ticks: {
            maxTicksLimit: 10,
            callback: function(value, index, values) {
              if (index % Math.ceil(values.length / 10) === 0) {
                const timestamp = aecDelayData.data[index].timestamp;
                return new Date(timestamp).toLocaleTimeString();
              }
              return '';
            }
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Delay (ms)'
          },
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });

  // 添加全局函数
  window.exportChartData = () => {
    const csvData = aecDelayData.data.map(point => 
      `${new Date(point.timestamp).toISOString()},${point.value}`
    ).join('\n');
    
    const csvContent = '时间戳,延迟值(ms)\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aec-delay-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('AEC Delay数据已导出', 'success');
  };

  window.refreshChart = () => {
    // 重新生成数据并更新图表
    const newData = generateMockAecDelayData();
    chart.data.datasets[0].data = prepareChartData(newData.data).values;
    chart.data.labels = prepareChartData(newData.data).labels;
    chart.update('active');
    
    // 更新统计信息
    updateChartStats(newData.data);
    showNotification('数据已刷新', 'success');
  };

  showNotification('AEC Delay曲线图已生成', 'success');
}

// 准备图表数据
function prepareChartData(data) {
  // 过滤掉null值并排序
  const validData = data.filter(point => point.value !== null).sort((a, b) => a.timestamp - b.timestamp);
  
  const labels = validData.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString();
  });
  
  const values = validData.map(point => point.value);
  
  return { labels, values };
}

// 格式化时间范围
function formatTimeRange(data) {
  if (data.length === 0) return '无数据';
  
  const timestamps = data.map(point => point.timestamp).filter(ts => ts !== null);
  if (timestamps.length === 0) return '无有效数据';
  
  const startTime = new Date(Math.min(...timestamps));
  const endTime = new Date(Math.max(...timestamps));
  
  return `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`;
}

// 计算平均延迟
function calculateAverageDelay(data) {
  const validData = data.filter(point => point.value !== null && point.value > 0);
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, point) => acc + point.value, 0);
  return Math.round(sum / validData.length);
}

// 计算最大延迟
function calculateMaxDelay(data) {
  const validData = data.filter(point => point.value !== null && point.value > 0);
  if (validData.length === 0) return 0;
  
  return Math.max(...validData.map(point => point.value));
}

// 更新图表统计信息
function updateChartStats(data) {
  const statsContainer = document.querySelector('.chart-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">数据点</span>
        <span class="stat-value">${data.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均延迟</span>
        <span class="stat-value">${calculateAverageDelay(data)}ms</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大延迟</span>
        <span class="stat-value">${calculateMaxDelay(data)}ms</span>
      </div>
    `;
  }
}

// 创建备用简化图表（当Chart.js无法加载时使用）
function createFallbackChart(aecDelayData) {
  console.log('使用备用图表显示AEC Delay数据');
  
  // 创建图表容器
  const chartContainer = document.createElement('div');
  chartContainer.className = 'aec-delay-chart-container fallback-chart';
  chartContainer.innerHTML = `
    <div class="chart-header">
      <h3>📊 Audio AEC Delay 分析</h3>
      <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="chart-content">
      <div class="fallback-chart-info">
        <p>📈 使用简化图表显示数据</p>
        <div class="data-table" id="dataTable"></div>
      </div>
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
      </div>
      <div class="chart-controls">
        <button class="chart-btn" onclick="exportChartData()">导出数据</button>
        <button class="chart-btn" onclick="refreshFallbackChart()">刷新数据</button>
      </div>
    </div>
  `;

  // 添加样式
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

  // 创建数据表格
  createDataTable(aecDelayData.data);

  // 添加全局函数
  window.exportChartData = () => {
    const csvData = aecDelayData.data.map(point => 
      `${new Date(point.timestamp).toISOString()},${point.value}`
    ).join('\n');
    
    const csvContent = '时间戳,延迟值(ms)\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aec-delay-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('AEC Delay数据已导出', 'success');
  };

  window.refreshFallbackChart = () => {
    // 重新生成数据
    const newData = generateMockAecDelayData();
    createDataTable(newData.data);
    updateChartStats(newData.data);
    showNotification('数据已刷新', 'success');
  };

  showNotification('AEC Delay分析已显示（简化模式）', 'success');
}

// 创建数据表格
function createDataTable(data) {
  const tableContainer = document.getElementById('dataTable');
  if (!tableContainer) return;

  // 过滤有效数据
  const validData = data.filter(point => point.value !== null && point.value > 0);
  
  // 创建表格
  const table = document.createElement('table');
  table.className = 'data-table-content';
  
  // 表头
  const header = document.createElement('tr');
  header.innerHTML = `
    <th>时间</th>
    <th>延迟 (ms)</th>
    <th>状态</th>
  `;
  table.appendChild(header);
  
  // 数据行（显示前10条和最后5条）
  const displayData = validData.length > 15 
    ? [...validData.slice(0, 10), ...validData.slice(-5)]
    : validData;
  
  displayData.forEach((point, index) => {
    const row = document.createElement('tr');
    const time = new Date(point.timestamp).toLocaleTimeString();
    const delay = point.value;
    const status = delay > 100 ? '高' : delay > 50 ? '中' : '低';
    const statusClass = delay > 100 ? 'status-high' : delay > 50 ? 'status-medium' : 'status-low';
    
    row.innerHTML = `
      <td>${time}</td>
      <td>${delay}</td>
      <td><span class="status-badge ${statusClass}">${status}</span></td>
    `;
    table.appendChild(row);
  });
  
  // 如果有省略的数据，添加提示行
  if (validData.length > 15) {
    const ellipsisRow = document.createElement('tr');
    ellipsisRow.innerHTML = `
      <td colspan="3" style="text-align: center; color: #666; font-style: italic;">
        ... 省略 ${validData.length - 15} 条数据 ...
      </td>
    `;
    table.appendChild(ellipsisRow);
  }
  
  tableContainer.innerHTML = '';
  tableContainer.appendChild(table);
}

// 显示通知
function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `auto-check-notification ${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // 3秒后移除
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 主函数：注入Auto Check按钮
async function injectAutoCheckButton() {
  try {
    // 等待info_right元素出现
    const infoRight = await waitForElement('.info_right');
    
    // 检查是否已经添加了按钮（避免重复添加）
    const existingButton = infoRight.querySelector('.auto-check-btn');
    if (existingButton) {
      console.log('Auto Check按钮已存在，跳过添加');
      return;
    }
    
    // 查找voqa容器（根据HTML结构）
    const voqa = infoRight.querySelector('.voqa');
    if (voqa) {
      // 在voqa容器后添加Auto Check按钮
      const button = createAutoCheckButton();
      
      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'btn-group auto-check-container';
      buttonContainer.appendChild(button);
      
      // 添加到voqa后面
      voqa.parentNode.insertBefore(buttonContainer, voqa.nextSibling);
      
      console.log('Auto Check按钮已成功添加到info_right区域');
    } else {
      // 如果没有找到voqa，直接在info_right末尾添加
      const button = createAutoCheckButton();
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'btn-group auto-check-container';
      buttonContainer.appendChild(button);
      
      infoRight.appendChild(buttonContainer);
      console.log('Auto Check按钮已添加到info_right区域末尾');
    }
    
  } catch (error) {
    console.error('注入Auto Check按钮失败:', error);
  }
}

// 页面加载完成后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAutoCheckButton);
} else {
  injectAutoCheckButton();
}

// 监听页面变化，动态添加按钮
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 检查新添加的节点是否包含info_right
          if (node.classList && node.classList.contains('info_right')) {
            setTimeout(injectAutoCheckButton, 100);
          } else if (node.querySelector && node.querySelector('.info_right')) {
            setTimeout(injectAutoCheckButton, 100);
          }
        }
      });
    }
  });
});

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});
