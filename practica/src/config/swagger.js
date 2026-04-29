import swaggerJsdoc from 'swagger-jsdoc';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'BildyApp API',
    version: '1.0.0',
    description: 'API REST para gestión de clientes, proyectos y albaranes'
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          number: { type: 'string' },
          postal: { type: 'string' },
          city: { type: 'string' },
          province: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          lastName: { type: 'string' },
          nif: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'guest'] },
          status: { type: 'string', enum: ['pending', 'verified'] },
          company: { type: 'string' }
        }
      },
      Company: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          owner: { type: 'string' },
          name: { type: 'string' },
          cif: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
          logo: { type: 'string' },
          isFreelance: { type: 'boolean' }
        }
      },
      Client: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          cif: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
          deleted: { type: 'boolean' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          projectCode: { type: 'string' },
          client: { type: 'string' },
          email: { type: 'string' },
          notes: { type: 'string' },
          active: { type: 'boolean' },
          address: { $ref: '#/components/schemas/Address' }
        }
      },
      DeliveryNote: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          format: { type: 'string', enum: ['material', 'hours'] },
          description: { type: 'string' },
          workDate: { type: 'string', format: 'date-time' },
          material: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          hours: { type: 'number' },
          workers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                hours: { type: 'number' }
              }
            }
          },
          signed: { type: 'boolean' },
          signedAt: { type: 'string', format: 'date-time' },
          signatureUrl: { type: 'string' },
          pdfUrl: { type: 'string' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      Paginated: {
        type: 'object',
        properties: {
          items: { type: 'array', items: {} },
          totalItems: { type: 'integer' },
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' },
          limit: { type: 'integer' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'User', description: 'Usuarios y autenticación' },
    { name: 'Client', description: 'Clientes' },
    { name: 'Project', description: 'Proyectos' },
    { name: 'DeliveryNote', description: 'Albaranes' }
  ]
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: ['./src/routes/*.js', './src/controllers/*.js']
});
