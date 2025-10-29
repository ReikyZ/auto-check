// Background script for network request monitoring

// 存储网络请求数据
let networkRequests = [];
let isMonitoring = false;

// 开始监听网络请求
function startNetworkMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  networkRequests = [];
  
  // 监听所有网络请求
  chrome.webRequest.onBeforeRequest.addListener(
    handleRequest,
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );
  
  chrome.webRequest.onResponseStarted.addListener(
    handleResponse,
    { urls: ["<all_urls>"] },
    ["responseHeaders"]
  );
  
  console.log('网络请求监听已启动');
}

// 停止监听网络请求
function stopNetworkMonitoring() {
  if (!isMonitoring) return;
  
  isMonitoring = false;
  
  chrome.webRequest.onBeforeRequest.removeListener(handleRequest);
  chrome.webRequest.onResponseStarted.removeListener(handleResponse);
  
  console.log('网络请求监听已停止');
}

// 处理请求
function handleRequest(details) {
  const requestData = {
    id: details.requestId,
    url: details.url,
    method: details.method,
    timestamp: Date.now(),
    requestBody: details.requestBody
  };
  
  networkRequests.push(requestData);
  
  // 只保留最近100个请求
  if (networkRequests.length > 100) {
    networkRequests = networkRequests.slice(-100);
  }
}

// 处理响应
function handleResponse(details) {
  const requestIndex = networkRequests.findIndex(req => req.id === details.requestId);
  if (requestIndex !== -1) {
    networkRequests[requestIndex].responseHeaders = details.responseHeaders;
    networkRequests[requestIndex].statusCode = details.statusCode;
  }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background收到消息:', message);
  
  // 处理需要异步操作的消息
  if (message.type === 'SEND_FEEDBACK') {
    // 异步处理，立即返回 true 保持消息通道开放
    (async () => {
      // 根据action选择不同的URL
      const action = message.data?.action;
      let url;
      
      if (action === 'useful') {
        url = 'https://cstool.reikyz.me:9443/good';
      } else if (action === 'feedback') {
        url = 'https://cstool.reikyz.me:9443/feedback';
      } else {
        url = 'https://10.83.3.3:8443/good';
      }
      
      console.log(`正在发送反馈到 ${url}`);
      
      // 根据action决定请求体格式
      let requestBody;
      if (action === 'feedback') {
        // 反馈请求体只包含输入内容
        requestBody = JSON.stringify({ content: message.data?.content || '' });
      } else {
        // 其他请求体包含完整数据
        requestBody = JSON.stringify(message.data || {});
      }
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody
        });
        
        console.log('收到响应状态:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('反馈发送成功:', data);
        sendResponse({ success: true, data: data });
      } catch (error) {
        console.error('发送反馈失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // 保持消息通道开放
  }
  
  // 处理同步消息
  switch (message.type) {
    case 'START_NETWORK_MONITORING':
      startNetworkMonitoring();
      sendResponse({ success: true, message: '网络监听已启动' });
      break;
      
    case 'STOP_NETWORK_MONITORING':
      stopNetworkMonitoring();
      sendResponse({ success: true, message: '网络监听已停止' });
      break;
      
    case 'GET_NETWORK_REQUESTS':
      sendResponse({ 
        success: true, 
        requests: networkRequests,
        count: networkRequests.length 
      });
      break;
      
    case 'GET_COUNTERS_DATA':
      const countersData = extractCountersData(networkRequests);
      sendResponse({ 
        success: true, 
        counters: countersData 
      });
      break;
      
    default:
      sendResponse({ success: false, message: '未知消息类型' });
  }
  
  return true;
});

// 提取counters数据
function extractCountersData(requests) {
  const countersData = [];
  
  requests.forEach(request => {
    // 检查URL是否包含counters相关路径
    if (request.url.includes('counters') || 
        request.url.includes('counter') ||
        request.url.includes('metric') ||
        request.url.includes('stats')) {
      
      const counterInfo = {
        url: request.url,
        method: request.method,
        timestamp: request.timestamp,
        statusCode: request.statusCode,
        requestBody: request.requestBody,
        responseHeaders: request.responseHeaders
      };
      
      // 尝试从请求体中提取counters数据
      if (request.requestBody && request.requestBody.formData) {
        counterInfo.formData = request.requestBody.formData;
      }
      
      if (request.requestBody && request.requestBody.raw) {
        try {
          const decoder = new TextDecoder();
          request.requestBody.raw.forEach(rawData => {
            if (rawData.bytes) {
              const bodyText = decoder.decode(rawData.bytes);
              counterInfo.bodyText = bodyText;
              
              // 尝试解析JSON
              try {
                counterInfo.parsedBody = JSON.parse(bodyText);
                // 提取AEC Delay数据
                counterInfo.aecDelayData = extractAecDelayData(counterInfo.parsedBody);
              } catch (e) {
                // 不是JSON格式，保持原始文本
              }
            }
          });
        } catch (error) {
          console.error('解析请求体失败:', error);
        }
      }
      
      countersData.push(counterInfo);
    }
  });
  
  return countersData;
}

// 提取AEC Delay数据
function extractAecDelayData(parsedBody) {
  if (!parsedBody || !Array.isArray(parsedBody)) {
    return null;
  }
  
  for (const item of parsedBody) {
    if (item.data && Array.isArray(item.data)) {
      for (const counter of item.data) {
        if (counter.name === "Audio AEC Delay" && counter.data) {
          return {
            name: counter.name,
            counterId: counter.counter_id,
            data: counter.data.map(point => ({
              timestamp: point[0],
              value: point[1]
            }))
          };
        }
      }
    }
  }
  
  return null;
}

// 清理过期数据
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  networkRequests = networkRequests.filter(request => 
    request.timestamp > oneHourAgo
  );
}, 5 * 60 * 1000); // 每5分钟清理一次

console.log('Background script已加载');
