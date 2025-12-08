"use client";

import React, { useState, useEffect } from 'react';
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
  ArrowLeft, 
  Loader2, 
} from 'lucide-react';
import Masonry from 'react-responsive-masonry';
import type { Palette, Spark } from '@/lib/db/schema';

// Import refactored dialogs
import { AddSparkDialog } from './inspo-tool/AddSparkDialog';
import { PublicPaletteCard } from './inspo-tool/PublicPaletteCard';
import { SparkList } from './inspo-tool/SparkList';

// --- Types ---
interface PaletteWithMeta extends Palette {
  tenantName?: string;
  coverImage?: string;
}

interface SparkWithTags extends Spark {
  tags: string[];
}

// Main InspoTool Component
export default function InspoTool() {
  // State
  const [viewMode, setViewMode] = useState<'mine' | 'explore'>('mine');
  const [loading, setLoading] = useState(true);
  
  // My Palettes Data
  const [myPalettes, setMyPalettes] = useState<Palette[]>([]);
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  
  // Explore Data
  const [explorePalettes, setExplorePalettes] = useState<PaletteWithMeta[]>([]);
  const [selectedPublicPalette, setSelectedPublicPalette] = useState<PaletteWithMeta | null>(null);

  // Dialogs
  const [openNewPaletteDialog, setOpenNewPaletteDialog] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");

  useEffect(() => {
    if (viewMode === 'mine') {
        fetchMyPalettes();
    } else {
        fetchExplorePalettes();
    }
  }, [viewMode]);

  const fetchMyPalettes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/palettes');
      if (response.ok) {
        const data = await response.json();
        setMyPalettes(data);
      }
    } catch (error) {
      console.error("Failed to fetch palettes", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExplorePalettes = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/palettes/explore');
        if (response.ok) {
            const data = await response.json();
            setExplorePalettes(data);
        }
    } catch (error) {
        console.error("Failed to fetch explore palettes", error);
    } finally {
        setLoading(false);
    }
  };

  const handlePaletteChange = (index: number) => {
    setActivePaletteIndex(index);
  };
  
  const handleCreatePalette = async () => {
    if (!newPaletteName.trim()) return;

    try {
      const response = await fetch('/api/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPaletteName }),
      });
      if (response.ok) {
        toast.success("Palette created!");
        await fetchMyPalettes(); 
        setNewPaletteName("");
        setOpenNewPaletteDialog(false);
        setActivePaletteIndex(myPalettes.length); 
      } else {
        toast.error("Failed to create palette.");
      }
    } catch (error) {
      console.error("Failed to create palette", error);
      toast.error("Failed to create palette.");
    }
  };

  const handleTogglePublic = async (palette: Palette) => {
      try {
          const response = await fetch(`/api/palettes/${palette.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPublic: !palette.isPublic }),
          });
          if (response.ok) {
              const updated = await response.json();
              setMyPalettes(prev => prev.map(p => p.id === updated.id ? updated : p));
              toast.success(updated.isPublic ? "Palette is now public" : "Palette is now private");
          }
      } catch (error) {
          toast.error("Failed to update palette");
      }
  };
  
  const currentPalette = myPalettes[activePaletteIndex];

  if (loading && myPalettes.length === 0 && explorePalettes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* New Palette Dialog */}
      <Dialog open={openNewPaletteDialog} onOpenChange={setOpenNewPaletteDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Create a New Palette</DialogTitle>
            <DialogDescription>Give your new inspiration board a name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="palette-name">Palette Name</Label>
            <Input 
                id="palette-name" 
                value={newPaletteName} 
                onChange={(e) => setNewPaletteName(e.target.value)} 
                className="rounded-lg h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewPaletteDialog(false)} className="rounded-lg">Cancel</Button>
            <Button onClick={handleCreatePalette} className="rounded-lg">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      {/* Header with Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Inspiration
          </h1>
        </div>
        <div className="flex items-center space-x-2">
            <Button 
                onClick={() => { setViewMode('mine'); setSelectedPublicPalette(null); }} 
                variant={viewMode === 'mine' && !selectedPublicPalette ? 'default' : 'outline'}
                className={cn(
                    "rounded-full px-4 h-9",
                    viewMode === 'mine' && !selectedPublicPalette ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
            >
                My Boards
            </Button>
            <Button 
                onClick={() => { setViewMode('explore'); setSelectedPublicPalette(null); }} 
                variant={viewMode === 'explore' || selectedPublicPalette ? 'default' : 'outline'}
                className={cn(
                    "rounded-full px-4 h-9",
                    (viewMode === 'explore' || selectedPublicPalette) ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
            >
                <Search className="h-4 w-4 mr-2" /> Explore
            </Button>
        </div>
      </div>

      {/* View: Explore - Detailed Public Palette */}
      {selectedPublicPalette ? (
          <div>
              <Button onClick={() => setSelectedPublicPalette(null)} variant="ghost" className="rounded-full mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Explore
              </Button>
              <Card className="p-6 mb-8 rounded-3xl border border-border shadow-soft bg-canvas">
                  <CardTitle className="font-serif text-3xl mb-1">{selectedPublicPalette.name}</CardTitle>
                  <p className="text-muted-foreground mb-4">by {selectedPublicPalette.tenantName}</p>
                  {selectedPublicPalette.description && (
                    <p className="text-foreground">{selectedPublicPalette.description}</p>
                  )}
              </Card>
              <SparkList palette={selectedPublicPalette} isOwner={false} myPalettes={myPalettes} />
          </div>
      ) : viewMode === 'explore' ? (
          /* View: Explore - List */
          <div className="w-full min-h-[200px]">
              {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
                    </div>
                ) : explorePalettes.length > 0 ? (
                  // @ts-ignore
                  <Masonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }} gutter="16px">
                      {explorePalettes.map(palette => (
                          <PublicPaletteCard palette={palette} onClick={setSelectedPublicPalette} key={palette.id} />
                      ))}
                  </Masonry>
              ) : (
                  <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
                      <CardTitle className="font-serif text-2xl text-foreground mb-2">
                          No public palettes found
                      </CardTitle>
                      <p className="text-muted-foreground mb-6">Be the first to share your inspiration!</p>
                  </Card>
              )}
          </div>
      ) : (
          /* View: My Palettes */
          <>
            {myPalettes.length > 0 ? (
                <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex-1 flex overflow-x-auto pb-2 -mb-2">
                        {myPalettes.map((palette, index) => (
                            <Button
                                key={palette.id}
                                variant="ghost"
                                onClick={() => handlePaletteChange(index)}
                                className={cn(
                                    "flex-shrink-0 rounded-full px-4 h-9 text-base",
                                    index === activePaletteIndex 
                                        ? "bg-muted text-foreground font-medium" 
                                        : "text-muted-foreground hover:bg-muted/30"
                                )}
                            >
                                {palette.name}
                            </Button>
                        ))}
                    </div>
                    
                    {currentPalette && (
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="toggle-public">
                                <span className="flex items-center text-sm font-medium text-muted-foreground">
                                    {currentPalette.isPublic ? <Globe className="h-4 w-4 mr-1" /> : <Lock className="h-4 w-4 mr-1" />}
                                    {currentPalette.isPublic ? "Public" : "Private"}
                                </span>
                            </Label>
                            <Switch 
                                id="toggle-public" 
                                checked={currentPalette.isPublic || false} 
                                onCheckedChange={() => handleTogglePublic(currentPalette)} 
                            />
                        </div>
                    )}

                    <Button variant="outline" onClick={() => setOpenNewPaletteDialog(true)} className="rounded-full shadow-soft md:hidden">
                        <Plus className="h-4 w-4 mr-2" /> New Palette
                    </Button>
                </div>
                
                {currentPalette ? (
                    <SparkList palette={currentPalette} isOwner={true} myPalettes={myPalettes} />
                ) : (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
                </>
            ) : (
                <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
                    <CardTitle className="font-serif text-2xl text-foreground mb-2">
                        Create your first Palette
                    </CardTitle>
                    <p className="text-muted-foreground mb-6">
                        Palettes are boards where you can save and organize your ideas. Create one for your Venue, Dress, Cake, or anything else!
                    </p>
                    <Button variant="default" size="lg" onClick={() => setOpenNewPaletteDialog(true)} className="rounded-full shadow-soft">
                        Create Palette
                    </Button>
                </Card>
            )}
          </>
      )}
    </div>
  );
}