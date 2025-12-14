"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Share2, Heart, Instagram, Globe, User } from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { toast } from "sonner";

interface PublicBoard {
  id: string;
  name: string;
  description: string | null;
  ideas: { imageUrl: string }[];
}

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
  profileImage?: string | null; // Added profileImage
  boards: PublicBoard[];
  stats: {
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
}

interface UserProfileProps {
  profile: ProfileData;
}

export function UserProfile({ profile }: UserProfileProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.stats.followersCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName}'s Wedding Portfolio`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleFollow = async () => {
    // Optimistic update
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);
    setFollowerCount(prev => newStatus ? prev + 1 : prev - 1);
    setIsLoading(true);

    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetTenantId: profile.id, 
          action: newStatus ? "follow" : "unfollow" 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update follow status");
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newStatus);
      setFollowerCount(prev => !newStatus ? prev + 1 : prev - 1);
      toast.error("Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-fade-up">
      {/* Navigation */}
      <Button 
        variant="ghost" 
        onClick={() => router.push("/planner/stem/explore")}
        className="pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Explore
      </Button>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-12 border-b border-border/50">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-serif text-primary border-4 border-white shadow-lifted mb-2 overflow-hidden relative">
           {profile.profileImage ? (
            <Image 
              src={profile.profileImage} 
              alt={`${profile.displayName}'s profile image`} 
              fill 
              className="object-cover" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes prop for better performance
            />
           ) : (
            profile.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
           )}
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tight">
          {profile.displayName}
        </h1>

        {profile.bio && (
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed italic">
            &quot;{profile.bio}&quot;
          </p>
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground font-light text-sm md:text-base">
          {profile.weddingDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(profile.weddingDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{followerCount} Followers</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button 
            size="lg"
            className={cn(
              "rounded-full px-8 transition-all min-w-[140px]",
              isFollowing 
                ? "bg-muted text-foreground hover:bg-muted/80" 
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft"
            )}
            onClick={handleFollow}
            disabled={isLoading}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>

          <Button 
            variant="outline" 
            size="lg"
            className="rounded-full px-4"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Social Links */}
        {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
          <div className="flex gap-4 pt-2">
            {profile.socialLinks.instagram && (
              <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-pink-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {profile.socialLinks.website && (
              <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Public Boards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground">Curated Boards</h2>
          <span className="text-muted-foreground text-sm">{profile.boards.length} Collections</span>
        </div>

        {profile.boards.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
            <p>This couple hasn&apos;t shared any boards publicly yet.</p>
          </div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
            <Masonry gutter="24px">
              {profile.boards.map((board) => (
                <div key={board.id} className="mb-6">
                  <Card 
                    className="cursor-pointer rounded-3xl overflow-hidden shadow-soft transition-all duration-300 hover:translate-y-[-4px] hover:shadow-medium group bg-white border-border"
                    onClick={() => router.push(`/planner/stem/board/${board.id}`)}
                  >
                    {/* Collage Preview */}
                    <div className="aspect-[4/3] bg-muted relative grid grid-cols-2 grid-rows-2 gap-0.5">
                      {board.ideas.slice(0, 4).map((idea, i) => (
                        <div key={i} className="relative w-full h-full overflow-hidden bg-white">
                           <Image
                              src={idea.imageUrl}
                              alt=""
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              unoptimized
                           />
                        </div>
                      ))}
                      {/* Fill remaining slots with placeholder if < 4 images */}
                      {[...Array(Math.max(0, 4 - board.ideas.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-muted/30" />
                      ))}
                    </div>
                    
                    <CardContent className="p-6">
                      <CardTitle className="font-serif text-2xl mb-2 group-hover:text-primary transition-colors">{board.name}</CardTitle>
                      {board.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        <Heart className="h-3 w-3" />
                        {board.ideas.length} Ideas
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </div>
    </div>
  );
}

// Helper for classNames (simple version if lib/utils not available in context, but it is)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}