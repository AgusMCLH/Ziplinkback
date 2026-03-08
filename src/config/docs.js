const SwaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'API de Links',
      version: '1.0.0',
      description: 'Documentación de mi API',
    },
    tags: [
      {
        name: 'Auth',
        description: 'Operaciones de autenticación',
      },
      {
        name: 'Links',
        description: 'Operaciones relacionadas con links',
      },
      {
        name: 'Users',
        description: 'Operaciones de usuarios',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        LoginUser: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '699f3755873459cbd1964fce',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-25T17:54:29.098Z',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            errorBool: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Login success',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/LoginUser',
                },
              },
            },
          },
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
    paths: {
      '/api/users/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Inicio de sesión exitoso',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

export default SwaggerOptions;
