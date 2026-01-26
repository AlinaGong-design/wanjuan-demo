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
  Empty
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SettingOutlined,
  RocketOutlined,
  FileTextOutlined,
  SaveOutlined,
  PlusOutlined,
  RightOutlined,
  QuestionCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './Agent.css';

const { TextArea } = Input;
const { Panel } = Collapse;

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
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              width: 'auto',
              maxWidth: '200px'
            }}
          />
          <Button type="text" icon={<EditOutlined />} size="small" />
        </div>

        <div className="header-right">
          <Space size="middle">
            <Button icon={<SettingOutlined />}>配置</Button>
            <Button icon={<RocketOutlined />}>发布</Button>
            <Button icon={<FileTextOutlined />}>评测</Button>
            <Button icon={<SaveOutlined />}>保存</Button>
            <Button type="primary" icon={<RocketOutlined />}>
              发布配置
            </Button>
          </Space>
        </div>
      </div>

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
                  >
                    <Select.Option value="chat-model">chat-model</Select.Option>
                    <Select.Option value="gpt-4">GPT-4</Select.Option>
                    <Select.Option value="gpt-3.5">GPT-3.5</Select.Option>
                  </Select>
                </div>
              </div>

              <div className="config-item">
                <div className="config-item-label">提示词</div>
                <div className="config-item-content">
                  <TextArea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="思考与回答逻辑"
                    autoSize={{ minRows: 8, maxRows: 15 }}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
            </Panel>
          </Collapse>

          <Divider style={{ margin: '20px 0' }} />

          {/* Skills配置 */}
          <div className="config-expandable-item">
            <div className="expandable-item-header">
              <span>Skills</span>
              <div className="expandable-item-actions">
                <PlusOutlined
                  style={{ fontSize: '14px', color: '#666', cursor: 'pointer' }}
                  onClick={() => setShowSkillDrawer(true)}
                />
              </div>
            </div>

            {/* 已选择的Skills列表 */}
            {selectedSkills.length > 0 && (
              <div className="selected-skills-container">
                {selectedSkills.map(skill => (
                  <Tag
                    key={skill.id}
                    closable
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

          {/* 知识库 */}
          <div
            className="config-expandable-item"
            onClick={() => setIsKnowledgeExpanded(!isKnowledgeExpanded)}
          >
            <div className="expandable-item-header">
              <span>知识库</span>
              <div className="expandable-item-actions">
                <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />
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
            onClick={() => setIsToolExpanded(!isToolExpanded)}
          >
            <div className="expandable-item-header">
              <span>工具调用</span>
              <div className="expandable-item-actions">
                <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />
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
                  onChange={setFileUploadEnabled}
                  size="small"
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* 交互体验 */}
          <div
            className="config-expandable-item"
            onClick={() => setIsInteractionExpanded(!isInteractionExpanded)}
          >
            <div className="expandable-item-header">
              <span>交互体验</span>
              <div className="expandable-item-actions">
                <PlusOutlined style={{ fontSize: '14px', color: '#666' }} />
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
    </div>
  );
};

export default Agent;
