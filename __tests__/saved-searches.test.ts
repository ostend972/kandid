import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockResendSend,
  mockGetSavedSearchesWithAlerts,
  mockSearchJobs,
  mockUpdateSavedSearchAlertState,
} = vi.hoisted(() => ({
  mockResendSend: vi.fn(),
  mockGetSavedSearchesWithAlerts: vi.fn(),
  mockSearchJobs: vi.fn(),
  mockUpdateSavedSearchAlertState: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend };
  },
}));

vi.mock('@/lib/db/kandid-queries', () => ({
  getSavedSearchesWithAlerts: (...args: unknown[]) => mockGetSavedSearchesWithAlerts(...args),
  searchJobs: (...args: unknown[]) => mockSearchJobs(...args),
  updateSavedSearchAlertState: (...args: unknown[]) => mockUpdateSavedSearchAlertState(...args),
  getSavedSearches: vi.fn().mockResolvedValue([]),
  createSavedSearch: vi.fn().mockResolvedValue({ id: 'ss-1', name: 'Test', filters: {} }),
  updateSavedSearch: vi.fn().mockResolvedValue({ id: 'ss-1' }),
  deleteSavedSearch: vi.fn().mockResolvedValue({ id: 'ss-1' }),
}));

vi.mock('@/lib/db/drizzle', () => ({
  db: {},
}));

import { GET } from '@/app/api/cron/search-alerts/route';
import { NextRequest } from 'next/server';

function makeCronRequest(secret?: string): NextRequest {
  const url = secret
    ? `http://localhost:3000/api/cron/search-alerts?secret=${secret}`
    : 'http://localhost:3000/api/cron/search-alerts';
  return new NextRequest(url);
}

function makeCronRequestWithHeader(secret: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/cron/search-alerts', {
    headers: { authorization: `Bearer ${secret}` },
  });
}

const CRON_SECRET = 'test-cron-secret';

describe('Cron: search-alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
  });

  describe('Authentication', () => {
    it('returns 401 without secret', async () => {
      const res = await GET(makeCronRequest());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 with wrong secret', async () => {
      const res = await GET(makeCronRequest('wrong-secret'));
      expect(res.status).toBe(401);
    });

    it('accepts query param secret', async () => {
      mockGetSavedSearchesWithAlerts.mockResolvedValue([]);
      const res = await GET(makeCronRequest(CRON_SECRET));
      expect(res.status).toBe(200);
    });

    it('accepts Bearer token', async () => {
      mockGetSavedSearchesWithAlerts.mockResolvedValue([]);
      const res = await GET(makeCronRequestWithHeader(CRON_SECRET));
      expect(res.status).toBe(200);
    });

    it('returns 500 when CRON_SECRET not configured', async () => {
      vi.stubEnv('CRON_SECRET', '');
      const res = await GET(makeCronRequest('any'));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('CRON_SECRET not configured');
    });
  });

  describe('Processing', () => {
    const mockSearch = {
      id: 'ss-1',
      userId: 'user-1',
      name: 'Dev Zurich',
      filters: { cantons: ['ZH'], query: 'developer' },
      emailAlertEnabled: true,
      lastAlertAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      lastAlertJobCount: 5,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      userEmail: 'user@example.com',
      userFullName: 'Jean Dupont',
    };

    it('sends alert when new jobs found', async () => {
      mockGetSavedSearchesWithAlerts.mockResolvedValue([mockSearch]);
      mockSearchJobs.mockResolvedValue({
        jobs: [
          { id: 'j1', title: 'Dev React', company: 'Acme', canton: 'ZH' },
          { id: 'j2', title: 'Dev Node', company: 'Corp', canton: 'ZH' },
          { id: 'j3', title: 'Dev Python', company: 'Startup', canton: 'ZH' },
        ],
        total: 3,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      mockResendSend.mockResolvedValue({ id: 'email-1' });
      mockUpdateSavedSearchAlertState.mockResolvedValue(mockSearch);

      const res = await GET(makeCronRequest(CRON_SECRET));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.processed).toBe(1);
      expect(body.alerted).toBe(1);
      expect(body.errors).toHaveLength(0);
      expect(mockResendSend).toHaveBeenCalledOnce();
      expect(mockUpdateSavedSearchAlertState).toHaveBeenCalledWith('ss-1', 3);
    });

    it('skips searches with no new results', async () => {
      mockGetSavedSearchesWithAlerts.mockResolvedValue([mockSearch]);
      mockSearchJobs.mockResolvedValue({
        jobs: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const res = await GET(makeCronRequest(CRON_SECRET));
      const body = await res.json();

      expect(body.processed).toBe(1);
      expect(body.alerted).toBe(0);
      expect(mockResendSend).not.toHaveBeenCalled();
      expect(mockUpdateSavedSearchAlertState).not.toHaveBeenCalled();
    });

    it('continues processing when one search fails', async () => {
      const search2 = { ...mockSearch, id: 'ss-2', name: 'Dev Bern' };
      mockGetSavedSearchesWithAlerts.mockResolvedValue([mockSearch, search2]);
      mockSearchJobs
        .mockRejectedValueOnce(new Error('DB connection lost'))
        .mockResolvedValueOnce({
          jobs: [{ id: 'j1', title: 'Dev', company: 'Co', canton: 'BE' }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      mockResendSend.mockResolvedValue({ id: 'email-1' });
      mockUpdateSavedSearchAlertState.mockResolvedValue(search2);

      const res = await GET(makeCronRequest(CRON_SECRET));
      const body = await res.json();

      expect(body.processed).toBe(2);
      expect(body.alerted).toBe(1);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].searchId).toBe('ss-1');
      expect(body.errors[0].error).toBe('DB connection lost');
    });

    it('does not update lastAlertAt when email fails', async () => {
      mockGetSavedSearchesWithAlerts.mockResolvedValue([mockSearch]);
      mockSearchJobs.mockResolvedValue({
        jobs: [{ id: 'j1', title: 'Dev', company: 'Co', canton: 'ZH' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      mockResendSend.mockRejectedValue(new Error('Resend rate limited'));

      const res = await GET(makeCronRequest(CRON_SECRET));
      const body = await res.json();

      expect(body.alerted).toBe(0);
      expect(body.errors).toHaveLength(1);
      expect(mockUpdateSavedSearchAlertState).not.toHaveBeenCalled();
    });
  });

  describe('Function signatures', () => {
    it('getSavedSearches / createSavedSearch / updateSavedSearch / deleteSavedSearch are importable', async () => {
      const queries = await import('@/lib/db/kandid-queries');
      expect(typeof queries.getSavedSearches).toBe('function');
      expect(typeof queries.createSavedSearch).toBe('function');
      expect(typeof queries.updateSavedSearch).toBe('function');
      expect(typeof queries.deleteSavedSearch).toBe('function');
      expect(typeof queries.getSavedSearchesWithAlerts).toBe('function');
      expect(typeof queries.updateSavedSearchAlertState).toBe('function');
    });
  });
});
