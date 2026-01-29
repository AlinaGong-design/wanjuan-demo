# Dify智能体模式配置方案

## 概述

本方案提供了一套完整的、可直接集成的Dify智能体模式配置系统，支持React模式和Function Call模式的切换，并符合Dify的产品设计规则。

## 核心功能

### 1. 模式定义

#### React模式（对话交互模式）
- **标识**: `react`
- **用途**: 自然语言人机对话
- **特性**: 支持Skills配置
- **配置字段**: `skills` (string[])

#### Function Call模式（函数调用模式）
- **标识**: `function_call`
- **用途**: 系统间自动化函数/API调用
- **特性**: 不支持Skills配置，支持最大迭代次数配置
- **配置字段**: `max_iteration_times` (number)

### 2. 配置规则

| 配置项 | React模式 | Function Call模式 |
|--------|-----------|-------------------|
| `skills` | ✅ 支持 | ❌ 禁止 |
| `max_iteration_times` | ❌ 禁止 | ✅ 必需 |

### 3. max_iteration_times配置约束

- **类型**: 整数
- **默认值**: 10
- **最小值**: 1
- **最大值**: 20
- **用途**: 控制智能体"思考-调用函数"的循环次数上限，防止资源过度消耗

## 文件结构

```
src/
├── types/
│   └── agent-config.types.ts          # TypeScript类型定义
├── config/
│   └── agent-mode-config.ts           # 常量配置
├── utils/
│   └── agent-config-validator.ts      # 验证工具
├── components/
│   └── AgentModeConfigModal.tsx       # 配置弹窗组件
└── examples/
    ├── agent-config-examples.json     # 配置示例
    └── mode-switch-logic.pseudo.ts    # 切换逻辑伪代码
```

## 使用指南

### 1. 类型定义使用

```typescript
import {
  AgentMode,
  AgentConfiguration,
  ModeConfigFormData
} from './types/agent-config.types';

// 定义配置
const reactConfig: AgentConfiguration = {
  agent_id: 'agent_001',
  agent_name: '客服助手',
  mode: 'react',
  config: {
    skills: ['skill_001', 'skill_002'],
  },
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
};

const fcConfig: AgentConfiguration = {
  agent_id: 'agent_002',
  agent_name: 'API调用器',
  mode: 'function_call',
  config: {
    max_iteration_times: 15,
  },
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
};
```

### 2. 配置验证

```typescript
import { validateModeConfig } from './utils/agent-config-validator';

const formData: ModeConfigFormData = {
  mode: 'function_call',
  max_iteration_times: 25, // 超出范围
};

const result = validateModeConfig(formData);

if (!result.valid) {
  console.error('验证失败:', result.errors);
  // 输出: [{ field: 'max_iteration_times', message: '最大迭代次数不能大于 20', code: 'MAX_ITERATION_TOO_HIGH' }]
}
```

### 3. 组件集成

```typescript
import { AgentModeConfigModal } from './components/AgentModeConfigModal';

function MyPage() {
  const [visible, setVisible] = useState(false);
  const [availableSkills] = useState([
    { id: 'skill_001', name: '数据查询' },
    { id: 'skill_002', name: '报表生成' },
  ]);

  const handleOk = (config: ModeConfigFormData) => {
    console.log('配置已保存:', config);
    setVisible(false);
    // 提交配置到后端...
  };

  return (
    <>
      <Button onClick={() => setVisible(true)}>配置智能体</Button>

      <AgentModeConfigModal
        visible={visible}
        availableSkills={availableSkills}
        onOk={handleOk}
        onCancel={() => setVisible(false)}
      />
    </>
  );
}
```

## 配置示例

### React模式配置示例

```json
{
  "agent_id": "agent_001",
  "agent_name": "客服助手",
  "description": "为用户提供7x24小时在线客服支持",
  "mode": "react",
  "config": {
    "skills": [
      "skill_knowledge_base_faq",
      "skill_order_query",
      "skill_refund_processing"
    ]
  },
  "created_at": "2026-01-30T10:00:00Z",
  "updated_at": "2026-01-30T10:00:00Z"
}
```

### Function Call模式配置示例

```json
{
  "agent_id": "agent_003",
  "agent_name": "API自动化调用器",
  "description": "自动调用第三方API完成数据同步任务",
  "mode": "function_call",
  "config": {
    "max_iteration_times": 10
  },
  "created_at": "2026-01-30T12:00:00Z",
  "updated_at": "2026-01-30T12:00:00Z"
}
```

## 验证规则

### 通用验证

- ✅ `mode` 字段必填，且只能是 `react` 或 `function_call`

### React模式验证

- ✅ 可以配置 `skills` 字段（可选）
- ❌ 不能配置 `max_iteration_times` 字段
- ✅ `skills` 必须是字符串数组

### Function Call模式验证

- ❌ 不能配置 `skills` 字段
- ✅ 必须配置 `max_iteration_times` 字段
- ✅ `max_iteration_times` 必须是整数
- ✅ `max_iteration_times` 取值范围: 1-20

## 错误处理

### 常见错误示例

#### 错误1: 在Function Call模式下配置Skills

```typescript
// ❌ 错误配置
const invalidConfig = {
  mode: 'function_call',
  config: {
    skills: ['skill_001'],
    max_iteration_times: 10,
  },
};

// 验证结果
{
  valid: false,
  errors: [{
    field: 'skills',
    message: '函数调用模式不支持配置技能',
    code: 'SKILLS_NOT_ALLOWED'
  }]
}
```

#### 错误2: max_iteration_times超出范围

```typescript
// ❌ 错误配置
const invalidConfig = {
  mode: 'function_call',
  config: {
    max_iteration_times: 25, // 超出最大值20
  },
};

// 验证结果
{
  valid: false,
  errors: [{
    field: 'max_iteration_times',
    message: '最大迭代次数不能大于 20',
    code: 'MAX_ITERATION_TOO_HIGH'
  }]
}
```

#### 错误3: 在React模式下配置max_iteration_times

```typescript
// ❌ 错误配置
const invalidConfig = {
  mode: 'react',
  config: {
    skills: ['skill_001'],
    max_iteration_times: 10,
  },
};

// 验证结果
{
  valid: false,
  errors: [{
    field: 'max_iteration_times',
    message: 'React模式不支持配置最大迭代次数',
    code: 'MAX_ITERATION_NOT_ALLOWED'
  }]
}
```

## 模式切换逻辑

### 切换流程图

```
用户选择模式
    ↓
React模式?
    ├─ 是 → 显示Skills配置 → 隐藏max_iteration_times
    └─ 否 → 隐藏Skills配置 → 显示max_iteration_times → 设置默认值10
```

### 详细逻辑

1. **初始化**
   - 默认显示React模式
   - 显示Skills配置区域
   - 隐藏max_iteration_times配置区域

2. **切换到Function Call模式**
   - 隐藏并禁用Skills配置
   - 清空Skills数据
   - 显示并启用max_iteration_times配置
   - 设置默认值为10
   - 显示提示:"该模式不支持配置技能"

3. **切换到React模式**
   - 显示并启用Skills配置
   - 设置默认值为空数组
   - 隐藏并禁用max_iteration_times配置
   - 清空max_iteration_times数据

4. **提交前验证**
   - 根据当前模式执行对应的验证规则
   - 检查是否存在不应该存在的配置项
   - 验证配置值的有效性

## 技术规范

### 命名规范

- 遵循Dify官方命名规范
- 使用小写下划线命名法（snake_case）用于API字段
- 使用驼峰命名法（camelCase）用于TypeScript代码

### 类型安全

- 使用TypeScript严格模式
- 利用联合类型确保类型安全
- 提供完整的类型定义和注释

### 验证机制

- 前端实时验证（输入时）
- 表单提交验证（提交前）
- 后端二次验证（可选，建议实现）

## 集成步骤

1. **复制类型定义文件**
   ```bash
   cp src/types/agent-config.types.ts your-project/src/types/
   ```

2. **复制配置文件**
   ```bash
   cp src/config/agent-mode-config.ts your-project/src/config/
   ```

3. **复制验证工具**
   ```bash
   cp src/utils/agent-config-validator.ts your-project/src/utils/
   ```

4. **集成React组件**
   ```bash
   cp src/components/AgentModeConfigModal.tsx your-project/src/components/
   ```

5. **在页面中使用**
   ```typescript
   import { AgentModeConfigModal } from '@/components/AgentModeConfigModal';
   ```

## 依赖项

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "antd": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

## 最佳实践

### 1. 默认值设置

- React模式默认skills为空数组
- Function Call模式默认max_iteration_times为10

### 2. 用户体验优化

- 模式切换时清除相关字段的验证错误
- 提供清晰的提示信息
- 实时验证输入值

### 3. 数据持久化

- 保存配置前执行完整验证
- 提交到后端时只传递必要字段
- 避免传递undefined或null值

### 4. 错误处理

- 提供友好的错误提示
- 区分警告和错误
- 支持多语言错误消息（可扩展）

## FAQ

### Q1: 为什么React模式不支持max_iteration_times?

React模式是对话交互模式，不涉及函数调用的迭代过程，因此不需要配置迭代次数。

### Q2: 如果需要修改max_iteration_times的范围怎么办?

修改 `src/config/agent-mode-config.ts` 中的 `MAX_ITERATION_CONFIG` 常量即可。

### Q3: 可以同时支持两种模式吗?

不可以。每个智能体配置只能选择一种模式，这是Dify的产品设计规则。

### Q4: 如何扩展新的模式?

1. 在 `AgentMode` 类型中添加新模式
2. 在 `MODE_METADATA` 中添加元数据
3. 创建对应的配置接口
4. 更新验证逻辑
5. 更新UI组件

## 版本历史

- **v1.0.0** (2026-01-30)
  - 初始版本发布
  - 支持React模式和Function Call模式
  - 完整的类型定义和验证逻辑
  - React组件实现

## 贡献

如有问题或建议，请提交Issue或Pull Request。

## 许可证

MIT License
