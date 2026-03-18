'use client';

import { useState, useCallback, useEffect } from 'react';
import JSON5 from 'json5';
import yaml from 'js-yaml';

type Tool = 'format' | 'validate' | 'to-xml' | 'to-yaml' | 'to-csv' | 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode';

interface ToolInfo {
  id: Tool;
  name: string;
  icon: string;
  description: string;
}

const tools: ToolInfo[] = [
  { id: 'format', name: 'JSON处理', icon: '🎨', description: '格式化、压缩、转义、反转义' },
  { id: 'validate', name: 'JSON校验', icon: '✓', description: '校验JSON语法' },
  { id: 'to-xml', name: 'JSON转XML', icon: '📄', description: '转换为XML格式' },
  { id: 'to-yaml', name: 'JSON转YAML', icon: '📋', description: '转换为YAML格式' },
  { id: 'to-csv', name: 'JSON转CSV', icon: '📊', description: '转换为CSV格式' },
  { id: 'base64-encode', name: 'Base64编码', icon: '🔐', description: 'Base64编码' },
  { id: 'base64-decode', name: 'Base64解码', icon: '🔓', description: 'Base64解码' },
  { id: 'url-encode', name: 'URL编码', icon: '🔗', description: 'URL编码' },
  { id: 'url-decode', name: 'URL解码', icon: '🔗', description: 'URL解码' },
];

// 可折叠的 JSON 树形节点
function JsonNode({ 
  name, 
  value, 
  depth = 0,
  defaultCollapsed = false 
}: { 
  name?: string | number; 
  value: any; 
  depth?: number;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isEmpty = isObject && Object.keys(value).length === 0;
  
  const getValueType = () => {
    if (value === null) return 'null';
    if (isArray) return 'array';
    return typeof value;
  };
  
  const getValueColor = () => {
    switch (getValueType()) {
      case 'string': return 'json-string';
      case 'number': return 'json-number';
      case 'boolean': return 'json-boolean';
      case 'null': return 'json-null';
      default: return '';
    }
  };
  
  const getValueDisplay = () => {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };
  
  const itemCount = isObject ? (isArray ? value.length : Object.keys(value).length) : 0;
  const toggleText = collapsed ? `▶ (${itemCount})` : '▼';
  
  const shouldDefaultCollapse = depth >= 3;
  const nameStr = name !== undefined ? String(name) : undefined;
  
  if (!isObject || isEmpty) {
    return (
      <div className="json-line" style={{ paddingLeft: `${depth * 20}px` }}>
        {nameStr !== undefined && <span className="json-key">"{nameStr}": </span>}
        <span className={getValueColor()}>{getValueDisplay()}</span>
      </div>
    );
  }
  
  return (
    <div className="json-node">
      <div 
        className="json-line json-foldable" 
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {nameStr !== undefined && <span className="json-key">"{nameStr}": </span>}
        <span className="json-bracket">{isArray ? '[' : '{'}</span>
        {!collapsed && (
          <span className="json-toggle text-slate-400 cursor-pointer ml-1" onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}>
            {toggleText}
          </span>
        )}
        {collapsed && (
          <span className="json-collapsed text-slate-400 cursor-pointer ml-1">
            {isArray ? `Array(${itemCount})` : `{...} (${itemCount})`}
          </span>
        )}
      </div>
      {!collapsed && (
        <>
          {isArray 
            ? value.map((item: any, i: number) => (
                <JsonNode key={i} name={i} value={item} depth={depth + 1} defaultCollapsed={shouldDefaultCollapse} />
              ))
            : Object.entries(value).map(([key, val]: [string, any]) => (
                <JsonNode key={key} name={key} value={val} depth={depth + 1} defaultCollapsed={shouldDefaultCollapse} />
              ))
          }
          <div className="json-line" style={{ paddingLeft: `${depth * 20}px` }}>
            <span className="json-bracket">{isArray ? ']' : '}'}</span>
          </div>
        </>
      )}
    </div>
  );
}

// JSON处理结果的各个面板
interface JsonFormatResults {
  formatted: string;
  compressed: string;
  escaped: string;
  unescaped: string;
}

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>('format');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'text'>('tree');
  const [parsedOutput, setParsedOutput] = useState<any>(null);
  const [formatResults, setFormatResults] = useState<JsonFormatResults | null>(null);
  const [activeFormatTab, setActiveFormatTab] = useState<keyof JsonFormatResults>('formatted');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const processJson = useCallback((tool: Tool, text: string): string => {
    if (!text.trim()) return '';
    
    try {
      switch (tool) {
        case 'format': {
          const parsed = JSON5.parse(text);
          return JSON.stringify(parsed, null, 2);
        }
        case 'validate': {
          JSON5.parse(text);
          return '✓ JSON格式正确，无语法错误';
        }
        case 'to-xml': {
          const parsed = JSON5.parse(text);
          const convert = (obj: any, root = true): string => {
            if (Array.isArray(obj)) {
              return obj.map((item, i) => convert(item, false)).join('\n');
            }
            if (typeof obj === 'object' && obj !== null) {
              const children = Object.entries(obj)
                .map(([key, val]) => convert(val, false).replace(/^/, `  <${key}>`).replace(/(\n|$)/, `</${key}>$1`))
                .join('\n');
              return root ? `<root>\n${children}\n</root>` : children;
            }
            return String(obj);
          };
          return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(parsed)}`;
        }
        case 'to-yaml': {
          const parsed = JSON5.parse(text);
          return yaml.dump(parsed, { indent: 2 });
        }
        case 'to-csv': {
          const parsed = JSON5.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const headers = Object.keys(parsed[0]);
            const rows = parsed.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
            return [headers.join(','), ...rows].join('\n');
          }
          if (typeof parsed === 'object' && parsed !== null) {
            const headers = Object.keys(parsed);
            const values = headers.map(h => JSON.stringify(parsed[h] ?? '')).join(',');
            return [headers.join(','), values].join('\n');
          }
          return '无法转换为CSV';
        }
        case 'base64-encode': {
          return btoa(unescape(encodeURIComponent(text)));
        }
        case 'base64-decode': {
          return decodeURIComponent(escape(atob(text)));
        }
        case 'url-encode': {
          return encodeURIComponent(text);
        }
        case 'url-decode': {
          return decodeURIComponent(text);
        }
        default:
          return '';
      }
    } catch (e: any) {
      throw new Error(e.message || '处理失败');
    }
  }, []);

  // 自动处理输入
  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setParsedOutput(null);
      setFormatResults(null);
      setError('');
      return;
    }
    setError('');
    
    try {
      // JSON处理面板 - 同时计算所有格式
      if (activeTool === 'format') {
        try {
          const parsed = JSON5.parse(input);
          const formatted = JSON.stringify(parsed, null, 2);
          const compressed = JSON.stringify(parsed);
          const escaped = JSON.stringify(JSON.stringify(parsed));
          const unescaped = JSON.parse(parsed);
          
          setFormatResults({
            formatted,
            compressed,
            escaped,
            unescaped: typeof unescaped === 'string' ? unescaped : JSON.stringify(unescaped)
          });
          setOutput(formatted);
          
          try {
            const parsedResult = JSON5.parse(formatted);
            setParsedOutput(parsedResult);
          } catch {
            setParsedOutput(null);
          }
        } catch (e: any) {
          setFormatResults(null);
          setOutput('');
          setParsedOutput(null);
          setError(e.message);
        }
        return;
      }
      
      const result = processJson(activeTool, input);
      setOutput(result);
      setFormatResults(null);
      
      // 尝试解析为 JSON 对象用于树形视图
      if (activeTool === 'validate') {
        try {
          const parsed = JSON5.parse(input);
          setParsedOutput(parsed);
        } catch {
          setParsedOutput(null);
        }
      } else {
        setParsedOutput(null);
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
      setParsedOutput(null);
      setFormatResults(null);
    }
  }, [activeTool, input, processJson]);

  // 监听输入变化自动执行
  useEffect(() => {
    const timer = setTimeout(() => {
      handleProcess();
    }, 300);
    return () => clearTimeout(timer);
  }, [input, activeTool, handleProcess]);

  // 切换format tab时更新output
  useEffect(() => {
    if (formatResults && activeTool === 'format') {
      setOutput(formatResults[activeFormatTab]);
      try {
        const parsed = JSON5.parse(formatResults[activeFormatTab]);
        setParsedOutput(parsed);
      } catch {
        setParsedOutput(null);
      }
    }
  }, [activeFormatTab, formatResults]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      showNotification('已复制到剪贴板！');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setParsedOutput(null);
    setFormatResults(null);
  };

  const handleSample = () => {
    const sample = {
      "name": "JSON工具",
      "version": "1.0.0",
      "features": ["格式化", "校验", "压缩", "转换"],
      "config": {
        "theme": "dark",
        "autoSave": true,
        "plugins": ["json", "xml", "yaml"]
      },
      "count": 42,
      "active": true
    };
    setInput(JSON.stringify(sample, null, 2));
  };

  const currentTool = tools.find(t => t.id === activeTool);

  const formatTabs: { key: keyof JsonFormatResults; label: string; icon: string }[] = [
    { key: 'formatted', label: '格式化', icon: '🎨' },
    { key: 'compressed', label: '压缩', icon: '📦' },
    { key: 'escaped', label: '转义', icon: '↗' },
    { key: 'unescaped', label: '反转义', icon: '↙' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="max-w-full mx-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="text-2xl">{}</span>
              JSON Tools
            </h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              在线JSON处理工具
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
        {/* Sidebar */}
        <aside className="w-44 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 h-full overflow-y-auto">
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              工具列表
            </h2>
            <div className="space-y-1">
              {tools.map(tool => (
                <div
                  key={tool.id}
                  className={`sidebar-item ${activeTool === tool.id ? 'active' : 'text-slate-700 dark:text-slate-300'}`}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setError('');
                    setActiveFormatTab('formatted');
                  }}
                >
                  <span className="text-base">{tool.icon}</span>
                  <span className="text-xs">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Tool Title & Actions */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {currentTool?.icon} {currentTool?.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentTool?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!output}
                    className="tool-btn tool-btn-secondary disabled:opacity-50 text-xs"
                  >
                    📋 复制
                  </button>
                  <button
                    onClick={handleClear}
                    className="tool-btn tool-btn-secondary text-xs"
                  >
                    🗑 清空
                  </button>
                  <button
                    onClick={handleSample}
                    className="tool-btn tool-btn-secondary text-xs"
                  >
                    📝 示例
                  </button>
                </div>
              </div>
            </div>

            {/* Format Tabs - 只在format工具时显示 */}
            {activeTool === 'format' && formatResults && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
                {formatTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFormatTab(tab.key)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      activeFormatTab === tab.key 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 flex gap-4 p-4 min-h-0">
              {/* Input */}
              <div className="flex-1 flex flex-col min-w-0">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex-shrink-0">
                  输入
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入JSON内容..."
                  className="code-textarea flex-1 w-full p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Output */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    输出
                  </label>
                  {/* 视图切换 - 仅格式化工具且是有效JSON时显示 */}
                  {parsedOutput && activeTool === 'format' && (
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('tree')}
                        className={`px-2 py-0.5 text-xs rounded-md transition-colors ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        🌳 树形
                      </button>
                      <button
                        onClick={() => setViewMode('text')}
                        className={`px-2 py-0.5 text-xs rounded-md transition-colors ${viewMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        📝 文本
                      </button>
                    </div>
                  )}
                </div>
                
                {viewMode === 'tree' && parsedOutput && activeTool === 'format' ? (
                  <div className="flex-1 overflow-auto rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-4">
                    <JsonNode value={parsedOutput} defaultCollapsed={false} />
                  </div>
                ) : (
                  <textarea
                    value={output}
                    readOnly
                    placeholder="处理结果..."
                    className="code-textarea flex-1 w-full p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none"
                  />
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
                <p className="text-red-600 dark:text-red-400 font-medium text-sm">❌ 错误</p>
                <p className="text-red-500 dark:text-red-300 text-xs mt-1">{error}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          {notification}
        </div>
      )}
    </div>
  );
}