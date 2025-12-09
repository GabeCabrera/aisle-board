import { syncCalendar } from '../sync-engine';
import {
  getGoogleCalendarConnection,
  getCalendarEventsByTenantId,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  updateGoogleCalendarConnection,
  createCalendarSyncLog,
  getCalendarEventByGoogleId
} from '@/lib/db/queries';
import {
  listGoogleEvents,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent
} from '../google-client';

// Mock DB queries
jest.mock('@/lib/db/queries', () => ({
  getGoogleCalendarConnection: jest.fn(),
  getCalendarEventsByTenantId: jest.fn(),
  getCalendarEventByGoogleId: jest.fn(),
  createCalendarEvent: jest.fn(),
  updateCalendarEvent: jest.fn(),
  deleteCalendarEvent: jest.fn(),
  updateGoogleCalendarConnection: jest.fn(),
  createCalendarSyncLog: jest.fn()
}));

// Mock Google Client
jest.mock('../google-client', () => ({
  listGoogleEvents: jest.fn(),
  createGoogleEvent: jest.fn(),
  updateGoogleEvent: jest.fn(),
  deleteGoogleEvent: jest.fn()
}));

describe('Sync Engine', () => {
  const tenantId = 'test-tenant';
  const calendarId = 'test-calendar-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sync successfully when connection exists', async () => {
    // Mock connection
    (getGoogleCalendarConnection as jest.Mock).mockResolvedValue({
      tenantId,
      weddingCalendarId: calendarId,
      syncEnabled: true,
      syncToken: 'old-token'
    });

    // Mock local events (1 synced, 1 local-only)
    (getCalendarEventsByTenantId as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Synced Event', syncStatus: 'synced', googleEventId: 'g1' },
      { id: '2', title: 'New Event', syncStatus: 'local', startTime: new Date() }
    ]);

    // Mock Google responses
    (createGoogleEvent as jest.Mock).mockResolvedValue({
      googleEventId: 'g2',
      etag: 'new-etag'
    });

    (listGoogleEvents as jest.Mock).mockResolvedValue({
      events: [],
      nextSyncToken: 'new-token'
    });

    const result = await syncCalendar(tenantId);

    expect(result.success).toBe(true);
    // Should create the local event in Google
    expect(createGoogleEvent).toHaveBeenCalledWith(tenantId, calendarId, expect.objectContaining({
      title: 'New Event'
    }));
    // Should update local event with Google ID
    expect(updateCalendarEvent).toHaveBeenCalledWith('2', tenantId, expect.objectContaining({
      googleEventId: 'g2',
      syncStatus: 'synced'
    }));
    // Should update sync token
    expect(updateGoogleCalendarConnection).toHaveBeenCalledWith(tenantId, expect.objectContaining({
      syncToken: 'new-token'
    }));
  });

  it('should pull new events from Google', async () => {
    // Mock connection
    (getGoogleCalendarConnection as jest.Mock).mockResolvedValue({
      tenantId,
      weddingCalendarId: calendarId,
      syncEnabled: true
    });

    // Mock local events (empty)
    (getCalendarEventsByTenantId as jest.Mock).mockResolvedValue([]);

    // Mock Google responses
    (listGoogleEvents as jest.Mock).mockResolvedValue({
      events: [
        { id: 'g3', summary: 'Google Event', start: { dateTime: new Date().toISOString() } }
      ],
      nextSyncToken: 'token-2'
    });

    // Mock lookup - event doesn't exist locally
    (getCalendarEventByGoogleId as jest.Mock).mockResolvedValue(null);

    const result = await syncCalendar(tenantId);

    expect(result.success).toBe(true);
    expect(result.pulled).toBe(1);
    // Should create local event
    expect(createCalendarEvent).toHaveBeenCalledWith(expect.objectContaining({
      googleEventId: 'g3',
      title: 'Google Event'
    }));
  });
});
