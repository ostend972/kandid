import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockResendSend,
  mockGetApplicationById,
  mockUpdateApplicationEmailStatus,
  mockGetApplicationFileBuffer,
} = vi.hoisted(() => ({
  mockResendSend: vi.fn(),
  mockGetApplicationById: vi.fn(),
  mockUpdateApplicationEmailStatus: vi.fn(),
  mockGetApplicationFileBuffer: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend };
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn().mockResolvedValue({
    id: 'user_test',
    fullName: 'Test User',
    firstName: 'Test',
  }),
}));

vi.mock('@/lib/db/kandid-queries', () => ({
  getApplicationById: (...args: unknown[]) => mockGetApplicationById(...args),
  updateApplicationEmailStatus: (...args: unknown[]) => mockUpdateApplicationEmailStatus(...args),
}));

vi.mock('@/lib/storage/cv-upload', () => ({
  getApplicationFileBuffer: (...args: unknown[]) => mockGetApplicationFileBuffer(...args),
}));

import { POST } from '@/app/api/applications/[id]/send-email/route';
import { NextRequest } from 'next/server';

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/applications/app1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const mockParams = Promise.resolve({ id: 'app1' });

const fakeApp = {
  id: 'app1',
  userId: 'user_test',
  jobTitle: 'Dev Frontend',
  jobCompany: 'ACME SA',
  dossierUrl: 'user_test/app1/dossier.pdf',
};

describe('POST /api/applications/[id]/send-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApplicationById.mockResolvedValue(fakeApp);
    mockGetApplicationFileBuffer.mockResolvedValue(Buffer.from('fake-pdf'));
    mockUpdateApplicationEmailStatus.mockResolvedValue(fakeApp);
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn: TimerHandler) => {
      if (typeof fn === 'function') fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  it('sends email successfully on first attempt', async () => {
    mockResendSend.mockResolvedValueOnce({ id: 'email_123' });
    const res = await POST(makeRequest({ recipientEmail: 'recruiter@test.ch' }), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.emailSendStatus).toBe('sent');
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockUpdateApplicationEmailStatus).toHaveBeenCalledWith('app1', 'user_test', 'sent', 'recruiter@test.ch', 1);
  });

  it('retries and succeeds on third attempt', async () => {
    mockResendSend
      .mockRejectedValueOnce(new Error('Resend 500'))
      .mockRejectedValueOnce(new Error('Resend 429'))
      .mockResolvedValueOnce({ id: 'email_456' });

    const res = await POST(makeRequest({ recipientEmail: 'recruiter@test.ch' }), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockResendSend).toHaveBeenCalledTimes(3);
    expect(mockUpdateApplicationEmailStatus).toHaveBeenCalledWith('app1', 'user_test', 'sent', 'recruiter@test.ch', 3);
  });

  it('fails after 3 retries and sets status to failed', async () => {
    mockResendSend
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new Error('500'))
      .mockRejectedValueOnce(new Error('500'));

    const res = await POST(makeRequest({ recipientEmail: 'recruiter@test.ch' }), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.emailSendStatus).toBe('failed');
    expect(mockResendSend).toHaveBeenCalledTimes(3);
    expect(mockUpdateApplicationEmailStatus).toHaveBeenCalledWith('app1', 'user_test', 'failed', 'recruiter@test.ch', 3);
  });

  it('rejects invalid email format', async () => {
    const res = await POST(makeRequest({ recipientEmail: 'not-an-email' }), { params: mockParams });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('email');
  });

  it('rejects missing email', async () => {
    const res = await POST(makeRequest({}), { params: mockParams });
    expect(res.status).toBe(400);
  });

  it('rejects empty string email', async () => {
    const res = await POST(makeRequest({ recipientEmail: '' }), { params: mockParams });
    expect(res.status).toBe(400);
  });

  it('returns 400 when application has no dossierUrl', async () => {
    mockGetApplicationById.mockResolvedValueOnce({ ...fakeApp, dossierUrl: null });
    const res = await POST(makeRequest({ recipientEmail: 'test@test.ch' }), { params: mockParams });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('dossier');
  });

  it('returns 404 when application not found', async () => {
    mockGetApplicationById.mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ recipientEmail: 'test@test.ch' }), { params: mockParams });
    expect(res.status).toBe(404);
  });

  it('returns 500 when PDF download fails', async () => {
    mockGetApplicationFileBuffer.mockRejectedValueOnce(new Error('Download failed'));
    const res = await POST(makeRequest({ recipientEmail: 'test@test.ch' }), { params: mockParams });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.emailSendStatus).toBe('failed');
  });
});
