const mockConstructEvent = jest.fn();

const Stripe = jest.fn(() => ({
  webhooks: {
    constructEvent: mockConstructEvent,
  },
}));

(Stripe as any).mockConstructEvent = mockConstructEvent;

export default Stripe;