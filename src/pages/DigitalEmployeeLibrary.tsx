import React, { useState, useEffect } from 'react';
import { employeeStore, EmployeeRecord } from '../store/employeeStore';
import { Button, Input, Tag, Modal, Select, Badge, Drawer, Table, Divider, message, Steps, Switch, Checkbox, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, RollbackOutlined,
  ApiOutlined, CheckCircleOutlined, StopOutlined,
  CloudUploadOutlined, TeamOutlined, LockOutlined, GlobalOutlined,
  CopyOutlined, SendOutlined, BranchesOutlined,
  ThunderboltOutlined, AppstoreOutlined, UnorderedListOutlined,
  MobileOutlined, LinkOutlined, DesktopOutlined,
} from '@ant-design/icons';

// ─── 类型 ─────────────────────────────────────────────────
type EmployeeStatus = 'draft' | 'testing' | 'published' | 'paused' | 'archived';
type DeployScope    = 'private' | 'dept' | 'company';

interface EmployeeVersion {
  versionId: string; version: string; changelog: string; publishedAt: string; publishedBy: string; status: 'active' | 'history';
}

interface DigitalEmployeeItem {
  id: string; name: string; dept: string; domain: string; description: string;
  status: EmployeeStatus; version: string; scope: DeployScope;
  updateTime: string; callCount: number; score: number; heat: number; type: '通用款' | '定制款' | '升级款';
}

// ─── Mock 数据 ────────────────────────────────────────────
const MOCK_EMPLOYEES: DigitalEmployeeItem[] = [
  { id: 'de-001', name: '法务合规助手', dept: '法务部',   domain: '法务域', description: '合同审查、合规检查、法律风险评估，支持多种合同模板自动识别与条款提取', status: 'published', version: 'v2.1.0',      scope: 'company', updateTime: '2026-03-10', callCount: 4821, score: 4.8, heat: 95, type: '通用款' },
  { id: 'de-002', name: 'HR 招聘助手',  dept: '人力资源', domain: '人力域', description: '简历智能筛选、面试时间协调、薪酬 benchmark 参考，接入飞书日历',           status: 'published', version: 'v1.3.2',      scope: 'dept',    updateTime: '2026-03-05', callCount: 3256, score: 4.6, heat: 78, type: '定制款' },
  { id: 'de-003', name: '财务报表助手', dept: '财务部',   domain: '财务域', description: '定时拉取业务数据，AI 生成分析报告，异常数据预警推送',                     status: 'testing',   version: 'v3.0.0-beta', scope: 'dept',    updateTime: '2026-03-14', callCount: 2890, score: 4.9, heat: 88, type: '通用款' },
  { id: 'de-004', name: '代码审查助手', dept: '技术部',   domain: '技术域', description: 'PR 触发自动代码审查，安全漏洞扫描，输出审查建议并评论到 GitLab/GitHub',   status: 'paused',    version: 'v1.1.0',      scope: 'dept',    updateTime: '2026-02-28', callCount: 1654, score: 4.5, heat: 62, type: '升级款' },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功', domain: '客服域', description: '意图识别、多轮路由分发、自动记录工单，支持人工接管',                       status: 'draft',     version: 'v0.1.0',      scope: 'private', updateTime: '2026-03-15', callCount: 8923, score: 4.7, heat: 91, type: '通用款' },
  { id: 'de-006', name: '运营数据助手', dept: '运营部',   domain: '运营域', description: '自动汇总运营核心指标，生成日/周/月报告，支持钉钉/飞书推送',               status: 'published', version: 'v1.2.0',      scope: 'company', updateTime: '2026-03-12', callCount: 1243, score: 4.3, heat: 55, type: '定制款' },
  { id: 'de-007', name: '智能巡检助手', dept: '管道运营部', domain: '管道安全域', description: '整合光纤预警、机器视觉、无人机巡护等多源告警，自动完成预警研判、工单派发与闭环跟踪，覆盖管道安全巡检全流程', status: 'published', version: 'v1.0.0', scope: 'company', updateTime: '2026-03-20', callCount: 2156, score: 4.7, heat: 83, type: '定制款' },
];

const MOCK_VERSIONS: EmployeeVersion[] = [
  { versionId: 'v3', version: 'v2.1.0',   changelog: '优化合同识别准确率，新增风险等级标注',       publishedAt: '2026-03-10 14:30', publishedBy: '张三', status: 'active'  },
  { versionId: 'v2', version: 'v2.0.1',   changelog: '修复飞书文档权限异常问题',                   publishedAt: '2026-02-28 09:15', publishedBy: '张三', status: 'history' },
  { versionId: 'v1', version: 'v2.0.0',   changelog: '重构 Prompt 结构，支持多类型合同模板',       publishedAt: '2026-02-15 16:00', publishedBy: '李四', status: 'history' },
];

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; badgeStatus: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
  draft:     { label: '草稿',   badgeStatus: 'default'    },
  testing:   { label: '测试中', badgeStatus: 'processing' },
  published: { label: '运行中', badgeStatus: 'success'    },
  paused:    { label: '已暂停', badgeStatus: 'warning'    },
  archived:  { label: '已归档', badgeStatus: 'error'      },
};

const SCOPE_CONFIG: Record<DeployScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅创建者', icon: <LockOutlined />  },
  dept:    { label: '部门内',   icon: <TeamOutlined />  },
  company: { label: '全公司',   icon: <GlobalOutlined /> },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  '通用款': { color: '#6366F1', bg: '#eef2ff' },
  '定制款': { color: '#10B981', bg: '#f0fdf4' },
  '升级款': { color: '#F59E0B', bg: '#fefce8' },
};

const DOMAIN_LIST = ['全部', '法务域', '人力域', '财务域', '技术域', '客服域', '运营域', '管道安全域'];
const DOMAIN_COLORS: Record<string, string> = {
  '全部': '#6366F1', '法务域': '#6366F1', '人力域': '#10B981',
  '财务域': '#F59E0B', '技术域': '#3B82F6', '客服域': '#EC4899', '运营域': '#8B5CF6', '管道安全域': '#EF4444',
};

// ─── 工具函数 ──────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)', 'linear-gradient(135deg, #3B82F6, #06B6D4)',
  'linear-gradient(135deg, #10B981, #34d399)', 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  'linear-gradient(135deg, #EF4444, #F87171)', 'linear-gradient(135deg, #8B5CF6, #EC4899)',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const AI_AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366F1 0%,#F59E0B 100%)',
  'linear-gradient(135deg,#3B82F6 0%,#10B981 100%)',
  'linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)',
  'linear-gradient(135deg,#14B8A6 0%,#6366F1 100%)',
  'linear-gradient(135deg,#EF4444 0%,#F59E0B 100%)',
  'linear-gradient(135deg,#10B981 0%,#3B82F6 100%)',
];
// 根据员工姓名+部门+业务域+职责内容生成渐变头像色
function getContentGradient(name: string, dept = '', domain = '', desc = ''): string {
  const combined = name + dept + domain + desc.slice(0, 30);
  let hash = 0;
  for (let i = 0; i < combined.length; i++) hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  return AI_AVATAR_GRADIENTS[Math.abs(hash) % AI_AVATAR_GRADIENTS.length];
}

// ─── 向导配置 ─────────────────────────────────────────────
const DEPARTMENTS = ['法务部', '人力资源', '财务部', '技术部', '产品部', '市场部', '客户成功', '运营部'];
const MODEL_OPTIONS = [
  { id: 'chat-model', name: '通用对话',   tag: '均衡推荐', desc: '适合日常问答、任务处理，性价比最优',            icon: '💬', color: '#6366F1' },
  { id: 'gpt-4o',     name: '高性能推理', tag: '复杂场景', desc: '强逻辑推理，适合法务、财务等专业分析',          icon: '🧠', color: '#8B5CF6' },
  { id: 'qwen-max',   name: '长文本处理', tag: '大文档',   desc: '超长上下文，适合合同全文审查、报告生成',        icon: '📄', color: '#10B981' },
  { id: 'glm-4',      name: '国产安全',   tag: '数据合规', desc: '国产大模型私有化部署，满足数据安全要求',        icon: '🛡️', color: '#F59E0B' },
];
const KNOWLEDGE_BASES = [
  { id: 'kb1', name: '法律法规库',   desc: '国家法律法规、行业规范文件', icon: '⚖️' },
  { id: 'kb2', name: '公司制度手册', desc: '内部规章制度、标准流程文档', icon: '📋' },
  { id: 'kb3', name: '产品知识库',   desc: '产品说明、FAQ、使用手册',   icon: '📦' },
  { id: 'kb4', name: '行业研报库',   desc: '行业分析报告、市场数据',    icon: '📊' },
  { id: 'kb5', name: '技术文档库',   desc: 'API 文档、开发规范、架构设计', icon: '💻' },
];
const SKILL_LIST = [
  { id: 'sk1', name: '网络搜索',     type: 'Skill', icon: '🔍', desc: '实时搜索互联网信息' },
  { id: 'sk2', name: '飞书文档',     type: 'Skill', icon: '📄', desc: '飞书文档读写与管理' },
  { id: 'sk3', name: 'Python 执行',  type: 'Skill', icon: '🐍', desc: '执行 Python 代码，处理结构化数据' },
  { id: 'sk4', name: 'PDF 解析',     type: 'Skill', icon: '📃', desc: '解析 PDF 文档内容' },
  { id: 'sk5', name: '内容审核流程', type: '工作流', icon: '⚡', desc: '多节点内容合规审查' },
];
const MCP_SERVERS = [
  { id: 'mcp1', name: '数据库连接器',  desc: '连接企业内部 MySQL/Oracle/PostgreSQL', icon: '🗄️' },
  { id: 'mcp2', name: '飞书 MCP',      desc: '读写飞书文档、日历、审批、多维表格',   icon: '📋' },
  { id: 'mcp3', name: 'GitHub MCP',    desc: 'PR 管理、Issue 操作、代码仓库读写',    icon: '🐙' },
  { id: 'mcp4', name: 'CRM 连接器',   desc: '客户数据读写、商机跟踪、销售漏斗',    icon: '📊' },
  { id: 'mcp5', name: 'ERP 连接器',   desc: '供应链、库存、财务数据实时同步',      icon: '🏭' },
];

const RESPONSE_STYLES = [
  { id: 'formal',   label: '正式严谨', desc: '措辞严谨，引用依据，适合法务/财务场景', icon: '⚖️' },
  { id: 'friendly', label: '专业友好', desc: '专业中带亲和力，适合客服/HR 场景',       icon: '🤝' },
  { id: 'concise',  label: '简洁直接', desc: '结论优先，省略铺垫，适合技术/研发场景', icon: '⚡' },
];
const CHANNELS = [
  { id: 'api',    label: 'REST API',   desc: '标准 HTTP 接口，支持外部系统集成', icon: '🔌' },
  { id: 'flow',   label: '工作流节点', desc: '作为节点嵌入工作流',               icon: '⚡' },
  { id: 'feishu', label: '飞书机器人', desc: '以飞书群机器人形式提供服务',       icon: '🪶' },
  { id: 'ding',   label: '钉钉机器人', desc: '以钉钉群机器人形式提供服务',       icon: '📎' },
];
const DEFAULT_PROMPT = `你是「{员工名称}」，{部门}的{角色定位}。

【职责范围】
- 请在此描述该员工的核心职责1
- 请在此描述该员工的核心职责2

【工作原则】
1. 所有回答须基于知识库与工具检索结果，不凭空推断
2. 遇到超出职责范围的问题，说明边界并引导至正确渠道

【输出规范】
- 回复语言：简体中文
- 格式：结构化输出，核心结论置前`;

interface WizardData {
  name: string; dept: string; role: string; description: string; domain: string;
  model: string; prompt: string; kbEnabled: Record<string, boolean>;
  skillEnabled: Record<string, boolean>; mcpEnabled: Record<string, boolean>;
  responseStyle: string; restrictions: string[]; accessScope: string;
  accessTargets: string[];
  channels: string[];
}
const initWizardData = (): WizardData => ({
  name: '', dept: '', role: '', description: '', domain: '',
  model: 'chat-model', prompt: DEFAULT_PROMPT,
  kbEnabled: {}, skillEnabled: { sk1: true, sk2: true }, mcpEnabled: {},
  responseStyle: 'friendly', restrictions: ['r1', 'r2'],
  accessScope: 'company', accessTargets: [], channels: ['api'],
});

const STEPS = [
  { title: '基础信息', description: '员工身份与职能' },
  { title: 'AI 能力',  description: '模型、知识与技能' },
  { title: '部署配置', description: '上线渠道与权限'  },
  { title: '测试发布', description: '调试验证并上线'  },
];

// ─── 步骤标题组件 ──────────────────────────────────────────
const SectionTitle: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
    {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
  </div>
);

// ─── 全页向导（创建 / 编辑） ──────────────────────────────
interface TestMessage { role: 'user' | 'ai'; content: string; }

const EmployeeConfigPage: React.FC<{
  onClose: () => void;
  onBack?: () => void;
  initialData?: Partial<WizardData>;
  isEdit?: boolean;
}> = ({ onClose, onBack, initialData, isEdit }) => {
  const [data, setData] = useState<WizardData>({ ...initWizardData(), ...initialData });
  const [stepAvatarUrl, setStepAvatarUrl] = useState<string | null>(null);
  const [stepAiDescLoading, setStepAiDescLoading] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const stepAvatarRef = React.useRef<HTMLInputElement>(null);
  const update = (patch: Partial<WizardData>) => setData(prev => ({ ...prev, ...patch }));

  // 自动保存
  useEffect(() => {
    setAutoSaved(false);
    const t = setTimeout(() => setAutoSaved(true), 800);
    return () => clearTimeout(t);
  }, [data]);

  const avatarBg   = data.name.trim() ? getAvatarColor(data.name.trim()) : '#e2e8f0';
  const avatarChar = data.name.trim() ? data.name.trim().charAt(0) : '?';

  const enabledKbs       = KNOWLEDGE_BASES.filter(kb => data.kbEnabled[kb.id]);
  const enabledSkills    = SKILL_LIST.filter(sk => data.skillEnabled[sk.id]);
  const enabledMcps      = MCP_SERVERS.filter(m => data.mcpEnabled[m.id]);
  const selectedChannels = CHANNELS.filter(ch => data.channels.includes(ch.id));
  const selectedModel    = MODEL_OPTIONS.find(m => m.id === data.model);
  const configItems = [
    { label: '员工身份', ok: !!data.name && !!data.dept, text: data.name ? `${data.name} · ${data.dept}` : '未配置' },
    { label: 'AI 模型',  ok: !!data.model, text: selectedModel?.name || '未选择' },
    { label: '提示词',   ok: data.prompt.length > 30, text: data.prompt.length > 30 ? `已配置（${data.prompt.length} 字符）` : '内容过少' },
    { label: '知识库',   ok: true, text: enabledKbs.length > 0 ? enabledKbs.map(kb => kb.name).join('、') : '未绑定' },
    { label: '接入渠道', ok: selectedChannels.length > 0, text: selectedChannels.length > 0 ? selectedChannels.map(c => c.label).join('、') : '未选择' },
  ];
  const allOk = configItems.every(i => i.ok);

  // ── 全页布局 ──
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#f5f6fa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* 顶部栏 */}
      <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e8e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        {/* 左：返回 + 标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={onBack ?? onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', fontSize: 16, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >
            ←
          </div>
          <div style={{ width: 1, height: 18, background: '#e8e8e8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>{avatarChar}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{data.name || (isEdit ? '编辑数字员工' : '新建数字员工')}</div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.2 }}>{data.dept || '未选择部门'}</div>
            </div>
          </div>
        </div>

        {/* 右：自动保存 + 发布 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {autoSaved && (
            <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircleOutlined style={{ fontSize: 11 }} /> 已自动保存
            </span>
          )}
          <Button type="primary" icon={<CheckCircleOutlined />}
            style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}
            onClick={() => { onClose(); message.success(`数字员工「${data.name || '新员工'}」已发布`); }}>
            发布
          </Button>
        </div>
      </div>

      {/* 主体：左配置 + 右预览 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* 左：配置面板（AI能力 + 部署配置，一页完成） */}
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8f0', background: '#fff', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* ── AI 模型 ── */}
              <div>
                <SectionTitle title="AI 模型" desc="选择驱动该员工的大语言模型" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {MODEL_OPTIONS.map(m => (
                    <div key={m.id} onClick={() => update({ model: m.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', border: data.model === m.id ? `1.5px solid ${m.color}` : '1px solid #e8e8e8', background: data.model === m.id ? `${m.color}08` : '#fafafa' }}>
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: data.model === m.id ? m.color : '#1a1a1a' }}>{m.name}</span>
                          <Tag style={{ fontSize: 10, margin: 0, color: m.color, borderColor: `${m.color}40`, background: `${m.color}10`, borderRadius: 4 }}>{m.tag}</Tag>
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>{m.desc}</div>
                      </div>
                      {data.model === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 角色提示词 ── */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>角色提示词 <span style={{ color: '#ff4d4f', fontSize: 11 }}>*</span></span>
                  <Button type="link" size="small" style={{ padding: 0, fontSize: 12, color: '#6366F1' }} onClick={() => update({ prompt: DEFAULT_PROMPT })}>重置模板</Button>
                </div>
                <Input.TextArea value={data.prompt} onChange={e => update({ prompt: e.target.value })} rows={7} style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 12, resize: 'none' }} />
              </div>

              {/* ── 知识库 ── */}
              <div>
                <SectionTitle title="知识库" desc="员工将优先检索知识库内容后再回答" />
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  {KNOWLEDGE_BASES.map((kb, idx) => (
                    <div key={kb.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: idx < KNOWLEDGE_BASES.length - 1 ? '1px solid #f5f5f5' : 'none', background: data.kbEnabled[kb.id] ? '#f9f8ff' : '#fff' }}>
                      <span style={{ fontSize: 16 }}>{kb.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: data.kbEnabled[kb.id] ? '#6366F1' : '#333' }}>{kb.name}</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>{kb.desc}</div>
                      </div>
                      <Switch size="small" checked={!!data.kbEnabled[kb.id]} onChange={v => update({ kbEnabled: { ...data.kbEnabled, [kb.id]: v } })} style={{ background: data.kbEnabled[kb.id] ? '#6366F1' : undefined }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#bbb' }}>没有合适的知识库？</span>
                  <span
                    onClick={() => { onClose(); window.location.hash = 'knowledge-base'; }}
                    style={{ fontSize: 11, color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                  >
                    ＋ 知识库
                  </span>
                </div>
              </div>

              {/* ── 技能 ── */}
              <div>
                <SectionTitle title="技能" desc="选择该员工可调用的 Skills / 工作流" />
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  {SKILL_LIST.map((sk, idx) => (
                    <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: idx < SKILL_LIST.length - 1 ? '1px solid #f5f5f5' : 'none', background: data.skillEnabled[sk.id] ? '#fff' : '#fafafa' }}>
                      <span style={{ fontSize: 16 }}>{sk.icon}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: data.skillEnabled[sk.id] ? '#1a1a1a' : '#aaa', marginRight: 6 }}>{sk.name}</span>
                        <Tag style={{ margin: 0, fontSize: 10, borderRadius: 4, color: sk.type === 'Skill' ? '#6366F1' : '#10B981', borderColor: sk.type === 'Skill' ? '#c7d2fe' : '#a7f3d0', background: sk.type === 'Skill' ? '#eef2ff' : '#f0fdf4' }}>{sk.type}</Tag>
                      </div>
                      <Switch size="small" checked={!!data.skillEnabled[sk.id]} onChange={v => update({ skillEnabled: { ...data.skillEnabled, [sk.id]: v } })} style={{ background: data.skillEnabled[sk.id] ? '#6366F1' : undefined }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#bbb' }}>没有合适的技能/工作流？</span>
                  <span
                    onClick={() => { onClose(); window.location.hash = 'skill-center'; }}
                    style={{ fontSize: 11, color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                  >
                    ＋ 技能
                  </span>
                  <span style={{ fontSize: 11, color: '#e0e0e0' }}>|</span>
                  <span
                    onClick={() => { onClose(); window.location.hash = 'workflow-center'; }}
                    style={{ fontSize: 11, color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                  >
                    ＋ 工作流
                  </span>
                </div>
              </div>

              {/* ── MCP Server ── */}
              <div>
                <SectionTitle title="MCP Server" desc="绑定后员工可直接读写企业内部系统数据" />
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  {MCP_SERVERS.map((mcp, idx) => (
                    <div key={mcp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: idx < MCP_SERVERS.length - 1 ? '1px solid #f5f5f5' : 'none', background: data.mcpEnabled[mcp.id] ? '#f0fdf4' : '#fafafa' }}>
                      <span style={{ fontSize: 16 }}>{mcp.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: data.mcpEnabled[mcp.id] ? '#10B981' : '#333', marginBottom: 1 }}>{mcp.name}</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>{mcp.desc}</div>
                      </div>
                      <Switch size="small" checked={!!data.mcpEnabled[mcp.id]} onChange={v => update({ mcpEnabled: { ...data.mcpEnabled, [mcp.id]: v } })} style={{ background: data.mcpEnabled[mcp.id] ? '#10B981' : undefined }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#bbb' }}>没有合适的 MCP Server？</span>
                  <span
                    onClick={() => { onClose(); window.location.hash = 'mcp-server'; }}
                    style={{ fontSize: 11, color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}
                    onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
                    onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
                  >
                    ＋ MCP Server
                  </span>
                </div>
              </div>

              {/* ── 分隔线 ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
              </div>

              {/* ── 访问权限 ── */}
              <div>
                <SectionTitle title="访问权限" desc="控制哪些人可以看到和使用该数字员工" />
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[
                    { value: 'company', icon: '🌐', label: '全公司可见', desc: '全员可见可用' },
                    { value: 'private', icon: '🔒', label: '仅自己可见', desc: '私有，仅自己可用' },
                    { value: 'custom',  icon: '👥', label: '指定部门/人员', desc: '选定范围可访问' },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => update({ accessScope: opt.value, accessTargets: opt.value !== 'custom' ? [] : data.accessTargets })} style={{ flex: 1, padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'center', border: data.accessScope === opt.value ? '1.5px solid #6366F1' : '1px solid #e8e8e8', background: data.accessScope === opt.value ? '#f5f4ff' : '#fafafa', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: data.accessScope === opt.value ? '#6366F1' : '#1a1a1a', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
                {data.accessScope === 'custom' && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 6, fontWeight: 500 }}>选择可访问的人员或部门</div>
                    <Select
                      mode="multiple"
                      placeholder="从企业组织架构中选择人员或部门"
                      value={data.accessTargets}
                      onChange={vals => update({ accessTargets: vals })}
                      style={{ width: '100%' }}
                      optionFilterProp="label"
                      options={[
                        { label: '── 部门 ──', value: '__dept__', disabled: true },
                        ...DEPARTMENTS.map(d => ({ label: `🏢 ${d}`, value: `dept:${d}` })),
                        { label: '── 人员 ──', value: '__person__', disabled: true },
                        { label: '👤 张三（法务部）', value: 'user:zhangsan' },
                        { label: '👤 李四（人力资源）', value: 'user:lisi' },
                        { label: '👤 王五（财务部）', value: 'user:wangwu' },
                        { label: '👤 赵六（技术部）', value: 'user:zhaoliu' },
                        { label: '👤 陈七（产品部）', value: 'user:chenqi' },
                        { label: '👤 周八（市场部）', value: 'user:zhouba' },
                        { label: '👤 吴九（客户成功）', value: 'user:wujiu' },
                        { label: '👤 郑十（运营部）', value: 'user:zhengshi' },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* ── 接入渠道 ── */}
              <div>
                <SectionTitle title="接入渠道" desc="支持 H5 / elink / 小程序 三大通用入口，可多选" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { id: 'h5',      label: 'H5 网页',    desc: '适配电脑/移动端，浏览器直接访问', icon: <DesktopOutlined /> },
                    { id: 'elink',   label: 'elink 嵌入', desc: '嵌入政企内部系统/政务服务平台',   icon: <LinkOutlined />    },
                    { id: 'miniapp', label: '小程序',      desc: '适配政企专属 APP 小程序',          icon: <MobileOutlined /> },
                  ].map(ch => {
                    const selected = data.channels.includes(ch.id);
                    return (
                      <div key={ch.id} onClick={() => update({ channels: selected ? data.channels.filter(c => c !== ch.id) : [...data.channels, ch.id] })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', border: selected ? '1.5px solid #6366F1' : '1px solid #e8e8e8', background: selected ? '#f5f4ff' : '#fafafa' }}>
                        <span style={{ fontSize: 16, color: selected ? '#6366F1' : '#bbb' }}>{ch.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: selected ? '#6366F1' : '#333', marginRight: 8 }}>{ch.label}</span>
                          <div style={{ fontSize: 11, color: '#999' }}>{ch.desc}</div>
                        </div>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: selected ? 'none' : '1.5px solid #d1d5db', background: selected ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>更多接入方式</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CHANNELS.map(ch => {
                    const selected = data.channels.includes(ch.id);
                    return (
                      <div key={ch.id} onClick={() => update({ channels: selected ? data.channels.filter(c => c !== ch.id) : [...data.channels, ch.id] })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', border: selected ? '1.5px solid #6366F1' : '1px solid #e8e8e8', background: selected ? '#f5f4ff' : '#fafafa' }}>
                        <span style={{ fontSize: 16 }}>{ch.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: selected ? '#6366F1' : '#333', marginRight: 8 }}>{ch.label}</span>
                          <span style={{ fontSize: 12, color: '#999' }}>{ch.desc}</span>
                        </div>
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: selected ? 'none' : '1.5px solid #d1d5db', background: selected ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* 底部导航 */}
          <div style={{ padding: '14px 32px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0, background: '#fff' }}>
            <Button onClick={onBack ?? onClose}>上一步</Button>
          </div>
        </div>

        {/* 右：配置预览面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7f8fc', overflow: 'hidden' }}>
          {/* 配置核查 */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e8e8f0', background: '#fff', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircleOutlined style={{ color: '#10B981' }} /> 配置核查
              {allOk
                ? <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>✓ 可以发布</span>
                : <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 5, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>⚠️ 待完善</span>
              }
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {configItems.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: item.ok ? '#f0fdf4' : '#fffbeb', border: `1px solid ${item.ok ? '#bbf7d0' : '#fde68a'}` }}>
                  <span style={{ fontSize: 10 }}>{item.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: 11, color: item.ok ? '#16a34a' : '#d97706', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: '#999' }}>· {item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 调试预览 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>调试预览</span>
              <span style={{ fontSize: 11, color: '#bbb' }}>· 效果仅供参考</span>
            </div>
            {/* 聊天内容区 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 20px', background: '#f5f6fa' }}>
              {/* 员工头像 */}
              <div style={{ width: 80, height: 80, borderRadius: 22, background: getContentGradient(data.name, data.dept, data.domain, data.description), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 16, boxShadow: '0 4px 20px rgba(99,102,241,0.25)', flexShrink: 0 }}>
                {data.name.trim().charAt(0) || '✦'}
              </div>
              {/* 员工名称 */}
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>
                {data.name || '数字员工'}
              </div>
              {/* 欢迎语 */}
              <div style={{ width: '100%', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 16, fontSize: 14, color: '#333', lineHeight: 1.7, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                {data.name
                  ? `你好！我是${data.name}，${data.description ? data.description.slice(0, 60) + (data.description.length > 60 ? '，欢迎向我提问！' : '') : '专注于' + (data.domain || '企业业务') + '相关工作'}，让每一次工作协作都更高效~`
                  : '你好！我是你的数字员工助手，有什么可以帮助你的？让我们一起高效工作~'}
              </div>
              {/* 建议问题 */}
              {[
                data.name ? `${data.name}能帮我做什么？` : '你能帮我做什么？',
                data.domain ? `${data.domain}方面有哪些常见问题？` : '你擅长处理哪类任务？',
                '如何更好地使用你的功能？',
              ].map((q, idx) => (
                <div key={idx}
                  style={{ width: '100%', padding: '12px 16px', marginBottom: 10, border: '1px solid #e8e8e8', borderRadius: 10, fontSize: 13, color: '#333', cursor: 'pointer', background: '#fff', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1'; (e.currentTarget as HTMLDivElement).style.color = '#6366F1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e8'; (e.currentTarget as HTMLDivElement).style.color = '#333'; }}
                >{q}</div>
              ))}
            </div>
            {/* 底部输入栏 */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e8e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#bbb', fontSize: 14, background: '#fafafa', flexShrink: 0 }}>🗑</div>
              <div style={{ flex: 1, padding: '8px 14px', border: '1px solid #e8e8e8', borderRadius: 24, fontSize: 12, color: '#bbb', background: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'none' }}>请输入你的问题，支持对上传文件内容进行提问</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#bbb', fontSize: 14, background: '#fafafa', flexShrink: 0 }}>📎</div>
              <div style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#bbb', fontSize: 14, background: '#fafafa', flexShrink: 0 }}>🎙</div>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, flexShrink: 0 }}>▶</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ─── 版本管理 Drawer ───────────────────────────────────────
const VersionDrawer: React.FC<{ open: boolean; onClose: () => void; employeeName: string }> = ({ open, onClose, employeeName }) => (
  <Drawer title={`版本管理 · ${employeeName}`} open={open} onClose={onClose} width={480}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MOCK_VERSIONS.map(ver => (
        <div key={ver.versionId} style={{ border: `1px solid ${ver.status === 'active' ? '#6366F1' : '#e8e8e8'}`, borderRadius: 10, padding: '14px 16px', background: ver.status === 'active' ? '#f5f4ff' : '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: ver.status === 'active' ? '#6366F1' : '#1a1a1a' }}>{ver.version}</span>
            {ver.status === 'active' && <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>当前版本</Tag>}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{ver.changelog}</div>
          <div style={{ fontSize: 11, color: '#bbb' }}>{ver.publishedAt} · {ver.publishedBy}</div>
          {ver.status === 'history' && <Button size="small" icon={<RollbackOutlined />} style={{ marginTop: 10, borderRadius: 6, fontSize: 12, color: '#6366F1', borderColor: '#6366F1' }} onClick={() => message.success(`已回滚到 ${ver.version}`)}>回滚到此版本</Button>}
        </div>
      ))}
    </div>
  </Drawer>
);

// ─── 主组件：数字员工库 ────────────────────────────────────
const DigitalEmployeeLibrary: React.FC = () => {
  // 从共享 Store 读取员工数据，订阅变化实现实时更新
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = employeeStore.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, []);

  // 将 Store 数据映射到本页面的 DigitalEmployeeItem 格式
  const storeEmployees = employeeStore.getEmployees();
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<DigitalEmployeeItem>>>({});

  const employees: DigitalEmployeeItem[] = storeEmployees.map(e => ({
    id: e.id, name: e.name, dept: e.dept, domain: e.domain,
    description: e.description, status: e.status as EmployeeStatus,
    version: e.version, scope: e.scope as DeployScope,
    updateTime: e.updateTime, callCount: e.callCount,
    score: e.score, heat: e.heat, type: e.type,
    ...(localOverrides[e.id] || {}),
  }));
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchText, setSearchText]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('全部');
  const [createWizardOpen, setCreateWizardOpen]   = useState(false);
  const [createTab, setCreateTab]                 = useState<'blank' | 'ai'>('blank');
  // 空白创建表单
  const [newEmpName, setNewEmpName]               = useState('');
  const [newEmpDesc, setNewEmpDesc]               = useState('');
  const [newEmpAvatarType, setNewEmpAvatarType]   = useState<'auto' | 'ai' | 'upload'>('auto');
  const [newEmpAvatarUrl, setNewEmpAvatarUrl]     = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate]   = useState<string | null>(null);
  const [aiDescLoading, setAiDescLoading]         = useState(false);
  const [aiAvatarLoading, setAiAvatarLoading]     = useState(false);
  // AI 创建 tab
  const [aiCreateInput, setAiCreateInput]         = useState('');
  const [aiCreateLoading, setAiCreateLoading]     = useState(false);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);
  const [newEmpDept, setNewEmpDept]     = useState('');
  const [newEmpDomain, setNewEmpDomain] = useState('');
  const [newEmpRole, setNewEmpRole]     = useState('');

  const resetCreateWizard = () => {
    setCreateTab('blank'); setNewEmpName(''); setNewEmpDesc('');
    setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null);
    setSelectedTemplate(null); setAiCreateInput(''); setAiCreateLoading(false);
    setAiDescLoading(false); setAiAvatarLoading(false);
    setNewEmpDept(''); setNewEmpDomain(''); setNewEmpRole('');
  };

  const AGENT_TEMPLATES = [
    { id: 't1', name: '法务合规助手', desc: '合同审查·法规咨询', color: 'linear-gradient(135deg,#6366F1,#8B5CF6)', dept: '法务部',   role: '法务合规顾问', domain: '法务域'   },
    { id: 't2', name: '智能客服助手', desc: '7×24小时客户服务',  color: 'linear-gradient(135deg,#10B981,#34D399)', dept: '客户成功',  role: '智能客服专员', domain: '客服域'   },
    { id: 't3', name: '数据分析专家', desc: '数据洞察·可视化报告', color: 'linear-gradient(135deg,#3B82F6,#06B6D4)', dept: '技术部',   role: '数据分析师',  domain: '技术域'   },
    { id: 't4', name: '工作汇报助手', desc: '周报·会议纪要生成', color: 'linear-gradient(135deg,#F59E0B,#FBBF24)', dept: '运营部',   role: '文档生产专员', domain: '运营域'   },
    { id: 't5', name: '智能巡检助手', desc: '设备监控·预警研判', color: 'linear-gradient(135deg,#EF4444,#F87171)', dept: '人力资源', role: '智能巡检员',  domain: '管道安全域' },
  ];

  const AI_SAMPLES = [
    '创建一个能处理法务合规审查、合同风险识别的数字员工',
    '我想要一个工作汇报专家，能够根据我提供的资料生成项目总结汇报、周报或会议纪要等',
    '创建一个智能巡检助手，负责监控设备状态、分析异常预警并生成巡检报告',
    '实现一个客户服务助手，能解答产品问题、处理投诉、自动生成工单',
  ];

  const handleAiGenerate = () => {
    if (!aiCreateInput.trim() || aiCreateLoading) return;
    setAiCreateLoading(true);
    setTimeout(() => {
      const input = aiCreateInput.trim();
      const isLaw  = input.includes('法务') || input.includes('合规') || input.includes('合同');
      const isCust = input.includes('客户') || input.includes('客服');
      const isData = input.includes('数据') || input.includes('分析');
      const isOps  = input.includes('巡检') || input.includes('运维') || input.includes('设备');
      const isRpt  = input.includes('汇报') || input.includes('周报') || input.includes('纪要');
      const mockName   = isLaw ? '法务合规专员' : isCust ? '智能客服专员' : isData ? '数据分析专家' : isOps ? '智能巡检助手' : isRpt ? '工作汇报专家' : '数字员工助手';
      const mockDept   = isLaw ? '法务部' : isCust ? '客户成功' : isData ? '技术部' : isOps ? '运营部' : '综合办公室';
      const mockDomain = isLaw ? '法务域' : isCust ? '客服域' : isData ? '技术域' : isOps ? '运营域' : '技术域';
      const mockRole   = isLaw ? '法务合规顾问' : isCust ? '智能客服专员' : isData ? '数据分析师' : isOps ? '智能巡检员' : isRpt ? '文档生产专员' : '数字员工助手';
      const mockDesc   = `${mockName}基于 AI 大模型驱动，${input.slice(0, 30)}。具备 7×24 小时在线服务能力，严格遵循企业规范标准，可高效完成对应岗位的核心工作职责。`;
      setNewEmpName(mockName);
      setNewEmpDept(mockDept);
      setNewEmpDomain(mockDomain);
      setNewEmpRole(mockRole);
      setNewEmpDesc(mockDesc);
      setNewEmpAvatarType('ai');
      setNewEmpAvatarUrl(null);
      setSelectedTemplate(null);
      setAiCreateLoading(false);
      setCreateTab('blank');
      message.success('AI 已生成员工配置，请确认或修改');
    }, 1600);
  };

  const handleConfirmCreate = () => {
    if (!newEmpName.trim()) { message.warning('请填写员工名称'); return; }
    if (!newEmpDept)        { message.warning('请选择所属部门'); return; }
    setCreateWizardOpen(false);
    setCreateInitialData({ name: newEmpName.trim(), description: newEmpDesc.trim(), dept: newEmpDept, domain: newEmpDomain, role: '' });
    setCreateModalOpen(true);
  };

  const [createModalOpen, setCreateModalOpen]   = useState(false);
  const [createInitialData, setCreateInitialData] = useState<{name:string;description:string;dept:string;domain:string;role:string}>({name:'',description:'',dept:'',domain:'',role:''});
  const [editModalOpen, setEditModalOpen]       = useState(false);
  const [editEmployee, setEditEmployee]         = useState<DigitalEmployeeItem | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [apiDrawerOpen, setApiDrawerOpen]       = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployeeItem | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !searchText || e.name.includes(searchText) || e.description.includes(searchText);
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDomain = domainFilter === '全部' || e.domain === domainFilter;
    return matchSearch && matchStatus && matchDomain;
  });

  const handleStatusChange = (id: string, newStatus: EmployeeStatus) => {
    employeeStore.updateEmployee(id, { status: newStatus as any });
    setLocalOverrides(prev => ({ ...prev, [id]: { ...prev[id], status: newStatus } }));
    const labels: Record<string, string> = { published: '已发布上线', paused: '已暂停', archived: '已归档' };
    message.success(labels[newStatus] || '状态已更新');
  };

  // ── 卡片视图 ────────────────────────────────────────────
  const CardView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {filteredEmployees.map(r => {
        const statusCfg = STATUS_CONFIG[r.status];
        const typeCfg   = TYPE_CONFIG[r.type];
        return (
          <div
            key={r.id}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8e8f0', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)'; el.style.transform = 'translateY(-2px)'; el.style.borderColor = '#6366F1'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; el.style.transform = ''; el.style.borderColor = '#e8e8f0'; }}
          >
            <div style={{ height: 4, background: getAvatarColor(r.name) }} />
            <div style={{ padding: '16px 18px' }}>
              {/* 头部 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: getAvatarColor(r.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>{r.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{r.name}</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: typeCfg.bg, color: typeCfg.color, fontWeight: 500 }}>{r.type}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{r.domain}</span>
                    </div>
                  </div>
                </div>
                <Badge status={statusCfg.badgeStatus} text={<span style={{ fontSize: 11, color: '#666' }}>{statusCfg.label}</span>} />
              </div>
              {/* 描述 */}
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {r.description}
              </div>
              {/* 指标行 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                <div style={{ textAlign: 'center', padding: '6px 0', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>{r.callCount >= 1000 ? (r.callCount / 1000).toFixed(1) + 'k' : r.callCount}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>调用量</div>
                </div>
                <Tooltip title={`基于 ${employeeStore.getEmployee(r.id)?.ratingCount ?? 0} 位用户评分的均值（1-5星）`}>
                  <div style={{ textAlign: 'center', padding: '6px 0', background: '#f9fafb', borderRadius: 8, cursor: 'help' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>⭐ {r.score}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>用户评分</div>
                  </div>
                </Tooltip>
                <Tooltip title="近7日调用量占历史峰值比例，反映当前活跃程度">
                  <div style={{ textAlign: 'center', padding: '6px 0', background: '#f9fafb', borderRadius: 8, cursor: 'help' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6366F1' }}>{r.heat}%</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>活跃热度</div>
                  </div>
                </Tooltip>
              </div>
              {/* 版本 + 部门 */}
              <div style={{ fontSize: 11, color: '#bbb', marginBottom: 12 }}>{r.dept} · {r.version} · {r.updateTime}</div>
              {/* 操作 */}
              <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f5f5f5', paddingTop: 10 }}>
                <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setEditEmployee(r); setEditModalOpen(true); }}>编辑</Button>
                <Button size="small" type="text" icon={<BranchesOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setVersionDrawerOpen(true); }}>版本</Button>
                <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
                <div style={{ flex: 1 }} />
                {(r.status === 'draft' || r.status === 'testing') && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>发布</Button>}
                {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
                {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── 表格视图 ────────────────────────────────────────────
  const columns: ColumnsType<DigitalEmployeeItem> = [
    {
      title: '数字员工', key: 'name', width: 260,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: getAvatarColor(r.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700 }}>{r.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{r.dept} · {r.domain} · {r.version}</div>
          </div>
        </div>
      ),
    },
    { title: '类型', key: 'type', width: 80, render: (_, r) => <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: TYPE_CONFIG[r.type].bg, color: TYPE_CONFIG[r.type].color, fontWeight: 500 }}>{r.type}</span> },
    { title: '状态', key: 'status', width: 100, render: (_, r) => { const cfg = STATUS_CONFIG[r.status]; return <Badge status={cfg.badgeStatus} text={<span style={{ fontSize: 12 }}>{cfg.label}</span>} />; } },
    { title: '访问权限', key: 'scope', width: 110, render: (_, r) => { const cfg = SCOPE_CONFIG[r.scope]; return <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>{cfg.icon} {cfg.label}</span>; } },
    { title: '调用量', key: 'callCount', width: 90, render: (_, r) => <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>{r.callCount >= 1000 ? (r.callCount / 1000).toFixed(1) + 'k' : r.callCount}</span> },
    { title: '评分', key: 'score', width: 80, render: (_, r) => <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>⭐ {r.score}</span> },
    { title: '更新时间', key: 'updateTime', width: 110, render: (_, r) => <span style={{ fontSize: 12, color: '#999' }}>{r.updateTime}</span> },
    {
      title: '操作', key: 'actions', width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setEditEmployee(r); setEditModalOpen(true); }}>编辑</Button>
          <Button size="small" type="text" icon={<BranchesOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setVersionDrawerOpen(true); }}>版本</Button>
          <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }} onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          {(r.status === 'draft' || r.status === 'testing') && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>发布</Button>}
          {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
          {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>}
          <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }} onClick={() => Modal.confirm({ title: `确认归档「${r.name}」？`, content: '归档后不可再调用', okText: '归档', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => handleStatusChange(r.id, 'archived') })}>归档</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索员工名称 / 描述 / 业务域..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 280, borderRadius: 8 }} allowClear />
        <Select placeholder="状态筛选" allowClear style={{ width: 120 }} onChange={v => setStatusFilter(v || '')} options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#999' }}>共 <strong style={{ color: '#333' }}>{filteredEmployees.length}</strong> 个</span>
        <div style={{ display: 'flex', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
          <Button type={viewMode === 'card' ? 'primary' : 'text'} icon={<AppstoreOutlined />} size="small" style={{ borderRadius: 0, background: viewMode === 'card' ? '#6366F1' : 'transparent', border: 'none', height: 32, padding: '0 12px', color: viewMode === 'card' ? '#fff' : '#666' }} onClick={() => setViewMode('card')}>卡片</Button>
          <Button type={viewMode === 'list' ? 'primary' : 'text'} icon={<UnorderedListOutlined />} size="small" style={{ borderRadius: 0, background: viewMode === 'list' ? '#6366F1' : 'transparent', border: 'none', height: 32, padding: '0 12px', color: viewMode === 'list' ? '#fff' : '#666' }} onClick={() => setViewMode('list')}>列表</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateWizardOpen(true)} style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}>创建数字员工</Button>
      </div>

      {/* 域分类 Tab */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {DOMAIN_LIST.map(d => (
          <div
            key={d}
            onClick={() => setDomainFilter(d)}
            style={{ padding: '5px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', background: domainFilter === d ? DOMAIN_COLORS[d] : '#f5f5f5', color: domainFilter === d ? '#fff' : '#666', fontWeight: domainFilter === d ? 600 : 400 }}
          >{d}</div>
        ))}
      </div>

      {/* 内容区 */}
      {viewMode === 'card' ? <CardView /> : (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <Table dataSource={filteredEmployees} columns={columns} rowKey="id" pagination={{ pageSize: 10, size: 'small' }} size="middle" />
        </div>
      )}

      {/* ── 统一创建弹窗 ── */}
      <Modal
        open={createWizardOpen}
        onCancel={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
        footer={null}
        width={860}
        centered
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        {/* 隐藏文件 input */}
        <input type="file" accept="image/*" ref={avatarFileRef} style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            setNewEmpAvatarUrl(url);
            setNewEmpAvatarType('upload');
            (e.target as HTMLInputElement).value = '';
          }}
        />

        {/* 头部：标题 + Tab 切换 + 关闭 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '22px 28px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>创建数字员工</div>
          <div style={{ flex: 1 }} />
          {/* 右侧 Tab 切换 */}
          <div style={{ display: 'flex', gap: 0, background: '#F3F4F6', borderRadius: 8, padding: 3, marginRight: 16 }}>
            {([
              { key: 'blank', label: '空白创建' },
              { key: 'ai',    label: '✦ AI创建' },
            ] as const).map(tab => (
              <div key={tab.key} onClick={() => setCreateTab(tab.key)}
                style={{ padding: '5px 16px', borderRadius: 6, fontSize: 12, fontWeight: createTab === tab.key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
                  color: createTab === tab.key ? (tab.key === 'ai' ? '#6366F1' : '#111827') : '#6B7280',
                  background: createTab === tab.key ? '#fff' : 'transparent',
                  boxShadow: createTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >{tab.label}</div>
            ))}
          </div>
          <div onClick={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', color: '#9CA3AF', fontSize: 18, transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >✕</div>
        </div>

        {/* ── 空白创建内容 ── */}
        {createTab === 'blank' && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '72vh', overflow: 'hidden' }}>

            {/* 可滚动内容区 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0' }}>

              {/* 模板卡片横向滚动 */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: 500, letterSpacing: 0.3 }}>从模板快速开始</div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {/* 空白 */}
                  <div
                    onClick={() => { setSelectedTemplate('blank'); setNewEmpName(''); setNewEmpDesc(''); setNewEmpDept(''); setNewEmpDomain(''); setNewEmpRole(''); setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null); }}
                    style={{ minWidth: 120, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${selectedTemplate === 'blank' ? '#6366F1' : '#E5E7EB'}`, background: selectedTemplate === 'blank' ? '#EEF2FF' : '#fff', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: selectedTemplate === 'blank' ? '#4338CA' : '#374151' }}>空白员工</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>自定义配置</div>
                  </div>
                  {/* 模板列表 */}
                  {AGENT_TEMPLATES.map(tpl => (
                    <div key={tpl.id}
                      onClick={() => { setSelectedTemplate(tpl.id); setNewEmpName(tpl.name); setNewEmpDesc(`${tpl.name}专注于${tpl.domain}，可高效完成${tpl.desc}等任务。`); setNewEmpDept(tpl.dept); setNewEmpDomain(tpl.domain); setNewEmpRole(tpl.role); setNewEmpAvatarType('auto'); setNewEmpAvatarUrl(null); }}
                      style={{ minWidth: 150, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${selectedTemplate === tpl.id ? '#6366F1' : '#E5E7EB'}`, background: selectedTemplate === tpl.id ? '#EEF2FF' : '#fff', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: tpl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{tpl.name.charAt(0)}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: selectedTemplate === tpl.id ? '#4338CA' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 头像 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ width: 80, height: 80, borderRadius: 20, cursor: 'pointer', overflow: 'hidden', border: '2px solid #e8e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {newEmpAvatarType === 'upload' && newEmpAvatarUrl ? (
                      <img src={newEmpAvatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: getContentGradient(newEmpName, newEmpDept, newEmpDomain, newEmpDesc), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 700 }}>
                        {newEmpName.trim().charAt(0) || '✦'}
                      </div>
                    )}
                  </div>
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: '#fff', border: '1.5px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                  >
                    📷
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, background: '#f0f0ff', border: '1px solid #e0deff', fontSize: 11, color: '#6366F1', fontWeight: 500 }}>
                  <span style={{ fontSize: 10 }}>✦</span> AI生成
                </div>
              </div>

              {/* 3列：员工名称 | 所属部门 | 业务域 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>员工名称 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Input
                    value={newEmpName}
                    onChange={e => setNewEmpName(e.target.value.slice(0, 50))}
                    placeholder="如：法务合规助手"
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>所属部门 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Select
                    value={newEmpDept || undefined}
                    onChange={v => setNewEmpDept(v)}
                    placeholder="选择部门"
                    style={{ width: '100%' }}
                    options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6, fontWeight: 500 }}>业务域 <span style={{ color: '#ff4d4f' }}>*</span></div>
                  <Select
                    value={newEmpDomain || undefined}
                    onChange={v => setNewEmpDomain(v)}
                    placeholder="选择业务域"
                    style={{ width: '100%' }}
                    options={DOMAIN_LIST.filter(d => d !== '全部').map(d => ({ label: d, value: d }))}
                  />
                </div>
              </div>

              {/* 员工职责 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
                    员工职责 <span style={{ fontSize: 12, color: '#bbb', fontWeight: 400 }}>（选填）</span>
                  </div>
                  <div
                    onClick={() => {
                      if (!newEmpName.trim()) { message.warning('请先填写员工名称'); return; }
                      setAiDescLoading(true);
                      setTimeout(() => {
                        const isLaw  = newEmpName.includes('法务') || newEmpName.includes('合规');
                        const isCust = newEmpName.includes('客服') || newEmpName.includes('客户');
                        const isData = newEmpName.includes('数据') || newEmpName.includes('分析');
                        const isOps  = newEmpName.includes('巡检') || newEmpName.includes('运维');
                        setNewEmpDesc(`${newEmpName}的核心职责：\n1. ${isLaw ? '合同审查与法律风险识别，确保业务合规性' : isCust ? '7×24小时在线客户服务，处理咨询与投诉' : isData ? '数据采集、清洗与分析，输出可视化报告' : isOps ? '设备状态监控与异常预警研判' : '负责对应岗位的核心业务处理与分析'}\n2. 知识库检索与智能问答，提升团队工作效率\n3. 严格遵循企业规范标准，保障数据安全合规`);
                        setAiDescLoading(false);
                      }, 1200);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6366F1', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}
                  >
                    {aiDescLoading
                      ? <><span style={{ fontSize: 12 }}>⟳</span> 生成中…</>
                      : <><span style={{ fontSize: 11 }}>✦</span> AI 生成</>
                    }
                  </div>
                </div>
                <Input.TextArea
                  value={newEmpDesc}
                  onChange={e => setNewEmpDesc(e.target.value)}
                  rows={4}
                  placeholder="描述该员工的核心职责与工作范围，将用于生成系统提示词..."
                  style={{ borderRadius: 8, resize: 'none' }}
                  maxLength={500}
                  showCount
                />
              </div>
            </div>

            {/* 固定底部 */}
            <div style={{ padding: '14px 28px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
              <button
                onClick={() => { setCreateWizardOpen(false); resetCreateWizard(); }}
                style={{ padding: '8px 22px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                取消
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<button
                  onClick={handleConfirmCreate}
                  disabled={!newEmpName.trim() || !newEmpDept}
                  style={{ padding: '8px 28px', borderRadius: 8, border: 'none', background: (newEmpName.trim() && newEmpDept) ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#E5E7EB', color: (newEmpName.trim() && newEmpDept) ? '#fff' : '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: (newEmpName.trim() && newEmpDept) ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  下一步
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── AI 创建内容 ── */}
        {createTab === 'ai' && (
          <div style={{ padding: '28px 48px 32px', maxHeight: '72vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 24, letterSpacing: -0.5 }}>
              描述你需要的数字员工
            </div>

            {/* 输入容器 */}
            <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 14, background: '#fff', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 24 }}>
              <textarea
                value={aiCreateInput}
                onChange={e => setAiCreateInput(e.target.value)}
                placeholder="请描述员工岗位、工作职责、规范要求等，AI 将自动生成对应的数字员工配置"
                rows={5}
                style={{ width: '100%', padding: '18px 20px 8px', border: 'none', outline: 'none', fontSize: 14, resize: 'none', fontFamily: 'inherit', lineHeight: 1.7, color: '#374151', background: 'transparent', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 14px' }}>
                <button
                  onClick={handleAiGenerate}
                  disabled={!aiCreateInput.trim() || aiCreateLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 24, border: 'none', background: aiCreateInput.trim() && !aiCreateLoading ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#E5E7EB', color: aiCreateInput.trim() && !aiCreateLoading ? '#fff' : '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: aiCreateInput.trim() && !aiCreateLoading ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  {aiCreateLoading
                    ? <><span>⟳</span> 生成中…</>
                    : <><span style={{ fontSize: 12 }}>✦</span> AI 创建</>
                  }
                </button>
              </div>
            </div>

            {/* 示例 */}
            <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginBottom: 10, letterSpacing: 0.3 }}>试试看</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                '法务合规专员，负责合同审查、法规解读、合规风险识别，需严格遵循公司内部法务审查规范',
                '客户服务代表，处理客户投诉与售后咨询，须在 2 分钟内响应，并按服务话术规范引导解决',
                '数据分析师，定期产出业务数据报告与可视化图表，遵循数据安全与保密要求',
                '巡检运维员，负责设备状态监控与异常预警研判，按照运维 SOP 规范生成巡检报告',
              ].map(tip => (
                <div key={tip} onClick={() => setAiCreateInput(tip)}
                  style={{ padding: '11px 14px', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer', lineHeight: 1.5, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >{tip}</div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 全页创建向导 */}
      {createModalOpen && (
        <EmployeeConfigPage
          onClose={() => { setCreateModalOpen(false); setCreateInitialData({name:'',description:'',dept:'',domain:'',role:''}); }}
          onBack={() => { setCreateModalOpen(false); setCreateWizardOpen(true); }}
          initialData={createInitialData.name ? { name: createInitialData.name, description: createInitialData.description, dept: createInitialData.dept, domain: createInitialData.domain, role: createInitialData.role } : undefined}
        />
      )}

      {/* 全页编辑向导 */}
      {editModalOpen && (
        <EmployeeConfigPage
          onClose={() => { setEditModalOpen(false); setEditEmployee(null); }}
          initialData={{ name: editEmployee?.name ?? '', dept: editEmployee?.dept ?? '', description: editEmployee?.description ?? '', domain: editEmployee?.domain ?? '' }}
          isEdit
        />
      )}

      {/* 版本 Drawer */}
      {selectedEmployee && <VersionDrawer open={versionDrawerOpen} onClose={() => setVersionDrawerOpen(false)} employeeName={selectedEmployee.name} />}

      {/* 多入口 API Drawer */}
      <Drawer title={`多入口接入 · ${selectedEmployee?.name || ''}`} open={apiDrawerOpen} onClose={() => setApiDrawerOpen(false)} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* API Key 管理 */}
          <div style={{ padding: '14px 16px', background: '#f9f8ff', borderRadius: 10, border: '1px solid #e0deff' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6366F1', marginBottom: 12 }}>API Key 管理</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>当前 API Key</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ flex: 1, padding: '7px 12px', background: '#fff', border: '1px solid #e0deff', borderRadius: 7, fontSize: 12, color: '#555', fontFamily: 'monospace', letterSpacing: 2 }}>wj_sk_••••••••••••••••{selectedEmployee?.id?.slice(-4) || 'xxxx'}</code>
                  <Button size="small" icon={<CopyOutlined />} style={{ color: '#6366F1', borderColor: '#6366F1', borderRadius: 7 }} onClick={() => message.success('API Key 已复制')}>复制</Button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ label: '今日调用', value: '328', color: '#6366F1' }, { label: '本月调用', value: '4,821', color: '#10B981' }, { label: '速率限制', value: '100/min', color: '#F59E0B' }].map(s => (
                  <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#fff', borderRadius: 8, border: '1px solid #e0deff' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: '#aaa' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <Button size="small" style={{ color: '#ff4d4f', borderColor: '#ff4d4f', borderRadius: 7, fontSize: 12 }} onClick={() => message.success('已重新生成 API Key，旧 Key 将在 24h 后失效')}>重新生成 Key</Button>
            </div>
          </div>
          {[
            { mode: 'H5 网页入口', icon: <DesktopOutlined />, color: '#6366F1', desc: '适配电脑/移动端，浏览器直接访问，无需安装', code: `https://emp.wanjuan.ai/h5/${selectedEmployee?.id}` },
            { mode: 'elink 嵌入入口', icon: <LinkOutlined />, color: '#10B981', desc: '嵌入政企内部办公系统/政务服务平台', code: `<iframe src="https://emp.wanjuan.ai/elink/${selectedEmployee?.id}" allow="microphone" />` },
            { mode: '小程序入口', icon: <MobileOutlined />, color: '#F59E0B', desc: '适配政企专属 APP，微信/钉钉小程序', code: `app_id: ${selectedEmployee?.id}\nentry_type: miniapp\nplatform: wechat | dingtalk` },
            { mode: 'REST API', icon: <ApiOutlined />, color: '#3B82F6', desc: '标准 HTTP 接口，支持外部系统集成', code: `POST /v1/employees/${selectedEmployee?.id}/chat\nAuthorization: Bearer {YOUR_API_KEY}` },
            { mode: '工作流节点', icon: <ThunderboltOutlined />, color: '#8B5CF6', desc: '在万卷工作流中以节点形式调用', code: `agent_id: ${selectedEmployee?.id}\ntype: digital_employee\ncall_mode: sync` },
          ].map(item => (
            <div key={item.mode} style={{ border: `1px solid ${item.color}25`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: `${item.color}08`, borderBottom: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, color: item.color }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.mode}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <code style={{ flex: 1, fontSize: 11, color: '#555', fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{item.code}</code>
                <Button size="small" type="text" icon={<CopyOutlined />} style={{ color: item.color, flexShrink: 0 }} onClick={() => message.success('已复制')} />
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default DigitalEmployeeLibrary;
