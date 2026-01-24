# ContentEditable 富文本编辑器实现说明

## ✅ 已完成：使用原生 ContentEditable 实现富文本编辑器

### 为什么不用 Slate？

之前尝试使用 Slate 框架，但遇到了 React 19 兼容性问题：
```
Cannot read properties of null (reading 'useState')
```

Slate-react 目前还不完全支持 React 19，所以改用更轻量级的原生方案。

---

## 新实现方案

### 技术栈
- **原生 contentEditable** - HTML5 原生富文本编辑能力
- **React Hooks** - 状态管理和事件处理
- **DOM API** - 光标控制和节点操作

### 核心文件

```
src/components/
├── MentionEditor.tsx       # 富文本编辑器组件 (282 行)
└── MentionEditor.css       # 样式文件
```

---

## 核心功能实现

### 1. **富文本编辑**
使用 `contentEditable` div 作为编辑器容器：
```tsx
<div
  ref={editorRef}
  contentEditable
  onInput={handleInput}
  onKeyDown={handleKeyDown}
  className="mention-editor"
  data-placeholder={placeholder}
/>
```

### 2. **@提及功能**

#### 触发逻辑
- 用户输入 `@` 时自动检测
- 解析光标前的文本，提取 @ 后的搜索词
- 实时过滤智能体列表

```typescript
const lastAtIndex = beforeCursor.lastIndexOf('@');
if (lastAtIndex !== -1) {
  const afterAt = beforeCursor.substring(lastAtIndex + 1);
  const hasSpace = /\s/.test(afterAt);
  if (!hasSpace) {
    // 显示下拉列表
    setMentionSearch(afterAt);
    setShowMentionList(true);
  }
}
```

#### 插入逻辑（核心功能）✨
**在当前光标位置精确插入 @mention**：

```typescript
const insertMention = (agent: Agent) => {
  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  const cursorPos = range.startOffset;
  const beforeCursor = text.substring(0, cursorPos);
  const atIndex = beforeCursor.lastIndexOf('@');

  // 1. 保留 @ 之前的文本
  const beforeAt = text.substring(0, atIndex);
  // 2. 保留光标之后的文本
  const afterCursor = text.substring(cursorPos);

  // 3. 创建 mention 标签
  const mentionSpan = document.createElement('span');
  mentionSpan.className = 'mention-tag';
  mentionSpan.contentEditable = 'false';
  mentionSpan.innerHTML = `${agent.icon} @${agent.name}`;

  // 4. 在正确位置插入
  textNode.textContent = beforeAt;
  textNode.parentNode.insertBefore(mentionSpan, textNode.nextSibling);
  textNode.parentNode.insertBefore(spaceNode, mentionSpan.nextSibling);

  // 5. 如果有后续文本，添加回去
  if (afterCursor) {
    const afterTextNode = document.createTextNode(afterCursor);
    textNode.parentNode.insertBefore(afterTextNode, spaceNode.nextSibling);
  }

  // 6. 设置光标到插入内容之后
  setCaretPosition(spaceNode, 1);
}
```

### 3. **可视化展示**

#### Mention 标签样式
```css
.mention-tag {
  display: inline-block;
  padding: 2px 6px;
  margin: 0 2px;
  background-color: #E8F0FE;
  color: #1a73e8;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
  user-select: none;
}
```

- 蓝色背景 (#E8F0FE)
- 蓝色文字 (#1a73e8)
- 不可编辑 (`contentEditable='false'`)
- 包含智能体图标

### 4. **键盘导航**

```typescript
- ↑ ArrowUp   - 上一个选项
- ↓ ArrowDown - 下一个选项
- Enter/Tab   - 确认选择
- Esc         - 取消选择
```

### 5. **下拉列表定位**

自动计算光标位置并显示在上方：

```typescript
const rect = range.getBoundingClientRect();
const editorRect = editor.getBoundingClientRect();
setMentionPosition({
  top: rect.bottom - editorRect.top,
  left: rect.left - editorRect.left,
});
```

---

## 使用方法

### 基本用法

```tsx
<MentionEditor
  value={inputValue}
  onChange={(value) => setInputValue(value)}
  placeholder="输入消息..."
  agents={allAgents}
  onSelectAgent={(agent) => {
    console.log('选中智能体:', agent);
    setMentionedAgents([...mentionedAgents, agent]);
  }}
  minRows={3}
  maxRows={6}
/>
```

### Props 说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `value` | string | 编辑器内容（纯文本） |
| `onChange` | (value: string) => void | 内容变化回调 |
| `placeholder` | string | 占位符文本 |
| `agents` | Agent[] | 可选智能体列表 |
| `onSelectAgent` | (agent: Agent) => void | 选择智能体回调 |
| `minRows` | number | 最小行数 |
| `maxRows` | number | 最大行数 |

---

## 特性对比

| 特性 | Slate 方案 | ContentEditable 方案 |
|------|-----------|---------------------|
| React 19 兼容 | ❌ 不支持 | ✅ 完全兼容 |
| 包体积 | ~200KB | ~5KB |
| 学习曲线 | 陡峭 | 平缓 |
| 光标控制 | 抽象 API | 原生 DOM API |
| 扩展性 | 高 | 中等 |
| 性能 | 良好 | 优秀 |

---

## 已集成页面

### 1. 欢迎界面输入框
- 支持 @智能体 和 @群组
- 选中后自动添加到 `mentionedAgents` 或 `selectedGroups`

### 2. 对话界面输入框
- 支持 @智能体 和 @all
- 选中后自动添加到 `mentionedAgents`

---

## 测试步骤

1. 启动开发服务器
```bash
npm start
```

2. 打开浏览器访问 http://localhost:3000

3. 测试功能：
   - ✅ 输入 `@` 弹出下拉列表
   - ✅ 搜索过滤智能体
   - ✅ 键盘导航选择
   - ✅ @内容插入到光标位置
   - ✅ @内容显示为蓝色标签
   - ✅ 在@前后输入普通文本
   - ✅ 混合编辑普通文本和@标签

---

## 优势

✅ **React 19 完全兼容** - 无版本冲突
✅ **轻量级** - 不依赖第三方富文本库
✅ **精确光标控制** - @内容插入到当前位置
✅ **可视化** - 蓝色标签显示@内容
✅ **键盘友好** - 完整的键盘导航支持
✅ **高性能** - 原生 DOM 操作

---

## 编译状态

```bash
✅ Build successful
✅ No errors
⚠️  Minor warnings (unused vars in other files)
```

文件大小：
- JS: 311.37 KB (gzipped)
- CSS: 1.14 KB

---

## 后续扩展建议

如需添加更多富文本功能：

1. **文本格式化**
   - 加粗、斜体、下划线
   - 使用 `document.execCommand()` 实现

2. **链接**
   - 自动检测 URL
   - 转换为可点击链接

3. **表情符号**
   - 表情选择器
   - 快捷输入（如 `:smile:`）

4. **代码块**
   - 语法高亮
   - 多行代码支持

所有这些都可以基于当前的 contentEditable 实现扩展！
