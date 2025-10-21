const request = require('supertest');
const app = require('../app');

describe('RightYeh Backend API', () => {
  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('OK');
      expect(response.body.environment).toBeDefined();
    });

    test('GET /api/health should return 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is healthy');
    });
  });

  describe('API Documentation', () => {
    test('GET /api/docs should return API documentation', async () => {
      const response = await request(app)
        .get('/api/docs')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.endpoints).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body.error).toBe('Route not found');
    });
  });
});
