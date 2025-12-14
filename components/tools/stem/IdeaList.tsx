"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import Masonry from 'react-responsive-masonry';
import { toast } from "sonner";

import type { Board, Idea } from '@/lib/db/schema'; // Updated import

// Import sub-components
import { AddIdeaDialog } from './AddIdeaDialog'; // Updated import
import { IdeaDetailDialog } from './IdeaDetailDialog'; // Updated import
import { EditIdeaDialog } from './EditIdeaDialog'; // Updated import
import { IdeaCard } from './IdeaCard'; // Updated import

interface IdeaWithTags extends Idea { // Updated from Spark to Idea
  tags: string[];
}

interface IdeaListProps {
  board: Board; // Updated from palette to board
  isOwner: boolean;
  myBoards: Board[]; // Updated from myPalettes to myBoards
}

export function IdeaList({ board, isOwner, myBoards }: IdeaListProps) { // Updated parameter names
    const [ideas, setIdeas] = useState<IdeaWithTags[]>([]); // Updated variable names
    const [loading, setLoading] = useState(true);
    const [openAddIdeaDialog, setOpenAddIdeaDialog] = useState(false); // Updated variable names
    
    // Details View
    const [selectedIdea, setSelectedIdea] = useState<IdeaWithTags | null>(null); // Updated variable names
    const [openDetailDialog, setOpenDetailDialog] = useState(false);

    // Edit View
    const [editingIdea, setEditingIdea] = useState<IdeaWithTags | null>(null); // Updated variable names
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const fetchIdeas = useCallback(async () => { // Updated function name
        if (!board?.id) return; // Updated variable name
        setLoading(true);
        try {
            const response = await fetch(`/api/boards/${board.id}/ideas`); // Updated API endpoint
            if (response.ok) {
                const data = await response.json();
                setIdeas(data);
            }
        } catch (error) {
            console.error("Failed to fetch ideas", error); // Updated message
        } finally {
            setLoading(false);
        }
    }, [board]); // Updated variable name

    useEffect(() => {
        fetchIdeas();
    }, [fetchIdeas]);

    const handleIdeaAdded = () => { // Updated function name
        fetchIdeas();
    };

    const handleIdeaClick = (idea: IdeaWithTags) => { // Updated parameter name
        setSelectedIdea(idea); // Updated variable name
        setOpenDetailDialog(true);
    };

    const handleEditClick = (idea: IdeaWithTags) => { // Updated parameter name
        setEditingIdea(idea); // Updated variable name
        setOpenEditDialog(true);
        setOpenDetailDialog(false); // Close detail if open
    };
    
    const handleDeleteIdea = async (ideaId: string) => { // Updated function and parameter name
        if (!confirm("Are you sure you want to delete this Idea?")) return; // Updated message
        
        try {
            const res = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' }); // Updated API endpoint
            if (res.ok) {
                toast.success("Idea deleted"); // Updated message
                fetchIdeas();
                if (selectedIdea?.id === ideaId) setOpenDetailDialog(false); // Updated variable name
            } else {
                toast.error("Failed to delete idea"); // Updated message
            }
        } catch (e) {
            toast.error("Failed to delete idea"); // Updated message
        }
    };
    
    // This handler will be passed down to IdeaCard and then to SaveIdeaDialog
    const handleSaveIdea = (idea: IdeaWithTags) => { // Updated function and parameter name
      // Logic for saving an idea to a user's board (this will be handled by SaveIdeaDialog directly)
      // This is primarily for triggering re-fetches or state updates if needed higher up
      console.log(`Idea ${idea.title} is being saved.`);
    };

    return (
        <>
            <AddIdeaDialog 
                open={openAddIdeaDialog} // Updated variable name
                onClose={() => setOpenAddIdeaDialog(false)} 
                boardId={board.id} // Updated parameter name
                onIdeaAdded={handleIdeaAdded} // Updated parameter name
            />

            <IdeaDetailDialog 
                idea={selectedIdea} // Updated variable name
                open={openDetailDialog} 
                onClose={() => setOpenDetailDialog(false)}
                onDelete={handleDeleteIdea} // Updated function name
                onEdit={handleEditClick} // Updated function name
                isOwner={isOwner}
                myBoards={myBoards} // Updated variable name
                onSave={handleSaveIdea} // Updated function name
            />

            <EditIdeaDialog 
                open={openEditDialog} 
                onClose={() => setOpenEditDialog(false)} 
                idea={editingIdea} // Updated variable name
                onUpdate={fetchIdeas} // Updated function name
            />
            
            <div className="flex justify-end mb-4">
                {isOwner && (
                    <Button variant="default" onClick={() => setOpenAddIdeaDialog(true)} className="rounded-full shadow-soft">
                        <Plus className="h-4 w-4 mr-2" /> Add Idea {/* Updated message */}
                    </Button>
                )}
            </div>
            
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
                </div>
            ) : ideas.length > 0 ? ( // Updated variable name
                <div className="w-full min-h-[200px]">
                    {/* @ts-ignore */}
                    <Masonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }} gutter="16px">
                        {ideas.map((idea) => ( // Updated variable name
                            <IdeaCard 
                                key={idea.id} 
                                idea={idea} // Updated variable name
                                onClick={handleIdeaClick} // Updated function name
                                isOwner={isOwner}
                                onSave={handleSaveIdea} // Pass the handler down // Updated function name
                            />
                        ))}
                    </Masonry>
                </div>
            ) : (
                <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
                    <CardTitle className="font-serif text-2xl text-foreground mb-2">
                        {isOwner ? "Start your collection" : "Empty Board"} {/* Updated message */}
                    </CardTitle>
                    <p className="text-muted-foreground mb-6">
                        {isOwner ? "Add your first Idea to this board." : "This board has no ideas yet."} {/* Updated message */}
                    </p>
                    {isOwner && (
                        <Button variant="outline" onClick={() => setOpenAddIdeaDialog(true)} className="rounded-full">
                            <Plus className="h-4 w-4 mr-2" /> Add Idea {/* Updated message */}
                        </Button>
                    )}
                </Card>
            )}
        </>
    );
}
