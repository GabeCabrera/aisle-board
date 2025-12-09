"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Share2 } from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";

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
  boards: PublicBoard[];
}

interface UserProfileProps {
  profile: ProfileData;
}

export function UserProfile({ profile }: UserProfileProps) {
  const router = useRouter();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName}'s Wedding Portfolio`,
        url: window.location.href,
      });
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-fade-up">
      {/* Navigation */}
      <Button 
        variant="ghost" 
        onClick={() => router.push("/planner/inspo/explore")}
        className="pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Explore
      </Button>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 py-12 border-b border-border/50">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-serif text-primary border-2 border-white shadow-lifted mb-4">
          {profile.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        
        <h1 className="font-serif text-6xl md:text-8xl text-foreground tracking-tight">
          {profile.displayName}
        </h1>
        
        <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground font-light text-lg">
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
          {/* Placeholder for Location if we add it to schema */}
          {/* <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Napa Valley, CA</span>
          </div> */}
        </div>

        <Button 
          variant="outline" 
          className="rounded-full px-6 mt-4"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share Portfolio
        </Button>
      </div>

      {/* Public Boards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-foreground">Curated Boards</h2>
          <span className="text-muted-foreground text-sm">{profile.boards.length} Collections</span>
        </div>

        {profile.boards.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl">
            <p>This couple hasn't shared any boards publicly yet.</p>
          </div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
            <Masonry gutter="24px">
              {profile.boards.map((board) => (
                <div key={board.id} className="mb-6">
                  <Card 
                    className="cursor-pointer rounded-3xl overflow-hidden shadow-soft transition-all duration-300 hover:translate-y-[-4px] hover:shadow-medium group"
                    onClick={() => router.push(`/planner/inspo/board/${board.id}`)}
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
                        <div key={`empty-${i}`} className="bg-muted/50" />
                      ))}
                    </div>
                    
                    <CardContent className="p-6">
                      <CardTitle className="font-serif text-2xl mb-2">{board.name}</CardTitle>
                      {board.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {board.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-4 font-medium uppercase tracking-wider">
                        {board.ideas.length} Ideas
                      </p>
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
