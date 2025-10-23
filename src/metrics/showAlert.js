/**
 * Show Alert 模块
 * 用于显示 Alert 通知小窗
 * 
 * 使用示例：
 * 
 * // 基本用法 - 显示信息提示
 * showAlert('这是一条消息');
 * 
 * // 显示成功消息
 * showAlert('操作成功！', 'success');
 * showSuccess('数据已保存');
 * 
 * // 显示错误消息
 * showAlert('发生错误', 'error');
 * showError('网络连接失败');
 * 
 * // 显示警告消息
 * showAlert('请注意', 'warning');
 * showWarning('数据可能不完整');
 * 
 * // 自定义显示时长（5000ms = 5秒）
 * showAlert('这条消息会显示5秒', 'info', 5000);
 */

/**
 * 显示 Alert 通知
 * @param {string} message - 要显示的消息内容
 * @param {string} type - 通知类型，可选值: 'success', 'error', 'info', 'warning'，默认为 'info'
 * @param {number} duration - 显示时长（毫秒），默认为 3000ms
 */
function showAlert(message, type = 'info', duration = 3000) {
  // 参数验证
  if (!message || typeof message !== 'string') {
    console.warn('showAlert: message 参数无效');
    return;
  }

  // 确保在浏览器环境中运行
  if (typeof document === 'undefined') {
    console.warn('showAlert: document 对象不可用');
    return;
  }

  // 验证 type 参数
  const validTypes = ['success', 'error', 'info', 'warning'];
  if (!validTypes.includes(type)) {
    console.warn(`showAlert: 无效的 type 参数 ${type}，使用默认值 'info'`);
    type = 'info';
  }

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
  
  // 指定时长后移除
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

/**
 * 显示成功消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showSuccess(message, duration = 3000) {
  showAlert(message, 'success', duration);
}

/**
 * 显示错误消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showError(message, duration = 3000) {
  showAlert(message, 'error', duration);
}

/**
 * 显示信息消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showInfo(message, duration = 3000) {
  showAlert(message, 'info', duration);
}

/**
 * 显示警告消息
 * @param {string} message - 消息内容
 * @param {number} duration - 显示时长（毫秒）
 */
function showWarning(message, duration = 3000) {
  showAlert(message, 'warning', duration);
}

// 将函数暴露到全局作用域（浏览器环境）
if (typeof window !== 'undefined') {
  window.showAlert = showAlert;
  window.showSuccess = showSuccess;
  window.showError = showError;
  window.showInfo = showInfo;
  window.showWarning = showWarning;
  console.log('showAlert.js 模块已加载，函数已暴露到 window');
} else {
  console.error('window 对象不可用！');
}

// 同时尝试使用 globalThis
if (typeof globalThis !== 'undefined') {
  globalThis.showAlert = showAlert;
  globalThis.showSuccess = showSuccess;
  globalThis.showError = showError;
  globalThis.showInfo = showInfo;
  globalThis.showWarning = showWarning;
  console.log('showAlert.js 通过 globalThis 暴露函数');
}

// 导出函数（ES6 模块）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
}

