import { getTenantAccess, incrementAIUsage, DAILY_FREE_AI_MESSAGE_LIMIT } from '../subscription';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn() })) })),
    update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn() })) })),
  },
}));

describe('Subscription Logic', () => {
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Daily Reset', () => {
    it('should reset usage if reset date is from yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{
            id: mockTenantId,
            plan: 'free',
            aiMessagesUsed: 5,
            aiMessagesResetAt: yesterday,
            subscriptionStatus: null
          }])
        })
      });

      const access = await getTenantAccess(mockTenantId);
      
      expect(access?.aiMessagesUsed).toBe(0);
      expect(access?.aiMessagesRemaining).toBe(DAILY_FREE_AI_MESSAGE_LIMIT);
    });

    it('should NOT reset usage if reset date is today', async () => {
      const today = new Date();

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{
            id: mockTenantId,
            plan: 'free',
            aiMessagesUsed: 3,
            aiMessagesResetAt: today,
            subscriptionStatus: null
          }])
        })
      });

      const access = await getTenantAccess(mockTenantId);
      
      expect(access?.aiMessagesUsed).toBe(3);
      expect(access?.aiMessagesRemaining).toBe(DAILY_FREE_AI_MESSAGE_LIMIT - 3);
    });
  });
});
