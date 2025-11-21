/**
 * 数据存储工具模块
 * 使用 sessionStorage 保存和获取网络请求响应数据
 */

/**
 * 生成存储键
 * @param {string} type - 数据类型（如 'eventlist', 'counters' 等）
 * @param {string} uid - 用户ID
 * @returns {string} 存储键
 */
function generateStorageKey(type, uid) {
  return `auto_check_${type}_${uid}`;
}

/**
 * 保存数据到 sessionStorage
 * @param {string} type - 数据类型（如 'eventlist', 'counters' 等）
 * @param {string} uid - 用户ID
 * @param {string} url - 请求URL
 * @param {any} data - 要保存的数据（可选，如果不提供则只保存URL信息）
 * @returns {boolean} 是否保存成功
 */
export function saveData(type, uid, url, data = null) {
  try {
    if (!type || !uid || !url) {
      console.warn('saveData: 缺少必要参数', { type, uid, url });
      return false;
    }

    const key = generateStorageKey(type, uid);
    // 将数据转换为字符串存储
    const storageData = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : '';

    sessionStorage.setItem(key, storageData);
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 保存数据成功:`, {
        type,
        uid,
        url: url.substring(0, 100) + '...',
        dataSize: data ? (typeof data === 'string' ? data.length : JSON.stringify(data).length) : 0
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ [DataUtil] 保存数据失败:', error);
    return false;
  }
}

/**
 * 从 sessionStorage 获取数据
 * @param {string} type - 数据类型（如 'eventlist', 'counters' 等）
 * @param {string} uid - 用户ID
 * @returns {object|null} 保存的数据对象，如果不存在则返回 null
 */
export function getData(type, uid) {
  try {
    if (!type || !uid) {
      console.warn('getData: 缺少必要参数', { type, uid });
      return null;
    }

    const key = generateStorageKey(type, uid);
    const stored = sessionStorage.getItem(key);
    
    if (!stored) {
      if (window.__autoCheckDebug) {
        console.log(`ℹ️ [DataUtil] 未找到数据:`, { type, uid });
      }
      return null;
    }

    // 返回存储的字符串数据（响应文本）
    const data = stored.toString();
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 获取数据成功:`, {
        type,
        uid,
        dataSize: data.length
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ [DataUtil] 获取数据失败:', error);
    return null;
  }
}

/**
 * 从URL中提取UID
 * @param {string} url - 请求URL
 * @returns {string|null} 提取的UID，如果未找到则返回 null
 */
export function extractUidFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // 尝试从查询参数中提取 uid
    const urlObj = new URL(url, window.location.origin);
    const uid = urlObj.searchParams.get('uid') || urlObj.searchParams.get('uids');
    
    if (uid) {
      return uid;
    }

    // 尝试从URL路径中提取（例如 /api/users/123456/eventlist）
    const uidMatch = url.match(/[\/=](\d{6,12})/);
    if (uidMatch) {
      return uidMatch[1];
    }

    // 如果URL包含 uids= 参数，尝试提取
    const uidsMatch = url.match(/uids=([^&]+)/);
    if (uidsMatch) {
      return uidsMatch[1].split(',')[0]; // 如果有多个uid，取第一个
    }

    return null;
  } catch (error) {
    console.warn('extractUidFromUrl: 提取UID失败', error);
    return null;
  }
}

/**
 * 清除指定类型和UID的数据
 * @param {string} type - 数据类型
 * @param {string} uid - 用户ID
 * @returns {boolean} 是否清除成功
 */
export function clearData(type, uid) {
  try {
    if (!type || !uid) {
      return false;
    }

    const key = generateStorageKey(type, uid);
    sessionStorage.removeItem(key);
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 清除数据成功:`, { type, uid });
    }
    
    return true;
  } catch (error) {
    console.error('❌ [DataUtil] 清除数据失败:', error);
    return false;
  }
}

/**
 * 获取所有保存的数据（用于调试）
 * @param {string} type - 可选，指定数据类型
 * @returns {Array} 所有匹配的数据
 */
export function getAllData(type = null) {
  try {
    const results = [];
    const prefix = type ? `auto_check_${type}_` : 'auto_check_';
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          results.push(data);
        } catch (e) {
          console.warn('解析存储数据失败:', key, e);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ [DataUtil] 获取所有数据失败:', error);
    return [];
  }
}

/**
 * 保存 span[1] 的值到 sessionStorage
 * @param {string} identifier - 标识符（如 uid 或 sid）
 * @param {string} spanValue - span[1] 的值
 * @returns {boolean} 是否保存成功
 */
export function saveSpanValue(identifier, spanValue) {
  try {
    if (!identifier || spanValue === null || spanValue === undefined) {
      console.warn('saveSpanValue: 缺少必要参数', { identifier, spanValue });
      return false;
    }

    const key = generateStorageKey('span', identifier);
    const storageData = typeof spanValue === 'string' ? spanValue : String(spanValue);

    sessionStorage.setItem(key, storageData);
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 保存 span[1] 值成功:`, {
        identifier,
        spanValue: storageData,
        key
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ [DataUtil] 保存 span[1] 值失败:', error);
    return false;
  }
}

/**
 * 获取保存的 span[1] 的值
 * @param {string} identifier - 标识符（如 uid 或 sid）
 * @returns {string|null} 保存的 span[1] 值，如果不存在则返回 null
 */
export function getSpanValue(identifier) {
  try {
    if (!identifier) {
      console.warn('getSpanValue: 缺少必要参数', { identifier });
      return null;
    }

    const key = generateStorageKey('span', identifier);
    const stored = sessionStorage.getItem(key);
    
    if (!stored) {
      if (window.__autoCheckDebug) {
        console.log(`ℹ️ [DataUtil] 未找到 span[1] 值:`, { identifier });
      }
      return null;
    }

    const spanValue = stored.toString();
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 获取 span[1] 值成功:`, {
        identifier,
        spanValue
      });
    }
    
    return spanValue;
  } catch (error) {
    console.error('❌ [DataUtil] 获取 span[1] 值失败:', error);
    return null;
  }
}

/**
 * 保存 sid 值（span[1] 的值）到数组中
 * @param {string} sidValue - sid 值（span[1] 的值）
 * @returns {boolean} 是否保存成功
 */
export function saveSid(sidValue) {
  try {
    if (!sidValue || sidValue === null || sidValue === undefined) {
      console.warn('saveSid: 缺少必要参数', { sidValue });
      return false;
    }

    const sidStr = typeof sidValue === 'string' ? sidValue.trim() : String(sidValue).trim();
    if (!sidStr) {
      console.warn('saveSid: sid 值为空', { sidValue });
      return false;
    }

    // 使用固定的 key "spans"
    const key = 'auto_check_spans';
    
    // 获取已保存的 sid 数组
    let sidArray = [];
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        sidArray = JSON.parse(stored);
        if (!Array.isArray(sidArray)) {
          sidArray = [];
        }
      }
    } catch (e) {
      // 如果解析失败，使用空数组
      sidArray = [];
    }
    
    // 如果 sid 值不在数组中，则添加
    if (!sidArray.includes(sidStr)) {
      sidArray.push(sidStr);
      sessionStorage.setItem(key, JSON.stringify(sidArray));
      
      if (window.__autoCheckDebug) {
        console.log(`✅ [DataUtil] 保存 sid 值成功:`, {
          sid: sidStr,
          key,
          totalCount: sidArray.length,
          allSids: sidArray
        });
      }
      
      return true;
    } else {
      if (window.__autoCheckDebug) {
        console.log(`ℹ️ [DataUtil] sid 值已存在，跳过保存:`, {
          sid: sidStr,
          key,
          totalCount: sidArray.length
        });
      }
      return true; // 已存在也算成功
    }
  } catch (error) {
    console.error('❌ [DataUtil] 保存 sid 值失败:', error);
    return false;
  }
}

/**
 * 获取所有保存的 sid 值数组
 * @returns {Array<string>} sid 值数组，如果不存在则返回空数组
 */
export function getSids() {
  try {
    const key = 'auto_check_spans';
    const stored = sessionStorage.getItem(key);
    
    if (!stored) {
      if (window.__autoCheckDebug) {
        console.log(`ℹ️ [DataUtil] 未找到保存的 sid 数组`);
      }
      return [];
    }

    const sidArray = JSON.parse(stored);
    if (!Array.isArray(sidArray)) {
      console.warn('[DataUtil] 存储的数据不是数组格式，返回空数组');
      return [];
    }
    
    if (window.__autoCheckDebug) {
      console.log(`✅ [DataUtil] 获取 sid 数组成功:`, {
        count: sidArray.length,
        sids: sidArray
      });
    }
    
    return sidArray;
  } catch (error) {
    console.error('❌ [DataUtil] 获取 sid 数组失败:', error);
    return [];
  }
}

// 如果作为全局脚本加载，暴露到 window 对象
if (typeof window !== 'undefined') {
  window.dataUtil = {
    saveData,
    getData,
    extractUidFromUrl,
    clearData,
    getAllData,
    saveSpanValue,
    getSpanValue,
    saveSid,
    getSids
  };
}

