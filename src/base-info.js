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
    if (elementAtPoint && elementAtPoint !== tooltip) {
      console.warn('⚠️ 悬浮窗可能被其他元素遮挡:', elementAtPoint.className, elementAtPoint.tagName);
    }
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
  
  // 检查用户权限（从 events 数据中获取）
  const privilegesText = eventsData ? checkPrivileges(eventsData) : null;
  
  // 构建基本信息内容（使用 ES6 模板字符串）
  let baseInfoHTML = '<h4 style="display: inline-block; margin-right: 10px;">基本信息</h4><span class="status-tag">3A状态</span>';
  
  // 将 channelProfile 和 roleValues 信息合并到同一行显示
  const channelProfileText = channelProfile !== null ? getChannelProfileDisplayText(channelProfile) : null;
  const roleText = roleValues !== null ? getRoleDisplayText(roleValues) : null;
  
  if (channelProfileText !== null || roleText !== null) {
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
  
  if (audioProfileValues !== null) {
    const audioProfileText = getAudioProfileDisplayText(audioProfileValues);
    baseInfoHTML += `<div class="info-item">🎵 ${audioProfileText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到 audio profile 信息</div>';
  }
  
  if (privilegesText !== null) {
    if (privilegesText !== '发流权限正常'){
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
    
    // 保存 responseText 到 data 属性，确保事件处理器可以访问
    newStatusTag.setAttribute('data-response-text', responseText || '');
    
    // 添加鼠标悬浮事件
    newStatusTag.addEventListener('mouseenter', function(event) {
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
    
    newStatusTag.addEventListener('mouseleave', () => {
      console.log('🖱️ 鼠标离开 3A状态 标签');
      hideTooltip();
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
  
  console.log('✅ Base Info 已更新:', { 
    channelProfile,
    channelProfileText: getChannelProfileDisplayText(channelProfile),
    roleValues, 
    roleText: getRoleDisplayText(roleValues),
    muteStatusValues,
    muteText: getMuteStatusDisplayText(muteStatusValues),
    audioProfileValues,
    audioProfileText: getAudioProfileDisplayText(audioProfileValues),
    privilegesText
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
  checkPrivileges,
  getApmStatus,
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
  window.checkPrivileges = checkPrivileges;
  window.getApmStatus = getApmStatus;
  window.updateBaseInfo = updateBaseInfo;
}

console.log('✅ base-info.js ES6 模块已加载');
console.log('📝 ES6 export 可用:', typeof updateBaseInfo);
console.log('📝 window 暴露可用:', typeof window.updateBaseInfo);

