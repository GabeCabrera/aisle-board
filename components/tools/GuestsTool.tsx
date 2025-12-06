"use client";

import React, { useState, useEffect } from "react";
import { usePlannerData, Guest } from "@/lib/hooks/usePlannerData";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
  Avatar,
  ListItemAvatar,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  History as ClockIcon,
  People as GuestsIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

function GuestRow({ guest }: { guest: Guest }) {
  const rsvpStyle = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return { backgroundColor: 'success.light', color: 'success.contrastText' };
      case "declined":
        return { backgroundColor: 'error.light', color: 'error.contrastText' };
      default:
        return { backgroundColor: 'warning.light', color: 'warning.contrastText' };
    }
  };

  const rsvpLabel = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return "Confirmed";
      case "declined":
        return "Declined";
      default:
        return "Pending";
    }
  };

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          {guest.name.charAt(0).toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={guest.name}
        secondary={
          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" component="span">
              {guest.email}
            </Typography>
            {guest.group && (
              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                • {guest.group}
              </Typography>
            )}
          </Box>
        }
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {guest.side && guest.side !== "both" && (
          <Chip label={guest.side === 'bride' ? 'Bride' : 'Groom'} size="small" />
        )}
        {guest.dietaryRestrictions && (
          <Chip label={guest.dietaryRestrictions} size="small" />
        )}
        <Chip label={rsvpLabel()} size="small" sx={rsvpStyle()} />
      </Box>
    </ListItem>
  );
}

export default function GuestsTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "side" | "group">("none");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatDistanceToNow(new Date(lastRefresh), { addSuffix: true }));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh > 30000) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [lastRefresh, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const guests = data?.guests;
  const stats = guests?.stats;
  const hasData = guests && guests.list.length > 0;

  // Filter and search
  let filteredGuests = guests?.list || [];
  
  if (filter !== "all") {
    filteredGuests = filteredGuests.filter(g => {
      if (filter === "confirmed") return g.rsvp === "confirmed" || g.rsvp === "attending";
      if (filter === "declined") return g.rsvp === "declined";
      if (filter === "pending") return g.rsvp === "pending" || !g.rsvp;
      return true;
    });
  }
  
  if (search) {
    const q = search.toLowerCase();
    filteredGuests = filteredGuests.filter(g => 
      g.name.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.group?.toLowerCase().includes(q)
    );
  }

  // Group guests
  const groupedGuests = (): Record<string, Guest[]> => {
    if (groupBy === "none") return { "All Guests": filteredGuests };
    
    return filteredGuests.reduce((acc, guest) => {
      let key: string;
      if (groupBy === "side") {
        key = guest.side === "bride" ? "Bride's Side" 
            : guest.side === "groom" ? "Groom's Side" 
            : "Both Sides";
      } else {
        key = guest.group || "No Group";
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(guest);
      return acc;
    }, {} as Record<string, Guest[]>);
  };

  const groups = groupedGuests();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Guest List
          </Typography>
          <Typography color="text.secondary">
            Manage your wedding guests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ClockIcon sx={{ fontSize: '1rem' }} />
            Updated {timeAgo}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {!hasData ? (
        /* Empty state */
        <Paper elevation={0} sx={{ textAlign: 'center', p: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
           <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}>
            <GuestsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            No guests yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Tell me about your guests in chat and I'll add them to your list.
          </Typography>
          <Button variant="contained" href="/">
            Go to chat
          </Button>
        </Paper>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Guests</Typography>
                  <Typography variant="h5" component="div">
                    {stats?.total || 0}
                  </Typography>
                  {stats?.withPlusOnes ? (
                    <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>+{stats.withPlusOnes} plus ones</Typography>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card data-testid="confirmed-card">
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Confirmed</Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                    {stats?.confirmed || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Pending</Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'warning.main' }}>
                    {stats?.pending || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Declined</Typography>
                  <Typography variant="h5" component="div" color="text.secondary">
                    {stats?.declined || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Search and filters */}
           <Paper sx={{ p: 2, mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search guests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Grid>
              <Grid xs={12} md={6}>
                <ToggleButtonGroup
                  value={filter}
                  exclusive
                  onChange={(e, newValue) => setFilter(newValue)}
                  aria-label="Filter by RSVP"
                >
                  <ToggleButton value="all" aria-label="all">All</ToggleButton>
                  <ToggleButton value="confirmed" aria-label="confirmed">Confirmed</ToggleButton>
                  <ToggleButton value="pending" aria-label="pending">Pending</ToggleButton>
                  <ToggleButton value="declined" aria-label="declined">Declined</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Paper>

          {/* Group by */}
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(e, newValue) => setGroupBy(newValue)}
              aria-label="Group by"
              size="small"
            >
              <ToggleButton value="none" aria-label="none">None</ToggleButton>
              <ToggleButton value="side" aria-label="side">Side</ToggleButton>
              <ToggleButton value="group" aria-label="group">Group</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Guest List */}
          {Object.entries(groups).map(([groupName, groupGuests]) => (
            <Paper key={groupName} sx={{ mb: 4 }}>
              {groupBy !== "none" && (
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">{groupName} ({groupGuests.length})</Typography>
                </Box>
              )}
              <List>
                {groupGuests.map((guest, index) => (
                  <React.Fragment key={guest.id}>
                    <GuestRow guest={guest} />
                    {index < groupGuests.length -1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ))}

          {filteredGuests.length === 0 && (
            <Paper sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">No guests match your search</Typography>
            </Paper>
          )}

          {/* Help prompt */}
          <Paper elevation={0} sx={{ mt: 4, p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need to add or update guests?{" "}
              <a href="/" style={{ color: 'primary.main' }}>
                Tell me in chat
              </a>
            </Typography>
          </Paper>
        </>
      )}
    </Container>
  );
}
