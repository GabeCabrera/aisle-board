import { executeToolCall, ToolContext } from '../executor';
import { db } from '@/lib/db';

// Mock DB
jest.mock('@/lib/db', () => ({
  db: {
    query: {
      weddingKernels: {
        findFirst: jest.fn()
      },
      planners: {
        findFirst: jest.fn()
      },
      pages: {
        findFirst: jest.fn(),
        findMany: jest.fn()
      }
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis()
  }
}));

// Mock decisions module
jest.mock('../decisions', () => ({
  initializeDecisionsForTenant: jest.fn(),
  getAllDecisions: jest.fn().mockResolvedValue([]),
  getDecisionProgress: jest.fn().mockResolvedValue({ decided: 0, total: 10, locked: 0, percentComplete: 0 })
}));

describe('Planning Analysis Logic', () => {
  const mockContext: ToolContext = {
    tenantId: 'test-tenant-id',
    userId: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly identify booked vendors (case-insensitive)', async () => {
    // Mock kernel with wedding date
    (db.query.weddingKernels.findFirst as jest.Mock).mockResolvedValue({
      weddingDate: new Date('2025-12-25')
    });

    // Mock vendor page with booked venue
    (db.query.pages.findFirst as jest.Mock).mockImplementation((args) => {
      // If asking for vendor-contacts page
      return Promise.resolve({
        id: 'vendor-page-id',
        fields: {
          vendors: [
            {
              id: '1',
              name: 'Alpine Arts Center',
              category: 'Venue', // Capitalized
              status: 'booked'
            },
            {
              id: '2',
              name: 'John Smith',
              category: 'Photographer',
              status: 'Confirmed' // Different status string
            }
          ]
        }
      });
    });

    const result = await executeToolCall('analyze_planning_gaps', {}, mockContext);

    expect(result.success).toBe(true);
    const gaps = (result as any).data.gaps;
    
    // Should NOT have "No venue booked yet"
    expect(gaps.some((g: any) => g.issue.includes('No venue booked'))).toBe(false);
    // Should NOT have "No photographer booked yet"
    expect(gaps.some((g: any) => g.issue.includes('No photographer booked'))).toBe(false);
    
    // Should HAVE "No caterer booked yet" (since we didn't mock one)
    expect(gaps.some((g: any) => g.issue.includes('No caterer booked'))).toBe(true);
  });
});
