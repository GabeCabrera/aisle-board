"use client";

import React from "react";
import { usePlannerData, TimelineEvent } from "@/lib/hooks/usePlannerData";
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Paper,
  Button,
  Grid,
  Chip,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import {
  AccessTime as TimeIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Cake as ReceptionIcon,
  Favorite as CeremonyIcon,
  LocalBar as CocktailIcon,
  Star as OtherIcon,
  Home as PrepIcon,
} from "@mui/icons-material";
import { useBrowser } from "@/components/layout/browser-context";
import TimelineEventCard, { formatTime } from './TimelineEventCard';

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "prep":
      return <PrepIcon sx={{ color: "primary.main" }} />;
    case "ceremony":
      return <CeremonyIcon sx={{ color: "error.main" }} />;
    case "cocktail hour":
      return <CocktailIcon sx={{ color: "warning.main" }} />;
    case "reception":
      return <ReceptionIcon sx={{ color: "success.main" }} />;
    default:
      return <OtherIcon sx={{ color: "info.main" }} />;
  }
};

const categoryOrder = ["Prep", "Ceremony", "Cocktail Hour", "Reception", "Other"];


export default function TimelineTool() {
  const { data, loading } = usePlannerData();
  const browser = useBrowser();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const events = data?.timeline?.events || [];
  const hasData = events.length > 0;
  const weddingDate = data?.summary?.weddingDate;

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeA.localeCompare(timeB);
  });

  // Group by category
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const category = event.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const orderedCategories = categoryOrder.filter(cat => groupedEvents[cat]?.length > 0);
  Object.keys(groupedEvents).forEach(cat => {
    if (!orderedCategories.includes(cat)) orderedCategories.push(cat);
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Wedding Day Timeline
        </Typography>
        <Typography color="text.secondary">
          {weddingDate
            ? `Your schedule for ${new Date(weddingDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`
            : "Your day-of schedule"}
        </Typography>
      </Box>

      {!hasData ? (
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
            <TimeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            No timeline events yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Tell me about your wedding day schedule in chat and I&apos;ll build your timeline.
          </Typography>
          <Button variant="contained" onClick={() => browser.goHome()}>
            Go to chat
          </Button>

          <Paper variant="outlined" sx={{ mt: 4, p: 2, textAlign: 'left', bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Example things to tell me:</Typography>
            <Typography variant="body2" component="ul" sx={{ listStyleType: 'disc', pl: 2 }}>
              <li>"Ceremony starts at 4pm"</li>
              <li>"Hair and makeup from 10am to 1pm"</li>
              <li>"First dance right after dinner"</li>
              <li>"We want to do a sparkler exit at 10pm"</li>
            </Typography>
          </Paper>
        </Paper>
      ) : (
        <Timeline position="right" sx={{ '& .MuiTimelineItem-missingOppositeContent:before': { display: 'none' } }}>
          {orderedCategories.map((category) => (
            <React.Fragment key={category}>
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="primary">
                    {getCategoryIcon(category)}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Typography variant="h6" component="h2">
                    {category}
                  </Typography>
                </TimelineContent>
              </TimelineItem>

              {groupedEvents[category].map((event, index) => (
                <TimelineItem key={event.id || index}>
                  <TimelineSeparator>
                    <TimelineDot variant="outlined" color="grey" />
                    {index < groupedEvents[category].length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <TimelineEventCard event={event} />
                  </TimelineContent>
                </TimelineItem>
              ))}
            </React.Fragment>
          ))}
        </Timeline>
      )}

      <Paper elevation={0} sx={{ mt: 4, p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Need to add or adjust your timeline?{" "}
          <Button component="a" onClick={() => browser.goHome()} sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
            Tell me in chat
          </Button>
        </Typography>
      </Paper>
    </Container>
  );
}