"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Share2,
  Heart,
  Instagram,
  Globe,
  Users,
  Settings,
  Eye
} from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  profileImage?: string | null;
  boards: PublicBoard[];
  stats: {
    followersCount: number;
    followingCount: number;
  };
  profileVisibility?: string;
  messagingEnabled?: boolean;
}

interface MyProfileProps {
  profile: ProfileData;
}

export function MyProfile({ profile }: MyProfileProps) {
  const router = useRouter();

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-fade-up">
      {/* Preview Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-primary" />
          <span className="text-sm text-foreground">
            This is how others see your profile
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => router.push("/planner/stem/profile/edit")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-12 border-b border-border/50">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-serif text-primary border-4 border-white shadow-lifted mb-2 overflow-hidden relative">
          {profile.profileImage ? (
            <Image
              src={profile.profileImage}
              alt={`${profile.displayName}'s profile image`}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            initials
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
        </div>

        {/* Stats - Clickable */}
        <div className="flex items-center gap-8 pt-4">
          <Link
            href="/planner/stem/profile/followers"
            className="text-center hover:text-primary transition-colors group"
          >
            <p className="text-2xl font-semibold text-foreground group-hover:text-primary">
              {profile.stats.followersCount}
            </p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </Link>
          <div className="h-8 w-px bg-border" />
          <Link
            href="/planner/stem/profile/following"
            className="text-center hover:text-primary transition-colors group"
          >
            <p className="text-2xl font-semibold text-foreground group-hover:text-primary">
              {profile.stats.followingCount}
            </p>
            <p className="text-sm text-muted-foreground">Following</p>
          </Link>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button
            size="lg"
            className="rounded-full px-8 shadow-soft"
            onClick={() => router.push("/planner/stem/profile/edit")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
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
              <a
                href={`https://instagram.com/${profile.socialLinks.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-pink-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {profile.socialLinks.website && (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        )}

        {/* Visibility Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Users className="h-3 w-3" />
          Profile visibility: {profile.profileVisibility || "public"}
        </div>
      </div>

      {/* Public Boards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground">Your Public Boards</h2>
          <span className="text-muted-foreground text-sm">
            {profile.boards.length} Collections
          </span>
        </div>

        {profile.boards.length === 0 ? (
          <Card className="text-center p-12 border-2 border-dashed border-border/50 bg-muted/5 shadow-none rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl text-foreground mb-2">
              No public boards yet
            </CardTitle>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create boards and make them public to share your wedding inspiration with others.
            </p>
            <Button
              onClick={() => router.push("/planner/stem")}
              className="rounded-full px-6 shadow-soft"
            >
              Go to My Boards
            </Button>
          </Card>
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
                        <div
                          key={i}
                          className="relative w-full h-full overflow-hidden bg-white"
                        >
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
                      <CardTitle className="font-serif text-2xl mb-2 group-hover:text-primary transition-colors">
                        {board.name}
                      </CardTitle>
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
