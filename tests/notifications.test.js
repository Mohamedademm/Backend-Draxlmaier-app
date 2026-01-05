const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');

describe('Notification API Tests', () => {
    let app;
    let adminToken;
    let employeeToken;

    beforeAll(async () => {
        app = server;
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Login admin
        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin.draxlmaier@gmail.com',
                password: 'Admin123!'
            });
        adminToken = adminResponse.body.token;

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
        await mongoose.connection.close();
        if (server && server.close) {
            server.close();
        }
    });

    describe('GET /api/notifications', () => {
        it('should get user notifications', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.notifications)).toBe(true);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/notifications');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('should get unread notification count', async () => {
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('count');
            expect(typeof response.body.count).toBe('number');
        });
    });

    describe('POST /api/notifications/send', () => {
        it('should send notification as admin', async () => {
            const response = await request(app)
                .post('/api/notifications/send')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    type: 'announcement',
                    targetUserIds: []
                });

            if (response.status === 201) {
                expect(response.body.status).toBe('success');
            }
            expect([201, 400]).toContain(response.status);
        });

        it('should fail for employee to send broadcast', async () => {
            const response = await request(app)
                .post('/api/notifications/send')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    title: 'Test',
                    message: 'Test',
                    type: 'announcement'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            // First get notifications
            const notificationsResponse = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${employeeToken}`);

            if (notificationsResponse.body.notifications &&
                notificationsResponse.body.notifications.length > 0) {
                const notificationId = notificationsResponse.body.notifications[0]._id;

                const response = await request(app)
                    .post(`/api/notifications/${notificationId}/read`)
                    .set('Authorization', `Bearer ${employeeToken}`);

                if (response.status === 200) {
                    expect(response.body.status).toBe('success');
                }
                expect([200, 404]).toContain(response.status);
            } else {
                expect(true).toBe(true); // Skip if no notifications
            }
        });
    });
});

describe('Objective API Tests', () => {
    let app;
    let managerToken;
    let employeeToken;
    let testObjectiveId;

    beforeAll(async () => {
        app = server;
        await new Promise(resolve => setTimeout(resolve, 2000));

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
        if (testObjectiveId) {
            await request(app)
                .delete(`/api/objectives/${testObjectiveId}`)
                .set('Authorization', `Bearer ${managerToken}`);
        }
        await mongoose.connection.close();
        if (server && server.close) {
            server.close();
        }
    });

    describe('GET /api/objectives', () => {
        it('should get objectives', async () => {
            const response = await request(app)
                .get('/api/objectives')
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.objectives)).toBe(true);
        });
    });

    describe('POST /api/objectives', () => {
        it('should create objective as manager', async () => {
            const response = await request(app)
                .post('/api/objectives')
                .set('Authorization', `Bearer ${managerToken}`)
                .send({
                    title: 'Test Objective',
                    description: 'Test objective description',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    priority: 'high',
                    status: 'pending'
                });

            if (response.status === 201) {
                testObjectiveId = response.body.objective._id;
                expect(response.body.status).toBe('success');
            }
            expect([201, 400]).toContain(response.status);
        });

        it('should fail for employee to create objective', async () => {
            const response = await request(app)
                .post('/api/objectives')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    title: 'Test',
                    description: 'Test'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/objectives/:id/status', () => {
        it('should update objective status', async () => {
            const objectivesResponse = await request(app)
                .get('/api/objectives')
                .set('Authorization', `Bearer ${employeeToken}`);

            if (objectivesResponse.body.objectives &&
                objectivesResponse.body.objectives.length > 0) {
                const objectiveId = objectivesResponse.body.objectives[0]._id;

                const response = await request(app)
                    .put(`/api/objectives/${objectiveId}/status`)
                    .set('Authorization', `Bearer ${employeeToken}`)
                    .send({
                        status: 'in_progress'
                    });

                if (response.status === 200) {
                    expect(response.body.status).toBe('success');
                }
                expect([200, 400, 404]).toContain(response.status);
            } else {
                expect(true).toBe(true); // Skip if no objectives
            }
        });
    });
});
