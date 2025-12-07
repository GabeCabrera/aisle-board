"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  CircularProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import MoreVert from '@mui/icons-material/MoreVert';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Favorite from '@mui/icons-material/Favorite';
import Delete from '@mui/icons-material/Delete';
import { Palette, Spark } from '@/lib/db/schema';
import { toast } from "sonner";

function AddSparkDialog({ open, onClose, paletteId, onSparkAdded }: { open: boolean, onClose: () => void, paletteId: string, onSparkAdded: () => void }) {
    const [imageUrl, setImageUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const handleAddSpark = async () => {
        if (!imageUrl.trim()) return;

        try {
            const response = await fetch('/api/sparks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paletteId, imageUrl, title, description }),
            });

            if (response.ok) {
                toast.success("Spark added!");
                onSparkAdded();
                onClose();
                setImageUrl("");
                setTitle("");
                setDescription("");
            } else {
                toast.error("Failed to add Spark.");
            }
        } catch (error) {
            console.error("Failed to add spark", error);
            toast.error("Failed to add Spark.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add a new Spark</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" label="Image URL" type="url" fullWidth variant="standard" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                <TextField margin="dense" label="Title" type="text" fullWidth variant="standard" value={title} onChange={(e) => setTitle(e.target.value)} />
                <TextField margin="dense" label="Description" type="text" fullWidth multiline rows={2} variant="standard" value={description} onChange={(e) => setDescription(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleAddSpark}>Add Spark</Button>
            </DialogActions>
        </Dialog>
    );
}

function SparkList({ palette }: { palette: Palette }) {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAddSparkDialog, setOpenAddSparkDialog] = useState(false);

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
    
    const deleteSpark = async (sparkId: string) => {
        if (!confirm("Are you sure you want to delete this Spark?")) return;
        
        try {
            const res = await fetch(`/api/sparks/${sparkId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Spark deleted");
                fetchSparks();
            } else {
                toast.error("Failed to delete spark");
            }
        } catch (e) {
            toast.error("Failed to delete spark");
        }
    }


    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <>
            <AddSparkDialog open={openAddSparkDialog} onClose={() => setOpenAddSparkDialog(false)} paletteId={palette.id} onSparkAdded={handleSparkAdded} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                 <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAddSparkDialog(true)}>
                    Add Spark
                </Button>
            </Box>
            
            {sparks.length > 0 ? (
                <ImageList variant="masonry" cols={3} gap={16}>
                    {sparks.map((spark) => (
                        <ImageListItem key={spark.id}>
                            <img
                                src={`${spark.imageUrl}?w=248&fit=crop&auto=format`}
                                srcSet={`${spark.imageUrl}?w=248&fit=crop&auto=format&dpr=2 2x`}
                                alt={spark.title || ""}
                                loading="lazy"
                                style={{ borderRadius: '12px' }}
                            />
                            <ImageListItemBar
                                title={spark.title}
                                subtitle={spark.description}
                                actionIcon={
                                    <IconButton
                                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                        onClick={() => deleteSpark(spark.id)}
                                    >
                                        <Delete />
                                    </IconButton>
                                }
                            />
                        </ImageListItem>
                    ))}
                </ImageList>
            ) : (
                <Paper elevation={0} sx={{ textAlign: 'center', p: 6, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" component="h2">Add your first Spark</Typography>
                    <Typography color="text.secondary">This Palette is empty. Add a Spark to get started.</Typography>
                </Paper>
            )}
        </>
    );
}


export default function InspoTool() {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [openNewPaletteDialog, setOpenNewPaletteDialog] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");

  useEffect(() => {
    fetchPalettes();
  }, []);

  const fetchPalettes = async () => {
    try {
      const response = await fetch('/api/palettes');
      if (response.ok) {
        const data = await response.json();
        setPalettes(data);
        if (data.length === 0) {
          setOpenNewPaletteDialog(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch palettes", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaletteChange = (event: React.SyntheticEvent, newValue: number) => {
    setActivePaletteIndex(newValue);
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
        await fetchPalettes(); // Re-fetch to get the new list
        setNewPaletteName("");
        setOpenNewPaletteDialog(false);
        setActivePaletteIndex(palettes.length); // Switch to the new palette
      } else {
        toast.error("Failed to create palette.");
      }
    } catch (error) {
      console.error("Failed to create palette", error);
      toast.error("Failed to create palette.");
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Dialog open={openNewPaletteDialog} onClose={() => setOpenNewPaletteDialog(false)}>
        <DialogTitle>Create a New Palette</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Palette Name"
            type="text"
            fullWidth
            variant="standard"
            value={newPaletteName}
            onChange={(e) => setNewPaletteName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewPaletteDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePalette}>Create</Button>
        </DialogActions>
      </Dialog>
    
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Inspiration
          </Typography>
          <Typography color="text.secondary">
            Your Palettes for wedding inspiration.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenNewPaletteDialog(true)}>
          New Palette
        </Button>
      </Box>

      {palettes.length > 0 ? (
        <>
          <Paper sx={{ mb: 4 }}>
            <Tabs value={activePaletteIndex} onChange={handlePaletteChange} centered>
              {palettes.map((palette) => (
                <Tab label={palette.name} key={palette.id} />
              ))}
            </Tabs>
          </Paper>
          
          <SparkList palette={palettes[activePaletteIndex]} />
        </>
      ) : (
        <Paper elevation={0} sx={{ textAlign: 'center', p: 6, bgcolor: 'grey.50' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                Create your first Palette
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Palettes are where you can collect your Sparks of inspiration.
            </Typography>
            <Button variant="contained" onClick={() => setOpenNewPaletteDialog(true)}>
                Create Palette
            </Button>
        </Paper>
      )}
    </Container>
  );
}