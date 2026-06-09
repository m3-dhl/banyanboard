import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('returns HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns status "ok"', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('ok');
  });

  it('returns a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
