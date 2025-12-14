"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Plus, Search, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Participant {
  id: string;
  displayName: string;
  profileImage: string | null;
  slug: string;
}

interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
  lastMessagePreview?: string | null;
  otherParticipant: Participant;
  unreadCount: number;
}

interface MessagesListProps {
  conversations: Conversation[];
  currentTenantId: string;
}

export function MessagesList({ conversations, currentTenantId }: MessagesListProps) {
  const router = useRouter();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingConvo, setIsStartingConvo] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/social/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        // Filter out self
        setSearchResults(results.filter((u: Participant) => u.id !== currentTenantId));
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (otherTenantId: string) => {
    setIsStartingConvo(true);
    try {
      const response = await fetch("/api/social/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherTenantId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start conversation");
      }

      const convo = await response.json();
      setIsNewMessageOpen(false);
      router.push(`/planner/stem/messages/${convo.id}`);
    } catch (error) {
      toast.error("Failed to start conversation");
    } finally {
      setIsStartingConvo(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">
            Messages
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect with other couples
          </p>
        </div>

        <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for someone..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>

              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((user) => {
                    const initials = user.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <button
                        key={user.id}
                        onClick={() => startConversation(user.id)}
                        disabled={isStartingConvo}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-serif text-primary overflow-hidden relative shrink-0">
                          {user.profileImage ? (
                            <Image
                              src={user.profileImage}
                              alt={user.displayName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <span className="font-medium text-foreground">
                          {user.displayName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <p className="text-center text-muted-foreground py-8">
                  No users found
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Type to search for users
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conversation List */}
      {conversations.length === 0 ? (
        <Card className="text-center p-12 border-2 border-dashed border-border/50 bg-muted/5 shadow-none rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-serif text-2xl text-foreground mb-2">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Start a conversation with other couples to share ideas and get advice.
          </p>
          <Button
            onClick={() => setIsNewMessageOpen(true)}
            className="rounded-full px-6 shadow-soft"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start a Conversation
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((convo) => {
            const other = convo.otherParticipant;
            const initials = other.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link key={convo.id} href={`/planner/stem/messages/${convo.id}`}>
                <Card className="flex items-center gap-4 p-4 rounded-2xl border-border shadow-soft hover:shadow-medium transition-all cursor-pointer">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-serif text-primary border-2 border-white shadow-sm overflow-hidden relative shrink-0">
                    {other.profileImage ? (
                      <Image
                        src={other.profileImage}
                        alt={other.displayName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground truncate">
                        {other.displayName}
                      </p>
                      {convo.lastMessageAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(convo.lastMessageAt), {
                            addSuffix: false,
                          })}
                        </span>
                      )}
                    </div>
                    {convo.lastMessagePreview && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {convo.lastMessagePreview}
                      </p>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {convo.unreadCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium shrink-0">
                      {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
