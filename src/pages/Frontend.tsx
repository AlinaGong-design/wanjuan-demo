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
  Spin
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
  UploadOutlined,
  BulbOutlined,
  DatabaseOutlined,
  UserOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { SkillItem } from './Skill';
import './Frontend.css';

const { Sider, Content } = Layout;
const { TextArea } = Input;

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
}

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
  const textAreaRef = useRef<any>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // 群组相关状态
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<AgentGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionedAgents, setMentionedAgents] = useState<Agent[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  // 对话管理相关状态
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  const [mentionType, setMentionType] = useState<'agent' | 'group' | 'mixed'>('agent');
  const [selectedGroups, setSelectedGroups] = useState<AgentGroup[]>([]);

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
    };

    setAgentGroups([...agentGroups, newGroup]);
    setShowGroupModal(false);
    setGroupName('');
    setSelectedAgents([]);
  };

  // 进入群组对话
  const handleEnterGroup = (group: AgentGroup) => {
    setCurrentGroup(group);
    setMessages([]);
  };

  // 处理@智能体
  const handleMentionAgent = (agent: Agent) => {
    if (mentionedAgents.length >= 10) {
      return;
    }
    if (!mentionedAgents.find(a => a.id === agent.id)) {
      setMentionedAgents([...mentionedAgents, agent]);
    }
    setShowAgentPanel(false);
  };

  // @all
  const handleMentionAll = () => {
    if (currentGroup) {
      setMentionedAgents(currentGroup.members.slice(0, 10));
      setShowAgentPanel(false);
    } else if (currentConversation) {
      const allMembers = currentConversation.agents || currentConversation.group?.members || [];
      setMentionedAgents(allMembers.slice(0, 10));
      setShowAgentPanel(false);
    }
  };

  // 模拟智能体回复
  const simulateAgentReply = (agent: Agent, userMessage: string) => {
    // Thinking阶段
    const thinkingMsg: Message = {
      id: `msg-${Date.now()}-thinking`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在分析问题...',
      status: 'thinking',
    };
    setMessages(prev => [...prev, thinkingMsg]);

    // Tool调用阶段
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsg.id
          ? {
              ...msg,
              status: 'calling',
              toolCalls: [
                { id: 'tool-1', name: 'web_search', status: 'running' },
                { id: 'tool-2', name: 'read_file', status: 'running' }
              ]
            }
          : msg
      ));
    }, 1000);

    // 完成阶段
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsg.id
          ? {
              ...msg,
              status: 'completed',
              content: `我是${agent.name}，针对您的问题"${userMessage}"，这是我的回答...`,
              toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
            }
          : msg
      ));
    }, 3000);
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

      // 让被@的智能体回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentConversation.agents || currentConversation.group?.members.slice(0, 1) || [];

      agentsToReply.forEach((agent, index) => {
        setTimeout(() => {
          simulateAgentReplyInConversation(agent, inputValue, currentConversation.id);
        }, index * 500);
      });
    } else {
      setMessages(prev => [...prev, userMsg]);

      // 让被@的智能体回复
      const agentsToReply = mentionedAgents.length > 0
        ? mentionedAgents
        : currentGroup?.members.slice(0, 1) || [];

      agentsToReply.forEach((agent, index) => {
        setTimeout(() => {
          simulateAgentReply(agent, inputValue);
        }, index * 500);
      });
    }

    setInputValue('');
    setMentionedAgents([]);
  };

  // 在对话中模拟智能体回复
  const simulateAgentReplyInConversation = (agent: Agent, userMessage: string, conversationId: string) => {
    // Thinking阶段
    const thinkingMsg: Message = {
      id: `msg-${Date.now()}-${agent.id}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      timestamp: new Date().toISOString(),
      thinking: '正在分析问题...',
      status: 'thinking',
    };

    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, thinkingMsg] }
        : conv
    ));
    setCurrentConversation(prev => prev ? { ...prev, messages: [...prev.messages, thinkingMsg] } : null);

    // Tool调用阶段
    setTimeout(() => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === thinkingMsg.id
                  ? {
                      ...msg,
                      status: 'calling' as const,
                      toolCalls: [
                        { id: 'tool-1', name: 'web_search', status: 'running' as const },
                        { id: 'tool-2', name: 'read_file', status: 'running' as const }
                      ]
                    }
                  : msg
              )
            }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === thinkingMsg.id
            ? {
                ...msg,
                status: 'calling' as const,
                toolCalls: [
                  { id: 'tool-1', name: 'web_search', status: 'running' as const },
                  { id: 'tool-2', name: 'read_file', status: 'running' as const }
                ]
              }
            : msg
        )
      } : null);
    }, 1000);

    // 完成阶段
    setTimeout(() => {
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === thinkingMsg.id
                  ? {
                      ...msg,
                      status: 'completed' as const,
                      content: `我是${agent.name}，针对您的问题"${userMessage}"，这是我的回答...`,
                      toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
                    }
                  : msg
              )
            }
          : conv
      ));
      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === thinkingMsg.id
            ? {
                ...msg,
                status: 'completed' as const,
                content: `我是${agent.name}，针对您的问题"${userMessage}"，这是我的回答...`,
                toolCalls: msg.toolCalls?.map(t => ({ ...t, status: 'completed' as const }))
              }
            : msg
        )
      } : null);
    }, 3000);
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

  // @提及处理（在新建对话界面）
  const handleMentionInNewChat = (type: 'agent' | 'group') => {
    setMentionType(type);
    setShowMentionPanel(true);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const curPos = e.target.selectionStart || 0;

    setInputValue(value);
    setCursorPosition(curPos);

    // Check if @ is typed
    const lastChar = value.charAt(curPos - 1);
    if (lastChar === '@') {
      // 在群组对话中显示智能体面板
      if (currentGroup || currentConversation) {
        setShowAgentPanel(true);
      } else {
        // 在新建对话界面显示@面板
        setShowMentionPanel(true);
      }
    } else if (showSkillsPanel && !value.includes('@')) {
      setShowSkillsPanel(false);
    } else if (showAgentPanel && !value.includes('@')) {
      setShowAgentPanel(false);
    } else if (showMentionPanel && !value.includes('@')) {
      setShowMentionPanel(false);
    }
  };

  const handleSkillSelect = (skillName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const afterCursor = inputValue.substring(cursorPosition);
    const newValue = beforeAt + '@' + skillName + ' ' + afterCursor;

    setInputValue(newValue);
    setShowSkillsPanel(false);

    // Focus back to textarea
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }, 100);
  };

  const handleFileSelect = (fileName: string) => {
    const beforeAt = inputValue.substring(0, inputValue.lastIndexOf('@'));
    const afterCursor = inputValue.substring(cursorPosition);
    const newValue = beforeAt + '@' + fileName + ' ' + afterCursor;

    setInputValue(newValue);
    setShowSkillsPanel(false);

    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
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
                      onClick={() => handleEnterGroup(group)}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: currentGroup?.id === group.id ? '1px solid #6366F1' : '1px solid transparent',
                        background: currentGroup?.id === group.id ? '#F0F0FF' : 'transparent',
                        transition: 'all 0.3s'
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
                        <TeamOutlined style={{ color: '#6366F1' }} />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{group.name}</span>
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
                  <Button onClick={() => {
                    setCurrentConversation(null);
                    setCurrentGroup(null);
                  }}>退出对话</Button>
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
                  (currentConversation?.messages || messages).map(msg => (
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
                  ))
                )}
              </div>

              {/* 输入框区域 */}
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '16px'
              }}>
                {/* @智能体面板 */}
                {showAgentPanel && (currentGroup || currentConversation) && (
                  <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    background: '#F9FAFB',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <div
                      onClick={handleMentionAll}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginBottom: '8px',
                        background: '#EEF2FF',
                        color: '#6366F1',
                        fontWeight: 500
                      }}
                    >
                      @all (提及所有成员)
                    </div>
                    {(currentGroup?.members || currentConversation?.agents || currentConversation?.group?.members || []).map(agent => (
                      <div
                        key={agent.id}
                        onClick={() => handleMentionAgent(agent)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fff'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>{agent.icon}</span>
                        <span>{agent.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 已@的智能体 */}
                {mentionedAgents.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {mentionedAgents.map(agent => (
                      <Tag
                        key={agent.id}
                        closable
                        onClose={() => setMentionedAgents(mentionedAgents.filter(a => a.id !== agent.id))}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: `${agent.color}22`,
                          border: `1px solid ${agent.color}`,
                          color: agent.color
                        }}
                      >
                        <span style={{ marginRight: '4px' }}>{agent.icon}</span>
                        @{agent.name}
                      </Tag>
                    ))}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <TextArea
                    ref={textAreaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="输入消息... (输入 @ 提及智能体)"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    bordered={false}
                    style={{
                      fontSize: '14px',
                      resize: 'none'
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
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {mentionedAgents.length > 0 ? `已选择 ${mentionedAgents.length} 个智能体` : '输入 @ 选择智能体'}
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
                <TextArea
                  ref={textAreaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="给我发消息或布置任务（输入 @ 提及智能体或群组）"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  bordered={false}
                  style={{
                    fontSize: '16px',
                    resize: 'none'
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
                {/* 上传文件按钮 */}
                <label htmlFor="file-upload">
                  <Button
                    type="default"
                    icon={<UploadOutlined />}
                    style={{ borderRadius: '6px' }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    上传文件
                  </Button>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {/* 深度思考按钮 */}
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
                  深度思考
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
