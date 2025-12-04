/**
 * Packet Type 编解码器类型常量模块
 * 用于保存音频编解码器类型与对应值的映射关系
 * ES6 模块版本
 */

/**
 * PACKET_TYPE 枚举值映射表
 * 格式：{ 枚举值: '枚举名称' }
 */
export const PACKET_TYPE_MAP = {
  0: 'PACKET_TYPE_PCMU',      // 8000, 160, 1, 64000
  8: 'PACKET_TYPE_PCMA',      // 8000, 160, 1, 64000
  9: 'PACKET_TYPE_G722',      // 16000, 320, 1, 64000
  13: 'PACKET_TYPE_CN',       // 8000, 160, 1, 0
  70: 'PACKET_TYPE_AACLC1_2CH', // 48000, 960, 2, 192000
  71: 'PACKET_TYPE_AACLC1',    // 44100, 960, 1, 96000
  72: 'PACKET_TYPE_HEAAC2',    // 48000, 1920, 1, 48000
  73: 'PACKET_TYPE_HEAAC2_2CH', // 48000, 1920, 2, 64000
  74: 'PACKET_TYPE_AACLC_2CH', // 48000, 960, 2, 192000
  75: 'PACKET_TYPE_AACLC',     // 48000, 960, 1, 96000
  77: 'PACKET_TYPE_HWAAC',     // 32000, 960, 1, 32000
  78: 'PACKET_TYPE_HEAAC_2CH', // 48000, 1920, 2, 32000
  79: 'PACKET_TYPE_HEAAC',     // 32000, 1920, 1, 24000
  80: 'PACKET_TYPE_JC1',       // 16000, 640, 1, 18000
  82: 'PACKET_TYPE_NOVA',      // 16000, 320, 1, 9600
  83: 'PACKET_TYPE_SILKWB',    // 16000, 320, 1, 16000
  85: 'PACKET_TYPE_NVWA',      // 32000, 640, 1, 18000
  90: 'PACKET_TYPE_LPCNET',    // 32000, 1280, 1, 3600
  98: 'PACKET_TYPE_CNWB',      // 16000, 320, 1, 0
  99: 'PACKET_TYPE_CNSWB',     // 32000, 640, 1, 0
  100: 'PACKET_TYPE_CNFB',     // 48000, 1440, 1, 0
  120: 'PACKET_TYPE_OPUS',     // 16000, 320, 1, 16000
  121: 'PACKET_TYPE_OPUSSWB',  // 32000, 640, 1, 25000
  122: 'PACKET_TYPE_OPUSFB',   // 48000, 960, 1, 64000
  254: 'PACKET_TYPE_UNKNOWN'   // Unknown packet type, might be encrypted packet or custom audio packet.
};

/**
 * PACKET_TYPE 枚举常量定义
 * 格式：{ 枚举名称: 枚举值 }
 */
export const PACKET_TYPE = {
  PACKET_TYPE_CN: 13,
  PACKET_TYPE_PCMU: 0,
  PACKET_TYPE_PCMA: 8,
  PACKET_TYPE_G722: 9,
  PACKET_TYPE_AACLC1_2CH: 70,
  PACKET_TYPE_AACLC1: 71,
  PACKET_TYPE_HEAAC2: 72,
  PACKET_TYPE_HEAAC2_2CH: 73,
  PACKET_TYPE_AACLC_2CH: 74,
  PACKET_TYPE_AACLC: 75,
  PACKET_TYPE_HWAAC: 77,
  PACKET_TYPE_HEAAC_2CH: 78,
  PACKET_TYPE_HEAAC: 79,
  PACKET_TYPE_JC1: 80,
  PACKET_TYPE_NOVA: 82,
  PACKET_TYPE_SILKWB: 83,
  PACKET_TYPE_NVWA: 85,
  PACKET_TYPE_LPCNET: 90,
  PACKET_TYPE_CNWB: 98,
  PACKET_TYPE_CNSWB: 99,
  PACKET_TYPE_CNFB: 100,
  PACKET_TYPE_OPUS: 120,
  PACKET_TYPE_OPUSSWB: 121,
  PACKET_TYPE_OPUSFB: 122,
  PACKET_TYPE_UNKNOWN: 254
};

/**
 * 根据值获取 Packet Type 名称
 * @param {number} value - Packet Type 值
 * @returns {string|null} Packet Type 名称，如果未找到则返回 null
 */
export const getPacketTypeName = (value) => {
  return PACKET_TYPE_MAP[value] || null;
};

/**
 * 根据名称获取 Packet Type 值
 * @param {string} name - Packet Type 名称
 * @returns {number|null} Packet Type 值，如果未找到则返回 null
 */
export const getPacketTypeValue = (name) => {
  return PACKET_TYPE[name] || null;
};

/**
 * 检查值是否为有效的 Packet Type
 * @param {number} value - 要检查的值
 * @returns {boolean} 是否为有效的 Packet Type
 */
export const isValidPacketType = (value) => {
  return value in PACKET_TYPE_MAP;
};

// 默认导出
export default {
  PACKET_TYPE_MAP,
  PACKET_TYPE,
  getPacketTypeName,
  getPacketTypeValue,
  isValidPacketType
};

