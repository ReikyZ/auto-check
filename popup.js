// Popup页面的JavaScript逻辑

document.addEventListener('DOMContentLoaded', function () {
  // 获取页面元素
  const pageStatusEl = document.getElementById('pageStatus');
  const buttonStatusEl = document.getElementById('buttonStatus');
  const checkCountEl = document.getElementById('checkCount');
  const manualCheckBtn = document.getElementById('manualCheck');
  const refreshStatusBtn = document.getElementById('refreshStatus');
  const openOptionsBtn = document.getElementById('openOptions');

  // 初始化状态
  updateStatus();

  // 手动执行检查按钮
  manualCheckBtn.addEventListener('click', function () {
    executeManualCheck();
  });

  // 刷新状态按钮
  refreshStatusBtn.addEventListener('click', function () {
    updateStatus();
  });

  // 打开选项页面按钮 (改为切换显示设置面板)
  openOptionsBtn.addEventListener('click', function () {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel.style.display === 'none') {
      settingsPanel.style.display = 'block';
      // 加载当前设置
      chrome.storage.local.get(['ai_analysis_server_url'], (result) => {
        if (result.ai_analysis_server_url) {
          document.getElementById('serverUrl').value = result.ai_analysis_server_url;
        } else {
          // 默认值 (Base URL)
          document.getElementById('serverUrl').value = 'http://10.80.0.69:3000';
        }
      });
    } else {
      settingsPanel.style.display = 'none';
    }
  });

  // 保存设置按钮
  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', function () {
      const url = document.getElementById('serverUrl').value.trim();
      if (url) {
        chrome.storage.local.set({ ai_analysis_server_url: url }, () => {
          showMessage('设置已保存', 'success');
          document.getElementById('settingsPanel').style.display = 'none';
        });
      } else {
        showMessage('请输入有效的 URL', 'error');
      }
    });
  }

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
});
