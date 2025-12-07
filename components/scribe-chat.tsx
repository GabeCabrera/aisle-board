"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, RotateCcw, X, Minimize2, Crown, ClipboardList, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
}

// The main chat component
export function ScribeChat({ isOpen, onClose, coupleNames, aiName = "Scribe" }: ScribeChatProps) {
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
    if (isOpen && !hasLoaded) {
      loadConversation();
    }
  }, [isOpen, hasLoaded]);

  // Handle open animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

  const loadConversation = async () => {
    try {
      const res = await fetch("/api/scribe");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setAiAccess(data.aiAccess || null);
        setHasLoaded(true);
        
        if (data.aiAccess && !data.aiAccess.hasAccess) {
          setShowUpgradePrompt(true);
        }
      }
    } catch (error) {
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

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          onClick={handleRestore}
          className="flex items-center gap-3 px-5 py-3 bg-warm-800 text-white rounded-full shadow-lg hover:bg-warm-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Continue chatting</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleMinimize}
      />
      
      {/* Chat Window */}
      <div 
        className={`relative w-full max-w-[420px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-warm-200/60 flex flex-col pointer-events-auto transition-all duration-300 ease-out ${
          isAnimating 
            ? "opacity-0 translate-y-4 scale-[0.98]" 
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-warm-100 bg-gradient-to-r from-warm-50 to-rose-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-warm-800 leading-tight">{aiName}</h2>
              <p className="text-xs text-warm-500">Your wedding planner</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {aiAccess && !aiAccess.hasFullAccess && aiAccess.messagesRemaining !== "unlimited" && (
              <span className="text-xs text-warm-400 mr-2 tabular-nums">
                {aiAccess.messagesRemaining} left
              </span>
            )}
            <button
              onClick={clearConversation}
              className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
              title="New conversation"
            >
              <RotateCcw className="w-4 h-4 text-warm-400" />
            </button>
            <button
              onClick={handleMinimize}
              className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-warm-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-warm-400" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 space-y-4 min-h-full">
            {showUpgradePrompt ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center mb-5">
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-serif text-warm-800 mb-2">
                  You've used your free messages
                </h3>
                <p className="text-warm-500 text-sm leading-relaxed mb-6 max-w-[280px]">
                                     Upgrade to Aisle to get unlimited access to {aiName},                  plus all premium planning templates.
                </p>
                <Link href="/choose-plan" onClick={onClose}>
                  <Button className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-8 h-11 rounded-xl shadow-sm">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Aisle
                  </Button>
                </Link>
                <p className="text-xs text-warm-400 mt-4">
                  One-time payment, no subscription
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2 py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-xl font-serif text-warm-800 mb-2">
                  Hey{coupleNames ? `, ${coupleNames.split("&")[0]?.trim()}` : ""}!
                </h3>
                <p className="text-warm-500 text-sm leading-relaxed max-w-[300px]">
                  I'm {aiName}, your wedding planner. I can help you discover your wedding vibe, 
                  answer planning questions, and find vendors that match your style.
                </p>
                {aiAccess && !aiAccess.hasFullAccess && (
                  <p className="text-xs text-warm-400 mt-3">
                    {aiAccess.messagesRemaining} free messages remaining
                  </p>
                )}
                <div className="mt-6 space-y-2.5 w-full">
                  <button
                    onClick={() => setInput("Help me figure out my wedding vibe")}
                    className="w-full text-left px-4 py-3 bg-warm-50 hover:bg-warm-100 rounded-xl text-sm text-warm-700 transition-colors flex items-center gap-3 border border-warm-100"
                  >
                    <Sparkles className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Help me figure out my wedding vibe</span>
                  </button>
                  <button
                    onClick={() => setInput("What should I be doing right now in my planning?")}
                    className="w-full text-left px-4 py-3 bg-warm-50 hover:bg-warm-100 rounded-xl text-sm text-warm-700 transition-colors flex items-center gap-3 border border-warm-100"
                  >
                    <ClipboardList className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>What should I be doing right now?</span>
                  </button>
                  <button
                    onClick={() => setInput("I'm feeling overwhelmed with planning")}
                    className="w-full text-left px-4 py-3 bg-warm-50 hover:bg-warm-100 rounded-xl text-sm text-warm-700 transition-colors flex items-center gap-3 border border-warm-100"
                  >
                    <MessageCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>I'm feeling overwhelmed</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-warm-800 text-white rounded-2xl rounded-br-lg"
                          : "bg-warm-100 text-warm-800 rounded-2xl rounded-bl-lg"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className="bg-warm-100 px-4 py-3 rounded-2xl rounded-bl-lg">
                      <div className="flex gap-1.5 items-center h-5">
                        <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {!showUpgradePrompt && (
          <div className="flex-shrink-0 p-4 border-t border-warm-100 bg-white rounded-b-2xl">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                                     placeholder={`Message ${aiName}...`}                  className="w-full resize-none px-4 py-3 bg-warm-50 border border-warm-200 rounded-2xl text-sm leading-relaxed placeholder:text-warm-400 transition-shadow duration-200 focus:outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                  rows={1}
                  disabled={isLoading}
                  style={{ minHeight: "48px" }}
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 p-0 bg-warm-800 hover:bg-warm-700 disabled:bg-warm-300 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </Button>
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
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-warm-800 to-warm-900 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group"
    >
      <div className="relative">
        <Sparkles className="w-5 h-5" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
      </div>
      <span className="font-medium">Ask {aiName}</span>
    </button>
  );
}
