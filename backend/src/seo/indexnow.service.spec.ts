import { BadRequestException } from '@nestjs/common';
import { IndexNowService } from './indexnow.service';
import { encryptSecret } from '../common/crypto';

describe('IndexNowService', () => {
  let service: IndexNowService;
  let prismaMock: any;
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    prismaMock = {
      integration: {
        findFirst: jest.fn(),
      },
    };
    service = new IndexNowService(prismaMock);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_HOST;
  });

  it('throws BadRequestException when no integration is configured', async () => {
    prismaMock.integration.findFirst.mockResolvedValue(null);
    await expect(service.resolveCredentials()).rejects.toThrow(BadRequestException);
  });

  it('resolves encrypted credentials from database', async () => {
    const creds = {
      host: 'glitz-holidays.in',
      apiKey: '7c3f84e09f874a9db4814c327fb2714f',
      keyLocation: 'https://glitz-holidays.in/indexnow.txt',
    };
    prismaMock.integration.findFirst.mockResolvedValue({
      provider: 'indexnow',
      isActive: true,
      credentials: encryptSecret(JSON.stringify(creds)),
    });

    const resolved = await service.resolveCredentials();
    expect(resolved.host).toBe('glitz-holidays.in');
    expect(resolved.apiKey).toBe('7c3f84e09f874a9db4814c327fb2714f');
  });

  it('submits URLs and handles HTTP 200 OK', async () => {
    const creds = {
      host: 'glitz-holidays.in',
      apiKey: '7c3f84e09f874a9db4814c327fb2714f',
    };
    prismaMock.integration.findFirst.mockResolvedValue({
      provider: 'indexnow',
      isActive: true,
      credentials: encryptSecret(JSON.stringify(creds)),
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: jest.fn().mockResolvedValue('OK'),
    });

    const res = await service.submitUrls(['/packages/classic-kashmir']);
    expect(res.ok).toBe(true);
    expect(res.submitted).toBe(1);
    expect(res.statusCode).toBe(200);
  });

  it('handles HTTP 202 Accepted response', async () => {
    const creds = {
      host: 'glitz-holidays.in',
      apiKey: '7c3f84e09f874a9db4814c327fb2714f',
    };
    prismaMock.integration.findFirst.mockResolvedValue({
      provider: 'indexnow',
      isActive: true,
      credentials: encryptSecret(JSON.stringify(creds)),
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 202,
      text: jest.fn().mockResolvedValue('Accepted'),
    });

    const res = await service.submitUrls(['https://glitz-holidays.in/guides/places-to-visit-in-kashmir']);
    expect(res.ok).toBe(true);
    expect(res.statusCode).toBe(202);
  });

  it('throws error when IndexNow returns 403 Forbidden', async () => {
    const creds = {
      host: 'glitz-holidays.in',
      apiKey: 'invalid-key',
    };
    prismaMock.integration.findFirst.mockResolvedValue({
      provider: 'indexnow',
      isActive: true,
      credentials: encryptSecret(JSON.stringify(creds)),
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 403,
      text: jest.fn().mockResolvedValue('Forbidden'),
    });

    await expect(service.submitUrls(['/destinations/kashmir'])).rejects.toThrow(BadRequestException);
  });
});
