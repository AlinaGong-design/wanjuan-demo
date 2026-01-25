import React, { useState, useRef } from 'react';
import {
  Layout,
  Input,
  Button,
  Dropdown,
  Tag,
  Modal,
  TreeSelect,
  Avatar,
  Badge,
  Spin,
  message
} from 'antd';
import {
  PlusOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SmileOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  DatabaseOutlined,
  UserOutlined,
  PaperClipOutlined,
  EditOutlined,
  PushpinOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { SkillItem } from './Skill';
import MentionEditor, { MentionEditorHandle } from '../components/MentionEditor';
import './Frontend.css';

const { Sider, Content } = Layout;

interface ChatHistory {
  id: string;
  title: string;
  subtitle: string;
  time: string;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FavoriteFile {
  id: string;
  name: string;
  type: 'file';
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
}

interface AgentGroup {
  id: string;
  name: string;
  members: Agent[];
  coordinator?: Agent; // 主智能体（协调者）
  createTime: string;
  pinned?: boolean;
}

interface SubTask {
  id: string;
  taskName: string;
  agentId: string;
  agentName: string;
  agentIcon?: string;
  status: 'pending' | 'dispatched' | 'executing' | 'completed';
  result?: string;
  toolCalls?: ToolCall[];
}

interface CollaborationPlan {
  id: string;
  description: string;
  subTasks: SubTask[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'clarification';
  content: string;
  agentId?: string;
  agentName?: string;
  agentIcon?: string;
  timestamp: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  skillCalls?: string[];
  status?: 'thinking' | 'calling' | 'completed' | 'waiting_clarification' | 'planning' | 'dispatching' | 'executing' | 'integrating';
  clarificationQuestion?: string;
  clarificationOptions?: string[];
  // 多智能体协作相关
  collaborationPlan?: CollaborationPlan;
  subTaskResults?: SubTask[];
  isCollaborationResult?: boolean;
}

interface ToolCall {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  result?: string;
}

interface Conversation {
  id: string;
  title: string;
  type: 'agent' | 'group' | 'mixed';
  agents?: Agent[];
  group?: AgentGroup;
  messages: Message[];
  createTime: string;
  deepThinking?: boolean;
  knowledgeBase?: string[];
  uploadedFiles?: UploadedFile[];
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FrontendProps {
  onBackToAdmin?: () => void;
  selectedSkill?: SkillItem | null;
}

const Frontend: React.FC<FrontendProps> = ({ onBackToAdmin, selectedSkill }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const editorRef = useRef<MentionEditorHandle>(null);
  const conversationEditorRef = useRef<MentionEditorHandle>(null);

  // 群组相关状态
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // 初始化2个静态群组示例
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([
    {
      id: 'group-demo-1',
      name: '行业分析团队',
      members: [
        { id: '1', name: '互联网行业洞察', icon: '🌐', color: '#6366F1', category: '行业分析' },
        { id: '2', name: '石油行业知识问答小助手', icon: '📚', color: '#8B5CF6', category: '行业分析' },
      ],
      createTime: new Date(Date.now() - 86400000).toISOString(),
      pinned: false,
    },
    {
      id: 'group-demo-2',
      name: '编程开发小组',
      members: [
        { id: '3', name: 'Python编程助手', icon: '🐍', color: '#3B82F6', category: '编程开发' },
        { id: '4', name: 'JavaScript专家', icon: '💛', color: '#F59E0B', category: '编程开发' },
        { id: '5', name: '数据分析师', icon: '📊', color: '#10B981', category: '数据分析' },
      ],
      createTime: new Date(Date.now() - 172800000).toISOString(),
      pinned: false,
    }
  ]);

  const [showAllGroups, setShowAllGroups] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<AgentGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionedAgents, setMentionedAgents] = useState<Agent[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // 对话管理相关状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  const [mentionType, setMentionType] = useState<'agent' | 'group' | 'mixed'>('agent');
  const [selectedGroups, setSelectedGroups] = useState<AgentGroup[]>([]);
  const [agentReplyQueue, setAgentReplyQueue] = useState<Agent[]>([]);
  const [currentReplyingAgent, setCurrentReplyingAgent] = useState<Agent | null>(null);
  const [expandedCollaborations, setExpandedCollaborations] = useState<Set<string>>(new Set());

  // 新建对话相关状态
  const [deepThinking, setDeepThinking] = useState(false);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 所有智能体数据（按类别分组）
  const allAgents: Agent[] = [
    { id: '1', name: '互联网行业洞察', icon: '🌐', color: '#6366F1', category: '行业分析' },
    { id: '2', name: '石油行业知识问答小助手', icon: '📚', color: '#8B5CF6', category: '行业分析' },
    { id: '3', name: 'Python编程助手', icon: '🐍', color: '#3B82F6', category: '编程开发' },
    { id: '4', name: 'JavaScript专家', icon: '💛', color: '#F59E0B', category: '编程开发' },
    { id: '5', name: '数据分析师', icon: '📊', color: '#10B981', category: '数据分析' },
    { id: '6', name: 'SQL优化专家', icon: '🗄️', color: '#06B6D4', category: '数据分析' },
    { id: '7', name: '文案写作助手', icon: '✏️', color: '#EC4899', category: '内容创作' },
    { id: '8', name: '翻译助手', icon: '🌍', color: '#8B5CF6', category: '内容创作' },
  ];

  const agents = [
    { id: 1, icon: '🌐', name: '互联网行业洞察', color: '#6366F1' },
    { id: 2, icon: '📚', name: '石油行业知识问答小助手', color: '#8B5CF6' },
  ];

  const mySkills: Skill[] = [
    { id: '1', name: '写作', icon: '✏️', color: '#F59E0B' },
    { id: '2', name: 'PPT', icon: '📊', color: '#EF4444' },
    { id: '3', name: '视频', icon: '🎬', color: '#F97316' },
    { id: '4', name: '设计', icon: '🎨', color: '#EC4899' },
  ];

  const favoriteFiles: FavoriteFile[] = [
    { id: '1', name: '开启你和AI共用的收藏夹.md', type: 'file' },
  ];

  // 构建树形选择器数据
  const getAgentTreeData = () => {
    const categories = Array.from(new Set(allAgents.map(a => a.category)));
    return categories.map(category => ({
      title: category,
      value: `category-${category}`,
      selectable: false,
      children: allAgents
        .filter(a => a.category === category)
        .map(agent => ({
          title: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{agent.icon}</span>
              <span>{agent.name}</span>
            </div>
          ),
          value: agent.id,
        }))
    }));
  };

  // 生成群组的主智能体（协调者）
  const createCoordinatorAgent = (groupName: string, members: Agent[]): Agent => {
    const coordinatorNames = [
      '智能协调助手',
      '任务调度器',
      '协作管理员',
      '项目协调员',
      '团队指挥官'
    ];

    const name = coordinatorNames[Math.floor(Math.random() * coordinatorNames.length)];

    return {
      id: `coordinator-${Date.now()}`,
      name: `${name} (${groupName})`,
      icon: '🎯',
      color: '#EC4899', // 粉红色，区别于其他智能体
      category: '协调管理',
    };
  };

  // 创建群组
  const handleCreateGroup = () => {
    if (selectedAgents.length === 0) {
      return;
    }

    const members = allAgents.filter(a => selectedAgents.includes(a.id));
    const coordinator = createCoordinatorAgent(groupName || `群组${agentGroups.length + 1}`, members);

    const newGroup: AgentGroup = {
      id: `group-${Date.now()}`,
      name: groupName || `群组${agentGroups.length + 1}`,
      members,
      coordinator,
      createTime: new Date().toISOString(),
      pinned: false,
    };

    setAgentGroups([...agentGroups, newGroup]);
    setShowGroupModal(false);
    setGroupName('');
    setSelectedAgents([]);

    // 新建完群组直接进入群组聊天
    handleEnterGroup(newGroup);
    message.success('群组创建成功');
  };

  // 进入群组对话
  const handleEnterGroup = (group: AgentGroup) => {
    setCurrentGroup(group);
    setCurrentConversation(null);
    setMessages([]);
    setAgentReplyQueue([]);
    setCurrentReplyingAgent(null);
  };

  // 重命名群组
  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!newName.trim()) {
      message.warning('群组名称不能为空');
      return;
    }

    setAgentGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, name: newName.trim() } : g
    ));

    if (currentGroup?.id === groupId) {
      setCurrentGroup(prev => prev ? { ...prev, name: newName.trim() } : null);
    }

    setEditingGroupId(null);
    setEditingGroupName('');
    message.success('群组名称已修改');
  };

  // 置顶/取消置顶群组
  const handleTogglePinGroup = (groupId: string) => {
    setAgentGroups(prev => {
      const updated = prev.map(g =>
        g.id === groupId ? { ...g, pinned: !g.pinned } : g
      );
      // 排序：置顶的在前
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
    });

    const group = agentGroups.find(g => g.id === groupId);
    message.success(group?.pinned ? '已取消置顶' : '已置顶');
  };

  // 删除群组
  const handleDeleteGroup = (groupId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个群组吗？删除后无法恢复。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        setAgentGroups(prev => prev.filter(g => g.id !== groupId));

        if (currentGroup?.id === groupId) {
          setCurrentGroup(null);
          setMessages([]);
        }

        message.success('群组已删除');
      },
    });
  };

  // 模拟智能体回复（串行版本）
  const simulateAgentReply = async (agent: Agent, userMessage: string, isLastInQueue: boolean = false) => {
    // Thinking阶段
    const thinkingMsg: Message = {
      id: `msg-${Date.now()}-${agent.id}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在深度思考问题...',
      status: 'thinking',
    };
    setMessages(prev => [...prev, thinkingMsg]);

    // 等待1-2秒（模拟thinking时间）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 偶尔需要澄清（约20%概率）
    const needsClarification = Math.random() < 0.2;

    if (needsClarification) {
      // 显示澄清请求
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsg.id
          ? {
              ...msg,
              status: 'waiting_clarification',
              clarificationQuestion: '为了更好地回答您的问题，我需要确认一下：',
              clarificationOptions: [
                '您希望了解更详细的技术细节',
                '您希望了解实际应用场景',
                '您希望获得最佳实践建议'
              ]
            }
          : msg
      ));

      // 这里实际应该等待用户输入，现在模拟自动选择
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Tool调用阶段
    setMessages(prev => prev.map(msg =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '正在调用工具...',
            toolCalls: [
              { id: 'tool-1', name: 'web_search', status: 'running' },
              { id: 'tool-2', name: 'read_file', status: 'running' }
            ]
          }
        : msg
    ));

    // 等待2-3秒（模拟工具调用时间）
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 完成阶段
    setMessages(prev => prev.map(msg =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'completed',
            content: `我是${agent.name}。针对您的问题"${userMessage}"，经过深度思考和工具调用，我的回答是：\n\n这是一个详细的回答内容，包含了对问题的分析和建议。我已经考虑了多个方面，包括技术实现、最佳实践以及潜在的注意事项。`,
            toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
          }
        : msg
    ));
  };

  // 处理串行回复队列
  const processAgentReplyQueue = async (agents: Agent[], userMessage: string, coordinator?: Agent) => {
    setAgentReplyQueue(agents);

    // 如果有多个智能体，使用协作模式
    if (agents.length > 1) {
      // 使用提供的coordinator或从currentGroup获取
      const mainAgent = coordinator || currentGroup?.coordinator;
      if (mainAgent) {
        await simulateCollaboration(agents, userMessage, mainAgent);
      } else {
        // 如果没有主智能体，使用第一个智能体作为协调者
        await simulateCollaboration(agents, userMessage, agents[0]);
      }
    } else {
      // 单个智能体，使用原有逻辑
      setCurrentReplyingAgent(agents[0]);
      await simulateAgentReply(agents[0], userMessage, true);
    }

    setAgentReplyQueue([]);
    setCurrentReplyingAgent(null);
  };

  // 多智能体协作流程模拟（主群组页面）- 完整流程模式
  const simulateCollaboration = async (agents: Agent[], userMessage: string, coordinator: Agent) => {
    // 使用主智能体作为协调者

    // 1. init_plan - 主智能体初始化计划
    const initPlanMsg: Message = {
      id: `msg-${Date.now()}-init-plan`,
      role: 'assistant',
      content: '',
      agentId: coordinator.id,
      agentName: coordinator.name,
      agentIcon: coordinator.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📋 正在初始化协作计划...',
    };

    setMessages(prev => [...prev, initPlanMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalPlans = Math.min(agents.length, 3); // 最多3轮plan
    setMessages(prev => prev.map(msg =>
      msg.id === initPlanMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📋 **协作计划初始化完成**\n\n我是${coordinator.name}，将协调 ${agents.length} 个专业智能体完成任务。\n\n团队成员：\n${agents.map((a, i) => `${i + 1}. ${a.icon} ${a.name} - ${a.category}`).join('\n')}\n\n将执行 ${totalPlans} 轮协作计划。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 执行多轮plan
    for (let planIndex = 0; planIndex < totalPlans; planIndex++) {
      await executePlanRound(agents, userMessage, planIndex, totalPlans, coordinator);

      // plan之间的间隔
      if (planIndex < totalPlans - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 最终summary - 由主智能体发出
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-final-summary`,
      role: 'assistant',
      content: '',
      agentId: coordinator.id,
      agentName: coordinator.name,
      agentIcon: coordinator.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '🎯 正在生成最终总结...',
    };

    setMessages(prev => [...prev, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1800));

    const finalSummary = `🎯 **最终协作总结**\n\n我是${coordinator.name}，经过 ${totalPlans} 轮协作计划的执行，团队完成了以下工作：\n\n${agents.map((agent, idx) =>
      `**${idx + 1}. ${agent.icon} ${agent.name}**\n   ${generateAgentSummary(agent, userMessage)}`
    ).join('\n\n')}\n\n✨ 所有任务已完成，我已完成协调工作。建议您根据以上分析采取行动。`;

    setMessages(prev => prev.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: finalSummary,
          }
        : msg
    ));
  };

  // 执行单轮plan
  const executePlanRound = async (
    agents: Agent[],
    userMessage: string,
    planIndex: number,
    totalPlans: number,
    thinker: Agent
  ) => {
    // 2. thinker - 思考阶段
    const thinkerMsg: Message = {
      id: `msg-${Date.now()}-thinker-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🤔 正在思考第 ${planIndex + 1}/${totalPlans} 轮计划...`,
    };

    setMessages(prev => [...prev, thinkerMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 确定这一轮需要哪些sub_agent
    const subAgentsForThisRound = agents.slice(
      planIndex % agents.length,
      Math.min((planIndex % agents.length) + 2, agents.length)
    );
    if (subAgentsForThisRound.length === 0) {
      subAgentsForThisRound.push(agents[planIndex % agents.length]);
    }

    // 生成更详细的思考内容
    const thinkingDetails = [
      `📌 **问题分析**：收到用户需求"${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"`,
      `🎯 **任务拆解**：本轮计划将任务分解为${subAgentsForThisRound.length}个并行子任务`,
      `👥 **智能体分配**：`,
      ...subAgentsForThisRound.map((agent, idx) =>
        `   ${idx + 1}. @${agent.name} - 负责${agent.category}相关工作`
      ),
      ``,
      `✅ 开始执行第 ${planIndex + 1}/${totalPlans} 轮协作！`
    ];

    const planContent = thinkingDetails.join('\n');

    setMessages(prev => prev.map(msg =>
      msg.id === thinkerMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: planContent,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 3 & 4. sub_agent 和 sub_agent_summary - 串行执行
    for (let i = 0; i < subAgentsForThisRound.length; i++) {
      const subAgent = subAgentsForThisRound[i];

      // sub_agent 执行
      await executeSubAgent(subAgent, userMessage, planIndex, i);

      await new Promise(resolve => setTimeout(resolve, 500));

      // sub_agent_summary
      await executeSubAgentSummary(subAgent, userMessage, planIndex, i);

      // 子智能体之间的间隔
      if (i < subAgentsForThisRound.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 5. 当前plan执行完成检查
    const planCompleteMsg: Message = {
      id: `msg-${Date.now()}-plan-complete-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '✅ 检查当前plan执行状态...',
    };

    setMessages(prev => [...prev, planCompleteMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setMessages(prev => prev.map(msg =>
      msg.id === planCompleteMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `✅ **第 ${planIndex + 1} 轮计划执行完成**\n\n已完成 ${subAgentsForThisRound.length} 个子任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    // 6. plan_status - 检查整体进度
    const planStatusMsg: Message = {
      id: `msg-${Date.now()}-plan-status-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📊 正在检查整体计划状态...',
    };

    setMessages(prev => [...prev, planStatusMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const progress = Math.round(((planIndex + 1) / totalPlans) * 100);
    const isAllComplete = planIndex === totalPlans - 1;

    setMessages(prev => prev.map(msg =>
      msg.id === planStatusMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📊 **整体进度：${progress}%**\n\n已完成 ${planIndex + 1}/${totalPlans} 轮计划\n${isAllComplete ? '✅ 所有计划已执行完成！' : '⏳ 继续执行下一轮...'}`,
          }
        : msg
    ));
  };

  // 执行sub_agent
  const executeSubAgent = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number
  ) => {
    const subAgentMsg: Message = {
      id: `msg-${Date.now()}-subagent-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🔧 正在执行子任务...`,
    };

    setMessages(prev => [...prev, subAgentMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Tool调用
    const toolCalls: ToolCall[] = [
      { id: `tool-${subAgentMsg.id}`, name: getRandomTool(agent.name), status: 'running' },
    ];

    setMessages(prev => prev.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '🛠️ 调用工具中...',
            toolCalls,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateSubTaskResult(agent, userMessage);
    const completedToolCalls = toolCalls.map(t => ({ ...t, status: 'completed' as const }));

    setMessages(prev => prev.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `🔧 **子任务执行结果**\n\n${result}`,
            toolCalls: completedToolCalls,
          }
        : msg
    ));
  };

  // 执行sub_agent_summary
  const executeSubAgentSummary = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number
  ) => {
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-subagent-summary-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📝 正在总结分析结果...',
    };

    setMessages(prev => [...prev, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = `📝 **我的分析总结**\n\n${generateAgentSummary(agent, userMessage)}\n\n关键发现已记录，供后续决策参考。`;

    setMessages(prev => prev.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: summary,
          }
        : msg
    ));
  };

  // 发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    // 更新当前对话的消息
    if (currentConversation) {
      setCurrentConversation({
        ...currentConversation,
        messages: [...currentConversation.messages, userMsg]
      });
      setConversations(prev => prev.map(conv =>
        conv.id === currentConversation.id
          ? { ...conv, messages: [...conv.messages, userMsg] }
          : conv
      ));

      // 让被@的智能体串行回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentConversation.agents || currentConversation.group?.members.slice(0, 1) || [];

      // 使用串行回复处理
      processAgentReplyQueueInConversation(agentsToReply, inputValue, currentConversation.id);
    } else if (currentGroup) {
      // 在群组中发送消息
      setMessages(prev => [...prev, userMsg]);

      // 让被@的智能体串行回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentGroup?.members.slice(0, 1) || [];

      // 使用异步串行处理
      processAgentReplyQueue(agentsToReply, inputValue);
    } else {
      // 新建对话场景：根据@的智能体和群组自动创建
      const allMentionedAgents = [...mentionedAgents];

      // 收集所有被@的群组中的智能体
      selectedGroups.forEach(group => {
        group.members.forEach(member => {
          if (!allMentionedAgents.find(a => a.id === member.id)) {
            allMentionedAgents.push(member);
          }
        });
      });

      if (allMentionedAgents.length === 0) {
        message.warning('请先@智能体或群组');
        return;
      }

      // 如果@了多个智能体或者@了群组，自动创建群组并进入群组聊天
      if (allMentionedAgents.length > 1 || selectedGroups.length > 0) {
        // 生成群组名称
        const groupName = selectedGroups.length > 0
          ? `${selectedGroups.map(g => g.name).join('+')}${mentionedAgents.length > 0 ? '+' + mentionedAgents.map(a => a.name).join('+') : ''}`
          : allMentionedAgents.map(a => a.name).join('+');

        const finalGroupName = groupName.length > 30 ? `协作群组${agentGroups.length + 1}` : groupName;

        // 创建主智能体
        const coordinator = createCoordinatorAgent(finalGroupName, allMentionedAgents);

        // 创建新群组
        const newGroup: AgentGroup = {
          id: `group-${Date.now()}`,
          name: finalGroupName,
          members: allMentionedAgents,
          coordinator,
          createTime: new Date().toISOString(),
          pinned: false,
        };

        // 添加到群组列表
        setAgentGroups(prev => [...prev, newGroup]);

        // 进入群组聊天
        setCurrentGroup(newGroup);
        setMessages([userMsg]);
        setAgentReplyQueue([]);
        setCurrentReplyingAgent(null);

        // 启动协作流程（由主智能体协调）
        processAgentReplyQueue(allMentionedAgents, inputValue, coordinator);

        message.success(`已自动创建群组"${newGroup.name}"，主智能体"${coordinator.name}"已就位`);
      } else {
        // 只@了一个智能体，创建单聊对话
        const agent = allMentionedAgents[0];
        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          title: `与${agent.name}的���话`,
          type: 'agent',
          agents: [agent],
          messages: [userMsg],
          createTime: new Date().toISOString(),
        };

        setConversations(prev => [...prev, newConversation]);
        setCurrentConversation(newConversation);

        // 让智能体回复
        simulateAgentReplyInConversation(agent, inputValue, newConversation.id);

        message.success(`已创建与${agent.name}的对话`);
      }
    }

    setInputValue('');
    setMentionedAgents([]);
    setSelectedGroups([]);
  };

  // 处理对话中的串行回复队列
  const processAgentReplyQueueInConversation = async (agents: Agent[], userMessage: string, conversationId: string) => {
    // 如果有多个智能体，使用协作模式
    if (agents.length > 1) {
      await simulateCollaborationInConversation(agents, userMessage, conversationId);
    } else {
      // 单个智能体，使用原有逻辑
      await simulateAgentReplyInConversation(agents[0], userMessage, conversationId);
    }
  };

  // 多智能体协作流程模拟 - 完整流程模式（对话场景）
  const simulateCollaborationInConversation = async (agents: Agent[], userMessage: string, conversationId: string) => {
    const thinker = agents[0];

    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    // 1. init_plan
    const initPlanMsg: Message = {
      id: `msg-${Date.now()}-init-plan`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📋 正在初始化协作计划...',
    };

    updateConversation(msgs => [...msgs, initPlanMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalPlans = Math.min(agents.length, 3);
    updateConversation(msgs => msgs.map(msg =>
      msg.id === initPlanMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📋 **协作计划初始化完成**\n\n将执行 ${totalPlans} 轮协作计划，每轮由不同智能体负责特定任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // 执行多轮plan
    for (let planIndex = 0; planIndex < totalPlans; planIndex++) {
      await executePlanRoundInConversation(agents, userMessage, planIndex, totalPlans, thinker, conversationId);

      if (planIndex < totalPlans - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // 最终summary
    const summaryMsg: Message = {
      id: `msg-${Date.now()}-final-summary`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '🎯 正在生成最终总结...',
    };

    updateConversation(msgs => [...msgs, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1800));

    const finalSummary = `🎯 **最终协作总结**\n\n经过 ${totalPlans} 轮协作计划的执行，团队完成了以下工作：\n\n${agents.map((agent, idx) =>
      `**${idx + 1}. ${agent.name}**\n   ${generateAgentSummary(agent, userMessage)}`
    ).join('\n\n')}\n\n✨ 所有任务已完成，建议您根据以上分析采取行动。`;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: finalSummary,
          }
        : msg
    ));
  };

  // 执行单轮plan（对话场景）
  const executePlanRoundInConversation = async (
    agents: Agent[],
    userMessage: string,
    planIndex: number,
    totalPlans: number,
    thinker: Agent,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    // thinker
    const thinkerMsg: Message = {
      id: `msg-${Date.now()}-thinker-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🤔 正在思考第 ${planIndex + 1}/${totalPlans} 轮计划...`,
    };

    updateConversation(msgs => [...msgs, thinkerMsg]);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const subAgentsForThisRound = agents.slice(
      planIndex % agents.length,
      Math.min((planIndex % agents.length) + 2, agents.length)
    );
    if (subAgentsForThisRound.length === 0) {
      subAgentsForThisRound.push(agents[planIndex % agents.length]);
    }

    // 生成更详细的思考内容
    const thinkingDetails = [
      `📌 **问题分析**：收到用户需求"${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}"`,
      `🎯 **任务拆解**：本轮计划将任务分解为${subAgentsForThisRound.length}个并行子任务`,
      `👥 **智能体分配**：`,
      ...subAgentsForThisRound.map((agent, idx) =>
        `   ${idx + 1}. @${agent.name} - 负责${agent.category}相关工作`
      ),
      ``,
      `✅ 开始执行第 ${planIndex + 1}/${totalPlans} 轮协作！`
    ];

    const planContent = thinkingDetails.join('\n');

    updateConversation(msgs => msgs.map(msg =>
      msg.id === thinkerMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: planContent,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 800));

    // sub_agent 和 sub_agent_summary
    for (let i = 0; i < subAgentsForThisRound.length; i++) {
      const subAgent = subAgentsForThisRound[i];

      await executeSubAgentInConversation(subAgent, userMessage, planIndex, i, conversationId);
      await new Promise(resolve => setTimeout(resolve, 500));
      await executeSubAgentSummaryInConversation(subAgent, userMessage, planIndex, i, conversationId);

      if (i < subAgentsForThisRound.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    // plan完成检查
    const planCompleteMsg: Message = {
      id: `msg-${Date.now()}-plan-complete-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '✅ 检查当前plan执行状态...',
    };

    updateConversation(msgs => [...msgs, planCompleteMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    updateConversation(msgs => msgs.map(msg =>
      msg.id === planCompleteMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `✅ **第 ${planIndex + 1} 轮计划执行完成**\n\n已完成 ${subAgentsForThisRound.length} 个子任务。`,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 600));

    // plan_status
    const planStatusMsg: Message = {
      id: `msg-${Date.now()}-plan-status-${planIndex}`,
      role: 'assistant',
      content: '',
      agentId: thinker.id,
      agentName: thinker.name,
      agentIcon: thinker.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📊 正在检查整体计划状态...',
    };

    updateConversation(msgs => [...msgs, planStatusMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const progress = Math.round(((planIndex + 1) / totalPlans) * 100);
    const isAllComplete = planIndex === totalPlans - 1;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === planStatusMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `📊 **整体进度：${progress}%**\n\n已完成 ${planIndex + 1}/${totalPlans} 轮计划\n${isAllComplete ? '✅ 所有计划已执行完成！' : '⏳ 继续执行下一轮...'}`,
          }
        : msg
    ));
  };

  // 执行sub_agent（对话场景）
  const executeSubAgentInConversation = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    const subAgentMsg: Message = {
      id: `msg-${Date.now()}-subagent-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: `🔧 正在执行子任务...`,
    };

    updateConversation(msgs => [...msgs, subAgentMsg]);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const toolCalls: ToolCall[] = [
      { id: `tool-${subAgentMsg.id}`, name: getRandomTool(agent.name), status: 'running' },
    ];

    updateConversation(msgs => msgs.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'calling',
            thinking: '🛠️ 调用工具中...',
            toolCalls,
          }
        : msg
    ));

    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateSubTaskResult(agent, userMessage);
    const completedToolCalls = toolCalls.map(t => ({ ...t, status: 'completed' as const }));

    updateConversation(msgs => msgs.map(msg =>
      msg.id === subAgentMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: `🔧 **子任务执行结果**\n\n${result}`,
            toolCalls: completedToolCalls,
          }
        : msg
    ));
  };

  // 执行sub_agent_summary（对话场景）
  const executeSubAgentSummaryInConversation = async (
    agent: Agent,
    userMessage: string,
    planIndex: number,
    subIndex: number,
    conversationId: string
  ) => {
    const updateConversation = (updater: (messages: Message[]) => Message[]) => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: updater(conv.messages) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: updater(prev.messages)
      } : null);
    };

    const summaryMsg: Message = {
      id: `msg-${Date.now()}-subagent-summary-${planIndex}-${subIndex}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      status: 'thinking',
      thinking: '📝 正在总结分析结果...',
    };

    updateConversation(msgs => [...msgs, summaryMsg]);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const summary = `📝 **我的分析总结**\n\n${generateAgentSummary(agent, userMessage)}\n\n关键发现已记录，供后续决策参考。`;

    updateConversation(msgs => msgs.map(msg =>
      msg.id === summaryMsg.id
        ? {
            ...msg,
            status: 'completed',
            thinking: undefined,
            content: summary,
          }
        : msg
    ));
  };

  // 生成子任务结果
  const generateSubTaskResult = (agent: Agent, userMessage: string): string => {
    const results: Record<string, string[]> = {
      '数据分析师': [
        '📊 数据分析结果：\n- Q3用户活跃度提升12%\n- 付费转化率达到8.5%\n- 用户平均停留时长增加至25分钟',
        '📈 关键指标分析：\n- 新增用户量：15,234人（环比+18%）\n- 流失率降低至3.2%\n- 核心功能使用率提升至67%',
        '🎯 数据洞察：\n- 主要增长来源：社交媒体推广\n- 高价值用户占比上升至23%\n- 周末活跃度明显高于工作日'
      ],
      '文案助手': [
        '✍️ 文案方案A：\n「数据会说话！Q3成绩单来了📊 用户活跃度飙升12%，你还不来体验？限时福利等你拿！」',
        '💡 创意文案B：\n「这个季度，我们一起创造了奇迹✨ 15,000+新伙伴加入，付费转化率破新高！感谢有你🙏」',
        '🎨 营销建议：\n- 标题突出数据亮点\n- 配图使用对比图表\n- CTA设置限时优惠'
      ],
      'Python编程助手': [
        '🐍 代码实现方案：\n```python\ndef analyze_user_data():\n    # 数据清洗\n    df = clean_data(raw_data)\n    # 统计分析\n    return df.groupby("date").agg(metrics)\n```',
        '⚡ 性能优化建议：\n- 使用pandas进行批量处理\n- 采用异步IO提升效率\n- 缓存中间结果减少重复计算',
        '🔧 技术方案：\n- 数据库：PostgreSQL\n- 分析工具：Pandas + NumPy\n- 可视化：Matplotlib'
      ],
      'JavaScript专家': [
        '💛 前端实现方案：\n```js\nconst fetchData = async () => {\n  const res = await api.get("/analytics")\n  return processChartData(res.data)\n}\n```',
        '🚀 性能优化：\n- 使用React.memo减少重渲染\n- 实现虚拟滚动提升列表性能\n- 代码分割降低首屏加载时间',
        '🎯 用户体验优化：\n- 添加骨架屏加载\n- 实现数据实时更新\n- 优化移动端适配'
      ],
      '互联网行业洞察': [
        '🌐 行业趋势分析：\n- AI驱动成为主流\n- 垂直领域深耕成趋势\n- 用户体验成核心竞争力',
        '📱 市场机会：\n- 短视频+电商融合\n- 企业数字化转型加速\n- 下沉市场潜力巨大',
        '💼 竞争格局：\n- 头部平台占据70%市场\n- 细分赛道涌现新玩家\n- 技术壁垒愈发重要'
      ],
      '石油行业知识问答小助手': [
        '🛢️ 行业知识：\n- 原油价格受地缘政治影响大\n- 新能源转型加速行业变革\n- 炼化一体化成发展方向',
        '📊 市场分析：\n- 国际油价震荡区间：70-90美元/桶\n- 国内成品油需求稳中有升\n- 天然气消费量持续增长',
        '⚙️ 技术进展：\n- 页岩油开采技术成熟\n- 碳捕捉技术商业化探索\n- 智慧油田建设加速'
      ],
    };

    const agentResults = results[agent.name] || [
      `✅ 完成了${agent.category}领域的专业分析`,
      `📋 针对"${userMessage}"提供了详细建议`,
      `🎯 输出了可执行的行动方案`
    ];

    // 随机选择一个结果
    return agentResults[Math.floor(Math.random() * agentResults.length)];
  };

  // 生成智能体总结
  const generateAgentSummary = (agent: Agent, userMessage: string): string => {
    const summaries: Record<string, string[]> = {
      '数据分析师': [
        '完成数据清洗与分析，识别出3个关键增长指标，为决策提供数据支撑',
        '��过多维度数据对比，发现用户行为的核心规律，输出可视化报告',
        '建立了数据监控看板，实现关键指标的实时追踪与预警'
      ],
      '文案助手': [
        '撰写了3版营销文案，覆盖不同渠道和用户群体，预期转化率提升15%',
        '优化了品牌传播话术，突出数据亮点，增强用户信任感',
        '制定了内容营销日历，规划了未来30天的传播节奏'
      ],
      'Python编程助手': [
        '实现了自动化数据处理脚本，将分析效率提升80%',
        '搭建了数据分析pipeline，支持增量数据的实时处理',
        '优化了算法性能，将计算时间从5分钟缩短至30秒'
      ],
      'JavaScript专家': [
        '完成前端数据可视化组件，支持交互式图表展示',
        '优化了页面加载性能，首屏渲染时间降低至1.2秒',
        '实现了响应式设计，确保移动端用户体验'
      ],
      '互联网行业洞察': [
        '分析了行业top10竞品策略，找到3个差异化机会点',
        '预测了未来6个月的市场趋势，为产品规划提供方向',
        '识别了2个高潜力细分市场，建议优先布局'
      ],
      '石油行业知识问答小助手': [
        '提供了行业专业知识支持，解答了技术难点',
        '分析了油价波动因素，给出了成本优化建议',
        '梳理了行业政策变化，识别合规风险点'
      ],
    };

    const agentSummaries = summaries[agent.name] || [
      `完成了${agent.category}领域的深度分析`,
      `为"${userMessage.substring(0, 20)}..."提供了专业建议`,
      `输出了可落地的执行方案`
    ];

    return agentSummaries[Math.floor(Math.random() * agentSummaries.length)];
  };

  // 获取随机工具名称（智能体特定）
  const getRandomTool = (agentName?: string): string => {
    const toolsByAgent: Record<string, string[]> = {
      '数据分析师': ['database_query', 'data_analysis', 'sql_execute', 'excel_processor'],
      '文案助手': ['web_search', 'content_analyzer', 'trend_monitor', 'keyword_extractor'],
      'Python编程助手': ['code_execution', 'pip_install', 'jupyter_notebook', 'pytest_runner'],
      'JavaScript专家': ['npm_install', 'webpack_build', 'eslint_check', 'browser_test'],
      '互联网行业洞察': ['web_search', 'news_aggregator', 'market_analyzer', 'competitor_tracker'],
      '石油行业知识问答小助手': ['knowledge_base', 'industry_report', 'price_monitor', 'regulatory_check'],
    };

    const agentTools = agentName && toolsByAgent[agentName]
      ? toolsByAgent[agentName]
      : ['web_search', 'read_file', 'database_query', 'api_call', 'data_analysis', 'code_execution'];

    return agentTools[Math.floor(Math.random() * agentTools.length)];
  };

  // 在对话中模拟智能体回复（异步串行版本）
  const simulateAgentReplyInConversation = async (agent: Agent, userMessage: string, conversationId: string) => {
    // Thinking阶段
    const thinkingMsg: Message = {
      id: `msg-${Date.now()}-${agent.id}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在深度思考问题...',
      status: 'thinking',
    };

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, thinkingMsg] }
        : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: [...prev.messages, thinkingMsg] } : null);

    // 等待1-2秒（模拟thinking时间）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 偶尔需要澄清（约20%概率）
    const needsClarification = Math.random() < 0.2;

    if (needsClarification) {
      // 显示澄清请求
      const updateWithClarification = (msg: Message) =>
        msg.id === thinkingMsg.id
          ? {
              ...msg,
              status: 'waiting_clarification' as const,
              clarificationQuestion: '为了更好地回答您的问题，我需要确认一下：',
              clarificationOptions: [
                '您希望了解更详细的技术细节',
                '您希望了解实际应用场景',
                '您希望获得最佳实践建议'
              ]
            }
          : msg;

      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: conv.messages.map(updateWithClarification) }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(updateWithClarification)
      } : null);

      // 这里实际应该等待用户输入，现在模拟自动选择
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Tool调用阶段
    const updateWithToolCalls = (msg: Message) =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'calling' as const,
            thinking: '正在调用工具...',
            toolCalls: [
              { id: 'tool-1', name: 'web_search', status: 'running' as const },
              { id: 'tool-2', name: 'read_file', status: 'running' as const }
            ]
          }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: conv.messages.map(updateWithToolCalls) }
        : conv
    ));
    setCurrentConversation(prev => prev ? {
      ...prev,
      messages: prev.messages.map(updateWithToolCalls)
    } : null);

    // 等待2-3秒（模拟工具调用时间）
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 完成阶段
    const updateWithCompletion = (msg: Message) =>
      msg.id === thinkingMsg.id
        ? {
            ...msg,
            status: 'completed' as const,
            content: `我是${agent.name}。针对您的问题"${userMessage}"，经过深度思考和工具调用，我的回答是：\n\n这是一个详细的回答内容，包含了对问题的分析和建议。我已经考虑了多个方面，包括技术实现、最佳实践以及潜在的注意事项。`,
            toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
          }
        : msg;

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: conv.messages.map(updateWithCompletion) }
        : conv
    ));
    setCurrentConversation(prev => prev ? {
      ...prev,
      messages: prev.messages.map(updateWithCompletion)
    } : null);
  };

  // 创建新对话（从欢迎界面）
  const handleCreateConversation = () => {
    if (!inputValue.trim()) return;

    // 确定对话类型和参与者
    let conversationType: 'agent' | 'group' | 'mixed' = 'mixed';
    let conversationAgents: Agent[] = [];
    let conversationGroup: AgentGroup | undefined = undefined;

    if (selectedGroups.length > 0 && mentionedAgents.length === 0) {
      // 只有群组
      conversationType = 'group';
      conversationGroup = selectedGroups[0];
      conversationAgents = selectedGroups.flatMap(g => g.members);
    } else if (selectedGroups.length === 0 && mentionedAgents.length > 0) {
      // 只有智能体
      conversationType = 'agent';
      conversationAgents = mentionedAgents;
    } else if (selectedGroups.length > 0 && mentionedAgents.length > 0) {
      // 混合
      conversationType = 'mixed';
      conversationAgents = [...mentionedAgents, ...selectedGroups.flatMap(g => g.members)];
      // 去重
      conversationAgents = conversationAgents.filter((agent, index, self) =>
        index === self.findIndex(a => a.id === agent.id)
      );
    }

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : ''),
      type: conversationType,
      agents: conversationAgents,
      group: conversationGroup,
      messages: [],
      createTime: new Date().toISOString(),
      deepThinking,
      knowledgeBase: selectedKnowledgeBase,
      uploadedFiles
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);

    // 发送第一条消息
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    newConversation.messages.push(userMsg);
    setConversations(prev => prev.map(conv =>
      conv.id === newConversation.id ? newConversation : conv
    ));

    // 让被@的智能体回复
    const agentsToReply = conversationAgents.slice(0, 10);
    agentsToReply.forEach((agent, index) => {
      setTimeout(() => {
        simulateAgentReplyInConversation(agent, inputValue, newConversation.id);
      }, index * 500);
    });

    // 重置状态
    setInputValue('');
    setMentionedAgents([]);
    setSelectedGroups([]);
    setDeepThinking(false);
    setSelectedKnowledgeBase([]);
    setUploadedFiles([]);
  };

  // 新建对话按钮处理
  const handleNewConversation = () => {
    setCurrentConversation(null);
    setCurrentGroup(null);
    setMessages([]);
    setMentionedAgents([]);
    setSelectedGroups([]);
    setInputValue('');
  };

  // 文件上传处理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: UploadedFile[] = Array.from(files).map(file => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // 选择群组
  const handleSelectGroup = (group: AgentGroup) => {
    if (!selectedGroups.find(g => g.id === group.id)) {
      setSelectedGroups([...selectedGroups, group]);
    }
    setShowMentionPanel(false);
  };

  // 选择智能体（新建对话）
  const handleSelectAgent = (agent: Agent) => {
    if (mentionedAgents.length >= 10) return;
    if (!mentionedAgents.find(a => a.id === agent.id)) {
      setMentionedAgents([...mentionedAgents, agent]);
    }
    setShowMentionPanel(false);
  };

  const handleSkillSelect = (skillName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const newValue = beforeAt + '@' + skillName + ' ';

    setInputValue(newValue);
    setShowSkillsPanel(false);

    // Focus back to editor
    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  const handleFileSelect = (fileName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const newValue = beforeAt + '@' + fileName + ' ';

    setInputValue(newValue);
    setShowSkillsPanel(false);

    setTimeout(() => {
      editorRef.current?.focus();
    }, 100);
  };

  const chatHistory: ChatHistory[] = [
    { id: '1', title: '你好', subtitle: '互联网行业洞察', time: '2小时' },
    { id: '2', title: '你好', subtitle: '互联网行业洞察', time: '2小时' },
    { id: '3', title: '你好，你能帮我干什么', subtitle: '系统内置自定义智能体', time: '2小时' },
    { id: '4', title: '文档中内容', subtitle: '系统内置自定义智能体', time: '昨天' },
    { id: '5', title: '天气小知识', subtitle: 'gzlxcz我找', time: '昨天' },
    { id: '6', title: '图片中内容', subtitle: '系统内置自定义智能体', time: '昨天' },
    { id: '7', title: '图片中内容', subtitle: '系统内置自定义智能体', time: '昨天' },
    { id: '8', title: '新会话', subtitle: '系统内置自定义智能体', time: '昨天' },
    { id: '9', title: '你好', subtitle: '', time: '' },
  ];

  const modelMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'GLM-4-Flash-250414',
    },
    {
      key: '2',
      label: 'GPT-4',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        collapsedWidth={0}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto'
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Q
              </div>
              {!collapsed && <span style={{ fontSize: '18px', fontWeight: 'bold' }}>万卷</span>}
            </div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ padding: '4px' }}
            />
          </div>

          {!collapsed && (
            <>
              <Button
                type="default"
                icon={<PlusOutlined />}
                block
                style={{
                  marginBottom: '12px',
                  height: '40px',
                  borderRadius: '8px',
                  borderColor: '#d9d9d9'
                }}
                onClick={handleNewConversation}
              >
                新建对话
              </Button>

              <Button
                type="default"
                icon={<TeamOutlined />}
                block
                style={{
                  marginBottom: '24px',
                  height: '40px',
                  borderRadius: '8px',
                  borderColor: '#d9d9d9'
                }}
                onClick={() => setShowGroupModal(true)}
              >
                新建群组
              </Button>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>智能体中心</div>
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '20px' }}>{agent.icon}</span>
                    <span style={{ fontSize: '14px' }}>{agent.name}</span>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📦</span>
                    <span style={{ fontSize: '14px' }}>查看更多</span>
                  </div>
                  <span>›</span>
                </div>
              </div>

              {/* 群组列表 */}
              {agentGroups.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>我的群组</span>
                    <Badge count={agentGroups.length} style={{ backgroundColor: '#6366F1' }} />
                  </div>
                  {agentGroups.slice(0, showAllGroups ? undefined : 5).map(group => (
                    <div
                      key={group.id}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: currentGroup?.id === group.id ? '1px solid #6366F1' : '1px solid transparent',
                        background: currentGroup?.id === group.id ? '#F0F0FF' : 'transparent',
                        transition: 'all 0.3s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (currentGroup?.id !== group.id) {
                          e.currentTarget.style.background = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentGroup?.id !== group.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {group.pinned && <PushpinOutlined style={{ color: '#6366F1', fontSize: '12px' }} />}
                        <TeamOutlined style={{ color: '#6366F1' }} />
                        {editingGroupId === group.id ? (
                          <Input
                            size="small"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onPressEnter={() => handleRenameGroup(group.id, editingGroupName)}
                            onBlur={() => handleRenameGroup(group.id, editingGroupName)}
                            autoFocus
                            style={{ flex: 1, fontSize: '14px' }}
                          />
                        ) : (
                          <span
                            onClick={() => handleEnterGroup(group)}
                            style={{ fontSize: '14px', fontWeight: 500, flex: 1 }}
                          >
                            {group.name}
                          </span>
                        )}
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'rename',
                                icon: <EditOutlined />,
                                label: '重命名',
                                onClick: () => {
                                  setEditingGroupId(group.id);
                                  setEditingGroupName(group.name);
                                }
                              },
                              {
                                key: 'pin',
                                icon: <PushpinOutlined />,
                                label: group.pinned ? '取消置顶' : '置顶',
                                onClick: () => handleTogglePinGroup(group.id)
                              },
                              {
                                type: 'divider'
                              },
                              {
                                key: 'delete',
                                icon: <DeleteOutlined />,
                                label: '删除群组',
                                danger: true,
                                onClick: () => handleDeleteGroup(group.id)
                              }
                            ]
                          }}
                          trigger={['click']}
                        >
                          <EllipsisOutlined
                            style={{ fontSize: '16px', color: '#999', cursor: 'pointer' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        {group.members.slice(0, 3).map(member => (
                          <span key={member.id} style={{ fontSize: '16px' }}>{member.icon}</span>
                        ))}
                        {group.members.length > 3 && (
                          <span style={{ fontSize: '12px', color: '#999' }}>+{group.members.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {agentGroups.length > 5 && (
                    <div
                      onClick={() => setShowAllGroups(!showAllGroups)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#6366F1',
                        fontSize: '14px'
                      }}
                    >
                      {showAllGroups ? '收起' : `查看全部 (${agentGroups.length})`}
                    </div>
                  )}
                </div>
              )}

              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>历史对话</span>
                  <ReloadOutlined style={{ fontSize: '12px', color: '#999', cursor: 'pointer' }} />
                </div>
                <div style={{ maxHeight: 'calc(100vh - 500px)', overflowY: 'auto' }}>
                  {chatHistory.map(chat => (
                    <div
                      key={chat.id}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontSize: '14px', marginBottom: '4px', color: '#333' }}>{chat.title}</div>
                      {chat.subtitle && (
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {chat.time && `${chat.time} · `}{chat.subtitle}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div
                onClick={onBackToAdmin}
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  padding: '12px',
                  borderTop: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <SmileOutlined style={{ fontSize: '16px' }} />
                <span style={{ fontSize: '14px' }}>智能体管理</span>
              </div>
            </>
          )}
        </div>
      </Sider>

      <Layout style={{ background: '#fafafa' }}>
        {collapsed && (
          <Button
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={() => setCollapsed(false)}
            style={{
              position: 'fixed',
              left: '16px',
              top: '16px',
              zIndex: 1000
            }}
          />
        )}

        <Content style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: currentGroup || currentConversation ? 'flex-start' : 'center',
          padding: '24px',
          minHeight: '100vh'
        }}>
          {/* 对话界面（包括群组对话和普通对话） */}
          {(currentGroup || currentConversation) ? (
            <div style={{ width: '100%', maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* 对话头部 */}
              <div style={{
                padding: '16px',
                background: '#fff',
                borderRadius: '12px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {currentGroup || currentConversation?.type === 'group' ? (
                      <>
                        <TeamOutlined style={{ fontSize: '24px', color: '#6366F1' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            {currentGroup?.name || currentConversation?.group?.name}
                            {currentGroup?.pinned && (
                              <PushpinOutlined style={{ marginLeft: '8px', fontSize: '14px', color: '#6366F1' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {(currentGroup?.members.length || currentConversation?.group?.members.length || 0)} 个成员
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <UserOutlined style={{ fontSize: '24px', color: '#6366F1' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            {currentConversation?.title || '对话'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            {currentConversation?.agents?.length || 0} 个智能体
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* 群组操作菜单 */}
                    {currentGroup && (
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'rename',
                              icon: <EditOutlined />,
                              label: '重命名群组',
                              onClick: () => {
                                Modal.confirm({
                                  title: '重命名群组',
                                  content: (
                                    <Input
                                      placeholder="输入新的群组名称"
                                      defaultValue={currentGroup.name}
                                      id="rename-group-input"
                                    />
                                  ),
                                  okText: '确认',
                                  cancelText: '取消',
                                  onOk: () => {
                                    const input = document.getElementById('rename-group-input') as HTMLInputElement;
                                    if (input?.value.trim()) {
                                      handleRenameGroup(currentGroup.id, input.value);
                                    }
                                  }
                                });
                              }
                            },
                            {
                              key: 'pin',
                              icon: <PushpinOutlined />,
                              label: currentGroup.pinned ? '取消置顶' : '置顶群组',
                              onClick: () => handleTogglePinGroup(currentGroup.id)
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'delete',
                              icon: <DeleteOutlined />,
                              label: '删除群组',
                              danger: true,
                              onClick: () => handleDeleteGroup(currentGroup.id)
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button icon={<EllipsisOutlined />}>管理</Button>
                      </Dropdown>
                    )}
                    <Button onClick={() => {
                      setCurrentConversation(null);
                      setCurrentGroup(null);
                      setAgentReplyQueue([]);
                      setCurrentReplyingAgent(null);
                    }}>退出对话</Button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {(currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || []).map(member => (
                    <Tag key={member.id} style={{ padding: '4px 12px', borderRadius: '12px' }}>
                      <span style={{ marginRight: '4px' }}>{member.icon}</span>
                      {member.name}
                    </Tag>
                  ))}
                </div>
              </div>

              {/* 消息列表 */}
              <div style={{
                flex: 1,
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                overflowY: 'auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                {(currentConversation?.messages || messages).length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', paddingTop: '60px' }}>
                    <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>开始对话吧</div>
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>输入 @ 来提及智能体</div>
                  </div>
                ) : (
                  <>
                    {/* 显示回复队列指示器 */}
                    {agentReplyQueue.length > 0 && (
                      <div style={{
                        padding: '12px',
                        background: '#F0F0FF',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #6366F1'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          群组回复队列 ({agentReplyQueue.indexOf(currentReplyingAgent!) + 1}/{agentReplyQueue.length})
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {agentReplyQueue.map((agent, idx) => (
                            <Tag
                              key={agent.id}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: currentReplyingAgent?.id === agent.id ? `${agent.color}` : `${agent.color}22`,
                                border: `1px solid ${agent.color}`,
                                color: currentReplyingAgent?.id === agent.id ? '#fff' : agent.color,
                                fontSize: '12px'
                              }}
                            >
                              <span style={{ marginRight: '4px' }}>{agent.icon}</span>
                              {agent.name}
                              {currentReplyingAgent?.id === agent.id && (
                                <LoadingOutlined style={{ marginLeft: '6px' }} />
                              )}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {(currentConversation?.messages || messages).map(msg => (
                    <div key={msg.id} style={{ marginBottom: '24px' }}>
                      {msg.role === 'user' ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{
                            maxWidth: '70%',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            fontSize: '14px'
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <Avatar style={{ background: msg.agentId ? allAgents.find(a => a.id === msg.agentId)?.color : '#999' }}>
                            {msg.agentIcon}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
                              {msg.agentName}
                            </div>

                            {/* Thinking 状态 */}
                            {msg.status === 'thinking' && (
                              <div style={{
                                padding: '12px',
                                background: '#F3F4F6',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 协作计划状态 */}
                            {(msg.status === 'planning' || msg.status === 'dispatching') && (
                              <div style={{
                                padding: '12px',
                                background: '#EEF2FF',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 显示协作计划 */}
                            {msg.collaborationPlan && (
                              <div style={{
                                marginTop: '12px',
                                padding: '16px',
                                background: '#F9FAFB',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB'
                              }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  marginBottom: '12px',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  📋 协作计划
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                                  {msg.collaborationPlan.description}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.collaborationPlan.subTasks.map((task, idx) => (
                                    <div key={task.id} style={{
                                      padding: '10px 12px',
                                      background: '#fff',
                                      borderRadius: '8px',
                                      border: '1px solid #E5E7EB',
                                      fontSize: '13px'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 500 }}>
                                          子任务 {idx + 1}
                                        </span>
                                        <span>
                                          {task.agentIcon} @{task.agentName}
                                        </span>
                                        {task.status === 'pending' && (
                                          <Tag color="default" style={{ marginLeft: 'auto' }}>待派发</Tag>
                                        )}
                                        {task.status === 'dispatched' && (
                                          <Tag color="blue" style={{ marginLeft: 'auto' }}>🚀 已派发</Tag>
                                        )}
                                        {task.status === 'executing' && (
                                          <Tag color="orange" style={{ marginLeft: 'auto' }}>
                                            <Spin size="small" style={{ marginRight: 4 }} />
                                            执行中
                                          </Tag>
                                        )}
                                        {task.status === 'completed' && (
                                          <Tag color="success" style={{ marginLeft: 'auto' }}>✅ 已完成</Tag>
                                        )}
                                      </div>
                                      {task.toolCalls && task.toolCalls.length > 0 && (
                                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#6B7280' }}>
                                          🛠️ 调用工具: {task.toolCalls.map(t => t.name).join(', ')}
                                        </div>
                                      )}
                                      {task.result && (
                                        <div style={{
                                          marginTop: '8px',
                                          paddingTop: '8px',
                                          borderTop: '1px solid #E5E7EB',
                                          color: '#374151'
                                        }}>
                                          {task.result}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 执行中状态 */}
                            {msg.status === 'executing' && (
                              <div style={{
                                padding: '12px',
                                background: '#FEF3C7',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#92400E',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#F59E0B' }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 整合中状态 */}
                            {msg.status === 'integrating' && (
                              <div style={{
                                padding: '12px',
                                background: '#DBEAFE',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#1E40AF',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px'
                              }}>
                                <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: '#3B82F6' }} spin />} />
                                <span style={{ fontStyle: 'italic' }}>{msg.thinking}</span>
                              </div>
                            )}

                            {/* 等待澄清状态 */}
                            {msg.status === 'waiting_clarification' && (
                              <div style={{
                                padding: '12px',
                                background: '#FEF3C7',
                                borderRadius: '8px',
                                fontSize: '14px',
                                marginTop: '8px',
                                border: '1px solid #FCD34D'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                  <QuestionCircleOutlined style={{ color: '#F59E0B', fontSize: '16px' }} />
                                  <span style={{ fontWeight: 500, color: '#92400E' }}>
                                    {msg.clarificationQuestion}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {msg.clarificationOptions?.map((option, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1px solid #E5E7EB'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#F59E0B';
                                        e.currentTarget.style.background = '#FFFBEB';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                        e.currentTarget.style.background = '#fff';
                                      }}
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tool Calls 状态 */}
                            {msg.status === 'calling' && msg.toolCalls && (
                              <div style={{ marginTop: '8px' }}>
                                {msg.toolCalls.map(tool => (
                                  <div key={tool.id} style={{
                                    padding: '10px 12px',
                                    background: '#FEF3C7',
                                    borderRadius: '8px',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <ToolOutlined style={{ color: '#F59E0B' }} />
                                    <span>调用工具: {tool.name}</span>
                                    {tool.status === 'running' && (
                                      <Spin size="small" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 最终回复 */}
                            {msg.status === 'completed' && msg.content && (
                              <div style={{
                                padding: '12px 16px',
                                background: msg.isCollaborationResult ? '#F0F9FF' : '#F9FAFB',
                                borderRadius: '12px',
                                fontSize: '14px',
                                marginTop: '8px',
                                border: msg.isCollaborationResult ? '1px solid #BAE6FD' : '1px solid #E5E7EB'
                              }}>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                                {/* 协作结果展开按钮 */}
                                {msg.isCollaborationResult && msg.subTaskResults && (
                                  <div style={{ marginTop: '12px' }}>
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={() => {
                                        const newExpanded = new Set(expandedCollaborations);
                                        if (newExpanded.has(msg.id)) {
                                          newExpanded.delete(msg.id);
                                        } else {
                                          newExpanded.add(msg.id);
                                        }
                                        setExpandedCollaborations(newExpanded);
                                      }}
                                      style={{ padding: 0, fontSize: '13px' }}
                                    >
                                      {expandedCollaborations.has(msg.id) ? '▼ 收起子任务详情' : '▶ 展开子任务详情'}
                                    </Button>

                                    {/* 展开的子任务详情 */}
                                    {expandedCollaborations.has(msg.id) && (
                                      <div style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #BAE6FD'
                                      }}>
                                        {msg.subTaskResults.map((task, idx) => (
                                          <div key={task.id} style={{
                                            marginBottom: '12px',
                                            padding: '12px',
                                            background: '#fff',
                                            borderRadius: '8px',
                                            border: '1px solid #E5E7EB'
                                          }}>
                                            <div style={{
                                              fontWeight: 500,
                                              marginBottom: '8px',
                                              color: '#374151',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px'
                                            }}>
                                              <span>{task.agentIcon}</span>
                                              <span>{task.agentName}</span>
                                              <Tag color="success" style={{ marginLeft: 'auto' }}>已完成</Tag>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px' }}>
                                              {task.taskName}
                                            </div>
                                            {task.toolCalls && task.toolCalls.length > 0 && (
                                              <div style={{
                                                fontSize: '12px',
                                                color: '#9CA3AF',
                                                marginBottom: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                              }}>
                                                <ToolOutlined />
                                                <span>工具调用: {task.toolCalls.map(t => t.name).join(', ')}</span>
                                              </div>
                                            )}
                                            <div style={{
                                              paddingTop: '8px',
                                              borderTop: '1px solid #F3F4F6',
                                              color: '#374151',
                                              fontSize: '13px'
                                            }}>
                                              {task.result}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {msg.toolCalls && msg.toolCalls.length > 0 && !msg.isCollaborationResult && (
                                  <div style={{
                                    marginTop: '12px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #E5E7EB',
                                    fontSize: '12px',
                                    color: '#666'
                                  }}>
                                    <div style={{ marginBottom: '6px', fontWeight: 500 }}>使用的工具:</div>
                                    {msg.toolCalls.map(tool => (
                                      <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <CheckCircleOutlined style={{ color: '#10B981' }} />
                                        <span>{tool.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
              </div>

              {/* 输入框区域 */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '16px'
              }}>
                <div style={{ position: 'relative' }}>
                  <MentionEditor
                    ref={conversationEditorRef}
                    value={inputValue}
                    onChange={(value) => setInputValue(value)}
                    placeholder="输入消息... (输入 @ 提及智能体)"
                    agents={(currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || []).filter(a => a.id !== 'all')}
                    groups={[]}
                    onSelectAgent={(agent) => {
                      const agentData = (currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || [])
                        .find(a => a.id === agent.id);
                      if (agentData && !mentionedAgents.find(a => a.id === agent.id)) {
                        if (mentionedAgents.length < 10) {
                          setMentionedAgents([...mentionedAgents, agentData]);
                        }
                      }
                    }}
                    minRows={3}
                    maxRows={6}
                    style={{
                      fontSize: '14px',
                      border: 'none',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {mentionedAgents.length > 0 ? `已选择 ${mentionedAgents.length} 个智能体` : '输入 @ 选择智能体'}
                    </div>
                    <Button
                      type="default"
                      size="small"
                      icon={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>@</span>}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        conversationEditorRef.current?.openMentionPanel(rect);
                      }}
                    />
                    {/* 群组对话时移除上传文件和深度思考按钮，保持界面一致 */}
                    <Button
                      type="default"
                      size="small"
                      icon={<PaperClipOutlined />}
                      style={{ borderRadius: '6px' }}
                    />
                    <Button
                      type="default"
                      size="small"
                      icon={<BulbOutlined />}
                      style={{ borderRadius: '6px' }}
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      border: 'none',
                      borderRadius: '6px'
                    }}
                    disabled={!inputValue.trim()}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* 原有的欢迎界面 */
            <>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              您好，Alina
            </h1>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '800px',
            position: 'relative'
          }}>
            {/* @智能体/群组面板 */}
            {showMentionPanel && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                right: '0',
                marginBottom: '8px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '16px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {/* 选项卡 */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: '8px'
                }}>
                  <div
                    onClick={() => setMentionType('agent')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: mentionType === 'agent' ? '#f0f0f0' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: mentionType === 'agent' ? 500 : 400,
                      transition: 'all 0.3s'
                    }}
                  >
                    智能体
                  </div>
                  <div
                    onClick={() => setMentionType('group')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: mentionType === 'group' ? '#f0f0f0' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: mentionType === 'group' ? 500 : 400,
                      transition: 'all 0.3s'
                    }}
                  >
                    群组
                  </div>
                </div>

                {/* 内容 */}
                {mentionType === 'agent' ? (
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                      选择智能体
                    </div>
                    {allAgents.map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '4px',
                          transition: 'background 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: `${agent.color}22`,
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          {agent.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{agent.name}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>{agent.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                      选择群组
                    </div>
                    {agentGroups.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                        <TeamOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                        <div>暂无群组</div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>请先创建群组</div>
                      </div>
                    ) : (
                      agentGroups.map(group => (
                        <div
                          key={group.id}
                          onClick={() => handleSelectGroup(group)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            transition: 'background 0.3s',
                            border: '1px solid #f0f0f0'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <TeamOutlined style={{ color: '#6366F1' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{group.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            {group.members.slice(0, 5).map(member => (
                              <span key={member.id} style={{ fontSize: '14px' }}>{member.icon}</span>
                            ))}
                            {group.members.length > 5 && (
                              <span style={{ fontSize: '12px', color: '#999' }}>+{group.members.length - 5}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Skills/Files Panel */}
            {showSkillsPanel && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                right: '0',
                marginBottom: '8px',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '16px',
                maxHeight: '500px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <SearchOutlined style={{ color: '#999' }} />
                  <input
                    type="text"
                    placeholder="搜索技能/文件"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      flex: 1,
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  borderBottom: '1px solid #f0f0f0',
                  paddingBottom: '8px'
                }}>
                  <div
                    onClick={() => setActiveTab('all')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: activeTab === 'all' ? '#f0f0f0' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === 'all' ? 500 : 400,
                      transition: 'all 0.3s'
                    }}
                  >
                    全部
                  </div>
                  <div
                    onClick={() => setActiveTab('files')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: activeTab === 'files' ? '#f0f0f0' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === 'files' ? 500 : 400,
                      transition: 'all 0.3s'
                    }}
                  >
                    文件
                  </div>
                  <div
                    onClick={() => setActiveTab('skills')}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      background: activeTab === 'skills' ? '#f0f0f0' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: activeTab === 'skills' ? 500 : 400,
                      transition: 'all 0.3s'
                    }}
                  >
                    技能
                  </div>
                </div>

                {/* Content */}
                <div>
                  {(activeTab === 'all' || activeTab === 'files') && (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                        收藏夹文件
                      </div>
                      {favoriteFiles.map(file => (
                        <div
                          key={file.id}
                          onClick={() => handleFileSelect(file.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: '#FCD34D',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                          }}>
                            📄
                          </div>
                          <span style={{ fontSize: '14px' }}>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'skills') && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                        我的技能
                      </div>
                      {mySkills.map(skill => (
                        <div
                          key={skill.id}
                          onClick={() => handleSkillSelect(skill.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '8px',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: `${skill.color}22`,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px'
                          }}>
                            {skill.icon}
                          </div>
                          <span style={{ fontSize: '14px' }}>{skill.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manage Tools Button */}
                <Button
                  block
                  size="large"
                  style={{
                    marginTop: '16px',
                    borderRadius: '8px',
                    fontWeight: 500
                  }}
                >
                  管理工具
                </Button>
              </div>
            )}

            <div style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '16px'
            }}>
              {/* 已选择的智能体和群组标签 */}
              {(mentionedAgents.length > 0 || selectedGroups.length > 0) && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedGroups.map(group => (
                    <Tag
                      key={group.id}
                      closable
                      onClose={() => setSelectedGroups(selectedGroups.filter(g => g.id !== group.id))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: '#EEF2FF',
                        border: '1px solid #6366F1',
                        color: '#6366F1',
                        fontSize: '13px'
                      }}
                    >
                      <TeamOutlined style={{ marginRight: '4px' }} />
                      @{group.name}
                    </Tag>
                  ))}
                  {mentionedAgents.map(agent => (
                    <Tag
                      key={agent.id}
                      closable
                      onClose={() => setMentionedAgents(mentionedAgents.filter(a => a.id !== agent.id))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: `${agent.color}22`,
                        border: `1px solid ${agent.color}`,
                        color: agent.color,
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>{agent.icon}</span>
                      @{agent.name}
                    </Tag>
                  ))}
                </div>
              )}

              {/* 上传的文件标签 */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {uploadedFiles.map(file => (
                    <Tag
                      key={file.id}
                      closable
                      onClose={() => setUploadedFiles(uploadedFiles.filter(f => f.id !== file.id))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: '#FEF3C7',
                        border: '1px solid #F59E0B',
                        color: '#92400E',
                        fontSize: '13px'
                      }}
                    >
                      📎 {file.name}
                    </Tag>
                  ))}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <MentionEditor
                  ref={editorRef}
                  value={inputValue}
                  onChange={(value) => setInputValue(value)}
                  placeholder="给我发消息或布置任务（输入 @ 提及智能体或群组）"
                  agents={allAgents}
                  groups={agentGroups.map(group => ({
                    id: group.id,
                    name: group.name,
                    icon: '👥',
                    type: 'group' as const,
                    lastUsed: Date.now() - Math.floor(Math.random() * 86400000 * 7)  // Mock lastUsed within last 7 days
                  }))}
                  onSelectAgent={(agent) => {
                    // Check if it's a group
                    const groupData = agentGroups.find(g => g.id === agent.id);
                    if (groupData) {
                      if (!selectedGroups.find(g => g.id === agent.id)) {
                        setSelectedGroups([...selectedGroups, groupData]);
                      }
                    } else {
                      // It's an agent
                      const agentData = allAgents.find(a => a.id === agent.id);
                      if (agentData && !mentionedAgents.find(a => a.id === agent.id)) {
                        setMentionedAgents([...mentionedAgents, agentData]);
                      }
                    }
                  }}
                  minRows={4}
                  maxRows={8}
                  style={{
                    fontSize: '16px',
                    border: 'none',
                    width: '100%'
                  }}
                />
              </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* @ 提及按钮 */}
                <Button
                  type="default"
                  icon={<span style={{ fontSize: '16px', fontWeight: 'bold' }}>@</span>}
                  style={{ borderRadius: '6px' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    editorRef.current?.openMentionPanel(rect);
                  }}
                />

                {/* 上传文件按钮 - 只显示别针图标 */}
                <label htmlFor="file-upload">
                  <Button
                    type="default"
                    icon={<PaperClipOutlined />}
                    style={{ borderRadius: '6px' }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  />
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {/* 深度思考按钮 - 未选中时只显示图标 */}
                <Button
                  type={deepThinking ? 'primary' : 'default'}
                  icon={<BulbOutlined />}
                  style={{
                    borderRadius: '6px',
                    background: deepThinking ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : undefined,
                    border: deepThinking ? 'none' : undefined
                  }}
                  onClick={() => setDeepThinking(!deepThinking)}
                >
                  {deepThinking ? '深度思考' : ''}
                </Button>

                {/* 知识库按钮 */}
                <Button
                  type="default"
                  icon={<DatabaseOutlined />}
                  style={{ borderRadius: '6px' }}
                >
                  知识库
                </Button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Dropdown menu={{ items: modelMenuItems }} trigger={['click']}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    background: '#f5f5f5'
                  }}>
                    <SmileOutlined />
                    <span style={{ fontSize: '14px' }}>GLM-4-Flash-250414</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>语言</span>
                    <span>▼</span>
                  </div>
                </Dropdown>

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    width: '40px',
                    height: '40px'
                  }}
                  disabled={!inputValue.trim()}
                  onClick={handleCreateConversation}
                />
              </div>
            </div>
          </div>
          </div>

          <div style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#999',
            textAlign: 'center'
          }}>
            以上内容为AI生成，不代表开发者立场，请勿删除或改变本段文本标识
          </div>
          </>
          )}
        </Content>
      </Layout>

      {/* 新建群组Modal */}
      <Modal
        title="新建群组"
        open={showGroupModal}
        onOk={handleCreateGroup}
        onCancel={() => {
          setShowGroupModal(false);
          setGroupName('');
          setSelectedAgents([]);
        }}
        okText="创建"
        cancelText="取消"
        width={600}
        okButtonProps={{
          disabled: selectedAgents.length === 0,
          style: {
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: 'none'
          }
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              群组名称
            </div>
            <Input
              placeholder="输入群名称（选填）"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ borderRadius: '8px' }}
              size="large"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              智能体成员 <span style={{ color: '#ff4d4f' }}>*</span>
            </div>
            <TreeSelect
              showSearch
              treeCheckable
              placeholder="搜索并选择智能体（支持多选）"
              value={selectedAgents}
              onChange={setSelectedAgents}
              treeData={getAgentTreeData()}
              style={{ width: '100%' }}
              size="large"
              maxTagCount={3}
              treeDefaultExpandAll
              filterTreeNode={(input, treeNode) => {
                const title = treeNode.title as any;
                if (typeof title === 'string') {
                  return title.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
              已选择 {selectedAgents.length} 个智能体
            </div>
          </div>

          {/* 已选择的智能体预览 */}
          {selectedAgents.length > 0 && (
            <div style={{
              padding: '16px',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                已选择的智能体:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedAgents.map(agentId => {
                  const agent = allAgents.find(a => a.id === agentId);
                  return agent ? (
                    <Tag
                      key={agent.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        background: `${agent.color}22`,
                        border: `1px solid ${agent.color}`,
                        color: agent.color,
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ marginRight: '6px' }}>{agent.icon}</span>
                      {agent.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Frontend;
