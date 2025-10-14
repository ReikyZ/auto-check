# 图标转换说明

由于Chrome扩展需要PNG格式的图标，您需要将提供的SVG图标转换为不同尺寸的PNG文件。

## 需要的图标尺寸

- `icon16.png` - 16x16像素
- `icon48.png` - 48x48像素  
- `icon128.png` - 128x128像素

## 转换方法

### 方法1: 在线转换工具
1. 访问 https://convertio.co/svg-png/ 或类似在线转换工具
2. 上传 `icon.svg` 文件
3. 设置输出尺寸为16x16，下载为 `icon16.png`
4. 重复步骤3，分别生成48x48和128x128版本

### 方法2: 使用ImageMagick (命令行)
```bash
# 安装ImageMagick (如果未安装)
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# 转换不同尺寸
convert icon.svg -resize 16x16 icons/icon16.png
convert icon.svg -resize 48x48 icons/icon48.png  
convert icon.svg -resize 128x128 icons/icon128.png
```

### 方法3: 使用Inkscape (图形软件)
1. 打开Inkscape
2. 导入 `icon.svg`
3. 文件 -> 导出为PNG
4. 设置不同的尺寸并导出到 `icons/` 文件夹

### 方法4: 使用GIMP/Photoshop
1. 打开SVG文件
2. 调整画布尺寸
3. 导出为PNG格式

## 临时解决方案

如果您暂时无法生成图标文件，可以：
1. 从manifest.json中移除icons配置
2. Chrome会使用默认图标
3. 稍后再添加自定义图标

## 图标设计说明

当前图标设计：
- 渐变背景 (蓝色到紫色)
- 白色检查标记
- 装饰性小圆点
- 简洁现代的设计风格

您也可以根据需要自定义SVG文件中的颜色和样式。
