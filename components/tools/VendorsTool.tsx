"use client";

import React, { useState, useEffect } from "react";
import { usePlannerData, formatCurrency, Vendor } from "@/lib/hooks/usePlannerData";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
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
  Store as VendorsIcon,
  Home,
  Utensils,
  Camera,
  Video,
  LocalFlorist,
  MusicNote,
  Cake,
  Favorite,
  ContentCut,
  Sparkles,
  Chair,
  DirectionsCar,
  Assignment,
  Email,
  Phone,
  Link as LinkIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";

const categoryConfig: Record<string, { Icon: React.ElementType; color: string }> = {
    venue: { Icon: Home, color: "primary.main" },
    catering: { Icon: Utensils, color: "secondary.main" },
    photographer: { Icon: Camera, color: "info.main" },
    photography: { Icon: Camera, color: "info.main" },
    videographer: { Icon: Video, color: "error.main" },
    videography: { Icon: Video, color: "error.main" },
    florist: { Icon: LocalFlorist, color: "success.main" },
    flowers: { Icon: LocalFlorist, color: "success.main" },
    dj: { Icon: MusicNote, color: "warning.main" },
    band: { Icon: MusicNote, color: "warning.main" },
    music: { Icon: MusicNote, color: "warning.main" },
    cake: { Icon: Cake, color: "primary.dark" },
    bakery: { Icon: Cake, color: "primary.dark" },
    officiant: { Icon: Favorite, color: "error.light" },
    hair: { Icon: ContentCut, color: "secondary.light" },
    makeup: { Icon: Sparkles, color: "secondary.dark" },
    beauty: { Icon: Sparkles, color: "secondary.dark" },
    rentals: { Icon: Chair, color: "info.light" },
    transportation: { Icon: DirectionsCar, color: "info.dark" },
    planner: { Icon: Assignment, color: "success.dark" },
    coordinator: { Icon: Assignment, color: "success.dark" },
    invitations: { Icon: Email, color: "warning.light" },
    stationery: { Icon: Email, color: "warning.light" },
  };
  
  function getCategoryConfig(category: string) {
    const key = category.toLowerCase();
    for (const [k, v] of Object.entries(categoryConfig)) {
      if (key.includes(k)) return v;
    }
    return { Icon: VendorsIcon, color: "text.secondary" };
  }

function VendorCard({ vendor }: { vendor: Vendor }) {
  const config = getCategoryConfig(vendor.category);

  const statusStyle = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return { backgroundColor: 'success.light', color: 'success.contrastText' };
      case "paid":
        return { backgroundColor: 'success.dark', color: 'success.contrastText' };
      case "contacted":
        return { backgroundColor: 'info.light', color: 'info.contrastText' };
      default:
        return { backgroundColor: 'warning.light', color: 'warning.contrastText' };
    }
  };

  const statusLabel = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return "Booked";
      case "paid":
        return "Paid";
      case "contacted":
        return "Contacted";
      case "researching":
        return "Researching";
      default:
        return "Researching";
    }
  };

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: config.color }}>
            <config.Icon />
          </Avatar>
        }
        title={vendor.name}
        subheader={vendor.category}
        action={
          <Chip label={statusLabel()} size="small" sx={statusStyle()} />
        }
      />
      <CardContent>
        {vendor.cost && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Total Cost</Typography>
            <Typography variant="h6">{formatCurrency(vendor.cost)}</Typography>
          </Box>
        )}
        <Grid container spacing={1}>
          {vendor.phone && (
            <Grid xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{vendor.phone}</Typography>
              </Box>
            </Grid>
          )}
          {vendor.email && (
            <Grid xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{vendor.email}</Typography>
              </Box>
            </Grid>
          )}
          {vendor.website && (
            <Grid xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon fontSize="small" color="action" />
                <Typography variant="body2" component="a" href={vendor.website} target="_blank" rel="noopener noreferrer">
                  {vendor.website}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
        {vendor.notes && (
            <Box sx={{mt: 2}}>
                <Typography variant="caption" color="text.secondary">{vendor.notes}</Typography>
            </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorsTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const [filter, setFilter] = useState<"all" | "booked" | "researching">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  // Update "time ago" display every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatDistanceToNow(new Date(lastRefresh), { addSuffix: true }));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Refresh when tab becomes visible
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

  const vendors = data?.vendors;
  const stats = vendors?.stats;
  const hasData = vendors && vendors.list.length > 0;

  // Filter vendors
  let filteredVendors = vendors?.list || [];
  if (filter === "booked") {
    filteredVendors = filteredVendors.filter(v => 
      v.status === "booked" || v.status === "confirmed" || v.status === "paid"
    );
  } else if (filter === "researching") {
    filteredVendors = filteredVendors.filter(v => 
      v.status === "researching" || v.status === "contacted" || !v.status
    );
  }

  // Group by category
  const byCategory = filteredVendors.reduce((acc, vendor) => {
    const cat = vendor.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(vendor);
    return acc;
  }, {} as Record<string, Vendor[]>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Vendors
          </Typography>
          <Typography color="text.secondary">
            Track your wedding vendors
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
            <VendorsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            No vendors yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Tell me about your vendors in chat and I'll track them here.
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
                        <Typography color="text.secondary" gutterBottom>Total Vendors</Typography>
                        <Typography variant="h5" component="div">{stats?.total || 0}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card data-testid="booked-card">
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom>Booked</Typography>
                        <Typography variant="h5" component="div" sx={{color: 'success.main'}}>{stats?.booked || 0}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom>Total Cost</Typography>
                        <Typography variant="h5" component="div">{stats?.totalCost ? formatCurrency(stats.totalCost) : "$0"}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom>Deposits Paid</Typography>
                        <Typography variant="h5" component="div">{stats?.totalDeposits ? formatCurrency(stats.totalDeposits) : "$0"}</Typography>
                    </CardContent>
                </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Box sx={{ mb: 4 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(e, newValue) => setFilter(newValue)}
              aria-label="Filter by status"
            >
              <ToggleButton value="all" aria-label="all">All</ToggleButton>
              <ToggleButton value="booked" aria-label="booked">Booked</ToggleButton>
              <ToggleButton value="researching" aria-label="researching">Researching</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Vendor Cards by Category */}
          {Object.entries(byCategory).map(([category, categoryVendors]) => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>{category}</Typography>
              <Grid container spacing={2}>
                {categoryVendors.map((vendor) => (
                  <Grid xs={12} md={6} key={vendor.id}>
                    <VendorCard vendor={vendor} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {filteredVendors.length === 0 && (
            <Paper sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">No vendors match this filter</Typography>
            </Paper>
          )}

          {/* Help prompt */}
          <Paper elevation={0} sx={{ mt: 4, p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need to add or update a vendor?{" "}
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