"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import Masonry from 'react-responsive-masonry';
import { toast } from "sonner";

import type { Palette, Spark } from '@/lib/db/schema';

// Import sub-components
import { AddSparkDialog } from './AddSparkDialog';
import { SparkDetailDialog } from './SparkDetailDialog';
import { EditSparkDialog } from './EditSparkDialog';
import { SparkCard } from './SparkCard';

interface SparkWithTags extends Spark {
  tags: string[];
}

interface SparkListProps {
  palette: Palette;
  isOwner: boolean;
  myPalettes: Palette[]; // Passed down to SaveSparkDialog
}

export function SparkList({ palette, isOwner, myPalettes }: SparkListProps) {
    const [sparks, setSparks] = useState<SparkWithTags[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAddSparkDialog, setOpenAddSparkDialog] = useState(false);
    
    // Details View
    const [selectedSpark, setSelectedSpark] = useState<SparkWithTags | null>(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);

    // Edit View
    const [editingSpark, setEditingSpark] = useState<SparkWithTags | null>(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);

    const fetchSparks = useCallback(async () => {
        if (!palette?.id) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/palettes/${palette.id}/sparks`);
            if (response.ok) {
                const data = await response.json();
                setSparks(data);
            }
        } catch (error) {
            console.error("Failed to fetch sparks", error);
        } finally {
            setLoading(false);
        }
    }, [palette]);

    useEffect(() => {
        fetchSparks();
    }, [fetchSparks]);

    const handleSparkAdded = () => {
        fetchSparks();
    };

    const handleSparkClick = (spark: SparkWithTags) => {
        setSelectedSpark(spark);
        setOpenDetailDialog(true);
    };

    const handleEditClick = (spark: SparkWithTags) => {
        setEditingSpark(spark);
        setOpenEditDialog(true);
        setOpenDetailDialog(false); // Close detail if open
    };
    
    const handleDeleteSpark = async (sparkId: string) => {
        if (!confirm("Are you sure you want to delete this Spark?")) return;
        
        try {
            const res = await fetch(`/api/sparks/${sparkId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Spark deleted");
                fetchSparks();
                if (selectedSpark?.id === sparkId) setOpenDetailDialog(false);
            } else {
                toast.error("Failed to delete spark");
            }
        } catch (e) {
            toast.error("Failed to delete spark");
        }
    };
    
    // This handler will be passed down to SparkCard and then to SaveSparkDialog
    const handleSaveSpark = (spark: SparkWithTags) => {
      // Logic for saving a spark to a user's palette (this will be handled by SaveSparkDialog directly)
      // This is primarily for triggering re-fetches or state updates if needed higher up
      console.log(`Spark ${spark.title} is being saved.`);
    };

    return (
        <>
            <AddSparkDialog 
                open={openAddSparkDialog} 
                onClose={() => setOpenAddSparkDialog(false)} 
                paletteId={palette.id} 
                onSparkAdded={handleSparkAdded} 
            />

            <SparkDetailDialog 
                spark={selectedSpark} 
                open={openDetailDialog} 
                onClose={() => setOpenDetailDialog(false)}
                onDelete={handleDeleteSpark}
                onEdit={handleEditClick}
                isOwner={isOwner}
                myPalettes={myPalettes}
                onSave={handleSaveSpark}
            />

            <EditSparkDialog 
                open={openEditDialog} 
                onClose={() => setOpenEditDialog(false)} 
                spark={editingSpark} 
                onUpdate={fetchSparks} 
            />
            
            <div className="flex justify-end mb-4">
                {isOwner && (
                    <Button variant="default" onClick={() => setOpenAddSparkDialog(true)} className="rounded-full shadow-soft">
                        <Plus className="h-4 w-4 mr-2" /> Add Spark
                    </Button>
                )}
            </div>
            
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
                </div>
            ) : sparks.length > 0 ? (
                <div className="w-full min-h-[200px]">
                    {/* @ts-ignore */}
                    <Masonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }} gutter="16px">
                        {sparks.map((spark) => (
                            <SparkCard 
                                key={spark.id} 
                                spark={spark} 
                                onClick={handleSparkClick} 
                                isOwner={isOwner}
                                onSave={handleSaveSpark} // Pass the handler down
                            />
                        ))}
                    </Masonry>
                </div>
            ) : (
                <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
                    <CardTitle className="font-serif text-2xl text-foreground mb-2">
                        {isOwner ? "Start your collection" : "Empty Palette"}
                    </CardTitle>
                    <p className="text-muted-foreground mb-6">
                        {isOwner ? "Add your first Spark to this palette." : "This palette has no sparks yet."}
                    </p>
                    {isOwner && (
                        <Button variant="outline" onClick={() => setOpenAddSparkDialog(true)} className="rounded-full">
                            <Plus className="h-4 w-4 mr-2" /> Add Spark
                        </Button>
                    )}
                </Card>
            )}
        </>
    );
}