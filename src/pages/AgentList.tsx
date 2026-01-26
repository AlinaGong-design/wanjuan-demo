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
  message
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
      type: 'autonomous'
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
      type: 'autonomous'
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
      type: 'collaborative'
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
      width: 150
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
      width: 250,
      render: (tags: string[]) => (
        <>
          {tags.map((tag) => {
            let color = tag === '商店' ? 'blue' : tag === '共享' ? 'green' : 'default';
            return (
              <Tag color={color} key={tag}>
                {tag}
              </Tag>
            );
          })}
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
        <Space size="middle" style={{ marginBottom: 16, width: '100%' }}>
          <Input
            placeholder="请输入Agent名称"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <RangePicker
            placeholder={['创建开始日期', '创建结束日期']}
            style={{ width: 360 }}
          />
          <div style={{ flex: 1 }} />
          <Button icon={<SearchOutlined />}>重置</Button>
          <Button type="primary" icon={<SearchOutlined />}>
            查询
          </Button>
        </Space>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateClick}
          style={{ marginBottom: 16 }}
        >
          创建Agent
        </Button>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{
          total: 3,
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
