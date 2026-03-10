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
        name: 'Redirect',
        description: 'Redirección mediante short code',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
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
            errorBool: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Login success' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/LoginUser' },
              },
            },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            errorBool: { type: 'boolean', example: false },
            message: {
              type: 'string',
              example: 'User registered successfully',
            },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/LoginUser' },
              },
            },
          },
        },

        Link: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '699f3755873459cbd1964fce' },
            originalUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://www.example.com',
            },
            shortCode: { type: 'string', example: 'abc123' },
            user: { type: 'string', example: '699f3755873459cbd1964fce' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-25T17:54:29.098Z',
            },
          },
        },
        CreateLinkRequest: {
          type: 'object',
          required: ['linkURL'],
          properties: {
            linkURL: {
              type: 'string',
              format: 'uri',
              example: 'https://www.example.com',
            },
          },
        },
        CreateLinkResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '699f3755873459cbd1964fce' },
            link: { type: 'string', example: 'http://localhost:3000/r/abc123' },
            dupl: {
              type: 'boolean',
              example: false,
              description: 'true si el link ya existía para este usuario',
            },
          },
        },

        UAResult: {
          type: 'object',
          description: 'Resultado del parsing del User-Agent',
          properties: {
            browser: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Chrome' },
                version: { type: 'string', example: '120.0.0.0' },
              },
            },
            os: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Windows' },
                version: { type: 'string', example: '10' },
              },
            },
            device: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'mobile' },
                vendor: { type: 'string', example: 'Apple' },
                model: { type: 'string', example: 'iPhone' },
              },
            },
          },
        },
        RedirectResponse: {
          type: 'object',
          properties: {
            originalUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://www.example.com',
            },
            userAgent: { $ref: '#/components/schemas/UAResult' },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            errorBool: { type: 'boolean', example: true },
            errorStatus: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Error description' },
          },
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/api/users/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar nuevo usuario',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      example: 'SecurePass123!',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario registrado exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RegisterResponse' },
                },
              },
            },
            400: {
              description: 'Datos inválidos (validación fallida)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    errorBool: true,
                    errorStatus: 400,
                    message: 'Invalid email or password format',
                  },
                },
              },
            },
            409: {
              description: 'El email ya está registrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    errorBool: true,
                    errorStatus: 409,
                    message: 'Email already in use',
                  },
                },
              },
            },
          },
        },
      },

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
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description:
                'Inicio de sesión exitoso. Se establece cookie `access_token`.',
              headers: {
                'Set-Cookie': {
                  schema: {
                    type: 'string',
                    example: 'access_token=eyJ...; HttpOnly; Path=/',
                  },
                  description: 'JWT de sesión (httpOnly)',
                },
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            401: {
              description: 'Credenciales inválidas',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                  example: {
                    errorBool: true,
                    errorStatus: 401,
                    message: 'Invalid credentials',
                  },
                },
              },
            },
          },
        },
      },

      '/api/users/logout': {
        get: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          description: 'Elimina la cookie `access_token` del cliente.',
          security: [{ CookieAuth: [] }, { ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'Sesión cerrada correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: {
                        type: 'string',
                        example: 'Logged out successfully',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      '/api/links': {
        get: {
          tags: ['Links'],
          summary: 'Obtener todos los links del usuario autenticado',
          security: [{ CookieAuth: [] }],
          responses: {
            200: {
              description: 'Lista de links',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Link' },
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Links'],
          summary: 'Crear un nuevo link acortado',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateLinkRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Link creado (o duplicado encontrado)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateLinkResponse' },
                  examples: {
                    nuevo: {
                      summary: 'Link nuevo',
                      value: {
                        userId: '699f3755873459cbd1964fce',
                        link: 'http://localhost:3000/r/abc123',
                      },
                    },
                    duplicado: {
                      summary: 'Link ya existente para el usuario',
                      value: {
                        userId: '699f3755873459cbd1964fce',
                        link: 'http://localhost:3000/r/abc123',
                        dupl: true,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Formato de URL inválido',
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                    example: 'Formato de URL invalido',
                  },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      '/api/links/{id}': {
        get: {
          tags: ['Links'],
          summary: 'Obtener un link por ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: '699f3755873459cbd1964fce' },
              description: 'ID del link',
            },
          ],
          responses: {
            200: {
              description: 'Link encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Link' },
                },
              },
            },
            404: {
              description: 'Link no encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Links'],
          summary: 'Actualizar el estado activo de un link',
          description:
            'Permite al usuario dueño del link activarlo o desactivarlo.',
          security: [{ CookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['updateLinkId', 'active'],
                  properties: {
                    updateLinkId: {
                      type: 'string',
                      example: '699f3755873459cbd1964fce',
                      description: 'ID del link a actualizar',
                    },
                    active: {
                      type: 'boolean',
                      example: true,
                      description: 'Nuevo estado del link',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Link actualizado correctamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Link' },
                },
              },
            },
            404: {
              description: 'Link no encontrado o no pertenece al usuario',
              content: {
                'application/json': {
                  schema: { type: 'string', example: 'Link not found' },
                },
              },
            },
            401: {
              description: 'No autenticado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Links'],
          summary: 'Eliminar un link por ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: '699f3755873459cbd1964fce' },
              description: 'ID del link a eliminar',
            },
          ],
          responses: {
            200: {
              description: 'Link eliminado correctamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Link deleted successfully',
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Link no encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },

      '/r/{id}': {
        get: {
          tags: ['Redirect'],
          summary: 'Resolver un short code y registrar el click',
          description:
            'Recibe el short code, registra información del click (User-Agent, referer, IP) y devuelve la URL original.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'abc123' },
              description: 'Short code del link',
            },
            {
              name: 'referer',
              in: 'query',
              required: false,
              schema: { type: 'string', example: 'https://twitter.com' },
              description: 'Origen desde donde se accedió al link',
            },
          ],
          responses: {
            200: {
              description: 'Short code resuelto correctamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RedirectResponse' },
                },
              },
            },
            400: {
              description: 'User-Agent inválido',
              content: {
                'application/json': {
                  schema: { type: 'string', example: 'Invalid user agent' },
                },
              },
            },
            404: {
              description: 'Short code no encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
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
