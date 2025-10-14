# Auto Check Chrome Extension

一个Chrome浏览器扩展程序，用于在页面的`info_right`区域右侧自动添加"Auto Check"按钮。

## 功能特性

- ✅ 自动检测页面中的`info_right`元素
- ✅ 在右侧添加美观的"Auto Check"按钮
- ✅ 支持动态页面加载
- ✅ 提供点击反馈和动画效果
- ✅ 包含popup页面用于状态监控
- ✅ **网络请求监听**：自动监听和捕获网络请求
- ✅ **Counters数据提取**：专门提取包含counters的网络请求数据
- ✅ **数据可视化**：美观的数据展示面板
- ✅ **AEC Delay曲线图**：专门解析和显示Audio AEC Delay的时间序列曲线
- ✅ **交互式图表**：支持缩放、平移、悬停查看详情
- ✅ **数据导出**：支持复制和导出counters数据（CSV格式）
- ✅ **智能库加载**：优先使用指定Chart.js源，具备完善的降级策略
- ✅ 响应式设计，支持移动端

## 文件结构

```
auto-check/
├── manifest.json          # Chrome插件配置文件
├── background.js          # 后台脚本，处理网络请求监听
├── content.js            # 内容脚本，注入按钮和数据处理逻辑
├── styles.css            # 按钮、通知和数据面板样式
├── popup.html            # 插件弹窗页面
├── popup.js              # 弹窗页面逻辑
├── icons/                # 插件图标文件夹
│   ├── icon16.png        # 16x16图标
│   ├── icon48.png        # 48x48图标
│   └── icon128.png       # 128x128图标
├── icon.svg              # SVG图标源文件
├── sample.html           # 示例HTML页面
├── test.html             # 基本功能测试页面
├── test-with-aec-data.html # AEC Delay图表测试页面
├── test/counters         # 示例counters数据文件
├── icon-conversion.md    # 图标转换说明
└── README.md             # 说明文档
```

## 安装步骤

1. **下载或克隆项目**
   ```bash
   git clone <repository-url>
   cd auto-check
   ```

2. **准备图标文件**
   - 在`icons/`文件夹中放置以下尺寸的图标：
     - `icon16.png` (16x16像素)
     - `icon48.png` (48x48像素) 
     - `icon128.png` (128x128像素)

3. **加载到Chrome**
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹

4. **验证安装**
   - 扩展程序图标应出现在工具栏中
   - 访问包含`info_right`元素的页面
   - 应该能看到"Auto Check"按钮出现在右侧

## 使用方法

### 基本使用
1. 访问目标网页
2. 等待页面加载完成
3. 在`info_right`区域右侧会自动出现"Auto Check"按钮
4. 点击按钮执行自动检查功能

### 网络请求监听功能
1. 点击"Auto Check"按钮后，插件会自动开始监听网络请求
2. 如果页面有"Fetch Log"按钮，插件会自动点击并等待网络请求
3. 插件会过滤并提取包含"counters"关键词的网络请求
4. 自动解析counters数据中的"Audio AEC Delay"信息
5. 自动弹出AEC Delay曲线图和数据展示面板

### AEC Delay曲线图功能
- **智能解析**：自动识别counters数据中的Audio AEC Delay
- **时间序列图**：以时间轴展示延迟变化趋势
- **交互功能**：支持鼠标缩放、拖拽平移、悬停查看详情
- **数据统计**：显示数据点数量、时间范围等统计信息
- **导出功能**：支持导出CSV格式的原始数据
- **响应式设计**：适配不同屏幕尺寸的图表显示

### 数据展示面板功能
- **数据概览**：显示找到的counters数据条数
- **详细信息**：每条数据包含URL、请求方法、状态码、时间戳
- **内容展示**：可展开查看请求体内容和解析后的JSON
- **数据操作**：支持复制所有数据到剪贴板或导出为JSON文件
- **美观界面**：现代化的UI设计，支持滚动和响应式布局

### 弹窗功能
- 点击工具栏中的扩展图标
- 查看页面状态和按钮状态
- 手动执行检查
- 查看检查次数统计

### Chart.js库加载策略
插件采用智能的Chart.js库加载策略，确保在各种网络环境下都能正常工作：

1. **优先使用指定源**：
   - 首先尝试从指定地址加载：`https://arnoldlisenan.oss-cn-hangzhou.aliyuncs.com/Private/js/chart.js`
   - 使用Chart.js v4.4.8版本

2. **备用CDN源**：
   - 如果指定地址失败，自动尝试多个备用CDN源
   - 包括jsdelivr、unpkg、cdnjs等主流CDN

3. **内置备用方案**：
   - 当所有外部源都失败时，自动切换到表格显示模式
   - 仍然提供完整的数据分析和导出功能

4. **加载状态监控**：
   - 详细的控制台日志显示加载状态和来源
   - 用户友好的错误提示和状态反馈

## 自定义配置

### 修改按钮样式
编辑`styles.css`文件中的`.auto-check-btn`类：
```css
.auto-check-btn {
  background: your-custom-color;
  /* 其他样式... */
}
```

### 修改检查逻辑
编辑`content.js`文件中的`performAutoCheck`函数：
```javascript
function performAutoCheck() {
  // 添加您的自定义检查逻辑
}
```

### 修改按钮文本
编辑`content.js`文件中的按钮创建部分：
```javascript
button.innerHTML = '您的自定义文本';
```

## 技术实现

### 核心功能
- **元素检测**: 使用`MutationObserver`监听DOM变化
- **动态注入**: 通过`content script`注入按钮到页面
- **事件处理**: 处理按钮点击和页面交互
- **状态管理**: 使用Chrome Storage API保存数据

### 兼容性
- Chrome 88+ (Manifest V3)
- 支持所有网站
- 响应式设计

## 开发说明

### 调试方法
1. 打开Chrome开发者工具
2. 查看Console面板的输出信息
3. 检查Elements面板确认按钮是否正确注入

### 常见问题
1. **按钮未显示**: 确保页面包含`.info_right`元素
2. **样式异常**: 检查CSS文件是否正确加载
3. **功能不工作**: 查看Console中的错误信息

## 许可证

MIT License

## 更新日志

### v1.0 (2024-01-XX)
- 初始版本发布
- 基本按钮注入功能
- Popup页面
- 自动检查逻辑
- 响应式设计
