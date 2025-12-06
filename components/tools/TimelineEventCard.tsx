import React from "react";
import { TimelineEvent } from "@/lib/hooks/usePlannerData"; // Assuming TimelineEvent type is also exported or defined globally
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

// Moved formatTime out of the component for better testability and to fix `this` context
export function formatTime(time: string | undefined): string {
  if (!time) return "";

  try {
    const [hours, minutes] = time.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const date = new Date(); // Create a new Date object
      date.setHours(hours);
      date.setMinutes(minutes);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
  } catch (e) {
    console.error("Failed to parse time with Intl:", e);
  }

  const parts = time.split(':');
  if (parts.length === 2) {
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  return time;
}

export default function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Grid container spacing={1} alignItems="center">
        <Grid size={{ xs: 12, sm: 3 }}>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, pr: { sm: 2 } }}>
            <Typography variant="h6" component="p" sx={{ mb: 0.5 }}>
              {formatTime(event.time)}
            </Typography>
            {event.duration && (
              <Typography variant="body2" color="text.secondary">
                {event.duration} min
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 9 }}>
          <Typography variant="h6" component="h3">
            {event.title}
          </Typography>
          {event.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {event.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {event.location && (
              <Chip
                icon={<LocationIcon sx={{ fontSize: 16 }} />}
                label={event.location}
                size="small"
                variant="outlined"
              />
            )}
            {event.vendor && (
              <Chip
                icon={<PersonIcon sx={{ fontSize: 16 }} />}
                label={event.vendor}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}