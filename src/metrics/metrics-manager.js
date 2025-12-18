/**
 * 指标管理器模块
 * 负责协调各个指标模块，提供统一的指标分析接口
 */

// 注意：模块加载由外部的 content.js 负责管理
// 这里只需要等待模块加载完成即可

// 指标管理器类
class MetricsManager {
  constructor() {
    this.metrics = {};
    this.initialized = false;
    this.init();
  }

  // 初始化管理器
  async init() {
    try {
      // 等待所有模块加载完成（由外部的 content.js 负责加载）
      await this.waitForModules();
      this.registerMetrics();
      this.initialized = true;
      console.log('指标管理器初始化完成');
    } catch (error) {
      console.error('指标管理器初始化失败:', error);
    }
  }

  // 等待模块加载
  waitForModules() {
    return new Promise((resolve, reject) => {
      const checkModules = () => {
        if (window.AecDelayMetrics &&
            window.SignalLevelMetrics &&
            window.RecordVolumeMetrics &&
            window.PlayoutVolumeMetrics &&
            window.ErrorCodeMetrics &&
            window.MetricsUtils) {
          resolve();
        } else {
          setTimeout(checkModules, 100);
        }
      };
      checkModules();
    });
  }

  // 注册所有指标
  registerMetrics() {
    this.metrics = {
      'aecDelay': window.AecDelayMetrics,
      'signalLevel': window.SignalLevelMetrics,
      'recordVolume': window.RecordVolumeMetrics,
      'playoutVolume': window.PlayoutVolumeMetrics,
      'errorCode': window.ErrorCodeMetrics,
      'utils': window.MetricsUtils
    };
  }

  // 获取指标数据
  async getMetricData(metricName, responseText) {
    if (!this.initialized) {
      await this.init();
    }

    switch (metricName) {
      case 'Audio AEC Delay':
        return window.AecDelayMetrics.getAecDelayData(responseText);
      case 'Audio Signal Level Nearin':
        return window.SignalLevelMetrics.getAudioSignalLevelNearinData(responseText);
      case 'Audio Signal Level Nearout':
        return window.SignalLevelMetrics.getAudioSignalLevelNearoutData(responseText);
      case 'A RECORD SIGNAL VOLUME':
        return window.RecordVolumeMetrics.getARecordSignalVolumeData(responseText);
      case 'A PLAYOUT SIGNAL VOLUME':
        return window.PlayoutVolumeMetrics.getAPlayoutSignalVolumeData(responseText);
      case 'Chat Engine Error Code':
        return window.ErrorCodeMetrics.getChatEngineErrorData(responseText);
      default:
        return window.MetricsUtils.getMetricData(responseText, metricName);
    }
  }

  // 生成模拟数据
  generateMockData(metricName) {
    if (!this.initialized) {
      return null;
    }

    return window.MetricsUtils.generateMockMetricData(metricName);
  }

  // 获取指标配置
  getMetricConfig(metricName) {
    return window.MetricsUtils.getMetricConfig(metricName);
  }

  // 获取所有指标配置
  getAllMetricsConfig() {
    return window.MetricsUtils.getAllMetricsConfig();
  }

  // 显示指标分析
  async showMetricAnalysis(metricName, responseText) {
    if (!this.initialized) {
      await this.init();
    }

    switch (metricName) {
      case 'Audio AEC Delay':
        return window.AecDelayMetrics.showAecDelayAnalysis(responseText);
      default:
        console.log(`暂不支持指标: ${metricName}`);
    }
  }

  // 创建图表
  async createChart(metricName, data) {
    if (!this.initialized) {
      await this.init();
    }

    switch (metricName) {
      case 'Audio AEC Delay':
        return window.AecDelayMetrics.createAecDelayChart(data);
      case 'Audio Signal Level Nearin':
        return window.SignalLevelMetrics.createSignalLevelChart(data);
      case 'Audio Signal Level Nearout':
        return window.SignalLevelMetrics.createSignalLevelNearoutChart(data);
      case 'A RECORD SIGNAL VOLUME':
        return window.RecordVolumeMetrics.createRecordVolumeChart(data);
      case 'A PLAYOUT SIGNAL VOLUME':
        return window.PlayoutVolumeMetrics.createPlayoutVolumeChart(data);
      default:
        console.log(`暂不支持图表类型: ${metricName}`);
    }
  }

  // 创建组合图表
  async createCombinedChart(aecDelayData, signalLevelData, recordVolumeData) {
    if (!this.initialized) {
      await this.init();
    }

    return window.RecordVolumeMetrics.createCombinedChart(aecDelayData, signalLevelData, recordVolumeData);
  }

  // 导出数据
  exportData(data, filename) {
    return window.MetricsUtils.exportToCSV(data, filename);
  }

  // 获取统计信息
  getStats(data, metricName) {
    if (!data || !data.data || !Array.isArray(data.data)) {
      return {};
    }

    return {
      dataPoints: data.data.length,
      average: window.MetricsUtils.calculateAverageDelay(data.data),
      max: window.MetricsUtils.calculateMaxDelay(data.data),
      changeCount: window.MetricsUtils.calculateChangeCount(data.data),
      changeFrequency: window.MetricsUtils.calculateChangeFrequency(data.data)
    };
  }
}

// 创建全局指标管理器实例
window.metricsManager = new MetricsManager();

// 兼容性接口 - 保持原有函数名不变
window.getAecDelayData = (responseText) => window.metricsManager.getMetricData('Audio AEC Delay', responseText);
window.getAudioSignalLevelNearinData = (responseText) => window.metricsManager.getMetricData('Audio Signal Level Nearin', responseText);
window.getAudioSignalLevelNearoutData = (responseText) => window.metricsManager.getMetricData('Audio Signal Level Nearout', responseText);
window.getARecordSignalVolumeData = (responseText) => window.metricsManager.getMetricData('A RECORD SIGNAL VOLUME', responseText);
window.getAPlayoutSignalVolumeData = (responseText) => window.metricsManager.getMetricData('A PLAYOUT SIGNAL VOLUME', responseText);
window.getChatEngineErrorData = (responseText) => window.metricsManager.getMetricData('Chat Engine Error Code', responseText);

window.generateMockAecDelayData = () => window.metricsManager.generateMockData('Audio AEC Delay');
window.generateMockAudioSignalLevelNearinData = () => window.metricsManager.generateMockData('Audio Signal Level Nearin');
window.generateMockAudioSignalLevelNearoutData = () => window.metricsManager.generateMockData('Audio Signal Level Nearout');
window.generateMockARecordSignalVolumeData = () => window.metricsManager.generateMockData('A RECORD SIGNAL VOLUME');
window.generateMockAPlayoutSignalVolumeData = () => window.metricsManager.generateMockData('A PLAYOUT SIGNAL VOLUME');

window.showAecDelayAnalysis = (response) => window.metricsManager.showMetricAnalysis('Audio AEC Delay', response);
window.showAecDelayChart = (data) => window.metricsManager.createChart('Audio AEC Delay', data);

window.createAecDelayChart = (data) => window.metricsManager.createChart('Audio AEC Delay', data);
window.createSignalLevelChart = (data) => window.metricsManager.createChart('Audio Signal Level Nearin', data);
window.createSignalLevelNearoutChart = (data) => window.metricsManager.createChart('Audio Signal Level Nearout', data);
window.createRecordVolumeChart = (data) => window.metricsManager.createChart('A RECORD SIGNAL VOLUME', data);
window.createPlayoutVolumeChart = (data) => window.metricsManager.createChart('A PLAYOUT SIGNAL VOLUME', data);
window.createCombinedChart = (aecDelayData, signalLevelData, recordVolumeData) => window.metricsManager.createCombinedChart(aecDelayData, signalLevelData, recordVolumeData);

window.findAecDelayData = (countersData) => window.AecDelayMetrics.findAecDelayData(countersData);
window.generateAecDelayDataFromParsed = (parsed) => window.AecDelayMetrics.generateAecDelayDataFromParsed(parsed);

console.log('指标管理器已加载完成');
