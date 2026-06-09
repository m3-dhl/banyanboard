import request from 'supertest';
import app from '../app';

describe('CORS middleware', () => {
  describe('simple cross-origin request', () => {
    it('adds Access-Control-Allow-Origin when Origin header is present', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('preflight request (OPTIONS)', () => {
    it('returns 204 for OPTIONS preflight', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
    });

    it('includes Access-Control-Allow-Methods on preflight response', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-methods']).toBeDefined();
    });

    it('includes Access-Control-Allow-Headers on preflight response', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(res.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
