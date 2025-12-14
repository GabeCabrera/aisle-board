"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Globe,
  Lock,
  Loader2,
  Calendar,
  Share2,
  Instagram,
  Settings,
} from "lucide-react";
import type { Board } from "@/lib/db/schema";
import { IdeaList } from "./IdeaList";

interface ProfileData {
  id: string;
  displayName: string;
  weddingDate: Date | null;
  slug: string;
  bio: string | null;
  socialLinks: {
    instagram?: string;
    website?: string;
    tiktok?: string;
  } | null;
  profileImage?: string | null;
  stats: {
    followersCount: number;
    followingCount: number;
  };
}

interface ProfileWithBoardsProps {
  profile: ProfileData;
  initialBoards: Board[];
}

export function ProfileWithBoards({ profile, initialBoards }: ProfileWithBoardsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [myBoards, setMyBoards] = useState<Board[]>(initialBoards);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);
  const [openNewBoardDialog, setOpenNewBoardDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    setMyBoards(initialBoards);
  }, [initialBoards]);

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/planner/stem/profile/${profile.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName}'s Wedding Portfolio`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fetchMyBoards = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setMyBoards(data);
      }
    } catch (error) {
      console.error("Failed to fetch boards", error);
      toast.error("Failed to refresh boards.");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardChange = (index: number) => {
    setActiveBoardIndex(index);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName }),
      });
      if (response.ok) {
        toast.success("Board created!");
        await fetchMyBoards();
        setNewBoardName("");
        setOpenNewBoardDialog(false);
        setActiveBoardIndex(myBoards.length);
      } else {
        toast.error("Failed to create board.");
      }
    } catch (error) {
      console.error("Failed to create board", error);
      toast.error("Failed to create board.");
    }
  };

  const handleTogglePublic = async (board: Board) => {
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !board.isPublic }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMyBoards((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(updated.isPublic ? "Board is now public" : "Board is now private");
      }
    } catch (error) {
      toast.error("Failed to update board");
    }
  };

  const currentBoard = myBoards[activeBoardIndex];

  if (loading && myBoards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* New Board Dialog */}
      <Dialog open={openNewBoardDialog} onOpenChange={setOpenNewBoardDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create a New Board</DialogTitle>
            <DialogDescription>Give your new inspiration board a name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="board-name">Board Name</Label>
            <Input
              id="board-name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              className="rounded-lg h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewBoardDialog(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button onClick={handleCreateBoard} className="rounded-lg">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compact Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-border/50">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-serif text-primary border-4 border-white shadow-lifted overflow-hidden relative shrink-0">
          {profile.profileImage ? (
            <Image
              src={profile.profileImage}
              alt={profile.displayName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight truncate">
            {profile.displayName}
          </h1>

          {profile.bio && (
            <p className="text-muted-foreground mt-1 line-clamp-1 italic">
              &quot;{profile.bio}&quot;
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            {profile.weddingDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(profile.weddingDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <Link
              href="/planner/stem/profile/followers"
              className="hover:text-primary transition-colors"
            >
              <strong className="text-foreground">{profile.stats.followersCount}</strong> Followers
            </Link>
            <Link
              href="/planner/stem/profile/following"
              className="hover:text-primary transition-colors"
            >
              <strong className="text-foreground">{profile.stats.followingCount}</strong> Following
            </Link>

            {/* Social Links */}
            {profile.socialLinks?.instagram && (
              <a
                href={`https://instagram.com/${profile.socialLinks.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-500 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {profile.socialLinks?.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => router.push("/planner/stem/profile/edit")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Boards Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground">My Boards</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push("/planner/stem/explore")}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            <Search className="h-4 w-4 mr-2" /> Explore Ideas
          </Button>
          <Button
            onClick={() => setOpenNewBoardDialog(true)}
            size="sm"
            className="rounded-full shadow-soft"
          >
            <Plus className="h-4 w-4 mr-2" /> New Board
          </Button>
        </div>
      </div>

      {/* Boards Content */}
      {myBoards.length > 0 ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex overflow-x-auto pb-2 -mb-2">
              {myBoards.map((board, index) => (
                <Button
                  key={board.id}
                  variant="ghost"
                  onClick={() => handleBoardChange(index)}
                  className={cn(
                    "flex-shrink-0 rounded-full px-4 h-9 text-base",
                    index === activeBoardIndex
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {board.name}
                </Button>
              ))}
            </div>

            {currentBoard && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="toggle-public">
                  <span className="flex items-center text-sm font-medium text-muted-foreground">
                    {currentBoard.isPublic ? (
                      <Globe className="h-4 w-4 mr-1" />
                    ) : (
                      <Lock className="h-4 w-4 mr-1" />
                    )}
                    {currentBoard.isPublic ? "Public" : "Private"}
                  </span>
                </Label>
                <Switch
                  id="toggle-public"
                  checked={currentBoard.isPublic || false}
                  onCheckedChange={() => handleTogglePublic(currentBoard)}
                />
              </div>
            )}
          </div>

          {currentBoard ? (
            <IdeaList board={currentBoard} isOwner={true} myBoards={myBoards} />
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
          <CardTitle className="font-serif text-2xl text-foreground mb-2">
            Create your first Board
          </CardTitle>
          <p className="text-muted-foreground mb-6">
            Boards are where you can save and organize your ideas. Create one for your Venue, Dress,
            Cake, or anything else!
          </p>
          <Button
            variant="default"
            size="lg"
            onClick={() => setOpenNewBoardDialog(true)}
            className="rounded-full shadow-soft"
          >
            Create Board
          </Button>
        </Card>
      )}
    </div>
  );
}
