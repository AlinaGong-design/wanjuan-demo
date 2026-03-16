import React, { useState } from 'react';
import {
  Layout,
  Button,
  Input,
  Select,
  Switch,
  Collapse,
  Avatar,
  Space,
  Divider,
  Drawer,
  Tag,
  Checkbox,
  Empty,
  Dropdown,
  MenuProps,
  Modal,
  Timeline,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  RocketOutlined,
  FileTextOutlined,
  PlusOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  FileAddOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  TagOutlined,
  SaveOutlined,
  RollbackOutlined,
  EyeOutlined,
  FileTextOutlined as FileTextIcon,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import './Agent.css';
import { AgentSettingsDrawer } from '../components/AgentSettingsDrawer';
import { PromptTemplateModal, PromptTemplate } from '../components/PromptTemplateModal';
import { SaveTemplateModal } from '../components/SaveTemplateModal';
import type { ModeConfigFormData } from '../types/agent-config.types';

const { TextArea } = Input;
const { Panel } = Collapse;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type VisibilityScope = 'private' | 'team' | 'public';

interface AgentVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  scope: VisibilityScope;
  snapshot: {
    name: string;
    prompt: string;
    model: string;
  };
}

interface AgentHistoryEvent {
  id: string;
  kind: 'save' | 'publish';
  time: string;
  user: string;
  desc: string;
  version?: AgentVersion;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const nowStr = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function nextVersion(last: string, bump: 'patch' | 'minor' | 'major'): string {
  const m = last.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.0';
  let [, maj, min, pat] = m.map(Number);
  if (bump === 'major') { maj++; min = 0; pat = 0; }
  else if (bump === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `v${maj}.${min}.${pat}`;
}

const SCOPE_LABELS: Record<VisibilityScope, string> = {
  private: '仅自己',
  team: '团队内',
  public: '公开',
};

// ─── 发布弹窗 ─────────────────────────────────────────────────────────────────

const PublishAgentModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope) => void;
}> = ({ open, latestVersion, onClose, onPublish }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [scope, setScope] = useState<VisibilityScope | ''>('');

  React.useEffect(() => {
    if (open) {
      setVersion(nextVersion(latestVersion, 'patch'));
      setChangelog('');
      setScope('');
    }
  }, [open, latestVersion]);

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    onPublish(version, changelog, (scope || 'private') as VisibilityScope);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CloudUploadOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>发布新版本</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>
              发布后将生成不可变的快照。请确保数据已完整校验。
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} style={{ minWidth: 72 }}>取消</Button>
          <Button
            type="primary"
            onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}
          >
            确认发布
          </Button>
        </Space>
      }
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 4px' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
            版本号 <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <Input
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="v1.0.0"
            style={{ fontSize: 14, borderRadius: 8 }}
          />
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>格式示例: v1.0.0, v2.1.3</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>版本说明 / 变更日志</div>
          <TextArea
            value={changelog}
            onChange={e => setChangelog(e.target.value)}
            rows={4}
            placeholder="简要描述本次更新的内容..."
            maxLength={500}
            style={{ borderRadius: 8, resize: 'none' }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
            公开范围 <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>（为空则仅本人可见）</span>
          </div>
          <Select
            value={scope || undefined}
            onChange={v => setScope(v)}
            placeholder="请选择公开范围"
            style={{ width: '100%' }}
            allowClear
            options={[
              { value: 'private', label: '仅自己' },
              { value: 'team', label: '团队内' },
              { value: 'public', label: '公开' },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
};

// ─── 历史版本抽屉 ─────────────────────────────────────────────────────────────

const AgentVersionDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  history: AgentHistoryEvent[];
  previewVersion: AgentVersion | null;
  onPreviewVersion: (ver: AgentVersion) => void;
  onExitPreview: () => void;
  onRollback: (ver: AgentVersion) => void;
}> = ({ open, onClose, history, previewVersion, onPreviewVersion, onExitPreview, onRollback }) => {
  const isPreview = !!previewVersion;

  const handleRollback = (ver: AgentVersion) => {
    Modal.confirm({
      title: `回滚至 ${ver.version} 版本`,
      content: (
        <div style={{ paddingTop: 8 }}>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 16, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {ver.version}</span>
              <span style={{ fontSize: 13, color: '#999' }}>{ver.publishedBy} · {ver.publishedAt}</span>
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              {ver.changelog || `将智能体恢复至 ${ver.version} 版本配置。`}
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>编辑器内容替换为 {ver.version} 版本的配置快照</li>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>草稿更新为目标版本内容，覆盖当前编辑内容</li>
            <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录保留，可随时回滚到其他版本</li>
          </ul>
        </div>
      ),
      okText: '确认回滚',
      cancelText: '取消',
      okButtonProps: { style: { background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 } },
      width: 520,
      onOk: () => { onRollback(ver); onClose(); },
    });
  };

  return (
    <Drawer
      title={
        <Space>
          <HistoryOutlined />
          <span>历史版本</span>
          <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
        </Space>
      }
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: '20px 24px' } }}
    >
      {/* 草稿入口 */}
      <div
        onClick={isPreview ? () => { onExitPreview(); onClose(); } : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', marginBottom: 16, borderRadius: 10,
          cursor: isPreview ? 'pointer' : 'default',
          background: !isPreview ? '#f0fdf4' : '#f0f9ff',
          border: !isPreview ? '1.5px solid #86efac' : '1px solid #bae6fd',
        }}
      >
        <Space size={8}>
          <FileTextIcon style={{ color: isPreview ? '#0ea5e9' : '#16a34a', fontSize: 16 }} />
          <span style={{ fontSize: 14, color: isPreview ? '#0369a1' : '#15803d', fontWeight: 500 }}>
            草稿（当前编辑版本）
          </span>
        </Space>
        {!isPreview
          ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>当前</span>
          : <span style={{ fontSize: 12, color: '#0369a1' }}>点击返回草稿</span>
        }
      </div>

      <Divider style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8' }}>
        {history.length} 条历史记录
      </Divider>

      <Timeline
        items={[...history].reverse().map(ev => ({
          dot: ev.kind === 'publish'
            ? <TagOutlined style={{ color: '#6366F1', fontSize: 15 }} />
            : <SaveOutlined style={{ color: '#94a3b8', fontSize: 13 }} />,
          color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
          children: ev.kind === 'publish' && ev.version ? (
            // 发布节点：完整卡片
            <div style={{
              border: '1px solid #e8e8e8', borderRadius: 10,
              padding: '16px', background: '#fff', marginBottom: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* 版本号 + 标签 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#6366F1' }}>
                  {ev.version.version}
                </span>
                <Tag color="blue" style={{ margin: 0, fontSize: 12, borderRadius: 4 }}>正式发布</Tag>
                {isPreview && previewVersion?.versionId === ev.version.versionId && (
                  <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>预览中</Tag>
                )}
              </div>
              {/* 元信息网格 */}
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', rowGap: 8, fontSize: 13, marginBottom: 12 }}>
                <span style={{ color: '#94a3b8' }}>提交人</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{ev.version.publishedBy}</span>
                <span style={{ color: '#94a3b8' }}>发布时间</span>
                <span style={{ color: '#1f2937' }}>{ev.version.publishedAt}</span>
                <span style={{ color: '#94a3b8' }}>权限���围</span>
                <span>
                  <Tag style={{ margin: 0, fontSize: 12, borderRadius: 4 }}>{SCOPE_LABELS[ev.version.scope]}</Tag>
                </span>
              </div>
              {/* 版本说明 */}
              {ev.version.changelog && (
                <div style={{
                  fontSize: 13, color: '#6366F1', background: '#f5f3ff',
                  borderRadius: 6, padding: '8px 12px', marginBottom: 14,
                }}>
                  <span style={{ color: '#94a3b8', marginRight: 6 }}>版本说明</span>
                  {ev.version.changelog}
                </div>
              )}
              {/* 操作按钮 */}
              <Space size={8}>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => { onPreviewVersion(ev.version!); onClose(); }}
                  style={{ borderRadius: 6 }}
                >
                  查看版本
                </Button>
                <Button
                  icon={<RollbackOutlined />}
                  onClick={() => handleRollback(ev.version!)}
                  style={{ borderRadius: 6 }}
                >
                  回滚
                </Button>
              </Space>
            </div>
          ) : (
            // 保存节点：简洁行
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '2px 0', marginBottom: 4 }}>
              <Space size={6}>
                <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{ev.desc}</span>
                <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc', borderRadius: 4 }}>草稿保存</Tag>
              </Space>
              <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{ev.user} · {ev.time}</span>
            </div>
          ),
        }))}
      />
    </Drawer>
  );
};

// 技能接口
interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  published: boolean;
}

const Agent: React.FC = () => {
  // 从 URL hash 读取智能体类型
  const agentType = (() => {
    const hash = window.location.hash.slice(1);
    const params = hash.split('?')[1] || '';
    return new URLSearchParams(params).get('type') || 'autonomous';
  })();
  const isRag = agentType === 'rag';

  const [agentName, setAgentName] = useState('竞品调研');
  const [modelType, setModelType] = useState('chat-model');
  const [promptText, setPromptText] = useState(`思考与回答逻辑
请气要求
你是一个严谨、专业的知识库问答助手。你的唯一任务是依据资料库中的内容来回答用户的问题。

1. 优先检索：当用户提问时，请务必先检索关联的知识内容。
2. 依据事实：请严格基于检索到的信息进行回答，不要发散，不要编造知识库中不存在的事实。
3. 无果处理：如果知识库中没有相关信息，请直接回答："抱歉，当前知识库中暂无相关内容。"`);
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [isKnowledgeExpanded, setIsKnowledgeExpanded] = useState(false);
  const [isToolExpanded, setIsToolExpanded] = useState(false);
  const [isInteractionExpanded, setIsInteractionExpanded] = useState(false);

  // Skills相关状态
  const [showSkillDrawer, setShowSkillDrawer] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [skillSearchKeyword, setSkillSearchKeyword] = useState('');

  // 模式配置抽屉
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // 模板管理相关状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // 版本控制状态
  const [agentHistory, setAgentHistory] = useState<AgentHistoryEvent[]>([
    {
      id: 'h1', kind: 'publish', time: '2026-01-20 09:00:00', user: '巩娜', desc: 'v1.0.0',
      version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-20 09:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', prompt: '', model: 'chat-model' } },
    },
    { id: 'h2', kind: 'save', time: '2026-01-22 14:00:00', user: '巩娜', desc: '优化提示词与工具配置' },
    {
      id: 'h3', kind: 'publish', time: '2026-01-25 01:45:38', user: '巩娜', desc: 'v1.1.0',
      version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增数据分析技能，优化搜索策略', publishedAt: '2026-01-25 01:45', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', prompt: '', model: 'chat-model' } },
    },
  ]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<AgentVersion | null>(null);
  const [currentVersion, setCurrentVersion] = useState('v1.1.0');

  const getLatestVersion = (): string => {
    const last = [...agentHistory].reverse().find(h => h.kind === 'publish');
    return last?.desc || 'v1.0.0';
  };

  const handlePublish = (version: string, changelog: string, scope: VisibilityScope) => {
    const ver: AgentVersion = {
      versionId: version, version, changelog,
      publishedAt: nowStr(), publishedBy: '当前用户', scope,
      snapshot: { name: agentName, prompt: promptText, model: modelType },
    };
    const ev: AgentHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: nowStr(), user: '当前用户',
      desc: version, version: ver,
    };
    setAgentHistory(prev => [...prev, ev]);
    setCurrentVersion(version);
    message.success(`版本 ${version} 发布成功`);
  };

  const handleRollback = (ver: AgentVersion) => {
    setAgentName(ver.snapshot.name);
    setPromptText(ver.snapshot.prompt);
    setModelType(ver.snapshot.model);
    setCurrentVersion(ver.version);
    setPreviewVersion(null);
    message.success(`已回滚至 ${ver.version}`);
  };

  // 所有已发布的技能列表（模拟数据）
  const allPublishedSkills: Skill[] = [
    { id: '1', name: '写作', icon: '✏️', color: '#F59E0B', category: '内容创作', published: true },
    { id: '2', name: 'PPT制作', icon: '📊', color: '#EF4444', category: '办公工具', published: true },
    { id: '3', name: '视频编辑', icon: '🎬', color: '#F97316', category: '多媒体', published: true },
    { id: '4', name: '设计', icon: '🎨', color: '#EC4899', category: '创意设计', published: true },
    { id: '5', name: '数据分析', icon: '📈', color: '#10B981', category: '数据处理', published: true },
    { id: '6', name: '编程辅助', icon: '💻', color: '#3B82F6', category: '开发工具', published: true },
    { id: '7', name: '翻译', icon: '🌍', color: '#8B5CF6', category: '语言工具', published: true },
    { id: '8', name: '思维导图', icon: '🧠', color: '#06B6D4', category: '思维工具', published: true },
  ];

  // 过滤后的技能列表
  const filteredSkills = allPublishedSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearchKeyword.toLowerCase()) ||
    skill.category.toLowerCase().includes(skillSearchKeyword.toLowerCase())
  );

  // 添加技能
  const handleAddSkill = (skill: Skill) => {
    if (!selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // 移除技能
  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.id !== skillId));
  };

  // 切换技能选择
  const handleToggleSkill = (skill: Skill) => {
    if (selectedSkills.find(s => s.id === skill.id)) {
      handleRemoveSkill(skill.id);
    } else {
      handleAddSkill(skill);
    }
  };

  // 处理模式配置变化（实时保存）
  const handleModeConfigChange = (config: ModeConfigFormData) => {
    console.log('模式配置变化:', config);
  };

  // 模板菜单项
  const templateMenuItems: MenuProps['items'] = [
    {
      key: 'import',
      label: '导入模板',
      icon: <DownloadOutlined />,
      onClick: () => setShowTemplateModal(true),
    },
    {
      key: 'save',
      label: '保存为模板',
      icon: <UploadOutlined />,
      onClick: () => setShowSaveTemplateModal(true),
    },
  ];

  // 使用模板
  const handleSelectTemplate = (template: PromptTemplate) => {
    setPromptText(template.content);
  };

  // 保存模板
  const handleSaveTemplate = (name: string, content: string) => {
    console.log('保存模板:', { name, content });
  };

  // 创建新模板（从模板列表Modal中点击"创建模板"）
  const handleCreateNewTemplate = () => {
    setShowTemplateModal(false);
    setShowSaveTemplateModal(true);
  };

  const isReadOnly = !!previewVersion;

  return (
    <div className="agent-editor-container">
      {/* 顶部栏 */}
      <div className="agent-editor-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => window.location.hash = 'agent'}
          />
          <Avatar
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginLeft: '12px'
            }}
            size={32}
          >
            竞
          </Avatar>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            bordered={false}
            disabled={isReadOnly}
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              width: 'auto',
              maxWidth: '200px'
            }}
          />
          {!isReadOnly && <Button type="text" icon={<EditOutlined />} size="small" />}
        </div>

        <div className="header-right">
          <Space size="middle">
            {agentHistory.length > 0 && (
              <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
                历史版本
              </Button>
            )}
            {!isReadOnly && (
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={() => setPublishOpen(true)}
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}
              >
                发布
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 历史版本预览 Banner */}
      {previewVersion && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px', background: '#fef3c7', borderBottom: '1px solid #fcd34d',
          fontSize: 13, flexShrink: 0,
        }}>
          <Space>
            <EyeOutlined style={{ color: '#d97706' }} />
            <span style={{ color: '#92400e', fontWeight: 500 }}>
              当前浏览的是历史版本{' '}
              <Tag color="orange" style={{ fontFamily: 'monospace', margin: '0 4px' }}>{previewVersion.version}</Tag>
              发布于 {previewVersion.publishedAt}，由 {previewVersion.publishedBy} 提交
            </span>
          </Space>
          <Button icon={<CloseOutlined />} size="small" onClick={() => setPreviewVersion(null)}>
            退出预览
          </Button>
        </div>
      )}

      {/* 主体内容区 */}
      <Layout className="agent-editor-content">
        {/* 配置区 */}
        <div className="agent-config-panel agent-config-panel-full">
          <div className="config-section-title">Agent配置</div>

          {/* AI模型配置 */}
          <Collapse
            defaultActiveKey={['ai-config']}
            bordered={false}
            expandIconPosition="end"
            className="config-collapse"
          >
            <Panel header="AI模型配置" key="ai-config">
              <div className="config-item">
                <div className="config-item-label">
                  模型选择 <span style={{ color: '#ff4d4f' }}>*</span>
                </div>
                <div className="config-item-content">
                  <Select
                    value={modelType}
                    onChange={setModelType}
                    style={{ width: '100%' }}
                    suffixIcon={<QuestionCircleOutlined />}
                    disabled={isReadOnly}
                  >
                    <Select.Option value="chat-model">chat-model</Select.Option>
                    <Select.Option value="gpt-4">GPT-4</Select.Option>
                    <Select.Option value="gpt-3.5">GPT-3.5</Select.Option>
                  </Select>
                </div>
              </div>

              <div className="config-item">
                <div className="config-item-label">
                  提示词
                  {!isReadOnly && (
                    <Dropdown menu={{ items: templateMenuItems }} placement="bottomLeft">
                      <Button type="link" size="small" icon={<FileAddOutlined />}>
                        模板
                      </Button>
                    </Dropdown>
                  )}
                </div>
                <div className="config-item-content">
                  <TextArea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="思考与回答逻辑"
                    autoSize={{ minRows: 8, maxRows: 15 }}
                    style={{ resize: 'none' }}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </Panel>
          </Collapse>

          <Divider style={{ margin: '20px 0' }} />

          {/* Skills配置 — RAG智能体不显示 */}
          {!isRag && (
            <>
              <div className="config-expandable-item">
                <div className="expandable-item-header">
                  <span>Skills</span>
                  <div className="expandable-item-actions">
                    {!isReadOnly && (
                      <PlusOutlined
                        style={{ fontSize: '14px', color: '#666', cursor: 'pointer' }}
                        onClick={() => setShowSkillDrawer(true)}
                      />
                    )}
                  </div>
                </div>

                {/* 已选择的Skills列表 */}
                {selectedSkills.length > 0 && (
                  <div className="selected-skills-container">
                    {selectedSkills.map(skill => (
                      <Tag
                        key={skill.id}
                        closable={!isReadOnly}
                        onClose={() => handleRemoveSkill(skill.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: `${skill.color}22`,
                          border: `1px solid ${skill.color}`,
                          color: skill.color,
                          fontSize: '13px',
                          marginBottom: '8px',
                          marginRight: '8px'
                        }}
                      >
                        <span style={{ marginRight: '6px' }}>{skill.icon}</span>
                        {skill.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              <Divider style={{ margin: '12px 0' }} />
            </>
          )}

          {/* 知识库 */}
          <div
            className="config-expandable-item"
            onClick={() => !isReadOnly && setIsKnowledgeExpanded(!isKnowledgeExpanded)}
          >
            <div className="expandable-item-header">
              <span>知识库</span>
              <div className="expandable-item-actions">
                {!isReadOnly && <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />}
                <RightOutlined
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    transform: isKnowledgeExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.3s'
                  }}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 工具调用 */}
          <div
            className="config-expandable-item"
            onClick={() => !isReadOnly && setIsToolExpanded(!isToolExpanded)}
          >
            <div className="expandable-item-header">
              <span>工具调用</span>
              <div className="expandable-item-actions">
                {!isReadOnly && <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />}
                <RightOutlined
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    transform: isToolExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.3s'
                  }}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 文件上传 */}
          <div className="config-expandable-item">
            <div className="expandable-item-header">
              <span>文件上传</span>
              <div className="expandable-item-actions">
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#999', marginRight: '8px' }} />
                <Switch
                  checked={fileUploadEnabled}
                  onChange={isReadOnly ? undefined : setFileUploadEnabled}
                  size="small"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 交互体验 */}
          <div
            className="config-expandable-item"
            onClick={() => !isReadOnly && setIsInteractionExpanded(!isInteractionExpanded)}
          >
            <div className="expandable-item-header">
              <span>交互体验</span>
              <div className="expandable-item-actions">
                {!isReadOnly && <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />}
                <RightOutlined
                  style={{
                    fontSize: '12px',
                    color: '#999',
                    transform: isInteractionExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    transition: 'transform 0.3s'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>

      {/* Skills选择侧边栏 */}
      <Drawer
        title="选择Skills"
        placement="right"
        width={480}
        open={showSkillDrawer}
        onClose={() => setShowSkillDrawer(false)}
        className="skills-drawer"
      >
        {/* 搜索框 */}
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="搜索Skills..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={skillSearchKeyword}
            onChange={(e) => setSkillSearchKeyword(e.target.value)}
            allowClear
            style={{
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
        </div>

        {/* 已选择的技能数量提示 */}
        {selectedSkills.length > 0 && (
          <div style={{
            padding: '12px',
            background: '#f0f5ff',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#1890ff',
            fontSize: '14px'
          }}>
            已选择 {selectedSkills.length} 个技能
          </div>
        )}

        {/* 技能列表 */}
        <div className="skills-list">
          {filteredSkills.length > 0 ? (
            filteredSkills.map(skill => {
              const isSelected = selectedSkills.find(s => s.id === skill.id);
              return (
                <div
                  key={skill.id}
                  className="skill-item"
                  onClick={() => handleToggleSkill(skill)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? skill.color : '#e8e8e8'}`,
                    background: isSelected ? `${skill.color}11` : '#fff',
                    marginBottom: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `${skill.color}22`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}
                    >
                      {skill.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#262626',
                        marginBottom: '4px'
                      }}>
                        {skill.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        {skill.category}
                      </div>
                    </div>
                  </div>
                  <Checkbox
                    checked={!!isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSkill(skill);
                    }}
                  />
                </div>
              );
            })
          ) : (
            <Empty
              description="暂无匹配的技能"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        {/* 底部操作栏 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: '#fff',
          borderTop: '1px solid #e8e8e8',
          display: 'flex',
          gap: '12px'
        }}>
          <Button
            block
            onClick={() => {
              setShowSkillDrawer(false);
              setSkillSearchKeyword('');
            }}
          >
            取消
          </Button>
          <Button
            type="primary"
            block
            onClick={() => {
              setShowSkillDrawer(false);
              setSkillSearchKeyword('');
            }}
          >
            确定
          </Button>
        </div>
      </Drawer>

      {/* Agent设置抽屉 */}
      <AgentSettingsDrawer
        visible={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        onChange={handleModeConfigChange}
      />

      {/* Prompt模板导入Modal */}
      <PromptTemplateModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleSelectTemplate}
        onCreateNew={handleCreateNewTemplate}
      />

      {/* 保存为模板Modal */}
      <SaveTemplateModal
        visible={showSaveTemplateModal}
        initialPrompt={promptText}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveTemplate}
      />

      {/* 发布弹窗 */}
      <PublishAgentModal
        open={publishOpen}
        latestVersion={getLatestVersion()}
        onClose={() => setPublishOpen(false)}
        onPublish={handlePublish}
      />

      {/* 历史版本抽屉 */}
      <AgentVersionDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={agentHistory}
        previewVersion={previewVersion}
        onPreviewVersion={(ver) => {
          setPreviewVersion(ver);
          setHistoryOpen(false);
          // 将表单内容更新为版本快照
          setAgentName(ver.snapshot.name);
          setPromptText(ver.snapshot.prompt);
          setModelType(ver.snapshot.model);
        }}
        onExitPreview={() => {
          setPreviewVersion(null);
          // 恢复草稿内容（这里简单地恢复当前值，实际应从草稿缓存恢复）
        }}
        onRollback={handleRollback}
      />
    </div>
  );
};

export default Agent;
