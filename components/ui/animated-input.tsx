"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AnimatedInput({
  value,
  onChange,
  onKeyDown,
  placeholder = "Type a message...",
  className,
  disabled
}: AnimatedInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div 
      className={cn(
        "relative w-full min-h-[48px] cursor-text",
        className
      )}
      onClick={() => textareaRef.current?.focus()}
    >
      {/* The actual input (transparent) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-rose-400 focus:outline-none px-4 py-3 z-10 text-sm leading-relaxed font-serif tracking-wide selection:bg-rose-100 selection:text-transparent"
        rows={1}
        spellCheck={false}
        autoComplete="off"
      />

      {/* The animated display layer */}
      <div className="w-full h-full px-4 py-3 pointer-events-none whitespace-pre-wrap break-words text-sm leading-relaxed font-serif tracking-wide text-warm-800">
        {value.length === 0 && (
          <span className="text-warm-400 transition-opacity duration-200">
            {placeholder}
          </span>
        )}
        {value.split('').map((char, i) => (
          <span 
            key={i} 
            className="inline-block animate-in fade-in zoom-in-95 duration-100 origin-bottom"
            style={{ animationDelay: '0ms' }}
          >
            {char}
          </span>
        ))}
        {/* Blinking cursor block at the end */}
        {/* Note: The native caret is visible (caret-rose-400), but we can add a custom one if we hide native. */}
        {/* For now, we use native caret color on transparent text which works in modern browsers. */}
      </div>
    </div>
  );
}
