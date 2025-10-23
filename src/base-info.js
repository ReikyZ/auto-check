/**
 * Base Info 模块
 * 用于解析和显示基本信息，如用户角色等
 * ES6 模块版本 - 使用 export 导出
 */

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
          // 找到第一个非null、非undefined的值
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              console.log('找到 SDK Client Role 值:', value);
              return value;
            }
          }
        }
      }
    }
  }

  console.warn('未找到 SDK Client Role 数据');
  return null;
};

/**
 * 获取角色显示信息
 * @param {number} roleValue - SDK Client Role 值
 * @returns {string} 角色显示信息
 */
export const getRoleDisplayText = (roleValue) => {
  if (roleValue === 1) {
    return '角色为主播';
  } else if (roleValue === 0) {
    return '角色为观众';
  }
  return '角色未知';
};

/**
 * 获取 SDK Mute Status Bit Based 值
 * @param {string} responseText - 响应文本
 * @returns {number|null} mute 状态值
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
          // 找到第一个非null、非undefined的值
          for (let i = 0; i < counter.data.length; i++) {
            const dataItem = counter.data[i];
            const value = Array.isArray(dataItem) ? dataItem[1] : dataItem;
            if (value !== null && value !== undefined) {
              console.log('找到 SDK Mute Status Bit Based 值:', value);
              return value;
            }
          }
        }
      }
    }
  }

  console.warn('未找到 SDK Mute Status Bit based 数据');
  return null;
};

/**
 * 获取 mute 状态显示文本
 * @param {number} muteStatus - mute 状态值
 * @returns {string} mute 状态显示文本
 */
export const getMuteStatusDisplayText = (muteStatus) => {
  if (muteStatus === null || muteStatus === undefined) {
    return '未知';
  }

  if (muteStatus === 0) {
    return '无静音';
  }

  const statusList = [];
  
  // 检查各个位标志
  if (muteStatus & 1) {
    statusList.push('静音本地音频');
  }
  if (muteStatus & 2) {
    statusList.push('静音远端音频');
  }
  if (muteStatus & 4) {
    statusList.push('静音本地视频');
  }
  if (muteStatus & 8) {
    statusList.push('静音远端视频');
  }

  return statusList.length > 0 ? statusList.join(' & ') : '无静音';
};

/**
 * 更新 base-info 区域的内容
 * @param {string} responseText - 响应文本
 */
export const updateBaseInfo = (responseText) => {
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
        updateBaseInfo(responseText);
      }, 500);
      return;
    }
  }

  // 提取角色信息
  const roleValue = getSDKClientRole(responseText);
  
  // 提取 mute 状态信息
  const muteStatus = getSDKMuteStatus(responseText);
  
  // 构建基本信息内容（使用 ES6 模板字符串）
  let baseInfoHTML = '<h4>基本信息</h4>';
  
  if (roleValue !== null) {
    const roleText = getRoleDisplayText(roleValue);
    baseInfoHTML += `<div class="info-item">👤 ${roleText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到角色信息</div>';
  }
  
  if (muteStatus !== null) {
    const muteText = getMuteStatusDisplayText(muteStatus);
    const muteIcon = muteStatus === 0 ? '🔊' : '🔇';
    baseInfoHTML += `<div class="info-item">${muteIcon} ${muteText}</div>`;
  } else {
    baseInfoHTML += '<div class="info-item">⚠️ 未找到 mute 状态信息</div>';
  }

  // 更新内容
  baseInfoElement.innerHTML = baseInfoHTML;
  
  console.log('✅ Base Info 已更新:', { 
    roleValue, 
    roleText: getRoleDisplayText(roleValue),
    muteStatus,
    muteText: getMuteStatusDisplayText(muteStatus)
  });
};

// ES6 默认导出
export default {
  getSDKClientRole,
  getRoleDisplayText,
  getSDKMuteStatus,
  getMuteStatusDisplayText,
  updateBaseInfo
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.getSDKClientRole = getSDKClientRole;
  window.getRoleDisplayText = getRoleDisplayText;
  window.getSDKMuteStatus = getSDKMuteStatus;
  window.getMuteStatusDisplayText = getMuteStatusDisplayText;
  window.updateBaseInfo = updateBaseInfo;
}

console.log('✅ base-info.js ES6 模块已加载');
console.log('📝 ES6 export 可用:', typeof updateBaseInfo);
console.log('📝 window 暴露可用:', typeof window.updateBaseInfo);

