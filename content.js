// ============================================
// 注入 ext-counter.js 脚本到页面上下文
// ============================================
function injectExtCounterScript() {
  // 防止重复注入
  if (window.__extCounterScriptInjected) {
    return;
  }
  window.__extCounterScriptInjected = true;

  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/ext-counter.js');
    script.onload = function () {
      console.log('✅ ext-counter.js 已成功注入到页面上下文');
      this.remove(); // 移除 script 标签
    };
    script.onerror = function () {
      console.error('❌ 注入 ext-counter.js 失败');
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('❌ 注入 ext-counter.js 脚本时出错:', error);
  }
}

// ============================================
// 注入 injected.js 脚本到页面上下文
// ============================================
function injectInjectedScript() {
  // 防止重复注入
  if (window.__injectedScriptInjected) {
    return;
  }
  window.__injectedScriptInjected = true;

  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/injected.js');
    script.onload = function () {
      console.log('✅ injected.js 已成功注入到页面上下文');
      this.remove(); // 移除 script 标签
    };
    script.onerror = function () {
      console.error('❌ 注入 injected.js 失败');
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('❌ 注入脚本时出错:', error);
  }
}

// ============================================
// 监听来自 injected.js 的消息
// ============================================
(function () {
  // 防止重复设置
  if (window.__contentScriptMessageListenerSetup) {
    return;
  }
  window.__contentScriptMessageListenerSetup = true;

  // 初始化存储 counters 请求的 Map
  if (!window.countersInterceptedRequests) {
    window.countersInterceptedRequests = new Map();
  }

  // 监听来自 injected script 的消息
  window.addEventListener('message', function (event) {
    // 安全检查：只处理来自同源的消息
    // 注意：由于 injected script 在页面上下文中运行，event.source 是 window
    if (event.data && event.data.source === 'INJECTED_SCRIPT') {
      const messageType = event.data.type;
      const data = event.data.data;

      // 处理保存 counters 数据的请求
      if (messageType === 'SAVE_COUNTERS_DATA') {
        if (data && data.sid && data.url && data.data) {
          (async () => {
            try {
              const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
              // saveData 参数: type, uid, url, data
              await dataUtil.saveData('counters', data.sid, data.url, data.data);
              if (window.__autoCheckDebug) {
                console.log(`[Content Script] 已保存 counters_${data.sid} 到 dataUtil`);
              }
            } catch (e) {
              console.warn('[Content Script] 保存 counters 数据到 dataUtil 失败:', e);
            }
          })();
        }
        return; // 处理完就返回，不继续处理
      }


      if (messageType === 'SAVE_EVENTS_DATA') {
        if (data && data.sid && data.url && data.data) {
          (async () => {
            try {
              const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
              // saveData 参数: type, uid, url, data
              await dataUtil.saveData('events', data.sid, data.url, data.data);
              if (window.__autoCheckDebug) {
                console.log(`[Content Script] 已保存 events_${data.sid} 到 dataUtil`);
              }
              // 保存 events 数据后，启用所有 auto-check 按钮
              enableAutoCheckButtons();
            } catch (e) {
              console.warn('[Content Script] 保存 events 数据到 dataUtil 失败:', e);
            }
          })();
        }
        return; // 处理完就返回，不继续处理
      }

      // 处理保存用户信息请求
      if (messageType === 'SAVE_USER_INFO') {
        if (data && data.name) {
          window.argusUserInfo = data;
          console.log('[Content Script] 已保存用户信息:', data.name);
        }
        return;
      }

      if (messageType === 'NETWORK_REQUEST') {
        console.log('📨 [Content Script] 收到来自 injected script 的网络请求数据:', data);

        // 存储请求信息
        if (data.url) {
          window.countersInterceptedRequests.set(data.url, {
            url: data.url,
            method: data.method,
            type: data.type,
            requestHeaders: data.requestHeaders,
            requestBody: data.requestBody,
            responseText: data.responseText,
            status: data.status,
            statusText: data.statusText,
            responseHeaders: data.responseHeaders,
            timestamp: data.timestamp,
            error: data.error,
            timeout: data.timeout,
            errorMessage: data.errorMessage
          });

          // console.log(`✅ [Content Script] 已存储 ${data.type} 请求数据:`, {
          //   url: data.url,
          //   status: data.status,
          //   size: data.responseText ? data.responseText.length : 0
          // });

          // 如果 data.url 包含 /counters，解析出 uids 的值，并保存到 dataUtil
          if (data.url && data.url.includes('/counters')) {
            // 匹配 uids 参数
            const uidsMatch = data.url.match(/[?&]uids=([^&]+)/);
            if (uidsMatch && uidsMatch[1]) {
              const uid = uidsMatch[1];
              // 动态导入 data-util 并保存
              (async () => {
                try {
                  const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
                  // saveData 参数: type, uid, url, data
                  await dataUtil.saveData('counters', uid, data.url, data.responseText);
                  if (window.__autoCheckDebug) {
                    console.log(`[Content Script] 已保存 counters_${uid} 到 dataUtil`);
                  }
                } catch (e) {
                  console.warn('保存 counters 数据到 dataUtil 失败:', e);
                }
              })();
            }
          }



          // 如果有响应内容，尝试解析并打印
          // if (data.responseText && !data.error && !data.timeout) {
          //   console.log('📄 [Content Script] 响应内容:');
          //   try {
          //     const jsonData = JSON.parse(data.responseText);
          //     console.log(JSON.stringify(jsonData, null, 2));
          //   } catch (e) {
          //     console.log(data.responseText);
          //   }
          // }

          // 触发自定义事件，通知其他代码有新的网络请求数据
          window.dispatchEvent(new CustomEvent('networkRequestCaptured', {
            detail: data
          }));
        }
      }
    }
  });

  console.log('✅ [Content Script] 消息监听器已设置完成');
})();

// ============================================
// 立即注入脚本
// ============================================
// 先注入 ext-counter.js，再注入 injected.js
// 确保 ext-counter.js 在 injected.js 之前加载，这样 injected.js 就能读取到 window.__EXT_COUNTER_IDS__
// 使用立即执行，不等待 DOMContentLoaded
injectExtCounterScript();
// 延迟一点时间确保 ext-counter.js 先加载完成
setTimeout(() => {
  injectInjectedScript();
}, 10);

// ============================================
// 启动 background 的网络监控（保留原有功能）
// ============================================
if (typeof chrome !== 'undefined' && chrome.runtime) {
  try {
    chrome.runtime.sendMessage(
      { type: 'START_NETWORK_MONITORING' },
      (response) => {
        if (response && response.success) {
          console.log('✅ Background 网络监听启动成功');
        } else {
          console.warn('⚠️ Background 网络监听启动失败:', response);
        }
      }
    );

    // 主动获取用户信息
    chrome.runtime.sendMessage(
      { type: 'FETCH_USER_INFO' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('⚠️ 获取用户信息失败:', chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success && response.data) {
          window.argusUserInfo = response.data;
          console.log('✅ 已获取并保存用户信息:', response.data.name);
        } else {
          console.warn('⚠️ 获取用户信息失败:', response?.error || '未知错误');
        }
      }
    );
  } catch (error) {
    console.warn('⚠️ 启动 Background 网络监听时出错:', error);
  }
}

// 全局函数定义 - 确保在任何其他代码之前定义
window.updateIssueStatus = async function (issueType, isChecked) {
  console.log('updateIssueStatus called:', issueType, isChecked);

  // 初始化全局状态对象
  if (!window.audioAnalysisIssues) {
    window.audioAnalysisIssues = {
      isErrorCode: false,
      isNoSound: false,
      isLowLevel: false,
      isEcho: false,
      isAudioStutter: false,
      isBlack: false
    };
  }

  // 更新状态
  window.audioAnalysisIssues[issueType] = isChecked;

  // 显示调试信息
  console.log('Updated issue status:', window.audioAnalysisIssues);

  // 如果是无声复选框，检查解码错误
  if (issueType === 'isNoSound' && isChecked) {
    // 获取 sid：优先从全局变量获取，如果没有则尝试从页面中获取
    let sid = window.currentSid || null;

    // 如果全局变量中没有，尝试从页面中获取
    if (!sid) {
      // 尝试查找最近的 auto-check 按钮，然后获取其对应的 sid
      const chartContainer = document.querySelector('.combined-audio-analysis-container');
      if (chartContainer) {
        // 查找最近的 auto-check 按钮
        const autoCheckButtons = document.querySelectorAll('.auto-check-btn');
        if (autoCheckButtons.length > 0) {
          // 使用第一个找到的 auto-check 按钮来获取 sid
          const firstButton = autoCheckButtons[0];
          const sidFromPage = collectSidValues(firstButton.closest('.user-info') || document);
          if (sidFromPage) {
            if (Array.isArray(sidFromPage) && sidFromPage.length > 0) {
              sid = sidFromPage[0].value || sidFromPage[0];
            } else if (typeof sidFromPage === 'string' && sidFromPage) {
              sid = sidFromPage;
            }
          }
        }
      }
    }

    console.log('checkDecodeErrors called with sid:', sid);
    await checkDecodeErrors(sid);
    await checkRecordVolume(sid)
    await checkPlayoutVolume(sid)
  }

  // 尝试更新图表显示（安全调用）
  try {
    if (typeof updateChartBasedOnIssues === 'function') {
      updateChartBasedOnIssues();
    }
  } catch (e) {
    console.warn('updateChartBasedOnIssues not available yet:', e);
  }

  // 显示通知（安全调用）
  try {
    if (typeof showNotification === 'function') {
      const issueName = getIssueDisplayName(issueType);
      const statusText = isChecked ? '已标记' : '已取消';
      showNotification(`${issueName} ${statusText}`, 'info');
    }
  } catch (e) {
    console.warn('showNotification not available yet:', e);
  }
};

/**
 * 解析 capabilities 字符串，提取 lower 部分的 codec 名称列表
 * @param {string} capabilitiesStr - capabilities 字符串，格式如 "0:{1:BROADCASTING}  1:{2:OPUS,3:OPUS2ch} ..."
 * @returns {Array<string>} codec 名称列表（小写）
 */
function parseCapabilitiesLower(capabilitiesStr) {
  if (!capabilitiesStr || typeof capabilitiesStr !== 'string') {
    return [];
  }

  const codecNames = [];
  // 查找 1:{...} 部分（lower 部分）
  const lowerMatch = capabilitiesStr.match(/1:\{([^}]+)\}/);
  if (lowerMatch && lowerMatch[1]) {
    // 提取 codec 名称，格式如 "2:OPUS,3:OPUS2ch"
    const codecPairs = lowerMatch[1].split(',');
    for (const pair of codecPairs) {
      const match = pair.match(/:\s*([^:]+)/);
      if (match && match[1]) {
        // 转换为小写并添加到列表
        codecNames.push(match[1].trim().toLowerCase());
      }
    }
  }

  return codecNames;
}

/**
 * 将 PACKET_TYPE 名称转换为 codec 名称（去掉 PACKET_TYPE_ 前缀并转小写）
 * @param {string} packetTypeName - PACKET_TYPE 名称，如 "PACKET_TYPE_NOVA"
 * @returns {string} codec 名称，如 "nova"
 */
function packetTypeNameToCodecName(packetTypeName) {
  if (!packetTypeName || typeof packetTypeName !== 'string') {
    return '';
  }
  // 去掉 PACKET_TYPE_ 前缀并转小写
  return packetTypeName.replace(/^PACKET_TYPE_/, '').toLowerCase();
}

/**
 * 检查解码错误并显示弹窗
 */
async function checkDecodeErrors(sid = null) {
  try {
    // 获取 events 数据
    const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
    const packetTypeModule = await import(chrome.runtime.getURL('src/packet-type.js'));

    // 尝试获取 events 数据（优先从 sid 获取，其次从 uid 获取）
    let eventsResponse = null;

    // 尝试从 window 获取 sid
    if (window.autoCheckSids && Array.isArray(window.autoCheckSids) && window.autoCheckSids.length > 0) {
      sid = window.autoCheckSids[0];
    }

    if (sid) {
      eventsResponse = await dataUtil.getData('events', sid);
    }

    // 如果还没有，尝试从 uid 获取
    if (!eventsResponse) {
      // 尝试从页面获取 uid
      const uidElements = document.querySelectorAll('.uid');
      if (uidElements.length > 0) {
        const uid = uidElements[0].textContent.trim();
        if (uid) {
          eventsResponse = await dataUtil.getData('eventlist', uid);
          if (!eventsResponse) {
            eventsResponse = await dataUtil.getData('events', uid);
          }
        }
      }
    }

    if (!eventsResponse) {
      console.warn('未找到 events 数据，跳过解码错误检查');
      return;
    }

    // 解析 events 数据
    let eventsData = null;
    try {
      eventsData = JSON.parse(eventsResponse);
    } catch (e) {
      console.error('解析 events 数据失败:', e);
      return;
    }

    if (!Array.isArray(eventsData)) {
      console.warn('events 数据格式不正确，应为数组');
      return;
    }

    // 查找 audioDiagStateDwlink 且 diagDescription 包含 decodeError 的项
    const decodeErrorItems = [];
    for (const item of eventsData) {
      if (item && item.details && item.details.nm === 'audioDiagStateDwlink') {
        const diagDescription = item.details.diagDescription;
        if (diagDescription && typeof diagDescription === 'string' && diagDescription.includes('decodeError')) {
          decodeErrorItems.push(item);
        }
      }
    }

    if (decodeErrorItems.length === 0) {
      console.log('未找到包含 decodeError 的 audioDiagStateDwlink 项');
      return;
    }

    // 处理每个解码错误项
    const unsupportedDecodes = [];
    for (const errorItem of decodeErrorItems) {
      const diagDescription = errorItem.details.diagDescription;

      // 解析 diagDescription，格式如 "{\"153012135\":\"downlink.noSound.decodeError.unknown\"}"
      let peerId = null;
      try {
        const descObj = JSON.parse(diagDescription);
        if (descObj && typeof descObj === 'object') {
          // 获取第一个 key 作为 peerId
          const keys = Object.keys(descObj);
          if (keys.length > 0) {
            peerId = keys[0];
          }
        }
      } catch (e) {
        console.warn('解析 diagDescription 失败:', e);
        continue;
      }

      if (!peerId) {
        continue;
      }

      // 查找 firstAudioPacketReceived 且 peer 匹配的项
      let codecValue = null;
      for (const item of eventsData) {
        if (item && item.details &&
          item.details.nm === 'firstAudioPacketReceived' &&
          String(item.details.peer) === String(peerId)) {
          codecValue = item.details.codec;
          break;
        }
      }

      if (codecValue === null || codecValue === undefined) {
        console.warn(`未找到 peer ${peerId} 的 firstAudioPacketReceived 项`);
        continue;
      }

      // 通过 packet-type.js 获取 codec name
      const packetTypeName = packetTypeModule.getPacketTypeName(codecValue);
      if (!packetTypeName) {
        console.warn(`未找到 codec value ${codecValue} 对应的 packet type name`);
        continue;
      }

      const codecName = packetTypeNameToCodecName(packetTypeName);

      // 查找 capabilities 项
      let capabilitiesLower = [];
      for (const item of eventsData) {
        if (item && item.details && item.details.nm === 'capabilities' && item.details.capabilities) {
          const capabilitiesStr = item.details.capabilities;
          capabilitiesLower = parseCapabilitiesLower(capabilitiesStr);
          break;
        }
      }

      // 检查 capabilities.lower 是否包含 codec name
      if (!capabilitiesLower.includes(codecName)) {
        // 获取当前 item 的 uid
        const uid = errorItem.details.uid || null;
        unsupportedDecodes.push({
          uid: uid,
          peer: peerId,
          codecValue: codecValue,
          codecName: codecName
        });
      }
    }

    // 如果有不支持的解码，显示弹窗
    if (unsupportedDecodes.length > 0) {
      showDecodeErrorPopup(unsupportedDecodes);
    }
  } catch (error) {
    console.error('检查解码错误时出错:', error);
  }
}

/**
 * 检查 A RECORD SIGNAL VOLUME 数据中非 null 的最后一个值，如果是 0 则提示
 */
async function checkRecordVolume(sid = null) {
  try {
    // 获取 counters 数据
    const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
    const recordVolumeModule = await import(chrome.runtime.getURL('src/metrics/record-volume.js'));

    // 尝试从 window 获取 sid
    if (window.autoCheckSids && Array.isArray(window.autoCheckSids) && window.autoCheckSids.length > 0) {
      sid = window.autoCheckSids[0];
    }

    let countersResponse = null;
    if (sid) {
      countersResponse = await dataUtil.getData('counters', sid);
    }

    // 如果还没有，尝试从 uid 获取
    if (!countersResponse) {
      const uidElements = document.querySelectorAll('.uid');
      if (uidElements.length > 0) {
        const uid = uidElements[0].textContent.trim();
        if (uid) {
          countersResponse = await dataUtil.getData('counters', uid);
        }
      }
    }

    if (!countersResponse) {
      console.warn('未找到 counters 数据，跳过 A RECORD SIGNAL VOLUME 检查');
      return;
    }

    // 获取 A RECORD SIGNAL VOLUME 数据
    const recordVolumeData = recordVolumeModule.getARecordSignalVolumeData(countersResponse);

    if (!recordVolumeData || !recordVolumeData.data || recordVolumeData.data.length === 0) {
      console.log('未找到 A RECORD SIGNAL VOLUME 数据');
      return;
    }

    // 找到非 null 的最后一个值
    let lastNonNullValue = null;
    for (let i = recordVolumeData.data.length - 1; i >= 0; i--) {
      const point = recordVolumeData.data[i];
      if (point && point.value !== null && point.value !== undefined) {
        lastNonNullValue = point.value;
        break;
      }
    }

    // 如果最后一个非 null 值是 0，则提示
    if (lastNonNullValue === 0) {
      showVolumeWarningPopup('⚠️ 录制音量 recording signal 为 0');
    }
  } catch (error) {
    console.error('检查 A RECORD SIGNAL VOLUME 时出错:', error);
  }
}

/**
 * 检查 A PLAYOUT SIGNAL VOLUME 数据中非 null 的最后一个值，如果是 0 则提示
 */
async function checkPlayoutVolume(sid = null) {
  try {
    // 获取 counters 数据
    const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
    const playoutVolumeModule = await import(chrome.runtime.getURL('src/metrics/playout-volume.js'));

    // 尝试从 window 获取 sid
    if (window.autoCheckSids && Array.isArray(window.autoCheckSids) && window.autoCheckSids.length > 0) {
      sid = window.autoCheckSids[0];
    }

    let countersResponse = null;
    if (sid) {
      countersResponse = await dataUtil.getData('counters', sid);
    }

    // 如果还没有，尝试从 uid 获取
    if (!countersResponse) {
      const uidElements = document.querySelectorAll('.uid');
      if (uidElements.length > 0) {
        const uid = uidElements[0].textContent.trim();
        if (uid) {
          countersResponse = await dataUtil.getData('counters', uid);
        }
      }
    }

    if (!countersResponse) {
      console.warn('未找到 counters 数据，跳过 A PLAYOUT SIGNAL VOLUME 检查');
      return;
    }

    // 获取 A PLAYOUT SIGNAL VOLUME 数据
    const playoutVolumeData = playoutVolumeModule.getAPlayoutSignalVolumeData(countersResponse);

    if (!playoutVolumeData || !playoutVolumeData.data || playoutVolumeData.data.length === 0) {
      console.log('未找到 A PLAYOUT SIGNAL VOLUME 数据');
      return;
    }

    // 找到非 null 的最后一个值
    let lastNonNullValue = null;
    for (let i = playoutVolumeData.data.length - 1; i >= 0; i--) {
      const point = playoutVolumeData.data[i];
      if (point && point.value !== null && point.value !== undefined) {
        lastNonNullValue = point.value;
        break;
      }
    }

    // 如果最后一个非 null 值是 0，则提示
    if (lastNonNullValue === 0) {
      showVolumeWarningPopup('⚠️ 播放音量 playout signal 为 0');
    }
  } catch (error) {
    console.error('检查 A PLAYOUT SIGNAL VOLUME 时出错:', error);
  }
}

/**
 * 显示音量警告弹窗
 * @param {string} message - 警告消息
 */
function showVolumeWarningPopup(message) {
  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.className = 'volume-warning-popup';

  popup.innerHTML = `
    <div class="popup-header">
      <h3>⚠️ 音量警告</h3>
      <button class="close-popup" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="popup-content">
      <div class="warning-message">
        ${message}
      </div>
    </div>
  `;

  // 添加样式
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    z-index: 10003;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;

  // 添加CSS样式
  const style = document.createElement('style');
  if (!document.getElementById('volume-warning-popup-style')) {
    style.id = 'volume-warning-popup-style';
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
      
      .volume-warning-popup .popup-header {
        background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .volume-warning-popup .popup-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .volume-warning-popup .close-popup {
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
      
      .volume-warning-popup .close-popup:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .volume-warning-popup .popup-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .volume-warning-popup .warning-message {
        color: #333;
        line-height: 1.8;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // 添加到页面
  document.body.appendChild(popup);

  // 点击关闭按钮
  const closeBtn = popup.querySelector('.close-popup');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.remove();
    });
  }

  // 点击外部区域关闭
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

/**
 * 显示解码错误弹窗
 * @param {Array} unsupportedDecodes - 不支持的解码列表，格式 [{uid, peer, codecValue, codecName}, ...]
 */
function showDecodeErrorPopup(unsupportedDecodes) {
  // 创建弹窗容器
  const popup = document.createElement('div');
  popup.className = 'decode-error-popup';

  const messages = unsupportedDecodes.map(item => {
    const uidText = item.uid ? `${item.uid}` : '未知用户';
    return `${uidText}不支持对${item.peer}的解码：${item.codecValue}/${item.codecName}`;
  }).join('<br>');

  popup.innerHTML = `
    <div class="popup-header">
      <h3>⚠️ 解码错误提示</h3>
      <button class="close-popup" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="popup-content">
      <div class="error-messages">
        ${messages}
      </div>
    </div>
  `;

  // 添加样式
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    z-index: 10003;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideIn 0.3s ease-out;
  `;

  // 添加CSS样式
  const style = document.createElement('style');
  if (!document.getElementById('decode-error-popup-style')) {
    style.id = 'decode-error-popup-style';
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
      
      .decode-error-popup .popup-header {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .decode-error-popup .popup-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      
      .decode-error-popup .close-popup {
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
      
      .decode-error-popup .close-popup:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .decode-error-popup .popup-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
      }
      
      .decode-error-popup .error-messages {
        color: #333;
        line-height: 1.8;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // 添加到页面
  document.body.appendChild(popup);

  // 点击关闭按钮
  const closeBtn = popup.querySelector('.close-popup');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.remove();
    });
  }

  // 点击外部区域关闭
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

// 获取问题显示名称
function getIssueDisplayName(issueType) {
  const names = {
    'isErrorCode': '错误码',
    'isNoSound': '无声',
    'isLowLevel': '音量小',
    'isEcho': '回声',
    'isAudioStutter': '音频卡顿',
    'isBlack': '黑屏'
  };
  return names[issueType] || issueType;
}

// 备用计算函数定义（在 src/utils.js 模块加载之前使用）
// 这些函数在 src/utils.js 加载完成后会被覆盖
window.calculateAverageDelay = function (data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  const sum = validData.reduce((acc, point) => acc + point.value, 0);
  return Math.round(sum / validData.length);
};

window.calculateMaxDelay = function (data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  return Math.max(...validData.map(point => point.value));
};

window.calculateChangeCount = function (data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return 0;
  let count = 0;
  for (let i = 1; i < validData.length; i++) {
    if (validData[i].value !== validData[i - 1].value) {
      count++;
    }
  }
  return count;
};

window.calculateChangeFrequency = function (data) {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return '0';
  const changeCount = window.calculateChangeCount(data);
  const timestamps = validData.map(point => point.timestamp);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const durationSec = (maxTs - minTs) > 0 ? (maxTs - minTs) / 1000 : 0;
  return durationSec > 0 ? (changeCount / durationSec).toFixed(3) + '/s' : '0';
};

// 加载指标分析模块
(function () {
  console.log('开始加载指标分析模块...');

  // 需要加载的模块列表
  const modules = [
    'src/utils.js',
    'src/issue-rules.js',
    'src/base-info.js',
    'src/data-util.js',
    'src/metrics/metrics-utils.js',
    'src/metrics/aec-delay.js',
    'src/metrics/signal-level.js',
    'src/metrics/record-volume.js',
    'src/metrics/error-code.js',
    'src/metrics/metrics-manager.js'
  ];

  let loadedCount = 0;
  let modulesLoaded = false;

  // 加载单个模块
  function loadModule(modulePath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(modulePath);

      // 使用 ES6 模块类型加载
      script.type = 'module';

      script.onload = () => {
        loadedCount++;
        console.log(`✅ 模块加载完成: ${modulePath} (${loadedCount}/${modules.length})`);
        if (modulePath === 'src/base-info.js') {
          console.log('🔍 检查 base-info.js 暴露的函数:', {
            getSDKClientRole: typeof window.getSDKClientRole,
            getRoleDisplayText: typeof window.getRoleDisplayText,
            updateBaseInfo: typeof window.updateBaseInfo
          });
          console.log('🔍 检查 globalThis:', {
            getSDKClientRole: typeof globalThis.getSDKClientRole,
            getRoleDisplayText: typeof globalThis.getRoleDisplayText,
            updateBaseInfo: typeof globalThis.updateBaseInfo
          });
        }
        resolve();
      };
      script.onerror = (error) => {
        console.error(`❌ 模块加载失败: ${modulePath}`, error);
        console.error('模块路径:', chrome.runtime.getURL(modulePath));
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  // 顺序加载所有模块
  async function loadAllModules() {
    try {
      for (const module of modules) {
        await loadModule(module);
      }
      modulesLoaded = true;
      window.modulesLoaded = true; // 更新全局状态
      console.log('所有指标模块加载完成！');
    } catch (error) {
      console.error('模块加载过程中出错:', error);
    }
  }

  // 开始加载模块
  loadAllModules();

  // 暴露模块加载状态
  window.modulesLoaded = modulesLoaded;
  window.checkModulesLoaded = function () {
    return modulesLoaded;
  };
})();

// ES6 动态 import 辅助函数
async function updateBaseInfoWithES6(responseText, eventsData = null) {
  try {
    // 如果 eventsData 为空，尝试从 dataUtil 获取
    if (!eventsData) {
      try {
        const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
        
        // 尝试从 sid 获取 events 数据
        if (window.autoCheckSids && Array.isArray(window.autoCheckSids) && window.autoCheckSids.length > 0) {
          const sid = window.autoCheckSids[0];
          eventsData = await dataUtil.getData('events', sid);
          if (eventsData) {
            console.log('✅ updateBaseInfoWithES6: 从 dataUtil 获取到 events 数据 (sid)');
            // 保存到 window 供后续使用
            window.currentEventsData = eventsData;
          }
        }
        
        // 如果还没有，尝试从 uid 获取
        if (!eventsData) {
          const uidElements = document.querySelectorAll('.uid');
          if (uidElements.length > 0) {
            const uid = uidElements[0].textContent.trim();
            if (uid) {
              eventsData = await dataUtil.getData('eventlist', uid);
              if (!eventsData) {
                eventsData = await dataUtil.getData('events', uid);
              }
              if (eventsData) {
                console.log('✅ updateBaseInfoWithES6: 从 dataUtil 获取到 events 数据 (uid)');
                // 保存到 window 供后续使用
                window.currentEventsData = eventsData;
              }
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ updateBaseInfoWithES6: 从 dataUtil 获取 events 数据失败:', e);
      }
    } else {
      // 如果 eventsData 存在，也保存到 window 供后续使用
      window.currentEventsData = eventsData;
    }
    
    // 使用 ES6 动态 import 导入模块
    const baseInfoModule = await import(chrome.runtime.getURL('src/base-info.js'));

    console.log('✅ ES6 动态 import 成功');
    console.log('📝 导入的模块:', baseInfoModule);
    console.log('📝 updateBaseInfo 类型:', typeof baseInfoModule.updateBaseInfo);

    if (responseText && typeof baseInfoModule.updateBaseInfo === 'function') {
      console.log('✅ 使用 ES6 方式调用 updateBaseInfo');
      baseInfoModule.updateBaseInfo(responseText, eventsData);
    } else {
      console.warn('⚠️ ES6 模块中 updateBaseInfo 不可用');
      // 降级使用 window 方式
      if (typeof window.updateBaseInfo === 'function') {
        console.log('⚠️ 降级使用 window.updateBaseInfo');
        window.updateBaseInfo(responseText, eventsData);
      }
    }
  } catch (error) {
    console.error('❌ ES6 动态 import 失败:', error);
    // 降级使用 window 方式
    if (typeof window.updateBaseInfo === 'function') {
      console.log('⚠️ 降级使用 window.updateBaseInfo');
      window.updateBaseInfo(responseText, eventsData);
    }
  }
}

// 将 Chart.js 加载函数暴露到全局作用域，供模块使用
window.loadChartJs = loadChartJs;
window.loadChartJsFallback = loadChartJsFallback;

// 将组合图表创建函数暴露到全局作用域，供模块使用
window.createCombinedAudioAnalysisChart = createCombinedAudioAnalysisChart;
window.createCombinedFallbackChart = createCombinedFallbackChart;

// 测试函数是否可用
window.testUpdateIssueStatus = function () {
  console.log('测试 updateIssueStatus 函数是否可用:', typeof window.updateIssueStatus);
  console.log('window 对象:', typeof window);
  console.log('updateIssueStatus 属性:', window.updateIssueStatus);

  if (typeof window.updateIssueStatus === 'function') {
    console.log('✅ updateIssueStatus 函数可用');
    // 测试调用
    window.updateIssueStatus('isNoSound', true);
  } else {
    console.log('❌ updateIssueStatus 函数不可用');
    console.log('当前 window.updateIssueStatus 值:', window.updateIssueStatus);
  }
};

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
    issueTypes: {
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 1
    }
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
    description: '音频信号级别',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0
    }
  },
  'SIGNAL_LEVEL_NEAROUT': {
    name: 'Audio Signal Level Nearout',
    displayName: '📉 Audio Signal Level Nearout 统计',
    counterId: 8,
    color: '#9c27b0',
    backgroundColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    borderColor: '#9c27b0',
    icon: '📉',
    unit: '',
    description: '音频输出信号级别',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0
    }
  },
  'SIGNAL_LEVEL_FARIN': {
    name: 'Audio Signal Level Farin',
    displayName: '📊 Audio Signal Level Farin 统计',
    counterId: 7,
    color: '#4caf50',
    backgroundColor: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    borderColor: '#4caf50',
    icon: '📊',
    unit: '',
    description: '远端音频输入信号级别',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0
    }
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
    description: '录音信号音量',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0
    }
  },
  'PLAYOUT_VOLUME': {
    name: 'A PLAYOUT SIGNAL VOLUME',
    displayName: '🔊 A PLAYOUT SIGNAL VOLUME 统计',
    counterId: 8,
    color: '#9b59b6',
    backgroundColor: 'linear-gradient(135deg, #f4e6ff 0%, #e8ccff 100%)',
    borderColor: '#9b59b6',
    icon: '🔊',
    unit: '',
    description: '播放信号音量',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0
    }
  },
  'CHAT_ENGINE_ERROR': {
    name: 'Chat Engine Error Code',
    displayName: '🚨 Chat Engine Error Code 统计',
    counterId: 0,
    color: '#ff9800',
    backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    borderColor: '#ff9800',
    icon: '🚨',
    unit: '',
    description: '聊天引擎错误代码',
    issueTypes: {
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 1
    }
  },
  'AUDIO_PLAYBACK_FREQUENCY': {
    name: 'Audio Playback Frequency',
    displayName: '⏸️ Audio Playback Frequency 统计',
    counterId: 13,
    color: '#9c27b0',
    backgroundColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    borderColor: '#9c27b0',
    icon: '⏸️',
    unit: 'Hz',
    description: '音频播放频率',
    issueTypes: {
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 0,
      isAudioStutter: 1
    }
  },
  'AUDIO_DOWNLINK_PULL_TIME': {
    name: 'AUDIO DOWNLINK PULL 10MS DATA TIME',
    displayName: '📥 AUDIO DOWNLINK PULL 10MS DATA TIME 统计',
    counterId: 728,
    color: '#9c27b0',
    backgroundColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    borderColor: '#9c27b0',
    icon: '📥',
    unit: 'ms',
    description: '下行音频数据拉取时间',
    issueTypes: {
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 0,
      isAudioStutter: 1
    }
  }
};


// 根据指标名称获取配置
function getMetricConfig(metricName) {
  return Object.values(AUDIO_METRICS_CONFIG).find(config =>
    config.name === metricName || config.name.toUpperCase() === metricName.toUpperCase()
  );
}

// 问题类型规则管理系统已移至独立的 issue-rules.js 文件
// 动态加载规则表文件
function loadIssueRules() {
  return new Promise((resolve, reject) => {
    if (typeof getMetricIssueTypes !== 'undefined') {
      // 如果规则表函数已存在，直接返回
      resolve();
      return;
    }

    // 动态加载规则表文件
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('src/issue-rules.js');
    script.onload = () => {
      console.log('问题类型规则表已加载');
      // 检查是否成功加载了规则表函数
      if (typeof getMetricIssueTypes !== 'undefined') {
        console.log('外部规则表加载成功');
        resolve();
      } else {
        loadInlineIssueRules();
        resolve();
      }
    };
    script.onerror = () => {
      console.error('加载问题类型规则表失败，使用内联备用方案');
      // 使用内联备用方案
      loadInlineIssueRules();
      resolve();
    };
    document.head.appendChild(script);
  });
}

// 内联备用规则表
function loadInlineIssueRules() {
  console.log('加载内联问题类型规则表');

  // 只有当外部规则表完全没有加载时才使用内联版本
  if (typeof window.ISSUE_RULES !== 'undefined' && typeof window.getMetricIssueTypes === 'function') {
    console.log('外部规则表已存在，跳过内联版本');
    return;
  }

  console.log('使用内联备用规则表');

  // 内联规则表定义（仅当外部规则表不存在时才定义）
  if (typeof window.ISSUE_RULES === 'undefined') {
    window.ISSUE_RULES = {
      issueTypes: {
        isErrorCode: { name: '错误码', color: '#dc3545', icon: '🚨' },
        isNoSound: { name: '无声', color: '#ff6b6b', icon: '🔇' },
        isLowLevel: { name: '音量小', color: '#ffa726', icon: '🔉' },
        isEcho: { name: '回声', color: '#f44336', icon: '🔊' },
        isAudioStutter: { name: '音频卡顿', color: '#9c27b0', icon: '⏸️' },
        isBlack: { name: '黑屏', color: '#000000', icon: '🖤' }
      },
      metricIssueRules: {
        'Audio AEC Delay': { isErrorCode: 0, isNoSound: 0, isLowLevel: 0, isEcho: 1, isAudioStutter: 0, isBlack: 0 },
        'Audio Signal Level Nearin': { isErrorCode: 0, isNoSound: 1, isLowLevel: 1, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'Audio Signal Level Nearout': { isErrorCode: 0, isNoSound: 1, isLowLevel: 1, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'Audio Signal Level Farin': { isErrorCode: 0, isNoSound: 1, isLowLevel: 1, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'A RECORD SIGNAL VOLUME': { isErrorCode: 0, isNoSound: 1, isLowLevel: 1, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'A PLAYOUT SIGNAL VOLUME': { isErrorCode: 0, isNoSound: 1, isLowLevel: 1, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'Chat Engine Error Code': { isErrorCode: 1, isNoSound: 0, isLowLevel: 0, isEcho: 0, isAudioStutter: 0, isBlack: 0 },
        'Audio Playback Frequency': { isErrorCode: 0, isNoSound: 0, isLowLevel: 0, isEcho: 0, isAudioStutter: 1, isBlack: 0 },
        'AUDIO DOWNLINK PULL 10MS DATA TIME': { isErrorCode: 0, isNoSound: 0, isLowLevel: 0, isEcho: 0, isAudioStutter: 1, isBlack: 0 }
      }
    };
  }

  // 内联函数定义（仅当外部函数不存在时才定义）
  if (typeof window.getMetricIssueTypes !== 'function') {
    window.getMetricIssueTypes = function (metricName) {
      return window.ISSUE_RULES.metricIssueRules[metricName] || { isErrorCode: 0, isNoSound: 0, isLowLevel: 0, isEcho: 0, isAudioStutter: 0, isBlack: 0 };
    };
  }

  if (typeof window.getIssueTypeConfig !== 'function') {
    window.getIssueTypeConfig = function (issueType) {
      return window.ISSUE_RULES.issueTypes[issueType];
    };
  }

  if (typeof window.isMetricRelatedToIssue !== 'function') {
    window.isMetricRelatedToIssue = function (metricName, issueType) {
      const rules = window.getMetricIssueTypes(metricName);
      return rules[issueType] === 1;
    };
  }

  if (typeof window.extractMetricNameFromTitle !== 'function') {
    window.extractMetricNameFromTitle = function (titleText) {
      if (titleText.includes('AEC Delay')) return 'Audio AEC Delay';
      if (titleText.includes('Signal Level Nearout')) return 'Audio Signal Level Nearout';
      if (titleText.includes('Signal Level Farin')) return 'Audio Signal Level Farin';
      if (titleText.includes('Signal Level')) return 'Audio Signal Level Nearin';
      if (titleText.includes('Record Volume')) return 'A RECORD SIGNAL VOLUME';
      if (titleText.includes('Playout Volume')) return 'A PLAYOUT SIGNAL VOLUME';
      if (titleText.includes('Error Code')) return 'Chat Engine Error Code';
      return null;
    };
  }
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
  // 初始状态：禁用按钮，等待 events 数据保存后才能点击
  button.disabled = true;

  // 添加点击事件
  button.addEventListener('click', function () {
    console.log('🔘 Auto Check 按钮被点击');

    // 禁用所有 auto-check 按钮
    disableAutoCheckButtons();

    // 通过 background script 发送 POST 请求到指定 URL（避免 CORS 错误）
    chrome.runtime.sendMessage({
      type: 'AUTO_CHECK_CLICK',
      data: {}
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('发送点击事件消息失败:', chrome.runtime.lastError);
      } else if (response && response.success) {
        console.log('点击事件 POST 请求成功:', response);
      } else {
        console.error('点击事件 POST 请求失败:', response?.error);
      }
    });

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

// 禁用所有 auto-check 按钮
function disableAutoCheckButtons() {
  const buttons = document.querySelectorAll('.auto-check-btn');
  const buttonCount = buttons.length;
  buttons.forEach(button => {
    button.disabled = true;
  });
  console.log(`🔒 Content Script: 已禁用 ${buttonCount} 个 auto-check 按钮`);
  if (window.__autoCheckDebug) {
    console.log('🔍 按钮详情:', Array.from(buttons).map(btn => ({
      disabled: btn.disabled,
      text: btn.textContent.trim()
    })));
  }
}

// 启用所有 auto-check 按钮
function enableAutoCheckButtons() {
  const buttons = document.querySelectorAll('.auto-check-btn');
  const buttonCount = buttons.length;
  buttons.forEach(button => {
    button.disabled = false;
  });
  console.log(`✅ Content Script: 已启用 ${buttonCount} 个 auto-check 按钮`);
  if (window.__autoCheckDebug) {
    console.log('🔍 按钮详情:', Array.from(buttons).map(btn => ({
      disabled: btn.disabled,
      text: btn.textContent.trim()
    })));
  }
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
  // 在函数顶部声明变量，确保在整个函数作用域内可用
  let countersResponse = null;
  let eventlistResponse = null;

  try {
    // 获取当前页面的相关信息
    const url = window.location.href;
    const title = document.title;

    console.log('执行自动检查:', { url, title });

    // 显示检查开始通知
    showNotification('正在收集页面数据...', 'info');

    // 收集限定范围内的 class uid 的值（仅 user-info 容器）
    const uidValues = collectUidValues(scopeRoot);
    const sidValues = collectSidValues(scopeRoot);

    console.log('sidValues:', sidValues);

    // 保存 sid 到全局变量，供后续使用
    if (sidValues) {
      let sid = null;
      if (Array.isArray(sidValues) && sidValues.length > 0) {
        sid = sidValues[0].value || sidValues[0];
      } else if (typeof sidValues === 'string' && sidValues) {
        sid = sidValues;
      }
      if (sid) {
        window.currentSid = sid;
        window.autoCheckSids = [sid];
        console.log('已保存 sid 到全局变量:', sid);
      }
    }

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

      const uid = uidValues[0].value;
      // 从 dataUtil 获取 countersResponse 和 eventlistResponse
      try {
        const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));


        countersResponse = await dataUtil.getData('counters', uid);
        eventlistResponse = await dataUtil.getData('eventlist', uid);

        if (!countersResponse && sidValues) {
          // sidValues 可能为 sid 数组，也可能为字符串
          let sid = null;
          if (Array.isArray(sidValues) && sidValues.length > 0) {
            sid = sidValues[0].value || sidValues[0];
          } else if (typeof sidValues === 'string' && sidValues) {
            sid = sidValues;
          }
          if (sid) {
            countersResponse = await dataUtil.getData('counters', sid);
          }
        }


        if (!eventlistResponse && sidValues) {
          let sid = null;
          if (Array.isArray(sidValues) && sidValues.length > 0) {
            sid = sidValues[0].value || sidValues[0];
          } else if (typeof sidValues === 'string' && sidValues) {
            sid = sidValues;
          }
          if (sid) {
            eventlistResponse = await dataUtil.getData('events', sid);
          }
        }

      } catch (e) {
        console.error('❌ 从 dataUtil 获取数据失败:', e);
      }


    }

    // 拿到响应后再执行分析
    if (countersResponse) {
      // 创建图表并更新基本信息（showAudioMetricsAnalysis 内部会更新基本信息）
      // 传递 events 数据以检查权限信息
      await showAudioMetricsAnalysis(countersResponse, eventlistResponse);
    } else {
      showNotification('未找到响应数据', 'error');
    }

  } catch (error) {
    console.error('自动检查过程中出现错误:', error);
    showNotification('自动检查失败: ' + error.message, 'error');
  }
}

// 打印 uid 的 url 和 response
function fecthResponse(uidValue, type) {
  if (!window.resp || !Array.isArray(window.resp)) {
    console.log('❗ 未找到 window.resp 或类型有误');
    return null;
  }

  let matchedUrl = null;
  for (const entry of window.resp) {
    if (entry && typeof entry.name === 'string' && entry.name.includes(type) && entry.name.includes('uids=' + uidValue + '')) {
      matchedUrl = entry.name;
      console.log(`🌐 [resp] 发现包含 UID ${uidValue} 的网络请求:`);
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

// 设置 counters 网络请求拦截器（在页面加载早期立即执行）
function setupCountersInterceptors() {
  // 防止重复设置
  if (window.__countersInterceptorsSetup) {
    return;
  }
  window.__countersInterceptorsSetup = true;

  console.log('🚀 立即启动 counters 网络请求拦截器...');

  // 初始化存储 counters 请求的 Map
  if (!window.countersInterceptedRequests) {
    window.countersInterceptedRequests = new Map();
  }

  // 拦截 fetch 请求
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

    // 检查是否是 counters 请求
    if (url && typeof url === 'string' && url.includes('counters')) {
      console.log('🔵 拦截到 fetch 请求:', url);

      try {
        const response = await originalFetch.apply(this, args);

        // 克隆响应以便读取内容而不影响原始响应
        const clonedResponse = response.clone();
        const responseText = await clonedResponse.text();

        // 存储请求信息
        window.countersInterceptedRequests.set(url, {
          url: url,
          method: 'POST', // fetch 默认方法
          type: 'fetch',
          responseText: responseText,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        });

        console.log(`✅ 已捕获 fetch 响应 (${url}):`, {
          status: response.status,
          contentType: response.headers.get('content-type'),
          size: responseText.length
        });

        // 打印响应内容
        console.log('📄 Fetch 响应内容:');
        try {
          const jsonData = JSON.parse(responseText);
          console.log(JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log(responseText);
        }

        return response;
      } catch (error) {
        console.error('❌ Fetch 请求失败:', error);
        throw error;
      }
    }

    return originalFetch.apply(this, args);
  };

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._method = method;
    this._url = url;
    this._isCountersRequest = url && typeof url === 'string' && url.includes('counters');

    if (this._isCountersRequest) {
      console.log('🟢 拦截到 XHR 请求:', method, url);

      // 监听响应
      this.addEventListener('load', function () {
        if (this._isCountersRequest && this.responseText) {
          const fullUrl = url.startsWith('http') ? url : window.location.origin + url;

          // 存储请求信息
          window.countersInterceptedRequests.set(fullUrl, {
            url: fullUrl,
            method: method,
            type: 'xhr',
            responseText: this.responseText,
            status: this.status,
            statusText: this.statusText,
            headers: this.getAllResponseHeaders(),
            timestamp: new Date().toISOString()
          });

          console.log(`✅ 已捕获 XHR 响应 (${fullUrl}):`, {
            status: this.status,
            contentType: this.getResponseHeader('content-type'),
            size: this.responseText.length
          });

          // 打印响应内容
          console.log('📄 XHR 响应内容:');
          try {
            const jsonData = JSON.parse(this.responseText);
            console.log(JSON.stringify(jsonData, null, 2));
          } catch (e) {
            console.log(this.responseText);
          }
        }
      });

      this.addEventListener('error', function () {
        if (this._isCountersRequest) {
          console.error('❌ XHR 请求失败:', url);
        }
      });
    }

    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    return originalXHRSend.apply(this, args);
  };

  console.log('✅ counters 网络请求拦截器已设置完成');
}

// 查找并打印 counters 响应内容
// 查询已捕获的 counters 请求并打印
async function findResponse() {
  console.log('🔍 开始查找 counters 响应内容（通过拦截 fetch & XHR）...');

  // 确保拦截器已设置
  if (!window.__countersInterceptorsSetup) {
    setupCountersInterceptors();
  }

  // 初始化存储 counters 请求的 Map
  if (!window.countersInterceptedRequests) {
    window.countersInterceptedRequests = new Map();
  }

  // 从 Performance API 获取已完成的 counters 请求
  try {
    const resources = performance.getEntriesByType('resource');
    const countersResources = resources.filter(entry =>
      entry.name && typeof entry.name === 'string' && entry.name.includes('counters')
    );

    if (countersResources.length > 0) {
      console.log(`\n📊 从 Performance API 找到 ${countersResources.length} 个 counters 请求:`);

      for (const entry of countersResources) {
        console.log(`  - ${entry.name} (${entry.initiatorType})`);

        // 如果还没有拦截到，尝试重新获取
        if (!window.countersInterceptedRequests.has(entry.name)) {
          try {
            const response = await fetch(entry.name, { credentials: 'include' });
            if (response.ok) {
              const responseText = await response.text();
              window.countersInterceptedRequests.set(entry.name, {
                url: entry.name,
                method: 'GET',
                type: 'performance-api',
                responseText: responseText,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                timestamp: new Date().toISOString()
              });

              console.log(`  ✅ 已获取响应内容 (${entry.name})`);
              console.log('  📄 响应内容:');
              try {
                const jsonData = JSON.parse(responseText);
                console.log(JSON.stringify(jsonData, null, 2));
              } catch (e) {
                console.log(responseText);
              }
            }
          } catch (error) {
            console.warn(`  ⚠️ 无法获取响应:`, error.message);
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 从 Performance API 获取请求失败:', error);
  }

  // 打印所有已捕获的 counters 请求摘要
  if (window.countersInterceptedRequests.size > 0) {
    console.log(`\n📋 已捕获 ${window.countersInterceptedRequests.size} 个 counters 请求:`);
    window.countersInterceptedRequests.forEach((data, url) => {
      console.log(`  - [${data.type.toUpperCase()}] ${data.method} ${url} (状态: ${data.status})`);
    });
  } else {
    console.log('\n⚠️ 尚未捕获到 counters 请求，拦截器已设置，等待新的请求...');
    console.log('💡 提示: 如果页面已经加载完成，可以刷新页面或触发相关操作来生成新的 counters 请求');
  }

  console.log('\n✅ counters 响应内容查找完成（拦截器已激活）');
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

  // 优先查找 fetch-log 链接，从 href 中解析 uid
  const fetchLogLinks = container.querySelectorAll('a.fetch-log');
  if (fetchLogLinks.length > 0) {
    fetchLogLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        // 从 URL 查询参数中提取 uid
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const uid = urlParams.get('uid');
        if (uid) {
          uidValues.push({
            index: uidValues.length + 1,
            value: uid.trim(),
            tagName: link.tagName.toLowerCase(),
            className: link.className,
            id: link.id || '',
            element: link,
            containerInfo: {
              containerIndex: 1,
              containerId: container.id || '',
              containerClasses: container.className
            }
          });
        }
      }
    });
  }

  // 如果没有从 fetch-log 链接中找到 uid，则继续查找 .uid 元素
  if (uidValues.length === 0) {
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
  }

  console.log(`在指定的 user-info 容器中找到 ${uidValues.length} 个 uid 元素:`, uidValues);
  return uidValues;
}

// 收集 counter-view 中 sids 的第二个 span 值
function collectSidValues(scopeRoot) {
  const sidValues = [];

  try {
    // 在 scopeRoot 中查找 auto-check 按钮
    let autoCheckButton = null;

    // 如果 scopeRoot 本身就是 auto-check 按钮
    if (scopeRoot && scopeRoot.classList && scopeRoot.classList.contains('auto-check-btn')) {
      autoCheckButton = scopeRoot;
    } else {
      // 在 scopeRoot 中查找 auto-check 按钮
      autoCheckButton = scopeRoot.querySelector ? scopeRoot.querySelector('.auto-check-btn') : null;
    }

    if (!autoCheckButton) {
      console.log('未找到 auto-check 按钮');
      return sidValues;
    }

    // 向上查找 counter-view div
    const counterView = autoCheckButton.closest('.counter-view');

    if (!counterView) {
      console.log('未找到 counter-view div');
      return sidValues;
    }

    // 在 counter-view div 中查找所有 class = sids 的元素
    const sidsElements = counterView.querySelectorAll('.sids');

    if (sidsElements.length === 0) {
      console.log('在 counter-view 中未找到 class=sids 的元素');
      return sidValues;
    }

    // 收集所有 sids 元素中的所有 span
    const allSpans = [];
    sidsElements.forEach((sidsElement) => {
      const spans = sidsElement.querySelectorAll('span');
      spans.forEach((span) => {
        allSpans.push(span);
      });
    });

    // 获取第二个 span 的值（索引为 1）
    if (allSpans.length >= 2) {
      const secondSpan = allSpans[1];
      const spanValue = secondSpan.textContent || secondSpan.innerText || '';

      sidValues.push({
        index: 1,
        value: spanValue.trim(),
        tagName: secondSpan.tagName.toLowerCase(),
        className: secondSpan.className,
        id: secondSpan.id || '',
        element: secondSpan,
        containerInfo: {
          containerIndex: 1,
          containerId: counterView.id || '',
          containerClasses: counterView.className
        }
      });

      return spanValue.trim();
    }
    return null;
  } catch (error) {
    console.error('收集 sid 值时出错:', error);
    return null;
  }
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
          <button class="action-btn copy-btn">复制所有值</button>
          <button class="action-btn export-btn">导出数据</button>
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

  // 添加事件监听器（替代内联事件处理器）
  const copyBtn = popup.querySelector('.copy-btn');
  const exportBtn = popup.querySelector('.export-btn');

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

  // 绑定事件监听器
  if (copyBtn) {
    copyBtn.addEventListener('click', window.copyUidValues);
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', window.exportUidValues);
  }

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
  window.fetch = function (...args) {
    const url = args[0];
    const isCountersRequest = typeof url === 'string' && url.includes('counters?') && url.includes('uids=');
    const iseventlistRequest = typeof url === 'string' && url.includes('eventlist');

    if (isCountersRequest || iseventlistRequest) {
      if (window.__autoCheckDebug) {
        if (isCountersRequest) {
          console.log('🌐 [Fetch] 发现包含 uids 参数的 counters 请求:', url);
        }
        if (iseventlistRequest) {
          console.log('🌐 [Fetch] 发现 eventlist 请求:', url);
        }
      }

      // 拦截响应并计算 JSON 长度
      const originalThen = Promise.prototype.then;
      const fetchPromise = originalFetch.apply(this, args);

      // 将 counters 信息按 url, response 保存到 map
      if (!window.countersFetchMap) {
        window.countersFetchMap = new Map();
      }
      fetchPromise.then = function (onFulfilled, onRejected) {
        return originalThen.call(this, function (response) {
          if (onFulfilled) {
            // 克隆响应以便读取内容
            const clonedResponse = response.clone();
            const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
            clonedResponse.text().then(async text => {
              // 保存 url 和 response 到 map（仅 counters 请求）
              if (isCountersRequest) {
                window.countersFetchMap.set(requestUrl, text);
                if (window.__autoCheckDebug) {
                  console.log('保存 url 和 response 到 map:', requestUrl);
                }
              }

              // 检测 eventlist 请求并保存数据
              if (iseventlistRequest) {
                try {
                  // 动态导入 data-util 模块
                  const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
                  const uid = dataUtil.extractUidFromUrl(requestUrl);

                  if (uid) {
                    dataUtil.saveData('eventlist', uid, requestUrl, text);
                    if (window.__autoCheckDebug) {
                      console.log('✅ [Fetch] 已保存 eventlist 数据:', { uid, url: requestUrl });
                    }
                  } else {
                    if (window.__autoCheckDebug) {
                      console.warn('⚠️ [Fetch] 无法从 URL 提取 UID:', requestUrl);
                    }
                  }
                } catch (error) {
                  console.error('❌ [Fetch] 保存 eventlist 数据失败:', error);
                }
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

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._monitoredUrl = url;
    this._monitoredMethod = method;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;
    const url = xhr._monitoredUrl;
    const method = xhr._monitoredMethod;
    const isCountersRequest = typeof url === 'string' && url.includes('counters?') && url.includes('uids=');
    const iseventlistRequest = typeof url === 'string' && url.includes('eventlist');

    if (isCountersRequest || iseventlistRequest) {
      if (window.__autoCheckDebug) {
        if (isCountersRequest) {
          console.log('🌐 [XHR] 发现包含 uids 的 counters 请求:', method, url);
        }
        if (iseventlistRequest) {
          console.log('🌐 [XHR] 发现 eventlist 请求:', method, url);
        }
      }

      // 监听响应
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = async function () {
        if (xhr.readyState === 4) { // 请求完成
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseText = xhr.responseText;

              // 检测 eventlist 请求并保存数据
              if (iseventlistRequest) {
                try {
                  // 动态导入 data-util 模块
                  const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
                  const uid = dataUtil.extractUidFromUrl(url);

                  if (uid) {
                    dataUtil.saveData('eventlist', uid, url, responseText);
                    if (window.__autoCheckDebug) {
                      console.log('✅ [XHR] 已保存 eventlist 数据:', { uid, url: url });
                    }
                  } else {
                    if (window.__autoCheckDebug) {
                      console.warn('⚠️ [XHR] 无法从 URL 提取 UID:', url);
                    }
                  }
                } catch (error) {
                  console.error('❌ [XHR] 保存 eventlist 数据失败:', error);
                }
              }

              if (isCountersRequest) {
                const jsonData = JSON.parse(responseText);
                const jsonLength = JSON.stringify(jsonData).length;
                if (window.__autoCheckDebug) {
                  console.log('📊 [XHR] 响应 JSON 长度:', jsonLength);
                }
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
      if (entry.name && (entry.name.includes('counters?') || entry.name.includes('eventlist'))) {
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
      <button class="copy-all-btn">复制所有数据</button>
      <button class="export-btn">导出数据</button>
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

  // 添加事件监听器（替代内联事件处理器）
  const copyAllBtn = panel.querySelector('.copy-all-btn');
  const exportBtn = panel.querySelector('.export-btn');

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

  // 绑定事件监听器
  if (copyAllBtn) {
    copyAllBtn.addEventListener('click', window.copyAllCountersData);
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', window.exportCountersData);
  }

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
async function showAudioMetricsAnalysis(countersResponse, eventsData = null) {
  // 加载 Chart.js 库
  loadChartJs().then(async () => {
    showNotification('显示音频指标分析弹窗', 'info');

    // 动态导入 ES6 模块
    const [aecDelayModule, signalLevelModule, recordVolumeModule, playoutVolumeModule, errorCodeModule] = await Promise.all([
      import(chrome.runtime.getURL('src/metrics/aec-delay.js')),
      import(chrome.runtime.getURL('src/metrics/signal-level.js')),
      import(chrome.runtime.getURL('src/metrics/record-volume.js')),
      import(chrome.runtime.getURL('src/metrics/playout-volume.js')),
      import(chrome.runtime.getURL('src/metrics/error-code.js'))
    ]);

    // 获取各项分析数据
    const aecDelayData = aecDelayModule.getAecDelayData(countersResponse);
    console.log('aecDelayData', aecDelayData);

    const signalLevelData = signalLevelModule.getAudioSignalLevelNearinData(countersResponse);
    const signalLevelNearoutData = signalLevelModule.getAudioSignalLevelNearoutData(countersResponse);
    const signalLevelFarinData = signalLevelModule.getAudioSignalLevelFarinData(countersResponse);
    const recordVolumeData = recordVolumeModule.getARecordSignalVolumeData(countersResponse);
    const playoutVolumeData = playoutVolumeModule.getAPlayoutSignalVolumeData(countersResponse);

    // 获取 error code 数据
    let errorCodeData;
    const handleErrorCodeDataUpdate = (updatedData) => {
      errorCodeData = updatedData;
      // 重新渲染 error code 表格
      if (document.getElementById('errorCodeDataTable')) {
        createErrorCodeTable(errorCodeData, 'errorCodeDataTable');
      }
    };
    errorCodeData = errorCodeModule.getChatEngineErrorData(countersResponse, handleErrorCodeDataUpdate);

    console.log('errorCodeData', errorCodeData);

    // 如果没有数据，显示提示信息
    if (!aecDelayData && !signalLevelData && !signalLevelNearoutData && !signalLevelFarinData && !recordVolumeData && !playoutVolumeData && !errorCodeData) {
      showNotification('未找到音频分析数据', 'warning');
    }

    if (window.Chart) {
      createCombinedAudioAnalysisChart(aecDelayData, signalLevelData, signalLevelNearoutData, signalLevelFarinData, recordVolumeData, playoutVolumeData, errorCodeData);
    } else {
      createCombinedFallbackChart(aecDelayData, signalLevelData, signalLevelNearoutData, signalLevelFarinData, recordVolumeData, playoutVolumeData, errorCodeData, countersResponse);
    }

    // 图表创建后立即更新基本信息，传递 events 数据
    await updateBaseInfoWithES6(countersResponse, eventsData);
  }).catch(error => {
    console.error('加载Chart.js失败:', error);
    showNotification('加载图表库失败', 'error');
  });
}

// 这些函数已移动到 src/metrics 目录下的 ES6 模块中
// 现在通过模块导入使用，保持全局可用性以供非模块代码调用
// 详见下方 showAecDelayAnalysis 函数实现

// 模拟数据生成函数已移除，不再使用模拟数据

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

// 添加点击外部区域缩小为圆形的功能
function addClickOutsideToShrink(chartContainer) {
  // 检查是否已经缩小
  let isShrunk = false;
  // 保存原始样式字符串
  let originalCssText = '';
  // 保存子元素的原始样式
  let originalChildStyles = [];
  // 保存原始位置
  let originalPosition = {};
  // 拖拽相关变量
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartLeft = 0;
  let dragStartTop = 0;
  let justFinishedDragging = false; // 标记是否刚完成拖拽
  let dragEndTimer = null; // 拖拽结束的定时器
  
  // 添加拖拽功能
  function addDragFunctionality() {
    let hasMoved = false; // 标记鼠标是否移动
    let mouseDownTime = 0; // 记录鼠标按下的时间
    
    chartContainer.addEventListener('mousedown', function(e) {
      if (!isShrunk) return;
      
      hasMoved = false;
      isDragging = false;
      mouseDownTime = Date.now();
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      const rect = chartContainer.getBoundingClientRect();
      dragStartLeft = rect.left;
      dragStartTop = rect.top;
      
      // 清除之前的定时器
      if (dragEndTimer) {
        clearTimeout(dragEndTimer);
        dragEndTimer = null;
      }
      justFinishedDragging = false;
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isShrunk || mouseDownTime === 0) return;
      
      // 检查鼠标是否移动了足够的距离（5px）才认为是拖拽
      const deltaX = Math.abs(e.clientX - dragStartX);
      const deltaY = Math.abs(e.clientY - dragStartY);
      
      if (deltaX > 5 || deltaY > 5) {
        if (!isDragging) {
          isDragging = true;
          hasMoved = true;
          chartContainer.style.cursor = 'grabbing';
        }
        
        if (isDragging) {
          e.preventDefault();
          const moveDeltaX = e.clientX - dragStartX;
          const moveDeltaY = e.clientY - dragStartY;
          
          chartContainer.style.left = (dragStartLeft + moveDeltaX) + 'px';
          chartContainer.style.top = (dragStartTop + moveDeltaY) + 'px';
          chartContainer.style.transform = 'none';
        }
      }
    });
    
    document.addEventListener('mouseup', function() {
      if (isDragging && hasMoved) {
        // 只有真正拖拽了才设置标志
        isDragging = false;
        chartContainer.style.cursor = 'grab';
        
        // 标记刚完成拖拽，在300ms内不响应点击
        justFinishedDragging = true;
        
        // 300ms后允许响应点击
        dragEndTimer = setTimeout(() => {
          justFinishedDragging = false;
          dragEndTimer = null;
        }, 300);
      } else {
        // 如果没有移动，只是点击，重置状态
        isDragging = false;
        hasMoved = false;
        justFinishedDragging = false;
      }
      mouseDownTime = 0;
    });
  }
  
  // 初始化拖拽功能
  addDragFunctionality();
  
  // 点击外部区域的处理函数
  function handleClickOutside(event) {
    // 如果正在拖拽，不处理点击
    if (isDragging) {
      return;
    }
    
    // 如果刚完成拖拽，不处理点击（避免拖拽后立即触发恢复）
    if (justFinishedDragging) {
      return;
    }
    
    // 如果已经缩小，点击圆形可以恢复
    if (isShrunk) {
      const rect = chartContainer.getBoundingClientRect();
      const clickX = event.clientX;
      const clickY = event.clientY;
      
      // 检查点击是否在圆形区域内
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
      
      if (distance <= 25) { // 25px 是半径
        // 恢复原始大小
        chartContainer.classList.remove('shrink-to-circle');
        chartContainer.style.cursor = '';
        
        // 先淡出
        chartContainer.style.opacity = '0';
        chartContainer.style.transition = 'opacity 0.3s ease-out';
        
        // 淡出后立即恢复样式和位置，然后淡入
        setTimeout(() => {
          // 恢复原始样式
          if (originalCssText) {
            chartContainer.style.cssText = originalCssText;
            // 恢复原始位置（如果原本是居中定位，需要恢复 transform）
            if (originalPosition.left !== undefined && originalPosition.left !== 'auto') {
              chartContainer.style.left = originalPosition.left;
            }
            if (originalPosition.top !== undefined && originalPosition.top !== 'auto') {
              chartContainer.style.top = originalPosition.top;
            }
            if (originalPosition.transform && originalPosition.transform !== 'none') {
              chartContainer.style.transform = originalPosition.transform;
            }
          }
          
          // 恢复子元素可见性
          Array.from(chartContainer.children).forEach((child, index) => {
            if (originalChildStyles[index]) {
              child.style.opacity = originalChildStyles[index].opacity || '';
              child.style.pointerEvents = originalChildStyles[index].pointerEvents || '';
            } else {
              child.style.opacity = '';
              child.style.pointerEvents = '';
            }
          });
          
          // 淡入
          requestAnimationFrame(() => {
            chartContainer.style.transition = 'opacity 0.3s ease-out';
            chartContainer.style.opacity = '1';
          });
        }, 300);
        
        isShrunk = false;
        
        // 动画结束后移除 transition
        setTimeout(() => {
          chartContainer.style.transition = '';
          chartContainer.style.opacity = '';
        }, 600);
        
        // 重新添加点击外部监听器
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside);
        }, 100);
      }
      return;
    }
    
    // 检查点击的目标元素
    const target = event.target;
    
    // 如果点击的是容器内部或其子元素，不处理
    if (chartContainer.contains(target)) {
      return;
    }
    
    // 如果点击的是其他 combined-audio-analysis-container 或 fallback-chart 内部，不处理
    const combinedContainer = target.closest('.combined-audio-analysis-container');
    const fallbackChart = target.closest('.fallback-chart');
    
    // 如果找到其他容器（不是当前容器），也不处理
    if ((combinedContainer && combinedContainer !== chartContainer) || 
        (fallbackChart && fallbackChart !== chartContainer)) {
      return;
    }
    
    // 获取 close-chart 按钮的位置
    const closeButton = chartContainer.querySelector('.close-chart');
    let targetLeft, targetTop;
    
    if (closeButton) {
      const closeRect = closeButton.getBoundingClientRect();
      // 计算按钮中心位置，然后减去圆的半径（25px）来定位圆的左上角
      targetLeft = closeRect.left + closeRect.width / 2 - 25;
      targetTop = closeRect.top + closeRect.height / 2 - 25;
    } else {
      // 如果没有找到按钮，使用容器的右上角
      const containerRect = chartContainer.getBoundingClientRect();
      targetLeft = containerRect.right - 50;
      targetTop = containerRect.top;
    }
    
    // 保存原始样式字符串
    originalCssText = chartContainer.style.cssText;
    
    // 保存原始位置
    const computedStyle = window.getComputedStyle(chartContainer);
    originalPosition = {
      left: computedStyle.left,
      top: computedStyle.top,
      transform: computedStyle.transform
    };
    
    // 保存子元素的原始样式
    originalChildStyles = Array.from(chartContainer.children).map(child => ({
      opacity: child.style.opacity || '',
      pointerEvents: child.style.pointerEvents || ''
    }));
    
    // 点击外部区域，缩小为圆形
    chartContainer.classList.add('shrink-to-circle');
    chartContainer.style.cursor = 'grab';
    
    // 先淡出
    chartContainer.style.transition = 'opacity 0.3s ease-out';
    chartContainer.style.opacity = '0';
    
    // 淡出后立即改变样式和位置，然后淡入
    setTimeout(() => {
      // 直接设置目标样式（无动画）
      chartContainer.style.width = '50px';
      chartContainer.style.height = '50px';
      chartContainer.style.maxWidth = '50px';
      chartContainer.style.borderRadius = '50%';
      chartContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      chartContainer.style.overflow = 'hidden';
      chartContainer.style.left = targetLeft + 'px';
      chartContainer.style.top = targetTop + 'px';
      chartContainer.style.transform = 'none';
      
      // 隐藏子元素
      Array.from(chartContainer.children).forEach(child => {
        child.style.opacity = '0';
        child.style.pointerEvents = 'none';
      });
      
      // 淡入
      requestAnimationFrame(() => {
        chartContainer.style.transition = 'opacity 0.3s ease-out';
        chartContainer.style.opacity = '1';
      });
    }, 300);
    
    isShrunk = true;
    
    // 移除点击外部监听器，避免重复触发
    document.removeEventListener('click', handleClickOutside);
    
    // 添加点击圆形恢复的监听器
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 500);
  }
  
  // 延迟添加监听器，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 100);
}

// 创建组合音频分析图表
function createCombinedAudioAnalysisChart(aecDelayData, signalLevelData, signalLevelNearoutData, signalLevelFarinData, recordSignalVolumeData, playoutSignalVolumeData, errorCodeData) {
  console.log('createCombinedAudioAnalysisChart', aecDelayData, signalLevelData, signalLevelNearoutData, signalLevelFarinData, recordSignalVolumeData, playoutSignalVolumeData, errorCodeData);

  // 安全访问数据，避免 null/undefined 错误
  const safeAecDelayData = aecDelayData || { data: [] };
  const safeSignalLevelData = signalLevelData || { data: [] };
  const safeSignalLevelNearoutData = signalLevelNearoutData || { data: [] };
  const safeSignalLevelFarinData = signalLevelFarinData || { data: [] };
  const safeRecordSignalVolumeData = recordSignalVolumeData || { data: [] };
  const safePlayoutSignalVolumeData = playoutSignalVolumeData || { data: [] };
  const safeErrorCodeData = errorCodeData || { data: [] };

  // 保存数据到全局变量，以便后续动态访问
  window.metricDataCache = {
    'Audio AEC Delay': aecDelayData,
    'Audio Signal Level Nearin': signalLevelData,
    'Audio Signal Level Nearout': signalLevelNearoutData,
    'Audio Signal Level Farin': signalLevelFarinData,
    'A RECORD SIGNAL VOLUME': recordSignalVolumeData,
    'A PLAYOUT SIGNAL VOLUME': playoutSignalVolumeData,
    'Chat Engine Error Code': errorCodeData
  };

  // 1) 容器与画布：若不存在则创建，存在则复用
  let chartContainer = document.querySelector('.combined-audio-analysis-container');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.className = 'combined-audio-analysis-container';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <h3> 🎯🎯🎯 分析</h3>
        <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="chart-content">
        ${window.hasNewVersion ? '<div class="update-banner">已有新版，请更新 ⏬ <a href="https://github.com/ReikyZ/auto-check/archive/refs/heads/main.zip" target="_blank" class="update-link">点击下载</a></div>' : ''}
        <div class="base-info">
          <h4 style="display: inline-block; margin-right: 10px;">基本信息</h4><span class="status-tag">3A状态</span>
        </div>
        <div class="issue-checkboxes">
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" id="isErrorCode" data-issue-type="isErrorCode">
              <span class="checkbox-label">错误码</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isNoSound" data-issue-type="isNoSound">
              <span class="checkbox-label">无声</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isLowLevel" data-issue-type="isLowLevel">
              <span class="checkbox-label">音量小</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isEcho" data-issue-type="isEcho">
              <span class="checkbox-label">回声</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isAudioStutter" data-issue-type="isAudioStutter">
              <span class="checkbox-label">音频卡顿</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isBlack" data-issue-type="isBlack">
              <span class="checkbox-label">黑屏</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" id="isVideoFrozen" data-issue-type="isVideoFrozen">
              <span class="checkbox-label">视频上行卡顿</span>
            </label>
          </div>
        </div>
        <div class="chart-tabs">
          <button class="tab-btn active" data-tab="aec">AEC Delay</button>
          <button class="tab-btn" data-tab="signal">Signal Level</button>
          <button class="tab-btn" data-tab="record">Record Volume</button>
          <button class="tab-btn" data-tab="video">视频上行卡顿</button>
          <button class="tab-btn" data-tab="combined">组合视图</button>
        </div>
        <div class="chart-canvas-container">
          <canvas id="aecDelayChart" width="600" height="300"></canvas>
          <canvas id="signalLevelChart" width="600" height="300" style="display: none;"></canvas>
          <canvas id="recordVolumeChart" width="600" height="300" style="display: none;"></canvas>
          <canvas id="videoFrozenChart" width="600" height="300" style="display: none;"></canvas>
          <canvas id="combinedChart" width="600" height="300" style="display: none;"></canvas>
        </div>
      </div>
      <div class="chart-footer">
        <div class="chart-stats vertical-layout">
          <div class="stat-section">
            <h4>📊 Audio AEC Delay 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safeAecDelayData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均延迟</span>
              <span class="stat-value">${calculateAverageDelay(safeAecDelayData.data)}ms</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大延迟</span>
              <span class="stat-value">${calculateMaxDelay(safeAecDelayData.data)}ms</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safeAecDelayData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safeAecDelayData.data)}</span>
            </div>
          </div>
          <div class="stat-section">
            <h4>📈 Audio Signal Level Nearin 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safeSignalLevelData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均信号</span>
              <span class="stat-value">${calculateAverageDelay(safeSignalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大信号</span>
              <span class="stat-value">${calculateMaxDelay(safeSignalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safeSignalLevelData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safeSignalLevelData.data)}</span>
            </div>
          </div>
          ${safeSignalLevelNearoutData.data && safeSignalLevelNearoutData.data.length > 0 ? `
          <div class="stat-section">
            <h4>📉 Audio Signal Level Nearout 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safeSignalLevelNearoutData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均信号</span>
              <span class="stat-value">${calculateAverageDelay(safeSignalLevelNearoutData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大信号</span>
              <span class="stat-value">${calculateMaxDelay(safeSignalLevelNearoutData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safeSignalLevelNearoutData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safeSignalLevelNearoutData.data)}</span>
            </div>
          </div>
          ` : ''}
          ${safeSignalLevelFarinData.data && safeSignalLevelFarinData.data.length > 0 ? `
          <div class="stat-section">
            <h4>📊 Audio Signal Level Farin 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safeSignalLevelFarinData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均信号</span>
              <span class="stat-value">${calculateAverageDelay(safeSignalLevelFarinData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大信号</span>
              <span class="stat-value">${calculateMaxDelay(safeSignalLevelFarinData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safeSignalLevelFarinData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safeSignalLevelFarinData.data)}</span>
            </div>
          </div>
          ` : ''}
          <div class="stat-section">
            <h4>🎵 A RECORD SIGNAL VOLUME 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safeRecordSignalVolumeData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均音量</span>
              <span class="stat-value">${calculateAverageDelay(safeRecordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大音量</span>
              <span class="stat-value">${calculateMaxDelay(safeRecordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safeRecordSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safeRecordSignalVolumeData.data)}</span>
            </div>
          </div>
          ${safePlayoutSignalVolumeData.data && safePlayoutSignalVolumeData.data.length > 0 ? `
          <div class="stat-section">
            <h4>🔊 A PLAYOUT SIGNAL VOLUME 统计</h4>
            <div class="stat-item">
              <span class="stat-label">数据点</span>
              <span class="stat-value">${safePlayoutSignalVolumeData.data.length}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均音量</span>
              <span class="stat-value">${calculateAverageDelay(safePlayoutSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大音量</span>
              <span class="stat-value">${calculateMaxDelay(safePlayoutSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化次数</span>
              <span class="stat-value">${calculateChangeCount(safePlayoutSignalVolumeData.data)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">变化频率</span>
              <span class="stat-value">${calculateChangeFrequency(safePlayoutSignalVolumeData.data)}</span>
            </div>
          </div>
          ` : ''}
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
      
      @keyframes shrinkToCircle {
        from {
          width: 90%;
          max-width: 1000px;
          height: auto;
          border-radius: 12px;
          transform: translate(-50%, -50%);
        }
        to {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }
      }
      
      @keyframes expandFromCircle {
        from {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }
        to {
          width: 90%;
          max-width: 1000px;
          height: auto;
          border-radius: 12px;
          transform: translate(-50%, -50%);
          background: white;
          overflow: visible;
        }
      }
      
      .combined-audio-analysis-container.shrink-to-circle {
        animation: shrinkToCircle 0.5s ease-out forwards;
      }
      
      .combined-audio-analysis-container.shrink-to-circle > * {
        opacity: 0;
        pointer-events: none;
      }
      
      .combined-audio-analysis-container.expand-from-circle {
        animation: expandFromCircle 0.5s ease-out forwards;
      }
      
      .combined-audio-analysis-container.expand-from-circle > * {
        opacity: 1;
        pointer-events: auto;
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

      .combined-audio-analysis-container .metric-full-section {
        flex: 1;
        padding: 15px;
        background: #f8f9fa;
        width: 100%;
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
        background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
        border-right-color: #9c27b0;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section h4 {
        color: #9c27b0;
        border-bottom-color: #9c27b0;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section {
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
        border-right-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section h4 {
        color: #4ecdc4;
        border-bottom-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border-right-color: #ff9800;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section h4 {
        color: #ff9800;
        border-bottom-color: #ff9800;
      }

      .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section {
        background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
        border-right-color: #000000;
      }

      .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section h4 {
        color: #000000;
        border-bottom-color: #000000;
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
          border-bottom-color: #9c27b0;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section {
          border-bottom-color: #4ecdc4;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section {
          border-bottom-color: #ff9800;
        }

        .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section {
          border-bottom-color: #000000;
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

      .combined-audio-analysis-container .metric-full-section .data-table {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
        width: 100%;
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

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar {
        width: 6px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .base-info {
        margin-bottom: 15px;
        padding: 12px 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
        flex-shrink: 0;
      }

      .combined-audio-analysis-container .base-info h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: white;
      }

      .combined-audio-analysis-container .base-info .info-item {
        margin-top: 8px;
        font-size: 14px;
        color: white;
        opacity: 0.95;
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
    
    // 添加点击外部区域缩小为圆形的功能
    addClickOutsideToShrink(chartContainer);
  }

  // 2) 创建各个图表
  createAecDelayChart(aecDelayData);
  createSignalLevelChart(signalLevelData);
  createRecordVolumeChart(recordSignalVolumeData);
  createCombinedChart(aecDelayData, signalLevelData, recordSignalVolumeData);

  // 初始化时隐藏统计信息，显示选择提示
  const chartFooter = chartContainer.querySelector('.chart-footer');
  if (chartFooter) {
    chartFooter.style.display = 'none';
  }

  // 初始化时隐藏所有指标行（metric-row）
  const metricRows = chartContainer.querySelectorAll('.metric-row');
  metricRows.forEach(row => {
    row.style.display = 'none';
  });

  // 显示选择提示
  showSelectionPrompt();

  // 3) 添加事件监听器（替代内联事件处理器）
  // 为复选框添加事件监听器
  const checkboxes = chartContainer.querySelectorAll('input[type="checkbox"][data-issue-type]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const issueType = this.getAttribute('data-issue-type');
      window.updateIssueStatus(issueType, this.checked);
    });
  });

  // 为标签页按钮添加事件监听器
  const tabButtons = chartContainer.querySelectorAll('.tab-btn[data-tab]');
  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');
      window.switchTab(tabName);
    });
  });

  // 4) 添加全局函数（updateIssueStatus 已在全局作用域定义）

  // 获取问题显示名称（已在全局作用域定义）

  // 根据问题状态更新图表 - 定义为全局函数以便 updateIssueStatus 调用
  window.updateChartBasedOnIssues = function () {
    const issues = window.audioAnalysisIssues || {};

    console.log('🔄 updateChartBasedOnIssues 被调用，当前状态:', issues);

    // 更新图表标题以反映问题状态
    updateChartTitle(issues);

    // 根据问题状态调整图表样式
    adjustChartStyles(issues);

    // 更新统计信息显示
    updateStatisticsDisplay(issues);

    // 检查是否需要显示选择提示
    const hasActiveIssues = Object.values(issues).some(checked => checked);
    console.log('📊 是否有激活的问题:', hasActiveIssues);

    // 根据是否有勾选的问题来显示/隐藏分析图表
    const scrollableContent = document.querySelector('.combined-audio-analysis-container .scrollable-content');
    if (scrollableContent) {
      if (!hasActiveIssues) {
        console.log('✅ 没有勾选任何问题，隐藏分析图表');
        scrollableContent.style.display = 'none';
        showSelectionPrompt();
      } else {
        console.log('✅ 有勾选问题，显示分析图表');
        scrollableContent.style.display = 'block';
        hideSelectionPrompt();
      }
    }
  };

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

      header.textContent = "🎯🎯🎯 分析";
    }
  }

  // 调整图表样式
  function adjustChartStyles(issues) {
    // 不再修改画布颜色
    // const chartContainer = document.querySelector('.combined-audio-analysis-container');
    // if (!chartContainer) return;

    // 根据问题状态添加相应的 CSS 类
    // chartContainer.classList.remove('has-no-sound', 'has-low-level', 'has-echo');

    // if (issues.isNoSound) {
    //   chartContainer.classList.add('has-no-sound');
    // }
    // if (issues.isLowLevel) {
    //   chartContainer.classList.add('has-low-level');
    // }
    // if (issues.isEcho) {
    //   chartContainer.classList.add('has-echo');
    // }
  }


  window.switchTab = (tabName) => {
    // 切换标签页
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');

    // 切换画布显示
    document.getElementById('aecDelayChart').style.display = tabName === 'aec' ? 'block' : 'none';
    document.getElementById('signalLevelChart').style.display = tabName === 'signal' ? 'block' : 'none';
    document.getElementById('recordVolumeChart').style.display = tabName === 'record' ? 'block' : 'none';
    document.getElementById('videoFrozenChart').style.display = tabName === 'video' ? 'block' : 'none';
    document.getElementById('combinedChart').style.display = tabName === 'combined' ? 'block' : 'none';
  };

  window.exportCombinedChartData = () => {
    const csvData = [
      '时间戳,AEC Delay(ms),Signal Level,Record Volume,问题状态',
      ...safeAecDelayData.data.map((point, index) => {
        const signalPoint = safeSignalLevelData.data[index] || { value: 0 };
        const recordPoint = safeRecordSignalVolumeData.data[index] || { value: 0 };
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

  // 刷新功能已移除，不再使用模拟数据
  showNotification('组合音频分析图表已生成', 'success');
}

// 创建组合图表
function createCombinedChart(aecDelayData, signalLevelData, recordSignalVolumeData) {
  const canvas = document.getElementById('combinedChart');
  if (!canvas) return;

  // 安全访问数据，避免 null/undefined 错误
  const safeAecDelayData = aecDelayData || { data: [] };
  const safeSignalLevelData = signalLevelData || { data: [] };
  const safeRecordSignalVolumeData = recordSignalVolumeData || { data: [] };

  const aecPrepared = prepareChartData(safeAecDelayData.data);
  const signalPrepared = prepareChartData(safeSignalLevelData.data);
  const recordPrepared = prepareChartData(safeRecordSignalVolumeData.data);

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
            title: function (context) {
              const i = context[0].dataIndex;
              const ts = safeAecDelayData.data[i]?.timestamp;
              return ts ? new Date(ts).toLocaleString() : '';
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
    if (Math.abs(validData[i].value - validData[i - 1].value) > threshold) {
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
    case 'AUDIO SIGNAL LEVEL NEAROUT':
      return 5;  // Signal Level Nearout 变化阈值
    case 'A RECORD SIGNAL VOLUME':
      return 8;  // Record Volume 变化阈值
    case 'A PLAYOUT SIGNAL VOLUME':
      return 8;  // Playout Volume 变化阈值
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

// 计算平均延迟、最大延迟、变化次数、变化频率函数已移至 src/utils.js
// 使用全局作用域的函数：calculateAverageDelay, calculateMaxDelay, calculateChangeCount, calculateChangeFrequency

// 创建组合备用图表（当Chart.js无法加载时使用）
function createCombinedFallbackChart(aecDelayData, signalLevelData, signalLevelNearoutData, signalLevelFarinData, recordSignalVolumeData, playoutSignalVolumeData, errorCodeData, responseText) {
  console.log('使用备用图表显示组合音频分析数据');

  // 提取音频卡顿相关指标数据
  const audioPlaybackFrequencyData = window.extractMetricData ? window.extractMetricData(responseText, 'Audio Playback Frequency') : null;
  const audioDownlinkPullTimeData = window.extractMetricData ? window.extractMetricData(responseText, 'AUDIO DOWNLINK PULL 10MS DATA TIME') : null;

  // 安全访问数据，避免 null/undefined 错误
  const safeAecDelayData = aecDelayData || { data: [] };
  const safeSignalLevelData = signalLevelData || { data: [] };
  const safeSignalLevelNearoutData = signalLevelNearoutData || { data: [] };
  const safeSignalLevelFarinData = signalLevelFarinData || { data: [] };
  const safeRecordSignalVolumeData = recordSignalVolumeData || { data: [] };
  const safePlayoutSignalVolumeData = playoutSignalVolumeData || { data: [] };
  const safeErrorCodeData = errorCodeData || { data: [] };
  const safeAudioPlaybackFrequencyData = audioPlaybackFrequencyData || { data: [] };
  const safeAudioDownlinkPullTimeData = audioDownlinkPullTimeData || { data: [] };

  // 保存数据到全局变量，以便后续动态访问
  window.metricDataCache = {
    'Audio AEC Delay': aecDelayData,
    'Audio Signal Level Nearin': signalLevelData,
    'Audio Signal Level Nearout': signalLevelNearoutData,
    'A RECORD SIGNAL VOLUME': recordSignalVolumeData,
    'A PLAYOUT SIGNAL VOLUME': playoutSignalVolumeData,
    'Chat Engine Error Code': errorCodeData,
    'Audio Playback Frequency': audioPlaybackFrequencyData,
    'AUDIO DOWNLINK PULL 10MS DATA TIME': audioDownlinkPullTimeData
  };

  // 创建图表容器
  const chartContainer = document.createElement('div');
  chartContainer.className = 'combined-audio-analysis-container fallback-chart';
  chartContainer.innerHTML = `
    <div class="chart-header">
      <h3> 🎯🎯🎯 分析</h3>
      <button class="close-chart" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="chart-body" style="flex: 1; overflow-y: auto; padding: 0 20px 20px 20px;">
      <div class="chart-content">
        ${window.hasNewVersion ? '<div class="update-banner">已有新版，请更新 <a href="https://github.com/ReikyZ/auto-check/archive/refs/heads/main.zip" target="_blank" class="update-link">点击下载</a></div>' : ''}
        <div class="base-info">
          <h4>基本信息</h4>
        </div>
      <div class="issue-checkboxes">
        <div class="checkbox-group">
          <label class="checkbox-item">
            <input type="checkbox" id="isErrorCode" data-issue-type="isErrorCode">
            <span class="checkbox-label">错误码</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isNoSound" data-issue-type="isNoSound">
            <span class="checkbox-label">无声</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isLowLevel" data-issue-type="isLowLevel">
            <span class="checkbox-label">音量小</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isEcho" data-issue-type="isEcho">
            <span class="checkbox-label">回声</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isAudioStutter" data-issue-type="isAudioStutter">
            <span class="checkbox-label">音频卡顿</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isBlack" data-issue-type="isBlack">
            <span class="checkbox-label">黑屏</span>
          </label>
          <label class="checkbox-item">
            <input type="checkbox" id="isVideoFrozen" data-issue-type="isVideoFrozen">
            <span class="checkbox-label">视频上行卡顿</span>
          </label>
        </div>
      </div>
      <div class="scrollable-content">
        <div class="metrics-layout">
          <div class="metric-row" data-metric="Audio AEC Delay">
            <div class="metric-data-section">
              <h4>📊 AEC Delay 数据</h4>
              <div class="data-table" id="aecDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>📊 Audio AEC Delay 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeAecDelayData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均延迟</span>
                <span class="stat-value">${calculateAverageDelay(safeAecDelayData.data)}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大延迟</span>
                <span class="stat-value">${calculateMaxDelay(safeAecDelayData.data)}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeAecDelayData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeAecDelayData.data)}</span>
              </div>
            </div>
          </div>
          <div class="metric-row" data-metric="Audio Signal Level Nearin">
            <div class="metric-data-section">
              <h4>📈 Signal Level Nearin 数据</h4>
              <div class="data-table" id="signalDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>📈 Audio Signal Level Nearin 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeSignalLevelData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均信号</span>
                <span class="stat-value">${calculateAverageDelay(safeSignalLevelData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大信号</span>
                <span class="stat-value">${calculateMaxDelay(safeSignalLevelData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeSignalLevelData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeSignalLevelData.data)}</span>
              </div>
            </div>
          </div>
          ${safeSignalLevelNearoutData.data && safeSignalLevelNearoutData.data.length > 0 ? `
          <div class="metric-row" data-metric="Audio Signal Level Nearout">
            <div class="metric-data-section">
              <h4>📉 Signal Level Nearout 数据</h4>
              <div class="data-table" id="signalNearoutDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>📉 Audio Signal Level Nearout 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeSignalLevelNearoutData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均信号</span>
                <span class="stat-value">${calculateAverageDelay(safeSignalLevelNearoutData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大信号</span>
                <span class="stat-value">${calculateMaxDelay(safeSignalLevelNearoutData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeSignalLevelNearoutData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeSignalLevelNearoutData.data)}</span>
              </div>
            </div>
          </div>
          ` : ''}
          ${safeSignalLevelFarinData.data && safeSignalLevelFarinData.data.length > 0 ? `
          <div class="metric-row" data-metric="Audio Signal Level Farin">
            <div class="metric-data-section">
              <h4>📊 Signal Level Farin 数据</h4>
              <div class="data-table" id="signalFarinDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>📊 Audio Signal Level Farin 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeSignalLevelFarinData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均信号</span>
                <span class="stat-value">${calculateAverageDelay(safeSignalLevelFarinData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大信号</span>
                <span class="stat-value">${calculateMaxDelay(safeSignalLevelFarinData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeSignalLevelFarinData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeSignalLevelFarinData.data)}</span>
              </div>
            </div>
          </div>
          ` : ''}
          <div class="metric-row" data-metric="A RECORD SIGNAL VOLUME">
            <div class="metric-data-section">
              <h4>🎵 Record Volume 数据</h4>
              <div class="data-table" id="recordDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>🎵 A RECORD SIGNAL VOLUME 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeRecordSignalVolumeData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均音量</span>
                <span class="stat-value">${calculateAverageDelay(safeRecordSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大音量</span>
                <span class="stat-value">${calculateMaxDelay(safeRecordSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeRecordSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeRecordSignalVolumeData.data)}</span>
              </div>
            </div>
          </div>
          ${safePlayoutSignalVolumeData.data && safePlayoutSignalVolumeData.data.length > 0 ? `
          <div class="metric-row" data-metric="A PLAYOUT SIGNAL VOLUME">
            <div class="metric-data-section">
              <h4>🔊 Playout Volume 数据</h4>
              <div class="data-table" id="playoutDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>🔊 A PLAYOUT SIGNAL VOLUME 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safePlayoutSignalVolumeData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均音量</span>
                <span class="stat-value">${calculateAverageDelay(safePlayoutSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大音量</span>
                <span class="stat-value">${calculateMaxDelay(safePlayoutSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safePlayoutSignalVolumeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safePlayoutSignalVolumeData.data)}</span>
              </div>
            </div>
          </div>
          ` : ''}
          ${safeErrorCodeData.data && safeErrorCodeData.data.length > 0 ? `
          <div class="metric-row" data-metric="Chat Engine Error Code">
            <div class="metric-full-section">
              <h4>🚨 Chat Engine Error Code</h4>
              <div class="data-table" id="errorCodeDataTable"></div>
            </div>
          </div>
          ` : ''}
          ${safeAudioPlaybackFrequencyData.data && safeAudioPlaybackFrequencyData.data.length > 0 ? `
          <div class="metric-row" data-metric="Audio Playback Frequency">
            <div class="metric-data-section">
              <h4>⏸️ Audio Playback Frequency 数据</h4>
              <div class="data-table" id="audioPlaybackFrequencyDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>⏸️ Audio Playback Frequency 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeAudioPlaybackFrequencyData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均频率</span>
                <span class="stat-value">${calculateAverageDelay(safeAudioPlaybackFrequencyData.data)} Hz</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大频率</span>
                <span class="stat-value">${calculateMaxDelay(safeAudioPlaybackFrequencyData.data)} Hz</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeAudioPlaybackFrequencyData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeAudioPlaybackFrequencyData.data)}</span>
              </div>
            </div>
          </div>
          ` : ''}
          ${safeAudioDownlinkPullTimeData.data && safeAudioDownlinkPullTimeData.data.length > 0 ? `
          <div class="metric-row" data-metric="AUDIO DOWNLINK PULL 10MS DATA TIME">
            <div class="metric-data-section">
              <h4>📥 AUDIO DOWNLINK PULL 10MS DATA TIME 数据</h4>
              <div class="data-table" id="audioDownlinkPullTimeDataTable"></div>
            </div>
            <div class="metric-stats-section">
              <h4>📥 AUDIO DOWNLINK PULL 10MS DATA TIME 统计</h4>
              <div class="stat-item">
                <span class="stat-label">数据点</span>
                <span class="stat-value">${safeAudioDownlinkPullTimeData.data.length}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均时间</span>
                <span class="stat-value">${calculateAverageDelay(safeAudioDownlinkPullTimeData.data)} ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最大时间</span>
                <span class="stat-value">${calculateMaxDelay(safeAudioDownlinkPullTimeData.data)} ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化次数</span>
                <span class="stat-value">${calculateChangeCount(safeAudioDownlinkPullTimeData.data)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">变化频率</span>
                <span class="stat-value">${calculateChangeFrequency(safeAudioDownlinkPullTimeData.data)}</span>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      <div class="ai-analysis-section" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px; display: flex; flex-direction: column; flex: 1; min-height: 0;">
        <div style="display: flex; gap: 10px; align-items: stretch; margin-bottom: 10px;">
          <input type="text" id="aiAnalysisDescription" placeholder="请描述具体问题，例如：'听不到声音'、'视频卡顿'..." style="flex: 1; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 13px; box-sizing: border-box;">
          <button class="ai-analysis-btn" id="startAiAnalysis" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap;">
            <span>🤖</span> AI 智能分析
          </button>
        </div>
        <div class="ai-analysis-result" id="aiAnalysisResult" style="display:none; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; min-height: 100px;">
           <div class="loading" style="display:none; text-align: center; color: #666;">
             <span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> 正在分析数据...
           </div>
           <div class="content markdown-body" style="font-size: 13px; line-height: 1.6; color: #333;"></div>
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
    max-height: 90vh;
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
      
      @keyframes shrinkToCircle {
        from {
          width: 90%;
          max-width: 1000px;
          height: auto;
          border-radius: 12px;
          transform: translate(-50%, -50%);
        }
        to {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }
      }
      
      @keyframes expandFromCircle {
        from {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          overflow: hidden;
        }
        to {
          width: 90%;
          max-width: 1000px;
          height: auto;
          border-radius: 12px;
          transform: translate(-50%, -50%);
          background: white;
          overflow: visible;
        }
      }
      
      .combined-audio-analysis-container.shrink-to-circle {
        animation: shrinkToCircle 0.5s ease-out forwards;
      }
      
      .combined-audio-analysis-container.shrink-to-circle > * {
        opacity: 0;
        pointer-events: none;
      }
      
      .combined-audio-analysis-container.expand-from-circle {
        animation: expandFromCircle 0.5s ease-out forwards;
      }
      
      .combined-audio-analysis-container.expand-from-circle > * {
        opacity: 1;
        pointer-events: auto;
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
      
      .combined-audio-analysis-container.fallback-chart .chart-header {
        cursor: move;
        user-select: none;
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

      .combined-audio-analysis-container .metric-full-section {
        flex: 1;
        padding: 15px;
        background: #f8f9fa;
        width: 100%;
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
        background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
        border-right-color: #9c27b0;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(3) .metric-data-section h4 {
        color: #9c27b0;
        border-bottom-color: #9c27b0;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section {
        background: linear-gradient(135deg, #f0fffe 0%, #e0f7f5 100%);
        border-right-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section h4 {
        color: #4ecdc4;
        border-bottom-color: #4ecdc4;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section {
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        border-right-color: #ff9800;
      }
      
      .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section h4 {
        color: #ff9800;
        border-bottom-color: #ff9800;
      }

      .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section {
        background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
        border-right-color: #000000;
      }

      .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section h4 {
        color: #000000;
        border-bottom-color: #000000;
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
          border-bottom-color: #9c27b0;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(4) .metric-data-section {
          border-bottom-color: #4ecdc4;
        }
        
        .combined-audio-analysis-container .metric-row:nth-child(5) .metric-data-section {
          border-bottom-color: #ff9800;
        }

        .combined-audio-analysis-container .metric-row:nth-child(6) .metric-data-section {
          border-bottom-color: #000000;
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

      .combined-audio-analysis-container .metric-full-section .data-table {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
        width: 100%;
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

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar {
        width: 6px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .combined-audio-analysis-container .metric-full-section .data-table::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .combined-audio-analysis-container .base-info {
        margin-bottom: 15px;
        padding: 12px 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        color: white;
        flex-shrink: 0;
      }

      .combined-audio-analysis-container .base-info h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: white;
      }

      .combined-audio-analysis-container .base-info .info-item {
        margin-top: 8px;
        font-size: 14px;
        color: white;
        opacity: 0.95;
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
        
        .combined-audio-analysis-container .feedback-section {
          flex-direction: column;
          gap: 10px;
        }
        
        .combined-audio-analysis-container .feedback-input {
          width: 100%;
        }
      }
      
      /* 反馈区域样式 */
      .combined-audio-analysis-container .feedback-section {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px 20px;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      .combined-audio-analysis-container .feedback-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .combined-audio-analysis-container .feedback-btn.useful-btn {
        background: #667eea;
        color: white;
      }
      
      .combined-audio-analysis-container .feedback-btn.useful-btn:hover {
        background: #5568d3;
      }
      
      .combined-audio-analysis-container .feedback-btn.submit-btn {
        background: #28a745;
        color: white;
      }
      
      .combined-audio-analysis-container .feedback-btn.submit-btn:hover {
        background: #218838;
      }
      
      .combined-audio-analysis-container .feedback-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .combined-audio-analysis-container .feedback-input:focus {
        border-color: #667eea;
      }

      /* Markdown 样式增强 */
      .combined-audio-analysis-container .markdown-body h1,
      .combined-audio-analysis-container .markdown-body h2,
      .combined-audio-analysis-container .markdown-body h3,
      .combined-audio-analysis-container .markdown-body h4 {
        margin-top: 1.2em;
        margin-bottom: 0.6em;
        font-weight: 600;
        line-height: 1.25;
        color: #24292e;
      }
      
      .combined-audio-analysis-container .markdown-body h3 { font-size: 1.1em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
      .combined-audio-analysis-container .markdown-body h4 { font-size: 1em; }

      .combined-audio-analysis-container .markdown-body p { margin-bottom: 1em; }
      .combined-audio-analysis-container .markdown-body ul, 
      .combined-audio-analysis-container .markdown-body ol { padding-left: 2em; margin-bottom: 1em; }
      .combined-audio-analysis-container .markdown-body li { margin-bottom: 0.25em; }
      .combined-audio-analysis-container .markdown-body li > p { margin-top: 0.5em; }
      
      .combined-audio-analysis-container .markdown-body blockquote {
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
        margin: 0 0 1em 0;
      }
      
      .combined-audio-analysis-container .markdown-body code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27,31,35,0.05);
        border-radius: 3px;
        font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
      }
      
      .combined-audio-analysis-container .markdown-body strong { font-weight: 600; color: #dc3545; /* 重点内容标红 */ }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(chartContainer);
  
  // 添加点击外部区域缩小为圆形的功能
  addClickOutsideToShrink(chartContainer);

  // 为 fallback-chart 添加拖拽功能
  if (chartContainer.classList.contains('fallback-chart')) {
    const chartHeader = chartContainer.querySelector('.chart-header');
    if (chartHeader) {
      let isDragging = false;
      let startX;
      let startY;
      let initialLeft;
      let initialTop;

      chartHeader.addEventListener('mousedown', (e) => {
        // 如果点击的是关闭按钮，不触发拖拽
        if (e.target.classList.contains('close-chart') || e.target.closest('.close-chart')) {
          return;
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        // 获取当前容器的位置
        const rect = chartContainer.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // 移除 transform 居中，改用绝对定位
        chartContainer.style.transform = 'none';
        chartContainer.style.left = initialLeft + 'px';
        chartContainer.style.top = initialTop + 'px';
      });

      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          e.preventDefault();
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          chartContainer.style.left = (initialLeft + deltaX) + 'px';
          chartContainer.style.top = (initialTop + deltaY) + 'px';
        }
      });

      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }
  }

  // 创建数据表格
  createDataTable(safeAecDelayData.data, 'aecDataTable');
  createDataTable(safeSignalLevelData.data, 'signalDataTable');
  if (safeSignalLevelNearoutData.data && safeSignalLevelNearoutData.data.length > 0) {
    createDataTable(safeSignalLevelNearoutData.data, 'signalNearoutDataTable');
  }
  if (safeSignalLevelFarinData.data && safeSignalLevelFarinData.data.length > 0) {
    createDataTable(safeSignalLevelFarinData.data, 'signalFarinDataTable');
  }
  createDataTable(safeRecordSignalVolumeData.data, 'recordDataTable');
  if (safePlayoutSignalVolumeData.data && safePlayoutSignalVolumeData.data.length > 0) {
    createDataTable(safePlayoutSignalVolumeData.data, 'playoutDataTable');
  }
  if (safeErrorCodeData.data && safeErrorCodeData.data.length > 0) {
    createErrorCodeTable(safeErrorCodeData, 'errorCodeDataTable');
  }
  if (safeAudioPlaybackFrequencyData.data && safeAudioPlaybackFrequencyData.data.length > 0) {
    createDataTable(safeAudioPlaybackFrequencyData.data, 'audioPlaybackFrequencyDataTable');
  }
  if (safeAudioDownlinkPullTimeData.data && safeAudioDownlinkPullTimeData.data.length > 0) {
    createDataTable(safeAudioDownlinkPullTimeData.data, 'audioDownlinkPullTimeDataTable');
  }

  // 初始化时隐藏所有指标行（metric-row）
  const metricRows = chartContainer.querySelectorAll('.metric-row');
  metricRows.forEach(row => {
    row.style.display = 'none';
  });

  // 显示选择提示
  showSelectionPrompt();

  // 添加事件监听器（替代内联事件处理器）
  // 为复选框添加事件监听器
  const checkboxes = chartContainer.querySelectorAll('input[type="checkbox"][data-issue-type]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const issueType = this.getAttribute('data-issue-type');
      window.updateIssueStatus(issueType, this.checked);
    });
  });

  // 为标签页按钮添加事件监听器
  const tabButtons = chartContainer.querySelectorAll('.tab-btn[data-tab]');
  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      const tabName = this.getAttribute('data-tab');
      window.switchTab(tabName);
    });
  });

  // 为"有用"按钮添加烟花效果和POST请求
  const usefulBtn = chartContainer.querySelector('.useful-btn');
  if (usefulBtn) {
    usefulBtn.addEventListener('click', function () {
      createFireworks(this);

      // 点击后隐藏按钮
      this.style.display = 'none';

      // 通过background script发送POST请求，避免证书问题
      console.log('📤 发送反馈消息...');
      chrome.runtime.sendMessage({
        type: 'SEND_FEEDBACK',
        data: {
          timestamp: new Date().toISOString(),
          action: 'useful'
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ 消息发送失败:', chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          console.log('👍 有用反馈已发送:', response.data);
        } else {
          console.error('❌ 发送反馈失败:', response?.error || '未知错误');
        }
      });
    });
  }

  // 为"反馈"按钮添加点击事件
  // 为"AI分析"按钮添加点击事件
  const aiAnalysisBtn = chartContainer.querySelector('#startAiAnalysis');
  const aiAnalysisResult = chartContainer.querySelector('#aiAnalysisResult');
  const loadingEl = aiAnalysisResult.querySelector('.loading');
  const contentEl = aiAnalysisResult.querySelector('.content');

  if (aiAnalysisBtn) {
    aiAnalysisBtn.addEventListener('click', async function () {
      // 显示加载状态
      aiAnalysisResult.style.display = 'block';
      loadingEl.style.display = 'block';
      contentEl.innerHTML = '';
      this.disabled = true;
      this.style.opacity = '0.7';

      try {
        // 获取当前 SID
        let sid = window.currentSid || null;
        if (!sid) {
          const sidFromPage = collectSidValues(document);
          if (sidFromPage) {
            if (Array.isArray(sidFromPage) && sidFromPage.length > 0) {
              sid = sidFromPage[0].value || sidFromPage[0];
            } else if (typeof sidFromPage === 'string') {
              sid = sidFromPage;
            }
          }
        }

        if (!sid) {
          throw new Error('未找到会话 ID (SID)');
        }

        console.log('🤖 开始 AI 分析, SID:', sid);

        // 收集选中的问题类型，自动填充到输入框（如果输入框为空）
        const selectedIssues = [];
        if (window.audioAnalysisIssues) {
          if (window.audioAnalysisIssues.isErrorCode) selectedIssues.push('错误码');
          if (window.audioAnalysisIssues.isNoSound) selectedIssues.push('无声');
          if (window.audioAnalysisIssues.isLowLevel) selectedIssues.push('音量小');
          if (window.audioAnalysisIssues.isEcho) selectedIssues.push('回声');
          if (window.audioAnalysisIssues.isAudioStutter) selectedIssues.push('音频卡顿');
          if (window.audioAnalysisIssues.isBlack) selectedIssues.push('黑屏');
        }

        // 获取用户输入
        const descriptionInput = chartContainer.querySelector('#aiAnalysisDescription');
        let userDescription = descriptionInput ? descriptionInput.value.trim() : '';

        // 如果用户没填，尝试用勾选的生成
        if (!userDescription && selectedIssues.length > 0) {
          userDescription = `用户反馈的问题是：${selectedIssues.join('、')}`;
        }

        // 最终的描述
        const description = userDescription || '用户未提供具体描述，请全面分析数据。';
        const currentUrl = window.location.href;

        // 发送分析请求
        const requestData = {
          url: currentUrl,
          description: description
        };

        // 如果获取到了用户信息，通过用户名一并发送
        if (window.argusUserInfo && window.argusUserInfo.name) {
          requestData.username = window.argusUserInfo.name;
        }

        chrome.runtime.sendMessage({
          type: 'SEND_AI_ANALYSIS',
          data: requestData
        }, (response) => {
          // 恢复按钮状态
          this.disabled = false;
          this.style.opacity = '1';
          loadingEl.style.display = 'none';

          if (chrome.runtime.lastError) {
            contentEl.innerHTML = `<span style="color: #dc3545;">❌ 分析请求失败: ${chrome.runtime.lastError.message}</span>`;
            return;
          }

          if (response && response.success) {
            // 显示分析结果 (参照 disk 项目格式)
            let analysisResult = '';
            if (response.data && response.data.analysis) {
              analysisResult = response.data.analysis;
            } else if (response.data && response.data.content) {
              analysisResult = response.data.content;
            } else if (typeof response.data === 'string') {
              analysisResult = response.data;
            } else {
              analysisResult = JSON.stringify(response.data, null, 2);
            }

            // 按照 disk 项目的展示格式
            let resultHtml = '<div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">✅ 分析完成！</div>';
            resultHtml += '<div style="padding:15px; background:#f8f9fa; border-radius:5px; border:1px solid #eee; text-align:left; color:#333; font-size:14px; line-height:1.6;">' + parseMarkdown(analysisResult) + '</div>';

            contentEl.innerHTML = resultHtml;
            console.log('🤖 AI 分析完成');
          } else {
            contentEl.innerHTML = `<span style="color: #dc3545;">❌ 分析失败: ${response?.error || '未知错误'}</span>`;
          }
        });

      } catch (error) {
        console.error('AI 分析过程出错:', error);
        this.disabled = false;
        this.style.opacity = '1';
        loadingEl.style.display = 'none';
        contentEl.innerHTML = `<span style="color: #dc3545;">❌ 错误: ${error.message}</span>`;
      }
    });
  }

  // Enhanced Markdown Parser - 增强版 Markdown 解析器
  function parseMarkdown(text) {
    if (!text) return '';

    // 预处理：保护代码块中的内容
    const codeBlocks = [];
    let processed = text.replace(/`([^`]+)`/g, (match, code) => {
      codeBlocks.push(code);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 按行处理
    const lines = processed.split('\n');
    let html = '';
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let listBuffer = [];

    // 辅助函数：结束列表
    const endList = () => {
      if (inList && listBuffer.length > 0) {
        const listTag = listType === 'ol' ? 'ol' : 'ul';
        const listStyle = listType === 'ol' 
          ? 'margin: 12px 0; padding-left: 24px; list-style-type: decimal;'
          : 'margin: 12px 0; padding-left: 24px; list-style-type: none;';
        html += `<${listTag} style="${listStyle}">`;
        listBuffer.forEach(item => {
          const bullet = listType === 'ol' ? '' : '<span style="color: #667eea; margin-right: 8px;">●</span>';
          html += `<li style="margin: 8px 0; line-height: 1.6;">${bullet}${item}</li>`;
        });
        html += `</${listTag}>`;
        listBuffer = [];
        inList = false;
        listType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // 二级标题 ## -> 带分隔线的大标题
      if (/^##\s+(.+)$/.test(line)) {
        endList();
        const title = line.replace(/^##\s+/, '');
        html += `
          <div style="margin-top: 24px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
            <h2 style="margin: 0; font-size: 16px; font-weight: 600; color: #24292e; display: flex; align-items: center;">
              <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 4px; margin-right: 10px; font-size: 12px;">📋</span>
              ${title}
            </h2>
          </div>`;
        continue;
      }

      // 三级标题 ### -> 中等标题
      if (/^###\s+(.+)$/.test(line)) {
        endList();
        const title = line.replace(/^###\s+/, '');
        html += `
          <h3 style="margin: 20px 0 12px 0; font-size: 15px; font-weight: 600; color: #333; border-left: 4px solid #667eea; padding-left: 12px;">
            ${title}
          </h3>`;
        continue;
      }

      // 四级标题 #### -> 小标题
      if (/^####\s+(.+)$/.test(line)) {
        endList();
        const title = line.replace(/^####\s+/, '');
        html += `
          <h4 style="margin: 16px 0 8px 0; font-size: 14px; font-weight: 600; color: #555;">
            ${title}
          </h4>`;
        continue;
      }

      // 有序列表 1. 2. 3.
      const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          endList();
          inList = true;
          listType = 'ol';
        }
        listBuffer.push(processInlineMarkdown(olMatch[2]));
        continue;
      }

      // 无序列表 - 或 *
      const ulMatch = line.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          endList();
          inList = true;
          listType = 'ul';
        }
        // 处理带有级别标签的列表项 [严重] [警告] [信息]
        let itemContent = ulMatch[1];
        if (itemContent.includes('[严重]')) {
          itemContent = itemContent.replace('[严重]', '<span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 8px;">🔴 严重</span>');
        } else if (itemContent.includes('[警告]')) {
          itemContent = itemContent.replace('[警告]', '<span style="background: #ffc107; color: #333; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 8px;">🟡 警告</span>');
        } else if (itemContent.includes('[信息]')) {
          itemContent = itemContent.replace('[信息]', '<span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 8px;">🔵 信息</span>');
        }
        listBuffer.push(processInlineMarkdown(itemContent));
        continue;
      }

      // 引用块 >
      if (/^>\s*(.*)$/.test(line)) {
        endList();
        const quote = line.replace(/^>\s*/, '');
        html += `
          <blockquote style="margin: 12px 0; padding: 12px 16px; background: #f8f9fa; border-left: 4px solid #667eea; color: #555; border-radius: 0 4px 4px 0;">
            ${processInlineMarkdown(quote)}
          </blockquote>`;
        continue;
      }

      // 空行
      if (line.trim() === '') {
        endList();
        html += '<div style="height: 8px;"></div>';
        continue;
      }

      // 普通段落
      endList();
      html += `<p style="margin: 10px 0; line-height: 1.7; color: #333;">${processInlineMarkdown(line)}</p>`;
    }

    // 结束可能未闭合的列表
    endList();

    // 还原代码块
    codeBlocks.forEach((code, index) => {
      html = html.replace(
        `__CODE_BLOCK_${index}__`,
        `<code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Consolas, monospace; font-size: 13px; color: #e83e8c;">${code}</code>`
      );
    });

    return html;
  }

  // 处理行内 Markdown 元素（加粗、斜体等）
  function processInlineMarkdown(text) {
    if (!text) return '';
    
    return text
      // 加粗 **text** -> <strong>
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #d63384; font-weight: 600;">$1</strong>')
      // 斜体 *text* -> <em> (需要注意不要和加粗冲突)
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em style="color: #6c757d;">$1</em>')
      // 角色/UID 高亮
      .replace(/(UID[=:]\s*)(\d+)/g, '$1<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #1976d2;">$2</span>')
      // SID 高亮
      .replace(/(SID[=:]\s*)([A-F0-9]{32})/gi, '$1<span style="background: #fff3e0; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #e65100;">$2</span>')
      // 数值高亮 (如 = 34.4)
      .replace(/=\s*(\d+\.?\d*)/g, '= <span style="font-weight: 600; color: #28a745;">$1</span>')
      // 发送端/接收端 标签
      .replace(/发送端/g, '<span style="background: #d4edda; padding: 2px 8px; border-radius: 4px; color: #155724; font-weight: 500;">📤 发送端</span>')
      .replace(/接收端/g, '<span style="background: #cce5ff; padding: 2px 8px; border-radius: 4px; color: #004085; font-weight: 500;">📥 接收端</span>');
  }

  // 烟花效果函数
  function createFireworks(button) {
    const buttonRect = button.getBoundingClientRect();
    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 50 + Math.random() * 100;
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.style.position = 'fixed';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.backgroundColor = color;
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '10002';
      particle.style.boxShadow = `0 0 10px ${color}`;

      document.body.appendChild(particle);

      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;

      particle.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }).onfinish = () => {
        particle.remove();
      };
    }
  }

  // 添加全局函数（updateIssueStatus 已在全局作用域定义）

  // 获取问题显示名称（已在全局作用域定义）

  // 根据问题状态更新图表 - 定义为全局函数以便 updateIssueStatus 调用
  window.updateChartBasedOnIssues = function () {
    const issues = window.audioAnalysisIssues || {};

    console.log('🔄 updateChartBasedOnIssues 被调用，当前状态:', issues);

    // 更新图表标题以反映问题状态
    updateChartTitle(issues);

    // 根据问题状态调整图表样式
    adjustChartStyles(issues);

    // 更新统计信息显示
    updateStatisticsDisplay(issues);

    // 检查是否需要显示选择提示
    const hasActiveIssues = Object.values(issues).some(checked => checked);
    console.log('📊 是否有激活的问题:', hasActiveIssues);

    // 根据是否有勾选的问题来显示/隐藏分析图表
    const scrollableContent = document.querySelector('.combined-audio-analysis-container .scrollable-content');
    if (scrollableContent) {
      if (!hasActiveIssues) {
        console.log('✅ 没有勾选任何问题，隐藏分析图表');
        scrollableContent.style.display = 'none';
        showSelectionPrompt();
      } else {
        console.log('✅ 有勾选问题，显示分析图表');
        scrollableContent.style.display = 'block';
        hideSelectionPrompt();
      }
    }
  };

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

      header.textContent = "🎯🎯🎯 分析";
    }
  }

  // 调整图表样式
  function adjustChartStyles(issues) {
    // 不再修改画布颜色
    // const chartContainer = document.querySelector('.combined-audio-analysis-container');
    // if (!chartContainer) return;

    // 根据问题状态添加相应的 CSS 类
    // chartContainer.classList.remove('has-no-sound', 'has-low-level', 'has-echo');

    // if (issues.isNoSound) {
    //   chartContainer.classList.add('has-no-sound');
    // }
    // if (issues.isLowLevel) {
    //   chartContainer.classList.add('has-low-level');
    // }
    // if (issues.isEcho) {
    //   chartContainer.classList.add('has-echo');
    // }
  }

  // 更新统计信息显示
  function updateStatisticsDisplay(issues) {
    // 根据问题类型规则智能高亮相关指标
    const metricRows = document.querySelectorAll('.metric-row');

    // 检查是否有任何问题被勾选
    const hasActiveIssues = Object.values(issues).some(checked => checked);

    // 调试信息
    console.log('更新统计信息显示:', {
      issues: issues,
      hasActiveIssues: hasActiveIssues,
      metricRowsCount: metricRows.length
    });

    metricRows.forEach(metricRow => {
      // 获取 metric 名称
      const metricName = metricRow.dataset.metric;
      if (!metricName) return;

      let shouldHighlight = false;
      let highlightColor = '#667eea';
      let highlightBackground = 'white';
      let shouldShow = false; // 默认隐藏所有指标

      // 如果有问题被勾选，根据规则表判断是否显示该指标
      if (hasActiveIssues) {
        // 检查当前指标是否与任何勾选的问题类型相关（完全依赖规则表）
        Object.keys(issues).forEach(issueType => {
          if (issues[issueType]) {
            // 确保规则表函数可用
            if (typeof getIssueTypeConfig === 'function' && typeof isMetricRelatedToIssue === 'function') {
              try {
                const issueConfig = getIssueTypeConfig(issueType);
                if (issueConfig) {
                  const isRelated = isMetricRelatedToIssue(metricName, issueType);

                  // 调试信息
                  console.log(`指标匹配检查:`, {
                    metricName: metricName,
                    issueType: issueType,
                    isRelated: isRelated,
                    issueConfig: issueConfig
                  });

                  if (isRelated) {
                    shouldShow = true;
                    shouldHighlight = true;
                    // 使用第一个匹配的问题类型的颜色（如果有多个匹配，使用第一个匹配的颜色）
                    if (highlightColor === '#667eea') {
                      highlightColor = issueConfig.color;
                      highlightBackground = issueConfig.color + '15'; // 添加透明度
                    }
                  }
                }
              } catch (error) {
                console.warn('规则表函数调用出错:', error);
                // 如果规则表函数出错，不显示指标（避免显示不相关内容）
                shouldShow = false;
              }
            } else {
              console.warn('规则表函数不可用，使用默认显示逻辑');
              // 如果规则表函数不可用，不显示指标（避免显示不相关内容）
              shouldShow = false;
            }
          }
        });
      }

      // 控制显示/隐藏
      if (shouldShow) {
        console.log('指标显示:', metricName);
        metricRow.style.display = 'flex';
        metricRow.style.opacity = '1';
        metricRow.style.transform = 'scale(1)';
      } else {
        // 为什么不显示没生效
        // 注意：有些情况下，flex container 的子项 display:none 设置可能因外层/父层样式冲突或渲染机制被覆盖，需要增加!important提升优先级
        console.log('指标不显示:', metricName);
        metricRow.style.display = 'none';
        metricRow.style.setProperty('display', 'none', 'important');
      }

      // 应用高亮样式
      if (shouldHighlight) {
        metricRow.style.border = `2px solid ${highlightColor}`;
        metricRow.style.background = highlightBackground;
        metricRow.style.boxShadow = `0 2px 8px ${highlightColor}30`;
      } else {
        metricRow.style.border = '1px solid #e9ecef';
        metricRow.style.background = 'white';
        metricRow.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }
    });

    // 更新显示状态提示
    updateDisplayStatusMessage(issues, hasActiveIssues);

    // 如果没有勾选任何问题，显示选择提示
    if (!hasActiveIssues) {
      showSelectionPrompt();
    } else {
      hideSelectionPrompt();
    }
  }

  // 更新显示状态提示
  function updateDisplayStatusMessage(issues, hasActiveIssues) {
    let statusMessage = '';

    if (hasActiveIssues) {
      const activeIssues = Object.entries(issues)
        .filter(([key, value]) => value)
        .map(([key]) => {
          if (typeof getIssueTypeConfig === 'function') {
            const config = getIssueTypeConfig(key);
            return config ? config.name : key;
          }
          return key;
        });

      statusMessage = `当前显示与以下问题相关的指标: ${activeIssues.join(', ')}`;
    } else {
      statusMessage = '请选择要分析的问题类型';
    }

    // 更新或创建状态提示
    let statusElement = document.querySelector('.issue-status-message');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.className = 'issue-status-message';
      statusElement.style.cssText = `
        padding: 10px 15px;
        margin: 10px 0;
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        border-radius: 4px;
        font-size: 14px;
        color: #1976d2;
        font-weight: 500;
      `;

      // 插入到问题勾选框后面
      const issueCheckboxes = document.querySelector('.issue-checkboxes');
      if (issueCheckboxes && issueCheckboxes.parentNode) {
        issueCheckboxes.parentNode.insertBefore(statusElement, issueCheckboxes.nextSibling);
      }
    }

    statusElement.textContent = statusMessage;
  }

  // 显示选择问题类型提示
  function showSelectionPrompt() {
    // 隐藏统计信息区域（主图表）
    const chartFooters = document.querySelectorAll('.chart-footer');
    chartFooters.forEach(footer => {
      footer.style.display = 'none';
    });

    // 注意：不要在这里隐藏所有指标行
    // 指标行的显示应该由 updateStatisticsDisplay() 函数根据 shouldShow 逻辑控制
    // 当没有勾选任何问题时，updateStatisticsDisplay() 会确保正确显示所有指标

    // 创建或显示选择提示
    let promptElement = document.querySelector('.selection-prompt');
    if (!promptElement) {
      promptElement = document.createElement('div');
      promptElement.className = 'selection-prompt';
      promptElement.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        margin: 20px 0;
        border: 2px dashed #dee2e6;
        min-height: 200px;
      `;

      promptElement.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px; opacity: 0.6;">⬆️</div>
        <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 18px; font-weight: 600;">选择分析问题类型</h3>
        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
          请在上方勾选您要分析的问题类型<br>
          系统将显示与所选问题相关的指标数据
        </p>
        <div style="margin-top: 20px; padding: 10px 20px; background: #e3f2fd; border-radius: 6px; font-size: 12px; color: #1976d2;">
          💡 提示：勾选问题类型后，系统会自动过滤显示相关指标
        </div>
      `;

      // 插入到滚动内容区域
      const scrollableContent = document.querySelector('.scrollable-content');
      if (scrollableContent) {
        scrollableContent.appendChild(promptElement);
      }
    } else {
      promptElement.style.display = 'flex';
    }
  }

  // 隐藏选择问题类型提示
  function hideSelectionPrompt() {
    const promptElement = document.querySelector('.selection-prompt');
    if (promptElement) {
      promptElement.style.display = 'none';
    }

    // 恢复统计信息区域的显示
    const chartFooters = document.querySelectorAll('.chart-footer');
    chartFooters.forEach(footer => {
      footer.style.display = 'block';
    });

    // 注意：不要在这里恢复所有指标行的显示
    // 指标行的显示应该由 updateStatisticsDisplay() 函数根据 shouldShow 逻辑控制
    // 直接设置 display: block 会覆盖 updateStatisticsDisplay() 的判断逻辑
  }

  // 从标题中提取指标名称
  function extractMetricNameFromTitle(titleText) {
    if (titleText.includes('AEC Delay')) return 'Audio AEC Delay';
    if (titleText.includes('Signal Level Nearout')) return 'Audio Signal Level Nearout';
    if (titleText.includes('Signal Level Farin')) return 'Audio Signal Level Farin';
    if (titleText.includes('Signal Level')) return 'Audio Signal Level Nearin';
    if (titleText.includes('Record Volume')) return 'A RECORD SIGNAL VOLUME';
    if (titleText.includes('Playout Volume')) return 'A PLAYOUT SIGNAL VOLUME';
    return null;
  }

  // 测试规则表匹配功能
  window.testIssueRules = function () {
    console.log('=== 测试问题类型规则表匹配 ===');

    const testCases = [
      { issueType: 'isNoSound', expectedMetrics: ['Audio Signal Level Nearin', 'Audio Signal Level Nearout', 'Audio Signal Level Farin', 'A RECORD SIGNAL VOLUME'] },
      { issueType: 'isLowLevel', expectedMetrics: ['Audio Signal Level Nearin', 'Audio Signal Level Nearout', 'Audio Signal Level Farin', 'A RECORD SIGNAL VOLUME'] },
      { issueType: 'isEcho', expectedMetrics: ['Audio AEC Delay'] }
    ];

    testCases.forEach(testCase => {
      console.log(`\n测试问题类型: ${testCase.issueType}`);

      if (typeof getMetricsForIssueType === 'function') {
        const actualMetrics = getMetricsForIssueType(testCase.issueType);
        console.log('期望指标:', testCase.expectedMetrics);
        console.log('实际指标:', actualMetrics);
        console.log('匹配结果:', JSON.stringify(actualMetrics) === JSON.stringify(testCase.expectedMetrics) ? '✅ 通过' : '❌ 失败');
      } else {
        console.log('❌ 规则表函数未加载');
      }
    });

    console.log('\n=== 测试完成 ===');
  };

  window.exportCombinedChartData = () => {
    const csvData = [
      '时间戳,AEC Delay(ms),Signal Level,Record Volume,问题状态',
      ...safeAecDelayData.data.map((point, index) => {
        const signalPoint = safeSignalLevelData.data[index] || { value: 0 };
        const recordPoint = safeRecordSignalVolumeData.data[index] || { value: 0 };
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

  // 刷新功能已移除，不再使用模拟数据

  showNotification('组合音频分析已显示（简化模式）', 'success');
}

// 创建数据表格
// 创建 Error Code 专用表格
function createErrorCodeTable(errorCodeData, containerId = 'errorCodeDataTable') {
  const tableContainer = document.getElementById(containerId);
  if (!tableContainer) return;

  // 如果没有数据，返回
  if (!errorCodeData || !errorCodeData.data || !Array.isArray(errorCodeData.data)) {
    return;
  }

  // 创建表格
  const table = document.createElement('table');
  table.className = 'data-table-content error-code-table';

  // 表头
  const header = document.createElement('tr');
  header.innerHTML = `
    <th style="width: 200px;">时间</th>
    <th style="width: 120px;">错误码</th>
    <th>错误描述</th>
  `;
  table.appendChild(header);

  // 显示所有数据
  if (errorCodeData.loading) {
    // 正在加载中
    errorCodeData.data.forEach(([timestamp, errorCode, description]) => {
      const row = document.createElement('tr');
      const time = new Date(timestamp).toLocaleTimeString();

      row.innerHTML = `
        <td>${time}</td>
        <td style="font-family: monospace; font-weight: bold;">${errorCode !== null ? errorCode : '-'}</td>
        <td style="text-align: left; color: #666; font-style: italic;">${description || '解析中...'}</td>
      `;
      table.appendChild(row);
    });
  } else if (errorCodeData.error) {
    // 解析失败
    const errorRow = document.createElement('tr');
    errorRow.innerHTML = `
      <td colspan="3" style="text-align: center; color: #dc3545; font-style: italic;">
        错误代码解析失败: ${errorCodeData.error}
      </td>
    `;
    table.appendChild(errorRow);
  } else {
    // 解析成功，显示完整数据
    errorCodeData.data.forEach(([timestamp, errorCode, description]) => {
      const row = document.createElement('tr');
      const time = new Date(timestamp).toLocaleTimeString();

      row.innerHTML = `
        <td>${time}</td>
        <td style="font-family: monospace; font-weight: bold;">${errorCode !== null ? errorCode : '-'}</td>
        <td style="text-align: left;">${description !== null ? description : '-'}</td>
      `;
      table.appendChild(row);
    });
  }

  // 如果没有数据
  if (errorCodeData.data.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="3" style="text-align: center; color: #666; font-style: italic;">
        没有有效的错误代码数据
      </td>
    `;
    table.appendChild(emptyRow);
  }

  // 清空容器并添加新表格
  tableContainer.innerHTML = '';
  tableContainer.appendChild(table);
}

function createDataTable(data, containerId = 'dataTable') {
  const tableContainer = document.getElementById(containerId);
  if (!tableContainer) return;

  // 过滤有效数据（保留0值）
  const validData = data.filter(point => point.value !== null && point.value !== undefined);

  // 创建表格
  const table = document.createElement('table');
  table.className = 'data-table-content';

  // 根据不同的容器ID确定表格结构和状态逻辑
  let headerHTML = '';
  let showStatus = true;
  let valueLabel = '';

  if (containerId === 'audioPlaybackFrequencyDataTable') {
    // 音频卡顿：只需要【时间】【频率】，不需要【状态】
    headerHTML = `
      <th>时间</th>
      <th>频率</th>
    `;
    showStatus = false;
    valueLabel = '频率';
  } else if (containerId === 'aecDataTable') {
    // 回声：【时间】【延迟 (ms)】【状态】，状态值>48 为高，否则正常
    headerHTML = `
      <th>时间</th>
      <th>延迟 (ms)</th>
      <th>状态</th>
    `;
    valueLabel = '延迟 (ms)';
  } else if (containerId === 'signalDataTable' || containerId === 'signalNearoutDataTable' || containerId === 'signalFarinDataTable' || containerId === 'playoutDataTable') {
    // nearIn nearout：【时间】【音量值】【状态】，音量值>85 状态为【正常】,否则【低】
    headerHTML = `
      <th>时间</th>
      <th>音量值</th>
      <th>状态</th>
    `;
    valueLabel = '音量值';
  } else if (containerId === 'recordDataTable') {
    // A RECORD SIGNAL VOLUME：【时间】【音量值】【状态】，音量值>100状态为高,<100 为【低】,=100【正常】
    headerHTML = `
      <th>时间</th>
      <th>音量值</th>
      <th>状态</th>
    `;
    valueLabel = '音量值';
  } else {
    // 默认情况
    headerHTML = `
      <th>时间</th>
      <th>延迟 (ms)</th>
      <th>状态</th>
    `;
    valueLabel = '延迟 (ms)';
  }

  // 表头
  const header = document.createElement('tr');
  header.innerHTML = headerHTML;
  table.appendChild(header);

  // 数据行（显示前10条和最后5条）
  const displayData = validData.length > 15
    ? [...validData.slice(0, 10), ...validData.slice(-5)]
    : validData;

  displayData.forEach((point, index) => {
    const row = document.createElement('tr');
    const time = new Date(point.timestamp).toLocaleTimeString();
    const value = point.value;

    let rowHTML = `<td>${time}</td><td>${value}</td>`;

    if (showStatus) {
      let status = '';
      let statusClass = '';

      if (containerId === 'aecDataTable') {
        // 回声：状态值>48 为高，否则正常
        status = value > 48 ? '高' : '正常';
        statusClass = value > 48 ? 'status-high' : 'status-normal';
      } else if (containerId === 'signalDataTable' || containerId === 'signalNearoutDataTable' || containerId === 'signalFarinDataTable') {
        // nearIn nearout：音量值>85 状态为【正常】,否则【低】
        status = value > 85 ? '正常' : '低';
        statusClass = value > 85 ? 'status-normal' : 'status-low';
      } else if (containerId === 'recordDataTable' || containerId === 'playoutDataTable') {
        // A RECORD SIGNAL VOLUME：音量值>100状态为高,<100 为【低】,=100【正常】
        if (value > 100) {
          status = '高';
          statusClass = 'status-high';
        } else if (value < 100) {
          status = '低';
          statusClass = 'status-low';
        } else {
          status = '正常';
          statusClass = 'status-normal';
        }
      } else {
        // 默认逻辑
        status = value > 100 ? '高' : value > 50 ? '中' : '低';
        statusClass = value > 100 ? 'status-high' : value > 50 ? 'status-medium' : 'status-low';
      }

      rowHTML += `<td><span class="status-badge ${statusClass}">${status}</span></td>`;
    }

    row.innerHTML = rowHTML;
    table.appendChild(row);
  });

  // 如果有省略的数据，添加提示行
  const colCount = showStatus ? 3 : 2;
  if (validData.length > 15) {
    const ellipsisRow = document.createElement('tr');
    ellipsisRow.innerHTML = `
      <td colspan="${colCount}" style="text-align: center; color: #666; font-style: italic;">
        ... 省略 ${validData.length - 15} 条数据 ...
      </td>
    `;
    table.appendChild(ellipsisRow);
  }

  tableContainer.innerHTML = '';
  tableContainer.appendChild(table);
}

// 显示通知
async function showNotification(message, type = 'info') {
  const utilsModule = await import(chrome.runtime.getURL('src/utils.js'));
  utilsModule.showNotification(message, type);
}

// 主函数：注入Auto Check按钮到所有info_right元素
function injectAutoCheckButton() {
  try {
    // 查找所有info_right元素
    const infoRightElements = document.querySelectorAll('.info_right');

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

      // 按钮添加后，延迟查找并打印 sids 值
      setTimeout(() => {
        findAndPrintSidsValues();
      }, 500);
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

      // 按钮添加后，延迟查找并打印 sids 值
      setTimeout(() => {
        findAndPrintSidsValues();
      }, 500);
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

// 查找并打印 auto-check 按钮所在 counter-view div 中 sids 的 span 值
function findAndPrintSidsValues() {
  try {
    // 查找所有 auto-check 按钮
    const autoCheckButtons = document.querySelectorAll('.auto-check-btn');

    if (autoCheckButtons.length === 0) {
      console.log('未找到 auto-check 按钮');
      return;
    }

    console.log(`找到 ${autoCheckButtons.length} 个 auto-check 按钮`);

    autoCheckButtons.forEach((button, buttonIndex) => {
      // 向上查找 counter-view div
      const counterView = button.closest('.counter-view');

      if (!counterView) {
        console.log(`按钮[${buttonIndex}]: 未找到 counter-view div`);
        return;
      }

      // 在 counter-view div 中查找所有 class = sids 的元素
      const sidsElements = counterView.querySelectorAll('.sids');

      if (sidsElements.length === 0) {
        console.log(`按钮[${buttonIndex}]: 在 counter-view 中未找到 class=sids 的元素`);
        return;
      }

      console.log(`按钮[${buttonIndex}]: 找到 ${sidsElements.length} 个 sids 元素`);

      // 遍历每个 sids 元素，查找其中的 span
      sidsElements.forEach((sidsElement, sidsIndex) => {
        const spans = sidsElement.querySelectorAll('span');

        if (spans.length === 0) {
          console.log(`  按钮[${buttonIndex}] -> sids[${sidsIndex}]: 未找到 span 元素`);
        } else {
          spans.forEach((span, spanIndex) => {
            const spanValue = span.textContent || span.innerText || '';
            console.log(`  按钮[${buttonIndex}] -> counter-view -> sids[${sidsIndex}] -> span[${spanIndex}]: "${spanValue}"`);
            // INSERT_YOUR_CODE
            // 使用 dataUtil 保存 span[1] trim 的值，避免重复保存
            if (spanIndex === 1) {
              const span1Value = spanValue.trim();
              if (!window._savedSpan1Values) {
                window._savedSpan1Values = new Set();
              }
              if (!window._savedSpan1Values.has(span1Value)) {
                window._savedSpan1Values.add(span1Value);
                // 异步加载 dataUtil 模块并保存
                (async () => {
                  try {
                    const dataUtil = await import(chrome.runtime.getURL('src/data-util.js'));
                    if (dataUtil && typeof dataUtil.saveSid === 'function') {
                      dataUtil.saveSid(span1Value);
                      console.log(`[content.js] 已保存 span[1] 的值: "${span1Value}"`);
                    } else {
                      // 如果模块导出中没有 saveSid，尝试使用 window.dataUtil
                      if (window.dataUtil && typeof window.dataUtil.saveSid === 'function') {
                        window.dataUtil.saveSid(span1Value);
                        console.log(`[content.js] 已保存 span[1] 的值: "${span1Value}"`);
                      } else {
                        console.warn('[content.js] dataUtil.saveSid 方法不可用，无法保存:', span1Value);
                      }
                    }
                  } catch (error) {
                    console.error('[content.js] 加载 dataUtil 模块失败:', error);
                    // 降级方案：尝试使用 window.dataUtil
                    if (window.dataUtil && typeof window.dataUtil.saveSid === 'function') {
                      window.dataUtil.saveSid(span1Value);
                      console.log(`[content.js] 已保存 span[1] 的值（使用 window.dataUtil）: "${span1Value}"`);
                    } else {
                      console.warn('[content.js] dataUtil.saveSid 方法不可用，无法保存:', span1Value);
                    }
                  }
                })();
              } else {
                console.log(`[content.js] span[1] 的值 "${span1Value}" 已保存过，跳过`);
              }
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('查找 sids 值失败:', error);
  }
}


// 页面加载完成后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    // 检查版本更新
    try {
      const utilsModule = await import(chrome.runtime.getURL('src/utils.js'));
      await utilsModule.checkForUpdates();
    } catch (error) {
      console.warn('❌ 加载 utilsModule 或版本检查失败:', error);
      window.hasNewVersion = false;
    }

    // 先加载问题类型规则表
    try {
      await loadIssueRules();
      console.log('问题类型规则表加载成功');
    } catch (error) {
      console.warn('问题类型规则表加载失败，将使用默认行为:', error);
    }

    injectAutoCheckButton();
    // 启动网络监听
    monitorNetworkRequests();

    // 延迟执行，确保 DOM 完全加载
    setTimeout(() => {
      findAndPrintSidsValues();
    }, 1000);

    setTimeout(() => {
      findResponse();
    }, 1500);
  });
} else {
  // 检查版本更新
  (async () => {
    try {
      const utilsModule = await import(chrome.runtime.getURL('src/utils.js'));
      await utilsModule.checkForUpdates();
    } catch (error) {
      console.warn('❌ 加载 utilsModule 或版本检查失败:', error);
      window.hasNewVersion = false;
    }

    // 立即执行时也加载规则表
    try {
      await loadIssueRules();
      console.log('问题类型规则表加载成功');
    } catch (error) {
      console.warn('问题类型规则表加载失败，将使用默认行为:', error);
    }
  })();

  injectAutoCheckButton();
  // 启动网络监听
  monitorNetworkRequests();

  // 延迟执行，确保 DOM 完全加载
  setTimeout(() => {
    findAndPrintSidsValues();
  }, 1000);

  setTimeout(() => {
    findResponse();
  }, 1500);
}

// 监听来自 popup 或 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content Script: 收到消息', message.type, '来自', sender);

  if (message.type === 'ENABLE_AUTO_CHECK_BUTTONS') {
    console.log('📨 Content Script: 收到启用 auto-check 按钮的消息');
    console.log('📨 Content Script: 消息来源:', sender);

    try {
      enableAutoCheckButtons();
      console.log('✅ Content Script: 已启用所有 auto-check 按钮');
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Content Script: 启用按钮时出错:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // 保持消息通道开放
  }

  console.log('⚠️ Content Script: 未处理的消息类型:', message.type);
  return false; // 不处理其他消息类型
});

// 监听所有 close-chart 按钮的点击事件，点击时启用所有 auto-check 按钮
document.addEventListener('click', function (event) {
  // 检查点击的元素是否是 close-chart 按钮或其子元素
  const closeChartButton = event.target.closest('.close-chart');
  if (closeChartButton) {
    console.log('🔘 Content Script: close-chart 按钮被点击');
    console.log('🔘 Content Script: 准备启用所有 auto-check 按钮');

    // 启用所有 auto-check 按钮
    enableAutoCheckButtons();

    console.log('✅ Content Script: 已启用所有 auto-check 按钮（通过 close-chart 点击）');
    window.audioAnalysisIssues = {
      isErrorCode: false,
      isNoSound: false,
      isLowLevel: false,
      isEcho: false,
      isAudioStutter: false,
      isBlack: false
    };

  }
}, true); // 使用捕获阶段，确保在 onclick 内联事件之前执行

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

      // 按钮注入后，延迟查找并打印 sids 值
      setTimeout(() => {
        findAndPrintSidsValues();
      }, 500);
    }
  });
}

// 开始观察页面变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});

