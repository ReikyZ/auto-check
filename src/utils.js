/**
 * 工具函数模块
 * 提供常用的实用功能
 * ES6 模块版本
 */

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型：'success', 'error', 'info', 'warning'，默认为 'info'
 */
export const showNotification = (message, type = 'info') => {
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
};

/**
 * 显示成功通知
 * @param {string} message - 消息内容
 */
export const showSuccess = (message) => {
  showNotification(message, 'success');
};

/**
 * 显示错误通知
 * @param {string} message - 消息内容
 */
export const showError = (message) => {
  showNotification(message, 'error');
};

/**
 * 显示信息通知
 * @param {string} message - 消息内容
 */
export const showInfo = (message) => {
  showNotification(message, 'info');
};

/**
 * 显示警告通知
 * @param {string} message - 消息内容
 */
export const showWarning = (message) => {
  showNotification(message, 'warning');
};

/**
 * 格式化日期
 * @param {Date|number} date - 日期对象或时间戳
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('zh-CN');
};

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数
 * @returns {Promise} Promise 对象
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 计算平均延迟
 * @param {Array} data - 数据点数组
 * @returns {number} 平均延迟值
 */
export const calculateAverageDelay = (data) => {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  
  const sum = validData.reduce((acc, point) => acc + point.value, 0);
  return Math.round(sum / validData.length);
};

/**
 * 计算最大延迟
 * @param {Array} data - 数据点数组
 * @returns {number} 最大延迟值
 */
export const calculateMaxDelay = (data) => {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length === 0) return 0;
  
  return Math.max(...validData.map(point => point.value));
};

/**
 * 计算变化次数
 * @param {Array} data - 数据点数组
 * @returns {number} 变化次数
 */
export const calculateChangeCount = (data) => {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return 0;
  
  let count = 0;
  for (let i = 1; i < validData.length; i++) {
    if (validData[i].value !== validData[i-1].value) {
      count++;
    }
  }
  return count;
};

/**
 * 计算变化频率
 * @param {Array} data - 数据点数组
 * @returns {string} 变化频率字符串
 */
export const calculateChangeFrequency = (data) => {
  const validData = data.filter(point => point.value !== null && point.value !== undefined);
  if (validData.length <= 1) return '0';
  
  const changeCount = calculateChangeCount(data);
  const timestamps = validData.map(point => point.timestamp);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const durationSec = (maxTs - minTs) > 0 ? (maxTs - minTs) / 1000 : 0;
  
  return durationSec > 0 ? (changeCount / durationSec).toFixed(3) + '/s' : '0';
};

/**
 * 从响应中提取指定指标的数据
 * @param {string} responseText - 响应文本（JSON格式）
 * @param {string} metricName - 指标名称
 * @returns {Object|null} 指标数据对象，包含 name, counterId, data 属性
 */
export const extractMetricData = (responseText, metricName) => {
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn(`extractMetricData: responseText 不是有效的 JSON (${metricName})`);
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
            counterId: counter.counter_id || counter.id || 0,
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
};

// ES6 默认导出
export default {
  showNotification,
  showSuccess,
  showError,
  showInfo,
  showWarning,
  formatDate,
  delay,
  copyToClipboard,
  debounce,
  throttle,
  calculateAverageDelay,
  calculateMaxDelay,
  calculateChangeCount,
  calculateChangeFrequency,
  extractMetricData
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
  window.showSuccess = showSuccess;
  window.showError = showError;
  window.showInfo = showInfo;
  window.showWarning = showWarning;
  window.calculateAverageDelay = calculateAverageDelay;
  window.calculateMaxDelay = calculateMaxDelay;
  window.calculateChangeCount = calculateChangeCount;
  window.calculateChangeFrequency = calculateChangeFrequency;
  window.extractMetricData = extractMetricData;
}

console.log('✅ utils.js ES6 模块已加载');

