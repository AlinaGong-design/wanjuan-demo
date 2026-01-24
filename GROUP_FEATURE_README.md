# 智能体群组功能说明

## 功能概述

本次更新为前台系统（Frontend.tsx）新增了完整的智能体群组功能，支持创建群组、群组对话、@智能体等交互。

## 主要功能

### 1. 新建群组

**入口位置**：左侧边栏，"新建对话"按钮下方

**功能特性**：
- 点击"新建群组"按钮打开创建弹窗
- 支持自定义群组名称（选填，默认自动命名为"群组1"、"群组2"等）
- 使用树形选择器选择智能体成员
  - 第一级为类别（行业分析、编程开发、数据分析、内容创作等）
  - 第二级为该类别下的智能体列表
  - 支持搜索功能
  - 支持多选
- 实时显示已选择的智能体预览
- 至少选择1个智能体才能创建群组

### 2. 群组展示

**位置**：左侧边栏，智能体中心下方

**展示方式**：
- 独立的"我的群组"模块
- 默认显示前5个群组
- 每个群组显示：
  - 群组图标（团队图标）
  - 群组名称
  - 前3个成员的头像图标
  - 成员总数标识
- 超过5个群组时显示"查看全部"按钮，可展开查看所有群组
- 右上角显示群组总数徽章
- 当前选中的群组高亮显示

### 3. 群组对话功能

#### 3.1 群组对话界面

**界面布局**：
- **顶部群组信息栏**：显示群组名称、成员数量、所有成员标签
- **中间消息区域**：显示所有对话消息
- **底部输入区域**：消息输入框和发送按钮

#### 3.2 @智能体功能

**使用方式**：
- 在输入框中输入 `@` 符号唤起智能体选择面板
- 支持 `@all` 提及所有群组成员
- 支持 `@单个智能体` 或 `@多个智能体`
- 限制：一次最多@10个智能体
- 已@的智能体以彩色标签形式展示，可点击关闭

**交互设计**：
- 智能体选择面板显示所有群组成员
- 首位显示"@all"选项（高亮显示）
- 每个智能体显示图标和名称
- 鼠标悬停时高亮反馈

#### 3.3 智能体回复消息

每个被@的智能体会独立回复，回复过程分为三个阶段：

**阶段1：Thinking（思考）**
- 显示智能体头像
- 显示智能体名称
- 灰色气泡显示"正在分析问题..."
- 加载动画效果

**阶段2：Tool Calls（工具调用）**
- 显示正在调用的工具列表
- 黄色背景气泡标识工具调用
- 显示工具图标和名称
- 运行中的工具显示加载动画

**阶段3：Completed（完成）**
- 显示最终回复内容
- 浅色气泡展示回复文本
- 底部展示使用过的工具清单（绿色对勾标识）
- 完整的上下文信息

**消息样式**：
- 用户消息：右对齐，紫色渐变背景
- 智能体消息：左对齐，带头像，浅灰色背景
- 每条消息显示智能体名称和头像
- 工具调用使用黄色背景突出显示
- 完成状态显示绿色对勾图标

## 技术实现

### 数据结构

```typescript
// 智能体接口
interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

// 群组接口
interface AgentGroup {
  id: string;
  name: string;
  members: Agent[];
  createTime: string;
}

// 消息接口
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  skillCalls?: string[];
  status?: 'thinking' | 'calling' | 'completed';
}

// 工具调用接口
interface ToolCall {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  result?: string;
}
```

### 核心功能函数

- `getAgentTreeData()`: 构建树形选���器数据
- `handleCreateGroup()`: 创建新群组
- `handleEnterGroup()`: 进入群组对话
- `handleMentionAgent()`: @单个智能体
- `handleMentionAll()`: @所有智能体
- `simulateAgentReply()`: 模拟智能体回复（包含三阶段）
- `handleSendMessage()`: 发送消息并触发智能体回复

### 状态管理

```typescript
const [showGroupModal, setShowGroupModal] = useState(false);        // 控制创建群组弹窗
const [groupName, setGroupName] = useState('');                     // 群组名称
const [selectedAgents, setSelectedAgents] = useState<string[]>([]);  // 选中的智能体
const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([]);   // 所有群组
const [showAllGroups, setShowAllGroups] = useState(false);          // 是否展示全部群组
const [currentGroup, setCurrentGroup] = useState<AgentGroup | null>(null); // 当前群组
const [messages, setMessages] = useState<Message[]>([]);            // 消息列表
const [mentionedAgents, setMentionedAgents] = useState<Agent[]>([]); // 已@的智能体
const [showAgentPanel, setShowAgentPanel] = useState(false);        // 显示智能体选择面板
```

## UI/UX设计亮点

1. **视觉一致性**：延续了原有系统的紫色渐变主题色
2. **清晰的层级结构**：群组、智能体、消息层级分明
3. **即时反馈**：所有操作都有视觉反馈（hover效果、加载动画等）
4. **智能默认值**：群组名称自动编号，减少用户输入
5. **搜索优化**：支持智能体搜索，方便快速选择
6. **状态可视化**：智能体回复的三个阶段清晰可见
7. **限制提示**：明确告知用户最多@10个智能体的限制

## 使用流程示例

1. 点击"新建群组"按钮
2. 输入群组名称（可选）
3. 在树形选择器中选择智能体（按类别筛选）
4. 点击"创建"按钮
5. 在左侧群组列表中找到新建的群组
6. 点击群组进入对话界面
7. 输入 `@` 选择要提及的智能体（或选择@all）
8. 输入消息并点击"发送"
9. 观察被@的智能体依次回复（thinking → tool calls → completed）

## 未来扩展建议

1. 支持编辑群组（修改名称、添加/删除成员）
2. 支持删除群组
3. 群组消息持久化存储
4. 支持群组搜索
5. 支持群组分类/标签
6. 支持群组设置（如@all限制、消息通知等）
7. 支持导出群组对话记录
8. 支持智能体回复的打字机效果
9. 支持消息撤回、编辑功能
10. 集成真实的AI接口调用

## 注意事项

- 当前为演示版本，智能体回复为模拟数据
- 消息不会持久化保存，刷新页面后会丢失
- Tool calls和skill calls为模拟展示
- 需要后续集成真实的智能体API接口
