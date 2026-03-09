import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe features will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_ID || '',
  yearly: process.env.STRIPE_PRICE_YEARLY_ID || '',
} as const;

export const PLAN_DETAILS = {
  monthly: {
    name: 'Monthly Plan',
    price: 19,
    interval: 'month' as const,
    description: '$19/month',
  },
  yearly: {
    name: 'Annual Plan',
    price: 190,
    interval: 'year' as const,
    description: '$190/year (Save $38)',
  },
} as const;
