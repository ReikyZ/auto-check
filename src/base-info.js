/**
 * Base Info 模块
 * 用于解析和显示基本信息，如用户角色等
 * ES6 模块版本 - 使用 export 导出
 */

/**
 * 获取 Channel Profile 值
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {number|null} channelProfile 值，如果未找到则返回 null
 */
export const getChannelProfile = (eventsData) => {
  if (!eventsData) {
    console.warn('getChannelProfile: eventsData 为空');
    return null;
  }

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
    } catch (e) {
      console.warn('getChannelProfile: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
  } else {
    console.warn('getChannelProfile: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('getChannelProfile: 解析后的数据不是数组');
    return null;
  }

  // 遍历 events 数组，查找 nm 为 "session" 的项
  for (let i = parsed.length - 1; i >= 0; i--) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.nm === 'session' && 'channelProfile' in details) {
        const channelProfile = details.channelProfile;
        console.log('getChannelProfile: 找到 channelProfile 值:', channelProfile);
        return channelProfile;
      }
    }
  }

  console.warn('getChannelProfile: 未找到 channelProfile 数据');
  return null;
};

/**
 * 获取 Channel Profile 显示文本
 * @param {number} channelProfile - channelProfile 值
 * @returns {string} 显示文本
 */
export const getChannelProfileDisplayText = (channelProfile) => {
  if (channelProfile === null || channelProfile === undefined) {
    return '未知';
  }

  if (channelProfile === 0) {
    return '通信模式';
  } else if (channelProfile === 1) {
    return '直播模式';
  } else {
    return `未知(${channelProfile})`;
  }
};

// ES6 导出的函数 - 使用箭头函数和 const
export const getSDKClientRole = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getSDKClientRole: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getSDKClientRole: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "SDK Client Role"
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'SDK Client Role' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 SDK Client Role 数据');
    return null;
  }

  return values;
};

/**
 * 获取角色显示信息
 * @param {Array} roleValues - SDK Client Role 值数组
 * @returns {string} 角色显示信息
 */
export const getRoleDisplayText = (roleValues) => {
  if (!roleValues || !Array.isArray(roleValues) || roleValues.length === 0) {
    return '角色未知';
  }

  const firstValue = roleValues[0];
  let displayText = '初始';

  if (firstValue === 1) {
    displayText = '角色为主播';
  } else if (firstValue === 2) {
    displayText = '角色为观众';
  } else {
    displayText = '角色未知';
  }

  // 检查数组中是否有不同的值
  const hasVariation = roleValues.some(value => value !== firstValue);
  if (hasVariation) {
    displayText += '，有变化';
  }

  return displayText;
};

/**
 * 从 events 数据中提取 vosdk.vocs 事件的 localWanIp
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {Array|null} 去重后的 localWanIp 数组，如果未找到则返回 null
 */
export const getLocalWanIpFromVocs = (eventsData) => {
  if (!eventsData) {
    console.warn('getLocalWanIpFromVocs: eventsData 为空');
    return null;
  }

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
    } catch (e) {
      console.warn('getLocalWanIpFromVocs: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
  } else {
    console.warn('getLocalWanIpFromVocs: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('getLocalWanIpFromVocs: 解析后的数据不是数组');
    return null;
  }

  const ipSet = new Set();

  // 遍历 events 数组，查找 name 为 "vosdk.vocs" 的项
  for (let i = 0; i < parsed.length; i++) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.name === 'vosdk.vocs' && details.localWanIp) {
        const localWanIp = details.localWanIp;
        console.log('getLocalWanIpFromVocs: 找到 localWanIp:', localWanIp);
        ipSet.add(localWanIp);
      }
    }
  }

  if (ipSet.size === 0) {
    console.warn('getLocalWanIpFromVocs: 未找到 vosdk.vocs 事件的 localWanIp 数据');
    return null;
  }

  // 转换为数组并返回
  const ipArray = Array.from(ipSet);
  console.log('getLocalWanIpFromVocs: 找到的去重 IP 地址:', ipArray);
  return ipArray;
};

/**
 * 获取 IP 地址显示文本
 * @param {Array} ipArray - IP 地址数组
 * @returns {string} IP 地址显示文本
 */
export const getIpDisplayText = (ipArray) => {
  if (!ipArray || !Array.isArray(ipArray) || ipArray.length === 0) {
    return null;
  }

  if (ipArray.length === 1) {
    return `IP: ${ipArray[0]}`;
  } else {
    return `IP: ${ipArray.join(', ')}`;
  }
};

/**
 * 获取 IP 地址的地理位置信息
 * 通过 background script 发送请求以避免 CORS 问题
 * @param {string} ipAddress - IP 地址
 * @returns {Promise<Object|null>} 地理位置信息对象，如果失败则返回 null
 */
export const getIpLocationInfo = async (ipAddress) => {
  if (!ipAddress || typeof ipAddress !== 'string') {
    console.warn('getIpLocationInfo: IP 地址无效');
    return null;
  }

  try {
    console.log('🌐 请求 IP 地理位置信息:', ipAddress);

    // 参考 error-code.js 的实现方式，使用 chrome.runtime.sendMessage
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'FETCH_IP_INFO',
          data: { ipAddress: ipAddress }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        }
      );
    });

    console.log('✅ 获取到 IP 地理位置信息:', response);
    return response;
  } catch (error) {
    console.error('getIpLocationInfo: 获取 IP 地理位置信息失败', error);
    return null;
  }
};

/**
 * 创建 IP 信息悬浮提示框
 * @param {Object} locationData - 地理位置数据
 * @returns {HTMLElement} 提示框元素
 */
const createIpInfoTooltip = (locationData) => {
  // 移除已存在的提示框
  const existingTooltip = document.querySelector('.ip-info-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'ip-info-tooltip';

  // 提取需要显示的字段
  const country = locationData.country_name || '未知';
  const region = locationData.region_name || '未知';
  const city = locationData.city_name || '未知';
  const line = locationData.line || '未知';

  // 翻译 line 信息
  const lineDisplay = lineTranslationMap[line] || line;

  // 构建提示框内容
  let tooltipContent = '';

  // 显示国家、地区、城市信息
  const locationText = [country, region, city].filter(item => item && item !== '未知').join(' - ');
  if (locationText) {
    tooltipContent += `
      <div style="padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
        <div style="font-weight: 600; margin-bottom: 4px;">📍 ${locationText}</div>
      </div>
    `;
  }

  // 显示线路信息
  if (line && line !== '未知') {
    // 判断是否为三大运营商
    const isMajor = isMajorISP(line);
    // 如果不是三大运营商，使用红色显示
    const lineColor = isMajor ? 'rgba(255, 255, 255, 0.9)' : '#ff6b6b';
    tooltipContent += `
      <div style="padding: 8px 0;">
        <div style="opacity: 0.9; color: ${lineColor};">🌐 ${lineDisplay}</div>
      </div>
    `;
  }

  // 如果没有数据，显示默认消息
  if (!tooltipContent) {
    tooltipContent = `
      <div style="padding: 8px 0;">
        <div style="opacity: 0.9;">⚠️ 未找到地理位置信息</div>
      </div>
    `;
  }

  tooltip.innerHTML = tooltipContent;

  // 设置样式
  Object.assign(tooltip.style, {
    position: 'fixed',
    zIndex: '99999',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.6',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    maxWidth: '300px',
    minWidth: '200px',
    wordWrap: 'break-word',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    pointerEvents: 'none',
    backdropFilter: 'blur(10px)'
  });

  document.body.appendChild(tooltip);
  return tooltip;
};

/**
 * 显示 IP 信息悬浮提示框
 * @param {MouseEvent} event - 鼠标事件
 * @param {string} ipAddress - IP 地址
 */
export const showIpInfoTooltip = async (event, ipAddress) => {
  if (!ipAddress) {
    console.warn('showIpInfoTooltip: IP 地址为空');
    return;
  }

  // 显示加载状态
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'ip-info-tooltip';
  loadingTooltip.innerHTML = '<div style="padding: 8px;">加载中...</div>';
  Object.assign(loadingTooltip.style, {
    position: 'fixed',
    zIndex: '99999',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    left: `${event.clientX + 10}px`,
    top: `${event.clientY - 30}px`,
    pointerEvents: 'none'
  });
  document.body.appendChild(loadingTooltip);

  try {
    // 获取地理位置信息
    const locationData = await getIpLocationInfo(ipAddress);

    // 移除加载提示框
    loadingTooltip.remove();

    if (!locationData) {
      // 显示错误提示
      const errorTooltip = document.createElement('div');
      errorTooltip.className = 'ip-info-tooltip';
      errorTooltip.innerHTML = '<div style="padding: 8px; color: #ff6b6b;">无法获取地理位置信息</div>';
      Object.assign(errorTooltip.style, {
        position: 'fixed',
        zIndex: '99999',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        left: `${event.clientX + 10}px`,
        top: `${event.clientY - 30}px`,
        pointerEvents: 'none'
      });
      document.body.appendChild(errorTooltip);

      // 3秒后自动移除
      setTimeout(() => {
        errorTooltip.remove();
      }, 3000);
      return;
    }

    // 创建并显示提示框
    const tooltip = createIpInfoTooltip(locationData);

    // 定位提示框
    requestAnimationFrame(() => {
      const rect = tooltip.getBoundingClientRect();
      let x = event.clientX + 10;
      let y = event.clientY - rect.height - 10;

      // 确保不超出视窗
      if (x + rect.width > window.innerWidth) {
        x = Math.max(10, event.clientX - rect.width - 10);
      }
      if (y < 0) {
        y = event.clientY + 10;
      }

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });
  } catch (error) {
    console.error('showIpInfoTooltip: 显示 IP 信息失败', error);
    loadingTooltip.remove();
  }
};

/**
 * 隐藏 IP 信息悬浮提示框
 */
export const hideIpInfoTooltip = () => {
  const tooltip = document.querySelector('.ip-info-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
};

/**
 * 为页面中的 IP 地址元素设置悬浮事件
 */
export const setupIpHoverEvents = () => {
  // 查找所有 IP 地址元素（通过 class 或 data 属性）
  const ipElements = document.querySelectorAll('.ip-address-item, [data-ip-address]');

  ipElements.forEach(element => {
    // 移除旧的事件监听器（通过克隆节点）
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);

    // 获取 IP 地址
    const ipAddress = newElement.getAttribute('data-ip-address') ||
      newElement.textContent.match(/\d+\.\d+\.\d+\.\d+/)?.[0];

    if (!ipAddress) {
      console.warn('setupIpHoverEvents: 未找到 IP 地址');
      return;
    }

    // 添加鼠标悬浮事件
    let hoverTimeout;
    let isHovering = false;

    newElement.addEventListener('mouseenter', (event) => {
      isHovering = true;
      // 延迟 300ms 后显示提示框，避免鼠标快速划过时频繁请求
      hoverTimeout = setTimeout(() => {
        if (isHovering) {
          showIpInfoTooltip(event, ipAddress);
        }
      }, 300);
    });

    newElement.addEventListener('mouseleave', () => {
      isHovering = false;
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      hideIpInfoTooltip();
    });

    // 添加样式，使其看起来可点击
    newElement.style.cursor = 'pointer';
    newElement.style.textDecoration = 'underline';
    newElement.style.color = 'white';
  });

  console.log(`✅ 已为 ${ipElements.length} 个 IP 地址元素设置悬浮事件`);
};

/**
 * 运营商名称中文翻译映射表
 */
const lineTranslationMap = {
  'ChinaMobile': '中国移动',
  'ChinaTelecom': '中国电信',
  'ChinaUnicom': '中国联通',
  'DRPENG': '鹏博士',
  'ChinaNet': '中国电信',
  'China169': '中国联通',
  'CMNET': '中国移动',
  'CERNET': '中国教育和科研计算机网',
  'CSTNET': '中国科技网',
  'UNICOM': '中国联通',
  'CHINATELECOM': '中国电信',
  'CHINAMOBILE': '中国移动'
};

/**
 * 判断是否为三大运营商
 */
const isMajorISP = (line) => {
  return line === 'ChinaMobile' || line === 'ChinaTelecom' || line === 'ChinaUnicom';
};

/**
 * 更新 IP 显示，添加非三大运营商的 line 信息
 */
const updateIpDisplayWithLine = async () => {
  const ipElements = document.querySelectorAll('.ip-address-item[data-ip-address]');

  for (const ipElement of ipElements) {
    const ipAddress = ipElement.getAttribute('data-ip-address');
    if (!ipAddress) continue;

    // 检查是否已经添加了 line 信息
    if (ipElement.nextSibling && ipElement.nextSibling.classList && ipElement.nextSibling.classList.contains('ip-line-info')) {
      continue; // 已经添加过了，跳过
    }

    try {
      // 获取 IP 地理位置信息
      const locationData = await getIpLocationInfo(ipAddress);
      if (locationData && locationData.line) {
        const line = locationData.line;

        // 如果不是三大运营商，在 IP 后面添加红色的 line 信息
        if (!isMajorISP(line)) {
          const lineDisplay = lineTranslationMap[line] || line;
          const lineSpan = document.createElement('span');
          lineSpan.className = 'ip-line-info';
          lineSpan.textContent = ` (${lineDisplay})`;
          lineSpan.style.color = '#ff6b6b';
          lineSpan.style.marginLeft = '4px';

          // 在 IP 元素后面插入 line 信息
          ipElement.parentNode.insertBefore(lineSpan, ipElement.nextSibling);
        }
      }
    } catch (error) {
      console.warn(`获取 IP ${ipAddress} 的 line 信息失败:`, error);
    }
  }
};

/**
 * 获取 SDK Mute Status Bit Based 值
 * @param {string} responseText - 响应文本
 * @returns {Array|null} mute 状态值数组
 */
export const getSDKMuteStatus = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getSDKMuteStatus: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getSDKMuteStatus: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "SDK Mute Status Bit based" (注意首字母小写)
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'SDK Mute Status Bit based' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 SDK Mute Status Bit based 数据');
    return null;
  }

  return values;
};

/**
 * 获取 mute 状态显示文本
 * @param {Array} muteStatusValues - mute 状态值数组
 * @returns {string} mute 状态显示文本
 */
export const getMuteStatusDisplayText = (muteStatusValues) => {
  if (!muteStatusValues || !Array.isArray(muteStatusValues) || muteStatusValues.length === 0) {
    return '未知';
  }

  const firstValue = muteStatusValues[0];

  if (firstValue === 0) {
    const hasVariation = muteStatusValues.some(value => value !== firstValue);
    return hasVariation ? '无静音，有变化' : '无静音';
  }

  const statusList = [];

  // 检查各个位标志
  if (firstValue & 1) {
    statusList.push('静音本地音频');
  }
  if (firstValue & 2) {
    statusList.push('静音远端音频');
  }
  if (firstValue & 4) {
    statusList.push('静音本地视频');
  }
  if (firstValue & 8) {
    statusList.push('静音远端视频');
  }

  let displayText = statusList.length > 0 ? statusList.join(' & ') : '无静音';

  // 检查数组中是否有不同的值
  const hasVariation = muteStatusValues.some(value => value !== firstValue);
  if (hasVariation) {
    displayText += '，有变化';
  }

  return displayText;
};

/**
 * 获取 A AUDIO PROFILE 值
 * @param {string} responseText - 响应文本
 * @returns {Array|null} audio profile 值数组
 */
export const getAudioProfile = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getAudioProfile: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getAudioProfile: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "A AUDIO PROFILE"
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'A AUDIO PROFILE' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值（第二列）
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 A AUDIO PROFILE 数据');
    return null;
  }

  return values;
};

/**
 * AUDIO_PROFILE 枚举映射
 */
const AUDIO_PROFILE_MAP = {
  '-1': 'DEFAULT',
  0: 'DEFAULT',
  1: 'SPEECH_STANDARD',
  2: 'MUSIC_STANDARD',
  3: 'MUSIC_STANDARD_STEREO',
  4: 'MUSIC_HIGH_QUALITY',
  5: 'MUSIC_HIGH_QUALITY_STEREO',
  6: 'IOT',
  7: 'NUM'
};

/**
 * AUDIO_SCENARIO 枚举映射
 */
const AUDIO_SCENARIO_MAP = {
  0: 'DEFAULT',
  1: 'CHATROOM',
  2: 'EDUCATION',
  3: 'GAME_STREAMING',
  5: 'CHATROOM',
  7: 'CHORUS',
  8: 'MEETING',
  9: 'AI_SERVER',
  10: 'AI_CLIENT',
  11: 'NUM'
};

/**
 * 获取 audio profile 显示文本
 * @param {Array} audioProfileValues - audio profile 值数组
 * @returns {string} audio profile 显示文本
 */
export const getAudioProfileDisplayText = (audioProfileValues) => {
  if (!audioProfileValues || !Array.isArray(audioProfileValues) || audioProfileValues.length === 0) {
    return '未知';
  }

  const firstValue = audioProfileValues[0];

  // 解析值：value = AUDIO_PROFILE * 16 + AUDIO_SCENARIO
  const audioProfile = Math.floor(firstValue / 16);
  const audioScenario = firstValue % 16;

  const profileName = AUDIO_PROFILE_MAP[audioProfile] || `未知(${audioProfile})`;
  const scenarioName = AUDIO_SCENARIO_MAP[audioScenario] || `未知(${audioScenario})`;

  let displayText = `音频 profile 为${profileName}，场景为 ${scenarioName}`;

  // 检查数组中是否有不同的值
  const hasVariation = audioProfileValues.some(value => value !== firstValue);
  if (hasVariation) {
    displayText += '，有变化';
  }

  return displayText;
};

/**
 * AUDIO_ROUTE 枚举映射
 */
const AUDIO_ROUTE_MAP = {
  '-1': 'DEFAULT',
  0: 'Headset',
  1: 'Earpiece',
  2: 'Headset No Mic',
  3: 'Speakerphone',
  4: 'Loudspeaker',
  5: 'Bluetooth HFP',
  6: 'USB Device',
  7: 'HDMI',
  8: 'USB Headset',
  10: 'Bluetooth A2DP'
};

/**
 * 获取 Audio Output Route 值
 * @param {string} responseText - 响应文本
 * @returns {Array|null} audio route 值数组
 */
export const getAudioOutputRoute = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getAudioOutputRoute: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getAudioOutputRoute: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "Audio Output Route Enum"
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'Audio Output Route Enum' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 Audio Output Route Enum 数据');
    return null;
  }

  return values;
};

/**
 * 获取 Audio Output Route 显示文本
 * @param {Array} audioRouteValues - audio route 值数组
 * @returns {string} audio route 显示文本
 */
export const getAudioOutputRouteDisplayText = (audioRouteValues) => {
  if (!audioRouteValues || !Array.isArray(audioRouteValues) || audioRouteValues.length === 0) {
    return '未知';
  }

  // 去重
  const uniqueValues = [...new Set(audioRouteValues)];
  const routeNames = uniqueValues.map(value => {
    const name = AUDIO_ROUTE_MAP[value];
    return name !== undefined ? name : `未知(${value})`;
  });

  let displayText = routeNames.join(' → ');

  // 检查是否有多个不同的值（表示有变化）
  if (uniqueValues.length > 1) {
    displayText += ' (有变化)';
  }

  return displayText;
};

/**
 * 获取 Video Profile 信息
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {Object|null} VideoProfile 信息对象，如果未找到则返回 null
 */
export const getVideoProfile = (eventsData) => {
  if (!eventsData) {
    console.warn('getVideoProfile: eventsData 为空');
    return null;
  }

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
    } catch (e) {
      console.warn('getVideoProfile: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
  } else {
    console.warn('getVideoProfile: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('getVideoProfile: 解析后的数据不是数组');
    return null;
  }

  // 遍历 events 数组，查找 name 为 "vosdk.VideoProfile" 和 "vosdk.videoProfileLow" 的项
  // 从后往前查找，获取最新的数据
  let videoProfile = null;
  let videoProfileLow = null;

  for (let i = parsed.length - 1; i >= 0; i--) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.name === 'vosdk.VideoProfile' && !videoProfile) {
        videoProfile = {
          width: details.width,
          height: details.height,
          frameRate: details.frameRate,
          bitrate: details.bitrate
        };
        console.log('getVideoProfile: 找到 VideoProfile 数据:', videoProfile);
      } else if (details.name === 'vosdk.videoProfileLow' && !videoProfileLow) {
        videoProfileLow = {
          width: details.width,
          height: details.height,
          frameRate: details.frameRate,
          bitrate: details.bitrate
        };
        console.log('getVideoProfile: 找到 videoProfileLow 数据:', videoProfileLow);
      }
    }
  }

  if (!videoProfile && !videoProfileLow) {
    console.warn('getVideoProfile: 未找到 VideoProfile 数据');
    return null;
  }

  return {
    videoProfile,
    videoProfileLow
  };
};

/**
 * 获取 Video Profile 显示文本
 * @param {Object} videoProfileData - VideoProfile 信息对象，包含 videoProfile 和 videoProfileLow
 * @returns {string} 显示文本
 */
export const getVideoProfileDisplayText = (videoProfileData) => {
  if (!videoProfileData) {
    return '未知';
  }

  let text = '';

  // 显示主视频 profile
  if (videoProfileData.videoProfile) {
    const p = videoProfileData.videoProfile;
    const width = p.width !== undefined ? p.width : '未知';
    const height = p.height !== undefined ? p.height : '未知';
    const frameRate = p.frameRate !== undefined ? p.frameRate : '未知';
    const bitrate = p.bitrate !== undefined ? p.bitrate : '未知';
    text += `视频 profile 为${width}*${height} fps ${frameRate} bitrate ${bitrate}`;
  }

  // 显示低码率视频 profile
  if (videoProfileData.videoProfileLow) {
    if (text) {
      text += ' | ';
    }
    const p = videoProfileData.videoProfileLow;
    const width = p.width !== undefined ? p.width : '未知';
    const height = p.height !== undefined ? p.height : '未知';
    const frameRate = p.frameRate !== undefined ? p.frameRate : '未知';
    const bitrate = p.bitrate !== undefined ? p.bitrate : '未知';
    text += `低码率 profile 为${width}*${height} fps ${frameRate} bitrate ${bitrate}`;
  }

  return text || '未知';
};

/**
 * 获取摄像头信息
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {Array|null} 摄像头信息数组，如果未找到则返回 null
 */
export const getCameraInfo = (eventsData) => {
  if (!eventsData) {
    console.warn('getCameraInfo: eventsData 为空');
    return null;
  }

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
    } catch (e) {
      console.warn('getCameraInfo: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
  } else {
    console.warn('getCameraInfo: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('getCameraInfo: 解析后的数据不是数组');
    return null;
  }

  // 遍历 events 数组，查找 name 为 "vosdk.cameraInfo" 的项
  // 从后往前查找，获取最新的数据
  for (let i = parsed.length - 1; i >= 0; i--) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.name === 'vosdk.cameraInfo' && Array.isArray(details.items)) {
        console.log('getCameraInfo: 找到 cameraInfo 数据:', details.items);
        return details.items;
      }
    }
  }

  console.warn('getCameraInfo: 未找到 cameraInfo 数据');
  return null;
};

/**
 * 格式化摄像头信息显示文本
 * @param {Array} cameraItems - 摄像头信息数组
 * @returns {string} 格式化的 HTML 文本
 */
export const formatCameraInfo = (cameraItems) => {
  if (!cameraItems || !Array.isArray(cameraItems) || cameraItems.length === 0) {
    return '未找到摄像头信息';
  }

  let text = '';
  cameraItems.forEach((item, index) => {
    if (index > 0) {
      text += '<br>';
    }
    const isUsing = item.bUse === 1;
    const status = isUsing ? '<span style="color: #4caf50; font-weight: bold;">【使用中】</span>' : '';
    text += `${item.friendName || '未知摄像头'}${status}`;
  });

  return text;
};

/**
 * 获取音频设备状态变化信息
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {Array|null} 设备状态变化信息数组，如果未找到则返回 null
 */
export const getDeviceStatChange = (eventsData) => {
  if (!eventsData) {
    console.warn('getDeviceStatChange: eventsData 为空');
    return null;
  }

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
    } catch (e) {
      console.warn('getDeviceStatChange: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
  } else {
    console.warn('getDeviceStatChange: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('getDeviceStatChange: 解析后的数据不是数组');
    return null;
  }

  // 遍历 events 数组，查找所有 name 为 "vosdk.DeviceStatChange" 的项
  const deviceStatChanges = [];
  for (let i = parsed.length - 1; i >= 0; i--) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.name === 'vosdk.DeviceStatChange') {
        deviceStatChanges.push({
          deviceName: details.deviceName,
          ts: details.ts,
          sentTs: details.sentTs,
          receivedTs: details.receivedTs
        });
      }
    }
  }

  if (deviceStatChanges.length === 0) {
    console.warn('getDeviceStatChange: 未找到 DeviceStatChange 数据');
    return null;
  }

  console.log('getDeviceStatChange: 找到 DeviceStatChange 数据:', deviceStatChanges);
  // 按时间倒序排列（最新的在前）
  return deviceStatChanges.reverse();
};

/**
 * 格式化音频设备状态变化显示文本
 * @param {Array} deviceStatChanges - 设备状态变化信息数组
 * @returns {string} 格式化的 HTML 文本
 */
export const formatDeviceStatChange = (deviceStatChanges) => {
  if (!deviceStatChanges || !Array.isArray(deviceStatChanges) || deviceStatChanges.length === 0) {
    return '未找到音频设备状态变化信息';
  }

  let text = '';
  deviceStatChanges.forEach((item, index) => {
    if (index > 0) {
      text += '<br><br>';
    }
    const deviceName = item.deviceName || '未知设备';
    const timestamp = item.ts || item.receivedTs || item.sentTs || '未知时间';
    // 将时间戳转换为可读格式（毫秒转日期时间）
    let timeStr = '未知时间';
    if (timestamp && typeof timestamp === 'number') {
      const date = new Date(timestamp);
      timeStr = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
    text += `<strong>${deviceName}</strong><br><span style="color: #999; font-size: 11px;">时间: ${timeStr}</span>`;
  });

  return text;
};

/**
 * 检查用户权限
 * @param {string|Array} eventsData - events 数据（JSON 字符串或已解析的数组）
 * @returns {string|null} 权限状态文本，如果未找到则返回 null
 */
export const checkPrivileges = (eventsData) => {
  if (!eventsData) {
    console.warn('checkPrivileges: eventsData 为空');
    return null;
  }

  console.log('checkPrivileges: 接收到的 eventsData 类型:', typeof eventsData);
  console.log('checkPrivileges: eventsData 是否为数组:', Array.isArray(eventsData));

  let parsed;

  // 如果 eventsData 是字符串，尝试解析
  if (typeof eventsData === 'string') {
    try {
      parsed = JSON.parse(eventsData);
      console.log('checkPrivileges: 成功解析 JSON，数组长度:', Array.isArray(parsed) ? parsed.length : '不是数组');
    } catch (e) {
      console.warn('checkPrivileges: eventsData 不是有效的 JSON', e);
      return null;
    }
  } else if (Array.isArray(eventsData)) {
    parsed = eventsData;
    console.log('checkPrivileges: eventsData 是数组，长度:', parsed.length);
  } else {
    console.warn('checkPrivileges: eventsData 格式不正确，类型:', typeof eventsData);
    return null;
  }

  if (!Array.isArray(parsed)) {
    console.warn('checkPrivileges: 解析后的数据不是数组');
    return null;
  }

  // 遍历 events 数组，查找 name 为 "vos.userPrivileges" 的项
  let foundCount = 0;
  for (let i = parsed.length - 1; i >= 0; i--) {
    const event = parsed[i];
    if (event && event.details) {
      const details = event.details;
      if (details.name === 'vos.userPrivileges') {
        foundCount++;
        console.log('checkPrivileges: 找到 vos.userPrivileges 事件:', details);

        const hasAudioExpireTs = 'clientAudioExpireTs' in details;
        const hasVideoExpireTs = 'clientVideoExpireTs' in details;

        if (hasAudioExpireTs || hasVideoExpireTs) {
          const clientAudioExpireTs = hasAudioExpireTs ? details.clientAudioExpireTs : null;
          const clientVideoExpireTs = hasVideoExpireTs ? details.clientVideoExpireTs : null;

          console.log('checkPrivileges: clientAudioExpireTs 值:', clientAudioExpireTs);
          console.log('checkPrivileges: clientVideoExpireTs 值:', clientVideoExpireTs);

          // 检查音频和视频权限
          const audioExpired = hasAudioExpireTs && clientAudioExpireTs === 0;
          const videoExpired = hasVideoExpireTs && clientVideoExpireTs === 0;

          // 根据权限状态返回相应的文本
          if (audioExpired && videoExpired) {
            return 'token 无发音频和视频权限';
          } else if (audioExpired) {
            return 'token 无发音频权限';
          } else if (videoExpired) {
            return 'token 无发视频权限';
          } else {
            return '发流权限正常';
          }
        } else {
          console.warn('checkPrivileges: 找到 vos.userPrivileges 但缺少 clientAudioExpireTs 和 clientVideoExpireTs 字段');
        }
      }
    }
  }

  console.warn(`checkPrivileges: 未找到 vos.userPrivileges 数据，共检查了 ${parsed.length} 个事件，找到 ${foundCount} 个匹配项`);
  return null;
};

/**
 * formatApmStatus 函数 - 解析 APM 状态值
 * @param {number} e - APM 状态值
 * @returns {string} HTML 格式的状态文本
 */
const formatApmStatus = (e) => {
  let t = "";
  const i = e >> 10 & 1;
  const s = e >> 9 & 1;
  const n = e >> 8 & 1;
  const r = e >> 7 & 1;
  const o = e >> 6 & 1;
  const a = e >> 5 & 1;
  const c = e >> 4 & 1;
  const l = e >> 3 & 1;
  const u = e >> 2 & 1;
  const d = e >> 1 & 1;
  const h = 1 & e;
  t += "Bypass: ";
  t += i ? "On" : "Off";
  t += "<br>";
  t += "Hpf: ";
  t += s ? "On" : "Off";
  t += "<br>";
  t += "Bss: ";
  t += n ? "On" : "Off";
  t += "<br>";
  t += "Tr: ";
  t += r ? "On" : "Off";
  t += "<br>";
  t += "Ed: ";
  t += o ? "On" : "Off";
  t += "<br>";
  t += "Md: ";
  t += a ? "On" : "Off";
  t += "<br>";
  t += "Ps: ";
  t += c ? "On" : "Off";
  t += "<br>";
  t += "Hw3A: ";
  t += l ? "On" : "Off";
  t += "<br>";
  t += "Ns: ";
  t += u ? "On" : "Off";
  t += "<br>";
  t += "Aec: ";
  t += d ? "On" : "Off";
  t += "<br>";
  t += "Agc: ";
  t += h ? "On" : "Off";
  return t;
};

/**
 * 获取 A NEARIN APM STATUS 数据
 * @param {string} responseText - 响应文本（counters 数据）
 * @returns {Array|null} APM STATUS 值数组（过滤掉 null 值），如果未找到则返回 null
 */
export const getApmStatus = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getApmStatus: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getApmStatus: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "A NEARIN APM STATUS"
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'A NEARIN APM STATUS' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值（第二列）
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 A NEARIN APM STATUS 数据');
    return null;
  }

  return values;
};

/**
 * 获取 Aec Configuration 数据
 * @param {string} responseText - 响应文本（counters 数据）
 * @returns {Array|null} Aec Configuration 值数组（过滤掉 null 值），如果未找到则返回 null
 */
export const getAecConfiguration = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    console.warn('getAecConfiguration: responseText 不是有效的字符串');
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getAecConfiguration: responseText 不是有效的 JSON');
    return null;
  }

  const values = [];

  // 遍历数据结构查找 "Aec Configuration"
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (
          counter &&
          typeof counter.name === 'string' &&
          counter.name.trim() === 'Aec Configuration' &&
          Array.isArray(counter.data)
        ) {
          // 收集所有非null、非undefined的值（第二列）
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              values.push(value);
            }
          }
        }
      }
    }
  }

  if (values.length === 0) {
    console.warn('未找到 Aec Configuration 数据');
    return null;
  }

  return values;
};

/**
 * 格式化 AEC Configuration 值（简化版本，使用全局 formatAEC 函数）
 * @param {number} value - AEC Configuration 值
 * @returns {string} 格式化的 HTML 字符串
 */
const formatAEC = (value) => {
  if (value === null || value === undefined) {
    return "暂无指标数据";
  }
  let text = "";
  const enabled = value >> 31 & 0x1;
  if (enabled === 0) {
    return "enabled: off";
  }
  const valueMap = {
    "enabled": ["off", "on"][enabled],
    "Search method": ["kCorrelation", "kMatchFilter", "kFilterCoeff"][(value >> 28) & 0x7],
    "filter type": ["MDF", "SAF"][(value >> 26) & 0x3],
    "filter length ms": (value >> 14) & 0xfff,
    "nlp working mode": ["kTrad", "kDeep", "kFuse"][(value >> 11) & 0x7],
    "nlp aggressiveness": (value >> 8) & 0x7,
    "nlp size": Math.pow(2, ((value >> 4) & 0xf)),
    "hop size": Math.pow(2, (value & 0xf)),
  };

  Object.keys(valueMap).map((key) => {
    text += `${key}: ${valueMap[key]}<br>`;
  });
  return text;
};

/**
 * 创建并显示悬浮小窗
 * @param {MouseEvent} event - 鼠标事件
 * @param {string} content - 要显示的内容（HTML格式）
 */
const showTooltip = (event, content) => {
  console.log('🔧 showTooltip 被调用，内容:', content);

  // 移除已存在的悬浮窗
  const existingTooltip = document.querySelector('.apm-status-tooltip');
  if (existingTooltip) {
    console.log('🧹 移除现有悬浮窗');
    existingTooltip.remove();
  }

  // 创建悬浮窗
  const tooltip = document.createElement('div');
  tooltip.className = 'apm-status-tooltip';
  tooltip.innerHTML = `<div style="white-space: pre-line;">${content}</div>`; // 确保换行显示

  // 强制设置样式，确保可见
  Object.assign(tooltip.style, {
    position: 'fixed',
    zIndex: '99999',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    lineHeight: '1.6',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    maxWidth: '350px',
    wordWrap: 'break-word',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    display: 'block',
    visibility: 'visible', // 直接显示
    pointerEvents: 'none',
    whiteSpace: 'pre-line' // 确保换行
  });

  document.body.appendChild(tooltip);

  console.log('✅ 悬浮窗已创建并添加到 DOM');
  console.log('📝 悬浮窗元素:', tooltip);
  console.log('📝 悬浮窗内容:', tooltip.innerHTML);
  console.log('📝 悬浮窗父元素:', tooltip.parentElement);

  // 等待一个 tick 确保样式应用
  requestAnimationFrame(() => {
    const rect = tooltip.getBoundingClientRect();
    console.log('📐 悬浮窗尺寸:', rect);
    console.log('📐 悬浮窗是否可见:', rect.width > 0 && rect.height > 0);

    // 定位到鼠标右下角
    let x = event.clientX + 10;
    let y = event.clientY + 10;

    // 确保不超出视窗
    if (x + rect.width > window.innerWidth) {
      x = Math.max(10, event.clientX - rect.width - 10);
    }
    if (y + rect.height > window.innerHeight) {
      y = Math.max(10, event.clientY - rect.height - 10);
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;

    console.log('📍 最终悬浮窗位置:', { x, y, left: tooltip.style.left, top: tooltip.style.top });
    console.log('📍 最终悬浮窗边界:', tooltip.getBoundingClientRect());

    // 检查是否有其他元素遮挡
    const elementAtPoint = document.elementFromPoint(x + 10, y + 10);
    console.log('🔍 悬浮窗位置处的元素:', elementAtPoint);
  });
};

/**
 * 隐藏悬浮小窗
 */
const hideTooltip = () => {
  const tooltip = document.querySelector('.apm-status-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
};

/**
 * 更新 base-info 区域的内容
 * @param {string} responseText - 响应文本（counters 数据）
 * @param {string|Array} eventsData - events 数据（可选）
 */
export const updateBaseInfo = (responseText, eventsData = null) => {
  // 尝试查找 .base-info 元素
  let baseInfoElement = document.querySelector('.base-info');

  // 如果元素不存在，尝试创建它
  if (!baseInfoElement) {
    console.log('📝 .base-info 元素不存在，尝试创建...');

    // 查找图表容器
    const chartContainer = document.querySelector('.combined-audio-analysis-container');

    if (chartContainer) {
      // 查找 chart-content 容器
      const chartContent = chartContainer.querySelector('.chart-content');

      if (chartContent) {
        // 创建 base-info 元素
        baseInfoElement = document.createElement('div');
        baseInfoElement.className = 'base-info';
        chartContent.insertBefore(baseInfoElement, chartContent.firstChild);
        console.log('✅ 已创建 .base-info 元素');
      } else {
        console.warn('⚠️ 未找到 .chart-content 容器');
        return;
      }
    } else {
      console.warn('⚠️ 未找到 .combined-audio-analysis-container 容器，base-info 将在图表创建后更新');
      // 延迟一段时间后重试
      setTimeout(() => {
        updateBaseInfo(responseText, eventsData);
      }, 500);
      return;
    }
  }

  // 提取 channelProfile 信息（从 events 数据中获取）
  const channelProfile = eventsData ? getChannelProfile(eventsData) : null;

  // 提取角色信息（返回数组）
  const roleValues = getSDKClientRole(responseText);

  // 提取 mute 状态信息（返回数组）
  const muteStatusValues = getSDKMuteStatus(responseText);

  // 提取 audio profile 信息（返回数组）
  const audioProfileValues = getAudioProfile(responseText);

  // 提取 audio output route 信息（返回数组）
  const audioOutputRouteValues = getAudioOutputRoute(responseText);

  // 检查用户权限（从 events 数据中获取）
  const privilegesText = eventsData ? checkPrivileges(eventsData) : null;

  // 提取 localWanIp 信息（从 events 数据中获取）
  const localWanIpArray = eventsData ? getLocalWanIpFromVocs(eventsData) : null;

  // 构建基本信息内容（使用 ES6 模板字符串）
  let baseInfoHTML = '<h4 style="display: inline-block; margin-right: 10px;">基本信息</h4><span class="status-tag">3A状态</span><span class="aec-status-tag status-tag" style="margin-left: 10px;">AEC状态</span><span class="camera-status-tag status-tag" style="margin-left: 10px;">摄像头状态</span><span class="audio-device-status-tag status-tag" style="margin-left: 10px;">音频状态</span>';

  // 将 channelProfile 和 roleValues 信息合并到同一行显示
  const channelProfileText = channelProfile !== null ? getChannelProfileDisplayText(channelProfile) : null;
  const roleText = roleValues !== null ? getRoleDisplayText(roleValues) : null;
  const ipText = localWanIpArray !== null ? getIpDisplayText(localWanIpArray) : null;

  if (channelProfileText !== null || roleText !== null || ipText !== null) {
    let combinedText = '';
    if (channelProfileText !== null) {
      combinedText += `📡 ${channelProfileText}`;
    } else {
      combinedText += '⚠️ 未找到 channelProfile 信息';
    }
    if (roleText !== null) {
      if (combinedText) combinedText += ' | ';
      combinedText += `👤 ${roleText}`;
    } else {
      if (combinedText) combinedText += ' | ';
      combinedText += '⚠️ 未找到角色信息';
    }
    if (ipText !== null) {
      if (combinedText) combinedText += ' | ';
      // 为每个 IP 地址创建可悬浮的元素
      if (localWanIpArray && localWanIpArray.length > 0) {
        const ipElements = localWanIpArray.map(ip =>
          `<span class="ip-address-item" data-ip-address="${ip}" style="cursor: pointer; text-decoration: underline; color: white; margin: 0 2px;">${ip}</span>`
        ).join(', ');
        combinedText += `🌐 IP: ${ipElements}`;
      } else {
        combinedText += `🌐 ${ipText}`;
      }
    }
    baseInfoHTML += `<div class="info-item">${combinedText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到 channelProfile 和角色信息</div>';
  }

  if (muteStatusValues !== null) {
    const muteText = getMuteStatusDisplayText(muteStatusValues);
    const muteIcon = muteStatusValues[0] === 0 ? '🔊' : '🔇';
    baseInfoHTML += `<div class="info-item">${muteIcon} ${muteText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到 mute 状态信息</div>';
  }

  if (audioOutputRouteValues !== null) {
    const audioRouteText = getAudioOutputRouteDisplayText(audioOutputRouteValues);
    baseInfoHTML += `<div class="info-item">🔊 音频路由: ${audioRouteText}</div>`;
  }

  if (audioProfileValues !== null) {
    const audioProfileText = getAudioProfileDisplayText(audioProfileValues);
    baseInfoHTML += `<div class="info-item">🎵 ${audioProfileText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到 audio profile 信息</div>';
  }

  // 提取视频 profile 信息（从 events 数据中获取）
  // 如果 eventsData 为空，尝试从其他地方获取
  let finalEventsData = eventsData;
  if (!finalEventsData) {
    // 尝试从 window 中获取 eventsData（如果之前保存过）
    if (window.currentEventsData) {
      finalEventsData = window.currentEventsData;
      console.log('🔍 updateBaseInfo: 从 window.currentEventsData 获取 eventsData');
    } else {
      // 尝试从 dataUtil 获取（异步，这里先不处理，因为 updateBaseInfo 是同步函数）
      console.warn('⚠️ updateBaseInfo: eventsData 为空，无法获取视频 profile');
    }
  }

  const videoProfile = finalEventsData ? getVideoProfile(finalEventsData) : null;
  console.log('🔍 updateBaseInfo: videoProfile =', videoProfile);
  console.log('🔍 updateBaseInfo: eventsData 是否存在 =', !!finalEventsData);
  if (videoProfile !== null && videoProfile !== undefined) {
    const videoProfileText = getVideoProfileDisplayText(videoProfile);
    console.log('✅ updateBaseInfo: 添加视频 profile 显示:', videoProfileText);
    baseInfoHTML += `<div class="info-item">📹 ${videoProfileText}</div>`;
  } else {
    console.warn('⚠️ updateBaseInfo: videoProfile 为空，不显示视频 profile');
  }

  if (privilegesText !== null) {
    if (privilegesText !== '发流权限正常') {
      // 黑色高亮并加粗
      const privilegesIcon = '🚫';
      baseInfoHTML += `<div class="info-item"><span style="color:#000000;font-weight:bold;">${privilegesIcon} ${privilegesText}</span></div>`;
    }
  } else {
    // baseInfoHTML += '<div class="info-item">⚠️ 未找到权限信息</div>';
  }

  // 更新内容
  baseInfoElement.innerHTML = baseInfoHTML;

  // 为 3A状态 标签添加鼠标悬浮事件
  const statusTag = baseInfoElement.querySelector('.status-tag');
  if (statusTag) {
    console.log('✅ 找到 status-tag 元素，准备添加事件监听器');

    // 移除旧的事件监听器（如果存在）
    const newStatusTag = statusTag.cloneNode(true);
    statusTag.parentNode.replaceChild(newStatusTag, statusTag);

    // 1秒后检查 Hw3A 和 Aec 状态
    setTimeout(() => {
      console.log('⏱️ 1秒后检查 3A 状态');

      // 从 responseText 的 A NEARIN APM STATUS 中解析状态
      let statusStr = '';
      if (responseText) {
        const apmStatusValues = getApmStatus(responseText);
        if (apmStatusValues && apmStatusValues.length > 0) {
          statusStr = formatApmStatus(apmStatusValues[0]);
        }
      }
      // 解析状态文本，检查 Hw3A 和 Aec 状态
      const hw3aStatusOff = statusStr.includes('Hw3A: Off');
      const aecStatusOff = statusStr.includes('Aec: Off');

      console.log('🔍 Hw3A 状态:', hw3aStatusOff ? 'Off' : 'On');
      console.log('🔍 Aec 状态:', aecStatusOff ? 'Off' : 'On');

      if (hw3aStatusOff && aecStatusOff) {
        console.log('⚠️ Hw3A 和 Aec 都是 Off，修改标签背景色');
        newStatusTag.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        newStatusTag.style.transition = 'background-color 0.3s ease';
      } else {
        console.log('✅ Hw3A 或 Aec 至少有一个是 On，保持原有背景色');
        newStatusTag.style.backgroundColor = 'rgba(128, 128, 128, 0.5)';
      }
    }, 1000);

    // 保存 responseText 到 data 属性，确保事件处理器可以访问
    newStatusTag.setAttribute('data-response-text', responseText || '');

    // 添加鼠标悬浮事件
    newStatusTag.addEventListener('mouseenter', function (event) {
      console.log('🖱️ 鼠标悬浮到 3A状态 标签');

      // 从 data 属性或闭包中获取 responseText
      const responseTextData = this.getAttribute('data-response-text') || responseText;
      console.log('📝 responseText 类型:', typeof responseTextData);
      console.log('📝 responseText 长度:', responseTextData ? responseTextData.length : 0);

      if (!responseTextData) {
        console.warn('⚠️ responseText 为空');
        showTooltip(event, '未找到数据');
        return;
      }

      const apmStatusValues = getApmStatus(responseTextData);
      console.log('📊 APM Status 值:', apmStatusValues);

      if (apmStatusValues && apmStatusValues.length > 0) {
        // 使用第一个值解析状态
        const firstValue = apmStatusValues[0];
        console.log('📊 第一个值:', firstValue);

        let status = formatApmStatus(firstValue);
        console.log('📝 解析后的状态:', status);

        // 检查值是否唯一
        const isUnique = apmStatusValues.every(value => value === firstValue);
        if (!isUnique) {
          status += '【有变化】';
        }

        console.log('✅ 准备显示悬浮窗');
        showTooltip(event, status);


      } else {
        console.warn('⚠️ 未找到 APM Status 数据或数据为空');
        showTooltip(event, '未找到 A NEARIN APM STATUS 数据');
      }
    });

    newStatusTag.addEventListener('mouseleave', function () {
      console.log('🖱️ 鼠标离开 3A状态 标签');
      hideTooltip();

      // 鼠标离开时根据 Hw3A 和 Aec 状态恢复背景色
      const responseTextData = this.getAttribute('data-response-text') || responseText;
      let statusStr = '';
      if (responseTextData) {
        const apmStatusValues = getApmStatus(responseTextData);
        if (apmStatusValues && apmStatusValues.length > 0) {
          statusStr = formatApmStatus(apmStatusValues[0]);
        }
      }
      const hw3aStatusOff = statusStr.includes('Hw3A: Off');
      const aecStatusOff = statusStr.includes('Aec: Off');

      if (hw3aStatusOff && aecStatusOff) {
        console.log('🔄 恢复标签背景色（Hw3A 和 Aec 都是 Off）');
        this.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      } else {
        console.log('🔄 恢复标签背景色（正常状态）');
        this.style.backgroundColor = 'rgba(128, 128, 128, 0.5)';
      }
    });

    newStatusTag.addEventListener('mousemove', (event) => {
      // 更新悬浮窗位置
      const tooltip = document.querySelector('.apm-status-tooltip');
      if (tooltip) {
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // 确保不超出视窗
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = `${event.clientX - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = `${event.clientY - rect.height - 10}px`;
        }
      }
    });
  } else {
    console.warn('⚠️ 未找到 .status-tag 元素');
  }

  // 为 AEC状态 标签添加鼠标悬浮事件
  const aecStatusTag = baseInfoElement.querySelector('.aec-status-tag');
  if (aecStatusTag) {
    console.log('✅ 找到 aec-status-tag 元素，准备添加事件监听器');

    // 移除旧的事件监听器（如果存在）
    const newAecStatusTag = aecStatusTag.cloneNode(true);
    aecStatusTag.parentNode.replaceChild(newAecStatusTag, aecStatusTag);

    // 1秒后检查 Aec Configuration 状态
    setTimeout(() => {
      console.log('⏱️ 1秒后检查 Aec Configuration 状态');

      // 检查 Aec Configuration，如果是 Off 则修改标签背景色
      let aecConfigOff = false;
      if (responseText) {
        const aecConfigValues = getAecConfiguration(responseText);
        console.log('📊 Aec Configuration 值:', aecConfigValues);
        if (aecConfigValues && aecConfigValues.length > 0) {
          // 检查 enabled 位（最高位），如果为 0 则视为 Off
          const enabled = aecConfigValues[0] >> 31 & 0x1;
          if (enabled === 0) {
            aecConfigOff = true;
          }
        }
      }
      if (aecConfigOff) {
        console.log('⚠️ Aec Configuration 是 Off，修改标签背景色');
        newAecStatusTag.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        newAecStatusTag.style.transition = 'background-color 0.3s ease';
      } else {
        console.log('✅ Aec Configuration 是 On，保持原有背景色');
        newAecStatusTag.style.backgroundColor = 'rgba(128, 128, 128, 0.5)';
      }
    }, 1000);

    // 保存 responseText 到 data 属性，确保事件处理器可以访问
    newAecStatusTag.setAttribute('data-response-text', responseText || '');

    // 添加鼠标悬浮事件
    newAecStatusTag.addEventListener('mouseenter', function (event) {
      console.log('🖱️ 鼠标悬浮到 AEC状态 标签');

      // 从 data 属性或闭包中获取 responseText
      const responseTextData = this.getAttribute('data-response-text') || responseText;
      console.log('📝 responseText 类型:', typeof responseTextData);
      console.log('📝 responseText 长度:', responseTextData ? responseTextData.length : 0);

      if (!responseTextData) {
        console.warn('⚠️ responseText 为空');
        showTooltip(event, '未找到数据');
        return;
      }

      const aecConfigValues = getAecConfiguration(responseTextData);
      console.log('📊 AEC Configuration 值:', aecConfigValues);

      if (aecConfigValues && aecConfigValues.length > 0) {
        // 使用第一个值解析状态
        const firstValue = aecConfigValues[0];
        console.log('📊 第一个值:', firstValue);

        let status = formatAEC(firstValue);
        console.log('📝 解析后的状态:', status);

        // 检查值是否唯一
        const isUnique = aecConfigValues.every(value => value === firstValue);
        if (!isUnique) {
          status += '<br>【有变化】';
        }

        console.log('✅ 准备显示悬浮窗');
        showTooltip(event, status);
      } else {
        console.warn('⚠️ 未找到 AEC Configuration 数据或数据为空');
        showTooltip(event, '未找到 Aec Configuration 数据');
      }
    });

    newAecStatusTag.addEventListener('mouseleave', function () {
      console.log('🖱️ 鼠标离开 AEC状态 标签');
      hideTooltip();

      // 鼠标离开时根据 Aec Configuration 状态恢复背景色
      const responseTextData = this.getAttribute('data-response-text') || responseText;
      let statusStr = '';
      if (responseTextData) {
        const aecConfigValues = getAecConfiguration(responseTextData);
        if (aecConfigValues && aecConfigValues.length > 0) {
          statusStr = formatAEC(aecConfigValues[0]);
        }
      }
      const aecConfigOff = statusStr.includes('enabled: off');
      if (aecConfigOff) {
        console.log('🔄 恢复标签背景色（Aec Configuration 是 Off）');
        this.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      } else {
        console.log('🔄 恢复标签背景色（正常状态）');
        this.style.backgroundColor = 'rgba(128, 128, 128, 0.5)';
      }
    });

    newAecStatusTag.addEventListener('mousemove', (event) => {
      // 更新悬浮窗位置
      const tooltip = document.querySelector('.apm-status-tooltip');
      if (tooltip) {
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // 确保不超出视窗
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = `${event.clientX - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = `${event.clientY - rect.height - 10}px`;
        }
      }
    });
  } else {
    console.warn('⚠️ 未找到 .aec-status-tag 元素');
  }

  // 为 IP 地址元素设置悬浮事件
  if (localWanIpArray && localWanIpArray.length > 0) {
    // 延迟执行，确保 DOM 已更新
    setTimeout(() => {
      setupIpHoverEvents();
      // 更新 IP 显示，添加非三大运营商的 line 信息
      updateIpDisplayWithLine();
    }, 100);
  }

  // 为摄像头状态标签添加鼠标悬浮事件
  const cameraStatusTag = baseInfoElement.querySelector('.camera-status-tag');
  if (cameraStatusTag) {
    console.log('✅ 找到 camera-status-tag 元素，准备添加事件监听器');

    // 移除旧的事件监听器（如果存在）
    const newCameraStatusTag = cameraStatusTag.cloneNode(true);
    cameraStatusTag.parentNode.replaceChild(newCameraStatusTag, cameraStatusTag);

    // 保存 eventsData 到 data 属性，确保事件处理器可以访问
    newCameraStatusTag.setAttribute('data-events-data', eventsData ? (typeof eventsData === 'string' ? eventsData : JSON.stringify(eventsData)) : '');

    // 添加鼠标悬浮事件
    newCameraStatusTag.addEventListener('mouseenter', function (event) {
      console.log('🖱️ 鼠标悬浮到摄像头状态标签');

      // 从 data 属性或闭包中获取 eventsData
      let eventsDataStr = this.getAttribute('data-events-data') || (eventsData ? (typeof eventsData === 'string' ? eventsData : JSON.stringify(eventsData)) : '');
      console.log('📝 eventsData 类型:', typeof eventsDataStr);
      console.log('📝 eventsData 长度:', eventsDataStr ? eventsDataStr.length : 0);

      if (!eventsDataStr) {
        console.warn('⚠️ eventsData 为空');
        showTooltip(event, '未找到摄像头数据');
        return;
      }

      let parsedEventsData;
      try {
        parsedEventsData = typeof eventsDataStr === 'string' ? JSON.parse(eventsDataStr) : eventsDataStr;
      } catch (e) {
        console.warn('⚠️ 解析 eventsData 失败:', e);
        showTooltip(event, '解析摄像头数据失败');
        return;
      }

      const cameraItems = getCameraInfo(parsedEventsData);
      console.log('📊 摄像头信息:', cameraItems);

      if (cameraItems && cameraItems.length > 0) {
        const cameraInfoText = formatCameraInfo(cameraItems);
        console.log('✅ 准备显示摄像头信息悬浮窗');
        showTooltip(event, cameraInfoText);
      } else {
        console.warn('⚠️ 未找到摄像头信息或数据为空');
        showTooltip(event, '未找到摄像头信息');
      }
    });

    newCameraStatusTag.addEventListener('mouseleave', function () {
      console.log('🖱️ 鼠标离开摄像头状态标签');
      hideTooltip();
    });

    newCameraStatusTag.addEventListener('mousemove', (event) => {
      // 更新悬浮窗位置
      const tooltip = document.querySelector('.apm-status-tooltip');
      if (tooltip) {
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // 确保不超出视窗
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = `${event.clientX - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = `${event.clientY - rect.height - 10}px`;
        }
      }
    });
  } else {
    console.warn('⚠️ 未找到 .camera-status-tag 元素');
  }

  // 为音频设备状态标签添加鼠标悬浮事件
  const audioDeviceStatusTag = baseInfoElement.querySelector('.audio-device-status-tag');
  if (audioDeviceStatusTag) {
    console.log('✅ 找到 audio-device-status-tag 元素，准备添加事件监听器');

    // 移除旧的事件监听器（如果存在）
    const newAudioDeviceStatusTag = audioDeviceStatusTag.cloneNode(true);
    audioDeviceStatusTag.parentNode.replaceChild(newAudioDeviceStatusTag, audioDeviceStatusTag);

    // 保存 eventsData 到 data 属性，确保事件处理器可以访问
    newAudioDeviceStatusTag.setAttribute('data-events-data', eventsData ? (typeof eventsData === 'string' ? eventsData : JSON.stringify(eventsData)) : '');

    // 添加鼠标悬浮事件
    newAudioDeviceStatusTag.addEventListener('mouseenter', function (event) {
      console.log('🖱️ 鼠标悬浮到音频设备状态标签');

      // 从 data 属性或闭包中获取 eventsData
      let eventsDataStr = this.getAttribute('data-events-data') || (eventsData ? (typeof eventsData === 'string' ? eventsData : JSON.stringify(eventsData)) : '');
      console.log('📝 eventsData 类型:', typeof eventsDataStr);
      console.log('📝 eventsData 长度:', eventsDataStr ? eventsDataStr.length : 0);

      if (!eventsDataStr) {
        console.warn('⚠️ eventsData 为空');
        showTooltip(event, '未找到音频设备数据');
        return;
      }

      let parsedEventsData;
      try {
        parsedEventsData = typeof eventsDataStr === 'string' ? JSON.parse(eventsDataStr) : eventsDataStr;
      } catch (e) {
        console.warn('⚠️ 解析 eventsData 失败:', e);
        showTooltip(event, '解析音频设备数据失败');
        return;
      }

      const deviceStatChanges = getDeviceStatChange(parsedEventsData);
      console.log('📊 音频设备状态变化信息:', deviceStatChanges);

      if (deviceStatChanges && deviceStatChanges.length > 0) {
        const deviceStatChangeText = formatDeviceStatChange(deviceStatChanges);
        console.log('✅ 准备显示音频设备状态变化悬浮窗');
        showTooltip(event, deviceStatChangeText);
      } else {
        console.warn('⚠️ 未找到音频设备状态变化信息或数据为空');
        showTooltip(event, '未找到音频设备状态变化信息');
      }
    });

    newAudioDeviceStatusTag.addEventListener('mouseleave', function () {
      console.log('🖱️ 鼠标离开音频设备状态标签');
      hideTooltip();
    });

    newAudioDeviceStatusTag.addEventListener('mousemove', (event) => {
      // 更新悬浮窗位置
      const tooltip = document.querySelector('.apm-status-tooltip');
      if (tooltip) {
        const x = event.clientX + 10;
        const y = event.clientY + 10;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;

        // 确保不超出视窗
        const rect = tooltip.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          tooltip.style.left = `${event.clientX - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
          tooltip.style.top = `${event.clientY - rect.height - 10}px`;
        }
      }
    });
  } else {
    console.warn('⚠️ 未找到 .audio-device-status-tag 元素');
  }

  console.log('✅ Base Info 已更新:', {
    channelProfile,
    channelProfileText: getChannelProfileDisplayText(channelProfile),
    roleValues,
    roleText: getRoleDisplayText(roleValues),
    muteStatusValues,
    muteText: getMuteStatusDisplayText(muteStatusValues),
    audioProfileValues,
    audioProfileText: getAudioProfileDisplayText(audioProfileValues),
    videoProfile,
    videoProfileText: videoProfile ? getVideoProfileDisplayText(videoProfile) : null,
    privilegesText,
    localWanIpArray
  });
};

// ES6 默认导出
export default {
  getChannelProfile,
  getChannelProfileDisplayText,
  getSDKClientRole,
  getRoleDisplayText,
  getSDKMuteStatus,
  getMuteStatusDisplayText,
  getAudioProfile,
  getAudioProfileDisplayText,
  getVideoProfile,
  getVideoProfileDisplayText,
  getCameraInfo,
  formatCameraInfo,
  getDeviceStatChange,
  formatDeviceStatChange,
  checkPrivileges,
  getApmStatus,
  getLocalWanIpFromVocs,
  getIpDisplayText,
  getIpLocationInfo,
  showIpInfoTooltip,
  hideIpInfoTooltip,
  setupIpHoverEvents,
  updateBaseInfo
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.getChannelProfile = getChannelProfile;
  window.getChannelProfileDisplayText = getChannelProfileDisplayText;
  window.getSDKClientRole = getSDKClientRole;
  window.getRoleDisplayText = getRoleDisplayText;
  window.getSDKMuteStatus = getSDKMuteStatus;
  window.getMuteStatusDisplayText = getMuteStatusDisplayText;
  window.getAudioProfile = getAudioProfile;
  window.getAudioProfileDisplayText = getAudioProfileDisplayText;
  window.getAudioOutputRoute = getAudioOutputRoute;
  window.getAudioOutputRouteDisplayText = getAudioOutputRouteDisplayText;
  window.getVideoProfile = getVideoProfile;
  window.getVideoProfileDisplayText = getVideoProfileDisplayText;
  window.getCameraInfo = getCameraInfo;
  window.formatCameraInfo = formatCameraInfo;
  window.getDeviceStatChange = getDeviceStatChange;
  window.formatDeviceStatChange = formatDeviceStatChange;
  window.checkPrivileges = checkPrivileges;
  window.getApmStatus = getApmStatus;
  window.getLocalWanIpFromVocs = getLocalWanIpFromVocs;
  window.getIpDisplayText = getIpDisplayText;
  window.getIpLocationInfo = getIpLocationInfo;
  window.showIpInfoTooltip = showIpInfoTooltip;
  window.hideIpInfoTooltip = hideIpInfoTooltip;
  window.setupIpHoverEvents = setupIpHoverEvents;
  window.updateBaseInfo = updateBaseInfo;
}

console.log('✅ base-info.js ES6 模块已加载');
console.log('📝 ES6 export 可用:', typeof updateBaseInfo);
console.log('📝 window 暴露可用:', typeof window.updateBaseInfo);

