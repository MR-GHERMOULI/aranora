import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

/**
 * Configure Lemon Squeezy SDK
 */
export const setupLemonSqueezy = () => {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ LEMONSQUEEZY_API_KEY is not set.');
    }
    return;
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error('Lemon Squeezy Error:', error);
    },
  });
};

export const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';

export const LEMONSQUEEZY_VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY_ID || '',
  yearly: process.env.LEMONSQUEEZY_VARIANT_YEARLY_ID || '',
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
