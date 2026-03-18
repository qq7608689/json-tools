'use client';

import { useState, useCallback, useEffect } from 'react';
import JSON5 from 'json5';
import yaml from 'js-yaml';

type Tool = 'format' | 'validate' | 'compress' | 'escape' | 'unescape' | 'to-xml' | 'to-yaml' | 'to-csv' | 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode';

interface ToolInfo {
  id: Tool;
  name: string;
  icon: string;
  description: string;
}

const tools: ToolInfo[] = [
  { id: 'format', name: 'JSON格式化', icon: '🎨', description: '格式化美化JSON' },
  { id: 'validate', name: 'JSON校验', icon: '✓', description: '校验JSON语法' },
  { id: 'compress', name: 'JSON压缩', icon: '📦', description: '压缩JSON文件' },
  { id: 'escape', name: 'JSON转义', icon: '↗', description: '转义JSON字符串' },
  { id: 'unescape', name: 'JSON反转义', icon: '↙', description: '反转义JSON字符串' },
  { id: 'to-xml', name: 'JSON转XML', icon: '📄', description: '转换为XML格式' },
  { id: 'to-yaml', name: 'JSON转YAML', icon: '📋', description: '转换为YAML格式' },
  { id: 'to-csv', name: 'JSON转CSV', icon: '📊', description: '转换为CSV格式' },
  { id: 'base64-encode', name: 'Base64编码', icon: '🔐', description: 'Base64编码' },
  { id: 'base64-decode', name: 'Base64解码', icon: '🔓', description: 'Base64解码' },
  { id: 'url-encode', name: 'URL编码', icon: '🔗', description: 'URL编码' },
  { id: 'url-decode', name: 'URL解码', icon: '🔗', description: 'URL解码' },
];

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>('format');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

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
        case 'compress': {
          const parsed = JSON5.parse(text);
          return JSON.stringify(parsed);
        }
        case 'escape': {
          const parsed = JSON5.parse(text);
          return JSON.stringify(JSON.stringify(parsed));
        }
        case 'unescape': {
          const parsed = JSON5.parse(text);
          return JSON.parse(parsed);
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
      setError('');
      return;
    }
    setError('');
    try {
      const result = processJson(activeTool, input);
      setOutput(result);
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [activeTool, input, processJson]);

  // 监听输入变化自动执行
  useEffect(() => {
    const timer = setTimeout(() => {
      handleProcess();
    }, 300);
    return () => clearTimeout(timer);
  }, [input, activeTool, handleProcess]);

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
  };

  const handleSample = () => {
    const sample = {
      "name": "JSON工具",
      "version": "1.0.0",
      "features": ["格式化", "校验", "压缩", "转换"],
      "config": {
        "theme": "dark",
        "autoSave": true
      },
      "count": 42,
      "active": true
    };
    setInput(JSON.stringify(sample, null, 2));
  };

  const currentTool = tools.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="text-3xl">{}</span>
              JSON Tools
            </h1>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              在线JSON处理工具
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
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
                  }}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-sm">{tool.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Tool Title */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {currentTool?.icon} {currentTool?.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {currentTool?.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="tool-btn tool-btn-secondary disabled:opacity-50"
              >
                📋 复制结果
              </button>
              <button
                onClick={handleClear}
                className="tool-btn tool-btn-secondary"
              >
                🗑 清空
              </button>
              <button
                onClick={handleSample}
                className="tool-btn tool-btn-secondary"
              >
                📝 示例
              </button>
            </div>

            {/* Editor */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    输入
                  </label>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="请输入JSON内容..."
                    className="code-textarea w-full h-96 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Output */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    输出
                  </label>
                  <textarea
                    value={output}
                    readOnly
                    placeholder="处理结果..."
                    className="code-textarea w-full h-96 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 font-medium">❌ 错误</p>
                  <p className="text-red-500 dark:text-red-300 text-sm mt-1">{error}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          {notification}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
        Built with Next.js + Tailwind CSS
      </footer>
    </div>
  );
}