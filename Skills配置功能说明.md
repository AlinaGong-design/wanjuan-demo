# Skills配置功能说明

## 功能概述

在智能体编辑页面的"AI模型配置"和"知识库"之间新增了**Skills配置栏**，允许用户选择已发布的技能并关联到当前智能体。

## 功能位置

路径：`http://localhost:3000/#agent`

位置：左侧配置面板 → AI模型配置下方 → 知识库上方

## 功能详细说明

### 1. Skills配置栏

#### 外观
- 标题："Skills"
- 右侧：加号按钮（+）
- 已选技能以彩色Tag形式展示

#### 交互
- 点击加号按钮：打开技能选择侧边栏
- 点击Tag的关闭图标：移除该技能

### 2. 技能选择侧边栏

#### 外观布局
- **位置**：从右侧滑出
- **宽度**：480px
- **标题**："选择技能"

#### 功能区域

**顶部搜索框**
- 占位符："搜索技能..."
- 支持按技能名称或分类搜索
- 带清除按钮

**已选提示区**（仅在已选择技能时显示）
- 蓝色背景提示条
- 显示："已选择 X 个技能"

**技能列表**
- 每个技能卡片包含：
  - 左侧：彩色图标（40x40px圆角方框）
  - 中间：技能名称 + 分类标签
  - 右侧：复选框
- 卡片状态：
  - 未选中：白色背景，灰色边框
  - 已选中：淡色背景（技能颜色11%透明度），彩色边框
- 悬停效果：阴影加深
- 点击效果：轻微缩放

**底部操作栏**
- 取消按钮：关闭侧边栏，清空搜索
- 确定按钮：保存选择并关闭

### 3. 预置技能列表

系统包含8个示例技能：

| 技能名称 | 图标 | 颜色 | 分类 |
|---------|------|------|------|
| 写作 | ✏️ | 橙色 #F59E0B | 内容创作 |
| PPT制作 | 📊 | 红色 #EF4444 | 办公工具 |
| 视频编辑 | 🎬 | 橙红 #F97316 | 多媒体 |
| 设计 | 🎨 | 粉色 #EC4899 | 创意设计 |
| 数据分析 | 📈 | 绿色 #10B981 | 数据处理 |
| 编程辅助 | 💻 | 蓝色 #3B82F6 | 开发工具 |
| 翻译 | 🌍 | 紫色 #8B5CF6 | 语言工具 |
| 思维导图 | 🧠 | 青色 #06B6D4 | 思维工具 |

## 技术实现

### 数据结构

```typescript
interface Skill {
  id: string;          // 技能ID
  name: string;        // 技能名称
  icon: string;        // 图标emoji
  color: string;       // 主题颜色
  category: string;    // 分类
  published: boolean;  // 是否已发布
}
```

### 状态管理

```typescript
// 侧边栏显示状态
const [showSkillDrawer, setShowSkillDrawer] = useState(false);

// 已选择的技能列表
const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

// 搜索关键词
const [skillSearchKeyword, setSkillSearchKeyword] = useState('');
```

### 核心函数

**handleAddSkill** - 添加技能
```typescript
const handleAddSkill = (skill: Skill) => {
  if (!selectedSkills.find(s => s.id === skill.id)) {
    setSelectedSkills([...selectedSkills, skill]);
  }
};
```

**handleRemoveSkill** - 移除技能
```typescript
const handleRemoveSkill = (skillId: string) => {
  setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
};
```

**handleToggleSkill** - 切换技能选择状态
```typescript
const handleToggleSkill = (skill: Skill) => {
  if (selectedSkills.find(s => s.id === skill.id)) {
    handleRemoveSkill(skill.id);
  } else {
    handleAddSkill(skill);
  }
};
```

### 组件使用

- **Drawer** - 侧边抽屉
- **Tag** - 技能标签
- **Checkbox** - 复选框
- **Input** - 搜索输入框
- **Empty** - 空状态展示

## 样式特点

### Skills配置区
```css
.selected-skills-container {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
}
```

### 侧边栏
```css
.skills-drawer .ant-drawer-body {
  padding: 24px;
  padding-bottom: 80px;  /* 为底部按钮留空间 */
}
```

### 技能列表
```css
.skills-list {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}
```

### 交互效果
```css
.skill-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.skill-item:active {
  transform: scale(0.98);
}
```

## 使用流程

### 添加技能
1. 点击Skills配置栏的加号按钮
2. 侧边栏从右侧滑出
3. （可选）使用搜索框过滤技能
4. 点击技能卡片或复选框选择
5. 点击"确定"按钮保存

### 移除技能
**方法1：在配置栏**
- 点击技能Tag右上角的关闭图标

**方法2：在侧边栏**
- 再次点击已选中的技能卡片取消选择
- 点击"确定"保存

## 特色功能

### 1. 实时搜索
- 支持按技能名称搜索
- 支持按分类搜索
- 大小写不敏感

### 2. 视觉反馈
- 已选技能：淡色背景 + 彩色边框
- 悬停效果：阴影加深
- 点击反馈：轻微缩放动画

### 3. 智能提示
- 显示已选择的技能数量
- 搜索无结果时显示空状态

### 4. 响应式设计
- 自适应不同屏幕尺寸
- 技能Tag自动换行
- 列表支持垂直滚动

## 后续扩展建议

### 功能增强
1. **技能详情**：点击技能查看详细说明
2. **技能分类过滤**：按分类筛选技能
3. **最近使用**：显示最近添加的技能
4. **推荐技能**：根据智能体类型推荐合适的技能

### 数据对接
1. **动态加载**：从API获取已发布的技能列表
2. **状态同步**：保存技能选择到后端
3. **权限控制**：根据用户权限显示可用技能

### 交互优化
1. **拖拽排序**：支持拖拽调整技能顺序
2. **批量操作**：全选/清空技能
3. **快捷操作**：键盘快捷键支持

## 注意事项

⚠️ **当前状态**
- ✅ 完整的UI实现
- ✅ 基础交互功能
- ✅ 搜索过滤功能
- ❌ 暂未对接后端API
- ❌ 数据未持久化

## 文件修改清单

1. `/src/pages/Agent.tsx` - 添加Skills配置栏和侧边栏
2. `/src/pages/Agent.css` - 添加Skills相关样式

## 访问方式

运行 `npm start` 后访问 `http://localhost:3000/#agent`，即可看到新增的Skills配置功能。
