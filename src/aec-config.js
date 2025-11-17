/**
 * AEC Configuration 解析模块
 * 用于从 aec_configuration 整数中解析出各个配置参数的值
 * ES6 模块版本
 */

// 位偏移量和位数定义
const kNlpHopSizeOffset = 0;
const kNlpHopSizeBits = 4;
const kNlpSizeOffset = kNlpHopSizeOffset + kNlpHopSizeBits; // 4
const kNlpSizeBits = 4;
const kNlpAggressivenessOffset = kNlpSizeOffset + kNlpSizeBits; // 8
const kNlpAggressivenessBits = 3;
const kNlpWorkingModeOffset = kNlpAggressivenessOffset + kNlpAggressivenessBits; // 11
const kNlpWorkingModeBits = 3;
const kLinearFilterLengthMsOffset = kNlpWorkingModeOffset + kNlpWorkingModeBits; // 14
const kLinearFilterLengthMsBits = 12;
const kLinearFilterTypeOffset = kLinearFilterLengthMsOffset + kLinearFilterLengthMsBits; // 26
const kLinearFilterTypeBits = 2;
const kDelaySearchMethodOffset = kLinearFilterTypeOffset + kLinearFilterTypeBits; // 28
const kDelaySearchMethodBits = 3;
const kEnabledOffset = kDelaySearchMethodOffset + kDelaySearchMethodBits; // 31
const kEnabledBits = 1;
const kMax = kEnabledOffset + kEnabledBits;

// 枚举值映射表
const DELAY_SEARCH_METHOD_MAP = {
  0: 'kUnknown',
  1: 'kCorrelation',
  2: 'kFilterCoeff',
  // 可以根据需要添加更多映射
};

const LINEAR_FILTER_TYPE_MAP = {
  0: 'Unknown',
  1: 'MDF',
  2: 'SAF',
  // 可以根据需要添加更多映射
};

const NLP_WORKING_MODE_MAP = {
  0: 'kUnknown',
  1: 'kTrad',
  // 可以根据需要添加更多映射
};

// GetExponential 的反向解码函数
// 根据编码逻辑推断：将值映射到最接近的2的幂次方的索引
// 常见的 nlp_size 值：64, 128, 256, 512, 1024, 2048...
// 常见的 nlp_hop_size 值：32, 64, 128...
const EXPONENTIAL_VALUES = [
  16,    // 0: 2^4
  32,    // 1: 2^5
  64,    // 2: 2^6
  128,   // 3: 2^7
  256,   // 4: 2^8
  512,   // 5: 2^9
  1024,  // 6: 2^10
  2048,  // 7: 2^11
  4096,  // 8: 2^12
  8192,  // 9: 2^13
  16384, // 10: 2^14
  32768, // 11: 2^15
  65536, // 12: 2^16
  131072,// 13: 2^17
  262144,// 14: 2^18
  524288 // 15: 2^19 (4位最大值)
];

/**
 * 从位字段中提取值
 * @param {number} value - 原始整数值
 * @param {number} offset - 位偏移量
 * @param {number} bits - 位数
 * @returns {number} 提取的值
 */
const extractBits = (value, offset, bits) => {
  const mask = (1 << bits) - 1;
  // 使用无符号右移 >>> 确保正确处理高位
  return (value >>> offset) & mask;
};

/**
 * 从指数索引解码为实际值
 * @param {number} index - 指数索引（0-15）
 * @returns {number} 解码后的值
 */
const decodeExponential = (index) => {
  if (index >= 0 && index < EXPONENTIAL_VALUES.length) {
    return EXPONENTIAL_VALUES[index];
  }
  return EXPONENTIAL_VALUES[0]; // 默认值
};

/**
 * 解析 aec_configuration 整数，返回配置参数的 map
 * @param {number} aec_configuration - AEC配置整数值（可以是负数，需要转换为无符号32位整数处理）
 * @returns {Object} 包含所有配置参数的对象
 */
export const parseAecConfiguration = (aec_configuration) => {
  // 将数值转换为无符号32位整数进行处理
  // 使用 >>> 0 可以正确处理负数，将其转换为对应的无符号32位整数
  // 例如：-2146696554 >>> 0 = 2148270742
  const config = aec_configuration >>> 0;
  
  // 提取各个字段
  const enabled = extractBits(config, kEnabledOffset, kEnabledBits);
  const delay_search_method = extractBits(config, kDelaySearchMethodOffset, kDelaySearchMethodBits);
  const linear_filter_type = extractBits(config, kLinearFilterTypeOffset, kLinearFilterTypeBits);
  const linear_filter_length_ms = extractBits(config, kLinearFilterLengthMsOffset, kLinearFilterLengthMsBits);
  const nlp_working_mode = extractBits(config, kNlpWorkingModeOffset, kNlpWorkingModeBits);
  const nlp_aggressiveness = extractBits(config, kNlpAggressivenessOffset, kNlpAggressivenessBits);
  const nlp_size_index = extractBits(config, kNlpSizeOffset, kNlpSizeBits);
  const nlp_hop_size_index = extractBits(config, kNlpHopSizeOffset, kNlpHopSizeBits);
  
  // 解码指数值
  const nlp_size = decodeExponential(nlp_size_index);
  const nlp_hop_size = decodeExponential(nlp_hop_size_index);
  
  // 构建结果对象
  const result = {
    enabled: enabled === 1 ? 'on' : 'off',
    delay_search_method: DELAY_SEARCH_METHOD_MAP[delay_search_method] || `Unknown(${delay_search_method})`,
    linear_filter_type: LINEAR_FILTER_TYPE_MAP[linear_filter_type] || `Unknown(${linear_filter_type})`,
    linear_filter_length_ms: linear_filter_length_ms,
    nlp_working_mode: NLP_WORKING_MODE_MAP[nlp_working_mode] || `Unknown(${nlp_working_mode})`,
    nlp_aggressiveness: nlp_aggressiveness,
    nlp_size: nlp_size,
    nlp_hop_size: nlp_hop_size,
    // 原始值（用于调试）
    raw: {
      enabled,
      delay_search_method,
      linear_filter_type,
      linear_filter_length_ms,
      nlp_working_mode,
      nlp_aggressiveness,
      nlp_size_index,
      nlp_hop_size_index
    }
  };
  
  return result;
};

/**
 * 格式化配置信息为可读字符串
 * @param {number} aec_configuration - AEC配置整数值
 * @returns {string} 格式化的配置信息字符串
 */
export const formatAecConfiguration = (aec_configuration) => {
  const config = parseAecConfiguration(aec_configuration);
  return `Aec Configuration: ${aec_configuration}\n` +
    `enabled: ${config.enabled}\n` +
    `delay_search_method: ${config.delay_search_method}\n` +
    `linear_filter_type: ${config.linear_filter_type}\n` +
    `linear_filter_length_ms: ${config.linear_filter_length_ms}\n` +
    `nlp_working_mode: ${config.nlp_working_mode}\n` +
    `nlp_aggressiveness: ${config.nlp_aggressiveness}\n` +
    `nlp_size: ${config.nlp_size}\n` +
    `nlp_hop_size: ${config.nlp_hop_size}`;
};

// 默认导出
export default {
  parseAecConfiguration,
  formatAecConfiguration
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.parseAecConfiguration = parseAecConfiguration;
  window.formatAecConfiguration = formatAecConfiguration;
  window.AecConfig = {
    parseAecConfiguration,
    formatAecConfiguration
  };
}

console.log('✅ aec-config.js ES6 模块已加载');

