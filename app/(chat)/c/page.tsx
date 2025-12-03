"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Artifact } from "@/components/artifacts";

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

// Message avatar with hover effect
function Avatar({ isUser }: { isUser: boolean }) {
  if (isUser) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
      <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
        <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
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
        // Type multiple characters at once for speed
        const charsToAdd = Math.min(speed, text.length - index);
        setDisplayedText(text.slice(0, index + charsToAdd));
        index += charsToAdd;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [text, isTyping, speed]);

  return { displayedText, isComplete };
}

// Message bubble component with typewriter effect
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
  
  return (
    <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-block max-w-[85%] px-4 py-3 relative group
          transition-all duration-200
          ${isUser 
            ? "bg-ink text-white rounded-2xl rounded-br-sm hover:bg-ink/90" 
            : "bg-white border border-stone-200 text-ink rounded-2xl rounded-bl-sm hover:border-stone-300 hover:shadow-md"
          }
        `}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {displayedText}
          {!isComplete && <span className="inline-block w-0.5 h-4 bg-rose-400 ml-0.5 animate-pulse" />}
        </p>
        
        {/* Hover actions - only show when complete */}
        {isComplete && (
          <div className={`
            absolute -top-8 ${isUser ? "right-0" : "left-0"} 
            flex gap-1 
            transition-all duration-200
            ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"}
          `}>
            <button 
              onClick={() => navigator.clipboard.writeText(content)}
              className="p-1.5 rounded-md bg-white border border-stone-200 text-stone-500 hover:text-ink hover:border-stone-300 hover:shadow-sm transition-all"
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
          <Artifact type={artifact.type} data={artifact.data} />
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingMessage(prev => (prev + 1) % thinkingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
          isTyping: false, // Don't animate loaded messages
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
            isTyping: true, // Animate initial greeting
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

      const newMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: newMessageId,
        role: "assistant",
        content: data.message,
        artifact: data.artifact,
        isTyping: true, // Enable typewriter effect
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-canvas">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105">
                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                  <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-ink mb-2">Let&apos;s plan your wedding</h2>
              <p className="text-ink-soft text-center max-w-md">
                I&apos;m here to help with everything from venues to vendors, 
                budgets to guest lists. What&apos;s on your mind?
              </p>
              
              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
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
                    className="px-4 py-2 rounded-full border border-stone-200 text-sm text-ink-soft
                      hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50
                      transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
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
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <Avatar isUser={msg.role === "user"} />
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
          
          {/* Thinking indicator - left aligned */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4 mt-2">
              <BreathingLogo size={32} />
              <p className="text-sm text-ink-soft animate-pulse">
                {thinkingMessages[thinkingMessage]}
              </p>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="flex gap-3 mt-6">
              <Avatar isUser={false} />
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 transition-colors">
                <p className="text-sm text-red-700">Something went wrong: {error}</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input bar with proper centering */}
      <div className="p-4 pb-6 bg-canvas">
        <div className="max-w-3xl mx-auto">
          <div 
            className={`
              relative bg-white rounded-full
              border-2 transition-all duration-200 ease-out
              ${isFocused 
                ? "border-rose-300 shadow-lg" 
                : "border-transparent shadow-md hover:shadow-lg"
              }
            `}
          >
            {/* Left icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg viewBox="0 0 40 40" fill="none" className={`w-6 h-6 transition-transform duration-200 ${isFocused ? "scale-110" : ""}`}>
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

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className={`
                absolute right-3 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-full
                flex items-center justify-center
                transition-all duration-200
                ${input.trim() 
                  ? "bg-rose-500 text-white hover:bg-rose-600 hover:scale-110 active:scale-95" 
                  : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                }
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-stone-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
