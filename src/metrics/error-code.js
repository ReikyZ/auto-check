/**
 * Error Code 指标分析模块
 * 负责处理 Chat Engine Error Code 相关的所有分析功能
 * ES6 模块版本
 */

// 错误码到描述的映射表
const errorCodeDescriptions = {
  67072: 'Apple OSStatus: NSSharingServiceErrorMinimum, NSSharingServiceNotConfiguredError',
  1028: 'WARN_ADM_IOS_RESTART',
  88890001: 'Windows Error 0x88890001 The IAudioClient object is not initialized.',
  // 可以在这里添加更多错误码映射
};

// ES6 箭头函数导出 - 获取并聚合 Chat Engine Last Error 数据
export const getChatEngineErrorData = (responseText, onDataUpdate = null) => {
  if (!responseText || typeof responseText !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.warn('getChatEngineErrorData: responseText 不是有效的 JSON');
    return null;
  }

  // 定义需要提取的错误指标名称
  const errorMetricNames = [
    'Chat Engine Last Error 1',
    'Chat Engine Last Error 2',
    'Chat Engine Last Error 3'
  ];

  // 提取所有错误指标的数据
  const allErrorData = [];
  for (const item of Array.isArray(parsed) ? parsed : []) {
    if (item && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (counter && typeof counter.name === 'string' && Array.isArray(counter.data)) {
          const name = counter.name.trim();
          if (errorMetricNames.includes(name)) {
            allErrorData.push(...counter.data);
          }
        }
      }
    }
  }

  // 获取所有唯一的时间戳
  const allTimestamps = new Set();
  allErrorData.forEach(([timestamp, value]) => {
    allTimestamps.add(timestamp);
  });

  // 收集所有有效的错误码数据点用于API请求
  const apiRequestData = allErrorData.filter(([timestamp, value]) =>
    value !== null && value !== -1 && value !== 0
  );

  // 如果没有有效数据，返回空结果
  if (apiRequestData.length === 0) {
    return {
      data: []
    };
  }

  // 通过API获取错误码描述
  try {
    console.log('发送错误码数据到API:', apiRequestData);

    // 使用 Promise.resolve 来模拟异步操作，实际会通过回调更新
    const result = {
      data: apiRequestData.map(([timestamp, errorCode]) => [timestamp, errorCode, `正在解析错误码 ${errorCode}...`]),
      loading: true
    };

    // 在后台异步获取错误描述
    (async () => {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: 'FETCH_ERROR_CODE',
              data: { data: apiRequestData }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || 'Unknown error'));
              }
            }
          );
        });

        console.log('API响应:', response);

        if (response && Array.isArray(response.data)) {
          // 更新结果数据，将API响应与原始数据合并
          result.data = apiRequestData.map(([timestamp, errorCode]) => {
            // 从API响应中查找对应的描述
            const apiResult = response.data.find(item =>
              item[0] === timestamp && item[1] === errorCode
            );
            const description = apiResult ? apiResult[2] : `未知错误码: ${errorCode}`;
            return [timestamp, errorCode, description];
          });

          result.loading = false;
          console.log('错误码解析完成:', result.data);

          // 触发数据更新回调
          if (onDataUpdate && typeof onDataUpdate === 'function') {
            onDataUpdate(result);
          }
        } else {
          throw new Error('API响应格式错误');
        }

      } catch (error) {
        console.error('获取错误码描述失败:', error);
        // 失败时使用默认描述
        result.data = apiRequestData.map(([timestamp, errorCode]) => [
          timestamp,
          errorCode,
          `错误码: ${errorCode}`
        ]);
        result.loading = false;
        result.error = error.message;

        if (onDataUpdate && typeof onDataUpdate === 'function') {
          onDataUpdate(result);
        }
      }
    })();

    return result;

  } catch (error) {
    console.error('处理错误码数据时出错:', error);
    return {
      data: apiRequestData.map(([timestamp, errorCode]) => [
        timestamp,
        errorCode,
        `错误码: ${errorCode}`
      ]),
      error: error.message
    };
  }
}

// ES6 默认导出
export default {
  getChatEngineErrorData
};

// 同时暴露到全局作用域以保持兼容性
if (typeof window !== 'undefined') {
  window.ErrorCodeMetrics = {
    getChatEngineErrorData
  };
}

console.log('✅ error-code.js ES6 模块已加载');
