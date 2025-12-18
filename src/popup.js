// Popup页面的JavaScript逻辑

document.addEventListener('DOMContentLoaded', function() {
  // 获取页面元素
  const pageStatusEl = document.getElementById('pageStatus');
  const buttonStatusEl = document.getElementById('buttonStatus');
  const checkCountEl = document.getElementById('checkCount');
  const manualCheckBtn = document.getElementById('manualCheck');
  const refreshStatusBtn = document.getElementById('refreshStatus');
  const openOptionsBtn = document.getElementById('openOptions');

  // 新增：获取 checkbox 和分析区域元素
  const issueCheckboxes = document.querySelectorAll('.issue-checkbox');
  const analysisResultsEl = document.querySelector('.analysis-results');
  const analysisContentEl = document.getElementById('analysisContent');

  // 初始化状态
  updateStatus();
  updateAnalysisDisplay(); // 新增：初始化分析显示

  // 手动执行检查按钮
  manualCheckBtn.addEventListener('click', function() {
    executeManualCheck();
  });

  // 刷新状态按钮
  refreshStatusBtn.addEventListener('click', function() {
    updateStatus();
  });

  // 打开选项页面按钮
  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // 新增：监听 checkbox 变化事件
  issueCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      updateAnalysisDisplay();
    });
  });

  // 更新状态信息
  async function updateStatus() {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        pageStatusEl.textContent = '已加载';
        pageStatusEl.style.background = 'rgba(76, 175, 80, 0.3)';
        
        // 检查页面上是否有Auto Check按钮
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: checkButtonExists
        });
        
        if (results && results[0] && results[0].result) {
          buttonStatusEl.textContent = '已注入';
          buttonStatusEl.style.background = 'rgba(76, 175, 80, 0.3)';
        } else {
          buttonStatusEl.textContent = '未找到';
          buttonStatusEl.style.background = 'rgba(244, 67, 54, 0.3)';
        }
        
        // 获取检查次数（从localStorage）
        const checkCount = await getCheckCount();
        checkCountEl.textContent = checkCount.toString();
        
      } else {
        pageStatusEl.textContent = '无活动页面';
        pageStatusEl.style.background = 'rgba(244, 67, 54, 0.3)';
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      pageStatusEl.textContent = '错误';
      pageStatusEl.style.background = 'rgba(244, 67, 54, 0.3)';
    }
  }

  // 新增：更新 popup 高度以适应内容
  function updatePopupHeight() {
    // 使用 requestAnimationFrame 确保 DOM 更新后再计算高度
    requestAnimationFrame(() => {
      // 获取 body 的实际内容高度
      const bodyHeight = document.body.scrollHeight;
      // 设置 popup 高度等于内容高度
      document.body.style.height = `${bodyHeight}px`;
      document.documentElement.style.height = `${bodyHeight}px`;
    });
  }

  // 新增：更新分析显示
  function updateAnalysisDisplay() {
    const selectedIssues = Array.from(issueCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.dataset.issue);

    if (selectedIssues.length === 0) {
      // 没有勾选任何 issue 时，隐藏分析区域
      analysisResultsEl.style.display = 'none';
      analysisContentEl.innerHTML = '';
      // 更新 popup 高度以适应内容
      updatePopupHeight();
      return;
    }

    // 显示分析区域
    analysisResultsEl.style.display = 'block';

    // 获取与选中 issue 相关的所有指标
    const relatedMetrics = getRelatedMetricsForSelectedIssues(selectedIssues);

    // 生成分析内容
    const analysisContent = generateAnalysisContent(relatedMetrics);
    analysisContentEl.innerHTML = analysisContent;

    // 移除分析结果区域的 max-height 限制，让它自动适应内容
    analysisResultsEl.style.maxHeight = 'none';
    
    // 更新 popup 高度以适应内容
    updatePopupHeight();
  }

  // 新增：根据选中的 issue 获取相关指标
  function getRelatedMetricsForSelectedIssues(selectedIssues) {
    const allMetrics = [
      'Audio AEC Delay',
      'Audio Signal Level Nearin',
      'Audio Signal Level Nearout',
      'A RECORD SIGNAL VOLUME',
      'A PLAYOUT SIGNAL VOLUME',
      'Chat Engine Error Code',
      'Audio Playback Frequency',
      'AUDIO DOWNLINK PULL 10MS DATA TIME'
    ];

    const relatedMetrics = new Set();

    selectedIssues.forEach(issueType => {
      const metricsForIssue = getMetricsForIssueType(issueType);
      metricsForIssue.forEach(metric => {
        relatedMetrics.add(metric);
      });
    });

    // 确保 Chat Engine Error Code 始终包含（因为它关联所有 issue）
    relatedMetrics.add('Chat Engine Error Code');

    return Array.from(relatedMetrics);
  }

  // 新增：生成分析内容
  function generateAnalysisContent(metrics) {
    if (metrics.length === 0) {
      return '<p style="color: rgba(255, 255, 255, 0.7);">没有找到相关分析数据</p>';
    }

    let content = `<p style="margin: 0 0 10px 0; font-weight: 500;">检测到 ${metrics.length} 个相关指标：</p>`;

    metrics.forEach(metric => {
      const issueRelations = getMetricIssueTypes(metric);
      const relatedIssues = Object.keys(issueRelations).filter(key => issueRelations[key] === 1);
      
      // 获取指标描述（简化版）
      const metricDescription = getMetricDescription(metric);
      
      content += `
        <div style="margin-bottom: 12px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${metric}</div>
          <div style="font-size: 11px; opacity: 0.8;">${metricDescription}</div>
          <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
            关联问题类型：${relatedIssues.map(issue => getIssueTypeConfig(issue)?.name || issue).join('、')}
          </div>
        </div>
      `;
    });

    return content;
  }

  // 新增：获取指标描述
  function getMetricDescription(metric) {
    const descriptions = {
      'Audio AEC Delay': '音频回声消除延迟检测',
      'Audio Signal Level Nearin': '音频信号强度检测',
      'Audio Signal Level Nearout': '音频输出信号强度检测',
      'A RECORD SIGNAL VOLUME': '录音信号音量检测',
      'A PLAYOUT SIGNAL VOLUME': '播放信号音量检测',
      'Chat Engine Error Code': '聊天引擎错误码分析',
      'Audio Playback Frequency': '音频播放频率监控',
      'AUDIO DOWNLINK PULL 10MS DATA TIME': '音频下行数据拉取延迟'
    };
    return descriptions[metric] || '未知指标';
  }

  // 执行手动检查
  async function executeManualCheck() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab) {
        // 在页面上执行自动检查
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: performAutoCheckFromPopup
        });
        
        if (results && results[0] && results[0].result) {
          // 更新检查次数
          const newCount = await incrementCheckCount();
          checkCountEl.textContent = newCount.toString();
          
          // 显示成功消息
          showMessage('手动检查执行成功！', 'success');
          
          // 刷新分析显示
          updateAnalysisDisplay();
        } else {
          showMessage('手动检查执行失败', 'error');
        }
      }
    } catch (error) {
      console.error('执行手动检查失败:', error);
      showMessage('执行检查时出现错误: ' + error.message, 'error');
    }
  }

  // 检查按钮是否存在（在页面上下文中执行）
  function checkButtonExists() {
    return document.querySelector('.auto-check-btn') !== null;
  }

  // 在页面上下文中执行自动检查
  function performAutoCheckFromPopup() {
    // 查找Auto Check按钮并点击
    const autoCheckBtn = document.querySelector('.auto-check-btn');
    if (autoCheckBtn) {
      autoCheckBtn.click();
      return true;
    }
    return false;
  }

  // 获取检查次数
  async function getCheckCount() {
    const result = await chrome.storage.local.get(['checkCount']);
    return result.checkCount || 0;
  }

  // 增加检查次数
  async function incrementCheckCount() {
    const currentCount = await getCheckCount();
    const newCount = currentCount + 1;
    await chrome.storage.local.set({ checkCount: newCount });
    return newCount;
  }

  // 显示消息
  function showMessage(message, type = 'info') {
    // 创建临时消息元素
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
      color: white;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
      messageEl.style.opacity = '1';
    }, 100);
    
    // 3秒后移除
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 3000);
  }

  // 监听来自content script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateStatus') {
      updateStatus();
    }
  });

  // 监听 popup 关闭事件，重新启用所有 auto-check 按钮
  // 使用 blur 事件，这是 Chrome Extension popup 关闭时最可靠的事件
  let enableButtonsOnClose = function() {
    console.log('🔄 Popup: 开始处理关闭事件，准备启用 auto-check 按钮');
    
    // 重置所有 checkbox 状态为未勾选
    issueCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    console.log('✅ Popup: 已重置所有 checkbox 状态');
    
    // 更新分析显示（隐藏分析结果区域）
    updateAnalysisDisplay();
    
    // 直接通过 background script 转发消息，这样更可靠
    console.log('📤 Popup: 发送消息到 background script');
    chrome.runtime.sendMessage({
      type: 'ENABLE_AUTO_CHECK_BUTTONS'
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('⚠️ Popup: 发送消息到 background 失败:', chrome.runtime.lastError.message);
        // 如果 background 失败，尝试直接发送到 content script
        console.log('🔄 Popup: 尝试直接发送消息到 content script');
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs && tabs[0]) {
            console.log(`📤 Popup: 直接发送消息到 tab ${tabs[0].id}`);
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'ENABLE_AUTO_CHECK_BUTTONS'
            }, function(response) {
              if (chrome.runtime.lastError) {
                console.log('⚠️ Popup: 直接发送到 content script 也失败:', chrome.runtime.lastError.message);
              } else {
                console.log('✅ Popup: 已直接发送消息到 content script，响应:', response);
              }
            });
          } else {
            console.log('⚠️ Popup: 未找到活动标签页');
          }
        });
      } else {
        console.log('✅ Popup: 已通过 background 转发消息，响应:', response);
      }
    });
  };

  // 防止重复触发
  let hasTriggered = false;
  let enableButtonsOnCloseWrapper = function(eventName) {
    if (hasTriggered) {
      console.log(`⏭️ Popup: ${eventName} 事件已触发，跳过（避免重复）`);
      return;
    }
    hasTriggered = true;
    console.log(`👋 Popup: ${eventName} 事件触发`);
    enableButtonsOnClose();
    
    // 3秒后重置标志，以防需要再次触发
    setTimeout(() => {
      hasTriggered = false;
    }, 3000);
  };

  // 监听多个事件以确保消息能够发送
  // blur 事件是最可靠的，当 popup 失去焦点时触发
  window.addEventListener('blur', function() {
    enableButtonsOnCloseWrapper('blur');
  });
  
  // beforeunload 作为备用
  window.addEventListener('beforeunload', function() {
    enableButtonsOnCloseWrapper('beforeunload');
  });
  
  // pagehide 作为备用（在某些浏览器中更可靠）
  window.addEventListener('pagehide', function() {
    enableButtonsOnCloseWrapper('pagehide');
  });
  
  // visibilitychange 作为备用
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      enableButtonsOnCloseWrapper('visibilitychange');
    }
  });

  // 新增：从 issue-rules.js 导入必要函数（确保在浏览器环境中可用）
  if (typeof window.getMetricsForIssueType === 'undefined') {
    // 如果函数未定义，说明 issue-rules.js 未正确加载，需要手动定义或确保加载顺序
    console.warn('issue-rules.js 函数未加载，请确保在 manifest.json 中正确配置');
  }
});
