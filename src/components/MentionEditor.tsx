import React, { useCallback, useMemo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { createEditor, Descendant, Editor, Transforms, Range, Element as SlateElement, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import './MentionEditor.css';

// 自定义类型定义
type ParagraphElement = { type: 'paragraph'; children: CustomText[] };
type MentionElement = { type: 'mention'; character: string; agentId: string; agentIcon?: string; children: CustomText[] };
type CustomElement = ParagraphElement | MentionElement;
type CustomText = { text: string; bold?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface Agent {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface MentionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  agents?: Agent[];
  groups?: Agent[];  // 新增：群组列表
  onSelectAgent?: (agent: Agent) => void;
  style?: React.CSSProperties;
  minRows?: number;
  maxRows?: number;
}

// 暴露给父组件的方法
export interface MentionEditorHandle {
  openMentionPanel: (buttonRect?: DOMRect) => void;  // 接收按钮位置
  focus: () => void;
}

const MentionEditor = forwardRef<MentionEditorHandle, MentionEditorProps>(({
  value,
  onChange,
  placeholder = '输入消息...',
  agents = [],
  groups = [],
  onSelectAgent,
  style,
  minRows = 3,
  maxRows = 6,
}, ref) => {
  const portalRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Range | null>(null);
  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [manualTrigger, setManualTrigger] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<DOMRect | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'groups'>('agents');
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(() => withMentions(withReact(withHistory(createEditor()))), []);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    openMentionPanel: (buttonRect?: DOMRect) => {
      // 聚焦编辑器
      ReactEditor.focus(editor);

      // 获取当前选区
      const { selection } = editor;
      if (selection) {
        // 设置手动触发标记
        setManualTrigger(true);
        setButtonPosition(buttonRect || null);
        setTarget(selection);
        setSearch('');
        setIndex(0);
        setActiveTab('agents'); // 默认显示智能体
      }
    },
    focus: () => {
      ReactEditor.focus(editor);
    }
  }));

  // 初始化编辑器内容
  const [slateValue, setSlateValue] = useState<Descendant[]>(() => {
    if (value) {
      return [
        {
          type: 'paragraph',
          children: [{ text: value }],
        } as ParagraphElement,
      ];
    }
    return [
      {
        type: 'paragraph',
        children: [{ text: '' }],
      } as ParagraphElement,
    ];
  });

  // 过滤智能体和群组列表
  const currentList = activeTab === 'agents' ? agents : groups;
  const filteredItems = currentList
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (target && filteredItems.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setIndex((prevIndex) => (prevIndex >= filteredItems.length - 1 ? 0 : prevIndex + 1));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setIndex((prevIndex) => (prevIndex <= 0 ? filteredItems.length - 1 : prevIndex - 1));
            break;
          case 'Tab':
          case 'Enter':
            event.preventDefault();
            if (filteredItems[index]) {
              Transforms.select(editor, target);
              insertMention(editor, filteredItems[index], manualTrigger);
              if (onSelectAgent) {
                onSelectAgent(filteredItems[index]);
              }
              setTarget(null);
              setManualTrigger(false);
              setButtonPosition(null);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(null);
            setManualTrigger(false);
            setButtonPosition(null);
            break;
        }
      }
    },
    [index, target, filteredItems, editor, onSelectAgent, manualTrigger]
  );

  useEffect(() => {
    if (target && filteredItems.length > 0) {
      const el = portalRef.current;
      if (!el) return;

      if (buttonPosition) {
        // 手动触发：定位在按钮旁边
        const editorContainer = el.parentElement;
        if (editorContainer) {
          const containerRect = editorContainer.getBoundingClientRect();
          // 定位在按钮右侧或上方
          el.style.top = `${buttonPosition.top - containerRect.top - el.offsetHeight - 10}px`;
          el.style.left = `${buttonPosition.left - containerRect.left}px`;
        }
      } else {
        // 输入触发：定位在光标附近
        try {
          const domRange = ReactEditor.toDOMRange(editor, target);
          const rect = domRange.getBoundingClientRect();
          const editorContainer = el.parentElement;
          if (editorContainer) {
            const containerRect = editorContainer.getBoundingClientRect();
            // 定位在光标上方
            el.style.top = `${rect.top - containerRect.top - el.offsetHeight - 10}px`;
            el.style.left = `${rect.left - containerRect.left}px`;
          }
        } catch (error) {
          console.error('Error positioning mention panel:', error);
        }
      }
    }
  }, [filteredItems.length, editor, target, buttonPosition]);

  const handleChange = (newValue: Descendant[]) => {
    setSlateValue(newValue);

    // 提取纯文本内容
    const text = newValue
      .map((n) => (SlateElement.isElement(n) ? serializeNode(n) : ''))
      .join('\n');
    onChange(text);

    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/@(\w*)$/);
      const after = Editor.after(editor, start);
      const afterRange = Editor.range(editor, start, after);
      const afterText = Editor.string(editor, afterRange);
      const afterMatch = afterText.match(/^(\s|$)/);

      if (beforeMatch && afterMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        setIndex(0);
        return;
      }
    }

    setTarget(null);
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <Slate editor={editor} initialValue={slateValue} onChange={handleChange}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            minHeight: `${minRows * 1.5}em`,
            maxHeight: `${maxRows * 1.5}em`,
            overflowY: 'auto',
            padding: '4px 11px',
            fontSize: '14px',
            lineHeight: '1.5',
            outline: 'none',
          }}
        />
        {target && (agents.length > 0 || groups.length > 0) && (
          <div
            ref={portalRef}
            className="mention-portal"
            style={{
              position: 'absolute',
              zIndex: 1000,
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '280px',
              maxHeight: '400px',
              overflow: 'hidden',
            }}
          >
            {/* 标签页 */}
            {agents.length > 0 && groups.length > 0 && (
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #f0f0f0',
                padding: '8px 8px 0 8px',
              }}>
                <div
                  onClick={() => {
                    setActiveTab('agents');
                    setIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'agents' ? '2px solid #6366F1' : '2px solid transparent',
                    color: activeTab === 'agents' ? '#6366F1' : '#666',
                    fontWeight: activeTab === 'agents' ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  智能体
                </div>
                <div
                  onClick={() => {
                    setActiveTab('groups');
                    setIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderBottom: activeTab === 'groups' ? '2px solid #6366F1' : '2px solid transparent',
                    color: activeTab === 'groups' ? '#6366F1' : '#666',
                    fontWeight: activeTab === 'groups' ? 500 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  群组
                </div>
              </div>
            )}

            {/* 列表内容 */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '8px 0',
            }}>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      Transforms.select(editor, target);
                      insertMention(editor, item, manualTrigger);
                      if (onSelectAgent) {
                        onSelectAgent(item);
                      }
                      setTarget(null);
                      setManualTrigger(false);
                      setButtonPosition(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      background: i === index ? '#f5f5f5' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={() => setIndex(i)}
                  >
                    {item.icon && <span style={{ fontSize: '16px' }}>{item.icon}</span>}
                    <span>{item.name}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                  暂无{activeTab === 'agents' ? '智能体' : '群组'}
                </div>
              )}
            </div>
          </div>
        )}
      </Slate>
    </div>
  );
});

MentionEditor.displayName = 'MentionEditor';

// 序列化节点为文本
const serializeNode = (node: CustomElement | CustomText): string => {
  if ('text' in node) {
    return node.text;
  }
  if (node.type === 'mention') {
    return `@${node.character}`;
  }
  if (node.children) {
    return node.children.map((n) => serializeNode(n)).join('');
  }
  return '';
};

// 插入@提及
const insertMention = (editor: Editor, agent: Agent, isManualTrigger: boolean = false) => {
  const mention: MentionElement = {
    type: 'mention',
    character: agent.name,
    agentId: agent.id,
    agentIcon: agent.icon,
    children: [{ text: '' }],
  };

  // 如果不是手动触发（是输入@触发的），需要先删除 @ 符号
  if (!isManualTrigger) {
    // 删除输入的 @ 和搜索词
    Transforms.delete(editor, {
      distance: 1,
      unit: 'word',
      reverse: true,
    });
  }

  // 插入 mention 节点
  Transforms.insertNodes(editor, mention);
  // 移动光标到 mention 后面
  Transforms.move(editor);
  // 插入空格
  Transforms.insertText(editor, ' ');
};

// 自定义 withMentions 插件
const withMentions = (editor: Editor) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === 'mention' ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === 'mention' ? true : isVoid(element);
  };

  return editor;
};

// 渲染元素
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'mention':
      return <Mention {...attributes} element={element}>{children}</Mention>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Mention 组件
const Mention = ({ attributes, children, element }: any) => {
  const selected = false;
  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        padding: '2px 6px',
        margin: '0 2px',
        verticalAlign: 'baseline',
        display: 'inline-block',
        borderRadius: '4px',
        backgroundColor: selected ? '#B4D5FF' : '#E8F0FE',
        fontSize: '0.9em',
        color: '#1a73e8',
        cursor: 'pointer',
      }}
    >
      {element.agentIcon && <span style={{ marginRight: '2px' }}>{element.agentIcon}</span>}
      @{element.character}
      {children}
    </span>
  );
};

// Leaf 组件
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  return <span {...attributes}>{children}</span>;
};

export default MentionEditor;
