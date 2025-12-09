import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import CalendarTool from '../CalendarTool';
import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by FullCalendar
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock browser context
jest.mock('@/components/layout/browser-context', () => ({
  useBrowser: () => ({
    goHome: jest.fn(),
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock FullCalendar
jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    return (
      <div data-testid="full-calendar-mock" ref={ref}>
        {props.events && props.events.map((e: any) => (
          <div key={e.id}>{e.title}</div>
        ))}
      </div>
    );
  });
});

jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@fullcalendar/list', () => ({}));

// Mock fetch
global.fetch = jest.fn();

describe('CalendarTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    (global.fetch as jest.Mock).mockImplementation(() => fetchPromise);

    render(<CalendarTool initialEvents={[]} />); // Added initialEvents={[]}
    
    // Check for loading spinner using the testId we just added
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Cleanup to prevent open handles
    resolveFetch({ ok: true, json: async () => ({ events: [] }) });
    await act(async () => {}); 
  });

  it('renders the calendar and events after data load', async () => {
    const mockEvents = {
      events: [
        {
          id: '1',
          title: 'Test Wedding Event',
          startTime: new Date().toISOString(), // Today
          category: 'milestone',
          description: 'Testing',
        },
      ],
    };

    const mockStatus = {
      connected: false
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

    await act(async () => {
      render(<CalendarTool initialEvents={[]} />); // Added initialEvents={[]}
    });

    // Check for title
    await waitFor(() => {
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    // Check if our mock calendar rendered the event
    await waitFor(() => {
        expect(screen.getByText('Test Wedding Event')).toBeInTheDocument();
    });
  });

  it('renders empty state when no events', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ connected: false }),
      });

    await act(async () => {
      render(<CalendarTool initialEvents={[]} />); // Added initialEvents={[]}
    });

    await waitFor(() => {
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });
    
    // Check if the mock calendar is present
    expect(screen.getByTestId('full-calendar-mock')).toBeInTheDocument();
  });
});
