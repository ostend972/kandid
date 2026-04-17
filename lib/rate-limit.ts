import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function createLimiter(requests: number, window: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    analytics: false,
  });
}

const limiters = {
  ai: createLimiter(10, '1 h'),
  email: createLimiter(5, '1 h'),
  default: createLimiter(30, '1 m'),
} as const;

type LimiterType = keyof typeof limiters;

export async function checkRateLimit(
  identifier: string,
  type: LimiterType = 'default'
): Promise<NextResponse | null> {
  const limiter = limiters[type];
  if (!limiter) return null;

  const { success, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: 'Trop de requetes. Veuillez reessayer plus tard.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return null;
}
