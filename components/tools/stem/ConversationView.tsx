"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  displayName: string;
  profileImage: string | null;
  slug: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderTenantId: string;
  content: string;
  readAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    displayName: string;
    profileImage: string | null;
  };
}

interface ConversationViewProps {
  conversationId: string;
  otherParticipant: Participant;
  initialMessages: Message[];
  currentTenantId: string;
}

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

export function ConversationView({
  conversationId,
  otherParticipant,
  initialMessages,
  currentTenantId,
}: ConversationViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setNewMessage("");

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderTenantId: currentTenantId,
      content,
      readAt: null,
      createdAt: new Date(),
      sender: {
        id: currentTenantId,
        displayName: "You",
        profileImage: null,
      },
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/social/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const sentMessage = await response.json();

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? sentMessage : m))
      );
    } catch (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(content);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const initials = otherParticipant.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-white/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/planner/stem/messages")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Link
          href={`/planner/stem/profile/${otherParticipant.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-serif text-primary border-2 border-white shadow-sm overflow-hidden relative shrink-0">
            {otherParticipant.profileImage ? (
              <Image
                src={otherParticipant.profileImage}
                alt={otherParticipant.displayName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              initials
            )}
          </div>
          <span className="font-medium text-foreground">
            {otherParticipant.displayName}
          </span>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-serif text-primary border-4 border-white shadow-lifted mb-4 overflow-hidden relative">
              {otherParticipant.profileImage ? (
                <Image
                  src={otherParticipant.profileImage}
                  alt={otherParticipant.displayName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                initials
              )}
            </div>
            <h3 className="font-serif text-xl text-foreground mb-1">
              {otherParticipant.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Start your conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwn = message.senderTenantId === currentTenantId;
              const showAvatar =
                !isOwn &&
                (index === 0 || messages[index - 1].senderTenantId !== message.senderTenantId);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-serif text-primary shrink-0 overflow-hidden relative">
                      {otherParticipant.profileImage ? (
                        <Image
                          src={otherParticipant.profileImage}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8" />}

                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {formatMessageDate(new Date(message.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="rounded-full shrink-0 shadow-soft"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
