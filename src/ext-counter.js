// ============================================
// External Counter IDs Configuration
// 定义要添加到 /counters 请求的 counterIds 数组中的额外 ID
// ============================================
(function() {
  'use strict';
  
  // 防止重复设置
  if (window.__EXT_COUNTER_IDS__ !== undefined) {
    return;
  }
  
  // 定义要添加的 counterIds 列表
  // 默认添加 5，可以根据需要修改此数组
  window.__EXT_COUNTER_IDS__ = [5, 18, 180, 181, 626];
  
  console.log('✅ ext-counter.js 已加载，额外 counterIds:', window.__EXT_COUNTER_IDS__);
})();

