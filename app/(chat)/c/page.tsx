"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Send, 
  Menu, 
  Plus, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronLeft,
  User
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Main Chat Interface - Claude-style
 * π-ID: 3.14159.5.1
 * 
 * Handles both onboarding (first-time) and regular chat flows.
 */

function AisleLogo({ className = "w-8 h-8" }: { className?: string }) {
  // Wobbly, hand-drawn circles - intentionally imperfect
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path 
        d="M6 24c0.2-6.5 2.8-10.2 6.5-12.5 3.8-2.4 8.2-2.8 11.5-1.2 3.5 1.7 5.8 5.2 6.2 9.8 0.4 4.8-1.5 9.5-5 12.5-3.7 3.2-8.5 4-12.8 2.3C8 33.2 5.8 29.5 6 24z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        className="text-stone-400"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path 
        d="M42 24.5c-0.3 6.2-3 10-6.8 12.2-3.9 2.3-8.4 2.5-11.7 0.8-3.4-1.8-5.5-5.4-5.8-10-0.3-4.9 1.8-9.3 5.4-12.2 3.8-3 8.7-3.6 12.8-1.8 4.3 1.9 6.4 5.8 6.1 11z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        className="text-rose-400"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path 
        d="M24 13c2.2 2.8 3.5 6 3.3 10.2-0.2 4.5-2 8.5-4.8 11.3-2.3-3-3.4-6.5-3.2-10.8 0.2-4.2 2.1-7.8 4.7-10.7z" 
        fill="currentColor" 
        className="text-stone-200" 
        opacity="0.5"
      />
    </svg>
  );
}

// Onboarding progress indicator
function OnboardingProgress({ step }: { step: number }) {
  const steps = [
    "Names",
    "Date", 
    "Guests",
    "Budget",
    "Vibe",
    "Progress",
    "Concerns",
  ];
  
  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < step 
                ? "bg-sage-500" 
                : i === step 
                  ? "bg-rose-400 scale-125" 
                  : "bg-stone-200"
            }`}
            title={label}
          />
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 mx-0.5 transition-colors ${
              i < step ? "bg-sage-300" : "bg-stone-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifact?: {
    type: string;
    title: string;
    data: unknown;
  };
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed during onboarding
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping, messages]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Initialize: fetch greeting from onboarding API
  const initializeChat = useCallback(async () => {
    if (initialized || status !== "authenticated") return;
    
    setIsTyping(true);
    setInitialized(true);
    
    try {
      const response = await fetch("/api/chat/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: null, conversationId: null }),
      });

      const data = await response.json();
      
      if (data.message) {
        setMessages([{ 
          id: Date.now().toString(), 
          role: "assistant", 
          content: data.message 
        }]);
        setConversationId(data.conversationId);
        setOnboardingStep(data.onboardingStep || 0);
        setIsOnboarding(!data.isOnboardingComplete);
        
        if (data.isOnboardingComplete) {
          setSidebarOpen(true);
        }
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages([{ 
        id: Date.now().toString(), 
        role: "assistant", 
        content: "Hi there! I'm Aisle, your wedding planner. Who's getting married?" 
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [initialized, status]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const messageId = Date.now().toString();
    
    setInput("");
    setMessages(prev => [...prev, { id: messageId, role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      // Use onboarding API if still onboarding, otherwise regular chat
      const endpoint = isOnboarding ? "/api/chat/onboarding" : "/api/chat";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          conversationId,
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: data.message,
        artifact: data.artifact,
      }]);
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      if (data.onboardingStep !== undefined) {
        setOnboardingStep(data.onboardingStep);
      }
      
      if (data.isOnboardingComplete) {
        setIsOnboarding(false);
        setSidebarOpen(true);
      }
    } catch {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: "Something went wrong. Try again?" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  if (status === "loading" || !initialized) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <AisleLogo className="w-12 h-12 animate-breathe" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar - hidden during onboarding */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-canvas-deep border-r border-stone-200 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AisleLogo className="w-7 h-7" />
            <span className="text-ink font-medium text-sm">Aisle</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink border border-stone-300 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-xs text-ink-faint uppercase tracking-wide mb-2 px-2">Recent</div>
          {conversations.length === 0 ? (
            <p className="text-xs text-ink-faint px-2">No conversations yet</p>
          ) : (
            <div className="space-y-1">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-ink-faint flex-shrink-0" />
                    <span className="text-sm text-ink truncate">{conv.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="p-3 border-t border-stone-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
              <User className="w-4 h-4 text-ink-soft" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink truncate">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <Link
              href="/settings"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-ink-soft hover:bg-stone-100 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-ink-soft hover:bg-stone-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <div className="flex items-center gap-3">
            {!sidebarOpen && !isOnboarding && (
              <>
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5 text-ink-soft" />
                </button>
                <button
                  onClick={handleNewChat}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-ink-soft" />
                </button>
              </>
            )}
            {isOnboarding && (
              <div className="flex items-center gap-2">
                <AisleLogo className="w-7 h-7" />
                <span className="text-ink font-medium text-sm">Getting to know you</span>
              </div>
            )}
          </div>
          
          {/* Onboarding progress */}
          {isOnboarding && (
            <OnboardingProgress step={onboardingStep} />
          )}
          
          <div className="w-20" /> {/* Spacer for centering */}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6">
            <div className="py-8 space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 mr-4 flex-shrink-0 mt-1">
                      <AisleLogo className="w-8 h-8" />
                    </div>
                  )}
                  <div className="max-w-[85%]">
                    <div
                      className={`${
                        message.role === "user"
                          ? "bg-ink text-ink-inverse px-5 py-3.5 rounded-[20px_20px_6px_20px]"
                          : "text-ink"
                      }`}
                    >
                      <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {/* Artifact rendering */}
                    {message.artifact && (
                      <div className="mt-4 p-4 bg-canvas-soft border border-stone-200 rounded-2xl">
                        <div className="text-xs text-ink-faint uppercase tracking-wide mb-2">
                          {message.artifact.title}
                        </div>
                        <pre className="text-xs text-ink-soft overflow-auto">
                          {JSON.stringify(message.artifact.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start">
                  <div className="w-8 h-8 mr-4 flex-shrink-0">
                    <AisleLogo className="w-8 h-8" />
                  </div>
                  <div className="flex gap-1.5 py-3">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-stone-200 bg-canvas">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isOnboarding ? "Type your answer..." : "Message Aisle..."}
                className="w-full resize-none pl-5 pr-14 py-4 bg-canvas-soft border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-[15px] text-ink placeholder:text-ink-faint max-h-40 shadow-soft"
                rows={1}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 bottom-3 h-9 w-9 flex items-center justify-center bg-ink hover:bg-ink/90 disabled:bg-stone-300 text-ink-inverse rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {!isOnboarding && (
              <p className="text-xs text-ink-faint text-center mt-3">
                Aisle can make mistakes. Double-check important details.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
