# 🚀 快速访问指南

## 📍 所有页面访问链接

### 🏠 后台管理页面

| 页面名称 | 本地访问 | 局域网访问 | 功能说明 |
|---------|---------|-----------|---------|
| 首页 | [http://localhost:3000/#home](http://localhost:3000/#home) | [http://10.253.214.98:3000/#home](http://10.253.214.98:3000/#home) | 后台首页 |
| **Agent列表** | [http://localhost:3000/#agent](http://localhost:3000/#agent) | [http://10.253.214.98:3000/#agent](http://10.253.214.98:3000/#agent) | ⭐ 智能体列表管理 |
| Skill列表 | [http://localhost:3000/#skill](http://localhost:3000/#skill) | [http://10.253.214.98:3000/#skill](http://10.253.214.98:3000/#skill) | 技能管理 |
| 知识库 | [http://localhost:3000/#knowledge](http://localhost:3000/#knowledge) | [http://10.253.214.98:3000/#knowledge](http://10.253.214.98:3000/#knowledge) | 知识库管理 |
| 工作流 | [http://localhost:3000/#workflow](http://localhost:3000/#workflow) | [http://10.253.214.98:3000/#workflow](http://10.253.214.98:3000/#workflow) | 工作流配置 |

### 🤖 Agent相关页面

| 页面类型 | 本地访问 | 局域网访问 | 说明 |
|---------|---------|-----------|-----|
| Agent列表 | [http://localhost:3000/#agent](http://localhost:3000/#agent) | [http://10.253.214.98:3000/#agent](http://10.253.214.98:3000/#agent) | 查看所有Agent |
| **自主规划Agent编辑器** | [http://localhost:3000/#agent-editor?type=autonomous](http://localhost:3000/#agent-editor?type=autonomous) | [http://10.253.214.98:3000/#agent-editor?type=autonomous](http://10.253.214.98:3000/#agent-editor?type=autonomous) | ⭐ 创建单智能体 |
| **多智能体协同Agent** | [http://localhost:3000/#agent-collaborative](http://localhost:3000/#agent-collaborative) | [http://10.253.214.98:3000/#agent-collaborative](http://10.253.214.98:3000/#agent-collaborative) | ⭐ 创建多智能体 |

### 💬 前台用户界面

| 页面名称 | 本地访问 | 局域网访问 | 说明 |
|---------|---------|-----------|-----|
| **前台聊天界面** | [http://localhost:3000/#frontend](http://localhost:3000/#frontend) | [http://10.253.214.98:3000/#frontend](http://10.253.214.98:3000/#frontend) | ⭐ 用户聊天交互 |

### 📄 文档页面

| 文档名称 | 本地访问 | 局域网访问 | 说明 |
|---------|---------|-----------|-----|
| **Skill设计文档** | [http://localhost:8080/skill-design.html](http://localhost:8080/skill-design.html) | [http://10.253.214.98:8080/skill-design.html](http://10.253.214.98:8080/skill-design.html) | ⭐ 精美HTML文档 |

---

## 🎯 核心功能操作流程

### 流程1：创建自主规划Agent

```
步骤1: 访问 http://localhost:3000/#agent
       ↓
步骤2: 点击"创建Agent"按钮
       ↓
步骤3: 选择"🤖 自主规划Agent"
       ↓
步骤4: 进入Agent编辑器 (#agent-editor)
       ↓
步骤5: 配置名称、图标、提示词、Skills
       ↓
步骤6: 点击"保存"和"发布"
```

### 流程2：创建多智能体协同Agent

```
步骤1: 访问 http://localhost:3000/#agent
       ↓
步骤2: 点击"创建Agent"按钮
       ↓
步骤3: 选择"👥 多智能体协同Agent"
       ↓
步骤4: 进入协同配置页面 (#agent-collaborative)
       ↓
步骤5: 配置应用基本信息
       ↓
步骤6: 配置主Agent（规划Agent）
       ↓
步骤7: 点击"+ 添加"添加子Agent
       ↓
步骤8: 配置每个子Agent的启用状态
       ↓
步骤9: 设置开场白和推荐问
       ↓
步骤10: 点击"发布"
```

### 流程3：测试Agent对话

```
步骤1: 访问 http://localhost:3000/#frontend
       ↓
步骤2: 在左侧栏选择智能体或群组
       ↓
步骤3: 在��入框输入消息
       ↓
步骤4: 使用@功能提及特定智能体
       ↓
步骤5: 发送消息并查看回复
```

---

## 📱 移动设备访问

### iPhone/iPad

1. 确保设备连接到同一WiFi
2. 打开Safari浏览器
3. 输入：`http://10.253.214.98:3000/#agent`
4. 添加到主屏幕以便快速访问

### Android手机/平板

1. 确保设备连接到同一WiFi
2. 打开Chrome浏览器
3. 输入：`http://10.253.214.98:3000/#agent`
4. 点击菜单 → "添加到主屏幕"

---

## 🔥 推荐使用路径

### 新用户首次体验：

```
1. 📄 先查看文档
   http://10.253.214.98:8080/skill-design.html
   了解Skill设计理念

2. 🤖 创建第一个Agent
   http://10.253.214.98:3000/#agent
   点击创建，选择"自主规划Agent"

3. 💬 测试对话
   http://10.253.214.98:3000/#frontend
   与你创建的Agent聊天

4. 👥 进阶：创建多智能体
   http://10.253.214.98:3000/#agent-collaborative
   体验多智能体协同
```

### 开发者调试：

```
1. 🏠 后台管理
   http://localhost:3000/#home
   查看整体架构

2. 🔧 Agent配置
   http://localhost:3000/#agent-collaborative
   调试多智能体配置

3. 💬 前台测试
   http://localhost:3000/#frontend
   实时测试功能

4. 📊 查看数据
   打开浏览器开发者工具
   Network标签查看API调用
```

---

## 🌐 二维码访问（可选）

你可以使用在线二维码生成器，将以下链接生成二维码：

**Agent列表页面：**
```
http://10.253.214.98:3000/#agent
```

**前台聊天界面：**
```
http://10.253.214.98:3000/#frontend
```

**多智能体协同：**
```
http://10.253.214.98:3000/#agent-collaborative
```

推荐工具：
- https://www.the-qrcode-generator.com/
- https://qr.io/

---

## 🛠 服务管理

### 启动开发服务器

```bash
# 在项目目录下
cd /Users/apple/Documents/chatgroup

# 启动React应用（端口3000）
npm start

# 启动文档服务器（端口8080，已在后台运行）
# python3 -m http.server 8080
```

### 停止服务

```bash
# 停止React应用
# 在运行npm start的终端按 Ctrl+C

# 停止文档服务器
lsof -ti:8080 | xargs kill
```

### 查看运行状态

```bash
# 查看3000端口
lsof -i:3000

# 查看8080端口
lsof -i:8080
```

---

## 📞 快速分享

复制以下文本发送给同事：

```
🚀 智能体系统访问链接

📋 Agent管理：
http://10.253.214.98:3000/#agent

🤖 创建自主Agent：
http://10.253.214.98:3000/#agent-editor?type=autonomous

👥 创建多智能体协同：
http://10.253.214.98:3000/#agent-collaborative

💬 前台聊天：
http://10.253.214.98:3000/#frontend

📖 设计文档：
http://10.253.214.98:8080/skill-design.html

请确保连接到同一WiFi网络！
```

---

**最后更新**: 2026-01-26
**系统状态**: ✅ 运行中
**本机IP**: 10.253.214.98
