// ============================================
// Injected Script - 在页面上下文中运行
// 扩展 XMLHttpRequest 和 fetch 来捕获网络请求和响应
// ============================================
(function () {
  'use strict';

  // 防止重复注入
  if (window.__injectedScriptLoaded) {
    return;
  }
  window.__injectedScriptLoaded = true;

  console.log('🔧 Injected script 已加载，开始拦截网络请求...');

  // 消息标识符，用于区分来自 injected script 的消息
  const MESSAGE_SOURCE = 'INJECTED_SCRIPT';

  // 发送消息到 content script
  function sendToContentScript(data, messageType = 'NETWORK_REQUEST') {
    window.postMessage({
      source: MESSAGE_SOURCE,
      type: messageType,
      data: data
    }, '*');
  }

  // ============================================
  // 拦截 XMLHttpRequest
  // ============================================
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHRSendAsBinary = XMLHttpRequest.prototype.sendAsBinary;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._method = method;
    this._url = url;
    this._requestHeaders = {};
    this._requestBody = null;

    // 检查是否是 counters 请求或其他需要拦截的请求
    this._shouldIntercept = url && typeof url === 'string' && (
      url.includes('api/user/info') ||
      url.includes('counters') ||
      url.includes('counter') ||
      url.includes('metric') ||
      url.includes('events') ||
      url.includes('stats')
    );

    if (this._shouldIntercept) {
      console.log('🟢 [Injected] 拦截到 XHR 请求:', method, url);
    }

    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  // 拦截 setRequestHeader
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    if (this._shouldIntercept) {
      this._requestHeaders[header] = value;
    }
    return originalXHRSetRequestHeader.apply(this, [header, value]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;
    let requestBody = args[0] || null;

    // 如果是 /counters 请求，修改请求体，在 counterIds 中添加 5
    if (xhr._url && xhr._url.includes('/counters') && requestBody) {
      try {
        let bodyObj = null;
        if (typeof requestBody === 'string') {
          bodyObj = JSON.parse(requestBody);
        } else if (typeof requestBody === 'object') {
          bodyObj = requestBody;
        }

        if (bodyObj && Array.isArray(bodyObj.counterIds)) {
          // 如果 counterIds 中还没有 5，则添加
          // 从 ext-counter.js 文件导入要添加的 counterIds
          let extCounterIds = [];
          try {
            extCounterIds = window.__EXT_COUNTER_IDS__;
            if (!Array.isArray(extCounterIds)) {
              // 如果 window 变量不存在，尝试动态导入 ext-counter.js
              // 注意 injected.js 运行在页面环境，import 只有在 module 环境支持，否则可使用 script 注入式
              // 这里假定 ext-counter.js 被 content.js 注入到页面全局（推荐）。否则需用 fetch 动态加载
              extCounterIds = [];
            }
          } catch (e) {
            extCounterIds = [];
          }
          if (!Array.isArray(extCounterIds)) extCounterIds = [];

          let addedIds = [];
          for (const addId of extCounterIds) {
            if (!bodyObj.counterIds.includes(addId)) {
              bodyObj.counterIds.push(addId);
              addedIds.push(addId);
            }
          }
          if (addedIds.length > 0) {
            // 更新请求体
            requestBody = typeof args[0] === 'string' ? JSON.stringify(bodyObj) : bodyObj;
            args[0] = requestBody;
            console.log(`[Injected] ✅ 已在 /counters 请求的 counterIds 中添加: ${addedIds.join(', ')}`);
          }
        }
      } catch (e) {
        console.warn('[Injected] 修改 /counters 请求体失败:', e);
      }
    }

    if (xhr._shouldIntercept) {
      xhr._requestBody = requestBody;

      // 监听响应
      xhr.addEventListener('load', function () {
        try {
          const fullUrl = xhr._url.startsWith('http')
            ? xhr._url
            : window.location.origin + xhr._url;

          // 获取响应头
          const responseHeaders = {};
          const headersString = xhr.getAllResponseHeaders();
          if (headersString) {
            headersString.trim().split('\r\n').forEach(line => {
              const parts = line.split(': ');
              if (parts.length === 2) {
                responseHeaders[parts[0].toLowerCase()] = parts[1];
              }
            });
          }

          const requestData = {
            url: fullUrl,
            method: xhr._method,
            type: 'xhr',
            requestHeaders: xhr._requestHeaders,
            requestBody: requestBody ? (typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)) : null,
            responseText: xhr.responseText,
            responseType: xhr.responseType,
            status: xhr.status,
            statusText: xhr.statusText,
            responseHeaders: responseHeaders,
            timestamp: new Date().toISOString()
          };

          console.log('✅ [Injected] 已捕获 XHR 响应:', {
            url: fullUrl,
            status: xhr.status,
            size: xhr.responseText ? xhr.responseText.length : 0
          });

          // 如果 fullUrl 包含 /counters ，打印 response body 内容
          if (fullUrl.includes('/counters')) {
            console.log('[Injected] 📄 /counters 响应内容:');
            try {
              const jsonData = JSON.parse(xhr.responseText);


              let sid = null;
              // INSERT_YOUR_CODE
              // INSERT_YOUR_CODE
              // 遍历 dataUtil 中 sids 的值，并打印
              (async () => {
                try {
                  // 动态加载 data-util 模块
                  const dataUtil = window.dataUtil
                    ? window.dataUtil
                    : await import(chrome.runtime.getURL('src/data-util.js'));
                  if (dataUtil && typeof dataUtil.getSids === 'function') {
                    const sidsArray = dataUtil.getSids();
                    if (Array.isArray(sidsArray) && sidsArray.length > 0) {
                      console.log('[Injected] 当前已保存的 sids:');
                      sidsArray.forEach((sidValue, idx) => {
                        console.log(`  [${idx}]:`, sidValue);
                        // INSERT_YOUR_CODE
                        // 如果 sidValue 在 responseText 中以 key:value 形态存在
                        if (
                          typeof xhr.responseText === 'string' &&
                          sidValue &&
                          (
                            xhr.responseText.includes(`"sid":"${sidValue}"`) ||
                            xhr.responseText.includes(`"sid": "${sidValue}"`) ||
                            xhr.responseText.includes(`'sid':'${sidValue}'`) ||
                            xhr.responseText.includes(`'sid': '${sidValue}'`)
                          )
                        ) {
                          console.log(`[Injected] ✅ 当前 responseText 中包含 sid=${sidValue}`);
                          sid = sidValue;
                        }
                      });
                    } else {
                      console.log('[Injected] dataUtil sids 为空');
                    }
                  } else {
                    console.warn('[Injected] 未能获取 dataUtil.getSids 方法');
                  }
                } catch (error) {
                  console.error('[Injected] 遍历 dataUtil sids 失败:', error);
                }
              })();

              // INSERT_YOUR_CODE
              // 通过消息通知 content script 保存数据（因为 injected script 无法直接使用 chrome.runtime.getURL）
              if (sid) {
                sendToContentScript({
                  sid: sid,
                  url: fullUrl,
                  data: xhr.responseText
                }, 'SAVE_COUNTERS_DATA');
                if (window.__autoCheckDebug) {
                  console.log(`[Injected] 已发送保存 sid:${sid} counters_${sid} 的请求到 content script`);
                }
              }
              // console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
              console.log(xhr.responseText);
            }
          }

          if (fullUrl.includes('/events')) {
            console.log('[Injected] 📄 /events 响应内容');
            try {
              const jsonData = JSON.parse(xhr.responseText);
              if (window.__autoCheckDebug) {
                console.log('[Injected] /events 响应数据:', JSON.stringify(jsonData, null, 2));
              }

              // 获取 sid 的值，优先从请求体中获取，如果请求体没有则从响应中查找
              let sid = null;

              // 首先尝试从请求体中获取 sid（类似 /counters 的处理方式）
              if (requestBody) {
                try {
                  let bodyObj = null;
                  if (typeof requestBody === 'string') {
                    bodyObj = JSON.parse(requestBody);
                  } else if (typeof requestBody === 'object') {
                    bodyObj = requestBody;
                  }

                  if (bodyObj) {
                    // 检查请求体中是否有 sids 数组
                    if ('sids' in bodyObj && Array.isArray(bodyObj.sids) && bodyObj.sids.length > 0) {
                      sid = bodyObj.sids[0];
                      if (window.__autoCheckDebug) {
                        console.log('[Injected] 从 /events 请求体中获取到 sid:', sid);
                      }
                    } else if ('sid' in bodyObj && bodyObj.sid) {
                      sid = bodyObj.sid;
                      if (window.__autoCheckDebug) {
                        console.log('[Injected] 从 /events 请求体中获取到 sid:', sid);
                      }
                    }
                  }
                } catch (e) {
                  // 请求体解析失败，继续尝试从响应中获取
                  if (window.__autoCheckDebug) {
                    console.warn('[Injected] 解析 /events 请求体失败:', e);
                  }
                }
              }

              // 如果请求体中没有找到 sid，则从响应中查找
              if (!sid && jsonData && typeof jsonData === 'object') {
                // 常见结构是 { data: { sid: "xxx" } } 或直接 { sid: "..." }
                if ('sid' in jsonData) {
                  sid = jsonData.sid;
                } else if (jsonData.data && typeof jsonData.data === 'object' && 'sid' in jsonData.data) {
                  sid = jsonData.data.sid;
                } else {
                  // 遍历查找 sids 数组的第一个值
                  function findSid(obj) {
                    for (const k in obj) {
                      if (k === 'sids' && Array.isArray(obj[k]) && obj[k].length > 0) {
                        return obj[k][0];
                      }
                      if (typeof obj[k] === 'object' && obj[k] !== null) {
                        const found = findSid(obj[k]);
                        if (found !== null && found !== undefined) return found;
                      }
                    }
                    return null;
                  }
                  sid = findSid(jsonData);
                }

                if (sid && window.__autoCheckDebug) {
                  console.log('[Injected] 从 /events 响应中获取到 sid:', sid);
                }
              }

              // 通过消息通知 content script 保存数据
              if (sid) {
                sendToContentScript({
                  sid: sid,
                  url: fullUrl,
                  data: xhr.responseText
                }, 'SAVE_EVENTS_DATA');
                if (window.__autoCheckDebug) {
                  console.log(`[Injected] ✅ 已发送保存 events_${sid} 的请求到 content script`);
                }
              } else {
                console.warn('[Injected] ⚠️ 无法从 /events 请求或响应中获取 sid，跳过保存');
              }
            } catch (e) {
              console.error('[Injected] ❌ 解析 /events 响应失败:', e);
              console.log('[Injected] /events 原始响应:', xhr.responseText);
            }
          }

          if (fullUrl.includes('api/user/info')) {
            console.log('[Injected] 📄 /api/user/info 响应内容');
            try {
              const jsonData = JSON.parse(xhr.responseText);
              if (jsonData && jsonData.name) {
                console.log('[Injected] 获取到用户信息:', jsonData.name);
                sendToContentScript({
                  name: jsonData.name,
                  email: jsonData.email,
                  id: jsonData.id
                }, 'SAVE_USER_INFO');
              }
            } catch (e) {
              console.error('[Injected] 解析用户信息失败:', e);
            }
          }
          // 发送到 content script
          sendToContentScript(requestData);
        } catch (error) {
          console.error('❌ [Injected] 处理 XHR 响应时出错:', error);
        }
      });

      xhr.addEventListener('error', function () {
        if (xhr._shouldIntercept) {
          console.error('❌ [Injected] XHR 请求失败:', xhr._url);
          sendToContentScript({
            url: xhr._url.startsWith('http') ? xhr._url : window.location.origin + xhr._url,
            method: xhr._method,
            type: 'xhr',
            error: true,
            timestamp: new Date().toISOString()
          });
        }
      });

      xhr.addEventListener('timeout', function () {
        if (xhr._shouldIntercept) {
          console.error('⏱️ [Injected] XHR 请求超时:', xhr._url);
          sendToContentScript({
            url: xhr._url.startsWith('http') ? xhr._url : window.location.origin + xhr._url,
            method: xhr._method,
            type: 'xhr',
            timeout: true,
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    return originalXHRSend.apply(this, args);
  };

  // ============================================
  // 拦截 fetch
  // ============================================
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const input = args[0];
    const init = args[1] || {};

    // 确保 args[1] 存在，以便后续修改
    if (!args[1]) {
      args[1] = init;
    }

    // 获取 URL
    const url = typeof input === 'string' ? input : input?.url || '';

    // 如果是 /counters 请求，修改请求体，在 counterIds 中添加 5
    if (url && url.includes('/counters') && init.body) {
      try {
        let bodyObj = null;
        const originalBodyType = typeof init.body;
        if (typeof init.body === 'string') {
          bodyObj = JSON.parse(init.body);
        } else if (init.body instanceof FormData) {
          // FormData 无法直接修改，需要跳过
        } else if (typeof init.body === 'object' && init.body !== null) {
          bodyObj = init.body;
        }

        if (bodyObj && Array.isArray(bodyObj.counterIds)) {
          // 从 ext-counter.js 文件导入要添加的 counterIds
          let extCounterIds = [];
          try {
            extCounterIds = window.__EXT_COUNTER_IDS__;
            if (!Array.isArray(extCounterIds)) {
              // 如果 window 变量不存在，尝试动态导入 ext-counter.js
              // 注意 injected.js 运行在页面环境，import 只有在 module 环境支持，否则可使用 script 注入式
              // 这里假定 ext-counter.js 被 content.js 注入到页面全局（推荐）。否则需用 fetch 动态加载
              extCounterIds = [];
            }
          } catch (e) {
            extCounterIds = [];
          }
          if (!Array.isArray(extCounterIds)) extCounterIds = [];

          let addedIds = [];
          for (const addId of extCounterIds) {
            if (!bodyObj.counterIds.includes(addId)) {
              bodyObj.counterIds.push(addId);
              addedIds.push(addId);
            }
          }
          if (addedIds.length > 0) {
            // 更新请求体
            init.body = originalBodyType === 'string' ? JSON.stringify(bodyObj) : bodyObj;
            args[1] = init;
            console.log(`[Injected] ✅ 已在 /counters fetch 请求的 counterIds 中添加: ${addedIds.join(', ')}`);
          }
        }
      } catch (e) {
        console.warn('[Injected] 修改 /counters fetch 请求体失败:', e);
      }
    }

    // 检查是否需要拦截
    const shouldIntercept = url && typeof url === 'string' && (
      url.includes('api/user/info') ||
      url.includes('counters') ||
      url.includes('counter') ||
      url.includes('metric') ||
      url.includes('events') ||
      url.includes('stats')
    );

    if (shouldIntercept) {
      console.log('🔵 [Injected] 拦截到 fetch 请求:', url);
    }

    try {
      const response = await originalFetch.apply(this, args);

      if (shouldIntercept) {
        try {
          // 克隆响应以便读取内容而不影响原始响应
          const clonedResponse = response.clone();
          const responseText = await clonedResponse.text();

          // 获取请求头
          const requestHeaders = {};
          if (init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach((value, key) => {
                requestHeaders[key] = value;
              });
            } else if (typeof init.headers === 'object') {
              Object.assign(requestHeaders, init.headers);
            }
          }

          // 获取响应头
          const responseHeaders = {};
          response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
          });

          // 获取请求体
          let requestBody = null;
          if (init.body) {
            if (typeof init.body === 'string') {
              requestBody = init.body;
            } else if (init.body instanceof FormData) {
              // FormData 需要特殊处理
              const formDataObj = {};
              for (const [key, value] of init.body.entries()) {
                formDataObj[key] = value;
              }
              requestBody = JSON.stringify(formDataObj);
            } else if (init.body instanceof Blob) {
              requestBody = '[Blob]';
            } else {
              requestBody = String(init.body);
            }
          }

          const requestData = {
            url: url,
            method: init.method || 'GET',
            type: 'fetch',
            requestHeaders: requestHeaders,
            requestBody: requestBody,
            responseText: responseText,
            status: response.status,
            statusText: response.statusText,
            responseHeaders: responseHeaders,
            timestamp: new Date().toISOString()
          };

          console.log('✅ [Injected] 已捕获 fetch 响应:', {
            url: url,
            status: response.status,
            size: responseText.length
          });

          // 处理 /counters 响应
          if (url.includes('/counters')) {
            try {
              const jsonData = JSON.parse(responseText);
              if (window.__autoCheckDebug) {
                console.log('[Injected] 📄 /counters fetch 响应内容');
              }

              // 获取 sid
              let sid = null;
              if (requestBody) {
                try {
                  let bodyObj = null;
                  if (typeof requestBody === 'string') {
                    bodyObj = JSON.parse(requestBody);
                  } else if (typeof requestBody === 'object') {
                    bodyObj = requestBody;
                  }

                  if (bodyObj && 'sids' in bodyObj && Array.isArray(bodyObj.sids) && bodyObj.sids.length > 0) {
                    sid = bodyObj.sids[0];
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }

              if (sid) {
                sendToContentScript({
                  sid: sid,
                  url: url,
                  data: responseText
                }, 'SAVE_COUNTERS_DATA');
                if (window.__autoCheckDebug) {
                  console.log(`[Injected] ✅ 已发送保存 sid counters_${sid} 的请求到 content script (fetch)`);
                }
              }
            } catch (e) {
              console.warn('[Injected] 处理 /counters fetch 响应失败:', e);
            }
          }

          // 处理 /events 响应
          if (url.includes('/events')) {
            try {
              const jsonData = JSON.parse(responseText);
              if (window.__autoCheckDebug) {
                console.log('[Injected] 📄 /events fetch 响应内容');
              }

              // 获取 sid，优先从请求体中获取
              let sid = null;

              // 首先尝试从请求体中获取 sid
              if (requestBody) {
                try {
                  let bodyObj = null;
                  if (typeof requestBody === 'string') {
                    bodyObj = JSON.parse(requestBody);
                  } else if (typeof requestBody === 'object') {
                    bodyObj = requestBody;
                  }

                  if (bodyObj) {
                    if ('sids' in bodyObj && Array.isArray(bodyObj.sids) && bodyObj.sids.length > 0) {
                      sid = bodyObj.sids[0];
                    } else if ('sid' in bodyObj && bodyObj.sid) {
                      sid = bodyObj.sid;
                    }
                  }
                } catch (e) {
                  // 请求体解析失败，继续尝试从响应中获取
                }
              }

              // 如果请求体中没有找到 sid，则从响应中查找
              if (!sid && jsonData && typeof jsonData === 'object') {
                if ('sid' in jsonData) {
                  sid = jsonData.sid;
                } else if (jsonData.data && typeof jsonData.data === 'object' && 'sid' in jsonData.data) {
                  sid = jsonData.data.sid;
                } else {
                  // 遍历查找 sids 数组的第一个值
                  function findSid(obj) {
                    for (const k in obj) {
                      if (k === 'sids' && Array.isArray(obj[k]) && obj[k].length > 0) {
                        return obj[k][0];
                      }
                      if (typeof obj[k] === 'object' && obj[k] !== null) {
                        const found = findSid(obj[k]);
                        if (found !== null && found !== undefined) return found;
                      }
                    }
                    return null;
                  }
                  sid = findSid(jsonData);
                }
              }

              if (sid) {
                sendToContentScript({
                  sid: sid,
                  url: url,
                  data: responseText
                }, 'SAVE_EVENTS_DATA');
                if (window.__autoCheckDebug) {
                  console.log(`[Injected] ✅ 已发送保存 events_${sid} 的请求到 content script (fetch)`);
                }
              } else {
                console.warn('[Injected] ⚠️ 无法从 /events fetch 请求或响应中获取 sid，跳过保存');
              }
            } catch (e) {
              console.error('[Injected] ❌ 处理 /events fetch 响应失败:', e);
            }
          }

          // 处理 /api/user/info 响应
          if (url.includes('api/user/info')) {
            try {
              const jsonData = JSON.parse(responseText);
              if (jsonData && jsonData.name) {
                console.log('[Injected] 获取到用户信息 (fetch):', jsonData.name);
                sendToContentScript({
                  name: jsonData.name,
                  email: jsonData.email,
                  id: jsonData.id
                }, 'SAVE_USER_INFO');
              }
            } catch (e) {
              console.error('[Injected] 解析用户信息失败 (fetch):', e);
            }
          }

          // 发送到 content script
          sendToContentScript(requestData);
        } catch (error) {
          console.error('❌ [Injected] 处理 fetch 响应时出错:', error);
        }
      }

      return response;
    } catch (error) {
      if (shouldIntercept) {
        console.error('❌ [Injected] Fetch 请求失败:', error);
        sendToContentScript({
          url: url,
          method: init.method || 'GET',
          type: 'fetch',
          error: true,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  };

  console.log('✅ [Injected] 网络请求拦截器已设置完成');
})();

