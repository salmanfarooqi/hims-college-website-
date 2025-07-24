const request = require('supertest');
const app = require('../server');

describe('Server Health Checks', () => {
  test('GET / should return server info', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'HIMS Backend API');
    expect(response.body).toHaveProperty('version', '2.0.0');
    expect(response.body).toHaveProperty('status', 'running');
  });

  test('GET /api/health should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message', 'Server is running');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment', 'test');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
}); 