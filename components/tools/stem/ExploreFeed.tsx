"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { PublicBoardCard } from "./PublicBoardCard";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { IdeaCard } from "./IdeaCard"; // To display individual ideas
import type { Board, Idea } from '@/lib/db/schema'; // Import directly from schema

// Define PublicBoard by extending Board and adding tenant displayName
interface PublicBoard extends Board {
  tenant: {
    displayName: string;
  } | null;
}

interface IdeaWithBoard extends Idea {
  board: PublicBoard;
}

interface ExploreFeedProps {
  initialBoards: PublicBoard[];
}

export function ExploreFeed({ initialBoards }: ExploreFeedProps) {
  const router = useRouter();
  const [boards, setBoards] = React.useState(initialBoards);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IdeaWithBoard[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/ideas/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        } else {
          console.error("Failed to fetch search results");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search API error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const handler = setTimeout(() => {
      fetchSearchResults();
    }, 300); // Debounce search input

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border/50 pb-8">
        <div>
          <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tight">
            The Feed
          </h1>
          <p className="text-xl text-muted-foreground mt-4 font-light max-w-lg">
            Discover wedding inspiration from the community. Save ideas to your own boards.
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for vibes (e.g. 'Rustic', 'Modern')..." 
            className="pl-10 h-12 rounded-full bg-muted/30 border-transparent focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conditional Rendering based on search */}
      {searchQuery.trim() ? (
        // Display Search Results
        <div className="min-h-[500px]">
          {isSearching ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <p>No ideas found matching &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
              <Masonry gutter="24px">
                {searchResults.map((idea) => (
                  <div key={idea.id} className="mb-6">
                    {/* Placeholder for IdeaCard, assuming it exists */}
                    <Card onClick={() => router.push(`/planner/stem/board/${idea.board.id}`)} className="cursor-pointer rounded-3xl h-full shadow-soft transition-all duration-200 hover:translate-y-[-4px] hover:shadow-medium">
                        <img 
                          src={idea.imageUrl} 
                          alt={idea.title || idea.description || "Idea"} 
                          className="w-full h-auto object-cover rounded-3xl" 
                          loading="lazy" 
                        />
                        <CardContent className="p-4">
                            <h3 className="font-serif text-lg leading-tight mb-1">{idea.title || idea.description?.substring(0, 50) + '...' || 'Untitled Idea'}</h3>
                            <p className="text-xs text-muted-foreground">
                                by {idea.board.tenant?.displayName || "Unknown"}
                            </p>
                        </CardContent>
                    </Card>
                  </div>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          )}
        </div>
      ) : (
        // Display Initial Boards (Explore)
        <div className="min-h-[500px]">
          {boards.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <p>No public boards available to explore.</p>
            </div>
          ) : (
            <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
              <Masonry gutter="24px">
                {boards.map((board) => (
                  <div key={board.id} className="mb-6">
                    <PublicBoardCard 
                      board={board} 
                      onClick={() => router.push(`/planner/stem/board/${board.id}`)} 
                    />
                  </div>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          )}
        </div>
      )}
    </div>
  );
}