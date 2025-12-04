#!/usr/bin/env node

/**
 * 构建前脚本：从 version 文件读取版本号并更新 src/version.js
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'version');
const versionJsFile = path.join(__dirname, '..', 'src', 'version.js');

try {
  let versionNumber = 1;
  
  // 尝试读取 version 文件
  if (fs.existsSync(versionFile)) {
    const version = fs.readFileSync(versionFile, 'utf8').trim();
    versionNumber = parseInt(version) || 1;
    console.log(`📦 从 version 文件读取版本号: ${versionNumber}`);
  } else {
    // 如果 version 文件不存在，尝试从现有的 version.js 读取
    if (fs.existsSync(versionJsFile)) {
      const versionJsContent = fs.readFileSync(versionJsFile, 'utf8');
      const match = versionJsContent.match(/export const VERSION = (\d+);/);
      if (match) {
        versionNumber = parseInt(match[1]) || 1;
        console.log(`📦 从 version.js 读取版本号: ${versionNumber}`);
      } else {
        console.log(`⚠️  无法从 version.js 读取版本号，使用默认值: ${versionNumber}`);
      }
    } else {
      console.log(`⚠️  version 文件不存在，使用默认版本号: ${versionNumber}`);
    }
    
    // 创建 version 文件
    fs.writeFileSync(versionFile, versionNumber.toString(), 'utf8');
    console.log(`✅ 已创建 version 文件，版本号: ${versionNumber}`);
  }
  
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

