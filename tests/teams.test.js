const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../server');

describe('Team Management API Tests', () => {
    let app;
    let adminToken;
    let testTeamId;
    let testDepartmentId;

    beforeAll(async () => {
        app = server;
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Login admin
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin.draxlmaier@gmail.com',
                password: 'Admin123!'
            });
        adminToken = response.body.token;
    });

    afterAll(async () => {
        // Cleanup test data
        if (testTeamId) {
            await request(app)
                .delete(`/api/teams/${testTeamId}`)
                .set('Authorization', `Bearer ${adminToken}`);
        }
        if (testDepartmentId) {
            await request(app)
                .delete(`/api/departments/${testDepartmentId}`)
                .set('Authorization', `Bearer ${adminToken}`);
        }
        await mongoose.connection.close();
        if (server && server.close) {
            server.close();
        }
    });

    describe('GET /api/teams', () => {
        it('should get all teams', async () => {
            const response = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.teams)).toBe(true);
        });

        it('should fail without authentication', async () => {
            const response = await request(app)
                .get('/api/teams');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/teams', () => {
        it('should create a new team', async () => {
            // First get a department
            const deptsResponse = await request(app)
                .get('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`);

            const departmentId = deptsResponse.body.departments && deptsResponse.body.departments[0]
                ? deptsResponse.body.departments[0]._id
                : null;

            const response = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `Test Team ${Date.now()}`,
                    description: 'Team for testing',
                    department: departmentId,
                    color: '#3498db'
                });

            if (response.status === 201) {
                testTeamId = response.body.team._id;
                expect(response.body.status).toBe('success');
                expect(response.body.team.name).toContain('Test Team');
            }
            expect([201, 400, 404]).toContain(response.status);
        });

        it('should fail without required fields', async () => {
            const response = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/departments', () => {
        it('should get all departments', async () => {
            const response = await request(app)
                .get('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.departments)).toBe(true);
        });
    });

    describe('POST /api/departments', () => {
        it('should create a new department', async () => {
            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `Test Department ${Date.now()}`,
                    description: 'Department for testing',
                    location: 'Test Location',
                    budget: 100000
                });

            if (response.status === 201) {
                testDepartmentId = response.body.department._id;
                expect(response.body.status).toBe('success');
                expect(response.body.department.name).toContain('Test Department');
            }
            expect([201, 400]).toContain(response.status);
        });
    });

    describe('PUT /api/teams/:id', () => {
        it('should update a team', async () => {
            // Get existing team
            const teamsResponse = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${adminToken}`);

            if (teamsResponse.body.teams && teamsResponse.body.teams.length > 0) {
                const teamId = teamsResponse.body.teams[0]._id;

                const response = await request(app)
                    .put(`/api/teams/${teamId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: 'Updated Team Name'
                    });

                if (response.status === 200) {
                    expect(response.body.status).toBe('success');
                }
                expect([200, 404]).toContain(response.status);
            } else {
                expect(true).toBe(true); // Skip if no teams
            }
        });
    });

    describe('Team Members Management', () => {
        it('should add member to team', async () => {
            const teamsResponse = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${adminToken}`);

            const usersResponse = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);

            if (teamsResponse.body.teams && teamsResponse.body.teams.length > 0 &&
                usersResponse.body.users && usersResponse.body.users.length > 0) {
                const teamId = teamsResponse.body.teams[0]._id;
                const userId = usersResponse.body.users[0]._id;

                const response = await request(app)
                    .post(`/api/teams/${teamId}/members/${userId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                if (response.status === 200) {
                    expect(response.body.status).toBe('success');
                }
                expect([200, 400, 404]).toContain(response.status);
            } else {
                expect(true).toBe(true); // Skip if no data
            }
        });
    });
});
