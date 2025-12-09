import { executeToolCall, ToolContext } from '../executor';
import { db } from '@/lib/db';
import { pages } from '@/lib/db/schema'; // Import pages for the mock

// Mock DB
jest.mock('@/lib/db', () => ({
  db: {
    query: {
      weddingKernels: { findFirst: jest.fn() },
      planners: { findFirst: jest.fn() },
      pages: { findFirst: jest.fn(), findMany: jest.fn() }
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'mock-id' }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis()
  }
}));

// Mock decisions
jest.mock('../decisions', () => ({
  updateDecision: jest.fn().mockResolvedValue({ success: true }),
  initializeDecisionsForTenant: jest.fn(),
  getAllDecisions: jest.fn().mockResolvedValue([]),
  getDecisionProgress: jest.fn().mockResolvedValue({})
}));

describe('Budget Tool Logic', () => {
  const mockContext: ToolContext = {
    tenantId: 'test-tenant-id',
    userId: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete budget item by fuzzy vendor name', async () => {
    // Mock existing budget page
    (db.query.pages.findFirst as jest.Mock).mockResolvedValue({
      id: 'budget-page-id',
      fields: {
        items: [
          { id: '1', vendor: 'Bloom & Co', category: 'florist', totalCost: '200000' },
          { id: '2', vendor: 'The Cake Shop', category: 'cake', totalCost: '50000' }
        ]
      }
    });

    const result = await executeToolCall('delete_budget_item', { vendor: 'bloom' }, mockContext);

    expect(result.success).toBe(true);
    // Check that update was called with the filtered list
    const updateCall = (db.update as jest.Mock).mock.calls[0];
    const setCall = (db.update(pages).set as jest.Mock).mock.calls[0]; // Updated to use 'pages'
    
    // The set call argument should contain the new items list
    const newItems = setCall[0].fields.items;
    expect(newItems).toHaveLength(1);
    expect(newItems[0].vendor).toBe('The Cake Shop');
  });

  it('should delete ghost item with undefined ID', async () => {
    (db.query.pages.findFirst as jest.Mock).mockResolvedValue({
      id: 'budget-page-id',
      fields: {
        items: [
          { id: 'undefined', vendor: 'Ghost Item', category: 'rings', totalCost: '7000' },
          { id: 'valid-id', vendor: 'Real Item', category: 'venue', totalCost: '500000' }
        ]
      }
    });

    const result = await executeToolCall('delete_budget_item', { itemId: 'undefined' }, mockContext);

    expect(result.success).toBe(true);
    const setCall = (db.update(pages).set as jest.Mock).mock.calls[0]; // Updated to use 'pages'
    const newItems = setCall[0].fields.items;
    expect(newItems).toHaveLength(1);
    expect(newItems[0].id).toBe('valid-id');
  });
});