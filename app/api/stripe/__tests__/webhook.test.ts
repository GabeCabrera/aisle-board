import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Use manual mock for Stripe
jest.mock('stripe');

// Import route AFTER mocking
import { POST } from '../webhook/route';

// Access the shared mock function exposed by __mocks__/stripe.ts
const mockConstructEvent = (Stripe as any).mockConstructEvent;

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => {
        return {
          status: init?.status || 200,
          json: async () => body,
        };
      }),
    },
  };
});

// Mock Drizzle methods
const mockWhere = jest.fn().mockResolvedValue({});
const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
const mockFrom = jest.fn().mockReturnThis();
const mockSelectWhere = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockResolvedValue([]);

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(() => ({ 
      from: mockFrom, 
      where: mockSelectWhere,
      limit: mockLimit
    })),
    update: jest.fn(() => ({ 
      set: mockSet 
    })),
    insert: jest.fn(() => ({ 
      values: jest.fn(() => ({ returning: jest.fn() })) 
    })),
  },
}));

describe('Stripe Webhook API', () => {
  const mockStripeSecret = 'whsec_test_secret';
  const mockTenantId = 'tenant-abc';
  const mockCustomerId = 'cus_123';
  const mockSubscriptionId = 'sub_456';
  const mockPriceId = 'price_monthly'; 
  const mockProductMonthlyId = 'prod_monthly';

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = mockStripeSecret;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConstructEvent.mockClear();
    
    // Clear our custom Drizzle mocks
    mockSet.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();

    // Default select behavior: find tenant
    mockLimit.mockResolvedValue([
        { id: mockTenantId, stripeCustomerId: mockCustomerId, plan: 'free' }
    ]);
  });

  // Helper to map Stripe price ID to local plan type
  const getPlanTypeFromPriceId = (priceId: string): string => {
    switch (priceId) {
      case 'price_monthly': return 'monthly';
      case 'price_yearly': return 'yearly';
      case 'price_premium_monthly': return 'premium_monthly';
      case 'price_premium_yearly': return 'premium_yearly';
      default: return 'free';
    }
  };

  it('should handle checkout.session.completed event (legacy payment mode)', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_checkout',
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_123',
          object: 'checkout.session',
          customer: mockCustomerId,
          metadata: { tenantId: mockTenantId },
          mode: 'payment',
          payment_status: 'paid',
          status: 'complete',
        } as unknown as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
      type: 'checkout.session.completed',
    };

    mockConstructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'mock_signature' },
      body: JSON.stringify({}),
    });

    await POST(request);

    // Verify update was called on tenants table
    expect(db.update).toHaveBeenCalledWith(tenants);
    
    // Verify set was called with correct data
    expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
            hasLegacyAccess: true,
            stripeCustomerId: mockCustomerId,
        })
    );

    // Verify where was called with correct ID
    expect(mockWhere).toHaveBeenCalledWith(eq(tenants.id, mockTenantId));
  });

  it('should handle customer.subscription.updated event', async () => {
    const mockSubscription = {
      id: mockSubscriptionId,
      object: 'subscription',
      customer: mockCustomerId,
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      metadata: { tenantId: mockTenantId, billingCycle: 'monthly' },
      items: { data: [{ price: { id: mockPriceId, product: mockProductMonthlyId } }] },
      cancel_at_period_end: false,
    } as unknown as Stripe.Subscription;

    const mockEvent: Stripe.Event = {
      id: 'evt_subscription_updated',
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      data: { object: mockSubscription },
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
      type: 'customer.subscription.updated',
    };

    mockConstructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'mock_signature' },
      body: JSON.stringify({}),
    });

    await POST(request);

    expect(db.update).toHaveBeenCalledWith(tenants);
    
    expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
            stripeSubscriptionId: mockSubscriptionId,
            stripePriceId: mockPriceId,
            plan: 'monthly',
            subscriptionStatus: 'active',
            subscriptionEndsAt: new Date(mockSubscription.current_period_end * 1000)
        })
    );

    expect(mockWhere).toHaveBeenCalledWith(eq(tenants.id, mockTenantId));
  });

  it('should handle customer.subscription.deleted event', async () => {
    const mockSubscription = {
        id: mockSubscriptionId,
        object: 'subscription',
        customer: mockCustomerId,
        status: 'canceled',
        current_period_end: Math.floor(Date.now() / 1000) - 1,
        metadata: { tenantId: mockTenantId },
        items: { data: [{ price: { id: mockPriceId, product: mockProductMonthlyId } }] },
    } as unknown as Stripe.Subscription;

    const mockEvent: Stripe.Event = {
      id: 'evt_subscription_deleted',
      object: 'event',
      api_version: '2024-06-20',
      created: Math.floor(Date.now() / 1000),
      data: { object: mockSubscription },
      livemode: false,
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
      type: 'customer.subscription.deleted',
    };

    mockConstructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'mock_signature' },
      body: JSON.stringify({}),
    });

    await POST(request);

    expect(db.update).toHaveBeenCalledWith(tenants);
    
    expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
            plan: 'free',
            subscriptionStatus: 'canceled',
        })
    );

    expect(mockWhere).toHaveBeenCalledWith(eq(tenants.id, mockTenantId));
  });

  // ... (error cases)
});