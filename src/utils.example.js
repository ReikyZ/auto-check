/**
 * ES6 模块示例 - utils.js
 * 展示如何在项目中使用 ES6 语法
 */

// ES6 导出语法
export const API_BASE_URL = 'https://api.example.com';

// 导出函数
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

// 导出异步函数
export const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
};

// 导出类
export class DataManager {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  addItem(item) {
    this.data = [...this.data, item];
  }

  getItems() {
    return this.data;
  }

  // 使用箭头函数作为类方法
  filterItems = (predicate) => {
    return this.data.filter(predicate);
  }
}

// 默认导出
export default {
  API_BASE_URL,
  formatDate,
  fetchData,
  DataManager
};

