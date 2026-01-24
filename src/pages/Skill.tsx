import React, { useState } from 'react';
import { Card, Button, Tag, Space, Tooltip, Row, Col } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'published' | 'draft' | 'offline';
  createTime: string;
  updateTime: string;
}

interface SkillProps {
  onPreviewSkill?: (skill: SkillItem) => void;
  onCreateSkill?: () => void;
  onEditSkill?: (skillId: string) => void;
}

const Skill: React.FC<SkillProps> = ({ onPreviewSkill, onCreateSkill, onEditSkill }) => {
  // Mock数据
  const [skills] = useState<SkillItem[]>([
    {
      id: '1',
      name: '写作助手',
      description: '帮助用户完成各类文章、报告、邮件等写作任务，支持多种文体和风格',
      icon: '✏️',
      status: 'published',
      createTime: '2024-01-15',
      updateTime: '2024-01-20'
    },
    {
      id: '2',
      name: 'PPT制作',
      description: '根据用户需求自动生成PPT大纲和内容，支持多种主题模板',
      icon: '📊',
      status: 'published',
      createTime: '2024-01-10',
      updateTime: '2024-01-18'
    },
    {
      id: '3',
      name: '视频脚本',
      description: '为短视频、Vlog等创作提供脚本策划和文案撰写服务',
      icon: '🎬',
      status: 'draft',
      createTime: '2024-01-12',
      updateTime: '2024-01-19'
    },
    {
      id: '4',
      name: '设计助手',
      description: '提供设计建议、配色方案、排版指导等设计相关服务',
      icon: '🎨',
      status: 'published',
      createTime: '2024-01-08',
      updateTime: '2024-01-16'
    },
    {
      id: '5',
      name: '代码审查',
      description: '对代码进行质量检查、性能优化建议、安全漏洞检测',
      icon: '💻',
      status: 'offline',
      createTime: '2024-01-05',
      updateTime: '2024-01-14'
    },
    {
      id: '6',
      name: '数据分析',
      description: '帮助用户分析数据、生成报表、提供数据洞察',
      icon: '📈',
      status: 'published',
      createTime: '2024-01-03',
      updateTime: '2024-01-17'
    }
  ]);

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
    console.log('发布技能:', id);
    // TODO: 实现发布功能
  };

  const handleOffline = (id: string) => {
    console.log('下架技能:', id);
    // TODO: 实现下架功能
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

      <Row gutter={[16, 16]}>
        {skills.map((skill) => (
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
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 空状态提示（当没有技能时显示） */}
      {skills.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fafafa',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ color: '#666', marginBottom: '8px' }}>暂无技能</h3>
          <p style={{ color: '#999', marginBottom: '24px' }}>点击右上角"新增技能"按钮创建您的第一个技能</p>
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
        </div>
      )}
    </div>
  );
};

export default Skill;
