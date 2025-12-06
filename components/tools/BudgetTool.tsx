"use client";

import React, { useState, useEffect } from "react";
import { usePlannerData, formatCurrency, BudgetItem } from "@/lib/hooks/usePlannerData";
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
  Alert
} from "@mui/material";
import { Refresh as RefreshIcon, History as ClockIcon, AccountBalanceWallet as BudgetIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export default function BudgetTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  // Update "time ago" display every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatDistanceToNow(new Date(lastRefresh), { addSuffix: true }));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Refresh when tab becomes visible (user switches back to this tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Only auto-refresh if data is older than 30 seconds
        if (Date.now() - lastRefresh > 30000) {
          console.log("[BudgetTool] Tab visible, refreshing stale data...");
          refetch();
        }
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

  const budget = data?.budget;
  const hasData = budget && budget.items.length > 0;
  const isOverBudget = budget && budget.total > 0 && budget.spent > budget.total;

  // Group items by category for summary
  const byCategory = (budget?.items || []).reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = { total: 0, paid: 0, items: [] };
    acc[cat].total += item.totalCost || 0;
    acc[cat].paid += item.amountPaid || 0;
    acc[cat].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; paid: number; items: BudgetItem[] }>);

  const categories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Budget
          </Typography>
          <Typography color="text.secondary">
            Track your wedding expenses
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
            <BudgetIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            No budget items yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Tell me about your wedding expenses in chat and I'll track them here.
          </Typography>
          <Button variant="contained" href="/">
            Go to chat
          </Button>
        </Paper>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Budget</Typography>
                  <Typography variant="h5" component="div">
                    {budget.total > 0 ? formatCurrency(budget.total) : "Not set"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ bgcolor: isOverBudget ? 'error.light' : 'background.paper' }}>
                <CardContent>
                  <Typography color={isOverBudget ? 'error.contrastText' : 'text.secondary'} gutterBottom>Allocated</Typography>
                  <Typography variant="h5" component="div" color={isOverBudget ? 'error.contrastText' : 'text.primary'}>
                    {formatCurrency(budget.spent)}
                  </Typography>
                  {budget.total > 0 && (
                     <Typography color={isOverBudget ? 'error.contrastText' : 'text.secondary'} sx={{mt: 1}}>
                      {budget.percentUsed}% of budget
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Paid So Far</Typography>
                  <Typography variant="h5" component="div" sx={{ color: 'success.main' }}>
                    {formatCurrency(budget.paid)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Still Owed</Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(budget.remaining)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Progress Bar */}
          {budget.total > 0 && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Budget used</Typography>
                  <Typography color={isOverBudget ? 'error' : 'text.secondary'}>
                    {budget.percentUsed}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budget.percentUsed, 100)}
                  color={isOverBudget ? "error" : budget.percentUsed > 90 ? "warning" : "primary"}
                />
                {isOverBudget && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Over budget by {formatCurrency(budget.spent - budget.total)}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          <Paper sx={{ mb: 4 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">By Category</Typography>
            </Box>
            <List>
              {categories.map(([category, data], index) => {
                const percentage = budget.spent > 0 
                  ? Math.round((data.total / budget.spent) * 100) 
                  : 0;
                
                return (
                  <React.Fragment key={category}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        <Chip label={category} size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {data.items.length} item{data.items.length !== 1 ? "s" : ""}
                        </Typography>
                        <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                          <Typography>{formatCurrency(data.total)}</Typography>
                          <Typography variant="body2" color="text.secondary">{percentage}% of total</Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < categories.length -1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>

          {/* All Items */}
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">All Items</Typography>
            </Box>
            <List>
              {budget.items.map((item, index) => {
                const isPaidInFull = item.amountPaid >= item.totalCost;
                
                return (
                  <React.Fragment key={item.id}>
                    <ListItem>
                      <ListItemText
                        primary={item.vendor || item.category}
                        secondary={item.notes || `Category: ${item.category}`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography>{formatCurrency(item.totalCost)}</Typography>
                        {item.amountPaid > 0 && (
                          <Typography variant="body2" color={isPaidInFull ? 'success.main' : 'text.secondary'}>
                            {isPaidInFull ? "Paid in full" : `${formatCurrency(item.amountPaid)} paid`}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                    {index < budget.items.length -1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>

          {/* Help prompt */}
          <Paper elevation={0} sx={{ mt: 4, p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need to add or update something?{" "}
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
