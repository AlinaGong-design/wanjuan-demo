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
  Card,
  message,
  Tooltip,
  Select
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './AgentList.css';

const { RangePicker } = DatePicker;

interface AgentData {
  key: string;
  id: number;
  name: string;
  description: string;
  creator: string;
  department: string;
  createTime: string;
  status: string[];
  type: 'autonomous' | 'collaborative'; // 自主规划 或 多智能体协同
  skillCount?: number; // 配置的技能数量
  skills?: string[]; // 配置的技能列表
}

interface AgentListProps {
  onCreateAgent?: (type: 'autonomous' | 'collaborative') => void;
  onEditAgent?: (agentId: string) => void;
  onDeleteAgent?: (agentId: string) => void;
  onPublishAgent?: (agentId: string) => void;
}

const AgentList: React.FC<AgentListProps> = ({
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
  onPublishAgent
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('mine');
  const [showTypeModal, setShowTypeModal] = useState(false);

  // 筛选条件
  const [skillFilter, setSkillFilter] = useState<string>('all'); // all | linked | unlinked
  const [typeFilter, setTypeFilter] = useState<string>('all'); // all | autonomous | collaborative

  // 模拟数据
  const [dataSource] = useState<AgentData[]>([
    {
      key: '1',
      id: 1,
      name: '竞品调研',
      description: '11',
      creator: '巩娜',
      department: '研发部门',
      createTime: '2026-01-25 01:45:38',
      status: ['商店', '共享', 'API', 'MCP'],
      type: 'autonomous',
      skillCount: 3,
      skills: ['网页搜索', '数据分析', 'PDF解析']
    },
    {
      key: '2',
      id: 2,
      name: '11',
      description: '11',
      creator: '巩娜',
      department: '研发部门',
      createTime: '2026-01-25 01:44:22',
      status: ['商店', '共享', 'API', 'MCP'],
      type: 'autonomous',
      skillCount: 2,
      skills: ['Python执行器', '文档分析']
    },
    {
      key: '3',
      id: 3,
      name: '石油化...',
      description: '石油化工异常处置小助手',
      creator: '巩娜',
      department: '研发部门',
      createTime: '2026-01-23 18:57:27',
      status: ['商店', '共享', 'API', 'MCP'],
      type: 'collaborative',
      skillCount: 5,
      skills: ['网页搜索', 'PDF解析', 'Python执行器', '数据分析', '知识库检索']
    },
    {
      key: '4',
      id: 4,
      name: '客服助手',
      description: '智能客服对话助手',
      creator: '张三',
      department: '客服部门',
      createTime: '2026-01-24 10:30:00',
      status: ['商店', '共享'],
      type: 'autonomous',
      skillCount: 0,
      skills: []
    },
    {
      key: '5',
      id: 5,
      name: '营销策划团队',
      description: '多智能体协作的营销策划方案生成',
      creator: '李四',
      department: '市场部门',
      createTime: '2026-01-22 14:20:15',
      status: ['商店', '共享', 'API'],
      type: 'collaborative',
      skillCount: 0,
      skills: []
    },
    {
      key: '6',
      id: 6,
      name: '代码审查助手',
      description: '自动代码审查和建议',
      creator: '王五',
      department: '研发部门',
      createTime: '2026-01-21 16:45:30',
      status: ['共享', 'API'],
      type: 'autonomous',
      skillCount: 4,
      skills: ['代码执行', '代码分析', 'Git操作', '文档生成']
    }
  ]);

  const columns: ColumnsType<AgentData> = [
    {
      title: '序号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
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
      title: '简介',
      dataIndex: 'description',
      key: 'description',
      width: 200
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      width: 300,
      render: (tags: string[], record: AgentData) => (
        <>
          {tags.map((tag) => {
            let color = tag === '商店' ? 'blue' : tag === '共享' ? 'green' : 'default';
            return (
              <Tag color={color} key={tag}>
                {tag}
              </Tag>
            );
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
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
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
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => onEditAgent?.(record.key)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => onPublishAgent?.(record.key)}
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除 "${record.name}" 吗？`,
                okText: '确定',
                cancelText: '取消',
                onOk: () => {
                  onDeleteAgent?.(record.key);
                  message.success('删除成功');
                }
              });
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const handleCreateClick = () => {
    setShowTypeModal(true);
  };

  const handleTypeSelect = (type: 'autonomous' | 'collaborative') => {
    setShowTypeModal(false);
    onCreateAgent?.(type);
  };

  // 筛选逻辑
  const filteredDataSource = dataSource.filter(agent => {
    // 名称搜索
    const matchesSearch = searchText === '' || agent.name.toLowerCase().includes(searchText.toLowerCase());

    // Skill关联筛选
    const matchesSkill =
      skillFilter === 'all' ||
      (skillFilter === 'linked' && agent.skillCount && agent.skillCount > 0) ||
      (skillFilter === 'unlinked' && (!agent.skillCount || agent.skillCount === 0));

    // 智能体类型筛选
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'autonomous' && agent.type === 'autonomous') ||
      (typeFilter === 'collaborative' && agent.type === 'collaborative');

    return matchesSearch && matchesSkill && matchesType;
  });

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText('');
    setSkillFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="agent-list-container">
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
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="autonomous">单智能体</Select.Option>
            <Select.Option value="collaborative">多智能体</Select.Option>
          </Select>
          <Select
            value={skillFilter}
            onChange={setSkillFilter}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部Skill</Select.Option>
            <Select.Option value="linked">已关联Skill</Select.Option>
            <Select.Option value="unlinked">未关联Skill</Select.Option>
          </Select>
          <RangePicker
            placeholder={['创建开始日期', '创建结束日期']}
            style={{ width: 280 }}
          />
          <Button icon={<SearchOutlined />} onClick={handleResetFilters}>重置</Button>
          <Button type="primary" icon={<SearchOutlined />}>
            查询
          </Button>
        </Space>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#666', fontSize: '14px' }}>
            共找到 {filteredDataSource.length} 个Agent
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateClick}
          >
            创建Agent
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredDataSource}
        pagination={{
          total: filteredDataSource.length,
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条记录`,
          showSizeChanger: true
        }}
      />

      {/* Agent类型选择弹窗 */}
      <Modal
        title="选择Agent类型"
        open={showTypeModal}
        onCancel={() => setShowTypeModal(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
            <Card
              hoverable
              style={{ width: 280, textAlign: 'center' }}
              onClick={() => handleTypeSelect('autonomous')}
            >
              <div style={{ padding: '30px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>🤖</div>
                <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>
                  自主规划Agent
                </h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                  单个智能体自主完成任务，具备规划、执行和反思能力，适合独立完成的任务场景。
                </p>
                <div style={{ marginTop: 20 }}>
                  <Tag color="blue">单智能体</Tag>
                  <Tag color="green">自主规划</Tag>
                  <Tag color="purple">独立执行</Tag>
                </div>
              </div>
            </Card>

            <Card
              hoverable
              style={{ width: 280, textAlign: 'center' }}
              onClick={() => handleTypeSelect('collaborative')}
            >
              <div style={{ padding: '30px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 20 }}>👥</div>
                <h3 style={{ fontSize: 18, marginBottom: 12, fontWeight: 600 }}>
                  多智能体协同Agent
                </h3>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                  多个智能体协同工作，通过调度智能体分配任务，适合复杂的多领域协作场景。
                </p>
                <div style={{ marginTop: 20 }}>
                  <Tag color="orange">多智能体</Tag>
                  <Tag color="cyan">任务协同</Tag>
                  <Tag color="magenta">分工合作</Tag>
                </div>
              </div>
            </Card>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default AgentList;
