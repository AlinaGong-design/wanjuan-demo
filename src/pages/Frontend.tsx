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
  createTime: string;
  pinned?: boolean;
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
  status?: 'thinking' | 'calling' | 'completed' | 'waiting_clarification';
  clarificationQuestion?: string;
  clarificationOptions?: string[];
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

  // 创建群组
  const handleCreateGroup = () => {
    if (selectedAgents.length === 0) {
      return;
    }

    const members = allAgents.filter(a => selectedAgents.includes(a.id));
    const newGroup: AgentGroup = {
      id: `group-${Date.now()}`,
      name: groupName || `群组${agentGroups.length + 1}`,
      members,
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
  const processAgentReplyQueue = async (agents: Agent[], userMessage: string) => {
    setAgentReplyQueue(agents);

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      setCurrentReplyingAgent(agent);

      await simulateAgentReply(agent, userMessage, i === agents.length - 1);

      // 每个agent回复之间稍微间隔一下
      if (i < agents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setAgentReplyQueue([]);
    setCurrentReplyingAgent(null);
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
    } else {
      setMessages(prev => [...prev, userMsg]);

      // 让被@的智能体串行回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentGroup?.members.slice(0, 1) || [];

      // 使用异步串行处理
      processAgentReplyQueue(agentsToReply, inputValue);
    }

    setInputValue('');
    setMentionedAgents([]);
  };

  // 处理对话中的串行回复队列
  const processAgentReplyQueueInConversation = async (agents: Agent[], userMessage: string, conversationId: string) => {
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];

      await simulateAgentReplyInConversation(agent, userMessage, conversationId);

      // 每个agent回复之间稍微间隔一下
      if (i < agents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
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
                                background: '#F9FAFB',
                                borderRadius: '12px',
                                fontSize: '14px',
                                marginTop: '8px',
                                border: '1px solid #E5E7EB'
                              }}>
                                {msg.content}
                                {msg.toolCalls && msg.toolCalls.length > 0 && (
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
