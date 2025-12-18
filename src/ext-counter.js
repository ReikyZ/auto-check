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
  
  // default counterIds
  // [8,12,13,19,20,25,62,63,64,75,76,77,83,84,91,92,93,94,134,
  // 147,148,154,155,160,161,166,167,170,251,5,18,180,181,626]
  // 定义要添加的 counterIds 列表
  // 可以根据需要修改此数组
  window.__EXT_COUNTER_IDS__ = [5, 18,25,134,147,148,154,155,160,161,166,167,170,180,181,251, 626,627,634,936];
  
  console.log('✅ ext-counter.js 已加载，额外 counterIds:', window.__EXT_COUNTER_IDS__);
})();

