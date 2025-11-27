/**
 * 问题类型规则表系统
 * 用于管理指标与问题类型的关联关系
 */

// 注意：全局暴露将在 ISSUE_RULES 定义后进行

// 问题类型规则管理系统
const ISSUE_RULES = {
  // 问题类型定义
  issueTypes: {
    isErrorCode: {
      name: '错误码',
      description: '只显示错误码信息',
      color: '#dc3545',
      icon: '🚨'
    },
    isNoSound: {
      name: '无声',
      description: '音频信号缺失或静音',
      color: '#ff6b6b',
      icon: '🔇'
    },
    isLowLevel: {
      name: '音量小',
      description: '音频信号强度过低',
      color: '#ffa726',
      icon: '🔉'
    },
    isEcho: {
      name: '回声',
      description: '音频回声或延迟问题',
      color: '#f44336',
      icon: '🔊'
    },
    isAudioStutter: {
      name: '音频卡顿',
      description: '音频播放卡顿或断续',
      color: '#9c27b0',
      icon: '⏸️'
    },
    isBlack: {
      name: '黑屏',
      description: '视频画面显示异常或黑屏',
      color: '#000000',
      icon: '🖤'
    }
  },
  
  // 指标与问题类型的关联规则
  metricIssueRules: {
    'Audio AEC Delay': {
      isErrorCode: 0,
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 1,
      isAudioStutter: 0,
      isBlack: 0
    },
    'Audio Signal Level Nearin': {
      isErrorCode: 0,
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0,
      isAudioStutter: 0,
      isBlack: 0
    },
    'Audio Signal Level Nearout': {
      isErrorCode: 0,
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0,
      isAudioStutter: 0,
      isBlack: 0
    },
    'A RECORD SIGNAL VOLUME': {
      isErrorCode: 0,
      isNoSound: 1,
      isLowLevel: 1,
      isEcho: 0,
      isAudioStutter: 0,
      isBlack: 0
    },
    'Chat Engine Error Code': {
      isErrorCode: 1,
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 0,
      isAudioStutter: 0,
      isBlack: 0
    },
    'Audio Playback Frequency': {
      isErrorCode: 0,
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 0,
      isAudioStutter: 1,
      isBlack: 0
    },
    'AUDIO DOWNLINK PULL 10MS DATA TIME': {
      isErrorCode: 0,
      isNoSound: 0,
      isLowLevel: 0,
      isEcho: 0,
      isAudioStutter: 1,
      isBlack: 0
    }
  }
};

/**
 * 获取指标的问题类型关联
 * @param {string} metricName - 指标名称
 * @returns {Object} 问题类型关联对象
 */
function getMetricIssueTypes(metricName) {
  return ISSUE_RULES.metricIssueRules[metricName] || {
    isErrorCode: 0,
    isNoSound: 0,
    isLowLevel: 0,
    isEcho: 0,
    isAudioStutter: 0,
    isBlack: 0
  };
}

/**
 * 获取问题类型配置
 * @param {string} issueType - 问题类型
 * @returns {Object} 问题类型配置
 */
function getIssueTypeConfig(issueType) {
  return ISSUE_RULES.issueTypes[issueType];
}

/**
 * 检查指标是否与特定问题类型关联
 * @param {string} metricName - 指标名称
 * @param {string} issueType - 问题类型
 * @returns {boolean} 是否关联
 */
function isMetricRelatedToIssue(metricName, issueType) {
  const rules = getMetricIssueTypes(metricName);
  return rules[issueType] === 1;
}

/**
 * 获取与特定问题类型相关的所有指标
 * @param {string} issueType - 问题类型
 * @returns {Array} 相关指标列表
 */
function getMetricsForIssueType(issueType) {
  const relatedMetrics = [];
  Object.keys(ISSUE_RULES.metricIssueRules).forEach(metricName => {
    if (isMetricRelatedToIssue(metricName, issueType)) {
      relatedMetrics.push(metricName);
    }
  });
  return relatedMetrics;
}

/**
 * 根据选中的问题类型列表，获取应该显示的所有指标
 * @param {Object} selectedIssues - 选中的问题类型对象，格式：{ isErrorCode: true, isNoSound: false, ... }
 * @returns {Array} 应该显示的指标名称列表
 */
function getMetricsForSelectedIssues(selectedIssues) {
  const metricsSet = new Set();
  
  // 遍历所有选中的问题类型
  Object.keys(selectedIssues).forEach(issueType => {
    if (selectedIssues[issueType]) {
      // 获取该问题类型相关的所有指标
      const metrics = getMetricsForIssueType(issueType);
      metrics.forEach(metric => metricsSet.add(metric));
    }
  });
  
  return Array.from(metricsSet);
}

/**
 * 检查指标是否应该根据选中的问题类型显示
 * @param {string} metricName - 指标名称
 * @param {Object} selectedIssues - 选中的问题类型对象
 * @returns {boolean} 是否应该显示
 */
function shouldShowMetric(metricName, selectedIssues) {
  // 如果没有选中任何问题类型，不显示
  const hasActiveIssues = Object.values(selectedIssues).some(checked => checked);
  if (!hasActiveIssues) {
    return false;
  }
  
  // 检查指标是否与任何选中的问题类型相关
  return Object.keys(selectedIssues).some(issueType => {
    if (selectedIssues[issueType]) {
      return isMetricRelatedToIssue(metricName, issueType);
    }
    return false;
  });
}

/**
 * 获取所有问题类型
 * @returns {Array} 问题类型列表
 */
function getAllIssueTypes() {
  return Object.keys(ISSUE_RULES.issueTypes);
}

/**
 * 生成问题类型规则表格
 * @returns {string} 规则表格文本
 */
function generateIssueRulesTable() {
  const metrics = Object.keys(ISSUE_RULES.metricIssueRules);
  const issueTypes = getAllIssueTypes();
  
  // 获取问题类型的显示名称
  const issueTypeNames = issueTypes.map(issueType => {
    const config = getIssueTypeConfig(issueType);
    return config ? config.name : issueType;
  });
  
  let table = '问题类型规则表:\n';
  // 表头：指标名称 + 各问题类型名称
  table += '指标名称'.padEnd(30);
  issueTypeNames.forEach(name => {
    table += `| ${name.padEnd(6)}`;
  });
  table += '\n';
  
  // 分隔线
  table += '-'.repeat(30);
  issueTypeNames.forEach(() => {
    table += '|--------';
  });
  table += '\n';
  
  metrics.forEach(metricName => {
    const rules = ISSUE_RULES.metricIssueRules[metricName];
    const shortName = metricName.length > 28 ? metricName.substring(0, 25) + '...' : metricName;
    table += shortName.padEnd(30);
    
    issueTypes.forEach(issueType => {
      const value = rules[issueType] || 0;
      table += `|   ${value}    `;
    });
    table += '\n';
  });
  
  return table;
}

/**
 * 从标题中提取指标名称
 * @param {string} titleText - 标题文本
 * @returns {string|null} 指标名称
 */
function extractMetricNameFromTitle(titleText) {
  if (titleText.includes('AEC Delay')) return 'Audio AEC Delay';
  if (titleText.includes('Signal Level Nearout')) return 'Audio Signal Level Nearout';
  if (titleText.includes('Signal Level')) return 'Audio Signal Level Nearin';
  if (titleText.includes('Record Volume')) return 'A RECORD SIGNAL VOLUME';
  if (titleText.includes('Error Code')) return 'Chat Engine Error Code';
  if (titleText.includes('Audio Playback Frequency')) return 'Audio Playback Frequency';
  if (titleText.includes('AUDIO DOWNLINK PULL 10MS DATA TIME')) return 'AUDIO DOWNLINK PULL 10MS DATA TIME';
  return null;
}

/**
 * 添加新的问题类型
 * @param {string} issueType - 问题类型键
 * @param {Object} config - 问题类型配置
 */
function addIssueType(issueType, config) {
  ISSUE_RULES.issueTypes[issueType] = config;
  console.log(`已添加新问题类型: ${config.name}`);
}

/**
 * 添加新的指标规则
 * @param {string} metricName - 指标名称
 * @param {Object} rules - 问题类型关联规则
 */
function addMetricRule(metricName, rules) {
  ISSUE_RULES.metricIssueRules[metricName] = rules;
  console.log(`已添加指标规则: ${metricName}`);
}

/**
 * 更新指标规则
 * @param {string} metricName - 指标名称
 * @param {string} issueType - 问题类型
 * @param {number} value - 关联值 (0 或 1)
 */
function updateMetricRule(metricName, issueType, value) {
  if (!ISSUE_RULES.metricIssueRules[metricName]) {
    // 初始化时包含所有问题类型
    const allIssueTypes = getAllIssueTypes();
    ISSUE_RULES.metricIssueRules[metricName] = {};
    allIssueTypes.forEach(type => {
      ISSUE_RULES.metricIssueRules[metricName][type] = 0;
    });
  }
  ISSUE_RULES.metricIssueRules[metricName][issueType] = value;
  console.log(`已更新指标规则: ${metricName} - ${issueType} = ${value}`);
}

/**
 * 获取规则统计信息
 * @returns {Object} 统计信息
 */
function getRulesStatistics() {
  const metrics = Object.keys(ISSUE_RULES.metricIssueRules);
  const issueTypes = getAllIssueTypes();
  
  const stats = {
    totalMetrics: metrics.length,
    totalIssueTypes: issueTypes.length,
    totalRules: metrics.length * issueTypes.length,
    activeRules: 0
  };
  
  metrics.forEach(metricName => {
    const rules = ISSUE_RULES.metricIssueRules[metricName];
    issueTypes.forEach(issueType => {
      if (rules[issueType] === 1) {
        stats.activeRules++;
      }
    });
  });
  
  return stats;
}

// 调试函数
const IssueRulesDebug = {
  /**
   * 在控制台显示规则表
   */
  showTable() {
    console.log(generateIssueRulesTable());
    return generateIssueRulesTable();
  },
  
  /**
   * 检查指标与问题类型的关联
   * @param {string} metricName - 指标名称
   * @param {string} issueType - 问题类型
   */
  checkRelation(metricName, issueType) {
    const isRelated = isMetricRelatedToIssue(metricName, issueType);
    const issueConfig = getIssueTypeConfig(issueType);
    console.log(`指标 "${metricName}" 与问题类型 "${issueType}" (${issueConfig?.name}) 的关联: ${isRelated ? '是' : '否'}`);
    return isRelated;
  },
  
  /**
   * 获取所有相关指标
   * @param {string} issueType - 问题类型
   */
  getRelatedMetrics(issueType) {
    const metrics = getMetricsForIssueType(issueType);
    const issueConfig = getIssueTypeConfig(issueType);
    console.log(`问题类型 "${issueType}" (${issueConfig?.name}) 相关的指标:`, metrics);
    return metrics;
  },
  
  /**
   * 显示统计信息
   */
  showStatistics() {
    const stats = getRulesStatistics();
    console.log('规则表统计信息:', stats);
    return stats;
  }
};

// 导出函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ISSUE_RULES,
    getMetricIssueTypes,
    getIssueTypeConfig,
    isMetricRelatedToIssue,
    getMetricsForIssueType,
    getMetricsForSelectedIssues,
    shouldShowMetric,
    getAllIssueTypes,
    generateIssueRulesTable,
    extractMetricNameFromTitle,
    addIssueType,
    addMetricRule,
    updateMetricRule,
    getRulesStatistics,
    IssueRulesDebug
  };
}

// 将函数暴露到全局作用域（浏览器环境）
if (typeof window !== 'undefined') {
  // 将所有函数暴露到全局作用域
  window.ISSUE_RULES = ISSUE_RULES;
  window.getMetricIssueTypes = getMetricIssueTypes;
  window.getIssueTypeConfig = getIssueTypeConfig;
  window.isMetricRelatedToIssue = isMetricRelatedToIssue;
  window.getMetricsForIssueType = getMetricsForIssueType;
  window.getMetricsForSelectedIssues = getMetricsForSelectedIssues;
  window.shouldShowMetric = shouldShowMetric;
  window.getAllIssueTypes = getAllIssueTypes;
  window.generateIssueRulesTable = generateIssueRulesTable;
  window.extractMetricNameFromTitle = extractMetricNameFromTitle;
  window.addIssueType = addIssueType;
  window.addMetricRule = addMetricRule;
  window.updateMetricRule = updateMetricRule;
  window.getRulesStatistics = getRulesStatistics;
  window.IssueRulesDebug = IssueRulesDebug;
}

