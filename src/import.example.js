/**
 * ES6 导入示例
 * 展示如何导入和使用 ES6 模块
 */

// 从 utils 模块导入（使用解构）
import { formatDate, fetchData, DataManager } from './utils.example.js';

// 也可以使用默认导入
import utils from './utils.example.js';

// 使用示例
async function example() {
  // 使用解构导入的函数
  const date = formatDate(new Date());
  console.log('格式化日期:', date);

  // 使用解构导入的函数
  const data = await fetchData('https://api.example.com/data');
  console.log('获取的数据:', data);

  // 使用解构导入的类
  const manager = new DataManager('MyManager');
  manager.addItem({ id: 1, name: 'Item 1' });
  manager.addItem({ id: 2, name: 'Item 2' });
  
  // 使用箭头函数过滤
  const filtered = manager.filterItems(item => item.id > 1);
  console.log('过滤后的项目:', filtered);

  // 使用默认导入
  console.log('API 基础URL:', utils.API_BASE_URL);
}

// 导出
export { example };

