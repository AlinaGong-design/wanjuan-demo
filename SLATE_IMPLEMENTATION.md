# Slate 富文本编辑器实现说明

## 已完成的改动

### 1. 安装 Slate 依赖
- `slate`: Slate 核心库
- `slate-react`: Slate 的 React 绑定
- `slate-history`: 提供撤销/重做功能

### 2. 创建 MentionEditor 组件

#### 文件位置
- `/src/components/MentionEditor.tsx` - 主组件
- `/src/components/MentionEditor.css` - 样式文件

#### 核心功能
1. **富文本编辑**: 基于 Slate 框架实现的富文本编辑器
2. **@提及功能**: 输入 @ 时自动弹出智能体/群组选择列表
3. **光标位置插入**: 选择的@内容会插入到当前光标位置
4. **键盘导航**: 支持上下箭头选择、Enter/Tab 确认、Esc 取消
5. **实时搜索**: 输入 @ 后可以继续输入文字过滤智能体列表

#### 特性
- **可视化@提及**: @的内容会以带样式的标签形式展示
- **内联显示**: @提及是内联元素,可以和普通文本混合
- **自动完成**: 支持键盘和鼠标两种选择方式
- **位置自适应**: 下拉列表会自动定位到光标位置上方

### 3. 集成到 Frontend.tsx

#### 替换位置
1. **欢迎界面输入框** (第 1635-1670 行)
   - 支持@智能体和群组
   - 选中后自动添加到 mentionedAgents 或 selectedGroups

2. **对话界面输入框** (第 1167-1193 行)
   - 支持@智能体和 @all
   - 选中后自动添加到 mentionedAgents

#### 接口
```typescript
interface MentionEditorProps {
  value: string;                    // 输入框的值
  onChange: (value: string) => void; // 值变化回调
  placeholder?: string;              // 占位符
  agents?: Agent[];                  // 可选择的智能体列表
  onSelectAgent?: (agent: Agent) => void; // 选择智能体回调
  style?: React.CSSProperties;       // 自定义样式
  minRows?: number;                  // 最小行数
  maxRows?: number;                  // 最大行数
}
```

### 4. 使用方法

#### 用户操作
1. 在输入框中输入 `@`
2. 自动弹出智能体/群组选择列表
3. 使用上下箭头或鼠标选择
4. 按 Enter/Tab 或点击确认选择
5. 选中的内容会以蓝色标签形式插入到光标位置
6. 可以在@内容前后继续输入普通文本

#### 开发者注意
- MentionEditor 返回的是序列化后的纯文本(包含 @xxx 格式)
- 内部使用 Slate 的 Descendant 结构存储富文本
- 支持撤销/重做功能(Ctrl+Z / Ctrl+Shift+Z)

### 5. 技术实现

#### Slate 插件
- `withMentions`: 自定义插件,将 mention 元素标记为内联和 void 元素
- `withReact`: Slate 的 React 集成
- `withHistory`: 提供历史记录功能

#### 自定义元素类型
```typescript
type CustomElement =
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'mention'; character: string; agentId: string; agentIcon?: string; children: CustomText[] };
```

#### 渲染逻辑
- `Element`: 根据类型渲染不同的元素(paragraph 或 mention)
- `Mention`: 自定义的@提及标签组件
- `Leaf`: 渲染文本节点(支持 bold 等格式)

### 6. 样式优化
- 下拉列表使用圆角和阴影
- 选中项高亮显示
- 自定义滚动条样式
- @提及标签使用蓝色背景

## 验证方法

1. 启动开发服务器: `npm start`
2. 打开浏览器访问 http://localhost:3000
3. 在输入框中输入 @ 测试功能
4. 检查以下功能:
   - @ 后弹出智能体列表
   - 键盘导航(上下箭头、Enter、Esc)
   - 鼠标点击选择
   - 内容插入到光标位置
   - @内容显示为蓝色标签
   - 可以在@前后输入普通文本

## 注意事项

1. 当前实现返回的是纯文本格式,如需在后端保存富文本结构,需要额外的序列化逻辑
2. 编辑器已经集成了撤销/重做功能
3. 如需添加更多富文本功能(加粗、���体等),可以扩展 CustomText 类型和 Leaf 组件
4. 下拉列表位置会自动定位,但在某些边缘情况可能需要调整
