"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Single import here
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
} from 'lucide-react';
import type { Board, Idea } from '@/lib/db/schema'; // Updated import

// Import refactored dialogs
import { AddIdeaDialog } from './inspo-tool/AddIdeaDialog'; // Updated import
import { IdeaList } from './inspo-tool/IdeaList'; // Updated import

interface MyBoardsToolProps {
  initialBoards: Board[];
}

export default function MyBoardsTool({ initialBoards }: MyBoardsToolProps) {
  const router = useRouter(); // Initialize router here
  const [loading, setLoading] = useState(false); // Only for client-side refetch
  const [myBoards, setMyBoards] = useState<Board[]>(initialBoards);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);
  
  const [openNewBoardDialog, setOpenNewBoardDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  useEffect(() => {
    // If initialBoards change (e.g., from server re-render), update state
    setMyBoards(initialBoards);
  }, [initialBoards]);

  const fetchMyBoards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/boards'); // Updated API endpoint
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
      const response = await fetch('/api/boards', { // Updated API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName }),
      });
      if (response.ok) {
        toast.success("Board created!"); // Updated message
        await fetchMyBoards(); 
        setNewBoardName("");
        setOpenNewBoardDialog(false);
        setActiveBoardIndex(myBoards.length); 
      } else {
        toast.error("Failed to create board."); // Updated message
      }
    } catch (error) {
      console.error("Failed to create board", error); // Updated message
      toast.error("Failed to create board."); // Updated message
    }
  };

  const handleTogglePublic = async (board: Board) => {
      try {
          const response = await fetch(`/api/boards/${board.id}`, { // Updated API endpoint
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPublic: !board.isPublic }),
          });
          if (response.ok) {
              const updated = await response.json();
              setMyBoards(prev => prev.map(p => p.id === updated.id ? updated : p));
              toast.success(updated.isPublic ? "Board is now public" : "Board is now private"); // Updated message
          }
      } catch (error) {
          toast.error("Failed to update board"); // Updated message
      }
  };
  
  const currentBoard = myBoards[activeBoardIndex];

  if (loading && myBoards.length === 0) { // Updated loading condition
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* New Board Dialog */}
      <Dialog open={openNewBoardDialog} onOpenChange={setOpenNewBoardDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create a New Board</DialogTitle> {/* Updated message */}
            <DialogDescription>Give your new inspiration board a name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="board-name">Board Name</Label> {/* Updated message */}
            <Input 
                id="board-name" 
                value={newBoardName} 
                onChange={(e) => setNewBoardName(e.target.value)} 
                className="rounded-lg h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewBoardDialog(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleCreateBoard} className="rounded-lg">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      {/* Header with Explore Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            My Boards
          </h1>
        </div>
        <Button 
            onClick={() => router.push('/planner/inspo/explore')} 
            variant={'outline'}
            className={cn(
                "rounded-full px-4 h-9"
            )}
        >
            <Search className="h-4 w-4 mr-2" /> Explore Ideas {/* Updated message */}
        </Button>
      </div>

        {myBoards.length > 0 ? (
            <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                                {currentBoard.isPublic ? <Globe className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
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

                <Button variant="outline" onClick={() => setOpenNewBoardDialog(true)} className="rounded-full shadow-soft md:hidden">
                    <Plus className="h-4 w-4 mr-2" /> New Board {/* Updated message */}
                </Button>
            </div>
            
            {currentBoard ? (
                // Temporarily using IdeaList, will adapt to render ideas within a board
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
                    Create your first Board {/* Updated message */}
                </CardTitle>
                <p className="text-muted-foreground mb-6">
                    Boards are where you can save and organize your ideas. Create one for your Venue, Dress, Cake, or anything else! {/* Updated message */}
                </p>
                <Button variant="default" size="lg" onClick={() => setOpenNewBoardDialog(true)} className="rounded-full shadow-soft">
                    Create Board {/* Updated message */}
                </Button>
            </Card>
        )}
    </div>
  );
}