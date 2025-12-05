"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Artifact } from "@/components/artifacts";
import { useBrowser } from "@/components/layout/AppShell";
import { Code, ExternalLink } from "lucide-react";
import { broadcastPlannerDataChanged } from "@/lib/hooks/usePlannerData";
import { ArtifactHistoryDrawer, ArtifactHistoryButton } from "@/components/artifact-history-drawer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  artifact?: {
    type: string;
    data: unknown;
  };
}

const thinkingMessages = [
  "Thinking...",
  "Planning...",
  "Considering...",
  "Almost there...",
];

// Wobbly ring path variations for animation
const leftRingPaths = [
  "M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22",
  "M 4.5 22 C 4 13, 9 11.5, 14 12 C 20 12.5, 24.5 16, 24 22 C 23.5 29, 19 32.5, 14 32 C 8 31.5, 4.5 27, 4.5 22",
  "M 4 21.5 C 4.5 14, 8.5 12.5, 14 12.5 C 20.5 12, 24 15.5, 24 22.5 C 24 28.5, 20 31.5, 14 31.5 C 7.5 32, 3.5 28, 4 21.5",
  "M 4.2 22.2 C 3.8 14.5, 8 12, 14.2 12.2 C 20.5 11.8, 24.2 15.8, 23.8 22 C 24 29.2, 19.5 32, 13.8 31.8 C 7.8 32.2, 4 28.5, 4.2 22.2",
];

const rightRingPaths = [
  "M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22",
  "M 16.5 22 C 16 13, 21 11.5, 26 12 C 32 12.5, 36.5 16, 36 22 C 35.5 29, 31 32.5, 26 32 C 20 31.5, 16.5 27, 16.5 22",
  "M 16 21.5 C 16.5 14, 20.5 12.5, 26 12.5 C 32.5 12, 36 15.5, 36 22.5 C 36 28.5, 32 31.5, 26 31.5 C 19.5 32, 15.5 28, 16 21.5",
  "M 16.2 22.2 C 15.8 14.5, 20 12, 26.2 12.2 C 32.5 11.8, 36.2 15.8, 35.8 22 C 36 29.2, 31.5 32, 25.8 31.8 C 19.8 32.2, 16 28.5, 16.2 22.2",
];

// Breathing, wobbly thinking logo
function BreathingLogo({ size = 48 }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  const [breathePhase, setBreathePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 4), 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase(p => (p + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const breatheScale = 1 + 0.15 * Math.sin((breathePhase / 100) * Math.PI * 2);
  const wobbleRotate = Math.sin((breathePhase / 100) * Math.PI * 4) * 2;

  return (
    <div 
      style={{ 
        width: size, 
        height: size,
        transform: `scale(${breatheScale}) rotate(${wobbleRotate}deg)`,
      }}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d={leftRingPaths[frame]} stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={rightRingPaths[frame]} stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

// Typewriter hook for fast typing effect
function useTypewriter(text: string, isTyping: boolean, speed: number = 8) {
  const [displayedText, setDisplayedText] = useState(isTyping ? "" : text);
  const [isComplete, setIsComplete] = useState(!isTyping);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        const charsToAdd = Math.min(speed, text.length - index);
        setDisplayedText(text.slice(0, index + charsToAdd));
        index += charsToAdd;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, isTyping, speed]);

  return { displayedText, isComplete };
}

// Live Widget Preview Card - Shows in chat with "Open in Tab" button
function LiveWidgetCard({ 
  title, 
  code, 
  language = "jsx" 
}: { 
  title: string; 
  code: string; 
  language?: string;
}) {
  let browser: ReturnType<typeof useBrowser> | null = null;
  try {
    browser = useBrowser();
  } catch {
    // Not in browser context
  }

  const handleOpenInTab = () => {
    if (browser) {
      browser.createArtifactTab(title, code, language as "jsx" | "html" | "markdown");
    }
  };

  // Show first few lines of code as preview
  const codePreview = code.split('\n').slice(0, 5).join('\n');

  return (
    <div 
      className="mt-3 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1c1917 0%, #292524 100%)',
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.3), 0 4px 8px -2px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Code className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-stone-200">{title}</span>
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/50 text-emerald-400 font-mono">
            {language.toUpperCase()}
          </span>
        </div>
        {browser && (
          <button
            onClick={handleOpenInTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 2px 8px -2px rgba(16, 185, 129, 0.4)',
              color: 'white',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Widget
          </button>
        )}
      </div>

      {/* Code preview */}
      <div className="p-4 max-h-32 overflow-hidden relative">
        <pre className="text-xs text-emerald-300/70 font-mono whitespace-pre-wrap">
          {codePreview}
          {code.split('\n').length > 5 && '\n...'}
        </pre>
        <div 
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background: 'linear-gradient(to top, #292524 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}

// Message bubble component with depth and typewriter effect
function MessageBubble({ 
  content, 
  isUser, 
  isTyping = false,
  artifact,
  onTypewriterComplete
}: { 
  content: string; 
  isUser: boolean; 
  isTyping?: boolean;
  artifact?: { type: string; data: unknown };
  onTypewriterComplete?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { displayedText, isComplete } = useTypewriter(content, isTyping);

  useEffect(() => {
    if (isComplete && onTypewriterComplete) {
      onTypewriterComplete();
    }
  }, [isComplete, onTypewriterComplete]);

  // User bubble styles - dark with depth
  const userBubbleStyle = {
    background: 'linear-gradient(135deg, #4A4540 0%, #3D3833 100%)',
    boxShadow: isHovered 
      ? '0 8px 24px -4px rgba(61, 56, 51, 0.3), 0 4px 8px -2px rgba(61, 56, 51, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 4px 12px -2px rgba(61, 56, 51, 0.25), 0 2px 4px -1px rgba(61, 56, 51, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  };

  // Assistant bubble styles - light with depth
  const assistantBubbleStyle = {
    background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)',
    boxShadow: isHovered
      ? '0 8px 24px -4px rgba(61, 56, 51, 0.12), 0 4px 8px -2px rgba(61, 56, 51, 0.08), inset 0 -1px 0 rgba(61, 56, 51, 0.05)'
      : '0 4px 12px -2px rgba(61, 56, 51, 0.08), 0 2px 4px -1px rgba(61, 56, 51, 0.05), inset 0 -1px 0 rgba(61, 56, 51, 0.03)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
    border: '1px solid rgba(61, 56, 51, 0.08)',
  };
  
  return (
    <div>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-block max-w-[85%] px-4 py-3 relative group
          transition-all duration-300 ease-out
          ${isUser 
            ? "text-white rounded-2xl rounded-br-md" 
            : "text-ink rounded-2xl rounded-bl-md"
          }
        `}
        style={isUser ? userBubbleStyle : assistantBubbleStyle}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {!isComplete && <span className="inline-block w-0.5 h-4 bg-rose-400 ml-0.5 animate-pulse" />}
        </p>
        
        {/* Hover actions */}
        {isComplete && (
          <div className={`
            absolute -top-9 ${isUser ? "right-0" : "left-0"} 
            flex gap-1 
            transition-all duration-200
            ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"}
          `}>
            <button 
              onClick={() => navigator.clipboard.writeText(content)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-ink transition-all"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F6F3 100%)',
                boxShadow: '0 2px 8px -2px rgba(61, 56, 51, 0.15), 0 1px 2px rgba(61, 56, 51, 0.1)',
              }}
              title="Copy"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
            </button>
          </div>
        )}
      </div>
      {artifact && isComplete && (
        <div className="mt-3">
          {artifact.type === 'live_widget' ? (
            <LiveWidgetCard 
              title={(artifact.data as { title?: string })?.title || 'Widget'}
              code={(artifact.data as { code?: string })?.code || ''}
              language={(artifact.data as { language?: string })?.language || 'jsx'}
            />
          ) : (
            <Artifact type={artifact.type} data={artifact.data} />
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { status } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevMessageCountRef = useRef(0);

  // Extract artifacts from messages for the history drawer
  const artifactHistory = useMemo(() => {
    return messages
      .filter((m) => m.artifact && m.role === "assistant")
      .map((m, index) => ({
        id: m.id,
        type: m.artifact!.type,
        data: m.artifact!.data,
        timestamp: new Date(Date.now() - index * 60000), // Approximate timestamps
      }))
      .reverse(); // Most recent first
  }, [messages]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingMessage(prev => (prev + 1) % thinkingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > prevMessageCountRef.current || isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = currentCount;
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  useEffect(() => {
    if (status === "authenticated" && !hasLoaded) {
      loadConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadConversation = async () => {
    setHasLoaded(true);
    setIsLoading(true);
    try {
      const loadResponse = await fetch("/api/chat/load");
      const loadData = await loadResponse.json();
      
      if (loadData.conversationId && loadData.messages?.length > 0) {
        setConversationId(loadData.conversationId);
        setMessages(loadData.messages.map((m: { role: string; content: string; artifact?: { type: string; data: unknown } }, i: number) => ({
          id: `loaded-${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          artifact: m.artifact,
          isTyping: false,
        })));
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: null, conversationId: null }),
        });
        const data = await response.json();
        if (response.ok && data.message) {
          setConversationId(data.conversationId);
          setMessages([{
            id: Date.now().toString(),
            role: "assistant",
            content: data.message,
            artifact: data.artifact,
            isTyping: true,
          }]);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypewriterComplete = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isTyping: false } : m
    ));
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Broadcast to other tabs that planner data may have changed
      // This triggers automatic refresh in Budget, Guests, Vendors, etc.
      if (data.toolResults && data.toolResults.length > 0) {
        broadcastPlannerDataChanged();
      }

      const newMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: newMessageId,
        role: "assistant",
        content: data.message,
        artifact: data.artifact,
        isTyping: true,
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <BreathingLogo size={64} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Artifact History Button - Fixed in top right */}
      {artifactHistory.length > 0 && (
        <div className="fixed top-4 right-4 z-30">
          <ArtifactHistoryButton
            onClick={() => setIsHistoryDrawerOpen(true)}
            count={artifactHistory.length}
          />
        </div>
      )}

      {/* Artifact History Drawer */}
      <ArtifactHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        artifacts={artifactHistory}
      />

      {/* Subtle ambient glow */}
      <div className="fixed bottom-0 left-0 right-0 h-96 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute inset-0 animate-wave-slow"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(212,166,156,0.35) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div 
          className="absolute inset-0 animate-wave-medium"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 30% 100%, rgba(168,184,160,0.3) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
        />
        <div 
          className="absolute inset-0 animate-wave-fast"
          style={{
            background: 'radial-gradient(ellipse 60% 60% at 70% 100%, rgba(196,181,164,0.25) 0%, transparent 50%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-32 relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-6 md:pt-8">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, #FAF0EE 0%, #F5E1DD 100%)',
                  boxShadow: '0 8px 24px -4px rgba(212, 166, 156, 0.3), 0 4px 8px -2px rgba(212, 166, 156, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 drop-shadow-sm">
                  <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-ink mb-2">Let&apos;s plan your wedding</h2>
              <p className="text-ink-soft text-center max-w-md">
                I&apos;m here to help with everything from venues to vendors, 
                budgets to guest lists. What&apos;s on your mind?
              </p>
              
              {/* Suggestion chips with depth */}
              <div className="flex flex-wrap gap-3 mt-8 justify-center max-w-lg">
                {[
                  "Help me set a budget",
                  "Find venue ideas",
                  "Create a timeline",
                  "Guest list tips",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="px-5 py-2.5 rounded-full text-sm text-ink-soft
                      transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F6F3 100%)',
                      boxShadow: '0 4px 12px -2px rgba(61, 56, 51, 0.1), 0 2px 4px -1px rgba(61, 56, 51, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                      border: '1px solid rgba(61, 56, 51, 0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(212, 166, 156, 0.2), 0 4px 8px -2px rgba(212, 166, 156, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)';
                      e.currentTarget.style.borderColor = 'rgba(212, 166, 156, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(61, 56, 51, 0.1), 0 2px 4px -1px rgba(61, 56, 51, 0.06), inset 0 1px 0 rgba(255,255,255,0.8)';
                      e.currentTarget.style.borderColor = 'rgba(61, 56, 51, 0.06)';
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`${msg.role === "user" ? "flex justify-end" : ""}`}>
                <MessageBubble 
                  content={msg.content} 
                  isUser={msg.role === "user"} 
                  isTyping={msg.isTyping}
                  artifact={msg.artifact}
                  onTypewriterComplete={() => handleTypewriterComplete(msg.id)}
                />
              </div>
            ))}
          </div>
          
          {/* Thinking indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4 mt-3">
              <BreathingLogo size={32} />
              <div 
                className="px-4 py-2 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)',
                  boxShadow: '0 4px 12px -2px rgba(61, 56, 51, 0.08), 0 2px 4px -1px rgba(61, 56, 51, 0.05)',
                }}
              >
                <p className="text-sm text-ink-soft animate-pulse">
                  {thinkingMessages[thinkingMessage]}
                </p>
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mt-6">
              <div 
                className="px-4 py-3 rounded-2xl inline-block"
                style={{
                  background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                  boxShadow: '0 4px 12px -2px rgba(220, 38, 38, 0.15), 0 2px 4px -1px rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.1)',
                }}
              >
                <p className="text-sm text-red-700">Something went wrong: {error}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input bar with depth */}
      <div className="fixed bottom-0 inset-x-0 p-4 pb-6 z-20">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(248,246,243,1) 0%, rgba(248,246,243,0.95) 60%, rgba(248,246,243,0) 100%)',
          }}
        />
        <div className="max-w-3xl mx-auto relative">
          <div 
            className="relative rounded-full transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)',
              boxShadow: isFocused 
                ? '0 12px 32px -8px rgba(212, 166, 156, 0.25), 0 6px 12px -4px rgba(212, 166, 156, 0.15), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 3px rgba(212, 166, 156, 0.15)'
                : '0 8px 24px -4px rgba(61, 56, 51, 0.12), 0 4px 8px -2px rgba(61, 56, 51, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: isFocused ? '1px solid rgba(212, 166, 156, 0.3)' : '1px solid rgba(61, 56, 51, 0.06)',
            }}
          >
            {/* Left icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg viewBox="0 0 40 40" fill="none" className={`w-6 h-6 transition-transform duration-300 ${isFocused ? "scale-110" : ""}`}>
                <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="#D4A69C" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="#D4A69C" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask me anything about wedding planning..."
              className="w-full bg-transparent pl-14 pr-14 py-4
                resize-none outline-none
                text-ink placeholder:text-stone-400
                min-h-[56px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />

            {/* Send button with depth */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: input.trim() 
                  ? 'linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)'
                  : 'linear-gradient(135deg, #F2EFEA 0%, #E8E4DD 100%)',
                boxShadow: input.trim()
                  ? '0 4px 12px -2px rgba(196, 145, 138, 0.4), 0 2px 4px -1px rgba(196, 145, 138, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                  : '0 2px 8px -2px rgba(61, 56, 51, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                color: input.trim() ? 'white' : '#9C9691',
                transform: input.trim() ? 'scale(1)' : 'scale(0.95)',
              }}
              onMouseEnter={(e) => {
                if (input.trim()) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(196, 145, 138, 0.5), 0 4px 8px -2px rgba(196, 145, 138, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = input.trim() ? 'scale(1)' : 'scale(0.95)';
                if (input.trim()) {
                  e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(196, 145, 138, 0.4), 0 2px 4px -1px rgba(196, 145, 138, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)';
                }
              }}
            >
              <svg className="w-5 h-5 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-stone-400 mt-3 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
