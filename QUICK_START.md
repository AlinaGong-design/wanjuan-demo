# 快速集成指南

## 问题已修复

已修复以下TypeScript错误:

1. ✅ `AgentConfiguration` 类型定义问题 - 改用联合类型
2. ✅ 组件中的类型访问问题 - 修复类型断言
3. ✅ 伪代码文件的编译错误 - 添加必要的导入和声明

## 快速开始

### 1. 在你的页面中使用弹窗组件

```tsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { AgentModeConfigModal } from '@/components/AgentModeConfigModal';
import type { ModeConfigFormData } from '@/types/agent-config.types';

export const YourPage = () => {
  const [visible, setVisible] = useState(false);

  // 可用的技能列表（从你的API获取）
  const skills = [
    { id: 'skill_001', name: '数据查询' },
    { id: 'skill_002', name: '报表生成' },
  ];

  const handleSave = (config: ModeConfigFormData) => {
    console.log('保存配置:', config);
    // 这里处理保存逻辑
    setVisible(false);
  };

  return (
    <>
      <Button onClick={() => setVisible(true)}>
        配置智能体模式
      </Button>

      <AgentModeConfigModal
        visible={visible}
        availableSkills={skills}
        onOk={handleSave}
        onCancel={() => setVisible(false)}
      />
    </>
  );
};
```

### 2. 查看完整示例

我已经创建了一个完整的使用示例:

```
src/examples/AgentConfigUsageExample.tsx
```

你可以直接运行这个示例来查看效果:

```tsx
// 在你的路由中添加
import AgentConfigUsageExample from '@/examples/AgentConfigUsageExample';

<Route path="/example" element={<AgentConfigUsageExample />} />
```

### 3. 类型定义说明

#### React模式配置

```typescript
const reactConfig: ReactAgentConfiguration = {
  agent_id: 'agent_001',
  agent_name: '客服助手',
  mode: 'react',
  config: {
    skills: ['skill_001', 'skill_002'], // 技能ID数组
  },
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
};
```

#### Function Call模式配置

```typescript
const fcConfig: FunctionCallAgentConfiguration = {
  agent_id: 'agent_002',
  agent_name: 'API调用器',
  mode: 'function_call',
  config: {
    max_iteration_times: 10, // 1-20之间的整数
  },
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
};
```

### 4. 验证配置

在保存之前验证配置:

```typescript
import { validateModeConfig } from '@/utils/agent-config-validator';

const result = validateModeConfig(formData);

if (!result.valid) {
  // 显示错误
  result.errors.forEach(error => {
    console.error(error.message);
  });
} else {
  // 保存配置
  saveConfig(formData);
}
```

## 文件列表

核心文件:
- ✅ `src/types/agent-config.types.ts` - 类型定义
- ✅ `src/config/agent-mode-config.ts` - 配置常量
- ✅ `src/utils/agent-config-validator.ts` - 验证工具
- ✅ `src/components/AgentModeConfigModal.tsx` - 弹窗组件

示例文件:
- ✅ `src/examples/AgentConfigUsageExample.tsx` - 完整使用示例
- ✅ `src/examples/agent-config-examples.json` - JSON配置示例
- ✅ `src/examples/mode-switch-logic.pseudo.ts` - 逻辑伪代码

文档:
- ✅ `AGENT_MODE_CONFIG_README.md` - 完整文档

## 常见问题

### Q: 如何获取可用的技能列表?

```typescript
// 从你的API获取
const fetchSkills = async () => {
  const response = await fetch('/api/skills');
  const skills = await response.json();
  return skills.map(s => ({ id: s.id, name: s.name }));
};
```

### Q: 如何编辑现有配置?

```typescript
<AgentModeConfigModal
  visible={visible}
  initialConfig={existingConfig} // 传入现有配置
  availableSkills={skills}
  onOk={handleSave}
  onCancel={handleCancel}
/>
```

### Q: 如何处理表单数据转换为后端格式?

```typescript
const handleSave = (formData: ModeConfigFormData) => {
  const apiData = {
    mode: formData.mode,
    ...(formData.mode === 'react' && {
      skills: formData.skills,
    }),
    ...(formData.mode === 'function_call' && {
      max_iteration_times: formData.max_iteration_times,
    }),
  };

  // 发送到后端
  await api.post('/agents/config', apiData);
};
```

## 测试

编译应该现在可以通过了。如果还有错误,请检查:

1. TypeScript版本 >= 5.0
2. Ant Design版本 >= 5.0
3. React版本 >= 18.0

## 下一步

1. 在你的自主规划智能体配置页面中导入 `AgentModeConfigModal` 组件
2. 根据你的实际需求调整样式和交互
3. 连接到你的后端API
4. 根据需要添加更多验证规则

需要帮助? 参考 `src/examples/AgentConfigUsageExample.tsx` 的完整示例。
