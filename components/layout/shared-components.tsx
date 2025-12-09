"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getToolById, Tab, ScribeLogo } from "./browser-context";
import {
  X,
  Code,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";

// =============================================================================
// TOOL CONTENT RENDERER
// =============================================================================

export function ToolContent({ toolId }: { toolId: string }) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const loadComponent = async () => {
      try {
        let mod;
        switch (toolId) {
          case "dashboard":
            mod = await import("@/components/tools/DashboardTool");
            break;
          case "budget":
            mod = await import("@/components/tools/BudgetTool");
            break;
          case "calendar":
            mod = await import("@/components/tools/CalendarTool");
            break;
          case "guests":
            mod = await import("@/components/tools/GuestsTool");
            break;
          case "vendors":
            mod = await import("@/components/tools/VendorsTool");
            break;
          case "seating":
            mod = await import("@/components/tools/SeatingTool");
            break;
          case "timeline":
            mod = await import("@/components/tools/TimelineTool");
            break;
          case "checklist":
            mod = await import("@/components/tools/ChecklistTool");
            break;
          case "inspo":
            mod = await import("@/components/tools/InspoTool");
            break;
          case "settings":
            mod = await import("@/components/tools/SettingsTool");
            break;
        }
        if (mod?.default) {
          setComponent(() => mod.default);
        }
      } catch (err) {
        console.error("Failed to load component:", err);
      } finally {
        setLoading(false);
      }
    };
    loadComponent();
  }, [toolId]);

  const tool = getToolById(toolId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || "#D4A69C", animationDelay: "0ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || "#D4A69C", animationDelay: "150ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || "#D4A69C", animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  }

  if (!Component) {
    return <div className="p-8 text-center text-stone-500">Could not load content</div>;
  }

  return <Component />;
}

// =============================================================================
// LIVE ARTIFACT RUNNER - Executes React/JSX in sandboxed iframe
// =============================================================================

export function ArtifactRunner({
  code,
  title,
  language = "jsx",
}: {
  code: string;
  title: string;
  language?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  const createSandboxHtml = useCallback(
    (componentCode: string) => {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/recharts@2.10.3/umd/Recharts.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            rose: {
              50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
              400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
            },
            stone: {
              50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
              400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
              800: '#292524', 900: '#1c1917',
            },
          }
        }
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #fafaf9;
      min-height: 100vh;
    }
    .error-display {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
    }
    #root { min-height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const {
      LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
      XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
      AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
    } = Recharts;

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      render() {
        if (this.state.hasError) {
          return React.createElement('div', { className: 'error-display' },
            'Error: ' + (this.state.error?.message || 'Unknown error')
          );
        }
        return this.props.children;
      }
    }

    try {
      ${componentCode}

      const AppComponent = typeof App !== 'undefined' ? App :
                          typeof Widget !== 'undefined' ? Widget :
                          typeof Component !== 'undefined' ? Component :
                          typeof Default !== 'undefined' ? Default :
                          () => React.createElement('div', { className: 'text-stone-500' }, 'No component found');

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        React.createElement(ErrorBoundary, null,
          React.createElement(AppComponent)
        )
      );
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div class="error-display">Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    },
    [title]
  );

  const blobUrl = useMemo(() => {
    if (language === "html") {
      const blob = new Blob([code], { type: "text/html" });
      return URL.createObjectURL(blob);
    }
    const html = createSandboxHtml(code);
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [code, language, createSandboxHtml, key]);

  useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "error") {
        setError(event.data.message);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setError(null);
    setKey((k) => k + 1);
  };

  return (
    <div className={`h-full flex flex-col bg-stone-900 ${isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: "linear-gradient(180deg, #1c1917 0%, #292524 100%)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Code className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-stone-200">{title}</span>
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/50 text-emerald-400 font-mono">
            {language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-stone-700 transition-colors text-stone-400 hover:text-stone-200"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-stone-700 transition-colors text-stone-400 hover:text-stone-200"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-stone-700 transition-colors text-stone-400 hover:text-stone-200"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-800 flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-800 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Live preview iframe */}
      <div className="flex-1 bg-stone-50 overflow-hidden">
        <iframe
          ref={iframeRef}
          key={key}
          src={blobUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title={title}
        />
      </div>
    </div>
  );
}

// =============================================================================
// TAB ITEM (for desktop)
// =============================================================================

export function TabItem({
  tab,
  isActive,
  onSelect,
  onClose,
}: {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose?: () => void;
}) {
  const tool = tab.toolId ? getToolById(tab.toolId) : null;
  const Icon = tab.icon || tool?.icon || Code;

  return (
    <button
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg
        transition-all duration-200 relative min-w-[120px] max-w-[200px]
        ${
          isActive
            ? "bg-white text-stone-800 shadow-sm"
            : "bg-stone-100/50 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }
      `}
      style={{
        borderBottom: isActive ? "2px solid white" : "2px solid transparent",
        marginBottom: isActive ? "-2px" : "0",
      }}
    >
      <div
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={
          tool
            ? {
                background: tool.gradient,
                boxShadow: `0 2px 4px -1px ${tool.shadow}`,
              }
            : {
                background:
                  tab.type === "chat"
                    ? "linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)"
                    : "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              }
        }
      >
        {tab.type === "chat" ? (
          <ScribeLogo size={12} className="text-white" />
        ) : (
          <Icon className="w-3 h-3 text-white" />
        )}
      </div>

      <span className="truncate">{tab.title}</span>

      {tab.closable && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`
            ml-auto p-0.5 rounded transition-all
            ${
              isActive
                ? "opacity-60 hover:opacity-100 hover:bg-stone-200"
                : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-stone-200"
            }
          `}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}
