import React, { useState } from 'react';
import { Card, Button, Tag, Space, Tooltip, Row, Col, Input, Select, Modal, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  DeleteOutlined
} from '@ant-design/icons';

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'published' | 'draft' | 'offline';
  category: string; // 技能分类
  createTime: string;
  updateTime: string;
  agentCount?: number; // 关联的智能体数量
  agents?: string[]; // 关联的智能体名称列表
}

interface SkillProps {
  onPreviewSkill?: (skill: SkillItem) => void;
  onCreateSkill?: () => void;
  onEditSkill?: (skillId: string) => void;
}

const Skill: React.FC<SkillProps> = ({ onPreviewSkill, onCreateSkill, onEditSkill }) => {
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Mock数据
  const [skills, setSkills] = useState<SkillItem[]>([
    {
      id: '1',
      name: '写作助手',
      description: '帮助用户完成各类文章、报告、邮件等写作任务，支持多种文体和风格',
      icon: '✏️',
      status: 'published',
      category: '内容创作',
      createTime: '2024-01-15',
      updateTime: '2024-01-20',
      agentCount: 5,
      agents: ['文案写作助手', '翻译助手', 'Python编程助手', '数据分析师', 'JavaScript专家']
    },
    {
      id: '2',
      name: 'PPT制作',
      description: '根据用户需求自动生成PPT大纲和内容，支持多种主题模板',
      icon: '📊',
      status: 'published',
      category: '文档处理',
      createTime: '2024-01-10',
      updateTime: '2024-01-18',
      agentCount: 3,
      agents: ['文案写作助手', '设计助手', '数据分析师']
    },
    {
      id: '3',
      name: '视频脚本',
      description: '为短视频、Vlog等创作提供脚本策划和文案撰写服务',
      icon: '🎬',
      status: 'draft',
      category: '内容创作',
      createTime: '2024-01-12',
      updateTime: '2024-01-19',
      agentCount: 2,
      agents: ['文案写作助手', '翻译助手']
    },
    {
      id: '4',
      name: '设计助手',
      description: '提供设计建议、配色方案、排版指导等设计相关服务',
      icon: '🎨',
      status: 'published',
      category: '内容创作',
      createTime: '2024-01-08',
      updateTime: '2024-01-16',
      agentCount: 1,
      agents: ['设计助手']
    },
    {
      id: '5',
      name: '代码审查',
      description: '对代码进行质量检查、性能优化建议、安全漏洞检测',
      icon: '💻',
      status: 'offline',
      category: '代码执行',
      createTime: '2024-01-05',
      updateTime: '2024-01-14',
      agentCount: 0,
      agents: []
    },
    {
      id: '6',
      name: '数据分析',
      description: '帮助用户分析数据、生成报表、提供数据洞察',
      icon: '📈',
      status: 'published',
      category: '数据分析',
      createTime: '2024-01-03',
      updateTime: '2024-01-17',
      agentCount: 4,
      agents: ['数据分析师', 'SQL优化专家', 'Python编程助手', 'JavaScript专家']
    },
    {
      id: '7',
      name: '网页搜索',
      description: '搜索互联网上的实时信息，支持关键词搜索、新闻搜索等多种模式',
      icon: '🌐',
      status: 'published',
      category: '信息获取',
      createTime: '2024-01-20',
      updateTime: '2024-01-22',
      agentCount: 6,
      agents: ['互联网行业洞察', '石油行业知识问答小助手', 'Python编程助手', '数据分析师', 'JavaScript专家', '文案写作助手']
    },
    {
      id: '8',
      name: 'PDF解析',
      description: '解析PDF文档内容，提取文本、图片等信息',
      icon: '📄',
      status: 'draft',
      category: '文档处理',
      createTime: '2024-01-18',
      updateTime: '2024-01-21',
      agentCount: 2,
      agents: ['数据分析师', 'Python编程助手']
    },
    {
      id: '9',
      name: 'Python执行器',
      description: '安全地执行Python代码，支持数据处理、科学计算等任务',
      icon: '🐍',
      status: 'published',
      category: '代码执行',
      createTime: '2024-01-16',
      updateTime: '2024-01-19',
      agentCount: 3,
      agents: ['Python编程助手', '数据分析师', 'SQL优化专家']
    }
  ]);

  // 筛选逻辑
  const filteredSkills = skills.filter(skill => {
    // 名称搜索
    const matchesSearch = skill.name.toLowerCase().includes(searchText.toLowerCase());

    // 状态筛选
    const matchesStatus = statusFilter === 'all' || skill.status === statusFilter;

    // 分类筛选
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusTag = (status: string) => {
    const statusConfig = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      offline: { color: 'error', text: '已下架' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleEdit = (id: string) => {
    console.log('编辑技能:', id);
    if (onEditSkill) {
      onEditSkill(id);
    }
  };

  const handlePublish = (id: string) => {
    setSkills(skills.map(skill =>
      skill.id === id ? { ...skill, status: 'published' as const } : skill
    ));
    message.success('发布成功');
  };

  const handleOffline = (id: string) => {
    setSkills(skills.map(skill =>
      skill.id === id ? { ...skill, status: 'offline' as const } : skill
    ));
    message.success('下架成功');
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${name}" 吗？删除后无法恢复。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        setSkills(skills.filter(skill => skill.id !== id));
        message.success('删除成功');
      },
    });
  };

  const handlePreview = (skill: SkillItem) => {
    console.log('预览技能:', skill);
    if (onPreviewSkill) {
      onPreviewSkill(skill);
    }
  };

  const handleAddSkill = () => {
    console.log('新增技能');
    if (onCreateSkill) {
      onCreateSkill();
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>技能列表</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            管理您的Agent技能，包括创建、编辑、发布和下架
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddSkill}
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            border: 'none',
            borderRadius: '8px',
            height: '44px',
            padding: '0 24px',
            fontWeight: 500
          }}
        >
          新增技能
        </Button>
      </div>

      {/* 搜索和筛选区域 */}
      <div style={{ marginBottom: '24px' }}>
        <Space size="middle" style={{ marginBottom: 16 }}>
          <Input
            placeholder="请输入Skill名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="offline">已下架</Select.Option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部分类</Select.Option>
            <Select.Option value="信息获取">信息获取</Select.Option>
            <Select.Option value="文档处理">文档处理</Select.Option>
            <Select.Option value="代码执行">代码执行</Select.Option>
            <Select.Option value="数据分析">数据分析</Select.Option>
            <Select.Option value="内容创作">内容创作</Select.Option>
          </Select>
          <Button
            onClick={() => {
              setSearchText('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
          >
            重置
          </Button>
        </Space>
        <div style={{ color: '#666', fontSize: '14px' }}>
          共找到 {filteredSkills.length} 个Skill
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {filteredSkills.map((skill) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={skill.id}>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
                height: '100%',
                transition: 'all 0.3s'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* 图标和状态 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px'
                  }}>
                    {skill.icon}
                  </div>
                  {getStatusTag(skill.status)}
                </div>

                {/* 名称 */}
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#333'
                }}>
                  {skill.name}
                </h3>

                {/* 描述 */}
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.6',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {skill.description}
                </p>

                {/* 时间信息 */}
                <div style={{
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div>创建: {skill.createTime}</div>
                  <div>更新: {skill.updateTime}</div>
                  {skill.agentCount !== undefined && skill.agentCount > 0 && (
                    <Tooltip
                      title={
                        <div>
                          <div style={{ marginBottom: '4px', fontWeight: 500 }}>关联的智能体：</div>
                          {skill.agents?.map((agent, idx) => (
                            <div key={idx} style={{ padding: '2px 0' }}>• {agent}</div>
                          ))}
                        </div>
                      }
                      placement="top"
                    >
                      <div style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#F0F0FF',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E0E0FF';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F0F0FF';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <span style={{ fontSize: '12px', color: '#6366F1' }}>👥</span>
                        <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: 500 }}>
                          {skill.agentCount} 个智能体
                        </span>
                      </div>
                    </Tooltip>
                  )}
                </div>

                {/* 操作按钮 */}
                <Space size="small" style={{ width: '100%', justifyContent: 'center' }}>
                  <Tooltip title="预览">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(skill)}
                      style={{ color: '#6366F1' }}
                    />
                  </Tooltip>
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(skill.id)}
                      style={{ color: '#6366F1' }}
                    />
                  </Tooltip>
                  {skill.status === 'published' ? (
                    <Tooltip title="下架">
                      <Button
                        type="text"
                        icon={<CloudDownloadOutlined />}
                        onClick={() => handleOffline(skill.id)}
                        style={{ color: '#F59E0B' }}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="发布">
                      <Button
                        type="text"
                        icon={<CloudUploadOutlined />}
                        onClick={() => handlePublish(skill.id)}
                        style={{ color: '#10B981' }}
                      />
                    </Tooltip>
                  )}
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(skill.id, skill.name)}
                      style={{ color: '#EF4444' }}
                    />
                  </Tooltip>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 空状态提示 */}
      {filteredSkills.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fafafa',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {skills.length === 0 ? '📦' : '🔍'}
          </div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>
            {skills.length === 0 ? '暂无技能' : '未找到相关Skill'}
          </h3>
          <p style={{ color: '#999', marginBottom: '24px' }}>
            {skills.length === 0
              ? '点击右上角"新增技能"按钮创建您的第一个技能'
              : '尝试修改搜索关键词或筛选条件'}
          </p>
          {skills.length === 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddSkill}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              新增技能
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Skill;
