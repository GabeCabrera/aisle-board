"use client";

import { useEffect, useRef } from "react";
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

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        "w-full resize-none bg-transparent focus:outline-none text-sm leading-relaxed font-sans tracking-normal placeholder:text-stone-400 text-stone-800 disabled:opacity-50",
        className
      )}
      rows={1}
      spellCheck={true}
      autoComplete="off"
    />
  );
}