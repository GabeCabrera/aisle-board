"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

/**
 * Aisle Landing Page
 * π-ID: 3.14159.4.5
 * 
 * A muted, warm chat interface with soft corners and subtle asymmetry.
 */

function AisleLogo({ className = "w-12 h-12" }: { className?: string }) {
  // Wobbly, hand-drawn circles - intentionally imperfect
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      {/* Left circle - wobbly path instead of perfect circle */}
      <path 
        d="M6 24c0.2-6.5 2.8-10.2 6.5-12.5 3.8-2.4 8.2-2.8 11.5-1.2 3.5 1.7 5.8 5.2 6.2 9.8 0.4 4.8-1.5 9.5-5 12.5-3.7 3.2-8.5 4-12.8 2.3C8 33.2 5.8 29.5 6 24z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        className="text-stone-400"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right circle - wobbly, slightly different wobble pattern */}
      <path 
        d="M42 24.5c-0.3 6.2-3 10-6.8 12.2-3.9 2.3-8.4 2.5-11.7 0.8-3.4-1.8-5.5-5.4-5.8-10-0.3-4.9 1.8-9.3 5.4-12.2 3.8-3 8.7-3.6 12.8-1.8 4.3 1.9 6.4 5.8 6.1 11z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none" 
        className="text-rose-400"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Intersection highlight - also wobbly */}
      <path 
        d="M24 13c2.2 2.8 3.5 6 3.3 10.2-0.2 4.5-2 8.5-4.8 11.3-2.3-3-3.4-6.5-3.2-10.8 0.2-4.2 2.1-7.8 4.7-10.7z" 
        fill="currentColor" 
        className="text-stone-200" 
        opacity="0.5"
      />
    </svg>
  );
}

export function LandingPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [coupleNames, setCoupleNames] = useState("");
  const [hasIntroduced, setHasIntroduced] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    if (!hasIntroduced) {
      setCoupleNames(userMessage);
      setTimeout(() => {
        const firstName = userMessage.split(/[&,]|and/i)[0]?.trim() || "Hey";
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: `${firstName}, nice to meet you both. I'm Aisle, and I'll be here whenever you need me.\n\nWhat's on your mind?`
          }
        ]);
        setHasIntroduced(true);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await fetch("/api/concierge/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          coupleNames 
        }),
      });

      const data = await response.json();

      if (data.requiresAuth) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'd love to keep helping. Create a free account to save our conversation and pick up where we left off.",
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again?" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const hasStarted = messages.length > 0;

  return (
    <main className="min-h-screen flex flex-col bg-canvas">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <AisleLogo className="w-9 h-9" />
          <span className="text-ink font-medium tracking-wide">Aisle</span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm text-ink-soft hover:text-ink transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm px-5 py-2.5 bg-ink text-ink-inverse rounded-full hover:bg-ink/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6">
        {!hasStarted ? (
          /* Empty State - centered, breathing */
          <div className="flex-1 flex flex-col items-center justify-center pb-32">
            <div className="animate-breathe">
              <AisleLogo className="w-20 h-20 mb-10" />
            </div>
            <h1 className="text-2xl text-ink text-center mb-3 font-light tracking-wide">
              Hi there. What are your names?
            </h1>
            <p className="text-ink-soft text-center text-sm">
              I'm Aisle. I'm here to help you plan your wedding.
            </p>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto py-10 space-y-8">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-9 h-9 mr-4 flex-shrink-0 mt-1">
                    <AisleLogo className="w-9 h-9" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-ink text-ink-inverse px-5 py-3.5 rounded-[20px_20px_6px_20px]"
                      : "text-ink"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="w-9 h-9 mr-4 flex-shrink-0">
                  <AisleLogo className="w-9 h-9" />
                </div>
                <div className="flex gap-1.5 py-3">
                  <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />

            {/* Sign up prompt */}
            {hasIntroduced && messages.length >= 6 && (
              <div className="text-center py-6">
                <p className="text-sm text-ink-soft mb-4">
                  Save this conversation and access your planning tools
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-ink-inverse text-sm rounded-full hover:bg-ink/90 transition-colors"
                >
                  Create free account
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="py-5">
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
              placeholder={!hasStarted ? "e.g. Sarah & Mike" : "Message..."}
              className="w-full resize-none pl-5 pr-14 py-4 bg-canvas-soft border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-sm text-ink placeholder:text-ink-faint max-h-32 shadow-soft"
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
        </div>
      </div>
    </main>
  );
}
