import React, { useState } from 'react';
import {
  Button,
  Input,
  Table,
  Space,
  Tag,
  DatePicker,
  Tabs,
  Modal,
  message,
  Tooltip,
  Select,
  Drawer,
  Timeline,
  Divider,
  Radio,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloudUploadOutlined,
  HistoryOutlined,
  TagOutlined,
  RollbackOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './AgentList.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// ─── 类型定义 ────────────────────────────────────────────────────────────────

type AgentHistoryEventKind = 'save' | 'publish';
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
    description: string;
    type: 'autonomous' | 'collaborative';
  };
}

interface AgentHistoryEvent {
  id: string;
  kind: AgentHistoryEventKind;
  time: string;
  user: string;
  desc: string;
  version?: AgentVersion;
}

interface AgentData {
  key: string;
  id: number;
  name: string;
  description: string;
  creator: string;
  department: string;
  createTime: string;
  status: string[];
  type: 'autonomous' | 'collaborative';
  skillCount?: number;
  skills?: string[];
  currentVersion?: string;
  savedStatus?: 'saved' | 'draft' | 'published';
  agentHistory?: AgentHistoryEvent[];
}

interface AgentListProps {
  onCreateAgent?: (type: 'rag' | 'autonomous' | 'collaborative') => void;
  onEditAgent?: (agentId: string) => void;
  onDeleteAgent?: (agentId: string) => void;
  onPublishAgent?: (agentId: string) => void;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function nextVersion(last: string, bump: 'patch' | 'minor' | 'major'): string {
  const m = last.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return 'v1.0.0';
  let [, maj, min, pat] = m.map(Number);
  if (bump === 'major') { maj++; min = 0; pat = 0; }
  else if (bump === 'minor') { min++; pat = 0; }
  else { pat++; }
  return `v${maj}.${min}.${pat}`;
}

const SCOPE_LABELS: Record<VisibilityScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅自己', icon: <LockOutlined /> },
  team:    { label: '团队内', icon: <TeamOutlined /> },
  public:  { label: '公开',   icon: <GlobalOutlined /> },
};

function getLatestVersion(agent: AgentData): string {
  const hist = agent.agentHistory || [];
  const last = [...hist].reverse().find(h => h.kind === 'publish');
  return last?.desc || 'v1.0.0';
}

// ─── 初始数据 ─────────────────────────────────────────────────────────────────

const INIT_DATA: AgentData[] = [
  {
    key: '1', id: 1, name: '竞品调研', description: '11',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-25 01:45:38',
    status: ['商店', '共享', 'API', 'MCP'], type: 'autonomous',
    skillCount: 3, skills: ['网页搜索', '数据分析', 'PDF解析'],
    currentVersion: 'v1.1.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-20 09:00:00', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-20 09:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', description: '竞品调研初版', type: 'autonomous' } } },
      { id: 'h2', kind: 'save', time: '2026-01-22 14:00:00', user: '巩娜', desc: '优化提示词与工具配置' },
      { id: 'h3', kind: 'publish', time: '2026-01-25 01:45:38', user: '巩娜', desc: 'v1.1.0',
        version: { versionId: 'v1.1.0', version: 'v1.1.0', changelog: '新增数据分析技能，优化搜索策略', publishedAt: '2026-01-25 01:45', publishedBy: '巩娜', scope: 'team', snapshot: { name: '竞品调研', description: '11', type: 'autonomous' } } },
    ],
  },
  {
    key: '2', id: 2, name: '11', description: '11',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-25 01:44:22',
    status: ['商店', '共享', 'API', 'MCP'], type: 'autonomous',
    skillCount: 2, skills: ['Python执行器', '文档分析'],
    currentVersion: 'v1.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-25 01:44:22', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-25 01:44', publishedBy: '巩娜', scope: 'team', snapshot: { name: '11', description: '11', type: 'autonomous' } } },
    ],
  },
  {
    key: '3', id: 3, name: '石油化...', description: '石油化工异常处置小助手',
    creator: '巩娜', department: '研发部门', createTime: '2026-01-23 18:57:27',
    status: ['商店', '共享', 'API', 'MCP'], type: 'collaborative',
    skillCount: 5, skills: ['网页搜索', 'PDF解析', 'Python执行器', '数据分析', '知识库检索'],
    currentVersion: 'v2.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-10 10:00:00', user: '巩娜', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-10 10:00', publishedBy: '巩娜', scope: 'team', snapshot: { name: '石油化...', description: '石油化工处置助手初版', type: 'collaborative' } } },
      { id: 'h2', kind: 'save', time: '2026-01-18 11:00:00', user: '巩娜', desc: '增加多个子智能体节点' },
      { id: 'h3', kind: 'publish', time: '2026-01-23 18:57:27', user: '巩娜', desc: 'v2.0.0',
        version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '重构多智能体协作流程，新增异常处置专项模块', publishedAt: '2026-01-23 18:57', publishedBy: '巩娜', scope: 'public', snapshot: { name: '石油化...', description: '石油化工异常处置小助手', type: 'collaborative' } } },
    ],
  },
  {
    key: '4', id: 4, name: '客服助手', description: '智能客服对话助手',
    creator: '张三', department: '客服部门', createTime: '2026-01-24 10:30:00',
    status: ['商店', '共享'], type: 'autonomous',
    skillCount: 0, skills: [],
    savedStatus: 'draft', agentHistory: [],
  },
  {
    key: '5', id: 5, name: '营销策划团队', description: '多智能体协作的营销策划方案生成',
    creator: '李四', department: '市场部门', createTime: '2026-01-22 14:20:15',
    status: ['商店', '共享', 'API'], type: 'collaborative',
    skillCount: 0, skills: [],
    currentVersion: 'v1.0.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-22 14:20:15', user: '李四', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-22 14:20', publishedBy: '李四', scope: 'team', snapshot: { name: '营销策划团队', description: '多智能体协作的营销策划方案生成', type: 'collaborative' } } },
    ],
  },
  {
    key: '6', id: 6, name: '代码审查助手', description: '自动代码审查和建议',
    creator: '王五', department: '研发部门', createTime: '2026-01-21 16:45:30',
    status: ['共享', 'API'], type: 'autonomous',
    skillCount: 4, skills: ['代码执行', '代码分析', 'Git操作', '文档生成'],
    currentVersion: 'v1.2.0', savedStatus: 'published',
    agentHistory: [
      { id: 'h1', kind: 'publish', time: '2026-01-15 10:00:00', user: '王五', desc: 'v1.0.0',
        version: { versionId: 'v1.0.0', version: 'v1.0.0', changelog: '首次发布', publishedAt: '2026-01-15 10:00', publishedBy: '王五', scope: 'team', snapshot: { name: '代码审查助手', description: '自动代码审查', type: 'autonomous' } } },
      { id: 'h2', kind: 'save', time: '2026-01-18 15:00:00', user: '王五', desc: '增加代码安全检测逻辑' },
      { id: 'h3', kind: 'publish', time: '2026-01-21 16:45:30', user: '王五', desc: 'v1.2.0',
        version: { versionId: 'v1.2.0', version: 'v1.2.0', changelog: '新增安全漏洞检测与Git操作技能', publishedAt: '2026-01-21 16:45', publishedBy: '王五', scope: 'team', snapshot: { name: '代码审查助手', description: '自动代码审查和建议', type: 'autonomous' } } },
    ],
  },
];

// ─── 历史版本抽屉 ─────────────────────────────────────────────────────────────

const AgentHistoryDrawer: React.FC<{
  agent: AgentData | null;
  open: boolean;
  onClose: () => void;
  onRollback: (agent: AgentData, ver: AgentVersion) => void;
  previewVersion: AgentVersion | null;
  onPreviewVersion: (ver: AgentVersion) => void;
  onExitPreview: () => void;
}> = ({ agent, open, onClose, onRollback, previewVersion, onPreviewVersion, onExitPreview }) => {
  const [rollbackTarget, setRollbackTarget] = useState<AgentVersion | null>(null);

  if (!agent) return null;
  const history = agent.agentHistory || [];
  const isPreview = !!previewVersion;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    onRollback(agent, rollbackTarget);
    setRollbackTarget(null);
    onClose();
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{history.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={440}
        open={open}
        onClose={onClose}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* 草稿入口 */}
        <div
          onClick={isPreview ? () => { onExitPreview(); onClose(); } : undefined}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8,
            cursor: isPreview ? 'pointer' : 'default',
            background: !isPreview ? '#f0fdf4' : '#f0f9ff',
            border: !isPreview ? '1.5px solid #86efac' : '1px solid #bae6fd',
          }}
        >
          <Space size={6}>
            <FileTextOutlined style={{ color: isPreview ? '#0ea5e9' : '#16a34a' }} />
            <span style={{ fontSize: 13, color: isPreview ? '#0369a1' : '#15803d', fontWeight: 500 }}>
              草稿（当前编辑版本）
            </span>
          </Space>
          {!isPreview
            ? <Tag color="green" style={{ fontSize: 11, margin: 0 }}>当前</Tag>
            : <span style={{ fontSize: 12, color: '#0369a1' }}>点击返回草稿</span>
          }
        </div>

        <Divider style={{ margin: '12px 0 16px', fontSize: 12, color: '#94a3b8' }}>
          {history.length} 条历史记录
        </Divider>

        <Timeline
          items={[...history].reverse().map(ev => ({
            dot: ev.kind === 'publish'
              ? <TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />
              : <SaveOutlined style={{ color: '#94a3b8', fontSize: 12 }} />,
            color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
            children: (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  {ev.kind === 'publish' ? (
                    <>
                      <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                        {ev.desc}
                      </Tag>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{ev.user} · {ev.time}</div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>智能体类型：</span>
                      <Tag color={ev.version.snapshot.type === 'collaborative' ? 'purple' : 'blue'} style={{ fontSize: 11, margin: 0 }}>
                        {ev.version.snapshot.type === 'collaborative' ? '多智能体' : '单智能体'}
                      </Tag>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>公开范围：</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small" icon={<EyeOutlined />}
                        type={isPreview && previewVersion?.versionId === ev.version.versionId ? 'primary' : 'default'}
                        onClick={() => onPreviewVersion(ev.version!)}
                      >查看版本</Button>
                      <Button size="small" icon={<RollbackOutlined />} onClick={() => setRollbackTarget(ev.version!)}>
                        回滚
                      </Button>
                    </Space>
                  </>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* 回滚确认弹窗 */}
      <Modal
        title={`回滚至 ${rollbackTarget?.version} 版本`}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button type="primary" onClick={handleRollbackConfirm}
              style={{ background: '#1a1a1a', borderColor: '#1a1a1a', borderRadius: 8 }}>
              回滚
            </Button>
          </Space>
        }
        width={520}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>回滚版本 {rollbackTarget.version}</span>
                <span style={{ fontSize: 13, color: '#999' }}>{rollbackTarget.publishedBy} · {rollbackTarget.publishedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {rollbackTarget.changelog || `将智能体「${agent?.name}」恢复至 ${rollbackTarget.version} 版本配置。`}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 10 }}>此操作会：</div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>智能体配置恢复至选中的 {rollbackTarget.version} 版本状态</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>撤销该版本之后的所有未发布更改</li>
                <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── 发布版本 Modal ───────────────────────────────────────────────────────────

const PublishAgentModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope) => void;
}> = ({ open, latestVersion, onClose, onPublish }) => {
  const [bump, setBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [scope, setScope] = useState<VisibilityScope>('team');

  React.useEffect(() => {
    if (open) {
      setBump('patch');
      setVersion(nextVersion(latestVersion, 'patch'));
      setChangelog('');
      setScope('team');
    }
  }, [open, latestVersion]);

  const handleBumpChange = (b: 'patch' | 'minor' | 'major') => {
    setBump(b);
    setVersion(nextVersion(latestVersion, b));
  };

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) { message.error('版本号格式不正确，需为 vX.Y.Z'); return; }
    onPublish(version, changelog, scope);
    onClose();
  };

  return (
    <Modal
      title={<Space><CloudUploadOutlined style={{ color: '#6366F1' }} /><span>发布正式版本</span></Space>}
      open={open} onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleConfirm}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}>
            确认发布
          </Button>
        </Space>
      }
      width={500}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 0' }}>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>版本升级类型</div>
          <Radio.Group value={bump} onChange={e => handleBumpChange(e.target.value)} style={{ width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(['patch', 'minor', 'major'] as const).map(b => (
                <Radio key={b} value={b} style={{ padding: '6px 10px', borderRadius: 6, background: bump === b ? '#f5f3ff' : 'transparent', border: bump === b ? '1px solid #c4b5fd' : '1px solid transparent' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{b}</span>
                  <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
                    {b === 'patch' ? '提示词微调 / 配置优化（x.x.+1）' : b === 'minor' ? '新增技能 / 流程调整（x.+1.0）' : '重大变更（+1.0.0）'}
                  </span>
                </Radio>
              ))}
            </div>
          </Radio.Group>
        </div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>
            版本号 <span style={{ color: '#ff4d4f' }}>*</span>
            <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>上次版本：<Tag style={{ fontFamily: 'monospace', margin: 0 }}>{latestVersion}</Tag></span>
          </div>
          <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="vX.Y.Z"
            style={{ fontFamily: 'monospace', fontSize: 14 }} prefix={<TagOutlined style={{ color: '#6366F1' }} />} />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>已根据上次版本自动生成建议版本号，可手动修改，格式须为 vX.Y.Z</div>
        </div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>更新日志 <span style={{ color: '#94a3b8', fontWeight: 400 }}>（可选）</span></div>
          <TextArea value={changelog} onChange={e => setChangelog(e.target.value)} rows={3} placeholder="描述本次版本的变更内容…" maxLength={500} showCount />
        </div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 13 }}>公开范围</div>
          <Radio.Group value={scope} onChange={e => setScope(e.target.value)} style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.keys(SCOPE_LABELS) as VisibilityScope[]).map(s => (
                <Radio.Button key={s} value={s} style={{ flex: 1, textAlign: 'center', borderColor: scope === s ? '#6366F1' : undefined, color: scope === s ? '#6366F1' : undefined }}>
                  <Space size={4}>{SCOPE_LABELS[s].icon}<span>{SCOPE_LABELS[s].label}</span></Space>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </div>
      </div>
    </Modal>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

const AgentList: React.FC<AgentListProps> = ({
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('mine');
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 筛选条件
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // 数据（可变，支持版本控制操作）
  const [dataSource, setDataSource] = useState<AgentData[]>(INIT_DATA);

  // 版本控制状态
  const [historyAgent, setHistoryAgent] = useState<AgentData | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewState, setPreviewState] = useState<{ agentKey: string; version: AgentVersion } | null>(null);
  const [publishAgentKey, setPublishAgentKey] = useState<string | null>(null);

  // 发布版本
  const handlePublishVersion = (key: string, version: string, changelog: string, scope: VisibilityScope) => {
    const agent = dataSource.find(a => a.key === key);
    if (!agent) return;
    const ver: AgentVersion = {
      versionId: version, version, changelog, publishedAt: now(), publishedBy: '当前用户', scope,
      snapshot: { name: agent.name, description: agent.description, type: agent.type },
    };
    const ev: AgentHistoryEvent = {
      id: `h${Date.now()}`, kind: 'publish', time: now(), user: '当前用户',
      desc: version, version: ver,
    };
    setDataSource(prev => prev.map(a => a.key === key
      ? { ...a, currentVersion: version, savedStatus: 'published' as const, agentHistory: [...(a.agentHistory || []), ev] }
      : a
    ));
    message.success(`版本 ${version} 发布成功`);
    setPublishAgentKey(null);
  };

  // 回滚
  const handleRollback = (agent: AgentData, ver: AgentVersion) => {
    setDataSource(prev => prev.map(a => a.key === agent.key
      ? {
          ...a,
          name: ver.snapshot.name,
          description: ver.snapshot.description,
          savedStatus: 'draft' as const,
          currentVersion: ver.version,
        }
      : a
    ));
    setPreviewState(null);
    message.success(`已回滚至 ${ver.version}`);
  };

  // 删除
  const handleDelete = (key: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${name}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setDataSource(prev => prev.filter(a => a.key !== key));
        onDeleteAgent?.(key);
        message.success('删除成功');
      },
    });
  };

  const columns: ColumnsType<AgentData> = [
    {
      title: '序号', dataIndex: 'id', key: 'id', width: 70,
    },
    {
      title: '名称', dataIndex: 'name', key: 'name', width: 180,
      render: (name: string, record: AgentData) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{name}</span>
          {record.type === 'collaborative' && (
            <Tag color="#6366F1" style={{ margin: 0 }}>多智能体</Tag>
          )}
        </div>
      )
    },
    {
      title: '简介', dataIndex: 'description', key: 'description', width: 180, ellipsis: true,
    },
    {
      title: '创建人', dataIndex: 'creator', key: 'creator', width: 100,
    },
    {
      title: '所属部门', dataIndex: 'department', key: 'department', width: 110,
    },
    {
      title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180,
    },
    {
      title: '状态', key: 'status', dataIndex: 'status', width: 260,
      render: (tags: string[], record: AgentData) => (
        <>
          {tags.map((tag) => {
            let color = tag === '商店' ? 'blue' : tag === '共享' ? 'green' : 'default';
            return <Tag color={color} key={tag}>{tag}</Tag>;
          })}
          {record.skillCount !== undefined && record.skillCount > 0 && (
            <Tooltip
              title={
                <div>
                  <div style={{ marginBottom: '4px', fontWeight: 500 }}>配置的技能：</div>
                  {record.skills?.map((skill, idx) => (
                    <div key={idx} style={{ padding: '2px 0' }}>• {skill}</div>
                  ))}
                </div>
              }
              placement="top"
            >
              <Tag
                color="purple"
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(147, 51, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Skill ({record.skillCount})
              </Tag>
            </Tooltip>
          )}
        </>
      )
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => onEditAgent?.(record.key)}>编辑</Button>
          <Button
            type="link" size="small" icon={<CloudUploadOutlined />}
            onClick={() => setPublishAgentKey(record.key)}
          >发布</Button>
          {record.savedStatus === 'published' && (
            <Button type="link" size="small" style={{ color: '#F59E0B' }}
              onClick={() => {
                setDataSource(prev => prev.map(a => a.key === record.key ? { ...a, savedStatus: 'saved' as const } : a));
                message.success('已下架');
              }}
            >下架</Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key, record.name)}>删除</Button>
        </Space>
      )
    }
  ];

  const handleCreateClick = () => {
    setShowTypeModal(true);
  };

  const handleTypeSelect = (type: 'rag' | 'autonomous' | 'collaborative') => {
    setShowTypeModal(false);
    onCreateAgent?.(type);
  };

  // 筛选逻辑
  const filteredDataSource = dataSource.filter(agent => {
    const matchesSearch = searchText === '' || agent.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesSkill =
      skillFilter === 'all' ||
      (skillFilter === 'linked' && agent.skillCount && agent.skillCount > 0) ||
      (skillFilter === 'unlinked' && (!agent.skillCount || agent.skillCount === 0));
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'autonomous' && agent.type === 'autonomous') ||
      (typeFilter === 'collaborative' && agent.type === 'collaborative');
    return matchesSearch && matchesSkill && matchesType;
  });

  const handleResetFilters = () => {
    setSearchText('');
    setSkillFilter('all');
    setTypeFilter('all');
  };

  const publishAgent = dataSource.find(a => a.key === publishAgentKey);

  return (
    <div className="agent-list-container">
      {/* 历史版本预览 Banner */}
      {previewState && (() => {
        const previewAgent = dataSource.find(a => a.key === previewState.agentKey);
        const ver = previewState.version;
        return (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 20px', background: '#fef3c7', border: '1px solid #fcd34d',
              borderRadius: 8, marginBottom: 12, fontSize: 13,
            }}>
              <Space>
                <EyeOutlined style={{ color: '#d97706' }} />
                <span style={{ color: '#92400e', fontWeight: 500 }}>
                  当前浏览的是「{previewAgent?.name}」历史版本{' '}
                  <Tag color="orange" style={{ fontFamily: 'monospace' }}>{ver.version}</Tag>
                  发布于 {ver.publishedAt}，由 {ver.publishedBy} 提交
                </span>
              </Space>
              <Button icon={<CloseOutlined />} onClick={() => setPreviewState(null)} size="small">退出预览</Button>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#92400e', marginBottom: 12 }}>版本快照内容</div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 16px', fontSize: 13, color: '#555' }}>
                <span style={{ color: '#92400e', fontWeight: 500 }}>智能体名称</span>
                <span>{ver.snapshot.name}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>简介</span>
                <span>{ver.snapshot.description || '—'}</span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>类型</span>
                <span>
                  <Tag color={ver.snapshot.type === 'collaborative' ? 'purple' : 'blue'}>
                    {ver.snapshot.type === 'collaborative' ? '多智能体' : '单智能体'}
                  </Tag>
                </span>
                <span style={{ color: '#92400e', fontWeight: 500 }}>更新日志</span>
                <span style={{ color: ver.changelog ? '#555' : '#aaa', fontStyle: ver.changelog ? 'normal' : 'italic' }}>
                  {ver.changelog || '（无）'}
                </span>
              </div>
            </div>
          </>
        );
      })()}

      {/* 标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'mine', label: '我的Agent' },
          { key: 'shared', label: '共享Agent' }
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* 搜索和筛选区域 */}
      <div className="agent-list-filters">
        <Space size="middle" style={{ marginBottom: 16, width: '100%', flexWrap: 'wrap' }}>
          <Input
            placeholder="请输入Agent名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="autonomous">单智能体</Select.Option>
            <Select.Option value="collaborative">多智能体</Select.Option>
          </Select>
          <Select value={skillFilter} onChange={setSkillFilter} style={{ width: 150 }}>
            <Select.Option value="all">全部Skill</Select.Option>
            <Select.Option value="linked">已关联Skill</Select.Option>
            <Select.Option value="unlinked">未关联Skill</Select.Option>
          </Select>
          <RangePicker
            placeholder={['创建开始日期', '创建结束日期']}
            style={{ width: 280 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleResetFilters}>重置</Button>
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
        </Space>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            共找到 {filteredDataSource.length} 个Agent
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none' }}
          >
            创建Agent
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredDataSource}
        scroll={{ x: 'max-content' }}
        pagination={{
          total: filteredDataSource.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: true
        }}
      />

      {/* Agent类型选择弹窗 */}
      <Modal
        title="新增智能体"
        open={showTypeModal}
        onCancel={() => setShowTypeModal(false)}
        footer={null}
        width={560}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
          {/* RAG智能体 */}
          <div
            onClick={() => handleTypeSelect('rag')}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              border: '1px solid #f0f0f0', borderRadius: 12, cursor: 'pointer',
              background: '#fafafa', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#f5f3ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fafafa'; }}
          >
            <div style={{
              width: 80, height: 72, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
              background: 'linear-gradient(135deg, #fde8e8 0%, #fce4d0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 8, left: 8, background: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#666', fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>知识库</div>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, background: '#f87171', borderRadius: 4 }} />
              <div style={{ marginTop: 20, width: 48, height: 28, background: 'rgba(255,255,255,0.7)', borderRadius: 4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>RAG智能体</div>
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                基于 RAG 配置智能体，可自主进行私域知识库精准检索+大模型生成，企业知识问答优...
              </div>
              <Space size={6}>
                <Tag style={{ margin: 0, fontSize: 12 }}>知识库</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>自主规划</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>独立执行</Tag>
              </Space>
            </div>
          </div>

          {/* 自主规划智能体 */}
          <div
            onClick={() => handleTypeSelect('autonomous')}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              border: '1px solid #f0f0f0', borderRadius: 12, cursor: 'pointer',
              background: '#fafafa', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#f5f3ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fafafa'; }}
          >
            <div style={{
              width: 80, height: 72, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center', color: '#6366F1', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>Agent</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>自主规划智能体</div>
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                具备自主规划、知识库调用、工具调用、Skills 调用+大模型生成，适合独立完成的任务场...
              </div>
              <Space size={6}>
                <Tag style={{ margin: 0, fontSize: 12 }}>Skills</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>自主规划</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>独立执行</Tag>
              </Space>
            </div>
          </div>

          {/* 多应用协同智能体 */}
          <div
            onClick={() => handleTypeSelect('collaborative')}
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              border: '1px solid #f0f0f0', borderRadius: 12, cursor: 'pointer',
              background: '#fafafa', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.background = '#f5f3ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fafafa'; }}
          >
            <div style={{
              width: 80, height: 72, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 8 }}>
                <div style={{ width: 20, height: 20, background: '#6366F1', borderRadius: 4, opacity: 0.8 }} />
                <div style={{ width: 20, height: 20, background: '#8B5CF6', borderRadius: 4, opacity: 0.6 }} />
                <div style={{ width: 20, height: 20, background: '#60a5fa', borderRadius: 4, opacity: 0.6 }} />
                <div style={{ width: 20, height: 20, background: '#34d399', borderRadius: 4, opacity: 0.6 }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>多应用协同智能体</div>
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                多个智能体协同工作，通过调度智能体分配任务，适合复杂的多领域协作场景。
              </div>
              <Space size={6}>
                <Tag style={{ margin: 0, fontSize: 12 }}>多智能体</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>任务协同</Tag>
                <Tag style={{ margin: 0, fontSize: 12 }}>分工合作</Tag>
              </Space>
            </div>
          </div>
        </div>
      </Modal>

      {/* 历史版本抽屉 */}
      <AgentHistoryDrawer
        agent={historyAgent}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRollback={handleRollback}
        previewVersion={previewState?.agentKey === historyAgent?.key ? previewState?.version || null : null}
        onPreviewVersion={(ver) => { if (historyAgent) { setPreviewState({ agentKey: historyAgent.key, version: ver }); setHistoryOpen(false); } }}
        onExitPreview={() => setPreviewState(null)}
      />

      {/* 发布版本 Modal */}
      {publishAgent && (
        <PublishAgentModal
          open={!!publishAgentKey}
          latestVersion={getLatestVersion(publishAgent)}
          onClose={() => setPublishAgentKey(null)}
          onPublish={(version, changelog, scope) => handlePublishVersion(publishAgentKey!, version, changelog, scope)}
        />
      )}
    </div>
  );
};

export default AgentList;
