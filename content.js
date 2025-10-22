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
    description: '音频回声消除延迟'
  },
  'SIGNAL_LEVEL': {
    name: 'Audio Signal Level Nearin',
    displayName: '📈 Audio Signal Level Nearin 统计',
    counterId: 6,
    color: '#ff6b6b',
    backgroundColor: 'linear-gradient(135deg, #fff5f5 0%, #ffebee 100%)',
    borderColor: '#ff6b6b',
    icon: '📈',
    unit: '',
    description: '音频信号级别'
  },
  'RECORD_VOLUME': {
    name: 'A RECORD SIGNAL VOLUME',
    displayName: '🎵 A RECORD SIGNAL VOLUME 统计',
    counterId: 7,
    color: '#4ecdc4',
    backgroundColor: 'linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%)',
    borderColor: '#4ecdc4',
    icon: '🎵',
    unit: '',
    description: '录音信号音量'
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
    console.log('🔘 Auto Check 按钮被点击');
    
    // 找到所属的 info_right，然后找到其父节点 user-info
    const infoRight = button.closest('.info_right');
    const userInfoParent = infoRight ? infoRight.closest('.user-info') : null;
    const scopeIndex = button.getAttribute('data-info-right-index');
    
    if (userInfoParent) {
      console.log('找到父节点 user-info:', userInfoParent);
      
      // 打印网络监听状态信息
      printNetworkMonitoringStatus();
     
      
      // 执行自动检查（限定范围到父节点 user-info）
      performAutoCheck(userInfoParent, scopeIndex);
    } else {
      console.log('未找到父节点 user-info');
      showNotification('未找到父节点 user-info 容器', 'error');
    }
    
    // 按钮点击效果
    button.classList.add('clicked');
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  });
  
  return button;
}

// 打印网络监听状态信息
function printNetworkMonitoringStatus() {
  console.log('🌐 ===== 网络监听状态信息 =====');
  console.log('📡 网络监听功能已启动');
  console.log('🎯 监听目标: 包含 "counters?" 和 "uids=" 的 URL');
  console.log('📊 功能: 自动计算响应 JSON 长度');
  console.log('⏰ 启动时间:', new Date().toLocaleString());
  console.log('🔍 监听方法:');
  console.log('  - Fetch API 拦截');
  console.log('  - XMLHttpRequest 拦截');
  console.log('  - PerformanceObserver');
  console.log('  - NetworkObserver');
  console.log('📝 输出格式:');
  console.log('  🌐 [Fetch/XHR] 发现包含 uids 参数的 counters 请求');
  console.log('  📊 [Fetch/XHR] 响应 JSON 长度: XXXX 字符');
  console.log('  📊 [Fetch/XHR] 响应数据预览: {...}');
  console.log('================================');
}



// 执行自动检查逻辑
async function performAutoCheck(scopeRoot = document, scopeIndex = undefined) {
  try {
    // 获取当前页面的相关信息
    const url = window.location.href;
    const title = document.title;
    
    console.log('执行自动检查:', { url, title });
    
    // 显示检查开始通知
    showNotification('正在收集页面数据...', 'info');
    
    // 收集限定范围内的 class uid 的值（仅 user-info 容器）
    const uidValues = collectUidValues(scopeRoot);
    
    // 显示 uid 值弹窗
    const scopeLabel = scopeIndex !== undefined ? `info_right[${scopeIndex}]` : undefined;
    // showUidValuesPopup(uidValues, { scopeLabel });
    let responseText = null;
    if (!uidValues || uidValues.length === 0 || !uidValues[0] || !uidValues[0].value) {
      console.log('❌ 未找到可用的 UID 值，跳过 counters 打印');
    } else {
      console.log('uidValues:', uidValues[0].value);
      // 如果 value 形如 'User 30'，只取数字部分
      if (uidValues && uidValues[0] && typeof uidValues[0].value === 'string') {
        const match = uidValues[0].value.match(/User\s*(\d+)/);
        if (match) {
          uidValues[0].value = match[1];
        }
      }
      responseText = await fecthResponse(uidValues[0].value);
      // console.log('response:', responseText);
    }
    
    // 拿到响应后再执行分析
    if (responseText) {
      showAecDelayAnalysis(responseText);
    } else {
      showNotification('未找到响应数据', 'error');
    }
    
  } catch (error) {
    console.error('自动检查过程中出现错误:', error);
    showNotification('自动检查失败: ' + error.message, 'error');
  }
}

// 打印 uid 的 url 和 response
function fecthResponse(uidValues) {
  if (!window.resp || !Array.isArray(window.resp)) {
    console.log('❗ 未找到 window.resp 或类型有误');
    return null;
  }

  let matchedUrl = null;
  for (const entry of window.resp) {
    if (entry && typeof entry.name === 'string' && entry.name.includes('uids=' + uidValues + '')) {
      matchedUrl = entry.name;
      console.log(`🌐 [resp] 发现包含 UID ${uidValues} 的网络请求:`);
      console.log('  URL:', matchedUrl);
      break;
    }
  }


  // 如果缓存中无，或已过期，则重新请求 matchedUrl，始终尝试重新请求一次
  if (!matchedUrl) {
    console.log('  Response: <未找到 URL>');
    return null;
  }
  try {
    const requestPromise = fetch(matchedUrl, { credentials: 'include' }).then(resp => resp.text());
    // 使用同步方式等待完成（仅在 modern chrome extension content script 中推荐，用 async/await 外部包裹此函数可异步）
    // 这里因为 printUidUrlAndResponse 调用点是同步的，只能通过 then 回调暴露
    requestPromise.then(responseText => {
      if (window.countersFetchMap) {
        window.countersFetchMap.set(matchedUrl, responseText);
      }
      // console.log('  Response:',
        // typeof responseText === 'string'
        //   ? responseText
        //   : responseText
      // );
    });
    return requestPromise;
  } catch (e) {
    console.log('  Response: <重新请求失败>', e && e.message);
    return null;
  }
}

// 智能提取 UID 值
function extractUidValue(text, element) {
  // 如果文本为空，返回空字符串
  if (!text || !text.trim()) {
    return '';
  }
  
  // 清理文本，移除多余的空白字符
  text = text.trim().replace(/\s+/g, ' ');
  
  // 尝试提取数字 UID（通常是8-10位数字）
  const numberMatch = text.match(/\b\d{8,10}\b/);
  if (numberMatch) {
    return numberMatch[0];
  }
  
  // 尝试提取其他常见的 UID 格式（字母数字组合）
  const alphanumericMatch = text.match(/\b[a-zA-Z0-9]{6,12}\b/);
  if (alphanumericMatch) {
    return alphanumericMatch[0];
  }
  
  // 如果包含 "User" 关键字，尝试提取后面的数字
  if (text.toLowerCase().includes('user')) {
    const userMatch = text.match(/user\s*(\d{8,10})/i);
    if (userMatch) {
      return userMatch[1];
    }
  }
  
  // 如果都没有匹配到，返回原始文本
  return text;
}

// 收集指定 user-info 容器内的所有 class uid 的值
function collectUidValues(userInfoContainer) {
  const uidValues = [];
  
  // 如果传入的不是 user-info 容器，尝试查找
  let container = userInfoContainer;
  if (!container || !container.classList.contains('user-info')) {
    console.log('传入的不是 user-info 容器，尝试查找父节点');
    container = userInfoContainer ? userInfoContainer.closest('.user-info') : null;
  }
  
  if (!container) {
    console.log('未找到 user-info 容器');
    return uidValues;
  }
  
  console.log('在指定的 user-info 容器中查找 uid 元素:', container);
  
  // 在指定的 user-info 容器中查找 uid 元素
  const uidElements = container.querySelectorAll('.uid');
  
  uidElements.forEach((element, elementIndex) => {
    let value = element.textContent || element.innerText || element.value || '';
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    const id = element.id || '';
    
    // 智能提取 UID 值
    value = extractUidValue(value, element);
    
    // 获取父容器的信息
    const containerInfo = {
      containerIndex: 1, // 只有一个容器
      containerId: container.id || '',
      containerClasses: container.className
    };
    
    uidValues.push({
      index: uidValues.length + 1,
      value: value.trim(),
      tagName: tagName,
      className: className,
      id: id,
      element: element,
      containerInfo: containerInfo
    });
  });
  
  console.log(`在指定的 user-info 容器中找到 ${uidElements.length} 个 uid 元素:`, uidValues);
  return uidValues;
}

// 显示 uid 值弹窗
function showUidValuesPopup(uidValues, options = {}) {
  const { scopeLabel } = options;
  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.className = 'uid-values-popup';
  
  if (uidValues.length === 0) {
    popup.innerHTML = `
      <div class="popup-header">
        <h3>🔍 ${scopeLabel ? scopeLabel + ' · ' : ''}父节点 User-Info 中的 UID 值检查</h3>
        <button class="close-popup" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="popup-content">
        <div class="no-data">
          <p>❌ 未找到父节点 class="user-info" 容器中的 class="uid" 元素</p>
          <p>请检查 info_right 的父节点是否存在 class="user-info" 的容器，以及其中是否有 class="uid" 的元素</p>
        </div>
      </div>
    `;
  } else {
    popup.innerHTML = `
      <div class="popup-header">
        <h3>🔍 ${scopeLabel ? scopeLabel + ' · ' : ''}父节点 User-Info 中的 UID 值检查</h3>
        <button class="close-popup" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="popup-content">
        <div class="uid-summary">
          <p>✅ 在 ${scopeLabel ? `<strong>${scopeLabel}</strong> 的父节点 ` : ''}<strong>class="user-info"</strong> 容器中找到 <strong>${uidValues.length}</strong> 个 class="uid" 的元素</p>
          <p>📊 来源: info_right 的父节点 user-info 容器</p>
        </div>
        <div class="uid-list">
          ${uidValues.map(uid => `
            <div class="uid-item">
              <div class="uid-header">
                <span class="uid-index">#${uid.index}</span>
                <span class="uid-tag">${uid.tagName}</span>
                ${uid.id ? `<span class="uid-id">id="${uid.id}"</span>` : ''}
                <span class="container-badge">容器 ${uid.containerInfo.containerIndex}</span>
              </div>
              <div class="uid-value">
                <strong>值:</strong> <span class="value-text">${uid.value || '(空值)'}</span>
              </div>
              <div class="uid-class">
                <strong>Class:</strong> <span class="class-text">${uid.className}</span>
              </div>
              <div class="container-info">
                <strong>所属容器:</strong> <span class="container-text">${uid.containerInfo.containerClasses}</span>
                ${uid.containerInfo.containerId ? `<span class="container-id">id="${uid.containerInfo.containerId}"</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="popup-actions">
          <button class="action-btn copy-btn" onclick="copyUidValues()">复制所有值</button>
          <button class="action-btn export-btn" onclick="exportUidValues()">导出数据</button>
        </div>
      </div>
    `;
  }
  
  // 添加样式
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 600px;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    z-index: 10002;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;
  
  // 添加CSS样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
    
    .uid-values-popup .popup-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .uid-values-popup .popup-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .uid-values-popup .close-popup {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }
    
    .uid-values-popup .close-popup:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .uid-values-popup .popup-content {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }
    
    .uid-values-popup .uid-summary {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #28a745;
    }
    
    .uid-values-popup .uid-summary p {
      margin: 0;
      color: #495057;
    }
    
    .uid-values-popup .uid-list {
      margin-bottom: 20px;
    }
    
    .uid-values-popup .uid-item {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    
    .uid-values-popup .uid-item:hover {
      background: #e9ecef;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .uid-values-popup .uid-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .uid-values-popup .uid-index {
      background: #667eea;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .uid-values-popup .uid-tag {
      background: #6c757d;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
    }
    
    .uid-values-popup .uid-id {
      background: #17a2b8;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
    }
    
    .uid-values-popup .container-badge {
      background: #6f42c1;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .uid-values-popup .uid-value,
    .uid-values-popup .uid-class,
    .uid-values-popup .container-info {
      margin-bottom: 5px;
      font-size: 14px;
    }
    
    .uid-values-popup .container-text {
      background: #e2e3e5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: #495057;
    }
    
    .uid-values-popup .container-id {
      background: #d4edda;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: #155724;
      margin-left: 5px;
    }
    
    .uid-values-popup .value-text {
      background: #fff3cd;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: #856404;
    }
    
    .uid-values-popup .class-text {
      background: #d1ecf1;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      color: #0c5460;
    }
    
    .uid-values-popup .popup-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      padding-top: 15px;
      border-top: 1px solid #e9ecef;
    }
    
    .uid-values-popup .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .uid-values-popup .copy-btn {
      background: #28a745;
      color: white;
    }
    
    .uid-values-popup .copy-btn:hover {
      background: #218838;
      transform: translateY(-1px);
    }
    
    .uid-values-popup .export-btn {
      background: #007bff;
      color: white;
    }
    
    .uid-values-popup .export-btn:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }
    
    .uid-values-popup .no-data {
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
    }
    
    .uid-values-popup .no-data p {
      margin: 10px 0;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(popup);
  
  // 添加全局函数
  window.copyUidValues = () => {
    const text = uidValues.map(uid => 
      `#${uid.index} - 容器${uid.containerInfo.containerIndex} - ${uid.tagName}${uid.id ? ` (id="${uid.id}")` : ''}: ${uid.value || '(空值)'}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      showNotification('UID值已复制到剪贴板', 'success');
    }).catch(() => {
      showNotification('复制失败，请手动复制', 'error');
    });
  };
  
  window.exportUidValues = () => {
    const dataStr = JSON.stringify(uidValues.map(uid => ({
      index: uid.index,
      value: uid.value,
      tagName: uid.tagName,
      className: uid.className,
      id: uid.id,
      containerInfo: uid.containerInfo
    })), null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-info-uid-values-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('UID数据已导出', 'success');
  };
  
  showNotification(`找到 ${uidValues.length} 个UID元素`, 'success');
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

// 监听网络请求并打印包含 counters? 的 URL
function monitorNetworkRequests() {
  if (window.__autoCheckNetworkHooked) {
    // 已经挂载过拦截器，避免重复注入
    return;
  }
  window.__autoCheckNetworkHooked = true;
  if (window.__autoCheckDebug) {
    console.log('🚀 启动网络请求监听...');
  }
  
  // 重写 fetch 方法
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('counters?') && url.includes('uids=')) {
      if (window.__autoCheckDebug) {
        console.log('🌐 [Fetch] 发现包含 uids 参数的 counters 请求:', url);
      }
      
      // 拦截响应并计算 JSON 长度
      const originalThen = Promise.prototype.then;
      const fetchPromise = originalFetch.apply(this, args);
      
      // 将 counters 信息按 url, response 保存到 map
      if (!window.countersFetchMap) {
        window.countersFetchMap = new Map();
      }
      fetchPromise.then = function(onFulfilled, onRejected) {
        return originalThen.call(this, function(response) {
          if (onFulfilled) {
            // 克隆响应以便读取内容
            const clonedResponse = response.clone();
            const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
            clonedResponse.text().then(text => {
              // 保存 url 和 response 到 map
              window.countersFetchMap.set(requestUrl, text);
              if (window.__autoCheckDebug) {
                console.log('保存 url 和 response 到 map:', requestUrl);
              }
              try {
                const jsonData = JSON.parse(text);
                const jsonLength = JSON.stringify(jsonData).length;
                if (window.__autoCheckDebug) {
                  console.log('📊 [Fetch] 响应 JSON 长度:', jsonLength, '字符');
                }
              } catch (error) {
                if (window.__autoCheckDebug) {
                  console.log('⚠️ [Fetch] 非 JSON 响应，长度:', text.length);
                }
              }
            }).catch(error => {
              if (window.__autoCheckDebug) {
                console.log('❌ [Fetch] 读取响应失败:', error.message);
              }
            });
          }
          return onFulfilled ? onFulfilled(response) : response;
        }, onRejected);
      };
      
      return fetchPromise;
    } else if (typeof url === 'string' && url.includes('counters?')) {
      if (window.__autoCheckDebug) {
        console.log('🌐 [Fetch] 发现 counters? 请求:', url);
      }
    }
    return originalFetch.apply(this, args);
  };

  // 重写 XMLHttpRequest 方法
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._monitoredUrl = url;
    this._monitoredMethod = method;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    const xhr = this;
    const url = xhr._monitoredUrl;
    const method = xhr._monitoredMethod;
    
    if (typeof url === 'string' && url.includes('counters?') && url.includes('uids=')) {
      if (window.__autoCheckDebug) {
        console.log('🌐 [XHR] 发现包含 uids 的 counters 请求:', method, url);
      }
      
      // 监听响应
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) { // 请求完成
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseText = xhr.responseText;
              const jsonData = JSON.parse(responseText);
              const jsonLength = JSON.stringify(jsonData).length;
              if (window.__autoCheckDebug) {
                console.log('📊 [XHR] 响应 JSON 长度:', jsonLength);
              }
            } catch (error) {
              if (window.__autoCheckDebug) {
                console.log('⚠️ [XHR] 非 JSON 响应，长度:', xhr.responseText.length);
              }
            }
          } else {
            if (window.__autoCheckDebug) {
              console.log('❌ [XHR] 请求失败，状态码:', xhr.status);
            }
          }
        }
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments);
        }
      };
    } else if (typeof url === 'string' && url.includes('counters?')) {
      if (window.__autoCheckDebug) {
        console.log('🌐 [XHR] 发现 counters? 请求:', method, url);
      }
    }
    
    return originalXHRSend.apply(this, args);
  };

  // 监听页面中的网络请求
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name && entry.name.includes('counters?')) {
        if (window.__autoCheckDebug) {
          console.log('🌐 [Performance] counters 资源:', entry.initiatorType, entry.name);
        }
      }
    }
  });

  // 开始观察网络请求
  try {
    observer.observe({ entryTypes: ['resource'] });
    console.log('✅ PerformanceObserver 已启动');
  } catch (error) {
    console.warn('⚠️ PerformanceObserver 启动失败:', error);
  }

  // 监听所有网络请求（更全面的方法）
  const networkObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name && entry.name.includes('counters?')) {
        if (window.__autoCheckDebug) {
          console.log('🌐 [Network] counters 请求:', entry.entryType, entry.name);
        }
      // 将 entry 保存到全局的 resp 数组
      if (!window.resp) {
        window.resp = [];
      }
      window.resp.push(entry);
      if (window.__autoCheckDebug) {
        console.log('保存 entry 到 window.resp');
      }
      }
    }
  });

  try {
    networkObserver.observe({ entryTypes: ['navigation', 'resource'] });
    console.log('✅ NetworkObserver 已启动');
  } catch (error) {
    console.warn('⚠️ NetworkObserver 启动失败:', error);
  }

  if (window.__autoCheckDebug) {
    console.log('✅ 网络请求监听已启动');
  }
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
function showAecDelayAnalysis(response) {
  // 加载Chart.js库
  loadChartJs().then(() => {
    // 获取真实数据或生成模拟数据
    const aecDelayData = getAecDelayData(response) || generateMockAecDelayData();
    const signalLevelData = getAudioSignalLevelNearinData(response) || generateMockAudioSignalLevelNearinData();
    const recordSignalVolumeData = getARecordSignalVolumeData(response) || generateMockARecordSignalVolumeData();
    
    if (window.Chart) {
      createCombinedAudioAnalysisChart(aecDelayData, signalLevelData, recordSignalVolumeData);
    } else {
      createCombinedFallbackChart(aecDelayData, signalLevelData, recordSignalVolumeData);
    }
  }).catch(error => {
    console.error('加载Chart.js失败:', error);
    // 即使失败也显示备用图表
    const aecDelayData = generateMockAecDelayData();
    const signalLevelData = generateMockAudioSignalLevelNearinData();
    const recordSignalVolumeData = generateMockARecordSignalVolumeData();
    createCombinedFallbackChart(aecDelayData, signalLevelData, recordSignalVolumeData);
  });
}

function generateAecDelayDataFromParsed(parsed) {
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

function getAecDelayData(responseText) {
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

  // 结构类似:
  // [
  //   {
  //     "sid": "...",
  //     "peer": "...",
  //     "data": [
  //       { "id": ..., "peer": ..., "name": "Audio AEC Delay", "counter_id": ..., "data": [[timestamp, value], ...], ... },
  //       ...
  //     ]
  //   },
  //   ...
  // ]

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

// 获取 Audio Signal Level Nearin 数据
function getAudioSignalLevelNearinData(responseText) {
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

// 获取 A RECORD SIGNAL VOLUME 数据（保持向后兼容）
function getARecordSignalVolumeData(responseText) {
  return getMetricData(responseText, 'A RECORD SIGNAL VOLUME');
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

// 生成模拟的AEC Delay数据（保持向后兼容）
function generateMockAecDelayData() {
  return generateMockMetricData('Audio AEC Delay');
}

// 生成模拟的 Audio Signal Level Nearin 数据（保持向后兼容）
function generateMockAudioSignalLevelNearinData() {
  return generateMockMetricData('Audio Signal Level Nearin');
}

// 生成模拟的 A RECORD SIGNAL VOLUME 数据（保持向后兼容）
function generateMockARecordSignalVolumeData() {
  return generateMockMetricData('A RECORD SIGNAL VOLUME');
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

// 加载Chart.js库（优先本地，后退到外网/备用源）
function loadChartJs() {
  return new Promise((resolve, reject) => {
    if (window.Chart) {
      resolve();
      return;
    }

    // 1) 优先加载本地打包版本（通过 web_accessible_resources 暴露）
    const localSrc = chrome.runtime.getURL('libs/chart.umd.js');
    const localScript = document.createElement('script');
    localScript.src = localSrc;
    localScript.onload = () => {
      console.log(`Chart.js 从本地资源加载成功: ${localSrc}`);
      resolve();
    };
    localScript.onerror = () => {
      console.warn('本地 Chart.js 加载失败，尝试外部源');

      // 2) 外部首选源
      const primaryCdn = 'https://arnoldlisenan.oss-cn-hangzhou.aliyuncs.com/Private/js/chart.js';
      const cdnScript = document.createElement('script');
      cdnScript.src = primaryCdn;
      cdnScript.onload = () => {
        console.log(`Chart.js 从外部源加载成功: ${primaryCdn}`);
        resolve();
      };
      cdnScript.onerror = () => {
        console.error('外部首选源加载失败，尝试备用源...');
        loadChartJsFallback().then(resolve).catch(() => {
          console.warn('所有 Chart.js 源均不可用，使用表格降级显示');
          resolve();
        });
      };
      document.head.appendChild(cdnScript);
    };

    document.head.appendChild(localScript);
  });
}

// 备用Chart.js加载函数
function loadChartJsFallback() {
  return new Promise((resolve, reject) => {
    // 备用CDN源
    const fallbackSources = [
      'https://arnoldlisenan.oss-cn-hangzhou.aliyuncs.com/Private/js/chart.js',
      'http://qupfile.cloudvdn.com/chart.js'
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

// 创建组合音频分析图表
function createCombinedAudioAnalysisChart(aecDelayData, signalLevelData, recordSignalVolumeData) {
  // 1) 容器与画布：若不存在则创建，存在则复用
  let chartContainer = document.querySelector('.combined-audio-analysis-container');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.className = 'combined-audio-analysis-container';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <h3>📊 音频分析 - AEC Delay, Signal Level & Record Volume</h3>
        <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="chart-content">
        <div class="issue-checkboxes">
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" id="isNoSound" onchange="updateIssueStatus('isNoSound', this.checked)">
              <span class="checkbox-label">无声</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isLowLevel" onchange="updateIssueStatus('isLowLevel', this.checked)">
              <span class="checkbox-label">音量小</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isEcho" onchange="updateIssueStatus('isEcho', this.checked)">
              <span class="checkbox-label">回声</span>
            </label>
          </div>
        </div>
        <div class="chart-tabs">
          <button class="tab-btn active" onclick="switchTab('aec')">AEC Delay</button>
          <button class="tab-btn" onclick="switchTab('signal')">Signal Level</button>
          <button class="tab-btn" onclick="switchTab('record')">Record Volume</button>
          <button class="tab-btn" onclick="switchTab('combined')">组合视图</button>
        </div>
        <div class="chart-canvas-container">
          <canvas id="aecDelayChart" width="600" height="300"></canvas>
          <canvas id="signalLevelChart" width="600" height="300" style="display: none;"></canvas>
          <canvas id="recordVolumeChart" width="600" height="300" style="display: none;"></canvas>
          <canvas id="combinedChart" width="600" height="300" style="display: none;"></canvas>
        </div>
      </div>
      <div class="chart-footer">
        <div class="chart-stats vertical-layout">
          <div class="stat-section">
            <h4>📊 Audio AEC Delay 统计</h4>
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
          <div class="stat-section">
            <h4>📈 Audio Signal Level Nearin 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${signalLevelData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均信号</span>
              <span class="stat-value">${calculateAverageDelay(signalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大信号</span>
              <span class="stat-value">${calculateMaxDelay(signalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(signalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(signalLevelData.data)}</span>
            </div>
          </div>
          <div class="stat-section">
            <h4>🎵 A RECORD SIGNAL VOLUME 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${recordSignalVolumeData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均音量</span>
              <span class="stat-value">${calculateAverageDelay(recordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大音量</span>
              <span class="stat-value">${calculateMaxDelay(recordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(recordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(recordSignalVolumeData.data)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    chartContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 1000px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    
    // 添加组合音频分析图表的CSS样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -60%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      
      .combined-audio-analysis-container .chart-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .combined-audio-analysis-container .chart-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .combined-audio-analysis-container .close-chart {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }
      
      .combined-audio-analysis-container .close-chart:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .combined-audio-analysis-container .chart-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .combined-audio-analysis-container .scrollable-content {
        flex: 1;
        overflow-y: auto;
        max-height: 60vh;
        padding-right: 10px;
        margin-right: -10px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .scrollable-content {
        scroll-behavior: smooth;
      }
      
      .combined-audio-analysis-container .fallback-chart-info {
        margin-bottom: 20px;
      }
      
      .combined-audio-analysis-container .chart-footer {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
      }
      
      /* 新的指标布局样式 */
      .combined-audio-analysis-container .metrics-layout {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .combined-audio-analysis-container .metric-row {
        display: flex;
        gap: 20px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .metric-data-section {
        flex: 1;
        padding: 15px;
        border-right: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .metric-stats-section {
        flex: 1;
        padding: 15px;
        background: white;
      }
      
      .combined-audio-analysis-container .metric-data-section h4,
      .combined-audio-analysis-container .metric-stats-section h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .metric-data-section h4 {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-stats-section h4 {
        color: #495057;
        border-bottom-color: #dee2e6;
      }
      
      /* 为每个指标行添加不同的颜色主题 */
      .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section {
        background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
        border-right-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section h4 {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section {
        background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
        border-right-color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section h4 {
        color: #ff6b6b;
        border-bottom-color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section {
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
        border-right-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section h4 {
        color: #4ecdc4;
        border-bottom-color: #4ecdc4;
      }
      
      /* 响应式设计 */
      @media (max-width: 768px) {
        .combined-audio-analysis-container .metric-row {
          flex-direction: column;
          gap: 0;
        }
        
        .combined-audio-analysis-container .metric-data-section {
          border-right: none;
          border-bottom: 1px solid #e9ecef;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section {
          border-bottom-color: #667eea;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section {
          border-bottom-color: #ff6b6b;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section {
          border-bottom-color: #4ecdc4;
        }
      }
      
      /* 数据表格样式优化 */
      .combined-audio-analysis-container .metric-data-section .data-table {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar {
        width: 6px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .issue-checkboxes {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        flex-shrink: 0;
      }
      
      .combined-audio-analysis-container .checkbox-group {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .combined-audio-analysis-container .checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s;
        background: white;
        border: 1px solid #dee2e6;
      }
      
      .combined-audio-analysis-container .checkbox-item:hover {
        background: #e9ecef;
        border-color: #adb5bd;
      }
      
      .combined-audio-analysis-container .checkbox-item input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
        accent-color: #667eea;
      }
      
      .combined-audio-analysis-container .checkbox-label {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        cursor: pointer;
      }
      
      .combined-audio-analysis-container .checkbox-item:has(input:checked) {
        background: #e3f2fd;
        border-color: #667eea;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
      }
      
      .combined-audio-analysis-container .checkbox-item:has(input:checked) .checkbox-label {
        color: #667eea;
        font-weight: 600;
      }
      
      /* 问题状态样式 */
      .combined-audio-analysis-container.has-no-sound {
        border-left: 4px solid #ff6b6b;
      }
      
      .combined-audio-analysis-container.has-low-level {
        border-left: 4px solid #ffa726;
      }
      
      .combined-audio-analysis-container.has-echo {
        border-left: 4px solid #f44336;
      }
      
      .combined-audio-analysis-container.has-no-sound .chart-header {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      }
      
      .combined-audio-analysis-container.has-low-level .chart-header {
        background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
      }
      
      .combined-audio-analysis-container.has-echo .chart-header {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      }
      
      .combined-audio-analysis-container .chart-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
      }
      
      .combined-audio-analysis-container .tab-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background: #f8f9fa;
        color: #495057;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .combined-audio-analysis-container .tab-btn:hover {
        background: #e9ecef;
        transform: translateY(-1px);
      }
      
      .combined-audio-analysis-container .tab-btn.active {
        background: #667eea;
        color: white;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }
      
      .combined-audio-analysis-container .chart-canvas-container {
        position: relative;
        height: 400px;
      }
      
      .combined-audio-analysis-container .chart-canvas-container canvas {
        width: 100% !important;
        height: 100% !important;
      }
      
      .combined-audio-analysis-container .chart-footer {
        padding: 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .chart-stats {
        display: flex;
        gap: 30px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout {
        flex-direction: column;
        gap: 20px;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section {
        width: 100%;
        margin-bottom: 15px;
        border-left: 4px solid #667eea;
        transition: all 0.3s ease;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section h4 {
        font-size: 16px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e9ecef;
        color: #495057;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-item {
        padding: 6px 0;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-item:last-child {
        border-bottom: none;
      }
      
      /* 为每个指标添加不同的颜色主题 */
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(1) {
        border-left-color: #667eea;
        background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(2) {
        border-left-color: #ff6b6b;
        background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(3) {
        border-left-color: #4ecdc4;
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(1) h4 {
        color: #667eea;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(2) h4 {
        color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(3) h4 {
        color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .stat-section {
        flex: 1;
        min-width: 200px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .stat-section h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 2px solid #667eea;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .combined-audio-analysis-container .stat-item:last-child {
        border-bottom: none;
      }
      
      .combined-audio-analysis-container .stat-label {
        color: #6c757d;
        font-size: 14px;
        font-weight: 500;
      }
      
      .combined-audio-analysis-container .stat-value {
        color: #495057;
        font-size: 14px;
        font-weight: 600;
        background: #e9ecef;
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      
      
      .combined-audio-analysis-container .fallback-chart-info {
        text-align: center;
        padding: 20px;
      }
      
      .combined-audio-analysis-container .data-tables {
        display: flex;
        gap: 20px;
        margin-top: 20px;
      }
      
      .combined-audio-analysis-container .table-section {
        flex: 1;
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .table-section h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 2px solid #667eea;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .data-table-content {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      
      .combined-audio-analysis-container .data-table-content th,
      .combined-audio-analysis-container .data-table-content td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
      }
      
      .combined-audio-analysis-container .data-table-content th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
      }
      
      .combined-audio-analysis-container .data-table-content tr:hover {
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .status-badge {
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .combined-audio-analysis-container .status-low {
        background: #d4edda;
        color: #155724;
      }
      
      .combined-audio-analysis-container .status-medium {
        background: #fff3cd;
        color: #856404;
      }
      
      .combined-audio-analysis-container .status-high {
        background: #f8d7da;
        color: #721c24;
      }
      
      @media (max-width: 768px) {
        .combined-audio-analysis-container {
          width: 95% !important;
          max-width: none !important;
        }
        
        .combined-audio-analysis-container .chart-stats {
          flex-direction: column;
          gap: 15px;
        }
        
        .combined-audio-analysis-container .data-tables {
          flex-direction: column;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    document.body.appendChild(chartContainer);
  }

  // 2) 创建各个图表
  createAecDelayChart(aecDelayData);
  createSignalLevelChart(signalLevelData);
  createRecordVolumeChart(recordSignalVolumeData);
  createCombinedChart(aecDelayData, signalLevelData, recordSignalVolumeData);

  // 3) 添加全局函数
  // 更新问题状态
  window.updateIssueStatus = (issueType, isChecked) => {
    console.log(`问题状态更新: ${issueType} = ${isChecked}`);
    
    // 更新全局状态对象
    if (!window.audioAnalysisIssues) {
      window.audioAnalysisIssues = {
        isNoSound: false,
        isLowLevel: false,
        isEcho: false
      };
    }
    
    window.audioAnalysisIssues[issueType] = isChecked;
    
    // 根据问题状态更新图表显示
    updateChartBasedOnIssues();
    
    // 显示状态更新通知
    const statusText = isChecked ? '已标记' : '已取消';
    showNotification(`${getIssueDisplayName(issueType)} ${statusText}`, 'info');
  };
  
  // 获取问题显示名称
  function getIssueDisplayName(issueType) {
    const names = {
      'isNoSound': '无声',
      'isLowLevel': '音量小',
      'isEcho': '回声'
    };
    return names[issueType] || issueType;
  }
  
  // 根据问题状态更新图表
  function updateChartBasedOnIssues() {
    const issues = window.audioAnalysisIssues || {};
    
    // 更新图表标题以反映问题状态
    updateChartTitle(issues);
    
    // 根据问题状态调整图表样式
    adjustChartStyles(issues);
    
    // 更新统计信息显示
    updateStatisticsDisplay(issues);
  }
  
  // 更新图表标题
  function updateChartTitle(issues) {
    const header = document.querySelector('.combined-audio-analysis-container .chart-header h3');
    if (header) {
      let title = '📊 音频分析 - AEC Delay, Signal Level & Record Volume';
      
      const activeIssues = Object.entries(issues)
        .filter(([key, value]) => value)
        .map(([key]) => getIssueDisplayName(key));
      
      if (activeIssues.length > 0) {
        title += ` (问题: ${activeIssues.join(', ')})`;
      }
      
      header.textContent = title;
    }
  }
  
  // 调整图表样式
  function adjustChartStyles(issues) {
    const chartContainer = document.querySelector('.combined-audio-analysis-container');
    if (!chartContainer) return;
    
    // 根据问题状态添加相应的 CSS 类
    chartContainer.classList.remove('has-no-sound', 'has-low-level', 'has-echo');
    
    if (issues.isNoSound) {
      chartContainer.classList.add('has-no-sound');
    }
    if (issues.isLowLevel) {
      chartContainer.classList.add('has-low-level');
    }
    if (issues.isEcho) {
      chartContainer.classList.add('has-echo');
    }
  }
  
  // 更新统计信息显示
  function updateStatisticsDisplay(issues) {
    // 这里可以根据问题状态调整统计信息的显示
    // 例如，高亮显示相关的问题指标
    const statSections = document.querySelectorAll('.stat-section');
    
    statSections.forEach(section => {
      const title = section.querySelector('h4');
      if (!title) return;
      
      const titleText = title.textContent;
      
      // 根据问题类型高亮相应的统计区域
      if (issues.isNoSound && titleText.includes('Record Volume')) {
        section.style.borderLeft = '4px solid #ff6b6b';
        section.style.background = '#fff5f5';
      } else if (issues.isLowLevel && titleText.includes('Signal Level')) {
        section.style.borderLeft = '4px solid #ffa726';
        section.style.background = '#fff8e1';
      } else if (issues.isEcho && titleText.includes('AEC Delay')) {
        section.style.borderLeft = '4px solid #f44336';
        section.style.background = '#ffebee';
      } else {
        section.style.borderLeft = '2px solid #667eea';
        section.style.background = 'white';
      }
    });
  }
  
  window.switchTab = (tabName) => {
    // 切换标签页
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // 切换画布显示
    document.getElementById('aecDelayChart').style.display = tabName === 'aec' ? 'block' : 'none';
    document.getElementById('signalLevelChart').style.display = tabName === 'signal' ? 'block' : 'none';
    document.getElementById('recordVolumeChart').style.display = tabName === 'record' ? 'block' : 'none';
    document.getElementById('combinedChart').style.display = tabName === 'combined' ? 'block' : 'none';
  };

  window.exportCombinedChartData = () => {
    const csvData = [
      '时间戳,AEC Delay(ms),Signal Level,Record Volume,问题状态',
      ...aecDelayData.data.map((point, index) => {
        const signalPoint = signalLevelData.data[index] || { value: 0 };
        const recordPoint = recordSignalVolumeData.data[index] || { value: 0 };
        const issues = window.audioAnalysisIssues || {};
        const issueInfo = Object.entries(issues)
          .filter(([key, value]) => value)
          .map(([key]) => getIssueDisplayName(key))
          .join(';');
        return `${new Date(point.timestamp).toISOString()},${point.value},${signalPoint.value},${recordPoint.value},"${issueInfo}"`;
      })
    ].join('\n');
    
    const csvContent = csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `combined-audio-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('组合音频分析数据已导出', 'success');
  };

  window.refreshCombinedChart = () => {
    const newAecData = generateMockAecDelayData();
    const newSignalData = generateMockAudioSignalLevelNearinData();
    const newRecordData = generateMockARecordSignalVolumeData();
    
    if (window.aecDelayChartInstance) {
      const prepared = prepareChartData(newAecData.data);
      window.aecDelayChartInstance.data.labels = prepared.labels;
      window.aecDelayChartInstance.data.datasets[0].data = prepared.values;
      window.aecDelayChartInstance.update('none');
    }
    
    if (window.signalLevelChartInstance) {
      const prepared = prepareChartData(newSignalData.data);
      window.signalLevelChartInstance.data.labels = prepared.labels;
      window.signalLevelChartInstance.data.datasets[0].data = prepared.values;
      window.signalLevelChartInstance.update('none');
    }
    
    if (window.recordVolumeChartInstance) {
      const prepared = prepareChartData(newRecordData.data);
      window.recordVolumeChartInstance.data.labels = prepared.labels;
      window.recordVolumeChartInstance.data.datasets[0].data = prepared.values;
      window.recordVolumeChartInstance.update('none');
    }
    
    if (window.combinedChartInstance) {
      const aecPrepared = prepareChartData(newAecData.data);
      const signalPrepared = prepareChartData(newSignalData.data);
      const recordPrepared = prepareChartData(newRecordData.data);
      window.combinedChartInstance.data.labels = aecPrepared.labels;
      window.combinedChartInstance.data.datasets[0].data = aecPrepared.values;
      window.combinedChartInstance.data.datasets[1].data = signalPrepared.values;
      window.combinedChartInstance.data.datasets[2].data = recordPrepared.values;
      window.combinedChartInstance.update('none');
    }
    
    showNotification('数据已刷新', 'success');
  };

  showNotification('组合音频分析图表已生成', 'success');
}

// 创建AEC Delay图表
function createAecDelayChart(aecDelayData) {
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

  // 4) 导出与刷新
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
    const newData = generateMockAecDelayData();
    const preparedNew = prepareChartData(newData.data);
    if (window.aecDelayChartInstance) {
      window.aecDelayChartInstance.data.labels = preparedNew.labels;
      window.aecDelayChartInstance.data.datasets[0].data = preparedNew.values;
      window.aecDelayChartInstance.update('none');
    }
    updateChartStats(newData.data);
    showNotification('数据已刷新', 'success');
  };

  showNotification('AEC Delay曲线图已生成', 'success');
}

// 创建 Signal Level 图表
function createSignalLevelChart(signalLevelData) {
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

// 创建 Record Volume 图表
function createRecordVolumeChart(recordSignalVolumeData) {
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

// 创建组合图表
function createCombinedChart(aecDelayData, signalLevelData, recordSignalVolumeData) {
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
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'AEC Delay (ms)' },
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Signal Level' },
          beginAtZero: true,
          grid: { drawOnChartArea: false }
        },
        y2: {
          type: 'linear',
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

// 准备图表数据
function prepareChartData(data) {
  // 过滤掉null值但保留0值，并排序
  const validData = data.filter(point => point.value !== null && point.value !== undefined).sort((a, b) => a.timestamp - b.timestamp);
  
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

// 通用统计计算函数
function calculateMetricStatistics(data, metricName) {
  if (!data || data.length === 0) {
    return {
      dataPoints: 0,
      average: 0,
      maximum: 0,
      minimum: 0,
      changes: 0,
      frequency: '0/min'
    };
  }

  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) {
    return {
      dataPoints: 0,
      average: 0,
      maximum: 0,
      minimum: 0,
      changes: 0,
      frequency: '0/min'
    };
  }

  const values = validData.map(point => point.value);
  const sum = values.reduce((acc, value) => acc + value, 0);
  const average = Math.round(sum / values.length);
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  
  // 计算变化次数（值变化超过阈值的次数）
  let changes = 0;
  const threshold = getChangeThreshold(metricName);
  for (let i = 1; i < validData.length; i++) {
    if (Math.abs(validData[i].value - validData[i-1].value) > threshold) {
      changes++;
    }
  }
  
  // 计算变化频率
  const timeSpan = (validData[validData.length - 1].timestamp - validData[0].timestamp) / 1000 / 60; // 分钟
  const frequency = timeSpan > 0 ? Math.round(changes / timeSpan) : 0;
  
  return {
    dataPoints: validData.length,
    average: average,
    maximum: maximum,
    minimum: minimum,
    changes: changes,
    frequency: `${frequency}/min`
  };
}

// 获取指标的变化阈值
function getChangeThreshold(metricName) {
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

// 生成统计信息 HTML
function generateStatisticsHTML(data, metricName) {
  const config = getMetricConfig(metricName);
  const stats = calculateMetricStatistics(data, metricName);
  
  if (!config) {
    console.warn(`未找到指标配置: ${metricName}`);
    return '';
  }
  
  const unit = config.unit || '';
  const unitSuffix = unit ? unit : '';
  
  return `
    <div class="stat-section">
      <h4>${config.displayName}</h4>
      <div class="stat-item">
        <span class="stat-label">数据点</span>
        <span class="stat-value">${stats.dataPoints}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">平均值</span>
        <span class="stat-value">${stats.average}${unitSuffix}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大值</span>
        <span class="stat-value">${stats.maximum}${unitSuffix}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最小值</span>
        <span class="stat-value">${stats.minimum}${unitSuffix}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">变化次数</span>
        <span class="stat-value">${stats.changes}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">变化频率</span>
        <span class="stat-value">${stats.frequency}</span>
      </div>
    </div>
  `;
}

// 添加新指标的示例函数
function addNewMetric(metricKey, config) {
  AUDIO_METRICS_CONFIG[metricKey] = config;
  console.log(`已添加新指标: ${config.name}`);
}

// 示例：如何添加新指标
function addExampleMetrics() {
  // 示例：添加音频质量指标
  addNewMetric('AUDIO_QUALITY', {
    name: 'Audio Quality Score',
    displayName: '🎯 Audio Quality Score 统计',
    counterId: 8,
    color: '#9c27b0',
    backgroundColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    borderColor: '#9c27b0',
    icon: '🎯',
    unit: '%',
    description: '音频质量评分'
  });
  
  // 示例：添加网络延迟指标
  addNewMetric('NETWORK_LATENCY', {
    name: 'Network Latency',
    displayName: '🌐 Network Latency 统计',
    counterId: 9,
    color: '#ff9800',
    backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    borderColor: '#ff9800',
    icon: '🌐',
    unit: 'ms',
    description: '网络延迟'
  });
}

// 计算平均延迟
function calculateAverageDelay(data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, point) => acc + point.value, 0);
  return Math.round(sum / validData.length);
}

// 计算最大延迟
function calculateMaxDelay(data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  
  return Math.max(...validData.map(point => point.value));
}

// 计算变化次数
function calculateChangeCount(data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return 0;
  
  let count = 0;
  for (let i = 1; i < validData.length; i++) {
    if (validData[i].value !== validData[i-1].value) {
      count++;
    }
  }
  return count;
}

// 计算变化频率
function calculateChangeFrequency(data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return '0';
  
  const changeCount = calculateChangeCount(data);
  const timestamps = validData.map(point => point.timestamp);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const durationSec = (maxTs - minTs) > 0 ? (maxTs - minTs) / 1000 : 0;
  
  return durationSec > 0 ? (changeCount / durationSec).toFixed(3) + '/s' : '0';
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
      <div class="stat-item">
        <span class="stat-label">变化次数</span>
        <span class="stat-value">${calculateChangeCount(data)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">变化频率</span>
        <span class="stat-value">${calculateChangeFrequency(data)}</span>
      </div>
    `;
  }
}

// 创建组合备用图表（当Chart.js无法加载时使用）
function createCombinedFallbackChart(aecDelayData, signalLevelData, recordSignalVolumeData) {
  console.log('使用备用图表显示组合音频分析数据');
  
  // 创建图表容器
  const chartContainer = document.createElement('div');
  chartContainer.className = 'combined-audio-analysis-container fallback-chart';
  chartContainer.innerHTML = `
    <div class="chart-header">
      <h3>📊 音频分析 - AEC Delay, Signal Level & Record Volume</h3>
      <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="chart-content">
      <div class="issue-checkboxes">
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="isNoSound" onchange="updateIssueStatus('isNoSound', this.checked)">
            <span class="checkbox-label">无声</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isLowLevel" onchange="updateIssueStatus('isLowLevel', this.checked)">
            <span class="checkbox-label">音量小</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isEcho" onchange="updateIssueStatus('isEcho', this.checked)">
            <span class="checkbox-label">回声</span>
          </label>
        </div>
      </div>
      <div class="scrollable-content">
        <div class="fallback-chart-info">
          <p>📈 使用简化图表显示数据</p>
          <div class="metrics-layout">
            <div class="metric-row">
              <div class="metric-data-section">
                <h4>📊 AEC Delay 数据</h4>
                <div class="data-table" id="aecDataTable"></div>
              </div>
              <div class="metric-stats-section">
                <h4>📊 Audio AEC Delay 统计</h4>
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
            <div class="metric-row">
              <div class="metric-data-section">
                <h4>📈 Signal Level 数据</h4>
                <div class="data-table" id="signalDataTable"></div>
              </div>
              <div class="metric-stats-section">
                <h4>📈 Audio Signal Level Nearin 统计</h4>
                <div class="stat-item">
                  <span class="stat-label">数据点</span>
                  <span class="stat-value">${signalLevelData.data.length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均信号</span>
                  <span class="stat-value">${calculateAverageDelay(signalLevelData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最大信号</span>
                  <span class="stat-value">${calculateMaxDelay(signalLevelData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">变化次数</span>
                  <span class="stat-value">${calculateChangeCount(signalLevelData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">变化频率</span>
                  <span class="stat-value">${calculateChangeFrequency(signalLevelData.data)}</span>
                </div>
              </div>
            </div>
            <div class="metric-row">
              <div class="metric-data-section">
                <h4>🎵 Record Volume 数据</h4>
                <div class="data-table" id="recordDataTable"></div>
              </div>
              <div class="metric-stats-section">
                <h4>🎵 A RECORD SIGNAL VOLUME 统计</h4>
                <div class="stat-item">
                  <span class="stat-label">数据点</span>
                  <span class="stat-value">${recordSignalVolumeData.data.length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均音量</span>
                  <span class="stat-value">${calculateAverageDelay(recordSignalVolumeData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最大音量</span>
                  <span class="stat-value">${calculateMaxDelay(recordSignalVolumeData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">变化次数</span>
                  <span class="stat-value">${calculateChangeCount(recordSignalVolumeData.data)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">变化频率</span>
                  <span class="stat-value">${calculateChangeFrequency(recordSignalVolumeData.data)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 添加样式
  chartContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 1000px;
    max-height: 85vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
    display: flex;
    flex-direction: column;
  `;
  
  // 确保样式已加载（如果之前没有加载过）
  if (!document.querySelector('style[data-combined-audio-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-combined-audio-styles', 'true');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -60%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      
      .combined-audio-analysis-container .chart-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .combined-audio-analysis-container .chart-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .combined-audio-analysis-container .close-chart {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
      }
      
      .combined-audio-analysis-container .close-chart:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .combined-audio-analysis-container .chart-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .combined-audio-analysis-container .scrollable-content {
        flex: 1;
        overflow-y: auto;
        max-height: 60vh;
        padding-right: 10px;
        margin-right: -10px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .combined-audio-analysis-container .scrollable-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .scrollable-content {
        scroll-behavior: smooth;
      }
      
      .combined-audio-analysis-container .fallback-chart-info {
        margin-bottom: 20px;
      }
      
      .combined-audio-analysis-container .chart-footer {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
      }
      
      /* 新的指标布局样式 */
      .combined-audio-analysis-container .metrics-layout {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .combined-audio-analysis-container .metric-row {
        display: flex;
        gap: 20px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .metric-data-section {
        flex: 1;
        padding: 15px;
        border-right: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .metric-stats-section {
        flex: 1;
        padding: 15px;
        background: white;
      }
      
      .combined-audio-analysis-container .metric-data-section h4,
      .combined-audio-analysis-container .metric-stats-section h4 {
        margin: 0 0 15px 0;
        font-size: 16px;
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .metric-data-section h4 {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-stats-section h4 {
        color: #495057;
        border-bottom-color: #dee2e6;
      }
      
      /* 为每个指标行添加不同的颜色主题 */
      .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section {
        background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
        border-right-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section h4 {
        color: #667eea;
        border-bottom-color: #667eea;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section {
        background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
        border-right-color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section h4 {
        color: #ff6b6b;
        border-bottom-color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section {
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
        border-right-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section h4 {
        color: #4ecdc4;
        border-bottom-color: #4ecdc4;
      }
      
      /* 响应式设计 */
      @media (max-width: 768px) {
        .combined-audio-analysis-container .metric-row {
          flex-direction: column;
          gap: 0;
        }
        
        .combined-audio-analysis-container .metric-data-section {
          border-right: none;
          border-bottom: 1px solid #e9ecef;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(1) .metric-data-section {
          border-bottom-color: #667eea;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(2) .metric-data-section {
          border-bottom-color: #ff6b6b;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section {
          border-bottom-color: #4ecdc4;
        }
      }
      
      /* 数据表格样式优化 */
      .combined-audio-analysis-container .metric-data-section .data-table {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar {
        width: 6px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .combined-audio-analysis-container .metric-data-section .data-table::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .issue-checkboxes {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        flex-shrink: 0;
      }
      
      .combined-audio-analysis-container .checkbox-group {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .combined-audio-analysis-container .checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s;
        background: white;
        border: 1px solid #dee2e6;
      }
      
      .combined-audio-analysis-container .checkbox-item:hover {
        background: #e9ecef;
        border-color: #adb5bd;
      }
      
      .combined-audio-analysis-container .checkbox-item input[type="checkbox"] {
        width: 16px;
        height: 16px;
        margin: 0;
        cursor: pointer;
        accent-color: #667eea;
      }
      
      .combined-audio-analysis-container .checkbox-label {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        cursor: pointer;
      }
      
      .combined-audio-analysis-container .checkbox-item:has(input:checked) {
        background: #e3f2fd;
        border-color: #667eea;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
      }
      
      .combined-audio-analysis-container .checkbox-item:has(input:checked) .checkbox-label {
        color: #667eea;
        font-weight: 600;
      }
      
      /* 问题状态样式 */
      .combined-audio-analysis-container.has-no-sound {
        border-left: 4px solid #ff6b6b;
      }
      
      .combined-audio-analysis-container.has-low-level {
        border-left: 4px solid #ffa726;
      }
      
      .combined-audio-analysis-container.has-echo {
        border-left: 4px solid #f44336;
      }
      
      .combined-audio-analysis-container.has-no-sound .chart-header {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
      }
      
      .combined-audio-analysis-container.has-low-level .chart-header {
        background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
      }
      
      .combined-audio-analysis-container.has-echo .chart-header {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      }
      
      .combined-audio-analysis-container .chart-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
      }
      
      .combined-audio-analysis-container .tab-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        background: #f8f9fa;
        color: #495057;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .combined-audio-analysis-container .tab-btn:hover {
        background: #e9ecef;
        transform: translateY(-1px);
      }
      
      .combined-audio-analysis-container .tab-btn.active {
        background: #667eea;
        color: white;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }
      
      .combined-audio-analysis-container .chart-canvas-container {
        position: relative;
        height: 400px;
      }
      
      .combined-audio-analysis-container .chart-canvas-container canvas {
        width: 100% !important;
        height: 100% !important;
      }
      
      .combined-audio-analysis-container .chart-footer {
        padding: 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .chart-stats {
        display: flex;
        gap: 30px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout {
        flex-direction: column;
        gap: 20px;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section {
        width: 100%;
        margin-bottom: 15px;
        border-left: 4px solid #667eea;
        transition: all 0.3s ease;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section h4 {
        font-size: 16px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e9ecef;
        color: #495057;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-item {
        padding: 6px 0;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-item:last-child {
        border-bottom: none;
      }
      
      /* 为每个指标添加不同的颜色主题 */
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(1) {
        border-left-color: #667eea;
        background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(2) {
        border-left-color: #ff6b6b;
        background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(3) {
        border-left-color: #4ecdc4;
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(1) h4 {
        color: #667eea;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(2) h4 {
        color: #ff6b6b;
      }
      
      .combined-audio-analysis-container .chart-stats.vertical-layout .stat-section:nth-child(3) h4 {
        color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .stat-section {
        flex: 1;
        min-width: 200px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .stat-section h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 2px solid #667eea;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f1f3f4;
      }
      
      .combined-audio-analysis-container .stat-item:last-child {
        border-bottom: none;
      }
      
      .combined-audio-analysis-container .stat-label {
        color: #6c757d;
        font-size: 14px;
        font-weight: 500;
      }
      
      .combined-audio-analysis-container .stat-value {
        color: #495057;
        font-size: 14px;
        font-weight: 600;
        background: #e9ecef;
        padding: 4px 8px;
        border-radius: 4px;
      }
      
      
      
      .combined-audio-analysis-container .fallback-chart-info {
        text-align: center;
        padding: 20px;
      }
      
      .combined-audio-analysis-container .data-tables {
        display: flex;
        gap: 20px;
        margin-top: 20px;
      }
      
      .combined-audio-analysis-container .table-section {
        flex: 1;
        background: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .combined-audio-analysis-container .table-section h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 2px solid #667eea;
        padding-bottom: 8px;
      }
      
      .combined-audio-analysis-container .data-table-content {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      
      .combined-audio-analysis-container .data-table-content th,
      .combined-audio-analysis-container .data-table-content td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
      }
      
      .combined-audio-analysis-container .data-table-content th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
      }
      
      .combined-audio-analysis-container .data-table-content tr:hover {
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .status-badge {
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .combined-audio-analysis-container .status-low {
        background: #d4edda;
        color: #155724;
      }
      
      .combined-audio-analysis-container .status-medium {
        background: #fff3cd;
        color: #856404;
      }
      
      .combined-audio-analysis-container .status-high {
        background: #f8d7da;
        color: #721c24;
      }
      
      @media (max-width: 768px) {
        .combined-audio-analysis-container {
          width: 95% !important;
          max-width: none !important;
        }
        
        .combined-audio-analysis-container .chart-stats {
          flex-direction: column;
          gap: 15px;
        }
        
        .combined-audio-analysis-container .data-tables {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(chartContainer);

  // 创建数据表格
  createDataTable(aecDelayData.data, 'aecDataTable');
  createDataTable(signalLevelData.data, 'signalDataTable');
  createDataTable(recordSignalVolumeData.data, 'recordDataTable');

  // 添加全局函数
  // 更新问题状态
  window.updateIssueStatus = (issueType, isChecked) => {
    console.log(`问题状态更新: ${issueType} = ${isChecked}`);
    
    // 更新全局状态对象
    if (!window.audioAnalysisIssues) {
      window.audioAnalysisIssues = {
        isNoSound: false,
        isLowLevel: false,
        isEcho: false
      };
    }
    
    window.audioAnalysisIssues[issueType] = isChecked;
    
    // 根据问题状态更新图表显示
    updateChartBasedOnIssues();
    
    // 显示状态更新通知
    const statusText = isChecked ? '已标记' : '已取消';
    showNotification(`${getIssueDisplayName(issueType)} ${statusText}`, 'info');
  };
  
  // 获取问题显示名称
  function getIssueDisplayName(issueType) {
    const names = {
      'isNoSound': '无声',
      'isLowLevel': '音量小',
      'isEcho': '回声'
    };
    return names[issueType] || issueType;
  }
  
  // 根据问题状态更新图表
  function updateChartBasedOnIssues() {
    const issues = window.audioAnalysisIssues || {};
    
    // 更新图表标题以反映问题状态
    updateChartTitle(issues);
    
    // 根据问题状态调整图表样式
    adjustChartStyles(issues);
    
    // 更新统计信息显示
    updateStatisticsDisplay(issues);
  }
  
  // 更新图表标题
  function updateChartTitle(issues) {
    const header = document.querySelector('.combined-audio-analysis-container .chart-header h3');
    if (header) {
      let title = '📊 音频分析 - AEC Delay, Signal Level & Record Volume';
      
      const activeIssues = Object.entries(issues)
        .filter(([key, value]) => value)
        .map(([key]) => getIssueDisplayName(key));
      
      if (activeIssues.length > 0) {
        title += ` (问题: ${activeIssues.join(', ')})`;
      }
      
      header.textContent = title;
    }
  }
  
  // 调整图表样式
  function adjustChartStyles(issues) {
    const chartContainer = document.querySelector('.combined-audio-analysis-container');
    if (!chartContainer) return;
    
    // 根据问题状态添加相应的 CSS 类
    chartContainer.classList.remove('has-no-sound', 'has-low-level', 'has-echo');
    
    if (issues.isNoSound) {
      chartContainer.classList.add('has-no-sound');
    }
    if (issues.isLowLevel) {
      chartContainer.classList.add('has-low-level');
    }
    if (issues.isEcho) {
      chartContainer.classList.add('has-echo');
    }
  }
  
  // 更新统计信息显示
  function updateStatisticsDisplay(issues) {
    // 这里可以根据问题状态调整统计信息的显示
    // 例如，高亮显示相关的问题指标
    const statSections = document.querySelectorAll('.stat-section');
    
    statSections.forEach(section => {
      const title = section.querySelector('h4');
      if (!title) return;
      
      const titleText = title.textContent;
      
      // 根据问题类型高亮相应的统计区域
      if (issues.isNoSound && titleText.includes('Record Volume')) {
        section.style.borderLeft = '4px solid #ff6b6b';
        section.style.background = '#fff5f5';
      } else if (issues.isLowLevel && titleText.includes('Signal Level')) {
        section.style.borderLeft = '4px solid #ffa726';
        section.style.background = '#fff8e1';
      } else if (issues.isEcho && titleText.includes('AEC Delay')) {
        section.style.borderLeft = '4px solid #f44336';
        section.style.background = '#ffebee';
      } else {
        section.style.borderLeft = '2px solid #667eea';
        section.style.background = 'white';
      }
    });
  }
  
  window.exportCombinedChartData = () => {
    const csvData = [
      '时间戳,AEC Delay(ms),Signal Level,Record Volume,问题状态',
      ...aecDelayData.data.map((point, index) => {
        const signalPoint = signalLevelData.data[index] || { value: 0 };
        const recordPoint = recordSignalVolumeData.data[index] || { value: 0 };
        const issues = window.audioAnalysisIssues || {};
        const issueInfo = Object.entries(issues)
          .filter(([key, value]) => value)
          .map(([key]) => getIssueDisplayName(key))
          .join(';');
        return `${new Date(point.timestamp).toISOString()},${point.value},${signalPoint.value},${recordPoint.value},"${issueInfo}"`;
      })
    ].join('\n');
    
    const csvContent = csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `combined-audio-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('组合音频分析数据已导出', 'success');
  };

  window.refreshCombinedFallbackChart = () => {
    const newAecData = generateMockAecDelayData();
    const newSignalData = generateMockAudioSignalLevelNearinData();
    const newRecordData = generateMockARecordSignalVolumeData();
    createDataTable(newAecData.data, 'aecDataTable');
    createDataTable(newSignalData.data, 'signalDataTable');
    createDataTable(newRecordData.data, 'recordDataTable');
    showNotification('数据已刷新', 'success');
  };

  showNotification('组合音频分析已显示（简化模式）', 'success');
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
function createDataTable(data, containerId = 'dataTable') {
  const tableContainer = document.getElementById(containerId);
  if (!tableContainer) return;

  // 过滤有效数据（保留0值）
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  
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

// 主函数：注入Auto Check按钮到所有info_right元素
async function injectAutoCheckButton() {
  try {
    // 等待info_right元素出现
    const infoRightElements = await waitForAllElements('.info_right');
    
    if (infoRightElements.length === 0) {
      console.log('未找到info_right元素');
      return;
    }
    
    console.log(`找到${infoRightElements.length}个info_right元素`);
    
    // 为每个info_right元素添加按钮
    infoRightElements.forEach((infoRight, index) => {
      injectButtonToInfoRight(infoRight, index);
    });
    
  } catch (error) {
    console.error('注入Auto Check按钮失败:', error);
  }
}

// 为单个info_right元素注入按钮
function injectButtonToInfoRight(infoRight, index) {
  try {
    // 检查是否已经添加了按钮（避免重复添加）
    const existingButton = infoRight.querySelector('.auto-check-btn');
    if (existingButton) {
      console.log(`info_right[${index}] 中Auto Check按钮已存在，跳过添加`);
      return;
    }
    
    // 查找voqa容器（根据HTML结构）
    const voqa = infoRight.querySelector('.voqa');
    if (voqa) {
      // 在voqa容器后添加Auto Check按钮
      const button = createAutoCheckButton();
      button.setAttribute('data-info-right-index', index);
      
      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'btn-group auto-check-container';
      buttonContainer.setAttribute('data-info-right-index', index);
      buttonContainer.appendChild(button);
      
      // 添加到voqa后面
      voqa.parentNode.insertBefore(buttonContainer, voqa.nextSibling);
      
      console.log(`Auto Check按钮已成功添加到info_right[${index}]区域`);
    } else {
      // 如果没有找到voqa，直接在info_right末尾添加
      const button = createAutoCheckButton();
      button.setAttribute('data-info-right-index', index);
      
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'btn-group auto-check-container';
      buttonContainer.setAttribute('data-info-right-index', index);
      buttonContainer.appendChild(button);
      
      infoRight.appendChild(buttonContainer);
      console.log(`Auto Check按钮已添加到info_right[${index}]区域末尾`);
    }
    
  } catch (error) {
    console.error(`为info_right[${index}]注入按钮失败:`, error);
  }
}

// 等待多个元素出现
function waitForAllElements(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      resolve(Array.from(elements));
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        obs.disconnect();
        resolve(Array.from(elements));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      const elements = document.querySelectorAll(selector);
      resolve(Array.from(elements));
    }, timeout);
  });
}

// 页面加载完成后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectAutoCheckButton();
    // 启动网络监听
    monitorNetworkRequests();
  });
} else {
  injectAutoCheckButton();
  // 启动网络监听
  monitorNetworkRequests();
}

// 监听页面变化，动态添加按钮
// 简单去抖，避免频繁触发重复扫描
let __autoCheckDebounceTimer = null;
const observer = new MutationObserver((mutations) => {
  let shouldRecheck = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 检查新添加的节点是否包含info_right
          if (node.classList && node.classList.contains('info_right')) {
            shouldRecheck = true;
          } else if (node.querySelector && node.querySelector('.info_right')) {
            shouldRecheck = true;
          }
        }
      });
    }
  });
  
  // 如果有新的info_right元素添加，重新检查并注入按钮（去抖）
  if (shouldRecheck) {
    if (__autoCheckDebounceTimer) {
      clearTimeout(__autoCheckDebounceTimer);
    }
    __autoCheckDebounceTimer = setTimeout(() => {
      checkAndInjectNewButtons();
      __autoCheckDebounceTimer = null;
    }, 150);
  }
});

// 检查并注入新按钮
function checkAndInjectNewButtons() {
  const allInfoRightElements = document.querySelectorAll('.info_right');
  
  allInfoRightElements.forEach((infoRight, index) => {
    // 检查是否已经有按钮
    const existingButton = infoRight.querySelector('.auto-check-btn');
    if (!existingButton) {
      console.log(`发现新的info_right[${index}]，准备添加按钮`);
      injectButtonToInfoRight(infoRight, index);
    }
  });
}

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});

