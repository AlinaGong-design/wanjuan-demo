import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import Agent from './pages/Agent';
import Knowledge from './pages/Knowledge';
import Skill, { SkillItem } from './pages/Skill';
import SkillEditor from './pages/SkillEditor';
import Workflow from './pages/Workflow';
import MCP from './pages/MCP';
import API from './pages/API';
import Components from './pages/Components';
import Model from './pages/Model';
import Evaluation from './pages/Evaluation';
import System from './pages/System';
import Frontend from './pages/Frontend';
import './App.css';

type PageType =
  | 'home'
  | 'agent'
  | 'knowledge'
  | 'skill'
  | 'skill-editor'
  | 'workflow'
  | 'mcp'
  | 'api'
  | 'components'
  | 'model'
  | 'evaluation'
  | 'system'
  | 'frontend';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | undefined>(undefined);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // 监听 hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // 去掉 #
      if (hash) {
        const [path, params] = hash.split('?');

        // 解析路由
        if (path === 'frontend') {
          setCurrentPage('frontend');
        } else if (path === 'skill-editor') {
          const searchParams = new URLSearchParams(params);
          const mode = searchParams.get('mode') as 'create' | 'edit' || 'create';
          const skillId = searchParams.get('id') || undefined;

          setEditorMode(mode);
          setEditingSkillId(skillId);
          setCurrentPage('skill-editor');
        } else if (['home', 'agent', 'knowledge', 'skill', 'workflow', 'mcp', 'api', 'components', 'model', 'evaluation', 'system'].includes(path)) {
          setCurrentPage(path as PageType);
        }
      }
    };

    // 初始化
    handleHashChange();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePageChange = (key: string) => {
    window.location.hash = key;
  };

  const handleFrontendClick = () => {
    window.location.hash = 'frontend';
  };

  const handleBackToAdmin = () => {
    window.location.hash = 'home';
  };

  const handlePreviewSkill = (skill: SkillItem) => {
    setSelectedSkill(skill);
    window.location.hash = 'frontend';
  };

  const handleCreateSkill = () => {
    window.location.hash = 'skill-editor?mode=create';
  };

  const handleEditSkill = (skillId: string) => {
    window.location.hash = `skill-editor?mode=edit&id=${skillId}`;
  };

  const handleBackToSkillList = () => {
    window.location.hash = 'skill';
  };

  const handleTrySkill = (skillId: string, skillName: string, skillIcon: string) => {
    // 创建一个临时的SkillItem用于前台预览
    const tempSkill: SkillItem = {
      id: skillId,
      name: skillName,
      description: '正在体验的技能',
      icon: skillIcon,
      status: 'published',
      createTime: new Date().toISOString().split('T')[0],
      updateTime: new Date().toISOString().split('T')[0]
    };
    setSelectedSkill(tempSkill);
    window.location.hash = 'frontend';
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'agent':
        return <Agent />;
      case 'knowledge':
        return <Knowledge />;
      case 'skill':
        return (
          <Skill
            onPreviewSkill={handlePreviewSkill}
            onCreateSkill={handleCreateSkill}
            onEditSkill={handleEditSkill}
          />
        );
      case 'workflow':
        return <Workflow />;
      case 'mcp':
        return <MCP />;
      case 'api':
        return <API />;
      case 'components':
        return <Components />;
      case 'model':
        return <Model />;
      case 'evaluation':
        return <Evaluation />;
      case 'system':
        return <System />;
      case 'frontend':
        return <Frontend />;
      default:
        return <Home />;
    }
  };

  if (currentPage === 'frontend') {
    return <Frontend onBackToAdmin={handleBackToAdmin} selectedSkill={selectedSkill} />;
  }

  if (currentPage === 'skill-editor') {
    return (
      <div style={{ height: '100vh', background: '#fff' }}>
        <SkillEditor
          skillId={editingSkillId}
          mode={editorMode}
          onBack={handleBackToSkillList}
          onTrySkill={handleTrySkill}
        />
      </div>
    );
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onMenuClick={handlePageChange}
      onFrontendClick={handleFrontendClick}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
