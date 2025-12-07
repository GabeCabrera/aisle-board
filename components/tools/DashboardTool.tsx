"use client";

import { useState, useEffect } from "react";
import { usePlannerData, formatCurrency } from "@/lib/hooks/usePlannerData";
import { useBrowser } from "@/components/layout/browser-context";

// Helper to format time ago
function formatTimeAgo(timestamp: number): string {
  if (timestamp === 0) return "never"; // Handle initial state
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export default function DashboardTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const browser = useBrowser();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatTimeAgo(lastRefresh));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh > 30000
      ) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [lastRefresh, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleToolClick = (toolId: string) => {
    browser.openTool(toolId);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const summary = data?.summary;
  const budget = data?.budget;
  const guests = data?.guests;
  const vendors = data?.vendors;
  const decisions = data?.decisions;
  const kernel = data?.kernel;

  const alerts: Array<{
    type: "warning" | "info" | "success";
    message: string;
    toolId?: string;
  }> = [];

  // Calculate alerts/priorities
  // Budget alerts
  if (budget && budget.total > 0 && budget.percentUsed > 100) {
    alerts.push({
      type: "warning",
      message: `You're over budget by ${formatCurrency(
        budget.spent - budget.total
      )}`,
      toolId: "budget",
    });
  } else if (budget && budget.total > 0 && budget.percentUsed > 90) {
    alerts.push({
      type: "warning",
      message: `Budget is ${budget.percentUsed}% allocated`,
      toolId: "budget",
    });
  }

  // Vendor alerts
  const essentialVendors = ["venue", "photographer", "catering", "officiant"];
  const bookedCategories =
    vendors?.list
      .filter(
        (v) =>
          v.status === "booked" || v.status === "confirmed" || v.status === "paid"
      )
      .map((v) => v.category.toLowerCase()) || [];

  const missingEssentials = essentialVendors.filter(
    (v) => !bookedCategories.some((b) => b.includes(v))
  );
  if (missingEssentials.length > 0 && summary?.daysUntil && summary.daysUntil < 180) {
    alerts.push({
      type: "warning",
      message: `Still need to book: ${missingEssentials.join(", ")}`,
      toolId: "vendors",
    });
  }

  // Guest alerts
  if (
    guests &&
    guests.stats.total > 0 &&
    guests.stats.pending > 0 &&
    summary?.daysUntil &&
    summary.daysUntil < 60
  ) {
    alerts.push({
      type: "info",
      message: `${guests.stats.pending} guests haven't RSVP'd yet`,
      toolId: "guests",
    });
  }

  // Success alerts
  if (vendors && vendors.stats.booked >= 3) {
    alerts.push({
      type: "success",
      message: `${vendors.stats.booked} vendors booked!`,
      toolId: "vendors",
    });
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {summary?.coupleNames || "Your Wedding"}
          </Typography>
          {summary?.weddingDate && (
            <Typography color="text.secondary">
              {(() => {
                const dateStr = summary.weddingDate;
                const date = dateStr.includes("T")
                  ? new Date(dateStr)
                  : new Date(dateStr + "T12:00:00");
                return date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              })()}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <ClockIcon sx={{ fontSize: "1rem" }} />
            Updated {timeAgo}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon className={isRefreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <List disablePadding>
            {alerts.map((alert, i) => (
              <ListItem
                key={i}
                button
                onClick={() => handleToolClick(alert.toolId || "dashboard")}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  "&:last-child": { mb: 0 },
                }}
                disablePadding
              >
                <Alert
                  severity={alert.type}
                  iconMapping={{
                    warning: <WarningIcon />,
                    info: <InfoIcon />,
                    success: <CheckCircleIcon />,
                  }}
                  sx={{ width: "100%" }}
                >
                  {alert.message}
                </Alert>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Main Wedding Hub Grid */}
      <Grid container spacing={3}>
        {/* Checklist */}
        <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => handleToolClick("checklist")} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Checklist
                        </Typography>
                        {decisions?.progress ? (
                            <>
                                <Typography variant="h4" component="p">
                                    {decisions.progress.percentComplete}%
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={decisions.progress.percentComplete}
                                    sx={{ mt: 1, height: 8, borderRadius: 5 }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {decisions.progress.decided} of {decisions.progress.total} decisions
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h6" color="text.secondary">
                                Start planning
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>

        {/* Budget */}
        <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => handleToolClick("budget")} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Budget
                        </Typography>
                        {budget && budget.total > 0 ? (
                            <>
                                <Typography variant="h4" component="p">
                                    {formatCurrency(budget.total)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {formatCurrency(budget.spent)} allocated ({budget.percentUsed}%)
                                </Typography>
                            </>
                        ) : budget && budget.spent > 0 ? (
                            <>
                                <Typography variant="h4" component="p">
                                    {formatCurrency(budget.spent)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    allocated so far
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h6" color="text.secondary">
                                Not set
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>

        {/* Guests */}
        <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => handleToolClick("guests")} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Guests
                        </Typography>
                        {guests && guests.stats.total > 0 ? (
                            <>
                                <Typography variant="h4" component="p">
                                    {guests.stats.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {guests.stats.confirmed} confirmed, {guests.stats.pending} pending
                                </Typography>
                            </>
                        ) : kernel?.guestCount ? (
                            <>
                                <Typography variant="h4" component="p">
                                    ~{kernel.guestCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    estimated
                                </Typography>
                            </>
                        ) : (
                            <Typography variant="h6" color="text.secondary">
                                Not set
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>

        {/* Vendors */}
        <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => handleToolClick("vendors")} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Vendors
                        </Typography>
                        {vendors && vendors.list && vendors.list.length > 0 ? (
                             <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                             {vendors.list.slice(0, 4).map((vendor) => {
                               const isBooked =
                                 vendor.status === "booked" ||
                                 vendor.status === "confirmed" ||
                                 vendor.status === "paid";
                               return (
                                 <Chip
                                   key={vendor.id}
                                   label={vendor.name}
                                   icon={isBooked ? <CheckCircleIcon /> : undefined}
                                   color={isBooked ? "success" : "default"}
                                   variant={isBooked ? "filled" : "outlined"}
                                   size="small"
                                 />
                               );
                             })}
                             {vendors.list.length > 4 && (
                               <Chip
                                 label={`+${vendors.list.length - 4} more`}
                                 variant="outlined"
                                 size="small"
                               />
                             )}
                           </Box>
                        ) : (
                            <Typography variant="h6" color="text.secondary">
                                No vendors yet
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
