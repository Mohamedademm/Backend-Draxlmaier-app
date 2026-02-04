const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Employee Communication API',
            version: '1.0.0',
            description: 'API documentation for the Employee Communication mobile application',
            contact: {
                name: 'Developer',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local Development Server',
            },
            {
                url: 'https://backend-draxlmaier-communication.onrender.com/api',
                description: 'Production Server (Render)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
