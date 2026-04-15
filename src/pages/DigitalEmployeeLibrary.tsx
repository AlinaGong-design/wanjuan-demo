import React, { useState, useEffect } from 'react';
import { employeeStore, EmployeeRecord } from '../store/employeeStore';
import { Button, Input, Tag, Modal, Select, Badge, Drawer, Table, Divider, message, Steps, Switch, Checkbox, Tooltip, Timeline, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, RollbackOutlined,
  ApiOutlined, CheckCircleOutlined, StopOutlined,
  CloudUploadOutlined, TeamOutlined, LockOutlined, GlobalOutlined,
  CopyOutlined, SendOutlined, BranchesOutlined,
  ThunderboltOutlined, AppstoreOutlined, UnorderedListOutlined,
  MobileOutlined, LinkOutlined, DesktopOutlined,
  HistoryOutlined, FileTextOutlined, TagOutlined, SaveOutlined, EyeOutlined,
} from '@ant-design/icons';

// ─── 类型 ─────────────────────────────────────────────────
type EmployeeStatus = 'draft' | 'testing' | 'published' | 'paused' | 'archived';
type DeployScope    = 'private' | 'dept' | 'company';

type VisibilityScope = 'private' | 'team' | 'company';

interface EmployeeVersion {
  versionId: string; version: string; changelog: string;
  publishedAt: string; publishedBy: string; scope: VisibilityScope;
}
interface EmployeeHistoryEvent {
  id: string; kind: 'save' | 'publish';
  time: string; user: string; desc: string;
  version?: EmployeeVersion;
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

const MOCK_EMPLOYEE_HISTORY: EmployeeHistoryEvent[] = [
  { id: 'h1', kind: 'publish', time: '2026-02-15 16:00', user: '李四', desc: 'v2.0.0', version: { versionId: 'v2.0.0', version: 'v2.0.0', changelog: '重构 Prompt 结构，支持多类型合同模板', publishedAt: '2026-02-15 16:00', publishedBy: '李四', scope: 'team' } },
  { id: 'h2', kind: 'save',    time: '2026-02-20 10:30', user: '张三', desc: '优化风险识别提示词' },
  { id: 'h3', kind: 'publish', time: '2026-02-28 09:15', user: '张三', desc: 'v2.0.1', version: { versionId: 'v2.0.1', version: 'v2.0.1', changelog: '修复飞书文档权限异常问题', publishedAt: '2026-02-28 09:15', publishedBy: '张三', scope: 'team' } },
  { id: 'h4', kind: 'save',    time: '2026-03-05 14:00', user: '张三', desc: '新增风险等级标注逻辑' },
  { id: 'h5', kind: 'publish', time: '2026-03-10 14:30', user: '张三', desc: 'v2.1.0', version: { versionId: 'v2.1.0', version: 'v2.1.0', changelog: '优化合同识别准确率，新增风险等级标注', publishedAt: '2026-03-10 14:30', publishedBy: '张三', scope: 'company' } },
];

const SCOPE_LABELS: Record<VisibilityScope, { label: string }> = {
  private: { label: '仅自己' },
  team:    { label: '团队内' },
  company: { label: '全公司' },
};

function nextVersion(ver: string, type: 'patch' | 'minor' | 'major' = 'patch'): string {
  const match = ver.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return 'v1.0.0';
  let [, major, minor, patch] = match.map(Number);
  if (type === 'patch') patch++;
  else if (type === 'minor') { minor++; patch = 0; }
  else { major++; minor = 0; patch = 0; }
  return `v${major}.${minor}.${patch}`;
}

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

const ORG_TREE = [
  { id: 'root',    name: '集团总公司',  path: '集团总公司' },
  { id: 'lead',    name: '集团领导',    path: '集团总公司 > 集团领导' },
  { id: 'digital', name: '数字智能部',  path: '集团总公司 > 数字智能部' },
  { id: 'infra',   name: '基础设施部',  path: '集团总公司 > 数字智能部 > 基础设施部' },
  { id: 'sys',     name: '系统建设部',  path: '集团总公司 > 数字智能部 > 系统建设部' },
  { id: 'data',    name: '数据治理部',  path: '集团总公司 > 数字智能部 > 数据治理部' },
  { id: 'legal',   name: '法务部',      path: '集团总公司 > 法务部' },
  { id: 'hr',      name: '人力资源部',  path: '集团总公司 > 人力资源部' },
  { id: 'finance', name: '财务部',      path: '集团总公司 > 财务部' },
  { id: 'tech',    name: '技术部',      path: '集团总公司 > 技术部' },
  { id: 'ops',     name: '运营部',      path: '集团总公司 > 运营部' },
  { id: 'pipe',    name: '管道运营部',  path: '集团总公司 > 管道运营部' },
];

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
  { title: '测试上岗', description: '调试验证并上线'  },
];

// ─── 步骤标题组件 ──────────────────────────────────────────
const SectionTitle: React.FC<{ title: string; desc?: string }> = ({ title, desc }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</div>
    {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
  </div>
);

// ─── PromptFilesEditor ────────────────────────────────────────

interface PromptFileDef {
  name: string;
  desc: string;
  defaultContent: string;
  isMemory?: boolean;
}

const MOCK_MEMORIES = `# 运行时记忆

> 以下内容由员工在实际运行过程中自动积累，可手动编辑或清理。

## 用户偏好
- 用户「张总监」偏好结构化输出，喜欢分条列举而非长段落
- 用户「李经理」经常在下午14:00-16:00发起合同审查请求
- 多位用户反馈：风险等级标注使用「高/中/低」比数字评分更直观

## 常见问题记录
- 「劳动合同试用期条款」是询问频率最高的问题（本月28次）
- 「保密协议模板」请求量较上月增长40%，已建议补充知识库

## 修正记录
- 2026-03-15：用户纠正「竞业限制期限」表述，最长不超过2年而非1年，已更新认知
- 2026-03-22：用户指出某供应商合同缺少「争议解决条款」，已加入审查清单`;

const PROMPT_FILES_DEF: PromptFileDef[] = [
  {
    name: 'AGENTS.md',
    desc: '核心角色设定',
    defaultContent: DEFAULT_PROMPT,
  },
  {
    name: 'SOUL.md',
    desc: '性格与价值观',
    defaultContent: `# 性格与价值观

## 性格特征
- 专业严谨，注重细节
- 主动积极，响应及时
- 以用户需求为导向

## 核心价值观
1. 准确性优先：所有信息须基于可靠数据源，不凭空推断
2. 保护隐私：严格遵守数据安全与保密规定
3. 持续学习：主动更新知识库，保持专业能力领先`,
  },
  {
    name: 'MEMORY.md',
    desc: '运行时记忆',
    defaultContent: MOCK_MEMORIES,
    isMemory: true,
  },
];

const PromptFilesEditor: React.FC<{
  initialPrompt: string;
  onChange: (prompt: string) => void;
}> = ({ initialPrompt, onChange }) => {
  const initContents = (): Record<string, string> => {
    const map: Record<string, string> = {};
    PROMPT_FILES_DEF.forEach(f => {
      map[f.name] = f.name === 'AGENTS.md' ? initialPrompt : f.defaultContent;
    });
    return map;
  };

  const [fileContents, setFileContents] = React.useState<Record<string, string>>(initContents);
  const [selectedFile, setSelectedFile] = React.useState('AGENTS.md');
  const [editingContent, setEditingContent] = React.useState(initialPrompt);

  // 弹窗状态
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');
  const [modalPreview, setModalPreview] = React.useState(false);

  const autoCommit = (fileName: string, content: string) => {
    const newContents = { ...fileContents, [fileName]: content };
    setFileContents(newContents);
    onChange(newContents['AGENTS.md'] || '');
  };

  const handleSelectFile = (fileName: string) => {
    autoCommit(selectedFile, editingContent);
    setSelectedFile(fileName);
    setEditingContent(fileContents[fileName] ?? PROMPT_FILES_DEF.find(f => f.name === fileName)?.defaultContent ?? '');
  };

  const handleReset = () => {
    const def = PROMPT_FILES_DEF.find(f => f.name === selectedFile);
    if (def) {
      setEditingContent(def.defaultContent);
      autoCommit(selectedFile, def.defaultContent);
    }
  };

  // 打开弹窗预览/编辑
  const openModal = () => {
    setModalContent(editingContent);
    setModalPreview(false);
    setModalOpen(true);
  };

  // 弹窗关闭时自动同步内容
  const handleModalClose = () => {
    setEditingContent(modalContent);
    autoCommit(selectedFile, modalContent);
    setModalOpen(false);
  };

  const byteSize = (s: string) => new Blob([s]).size;
  const currentFileDef = PROMPT_FILES_DEF.find(f => f.name === selectedFile);

  return (
    <>
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ display: 'flex', height: 342 }}>

          {/* ── 左侧文件列表 ── */}
          <div style={{ width: 176, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa', flexShrink: 0 }}>
            <div style={{ padding: '9px 12px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #f0f0f0', letterSpacing: 0.8 }}>
              配置文件
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {PROMPT_FILES_DEF.map(f => {
                const isSelected = selectedFile === f.name;
                const content = fileContents[f.name] ?? f.defaultContent;
                const size = byteSize(content);
                return (
                  <div
                    key={f.name}
                    onClick={() => handleSelectFile(f.name)}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: `2px solid ${isSelected ? '#6366F1' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f5f5fa'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#4338CA' : '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      {f.isMemory && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#fef3c7', color: '#D97706', border: '1px solid #fde68a', flexShrink: 0, fontWeight: 600 }}>动态</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{f.desc} · {size} B</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 右侧编辑器 ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* 路径栏 + 操作按钮 */}
            <div style={{ padding: '7px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6, background: '#fff', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                /prompt/{selectedFile}
              </span>
              {currentFileDef?.isMemory && (
                <span style={{ fontSize: 10, color: '#10B981', padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #a7f3d0', flexShrink: 0 }}>运行时更新</span>
              )}
              <button
                onClick={openModal}
                style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
              >预览</button>
              <button
                onClick={handleReset}
                style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #e8e8e8', background: '#fff', color: '#6B7280', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
              >重置</button>
            </div>

            {/* Content 标签 */}
            <div style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#f9fafb', borderBottom: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Content</span>
              {currentFileDef?.isMemory && (
                <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>员工运行中自动积累，可手动编辑或清理</span>
              )}
            </div>

            {/* 编辑区 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <textarea
                value={editingContent}
                onChange={e => { setEditingContent(e.target.value); autoCommit(selectedFile, e.target.value); }}
                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', lineHeight: 1.75, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 预览/编辑 弹窗 ── */}
      <Modal
        open={modalOpen}
        onCancel={handleModalClose}
        footer={null}
        width="76vw"
        centered
        styles={{ body: { padding: 0 } }}
        closable={false}
      >
        {/* 弹窗头部 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff', gap: 10 }}>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{selectedFile}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>/prompt/{selectedFile}</span>
            {currentFileDef?.isMemory && (
              <span style={{ fontSize: 10, color: '#10B981', padding: '1px 6px', borderRadius: 4, background: '#f0fdf4', border: '1px solid #a7f3d0', fontWeight: 600 }}>运行时更新</span>
            )}
          </div>
          {/* 编辑/预览 切换 */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 3, gap: 0 }}>
            {([{ key: false, label: '编辑' }, { key: true, label: '预览' }] as const).map(tab => (
              <div
                key={String(tab.key)}
                onClick={() => setModalPreview(tab.key)}
                style={{
                  padding: '4px 14px', borderRadius: 5, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                  fontWeight: modalPreview === tab.key ? 600 : 400,
                  color: modalPreview === tab.key ? '#111' : '#6B7280',
                  background: modalPreview === tab.key ? '#fff' : 'transparent',
                  boxShadow: modalPreview === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >{tab.label}</div>
            ))}
          </div>
          <div
            onClick={handleModalClose}
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >✕</div>
        </div>

        {/* 弹窗内容区 */}
        <div style={{ height: '66vh', display: 'flex', flexDirection: 'column' }}>
          {modalPreview ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', fontSize: 13, color: '#374151', lineHeight: 2, whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#fafafa' }}>
              {modalContent || <span style={{ color: '#bbb' }}>（空文件）</span>}
            </div>
          ) : (
            <textarea
              value={modalContent}
              onChange={e => { setModalContent(e.target.value); setEditingContent(e.target.value); autoCommit(selectedFile, e.target.value); }}
              autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', padding: '20px 28px', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.85, resize: 'none', color: '#374151', background: '#fff', boxSizing: 'border-box' }}
            />
          )}
        </div>
      </Modal>
    </>
  );
};

// ─── 通用资源选择器组件 ───────────────────────────────────

interface PickerItem {
  id: string;
  icon: React.ReactNode | string;
  name: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  tagBorder?: string;
}

const PickerSection: React.FC<{
  title: string;
  desc?: string;
  modalTitle: string;
  items: PickerItem[];
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  accentColor?: string;
  linkText?: string;
  onLink?: () => void;
}> = ({ title, desc, modalTitle, items, selectedIds, onAdd, onRemove, accentColor = '#6366F1', linkText, onLink }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch]       = useState('');

  const selectedItems   = items.filter(i => selectedIds.includes(i.id));
  const availableItems  = items.filter(i => !selectedIds.includes(i.id)).filter(i =>
    !search.trim() || i.name.includes(search.trim()) || i.desc.includes(search.trim())
  );

  return (
    <div>
      {/* 表头行 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
          <button
            onClick={() => { setSearch(''); setModalOpen(true); }}
            style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${accentColor}40`, background: `${accentColor}08`, color: accentColor, fontSize: 16, lineHeight: '22px', textAlign: 'center', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >＋</button>
        </div>
        {desc && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{desc}</div>}
      </div>

      {/* 已添加列表 */}
      {selectedItems.length === 0 ? (
        <div style={{ padding: '11px 14px', border: '1px dashed #e8e8e8', borderRadius: 8, fontSize: 12, color: '#bbb', textAlign: 'center' }}>
          暂未添加，点击 ＋ 从列表中选择
        </div>
      ) : (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
          {selectedItems.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: idx < selectedItems.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fff' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{item.name}</span>
                  {item.tag && (
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: item.tagColor ?? accentColor, background: item.tagBg ?? `${accentColor}10`, border: `1px solid ${item.tagBorder ?? `${accentColor}30`}` }}>{item.tag}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #f0f0f0', background: '#fafafa', color: '#aaa', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, lineHeight: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ff4d4f'; (e.currentTarget as HTMLButtonElement).style.color = '#ff4d4f'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#f0f0f0'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
              >×</button>
            </div>
          ))}
        </div>
      )}


      {/* 选择弹窗 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={<span style={{ fontSize: 14, fontWeight: 700 }}>{modalTitle}</span>}
        width={520}
        centered
        styles={{ body: { padding: '12px 20px 20px' } }}
      >
        {/* 搜索框 */}
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索名称或描述..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 12, borderRadius: 8 }}
          allowClear
        />

        {/* 可选列表 */}
        {availableItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>
            {search.trim() ? '未找到匹配项' : '全部已添加 ✓'}
          </div>
        ) : (
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
            {availableItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => { onAdd(item.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: idx < availableItems.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `${accentColor}06`}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{item.name}</span>
                    {item.tag && (
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, color: item.tagColor ?? accentColor, background: item.tagBg ?? `${accentColor}10`, border: `1px solid ${item.tagBorder ?? `${accentColor}30`}` }}>{item.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 20, color: accentColor, fontWeight: 300, flexShrink: 0 }}>＋</span>
              </div>
            ))}
          </div>
        )}

        {/* 底部：已添加数量 + 跳转新建 */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {onLink ? (
            <span
              onClick={() => { setModalOpen(false); onLink(); }}
              style={{ fontSize: 12, color: accentColor, cursor: 'pointer', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.textDecoration = 'none'}
            >{linkText}</span>
          ) : <span />}
          {selectedItems.length > 0 && (
            <span style={{ fontSize: 11, color: '#bbb' }}>已添加 {selectedItems.length} 项</span>
          )}
        </div>
      </Modal>
    </div>
  );
};

// ─── 全页向导（创建 / 编辑） ──────────────────────────────
interface TestMessage { role: 'user' | 'ai'; content: string; }

const EmployeeConfigPage: React.FC<{
  onClose: () => void;
  onBack?: () => void;
  onPublish?: (name: string) => void;
  initialData?: Partial<WizardData>;
  isEdit?: boolean;
  readOnly?: boolean;
  readOnlyVersion?: string;
  onViewVersion?: (version: EmployeeVersion) => void;
}> = ({ onClose, onBack, onPublish, initialData, isEdit, readOnly, readOnlyVersion, onViewVersion }) => {
  const [data, setData] = useState<WizardData>({ ...initWizardData(), ...initialData });
  const [stepAvatarUrl, setStepAvatarUrl] = useState<string | null>(null);
  const [stepAiDescLoading, setStepAiDescLoading] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [empPublishOpen, setEmpPublishOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inlineRollbackTarget, setInlineRollbackTarget] = useState<EmployeeVersion | null>(null);
  const stepAvatarRef = React.useRef<HTMLInputElement>(null);
  const update = (patch: Partial<WizardData>) => setData(prev => ({ ...prev, ...patch }));

  // 对话式配置状态
  interface ChatMsg { role: 'user' | 'ai'; content: string; }
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'ai', content: '你好！你可以直接告诉我需要调整的内容，例如「把名字改为法务助手」、「描述改为负责合同审查」、「切换到国产安全模型」，我会同步更新左侧配置。' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // 任务列表：记录右侧调试时发送的任务，实时同步到左侧
  interface DebugTaskStep {
    id: string; name: string; desc: string;
    status: 'done' | 'running' | 'waiting';
    time?: string; output?: string;
  }
  interface DebugPipeStage {
    id: string; label: string; icon: string; type?: 'auto' | 'human';
    desc: string; logs: Array<{ text: string; kind: 'ok' | 'warn' | 'data' | 'info' }>;
  }
  interface DebugTask {
    id: number; title: string; content: string; time: string;
    status: 'running' | 'done' | 'human_pending';
    pipeStages: DebugPipeStage[];
    doneCount: number;
    steps: DebugTaskStep[];
    logs: Array<{ text: string; kind: string; ts: string }>;
    expanded: boolean;
    humanOk?: boolean;
    clarifyInput?: string;
    clarifyMode?: boolean;
    aiReply?: string;
  }
  const [tasks, setTasks] = useState<DebugTask[]>([]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const chatFileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // 判断输入是否在员工职责范围内
  const isInScope = (text: string): boolean => {
    const scopeSources = [data.domain, data.dept, data.role, data.description, data.name]
      .filter(Boolean).join('');

    // 员工尚未配置职责信息，放行所有输入
    if (!scopeSources.trim()) return true;

    // 提取所有相邻2字双元组（bigram），覆盖「合同」「审查」「法务」等短词
    const bigrams = new Set<string>();
    for (let i = 0; i < scopeSources.length - 1; i++) {
      const a = scopeSources[i], b = scopeSources[i + 1];
      if (/[\u4e00-\u9fa5]/.test(a) && /[\u4e00-\u9fa5]/.test(b)) {
        bigrams.add(a + b);
      }
    }

    // 命中任意双元组即视为在职责范围内
    return Array.from(bigrams).some(bg => text.includes(bg));
  };

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', content: text }]);
    setChatLoading(true);

    // 职责范围过滤：不在范围内只回复，不创建任务
    if (!isInScope(text)) {
      const empName = data.name || '当前员工';
      const scopeDesc = [data.domain, data.dept, data.role].filter(Boolean).join('、') || '已配置职责范围';
      setTimeout(() => {
        setChatMsgs(prev => [...prev, {
          role: 'ai',
          content: `您好，您的指令「${text.slice(0, 20)}${text.length > 20 ? '…' : ''}」超出了「${empName}」的职责范围。\n\n我的服务范围：${scopeDesc}。\n\n如需处理此类事项，建议联系对应的专职员工或人工团队。`,
        }]);
        setChatLoading(false);
      }, 600);
      return;
    }

    const taskId = Date.now();
    const getTs = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const taskTime = getTs();

    // 根据业务域生成真实任务配置
    const domain = data.domain || '';
    const isLaw     = /法务/.test(domain);
    const isHR      = /人力/.test(domain);
    const isFinance  = /财务/.test(domain);
    const isTech    = /技术/.test(domain);
    const isCS      = /客服/.test(domain);
    const isPipe    = /管道|安全/.test(domain);

    type LogKind = 'ok' | 'warn' | 'data' | 'info';
    interface DomainTaskConfig {
      planDesc: string; execDesc: string;
      planLogs: Array<{ text: string; kind: LogKind }>;
      execLogs: Array<{ text: string; kind: LogKind }>;
      verifyLogs: Array<{ text: string; kind: LogKind }>;
      steps: Array<{ name: string; desc: string }>;
      advanceLogs: [string, string, string];
      aiReply: string;
    }

    const taskConfig: DomainTaskConfig = isLaw ? {
      planDesc: '解析合同文本，制定审查清单与风险检测策略',
      execDesc: '调用 PDF 解析引擎提取条款，匹配合规规则库',
      planLogs: [
        { text: '提取任务关键词：合同审查 / 风险识别 / 条款分析', kind: 'data' },
        { text: '加载法务合规规则库 v3.2.1', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: 'PDF 解析引擎启动，提取全文结构...', kind: 'info' },
        { text: '共识别 23 个条款段落，12,340 字', kind: 'data' },
        { text: '命中合规规则 47 条，完成条款交叉映射', kind: 'data' },
        { text: '识别到 2 处高风险条款：违约责任上限 / 单方解约权', kind: 'warn' },
        { text: '风险等级标注完成，结构化审查报告已生成', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '法律条文引用校验通过（民法典第 502 条）', kind: 'ok' },
        { text: '风险等级评定符合内部法务标准', kind: 'ok' },
      ],
      steps: [
        { name: '文档解析', desc: '调用 PDF 解析引擎提取全文结构与条款段落' },
        { name: '合规规则匹配', desc: '逐条检索法律法规库，完成条款交叉映射' },
        { name: '风险识别', desc: 'AI 分析高风险语义模式，标注异常条款' },
        { name: '报告生成', desc: '生成结构化审查报告，推送至飞书文档' },
      ],
      advanceLogs: ['✓ 文档解析完成，提取 23 个条款段落', '✓ 合规规则匹配完成，发现 2 处高风险', '✓ 审查报告已生成，含风险标注与修改建议'],
      aiReply: `合同审查完成，发现以下风险：\n\n**高风险（2项）**\n• 第8条「违约责任上限」：赔偿上限过低，建议参考合同总金额的 30%\n• 第12条「单方解约权」：乙方可无条件解约，建议增加限制条件\n\n报告已推送至飞书文档，请法务负责人确认后签署。`,
    } : isHR ? {
      planDesc: '解析岗位需求，制定简历筛选与候选人评估策略',
      execDesc: '调用简历解析模型，匹配岗位要求，生成候选人评分',
      planLogs: [
        { text: '提取任务关键词：简历筛选 / 岗位匹配 / 候选人评估', kind: 'data' },
        { text: '加载岗位 JD 与历史录用数据模型', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步���', kind: 'ok' },
      ],
      execLogs: [
        { text: '解析本批次简历，共 38 份...', kind: 'info' },
        { text: '提取候选人技能标签：Python / 数据分析 / 3年以上经验', kind: 'data' },
        { text: '与岗位 JD 匹配打分，TOP5 候选人已筛出', kind: 'ok' },
        { text: '匹配度最高：候选人张**（92分）/ 李**（88分）', kind: 'data' },
      ],
      verifyLogs: [
        { text: '筛选结果符合岗位要求，无明显异常项', kind: 'ok' },
        { text: '已去除重复投递候选人 3 名', kind: 'info' },
      ],
      steps: [
        { name: '简历解析', desc: '批量解析简历文件，提取结构化信息' },
        { name: '岗位匹配', desc: '与 JD 要求交叉比对，生成匹配评分' },
        { name: '候选人排序', desc: '综合打分排序，筛出 TOP 候选名单' },
        { name: '面试通知', desc: '自动发送面试邀请并协调飞书日历时间' },
      ],
      advanceLogs: ['✓ 简历解析完成，共处理 38 份', '✓ 岗位匹配完成，TOP5 候选人已筛出', '✓ 面试邀请已生成，等待确认后发送'],
      aiReply: `简历筛选完成，共处理 38 份，推荐以下候选人：\n\n**TOP 候选人**\n• 张**（92分）：5年数据分析经验，Python/SQL 熟练\n• 李**（88分）：3年相关经验，有大厂背景\n• 王**（85分）：应届硕士，项目经验丰富\n\n面试邀请草稿已生成，确认后可一键发送并同步飞书日历。`,
    } : isFinance ? {
      planDesc: '拉取业务数据，制定财务报表分析与异常检测策略',
      execDesc: '连接 ERP 数据源，执行多维度财务指标计算与异常检测',
      planLogs: [
        { text: '提取任务关键词：财务报表 / 数据分析 / 异常预警', kind: 'data' },
        { text: '连接企业 ERP 数据源，验证权限...', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '拉取本月业务数据，共 12 个业务线...', kind: 'info' },
        { text: '营收同比增长 18.3%，环比增长 5.1%', kind: 'data' },
        { text: '⚠️ 异常检测：研发成本超预算 23%', kind: 'warn' },
        { text: '毛利率 42.1%，同比下降 2.3 个百分点', kind: 'data' },
        { text: '财务分析报告生成完毕', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '数据口径与上期保持一致，无异常', kind: 'ok' },
        { text: '⚠️ 预算超支项已标注，需人工复核确认', kind: 'warn' },
      ],
      steps: [
        { name: '数据拉取', desc: '从 ERP / 数据仓库同步最新财务数据' },
        { name: '指标计算', desc: '计算营收、成本、利润等核心财务指标' },
        { name: '异常检测', desc: 'AI 识别预算偏差与异常波动项' },
        { name: '报告生成', desc: '生成图文报告并推送至钉钉 / 飞书' },
      ],
      advanceLogs: ['✓ 数据拉取完成，12 个业务线已同步', '✓ 指标计算完成，发现 1 项预算异常', '✓ 财务分析报告已生成，含异常预警标注'],
      aiReply: `本月财务报表分析完成：\n\n**核心指标**\n• 营收：¥3,842万（同比+18.3%，环比+5.1%）\n• 毛利率：42.1%（同比↓2.3pp）\n\n**⚠️ 异常预警**：研发成本超预算 23%，建议控制本月新增采购\n\n报告已推送至财务负责人飞书，超预算项已触发审批流程。`,
    } : isTech ? {
      planDesc: '获取代码变更内容，制定审查规则与安全扫描策略',
      execDesc: '调用静态分析引擎，执行代码质量与安全漏洞扫描',
      planLogs: [
        { text: '提取任务关键词：代码审查 / 安全扫描 / PR 分析', kind: 'data' },
        { text: '拉取 GitLab PR #1024 变更文件列表...', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '解析 PR 差异：8 个文件，+342/-87 行', kind: 'data' },
        { text: '执行静态代码分析...', kind: 'info' },
        { text: '⚠️ 发现潜在 SQL 注入风险：auth/login.py L89', kind: 'warn' },
        { text: '代码规范：3 处命名不规范，2 处注释缺失', kind: 'data' },
        { text: '安全扫描完成，审查建议已生成', kind: 'ok' },
      ],
      verifyLogs: [
        { text: 'SQL 注入风险已确认，严重等级：高', kind: 'warn' },
        { text: '审查建议格式符合团队规范', kind: 'ok' },
      ],
      steps: [
        { name: '代码获取', desc: '拉取 GitLab/GitHub PR 变更文件内容' },
        { name: '静态分析', desc: '执行代码质量与规范性检查' },
        { name: '安全扫描', desc: 'AI 识别 SQL 注入、XSS 等安全漏洞' },
        { name: '评论写入', desc: '将审查建议以评论形式写回 PR' },
      ],
      advanceLogs: ['✓ PR 代码获取完成，8 个文件已解析', '✓ 静态分析完成，发现 1 个高风险安全问题', '✓ 审查评论已写入 PR，等待开发者响应'],
      aiReply: `PR #1024 代码审查完成：\n\n**安全问题（高优先级）**\n• ⚠️ auth/login.py L89：SQL 注入风险，建议使用参数化查询\n\n**代码规范**\n• 3 处变量命名不符合 snake_case 规范\n• utils/helper.py 缺少函数注释\n\n审查评论已写入 PR，请开发者优先修复 SQL 注入问题后重新提交。`,
    } : isCS ? {
      planDesc: '识别用户意图，匹配知识库解决方案，制定服务策略',
      execDesc: '多轮对话意图理解，检索产品知识库，生成回复方案',
      planLogs: [
        { text: '提取任务关键词：客户服务 / 意图识别 / 问题解决', kind: 'data' },
        { text: '加载产品知识库（FAQ v2.3，共 1,240 条）', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '用户意图识别：产品功能咨询', kind: 'data' },
        { text: '检索知识库，命中相关条目 3 条', kind: 'info' },
        { text: '生成回复方案，置信度 94%', kind: 'ok' },
        { text: '创建服务工单 #TK-20240315-001', kind: 'data' },
      ],
      verifyLogs: [
        { text: '回复内容符合服务话术规范', kind: 'ok' },
        { text: '工单信息完整，已关联用户账号', kind: 'ok' },
      ],
      steps: [
        { name: '意图识别', desc: '多轮理解用户问题，提取核心诉求' },
        { name: '知识库检索', desc: '匹配 FAQ 与产品手册，生成解决方案' },
        { name: '回复生成', desc: '按服务话术规范生成结构化回复' },
        { name: '工单创建', desc: '自动创建服务工单并推送至责任团队' },
      ],
      advanceLogs: ['✓ 意图识别完成：产品功能咨询', '✓ 知识库检索命中 3 条相关内容', '✓ 回复方案已生成，工单 #TK-001 已创建'],
      aiReply: `客户问题已处理：\n\n**问题类型**：产品功能咨询\n**解决方案**：已提供操作指引，附帮助文档链接\n\n**工单**：#TK-20240315-001（已解决，等待用户确认）\n满意度回访将在 24h 后自动触发。`,
    } : isPipe ? {
      planDesc: '接收多源告警信号，制定预警研判与巡检处置策略',
      execDesc: '整合光纤预警、机器视觉、无人机数据，执行异常综合研判',
      planLogs: [
        { text: '提取任务关键词：管道巡检 / 预警研判 / 工单派发', kind: 'data' },
        { text: '接入光纤预警、机器视觉平台、无人机数据流', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '光纤预警：桩号 K125+300 振动异常，持续 4.2s', kind: 'warn' },
        { text: '机器视觉：对应位置图像分析中...', kind: 'info' },
        { text: '图像确认：施工车辆进入管道保护区', kind: 'warn' },
        { text: '无人机数据：管道外观未见明显损伤', kind: 'data' },
        { text: '综合研判：二级预警，需派员现场确认', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '预警等级研判：二级（较高风险），触发人工复核', kind: 'warn' },
        { text: '工单信息完整，责任班组已匹配', kind: 'ok' },
      ],
      steps: [
        { name: '告警接收', desc: '汇聚光纤预警、机器视觉、无人机多源数据' },
        { name: '预警研判', desc: 'AI 综合研判告警等级与风险类型' },
        { name: '工单派发', desc: '生成巡检工单，自动派发给就近班组' },
        { name: '闭环跟踪', desc: '实时跟踪处置进度，确认隐患消除' },
      ],
      advanceLogs: ['✓ 多源告警数据接收完成，发现 1 处异常', '✓ 预警研判完成：二级预警，施工车辆侵入保护区', '✓ 巡检工单 #WO-0315-042 已派发至管道班组'],
      aiReply: `管道巡检预警已处理：\n\n**预警信息**\n• 位置：K125+300\n• 类型：第三方施工侵入保护区\n• 等级：⚠️ 二级预警\n\n**已执行**：工单 #WO-0315-042 已派发，班组预计 20 分钟到达，实时监控已开启。\n\n请确认处置情况后完成工单闭环。`,
    } : {
      planDesc: '采集运营数据，制定报告生成与推送策略',
      execDesc: '聚合多维运营指标，AI 生成可视化分析报告',
      planLogs: [
        { text: '提取任务关键词：运营数据 / 报告生成 / 指标分析', kind: 'data' },
        { text: '连接数据仓库，加载运营指标模型', kind: 'info' },
        { text: '执行计划生成完毕，共 4 个子步骤', kind: 'ok' },
      ],
      execLogs: [
        { text: '拉取本周运营核心指标...', kind: 'info' },
        { text: 'DAU: 12.4万（环比+8.2%），留存率 62%', kind: 'data' },
        { text: '转化率：3.7%（较上周+0.5pp）', kind: 'data' },
        { text: '运营周报生成完毕', kind: 'ok' },
      ],
      verifyLogs: [
        { text: '数据与数据仓库一致，无异常', kind: 'ok' },
        { text: '报告格式符合运营规范', kind: 'ok' },
      ],
      steps: [
        { name: '数据采集', desc: '从数据仓库同步 DAU、转化率等核心指标' },
        { name: '指标汇总', desc: '多维度聚合，计算同比环比变化' },
        { name: '趋势分析', desc: 'AI 识别异常波动与增长机会' },
        { name: '报告推送', desc: '生成周报并推送至钉钉 / 飞书群' },
      ],
      advanceLogs: ['✓ 数据采集完成，覆盖 8 个核心指标', '✓ 指标汇总完成，转化率明显提升', '✓ 运营周报已生成，等待确认后推送'],
      aiReply: `本周运营数据分析完成：\n\n**核心指标**\n• DAU：12.4万（环比+8.2%）✅\n• 留存率：62%（持平）\n• 转化率：3.7%（+0.5pp）✅\n\n转化率连续 3 周提升，与上周活动推送相关。\n运营周报已就绪，确认后一键推送至运营群。`,
    };

    // 业务流程管道节点
    const pipeStages: DebugPipeStage[] = [
      { id: 'recv', label: '接收任务', icon: '📥', desc: '员工接收用户指令，解析意图',
        logs: [
          { text: `[用户] 下达任务：「${text.slice(0, 30)}${text.length > 30 ? '…' : ''}」`, kind: 'info' },
          { text: `员工「${data.name || '数字员工'}」已接单，初始化任务上下文`, kind: 'ok' },
          { text: `任务 ID: TASK-${taskId.toString().slice(-6)} 已创建`, kind: 'data' },
        ],
      },
      { id: 'plan', label: '规划拆解', icon: '🧠', desc: taskConfig.planDesc,
        logs: taskConfig.planLogs,
      },
      { id: 'exec', label: '执行处理', icon: '⚙️', desc: taskConfig.execDesc,
        logs: taskConfig.execLogs,
      },
      { id: 'verify', label: '结果验证', icon: '✅', desc: '校验执行结果，确认符合业务逻辑',
        logs: taskConfig.verifyLogs,
      },
      { id: 'human', label: '人工复核', icon: '👤', type: 'human' as const, desc: '等待人工确认执行结果，确认后继续推进',
        logs: [
          { text: '⚠️ 执行结果已就绪，等待人工复核', kind: 'warn' },
          { text: '已暂停自动推进，等待用户确认或澄清', kind: 'info' },
        ],
      },
      { id: 'reply', label: '反馈输出', icon: '💬', desc: '将执行结果反馈给用户',
        logs: [
          { text: '生成结构化回复内容', kind: 'info' },
          { text: '任务执行完成，结果已推送', kind: 'ok' },
        ],
      },
    ];

    // 业务域步骤时间线
    const initSteps: DebugTaskStep[] = taskConfig.steps.map((s, i) => ({
      id: `s${i + 1}`, name: s.name, desc: s.desc,
      status: (i === 0 ? 'running' : 'waiting') as 'running' | 'waiting',
      time: i === 0 ? taskTime : undefined,
    }));

    const newTask: DebugTask = {
      id: taskId, title: text.length > 24 ? text.slice(0, 24) + '…' : text,
      content: text, time: taskTime, status: 'running',
      pipeStages, doneCount: 0,
      steps: initSteps,
      logs: [{ text: `[${taskTime}] 任务已接收，开始处理...`, kind: 'info', ts: taskTime }],
      expanded: true,
      aiReply: taskConfig.aiReply,
    };
    setTasks(prev => [...prev, newTask]);

    // 逐步推进管道和步骤（每阶段间隔）
    const advance = (delay: number, doneCount: number, stepIdx: number, extraLog: string, logKind: string, stepUpdates?: Partial<DebugTaskStep>[]) => {
      setTimeout(() => {
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          const ts = getTs();
          const newSteps = t.steps.map((s, i) => {
            if (stepUpdates && stepUpdates[i]) return { ...s, ...stepUpdates[i], time: stepUpdates[i].status === 'running' || stepUpdates[i].status === 'done' ? ts : s.time };
            return s;
          });
          return {
            ...t, doneCount,
            steps: newSteps,
            logs: [...t.logs, { text: extraLog, kind: logKind, ts }],
          };
        }));
      }, delay);
    };

    advance(250, 1, 0, taskConfig.advanceLogs[0], 'ok',
      [{ status: 'done' }, { status: 'running' }, { status: 'waiting' }, { status: 'waiting' }]);
    advance(550, 2, 1, taskConfig.advanceLogs[1], 'data',
      [{ status: 'done' }, { status: 'done' }, { status: 'running' }, { status: 'waiting' }]);
    advance(900, 3, 2, taskConfig.advanceLogs[2], 'ok',
      [{ status: 'done' }, { status: 'done' }, { status: 'done' }, { status: 'running' }]);

    // 到达人工复核节点：停住，等待用户操作
    setTimeout(() => {
      const ts = getTs();
      setTasks(prev => prev.map(t => t.id !== taskId ? t : {
        ...t,
        status: 'human_pending',
        doneCount: 4, // verify 完成，停在 human 节点
        steps: t.steps.map(s => ({ ...s, status: 'done' as const, time: s.time || ts })),
        logs: [...t.logs,
          { text: '⚠️ 执行结果已就绪，等待人工复核确认', kind: 'warn', ts },
          { text: '● 任务已暂停，请在左侧点击「确认通过」或发送澄清意见', kind: 'info', ts },
        ],
        humanOk: false,
        clarifyMode: false,
        clarifyInput: '',
      }));
      setChatLoading(false);
    }, 1000);
  };

  // 人工确认通过或澄清后继续执行
  const handleHumanApprove = (taskId: number, clarifyText?: string) => {
    const ts = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      // 用任务预设的业务回复，若有澄清意见则追加
      const replyText = t.aiReply || `收到确认！「${t.title}」任务已完成。`;
      setChatMsgs(prev => [...prev, {
        role: 'ai',
        content: clarifyText ? `收到澄清意见：「${clarifyText}」\n\n${replyText}` : replyText,
      }]);
      return {
        ...t, status: 'done' as const, doneCount: t.pipeStages.length,
        humanOk: true, clarifyMode: false, clarifyInput: '',
        logs: [...t.logs,
          ...(clarifyText ? [{ text: `💬 澄清意见：「${clarifyText}」已记录`, kind: 'data', ts }] : []),
          { text: '✅ 人工复核通过，继续执行', kind: 'ok', ts },
          { text: '✓ 任务执行完成，结果已反馈给用户', kind: 'ok', ts },
        ],
      };
    }));
  };
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
          {readOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <EyeOutlined style={{ color: '#ea580c', fontSize: 12 }} />
              <span style={{ fontSize: 12, color: '#ea580c', fontWeight: 500 }}>只读 · {readOnlyVersion}</span>
            </div>
          )}
        </div>

        {/* 右：自动保存 + 历史版本 + 上岗 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {!readOnly && autoSaved && (
            <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircleOutlined style={{ fontSize: 11 }} /> 已自动保存
            </span>
          )}
          {(isEdit || readOnly) && (
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)} style={{ borderRadius: 8 }}>
              历史版本
            </Button>
          )}
          {!readOnly && (
            <Button type="primary" icon={<CheckCircleOutlined />}
              style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8, fontWeight: 600 }}
              onClick={() => setEmpPublishOpen(true)}>
              上岗
            </Button>
          )}
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

              {/* ── 核心文件 ── */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>核心文件 <span style={{ color: '#ff4d4f', fontSize: 11 }}>*</span></span>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>定义该员工的角色身份、行为规范与回复风格</div>
                </div>
                <PromptFilesEditor
                  initialPrompt={data.prompt}
                  onChange={prompt => update({ prompt })}
                />
              </div>

              {/* ── 知识库 ── */}
              <PickerSection
                title="知识库"
                desc="员工将优先检索知识库内容后再回答"
                modalTitle="添加知识库"
                items={KNOWLEDGE_BASES.map(kb => ({ id: kb.id, icon: kb.icon, name: kb.name, desc: kb.desc }))}
                selectedIds={Object.keys(data.kbEnabled).filter(id => data.kbEnabled[id])}
                onAdd={id => update({ kbEnabled: { ...data.kbEnabled, [id]: true } })}
                onRemove={id => update({ kbEnabled: { ...data.kbEnabled, [id]: false } })}
                accentColor="#6366F1"
                linkText="＋ 去万卷新建知识库"
                onLink={() => { window.open('/#knowledge-base', '_blank'); }}
              />

              {/* ── 技能 ── */}
              <PickerSection
                title="技能"
                desc="选择该员工可调用的 Skills / 工作流"
                modalTitle="添加技能 / 工作流"
                items={SKILL_LIST.map(sk => ({
                  id: sk.id, icon: sk.icon, name: sk.name, desc: sk.desc,
                  tag: sk.type,
                  tagColor: sk.type === 'Skill' ? '#6366F1' : '#10B981',
                  tagBg:    sk.type === 'Skill' ? '#eef2ff'  : '#f0fdf4',
                  tagBorder:sk.type === 'Skill' ? '#c7d2fe'  : '#a7f3d0',
                }))}
                selectedIds={Object.keys(data.skillEnabled).filter(id => data.skillEnabled[id])}
                onAdd={id => update({ skillEnabled: { ...data.skillEnabled, [id]: true } })}
                onRemove={id => update({ skillEnabled: { ...data.skillEnabled, [id]: false } })}
                accentColor="#6366F1"
                linkText="＋ 去万卷新建技能"
                onLink={() => { window.open('/#skill-center', '_blank'); }}
              />

              {/* ── MCP Server ── */}
              <PickerSection
                title="MCP Server"
                desc="绑定后员工可直接读写企业内部系统数据"
                modalTitle="添加 MCP Server"
                items={MCP_SERVERS.map(m => ({ id: m.id, icon: m.icon, name: m.name, desc: m.desc }))}
                selectedIds={Object.keys(data.mcpEnabled).filter(id => data.mcpEnabled[id])}
                onAdd={id => update({ mcpEnabled: { ...data.mcpEnabled, [id]: true } })}
                onRemove={id => update({ mcpEnabled: { ...data.mcpEnabled, [id]: false } })}
                accentColor="#10B981"
                linkText="＋ 去万卷新建 MCP Server"
                onLink={() => { window.open('/#mcp-server', '_blank'); }}
              />

              {/* ── 任务 ── */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>任务</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>展示对应任务的执行流程</div>
                  </div>
                  {tasks.length > 0 && (
                    <span onClick={() => setTasks([])} style={{ fontSize: 11, color: '#bbb', cursor: 'pointer', userSelect: 'none' }}>清空</span>
                  )}
                </div>
                {tasks.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#d1d5db', fontSize: 12, border: '1px dashed #e8e8e8', borderRadius: 8 }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>📋</div>
                    在右侧调试区发送任务后将在此展示
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tasks.slice().reverse().map((task, ridx) => {
                      const taskNo = tasks.length - ridx;
                      return (
                        <div key={task.id} style={{ borderRadius: 10, border: '1px solid #e8e8f0', background: '#fff', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                          {/* 任务头部 */}
                          <div
                            onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, expanded: !t.expanded } : t))}
                            style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f0f0', background: '#fafafa', cursor: 'pointer' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                任务 #{taskNo}：{task.title}
                              </div>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{task.time}</div>
                            </div>
                            <span style={{ fontSize: 10, color: '#bbb' }}>{task.expanded ? '▲' : '▼'}</span>
                          </div>

                          {task.expanded && (
                            <div style={{ padding: '12px 14px 12px' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>⚡ 执行流程</div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4, gap: 0 }}>
                                {(task.pipeStages || []).map((stage, idx) => (
                                  <React.Fragment key={stage.id}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 52 }}>
                                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f0ff', border: '1.5px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                                        {stage.icon}
                                      </div>
                                      <div style={{ fontSize: 10, color: '#6366F1', marginTop: 4, fontWeight: 500, textAlign: 'center', lineHeight: 1.2, width: 48 }}>{stage.label}</div>
                                    </div>
                                    {idx < (task.pipeStages || []).length - 1 && (
                                      <div style={{ flex: 1, minWidth: 6, height: 1.5, background: '#c7d2fe', marginTop: 15 }} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
            <Button onClick={onBack ?? onClose}>{readOnly ? '关闭' : '上一步'}</Button>
          </div>
        </div>

        {/* 右：配置预览面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f7f8fc', overflow: 'hidden' }}>
          {/* 调试预览 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>调试预览</span>
              <span style={{ fontSize: 11, color: '#bbb' }}>· 管理员工工作区、工具和身份</span>
            </div>
            {/* 对话消息区 */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '16px 16px 8px', gap: 10, background: '#f5f6fa' }}>
              {chatMsgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
                  {msg.role === 'ai' && (
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: getContentGradient(data.name, data.dept, data.domain, data.description), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {data.name.trim().charAt(0) || '✦'}
                    </div>
                  )}
                  <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.role === 'user' ? '#6366F1' : '#fff', color: msg.role === 'user' ? '#fff' : '#1a1a1a', fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: getContentGradient(data.name, data.dept, data.domain, data.description), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {data.name.trim().charAt(0) || '✦'}
                  </div>
                  <div style={{ padding: '9px 13px', borderRadius: '4px 14px 14px 14px', background: '#fff', fontSize: 13, color: '#bbb', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>···</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* 底部输入栏 */}
            <div style={{ borderTop: '1px solid #e8e8f0', background: '#fff', flexShrink: 0, padding: '10px 14px' }}>
              <input ref={chatFileRef} type="file" accept="*/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setChatMsgs(prev => [...prev, { role: 'user', content: `📎 ${e.target.files![0].name}` }]); e.target.value = ''; } }} />
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e8e8', borderRadius: 10, background: '#fff', padding: '6px 8px 6px 10px', gap: 8 }}>
                <div
                  onClick={() => chatFileRef.current?.click()}
                  title="上传文件或图片"
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: 15, background: '#fafafa', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e8e8'}
                >📎</div>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder='例如：把名字改为法务助手、切换到国产安全模型...'
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#333', background: 'transparent', minWidth: 0 }}
                />
                <div
                  onClick={handleChatSend}
                  style={{ width: 34, height: 34, borderRadius: 9, background: chatInput.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: chatInput.trim() ? 'pointer' : 'default', color: chatInput.trim() ? '#fff' : '#ccc', fontSize: 15, flexShrink: 0, transition: 'all 0.15s' }}
                >▶</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublishVersionModal
        open={empPublishOpen}
        latestVersion=""
        onClose={() => setEmpPublishOpen(false)}
        onPublish={(version, _changelog, _scope) => {
          setEmpPublishOpen(false);
          if (onPublish) {
            onPublish(data.name || '新员工');
          } else {
            onClose();
          }
          message.success(`数字员工「${data.name || '新员工'}」已上岗，版本 ${version}`);
        }}
      />

      {/* 历史版本 Drawer */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>历史版本</span>
            <Tag style={{ fontSize: 11, margin: 0 }}>{MOCK_EMPLOYEE_HISTORY.length} 条记录</Tag>
          </Space>
        }
        placement="right"
        width={420}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* 草稿入口 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8, background: '#f0fdf4', border: '1.5px solid #86efac' }}>
          <Space size={6}>
            <FileTextOutlined style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>草稿（当前编辑版本）</span>
          </Space>
          <Tag color="green" style={{ fontSize: 11, margin: 0 }}>当前</Tag>
        </div>

        <Divider style={{ margin: '12px 0 16px', fontSize: 12, color: '#94a3b8' }}>
          {MOCK_EMPLOYEE_HISTORY.length} 条历史记录
        </Divider>

        <Timeline
          items={[...MOCK_EMPLOYEE_HISTORY].reverse().map(ev => ({
            dot: ev.kind === 'publish'
              ? <TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />
              : <SaveOutlined style={{ color: '#94a3b8', fontSize: 12 }} />,
            color: ev.kind === 'publish' ? '#6366F1' : '#cbd5e1',
            children: (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' as const }}>
                  {ev.kind === 'publish' ? (
                    <>
                      <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{ev.desc}</Tag>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  {ev.user} · {ev.time}
                </div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>公开范围：</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setHistoryOpen(false);
                          if (onViewVersion) {
                            onViewVersion(ev.version!);
                          }
                        }}
                      >查看版本</Button>
                      {!readOnly && (
                        <Button
                          size="small"
                          icon={<RollbackOutlined />}
                          onClick={() => setInlineRollbackTarget(ev.version!)}
                        >回滚</Button>
                      )}
                    </Space>
                  </>
                )}
              </div>
            ),
          }))}
        />
      </Drawer>

      {/* 内联回滚确认 Modal */}
      <Modal
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>确认回滚</span>}
        open={!!inlineRollbackTarget}
        onCancel={() => setInlineRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setInlineRollbackTarget(null)}>取消</Button>
            <Button
              type="primary"
              onClick={() => {
                if (!inlineRollbackTarget) return;
                setInlineRollbackTarget(null);
                setHistoryOpen(false);
                message.success(`已回滚至 ${inlineRollbackTarget.version}，请确认配置后重新上岗`);
              }}
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderColor: 'transparent', borderRadius: 8 }}
            >确定回滚</Button>
          </Space>
        }
        width={520}
      >
        {inlineRollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 16, lineHeight: 1.6 }}>
              确定要将配置回滚到版本 <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366F1' }}>{inlineRollbackTarget.version}</span> 吗？
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>配置恢复至 {inlineRollbackTarget.version} 版本状态，成为新的草稿</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>可修改配置后重新上岗</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};


// ─── 发布版本 Modal ────────────────────────────────────────
const PublishVersionModal: React.FC<{
  open: boolean;
  latestVersion: string;
  onClose: () => void;
  onPublish: (version: string, changelog: string, scope: VisibilityScope) => void;
}> = ({ open, latestVersion, onClose, onPublish }) => {
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [scopeType, setScopeType] = useState<'company' | 'self' | 'custom' | ''>('');
  const [orgSearch, setOrgSearch] = useState('');
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setVersion(nextVersion(latestVersion, 'patch'));
      setChangelog('');
      setScopeType('');
      setOrgSearch('');
      setSelectedOrgs([]);
    }
  }, [open, latestVersion]);

  const handleConfirm = () => {
    if (!/^v\d+\.\d+\.\d+$/.test(version)) {
      message.error('版本号格式不正确，需为 vX.Y.Z');
      return;
    }
    if (scopeType === 'custom' && selectedOrgs.length === 0) {
      message.warning('请选择可见范围');
      return;
    }
    const scope: VisibilityScope = scopeType === 'company' ? 'company' : scopeType === 'custom' ? 'team' : 'private';
    onPublish(version, changelog, scope);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #e8e7ff 0%, #d4d3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CloudUploadOutlined style={{ color: '#6366F1', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>发布新版本</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: '#888', marginTop: 2 }}>发布后将生成不可变的快照，请确保配置已通过调试验证。</div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose} style={{ minWidth: 72 }}>取消</Button>
          <Button type="primary" onClick={handleConfirm} style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', border: 'none', minWidth: 96 }}>确认发布</Button>
        </Space>
      }
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 0 4px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>版本号 <span style={{ color: '#ff4d4f' }}>*</span></span>
            {latestVersion && (
              <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                上次版本：<span style={{ padding: '1px 10px', borderRadius: 6, background: '#f0f0f0', color: '#555', fontSize: 13, fontFamily: 'monospace' }}>{latestVersion}</span>
              </span>
            )}
          </div>
          <Input
            value={version}
            onChange={e => setVersion(e.target.value)}
            placeholder="v1.0.0"
            prefix={<TagOutlined style={{ color: '#6366F1', fontSize: 14 }} />}
            style={{ fontSize: 14, borderRadius: 8 }}
          />
          <div style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>已根据上次版本自动生成建议版本号，可手动修改，格式须为 vX.Y.Z</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>版本说明 / 变更日志</div>
          <Input.TextArea
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
            value={scopeType || undefined}
            onChange={(v: 'company' | 'self' | 'custom') => { setScopeType(v); setSelectedOrgs([]); setOrgSearch(''); }}
            style={{ width: '100%' }}
            placeholder="请选择公开范围"
            allowClear
            onClear={() => { setScopeType(''); setSelectedOrgs([]); setOrgSearch(''); }}
            optionLabelProp="label"
            options={[
              { label: '全公司可见', value: 'company' },
              { label: '仅自己可见', value: 'self' },
              { label: '指定部门/人员', value: 'custom' },
            ]}
            optionRender={(option) => {
              const iconMap: Record<string, React.ReactNode> = {
                company: <GlobalOutlined style={{ color: '#6366F1', fontSize: 14 }} />,
                self: <LockOutlined style={{ color: '#6366F1', fontSize: 14 }} />,
                custom: <TeamOutlined style={{ color: '#6366F1', fontSize: 14 }} />,
              };
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {iconMap[option.value as string]}
                  </div>
                  <span style={{ fontSize: 13, color: '#1a1a1a' }}>{option.label}</span>
                </div>
              );
            }}
          />
          {!scopeType && <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>未选择时默认仅自己可见</div>}
          {scopeType === 'custom' && (
            <div style={{ marginTop: 10 }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                placeholder="搜索部门..."
                value={orgSearch}
                onChange={e => setOrgSearch(e.target.value)}
                style={{ borderRadius: 8, marginBottom: 8 }}
                allowClear
              />
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                {ORG_TREE.filter(o => !orgSearch.trim() || o.name.includes(orgSearch.trim()) || o.path.includes(orgSearch.trim())).map((org, idx, arr) => {
                  const checked = selectedOrgs.includes(org.id);
                  return (
                    <div
                      key={org.id}
                      onClick={() => setSelectedOrgs(prev => checked ? prev.filter(id => id !== org.id) : [...prev, org.id])}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: idx < arr.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', background: checked ? '#f5f4ff' : 'transparent', transition: 'background 0.12s' }}
                      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = checked ? '#f5f4ff' : 'transparent'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TeamOutlined style={{ color: '#fff', fontSize: 13 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? '#6366F1' : '#1a1a1a' }}>{org.name}</div>
                        {org.path !== org.name && <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{org.path}</div>}
                      </div>
                      <div style={{ width: 15, height: 15, borderRadius: 3, border: checked ? 'none' : '1.5px solid #d1d5db', background: checked ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedOrgs.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#6366F1' }}>已选 {selectedOrgs.length} 个部门/人员</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ─── 版本管理 Drawer ───────────────────────────────────────
const VersionDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  employee: DigitalEmployeeItem | null;
  onViewVersion: (version: EmployeeVersion, employee: DigitalEmployeeItem) => void;
  onRollback: (version: EmployeeVersion, employee: DigitalEmployeeItem) => void;
}> = ({ open, onClose, employee, onViewVersion, onRollback }) => {
  const [rollbackTarget, setRollbackTarget] = useState<EmployeeVersion | null>(null);
  const [history] = useState<EmployeeHistoryEvent[]>(MOCK_EMPLOYEE_HISTORY);

  if (!employee) return null;

  const handleRollbackConfirm = () => {
    if (!rollbackTarget) return;
    setRollbackTarget(null);
    onClose();
    onRollback(rollbackTarget, employee);
  };

  return (
    <>
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            <span>版本控制 · {employee.name}</span>
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
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '10px 14px', marginBottom: 4, borderRadius: 8,
            background: '#f0fdf4', border: '1.5px solid #86efac',
          }}
        >
          <Space size={6}>
            <FileTextOutlined style={{ color: '#16a34a' }} />
            <span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              草稿（当前编辑版本）
            </span>
          </Space>
          <Tag color="green" style={{ fontSize: 11, margin: 0 }}>当前</Tag>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' as const }}>
                  {ev.kind === 'publish' ? (
                    <>
                      <Tag color="purple" style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{ev.desc}</Tag>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>正式发布</Tag>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{ev.desc}</span>
                      <Tag style={{ margin: 0, fontSize: 11, color: '#64748b', borderColor: '#cbd5e1', background: '#f8fafc' }}>草稿保存</Tag>
                    </>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  {ev.user} · {ev.time}
                </div>
                {ev.kind === 'publish' && ev.version && (
                  <>
                    {ev.version.changelog && (
                      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #e2e8f0', lineHeight: 1.5 }}>
                        {ev.version.changelog}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>公开范围：</span>
                      <Tag style={{ fontSize: 11, margin: 0 }}>{SCOPE_LABELS[ev.version.scope].label}</Tag>
                    </div>
                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => { onClose(); onViewVersion(ev.version!, employee); }}
                      >查看版本</Button>
                      <Button
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => setRollbackTarget(ev.version!)}
                      >回滚</Button>
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
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>确认回滚</span>}
        open={!!rollbackTarget}
        onCancel={() => setRollbackTarget(null)}
        footer={
          <Space>
            <Button onClick={() => setRollbackTarget(null)}>取消</Button>
            <Button
              type="primary"
              onClick={handleRollbackConfirm}
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', borderColor: 'transparent', borderRadius: 8 }}
            >确定回滚</Button>
          </Space>
        }
        width={520}
      >
        {rollbackTarget && (
          <div style={{ padding: '4px 0 8px' }}>
            <div style={{ fontSize: 14, color: '#333', marginBottom: 16, lineHeight: 1.6 }}>
              确定要将内容回滚到版本 <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366F1' }}>{rollbackTarget.version}</span> 吗？
            </div>
            <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#111' }}>此操作会：</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>员工配置恢复至 {rollbackTarget.version} 版本状态，成为新的草稿</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>草稿支持修改配置后重新上岗</li>
              <li style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>历史记录会保留，可随时回滚到其他版本</li>
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
};

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
  // 查看版本（只读配置页）
  const [viewVersionOpen, setViewVersionOpen]   = useState(false);
  const [viewVersionData, setViewVersionData]   = useState<{ employee: DigitalEmployeeItem; version: EmployeeVersion } | null>(null);
  // 回滚（草稿编辑配置页）
  const [rollbackDraftOpen, setRollbackDraftOpen] = useState(false);
  const [rollbackDraftData, setRollbackDraftData] = useState<{ employee: DigitalEmployeeItem; version: EmployeeVersion } | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !searchText || e.name.includes(searchText) || e.description.includes(searchText);
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDomain = domainFilter === '全部' || e.domain === domainFilter;
    return matchSearch && matchStatus && matchDomain;
  });

  // ── 上岗发布 Modal ────────────────────────────────────────
  const [publishVersionOpen, setPublishVersionOpen] = useState(false);
  const [publishEmpId, setPublishEmpId]   = useState<string | null>(null);
  const [publishEmpName, setPublishEmpName] = useState('');

  const openPublishModal = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setPublishEmpId(id);
    setPublishEmpName(emp?.name ?? '');
    setPublishVersionOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: EmployeeStatus, silent = false) => {
    employeeStore.updateEmployee(id, { status: newStatus as any });
    setLocalOverrides(prev => ({ ...prev, [id]: { ...prev[id], status: newStatus } }));
    if (!silent) {
      const labels: Record<string, string> = { published: '已上岗', paused: '已暂停', archived: '已归档' };
      message.success(labels[newStatus] || '状态已更新');
    }
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
                {(r.status === 'draft' || r.status === 'testing') && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openPublishModal(r.id)}>上岗</Button>}
                {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
                {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openPublishModal(r.id)}>恢复</Button>}
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
          {(r.status === 'draft' || r.status === 'testing') && <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openPublishModal(r.id)}>上岗</Button>}
          {r.status === 'published' && <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }} onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>}
          {r.status === 'paused' && <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }} onClick={() => openPublishModal(r.id)}>恢复</Button>}
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
          onPublish={(name) => {
            setCreateModalOpen(false);
            setCreateInitialData({name:'',description:'',dept:'',domain:'',role:''});
            setPublishEmpId('__new__');
            setPublishEmpName(name);
            setPublishVersionOpen(true);
          }}
          initialData={createInitialData.name ? { name: createInitialData.name, description: createInitialData.description, dept: createInitialData.dept, domain: createInitialData.domain, role: createInitialData.role } : undefined}
        />
      )}

      {/* 全页编辑向导 */}
      {editModalOpen && (
        <EmployeeConfigPage
          onClose={() => { setEditModalOpen(false); setEditEmployee(null); }}
          onPublish={(name) => {
            const targetId = editEmployee?.id ?? null;
            setEditModalOpen(false);
            setEditEmployee(null);
            setPublishEmpId(targetId);
            setPublishEmpName(name || editEmployee?.name || '');
            setPublishVersionOpen(true);
          }}
          initialData={{ name: editEmployee?.name ?? '', dept: editEmployee?.dept ?? '', description: editEmployee?.description ?? '', domain: editEmployee?.domain ?? '' }}
          isEdit
        />
      )}

      {/* 查看历史版本（只读） */}
      {viewVersionOpen && viewVersionData && (
        <EmployeeConfigPage
          onClose={() => { setViewVersionOpen(false); setViewVersionData(null); }}
          initialData={{ name: viewVersionData.employee.name, dept: viewVersionData.employee.dept, description: viewVersionData.employee.description, domain: viewVersionData.employee.domain }}
          readOnly
          readOnlyVersion={viewVersionData.version.version}
          isEdit
        />
      )}

      {/* 回滚草稿（可编辑，重新上岗） */}
      {rollbackDraftOpen && rollbackDraftData && (
        <EmployeeConfigPage
          onClose={() => { setRollbackDraftOpen(false); setRollbackDraftData(null); }}
          onPublish={(name) => {
            const targetId = rollbackDraftData.employee.id;
            setRollbackDraftOpen(false);
            setRollbackDraftData(null);
            setPublishEmpId(targetId);
            setPublishEmpName(name || rollbackDraftData.employee.name);
            setPublishVersionOpen(true);
          }}
          initialData={{ name: rollbackDraftData.employee.name, dept: rollbackDraftData.employee.dept, description: rollbackDraftData.employee.description, domain: rollbackDraftData.employee.domain }}
          isEdit
        />
      )}

      {/* 版本 Drawer */}
      <VersionDrawer
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        employee={selectedEmployee}
        onViewVersion={(ver, emp) => {
          setViewVersionData({ employee: emp, version: ver });
          setViewVersionOpen(true);
        }}
        onRollback={(ver, emp) => {
          setRollbackDraftData({ employee: emp, version: ver });
          setRollbackDraftOpen(true);
          message.success(`已回滚到 ${ver.version}，进入草稿编辑`);
        }}
      />

      {/* 上岗发布版本 Modal */}
      <PublishVersionModal
        open={publishVersionOpen}
        latestVersion=""
        onClose={() => setPublishVersionOpen(false)}
        onPublish={(version, _changelog, _scope) => {
          if (publishEmpId && publishEmpId !== '__new__') {
            handleStatusChange(publishEmpId, 'published', true);
          }
          message.success(`「${publishEmpName || '新员工'}」已上岗，版本 ${version}`);
          setPublishVersionOpen(false);
        }}
      />

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
