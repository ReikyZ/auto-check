#!/usr/bin/env node

/**
 * 构建前脚本：从 version 文件读取版本号并更新 src/version.js
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'version');
const versionJsFile = path.join(__dirname, '..', 'src', 'version.js');

try {
  // 读取 version 文件
  const version = fs.readFileSync(versionFile, 'utf8').trim();
  const versionNumber = parseInt(version) || 1;
  
  console.log(`📦 读取版本号: ${versionNumber}`);
  
  // 生成 version.js 内容
  const versionJsContent = `/**
 * 版本号模块
 * 从 version 文件读取版本号并导出
 * 此文件由构建脚本自动生成，请勿手动修改
 */

// 版本号常量（从 version 文件读取）
export const VERSION = ${versionNumber};

// 默认导出
export default VERSION;

console.log('✅ version.js 已加载，当前版本:', VERSION);
`;

  // 写入 version.js
  fs.writeFileSync(versionJsFile, versionJsContent, 'utf8');
  console.log(`✅ 已更新 ${versionJsFile}`);
} catch (error) {
  console.error('❌ 更新 version.js 失败:', error);
  process.exit(1);
}

