"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo, LogoIcon } from "@/components/logo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Thinking status messages that cycle through
const thinkingMessages = [
  "Reading your message...",
  "Thinking about your wedding...",
  "Considering the details...",
  "Crafting a response...",
  "Almost ready...",
];

// Claude-style low FPS thinking logo - jittery/hand-drawn feel
function ThinkingLogo({ size = 32 }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  
  // Low FPS animation - updates every 150ms for that choppy feel
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Subtle transforms for each frame - mimics hand-drawn wiggle
  const transforms = [
    { rotate: -2, scale: 1, x: 0, y: 0 },
    { rotate: 1, scale: 1.02, x: 1, y: -1 },
    { rotate: -1, scale: 0.98, x: -1, y: 0 },
    { rotate: 2, scale: 1.01, x: 0, y: 1 },
  ];

  const t = transforms[frame];

  return (
    <div 
      className="inline-block"
      style={{
        transform: `rotate(${t.rotate}deg) scale(${t.scale}) translate(${t.x}px, ${t.y}px)`,
        width: size,
        height: size,
      }}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle 
          cx="14" 
          cy="22" 
          r="10" 
          stroke="#78716c"
          strokeWidth="2.5"
          fill="none"
        />
        <circle 
          cx="26" 
          cy="22" 
          r="10" 
          stroke="#78716c"
          strokeWidth="2.5"
          fill="none"
        />
        <path 
          d="M20 8 C18.5 6, 16 7, 16 9.5 C16 12, 20 15, 20 15 C20 15, 24 12, 24 9.5 C24 7, 21.5 6, 20 8Z" 
          fill="#a8a29e"
        />
      </svg>
    </div>
  );
}

// Thinking Indicator Component
function ThinkingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-stone-200 max-w-[85%]">
      <div className="flex-shrink-0 mt-0.5">
        <ThinkingLogo size={28} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-stone-600">Aisle</p>
        <p className="text-stone-500 text-sm">
          {thinkingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    
    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId: null }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || "Request failed");
      }

      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      };
      setMessages(prev => [...prev, assistantMsg]);
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <ThinkingLogo size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm p-4">
        <Logo size="md" href="/" />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-16">
            <LogoIcon size="lg" className="mx-auto mb-4" />
            <p className="text-stone-500">
              Send a message to start planning your wedding
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-2xl max-w-[85%] ${
              msg.role === "user"
                ? "bg-stone-800 text-white ml-auto"
                : "bg-white border border-stone-200"
            }`}
          >
            <p className={`text-sm font-medium mb-1 ${
              msg.role === "user" ? "text-stone-400" : "text-stone-600"
            }`}>
              {msg.role === "user" ? "You" : "Aisle"}
            </p>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        
        {isLoading && <ThinkingIndicator />}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            <p className="font-medium">Oops!</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me about your wedding..."
            className="flex-1 border border-stone-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent bg-white"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-2 bg-stone-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
