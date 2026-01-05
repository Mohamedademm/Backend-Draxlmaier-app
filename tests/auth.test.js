const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');
const User = require('../models/User');

describe('Authentication API Tests', () => {
  let app;

  beforeAll(async () => {
    app = server;
    // Wait for MongoDB connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (server && server.close) {
      server.close();
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin.draxlmaier@gmail.com',
          password: 'Admin123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');
    });

    it('should login manager successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'manager.draxlmaier@gmail.com',
          password: 'Manager123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('manager');
    });

    it('should login employee successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee.draxlmaier@gmail.com',
          password: 'Employee123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('employee');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin.draxlmaier@gmail.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should fail without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let adminToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin.draxlmaier@gmail.com',
          password: 'Admin123!'
        });
      adminToken = response.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user.role).toBe('admin');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should fail registration without matricule (if matricule required)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstname: 'Test',
          lastname: 'User',
          email: 'test@example.com',
          password: 'Test123!'
        });

      // Expected to fail or require matricule
      expect([400, 422]).toContain(response.status);
    });
  });
});
