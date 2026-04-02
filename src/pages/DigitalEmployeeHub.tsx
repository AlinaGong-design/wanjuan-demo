import React, { useState, useEffect } from 'react';
import { DashboardOutlined, AppstoreOutlined, BlockOutlined, ArrowLeftOutlined, TeamOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import DigitalEmployeeWorkbench from './DigitalEmployeeWorkbench';
import DigitalEmployeeLibrary from './DigitalEmployeeLibrary';
import DigitalEmployeeDomain from './DigitalEmployeeDomain';
import AIAssistant from '../components/AIAssistant';

type TabKey = 'workbench' | 'library' | 'domain';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'workbench', label: '工作台',     icon: <DashboardOutlined />, desc: '数据大盘与日常管理' },
  { key: 'library',   label: '数字员工库', icon: <AppstoreOutlined />,  desc: '员工全生命周期管理' },
  { key: 'domain',    label: '业务域管理', icon: <BlockOutlined />,     desc: 'AI 组织架构治理' },
];

interface DigitalEmployeeHubProps {
  initialTab?: TabKey;
  onBackToAdmin?: () => void;
}

const DigitalEmployeeHub: React.FC<DigitalEmployeeHubProps> = ({ initialTab = 'workbench', onBackToAdmin }) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const syncTab = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'digital-employee-workbench') setActiveTab('workbench');
      else if (hash === 'digital-employee-library') setActiveTab('library');
      else if (hash === 'digital-employee-domain') setActiveTab('domain');
    };
    syncTab();
    window.addEventListener('hashchange', syncTab);
    return () => window.removeEventListener('hashchange', syncTab);
  }, []);

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
    const hashMap: Record<TabKey, string> = {
      workbench: 'digital-employee-workbench',
      library: 'digital-employee-library',
      domain: 'digital-employee-domain',
    };
    window.location.hash = hashMap[key];
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', flexDirection: 'column' }}>

      {/* ── 顶部导航栏 ── */}
      <div style={{
        height: 60,
        background: '#fff',
        borderBottom: '1px solid #e8e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        flexShrink: 0,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* 左侧：品牌 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 32, flexShrink: 0 }}>
          {onBackToAdmin && (
            <>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={onBackToAdmin}
                style={{ color: '#666', fontSize: 13, padding: '0 8px', height: 32 }}
              >
                返回
              </Button>
              <div style={{ width: 1, height: 18, background: '#e8e8e8' }} />
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TeamOutlined style={{ color: '#fff', fontSize: 15 }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>数字员工</div>
              <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.2 }}>企业 AI 员工团队管理中心</div>
            </div>
          </div>
        </div>

        {/* 中间：Tab 导航 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <div
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 18px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? '#6366F108' : 'transparent',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 14, color: active ? '#6366F1' : '#888' }}>{tab.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#6366F1' : '#555', lineHeight: 1.2 }}>{tab.label}</div>
                  <div style={{ fontSize: 10, color: active ? '#6366F180' : '#bbb', lineHeight: 1.2 }}>{tab.desc}</div>
                </div>
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 18,
                    right: 18,
                    height: 2,
                    background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    borderRadius: 2,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* 右侧：空，保持布局平衡 */}
        <div style={{ width: 1 }} />
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {activeTab === 'workbench' && <DigitalEmployeeWorkbench />}
        {activeTab === 'library'   && <DigitalEmployeeLibrary />}
        {activeTab === 'domain'    && <DigitalEmployeeDomain />}
      </div>

      {/* ── AI 管理助手（固定悬浮，须在 overflow 容器外渲染） ── */}
      <AIAssistant />
    </div>
  );
};

export default DigitalEmployeeHub;
