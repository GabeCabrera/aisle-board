"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, RotateCcw, X, Minimize2, Crown, ClipboardList, MessageCircle, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatedInput } from "@/components/ui/animated-input";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { broadcastPlannerDataChanged } from "@/lib/hooks/usePlannerData";

// Custom event name for same-tab communication
export const PLANNER_DATA_CHANGED_EVENT = "planner-data-changed-event";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIAccess {
  hasAccess: boolean;
  hasFullAccess: boolean;
  messagesUsed: number;
  messagesRemaining: number | "unlimited";
  limit: number;
}

interface ScribeChatProps {
  isOpen: boolean;
  onClose: () => void;
  coupleNames?: string;
  aiName?: string;
  variant?: "overlay" | "full";
}

// The main chat component
export function ScribeChat({ isOpen, onClose, coupleNames, aiName = "Scribe", variant = "overlay" }: ScribeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [aiAccess, setAiAccess] = useState<AIAccess | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    if (!isOpen || hasLoaded) return;

    const controller = new AbortController();
    loadConversation(controller.signal);

    return () => controller.abort();
  }, [isOpen, hasLoaded]);

  // Handle open animation (only for overlay)
  useEffect(() => {
    if (isOpen && variant === "overlay") {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, variant]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !showUpgradePrompt) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, showUpgradePrompt]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const loadConversation = async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/scribe", { signal });
      if (res.ok) {
        const data = await res.json();
        const loadedMessages = (data.messages || []).map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));
        setMessages(loadedMessages);
        setAiAccess(data.aiAccess || null);
        setHasLoaded(true);

        if (data.aiAccess && !data.aiAccess.hasAccess) {
          setShowUpgradePrompt(true);
        }
      }
    } catch (error) {
      // Ignore abort errors (expected when component unmounts)
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Failed to load conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const tempUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const res = await fetch("/api/scribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, aiName }),
      });

      const data = await res.json();

      if (res.status === 403 && data.limitReached) {
        setShowUpgradePrompt(true);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (!res.ok) throw new Error("Failed to send message");

      // Check if planner data needs to be refreshed
      if (data.shouldRefreshPlannerData) {
        broadcastPlannerDataChanged();
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.aiAccess) {
        setAiAccess((prev) => prev ? { ...prev, ...data.aiAccess } : null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = async () => {
    if (!confirm("Start a new conversation? Your current chat will be saved.")) return;
    
    try {
      await fetch("/api/scribe", { method: "DELETE" });
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!isOpen) return null;

  // Minimized state (only for overlay)
  if (isMinimized && variant === "overlay") {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          onClick={handleRestore}
          className="flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
          aria-label="Open chat with Scribe"
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">Continue chatting</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }

  // Container classes based on variant
  const containerClasses = variant === "overlay"
    ? "fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none"
    : "h-full w-full flex flex-col bg-stone-50/50"; // Full mode background

  // Window classes based on variant
  const windowClasses = variant === "overlay"
    ? `relative w-full max-w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col pointer-events-auto transition-all duration-300 ease-out ${
        isAnimating ? "opacity-0 translate-y-4 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"
      }`
    : "flex-1 flex flex-col h-full max-w-5xl mx-auto w-full bg-white border-x border-stone-100 shadow-sm"; // Full mode: centered

  return (
    <div className={containerClasses}>
      {/* Chat Window */}
      <div className={windowClasses}>
        {/* Header */}
        <div className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 ${variant === "overlay" ? "rounded-t-2xl" : ""}`}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-sans font-medium text-sm text-stone-900 leading-tight">{aiName}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {aiAccess && !aiAccess.hasFullAccess && aiAccess.messagesRemaining !== "unlimited" && (
              <span className="text-xs text-stone-500 mr-3 bg-stone-100 px-2 py-1 rounded-full">
                {aiAccess.messagesRemaining} left
              </span>
            )}
            <button
              onClick={clearConversation}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
              title="Clear chat"
              aria-label="Clear chat history"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Only show Minimize/Close in overlay mode */}
            {variant === "overlay" && (
              <>
                <button
                  onClick={handleMinimize}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                  title="Minimize"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                  title="Close"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain bg-white"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <div className="p-4 md:p-8 space-y-8 min-h-full">
            {showUpgradePrompt ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-serif text-stone-900 mb-3">
                  Usage Limit Reached
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-8 max-w-[280px]">
                  Upgrade to Stem to get unlimited access to {aiName} and all premium planning tools.
                </p>
                <Link href="/choose-plan" onClick={onClose}>
                  <Button className="bg-stone-900 hover:bg-stone-800 text-white px-8 h-11 rounded-full shadow-lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Stem
                  </Button>
                </Link>
                <p className="text-xs text-stone-400 mt-6">
                  Monthly and annual plans available
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 max-w-xl mx-auto">
                <h3 className="text-2xl font-serif text-stone-900 mb-3">
                  Hello{coupleNames ? `, ${coupleNames.split("&")[0]?.trim()}` : ""}
                </h3>
                <p className="text-stone-500 text-base leading-relaxed mb-12">
                  I can help you find vendors, manage your budget, or just brainstorm ideas. What&apos;s on your mind?
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <button
                    onClick={() => setInput("Find me a photographer in Utah under $3k")}
                    className="text-left p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-100 group"
                  >
                    <Sparkles className="w-5 h-5 text-stone-400 mb-3 group-hover:text-rose-400 transition-colors" />
                    <span className="block text-sm font-medium text-stone-900 mb-1">Find Vendors</span>
                    <span className="block text-xs text-stone-500">Photographers, venues...</span>
                  </button>
                  <button
                    onClick={() => setInput("Review my budget breakdown")}
                    className="text-left p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-100 group"
                  >
                    <ClipboardList className="w-5 h-5 text-stone-400 mb-3 group-hover:text-blue-400 transition-colors" />
                    <span className="block text-sm font-medium text-stone-900 mb-1">Budget Check</span>
                    <span className="block text-xs text-stone-500">Am I on track?</span>
                  </button>
                  <button
                    onClick={() => setInput("I'm feeling overwhelmed with the guest list")}
                    className="text-left p-4 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-100 group"
                  >
                    <MessageCircle className="w-5 h-5 text-stone-400 mb-3 group-hover:text-purple-400 transition-colors" />
                    <span className="block text-sm font-medium text-stone-900 mb-1">Vent & Advice</span>
                    <span className="block text-xs text-stone-500">Get unstuck</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    
                    <div
                      className={`max-w-[85%] md:max-w-[75%] ${
                        msg.role === "user"
                          ? "bg-stone-100 text-stone-900 px-5 py-3 rounded-2xl rounded-br-sm"
                          : "text-stone-800 px-0 py-1"
                      }`}
                    >
                      <div className={`prose prose-stone prose-sm max-w-none ${
                          msg.role === "user" ? "prose-p:my-0" : ""
                        }`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Override paragraph to avoid double wrapping if needed, or style specific elements
                            p: ({node, ...props}) => <p className="leading-relaxed mb-3 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="my-3 list-disc list-outside pl-4" {...props} />,
                            ol: ({node, ...props}) => <ol className="my-3 list-decimal list-outside pl-4" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div
                    className="flex gap-4 justify-start animate-in fade-in duration-300"
                    role="status"
                    aria-busy="true"
                    aria-label="Scribe is typing"
                  >
                    <div className="flex items-center gap-1.5 h-8">
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} aria-hidden="true" />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} aria-hidden="true" />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} aria-hidden="true" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {!showUpgradePrompt && (
          <div className="flex-shrink-0 p-4 md:p-6 bg-white relative z-20">
            <div className="max-w-3xl mx-auto relative">
              <div className="relative shadow-lg rounded-2xl bg-white border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-stone-900/10 focus-within:border-stone-300 transition-all duration-200">
                <AnimatedInput
                  value={input}
                  onChange={setInput}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${aiName} anything...`}
                  disabled={isLoading}
                  className="w-full px-4 py-4 pr-14 bg-transparent border-none focus:ring-0 text-base max-h-[200px] min-h-[60px] resize-none placeholder:text-stone-400"
                />
                <div className="absolute bottom-3 right-3">
                  {isLoading ? (
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200"
                      disabled
                      aria-label="Processing message"
                    >
                      <StopCircle className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      size="icon"
                      className="h-8 w-8 rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:hover:bg-stone-900 transition-all"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-center text-[10px] text-stone-400 mt-3">
                Scribe can make mistakes. Verify important details with your vendors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating trigger button
export function ScribeTrigger({ onClick, aiName = "Scribe" }: { onClick: () => void; aiName?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 bg-stone-900 text-white rounded-full shadow-xl hover:scale-[1.02] transition-all duration-200 group"
    >
      <div className="relative">
        <Sparkles className="w-5 h-5" />
      </div>
      <span className="font-medium">Ask {aiName}</span>
    </button>
  );
}
