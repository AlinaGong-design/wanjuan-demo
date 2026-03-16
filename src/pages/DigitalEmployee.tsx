import React, { useState } from 'react';
import {
  Button, Input, Tag, Modal, Select, Tabs, Badge,
  Drawer, Form, Table, Progress, Divider, message, Steps, Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  PlayCircleOutlined, PauseCircleOutlined, RollbackOutlined,
  BarChartOutlined, SettingOutlined, ApiOutlined,
  CheckCircleOutlined, StopOutlined,
  CloudUploadOutlined, TeamOutlined, LockOutlined, GlobalOutlined,
  CopyOutlined, SendOutlined, WarningOutlined,
  BranchesOutlined, DollarOutlined, ApartmentOutlined,
} from '@ant-design/icons';

// ─── 类型 ─────────────────────────────────────────────────

type EmployeeStatus = 'draft' | 'testing' | 'published' | 'paused' | 'archived';
type DeployScope = 'private' | 'dept' | 'company';

interface EmployeeVersion {
  versionId: string;
  version: string;
  changelog: string;
  publishedAt: string;
  publishedBy: string;
  status: 'active' | 'history';
}

interface DigitalEmployeeItem {
  id: string;
  name: string;
  dept: string;
  description: string;
  status: EmployeeStatus;
  version: string;
  scope: DeployScope;
  tokenUsed: number;
  callCount: number;
  successRate: number;
  updateTime: string;
}

// ─── Mock 数据 ────────────────────────────────────────────

const MOCK_EMPLOYEES: DigitalEmployeeItem[] = [
  { id: 'de-001', name: '法务合规助手', dept: '法务部', description: '合同审查、合规检查、法律风险评估，支持多种合同模板自动识别与条款提取', status: 'published', version: 'v2.1.0', scope: 'company', tokenUsed: 2840000, callCount: 1284, successRate: 98.2, updateTime: '2026-03-10' },
  { id: 'de-002', name: 'HR 招聘助手', dept: '人力资源', description: '简历智能筛选、面试时间协调、薪酬 benchmark 参考，接入飞书日历', status: 'published', version: 'v1.3.2', scope: 'dept', tokenUsed: 1560000, callCount: 892, successRate: 96.5, updateTime: '2026-03-05' },
  { id: 'de-003', name: '财务报表助手', dept: '财务部', description: '定时拉取业务数据，AI 生成分析报告，异常数据预警推送', status: 'testing', version: 'v3.0.0-beta', scope: 'dept', tokenUsed: 380000, callCount: 156, successRate: 94.2, updateTime: '2026-03-14' },
  { id: 'de-004', name: '代码审查助手', dept: '技术部', description: 'PR 触发自动代码审查，安全漏洞扫描，输出审查建议并评论到 GitLab/GitHub', status: 'paused', version: 'v1.1.0', scope: 'dept', tokenUsed: 920000, callCount: 2104, successRate: 99.1, updateTime: '2026-02-28' },
  { id: 'de-005', name: '智能客服分发', dept: '客户成功', description: '意图识别、多轮路由分发、自动记录工单，支持人工接管', status: 'draft', version: 'v0.1.0', scope: 'private', tokenUsed: 0, callCount: 0, successRate: 0, updateTime: '2026-03-15' },
];

const FUNCTION_TEMPLATES = [
  { id: 'ft1', name: '客服问答模板', category: '服务', desc: '标准客服问答流程，内置意图分类与转人工节点', icon: '💬' },
  { id: 'ft2', name: '文档处理模板', category: '办公', desc: '文档读取、摘要、格式转换，支持多种文件类型', icon: '📄' },
  { id: 'ft3', name: '数据分析模板', category: '数据', desc: '数据拉取、清洗、可视化报告生成', icon: '📊' },
  { id: 'ft4', name: '代码助手模板', category: '研发', desc: '代码生成、审查、调试一体化助手', icon: '💻' },
  { id: 'ft5', name: '合规审查模板', category: '合规', desc: '文档合规检查、风险提示、建议生成', icon: '⚖️' },
  { id: 'ft6', name: '招聘助手模板', category: '人事', desc: '简历筛选、候选人沟通、面试安排', icon: '👥' },
];

const MOCK_VERSIONS: EmployeeVersion[] = [
  { versionId: 'v3', version: 'v2.1.0', changelog: '优化合同识别准确率，新增风险等级标注', publishedAt: '2026-03-10 14:30', publishedBy: '张三', status: 'active' },
  { versionId: 'v2', version: 'v2.0.1', changelog: '修复飞书文档权限异常问题', publishedAt: '2026-02-28 09:15', publishedBy: '张三', status: 'history' },
  { versionId: 'v1', version: 'v2.0.0', changelog: '重构 Prompt 结构，支持多类型合同模板', publishedAt: '2026-02-15 16:00', publishedBy: '李四', status: 'history' },
];

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; badgeStatus: 'default' | 'processing' | 'success' | 'warning' | 'error' }> = {
  draft:     { label: '草稿',   badgeStatus: 'default' },
  testing:   { label: '测试中', badgeStatus: 'processing' },
  published: { label: '运行中', badgeStatus: 'success' },
  paused:    { label: '已暂停', badgeStatus: 'warning' },
  archived:  { label: '已归档', badgeStatus: 'error' },
};

const SCOPE_CONFIG: Record<DeployScope, { label: string; icon: React.ReactNode }> = {
  private: { label: '仅创建者', icon: <LockOutlined /> },
  dept:    { label: '部门内',   icon: <TeamOutlined /> },
  company: { label: '全公司',   icon: <GlobalOutlined /> },
};

// ─── 工具绑定行（向导步骤 2 用）─────────────────────────

const WIZARD_TOOLS = [
  { id: 'sk1', name: 'web-search', type: 'Skill', icon: '🔍', desc: '实时网络搜索', defaultOn: true },
  { id: 'sk2', name: 'feishu-doc', type: 'Skill', icon: '📄', desc: '飞书文档读写', defaultOn: true },
  { id: 'sk3', name: 'code-interpreter', type: 'Skill', icon: '💻', desc: 'Python 代码执行', defaultOn: false },
  { id: 'sk4', name: '内容审核流程', type: '工作流', icon: '⚡', desc: '多节点内容审核', defaultOn: true },
  { id: 'sk5', name: '数据处理流水线', type: '工作流', icon: '🔄', desc: '数据 ETL 处理', defaultOn: false },
  { id: 'sk6', name: '写作助手', type: '智能体', icon: '✍️', desc: '万卷智能体', defaultOn: false },
];

// ─── 创建向导（独立组件）────────────────────────────────

const CreateWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toolEnabled, setToolEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(WIZARD_TOOLS.map(t => [t.id, t.defaultOn]))
  );
  const [form] = Form.useForm();

  const steps = [
    { title: '选择模板', description: '职能模板库' },
    { title: '配置 Prompt', description: '可视化编辑' },
    { title: '绑定工具集', description: 'Skill / 工作流' },
    { title: '测试预览', description: '发布前验证' },
  ];

  return (
    <div>
      <Steps current={step} items={steps} style={{ marginBottom: 28 }} size="small" />

      {/* 步骤 0：模板选择 */}
      {step === 0 && (
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>选择职能模板快速开始，或从空白创建</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {FUNCTION_TEMPLATES.map(t => (
              <div key={t.id} onClick={() => setSelectedTemplate(t.id)}
                style={{ border: `2px solid ${selectedTemplate === t.id ? '#6366F1' : '#e8e8e8'}`, borderRadius: 10, padding: 14, cursor: 'pointer', background: selectedTemplate === t.id ? '#f5f4ff' : '#fff', transition: 'all 0.15s' }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>{t.desc}</div>
                <Tag style={{ marginTop: 8, fontSize: 10, borderRadius: 4 }}>{t.category}</Tag>
              </div>
            ))}
            <div onClick={() => setSelectedTemplate('blank')}
              style={{ border: `2px dashed ${selectedTemplate === 'blank' ? '#6366F1' : '#e8e8e8'}`, borderRadius: 10, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: '#aaa', background: selectedTemplate === 'blank' ? '#f5f4ff' : '#fafafa', transition: 'all 0.15s' }}
            >
              <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>从空白创建</div>
            </div>
          </div>
        </div>
      )}

      {/* 步骤 1：Prompt 配置 */}
      {step === 1 && (
        <Form form={form} layout="vertical">
          <Form.Item label="员工名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：法务合规助手、HR 招聘助手..." style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item label="所属部门" name="dept">
            <Select placeholder="选择部门" style={{ borderRadius: 8 }}
              options={['法务部', '人力资源', '财务部', '技术部', '产品部', '市场部', '客户成功'].map(d => ({ label: d, value: d }))} />
          </Form.Item>
          <Form.Item label="System Prompt（角色设定）" name="prompt" rules={[{ required: true, message: '请配置 Prompt' }]}>
            <Input.TextArea rows={6}
              placeholder={`你是一名专业的法务合规助手，负责：\n1. 合同条款审查与风险识别\n2. 合规政策解读与咨询\n3. 法律文件摘要生成\n\n注意：所有建议仅供参考，重大决策需人工复核`}
              style={{ borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}
            />
          </Form.Item>
          <Form.Item label="功能描述" name="description">
            <Input placeholder="简短描述该数字员工的职能..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      )}

      {/* 步骤 2：工具绑定 */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>选择该员工可调用的工具集，来自万卷平台</div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
            {WIZARD_TOOLS.map((tool, idx) => (
              <div key={tool.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: idx < WIZARD_TOOLS.length - 1 ? '1px solid #f5f5f5' : 'none', background: toolEnabled[tool.id] ? '#fff' : '#fafafa' }}>
                <span style={{ fontSize: 20 }}>{tool.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: toolEnabled[tool.id] ? '#1a1a1a' : '#aaa' }}>{tool.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                    <Tag style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>{tool.type}</Tag>
                    <span style={{ fontSize: 11, color: '#999' }}>{tool.desc}</span>
                  </div>
                </div>
                <Switch size="small" checked={toolEnabled[tool.id]}
                  onChange={v => setToolEnabled(prev => ({ ...prev, [tool.id]: v }))}
                  style={{ background: toolEnabled[tool.id] ? '#6366F1' : undefined }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 步骤 3：测试预览 */}
      {step === 3 && (
        <div>
          <div style={{ border: '1px solid #e0deff', borderRadius: 10, overflow: 'hidden', background: '#f8f7ff' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0deff', display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6366F1' }}>对话测试预览</span>
              <Tag color="processing" style={{ marginLeft: 'auto', fontSize: 10 }}>测试模式</Tag>
            </div>
            <div style={{ padding: 16, minHeight: 140 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0deff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div style={{ background: '#fff', borderRadius: '0 10px 10px 10px', padding: '10px 14px', fontSize: 13, color: '#333', maxWidth: 340, border: '1px solid #e8e8e8', lineHeight: 1.6 }}>
                  你好！我是数字员工助手，请描述您的需求，我将为您提供专业支持。
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #e0deff', display: 'flex', gap: 8, background: '#fff' }}>
              <Input placeholder="输入测试消息..." style={{ borderRadius: 8, flex: 1 }} />
              <Button type="primary" icon={<SendOutlined />} style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 8 }} />
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 12, color: '#52c41a' }}>
            ✅ 配置检查通过：Prompt 有效 · 工具链完整 · 权限配置正常
          </div>
        </div>
      )}

      {/* 底部操作 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Button onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
          {step === 0 ? '取消' : '上一步'}
        </Button>
        <div style={{ display: 'flex', gap: 10 }}>
          {step === steps.length - 1 ? (
            <>
              <Button icon={<CloudUploadOutlined />} onClick={() => { onClose(); message.success('草稿已保存'); }}>保存草稿</Button>
              <Button type="primary" icon={<CheckCircleOutlined />}
                style={{ background: '#6366F1', borderColor: '#6366F1' }}
                onClick={() => { onClose(); message.success('数字员工已发布上线'); }}
              >
                发布上线
              </Button>
            </>
          ) : (
            <Button type="primary" disabled={step === 0 && !selectedTemplate}
              style={{ background: '#6366F1', borderColor: '#6366F1' }}
              onClick={() => setStep(s => s + 1)}
            >
              下一步
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── 版本管理 Drawer（独立组件）────────────────────────

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
          {ver.status === 'history' && (
            <Button size="small" icon={<RollbackOutlined />}
              style={{ marginTop: 10, borderRadius: 6, fontSize: 12, color: '#6366F1', borderColor: '#6366F1' }}
              onClick={() => message.success(`已回滚到 ${ver.version}`)}>
              回滚到此版本
            </Button>
          )}
        </div>
      ))}
    </div>
  </Drawer>
);

// ─── 主页面 ───────────────────────────────────────────────

const DigitalEmployee: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [employees, setEmployees] = useState<DigitalEmployeeItem[]>(MOCK_EMPLOYEES);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<DigitalEmployeeItem | null>(null);

  const filteredEmployees = employees.filter(e => {
    const matchSearch = !searchText || e.name.includes(searchText) || e.description.includes(searchText);
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchDept = !deptFilter || e.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const handleStatusChange = (id: string, newStatus: EmployeeStatus) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    const labels: Record<string, string> = { published: '已发布上线', paused: '已暂停', archived: '已归档' };
    message.success(labels[newStatus] || '状态已更新');
  };

  // 汇总数据
  const totalCalls = employees.reduce((s, e) => s + e.callCount, 0);
  const totalToken = employees.reduce((s, e) => s + e.tokenUsed, 0);
  const publishedCount = employees.filter(e => e.status === 'published').length;
  const activeRates = employees.filter(e => e.successRate > 0);
  const avgRate = activeRates.length ? (activeRates.reduce((s, e) => s + e.successRate, 0) / activeRates.length) : 0;

  // 表格列
  const columns: ColumnsType<DigitalEmployeeItem> = [
    {
      title: '数字员工',
      key: 'name',
      width: 240,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏢</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{r.dept} · {r.version}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, r) => {
        const cfg = STATUS_CONFIG[r.status];
        return <Badge status={cfg.badgeStatus} text={<span style={{ fontSize: 12 }}>{cfg.label}</span>} />;
      },
    },
    {
      title: '访问权限',
      key: 'scope',
      width: 100,
      render: (_, r) => {
        const cfg = SCOPE_CONFIG[r.scope];
        return <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>{cfg.icon} {cfg.label}</span>;
      },
    },
    {
      title: '调用量 / 成功率',
      key: 'metrics',
      width: 150,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.callCount.toLocaleString()} 次</div>
          <div style={{ fontSize: 11, color: r.successRate >= 95 ? '#10b981' : '#f59e0b' }}>
            {r.successRate > 0 ? `${r.successRate}% 成功率` : '暂无数据'}
          </div>
        </div>
      ),
    },
    {
      title: 'Token 消耗',
      key: 'token',
      width: 100,
      render: (_, r) => <span style={{ fontSize: 12, color: '#666' }}>{r.tokenUsed > 0 ? `${(r.tokenUsed / 10000).toFixed(1)}万` : '-'}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <Button size="small" type="text" icon={<EditOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => message.info('正在进入编辑器...')}>编辑</Button>
          <Button size="small" type="text" icon={<BranchesOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setSelectedEmployee(r); setVersionDrawerOpen(true); }}>版本</Button>
          <Button size="small" type="text" icon={<ApiOutlined />} style={{ color: '#6366F1', fontSize: 12 }}
            onClick={() => { setSelectedEmployee(r); setApiDrawerOpen(true); }}>接入</Button>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          {(r.status === 'draft' || r.status === 'testing') && (
            <Button size="small" type="text" icon={<CloudUploadOutlined />} style={{ color: '#10b981', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'published')}>发布</Button>
          )}
          {r.status === 'published' && (
            <Button size="small" type="text" icon={<PauseCircleOutlined />} style={{ color: '#f59e0b', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'paused')}>暂停</Button>
          )}
          {r.status === 'paused' && (
            <Button size="small" type="text" icon={<PlayCircleOutlined />} style={{ color: '#10b981', fontSize: 12 }}
              onClick={() => handleStatusChange(r.id, 'published')}>恢复</Button>
          )}
          <Button size="small" type="text" icon={<StopOutlined />} style={{ color: '#ff4d4f', fontSize: 12 }}
            onClick={() => Modal.confirm({
              title: `确认归档「${r.name}」？`, content: '归档后不可再调用，可从归档列表恢复',
              okText: '归档', okButtonProps: { danger: true }, cancelText: '取消',
              onOk: () => handleStatusChange(r.id, 'archived'),
            })}>归档</Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: '#f7f8fc', margin: -24, padding: 24, minHeight: 'calc(100vh - 64px)' }}>

      {/* ── 页面标题 + 汇总指标 ── */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, background: '#fff', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏢</div>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>数字员工智能体</span>
              <Tag style={{ borderRadius: 6, fontSize: 11, background: '#f5f4ff', borderColor: '#d4d4ff', color: '#6366F1' }}>企业管理端</Tag>
            </div>
            <div style={{ fontSize: 13, color: '#888', paddingLeft: 46 }}>企业级职能化 AI 资产，全生命周期可管可控 · 对接万卷 RBAC 权限体系 · 龙虾后台资源监控</div>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large"
            onClick={() => setCreateModalOpen(true)}
            style={{ background: '#6366F1', borderColor: '#6366F1', borderRadius: 10, height: 42, padding: '0 22px', fontWeight: 600 }}
          >
            创建数字员工
          </Button>
        </div>

        {/* 汇总指标行 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: '运行中员工', value: `${publishedCount} / ${employees.length}`, color: '#6366F1', bg: '#f5f4ff', icon: '🤖' },
            { label: '今月总调用', value: `${totalCalls.toLocaleString()}次`, color: '#10b981', bg: '#f0fdf4', icon: '⚡' },
            { label: '总 Token 消耗', value: `${(totalToken / 10000).toFixed(0)}万`, color: '#f59e0b', bg: '#fffbeb', icon: '💡' },
            { label: '平台平均成功率', value: `${avgRate.toFixed(1)}%`, color: '#8B5CF6', bg: '#faf5ff', icon: '✅' },
          ].map(m => (
            <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 主体 Tabs ── */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 24px' }}
          tabBarStyle={{ marginBottom: 0, borderBottom: '1px solid #f0f0f0' }}
          items={[
            { key: 'list',    label: <span><TeamOutlined style={{ marginRight: 5 }} />员工资产库</span> },
            { key: 'monitor', label: <span><BarChartOutlined style={{ marginRight: 5 }} />运行监控</span> },
            { key: 'billing', label: <span><DollarOutlined style={{ marginRight: 5 }} />计量计费</span> },
            { key: 'platform',label: <span><ApartmentOutlined style={{ marginRight: 5 }} />平台汇总</span> },
          ]}
        />

        <div style={{ padding: 24 }}>

          {/* ══ 员工资产库 ══ */}
          {activeTab === 'list' && (
            <div>
              {/* 筛选栏 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="搜索员工名称 / 描述..."
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  style={{ width: 260, borderRadius: 8 }} allowClear />
                <Select placeholder="状态筛选" allowClear style={{ width: 120 }} onChange={v => setStatusFilter(v || '')}
                  options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
                <Select placeholder="部门筛选" allowClear style={{ width: 120 }} onChange={v => setDeptFilter(v || '')}
                  options={['法务部', '人力资源', '财务部', '技术部', '客户成功'].map(d => ({ label: d, value: d }))} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Tag style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>全部 {employees.length}</Tag>
                  <Tag color="success" style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>运行中 {publishedCount}</Tag>
                  <Tag color="processing" style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>测试中 {employees.filter(e => e.status === 'testing').length}</Tag>
                </div>
              </div>
              <Table
                dataSource={filteredEmployees}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 8, size: 'small' }}
                size="middle"
              />
            </div>
          )}

          {/* ══ 运行监控 ══ */}
          {activeTab === 'monitor' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                {employees.filter(e => e.status === 'published' || e.status === 'testing').map(e => (
                  <div key={e.id} style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Badge status={STATUS_CONFIG[e.status].badgeStatus} />
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{e.name}</span>
                      <Tag style={{ fontSize: 10, margin: 0 }}>{e.dept}</Tag>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#6366F1' }}>{e.callCount.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>调用次数</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: e.successRate >= 95 ? '#10b981' : '#f59e0b' }}>
                          {e.successRate > 0 ? `${e.successRate}%` : '-'}
                        </div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>成功率</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{(e.tokenUsed / 10000).toFixed(1)}万</div>
                        <div style={{ fontSize: 11, color: '#bbb' }}>Token</div>
                      </div>
                    </div>
                    <Progress percent={e.successRate} strokeColor={e.successRate >= 95 ? '#10b981' : '#f59e0b'} showInfo={false} size="small" />
                  </div>
                ))}
              </div>

              {/* 告警 */}
              <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>实时告警 · 最近 24 小时</div>
                {[
                  { level: 'warning', msg: '财务报表助手 v3.0.0-beta 成功率跌至 94.2%，低于阈值 95%', time: '10 分钟前' },
                  { level: 'info',    msg: '法务合规助手已自动发布 v2.1.0，灰度流量切换至 100%',   time: '3 小时前' },
                ].map((alert, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i === 0 ? '1px solid #f5f5f5' : 'none' }}>
                    {alert.level === 'warning'
                      ? <WarningOutlined style={{ color: '#f59e0b', fontSize: 16, marginTop: 2 }} />
                      : <CheckCircleOutlined style={{ color: '#10b981', fontSize: 16, marginTop: 2 }} />}
                    <div style={{ flex: 1, fontSize: 13, color: '#333', lineHeight: 1.6 }}>{alert.msg}</div>
                    <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ 计量计费 ══ */}
          {activeTab === 'billing' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 16 }}>
                {/* 消耗分布 */}
                <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>本月资源消耗</div>
                  {[
                    { dept: '法务部',   token: 2840, cost: 856, pct: 47 },
                    { dept: '人力资源', token: 1560, cost: 468, pct: 26 },
                    { dept: '技术部',   token: 920,  cost: 276, pct: 15 },
                    { dept: '财务部',   token: 380,  cost: 114, pct: 6  },
                    { dept: '其他',     token: 360,  cost: 108, pct: 6  },
                  ].map(item => (
                    <div key={item.dept} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#333' }}>{item.dept}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>{item.token}万 Token · ¥{item.cost}</span>
                      </div>
                      <Progress percent={item.pct} strokeColor="#6366F1" showInfo={false} size="small" />
                    </div>
                  ))}
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>本月合计</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#6366F1' }}>¥1,822</span>
                  </div>
                </div>

                {/* 上限管控 */}
                <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>资源上限管控</div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>对接龙虾后台资源监控，超限自动降级</div>
                  {[
                    { dept: '法务部',   limit: 5000, used: 2840 },
                    { dept: '人力资源', limit: 3000, used: 1560 },
                    { dept: '技术部',   limit: 2000, used: 920  },
                    { dept: '财务部',   limit: 1000, used: 380  },
                  ].map(item => {
                    const pct = Math.round((item.used / item.limit) * 100);
                    return (
                      <div key={item.dept} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#333' }}>{item.dept}</span>
                          <span style={{ fontSize: 12, color: pct > 80 ? '#f59e0b' : '#999' }}>
                            {item.used} / {item.limit} 万Token ({pct}%)
                          </span>
                        </div>
                        <Progress percent={pct} strokeColor={pct > 80 ? '#f59e0b' : pct > 60 ? '#6366F1' : '#10b981'} showInfo={false} size="small" />
                      </div>
                    );
                  })}
                  <Button size="small" type="dashed" icon={<SettingOutlined />}
                    style={{ marginTop: 8, borderRadius: 6, borderColor: '#6366F1', color: '#6366F1' }}>
                    调整上限配置
                  </Button>
                </div>
              </div>

              <div style={{ background: '#f8f7ff', border: '1px solid #e0deff', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#555', lineHeight: 1.8 }}>
                <strong style={{ color: '#6366F1' }}>计费说明：</strong>
                Token 消耗统计由万卷后台采集，账单由龙虾后台生成。企业 AI 资产消耗独立计量，个人分身消耗不合并至企业账单。
              </div>
            </div>
          )}

          {/* ══ 平台汇总 ══ */}
          {activeTab === 'platform' && (
            <div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e' }}>
                <LockOutlined />
                <span>本视图展示全平台分身<strong>汇总运行指标</strong>，<strong>不含任何个人对话内容、个人记忆明细</strong>，符合万卷 RBAC 权限隔离要求</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: '全平台分身数', value: '1,284', icon: '👤', color: '#6366F1', bg: '#f5f4ff' },
                  { label: '本月活跃分身', value: '893', icon: '⚡', color: '#10b981', bg: '#f0fdf4' },
                  { label: '平台总调用次数', value: '284,720', icon: '📊', color: '#f59e0b', bg: '#fffbeb' },
                  { label: '平台整体成功率', value: '97.6%', icon: '✅', color: '#8B5CF6', bg: '#faf5ff' },
                ].map(card => (
                  <div key={card.label} style={{ background: card.bg, borderRadius: 12, padding: '18px 20px' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>各部门分身使用概况（汇总，无个人明细）</div>
                {[
                  { dept: '技术部',   count: 312, calls: 82440, rate: 98.9 },
                  { dept: '产品部',   count: 256, calls: 61200, rate: 97.2 },
                  { dept: '市场部',   count: 198, calls: 48600, rate: 96.8 },
                  { dept: '人力资源', count: 145, calls: 36250, rate: 97.5 },
                  { dept: '法务部',   count: 89,  calls: 31150, rate: 98.1 },
                ].map((item, i) => (
                  <div key={item.dept} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#333', width: 72 }}>{item.dept}</span>
                    <span style={{ fontSize: 12, color: '#666', width: 80 }}>{item.count} 个分身</span>
                    <span style={{ fontSize: 12, color: '#666', width: 100 }}>{item.calls.toLocaleString()} 次</span>
                    <div style={{ flex: 1 }}>
                      <Progress percent={item.rate} strokeColor="#6366F1" showInfo={false} size="small" />
                    </div>
                    <span style={{ fontSize: 12, color: '#10b981', width: 44 }}>{item.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ═══ 创建员工 Modal ═══ */}
      <Modal
        title={<span style={{ fontSize: 15, fontWeight: 700 }}>创建数字员工</span>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={680}
        destroyOnClose
      >
        <CreateWizard onClose={() => setCreateModalOpen(false)} />
      </Modal>

      {/* ═══ 版本管理 Drawer ═══ */}
      {selectedEmployee && (
        <VersionDrawer
          open={versionDrawerOpen}
          onClose={() => setVersionDrawerOpen(false)}
          employeeName={selectedEmployee.name}
        />
      )}

      {/* ═══ API 接入 Drawer ═══ */}
      <Drawer
        title={`API 接入 · ${selectedEmployee?.name || ''}`}
        open={apiDrawerOpen}
        onClose={() => setApiDrawerOpen(false)}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { mode: '前台嵌入',    icon: '🖥️', desc: '通过悬浮窗或内嵌模式部署到万卷前台', code: `<script src="https://cdn.wanjuan.ai/embed.js"\n  data-agent="${selectedEmployee?.id}"></script>` },
            { mode: '工作流绑定', icon: '⚡',  desc: '在万卷工作流中以节点形式调用',       code: `agent_id: ${selectedEmployee?.id}\ntype: digital_employee\ncall_mode: sync` },
            { mode: 'OpenClaw API', icon: '🔌', desc: '通过 REST API 直接调用，适合系统集成', code: `POST /v1/employees/${selectedEmployee?.id}/chat\nAuthorization: Bearer {YOUR_API_KEY}` },
            { mode: '批量任务',   icon: '📦', desc: '提交批量任务，异步处理大规模请求',    code: `POST /v1/employees/${selectedEmployee?.id}/batch\nContent-Type: application/json` },
          ].map(item => (
            <div key={item.mode} style={{ border: '1px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.mode}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <code style={{ flex: 1, fontSize: 11, color: '#555', fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {item.code}
                </code>
                <Button size="small" type="text" icon={<CopyOutlined />} style={{ color: '#6366F1', flexShrink: 0 }}
                  onClick={() => message.success('已复制')} />
              </div>
            </div>
          ))}
        </div>
      </Drawer>

    </div>
  );
};

export default DigitalEmployee;
