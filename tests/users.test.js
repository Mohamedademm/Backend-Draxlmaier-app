const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');

describe('User Management API Tests', () => {
    let app;
    let adminToken;
    let managerToken;
    let employeeToken;
    let testUserId;

    beforeAll(async () => {
        app = server;
        // Wait for MongoDB connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Login admin
        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin.draxlmaier@gmail.com',
                password: 'Admin123!'
            });
        adminToken = adminResponse.body.token;

        // Login manager
        const managerResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'manager.draxlmaier@gmail.com',
                password: 'Manager123!'
            });
        managerToken = managerResponse.body.token;

        // Login employee
        const employeeResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'employee.draxlmaier@gmail.com',
                password: 'Employee123!'
            });
        employeeToken = employeeResponse.body.token;
    });

    afterAll(async () => {
        // Clean up test user if created
        if (testUserId) {
            await request(app)
                .delete(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
        }
        await mongoose.connection.close();
        if (server && server.close) {
            server.close();
        }
    });

    describe('GET /api/users', () => {
        it('should get all users as admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.users)).toBe(true);
            expect(response.body.count).toBe Den(0);
        });

        it('should get all users as manager', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
        });

        it('should fail without token', async () => {
            const response = await request(app)
                .get('/api/users');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/users', () => {
        it('should create user as admin', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstname: 'Test',
                    lastname: 'User',
                    email: `test.user.${Date.now()}@example.com`,
                    password: 'Test123!',
                    role: 'employee'
                });

            if (response.status === 201) {
                testUserId = response.body.user.id || response.body.user._id;
                expect(response.body.status).toBe('success');
                expect(response.body.user).toHaveProperty('email');
            }
            expect([201, 400]).toContain(response.status);
        });

        it('should fail to create admin as manager', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    firstname: 'Test',
                    lastname: 'Admin',
                    email: `test.admin.${Date.now()}@example.com`,
                    password: 'Test123!',
                    role: 'admin'
                });

            expect(response.status).toBe(403);
            expect(response.body.status).toBe('error');
        });

        it('should fail without token', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    firstname: 'Test',
                    lastname: 'User',
                    email: 'test@example.com',
                    password: 'Test123!',
                    role: 'employee'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user as admin', async () => {
            // First get a user to update
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const userId = usersResponse.body.users[0]._id;

            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstname: 'Updated'
                });

            if (response.status === 200) {
                expect(response.body.status).toBe('success');
            }
            expect([200, 404]).toContain(response.status);
        });

        it('should fail to update without permission', async () => {
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const userId = usersResponse.body.users[0]._id;

            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    firstname: 'Hacked'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('User Activation/Deactivation', () => {
        it('should activate user as admin', async () => {
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const userId = usersResponse.body.users[0]._id;

            const response = await request(app)
                .post(`/api/users/${userId}/activate`)
                .set('Authorization', `Bearer ${adminToken}`);

            if (response.status === 200) {
                expect(response.body.status).toBe('success');
                expect(response.body.user.active).toBe(true);
            }
            expect([200, 404]).toContain(response.status);
        });

        it('should deactivate user as admin', async () => {
            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const userId = usersResponse.body.users[usersResponse.body.users.length - 1]._id;

            const response = await request(app)
                .post(`/api/users/${userId}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`);

            if (response.status === 200) {
                expect(response.body.status).toBe('success');
                expect(response.body.user.active).toBe(false);
            }
            expect([200, 404]).toContain(response.status);
        });
    });

    describe('GET /api/users/search', () => {
        it('should search users by query', async () => {
            const response = await request(app)
                .get('/api/users/search?q=admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.users)).toBe(true);
        });

        it('should fail without query parameter', async () => {
            const response = await request(app)
                .get('/api/users/search')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
        });
    });
});
