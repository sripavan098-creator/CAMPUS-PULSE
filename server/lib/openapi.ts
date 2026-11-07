export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'CampusPulse API',
    version: '1.0.0',
    description:
      'University room, lab, and faculty availability platform for VFSTR (Vignan University). Supports web clients (session cookie cp_session + CSRF header X-CSRF-Token) and mobile APK clients (Bearer token).',
    contact: {
      name: 'VFSTR Academic Timetable Administration',
      url: 'https://vignan.ac.in',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Base',
    },
  ],
  components: {
    securitySchemes: {
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'cp_session',
        description: 'Web session cookie (HttpOnly; SameSite=Lax/None; Secure in production). Requires X-CSRF-Token header on mutating requests.',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT/Opaque',
        description: 'Capacitor Android APK Authorization header. Bearer requests bypass the CSRF requirement.',
      },
      CsrfHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
        description: 'Anti-CSRF token obtained from GET /api/auth/csrf for state-changing browser requests.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INVALID_CREDENTIALS' },
              message: { type: 'string', example: 'Email or password is incorrect.' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['error'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'faculty', 'student'] },
          group: { type: 'string', nullable: true },
          facultyId: { type: 'string', nullable: true },
        },
      },
      Block: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'N' },
          name: { type: 'string', example: 'Nagarjuna Bhavan' },
          floors: { type: 'array', items: { $ref: '#/components/schemas/Floor' } },
        },
      },
      Floor: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'N-6' },
          blockId: { type: 'string', example: 'N' },
          number: { type: 'integer', example: 6 },
          label: { type: 'string', example: 'Floor 6' },
        },
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'N-604' },
          blockId: { type: 'string', example: 'N' },
          floorId: { type: 'string', nullable: true },
          floor_num: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['FREE', 'OCCUPIED', 'LATER', 'UNAVAILABLE'] },
          confidence: { type: 'string', enum: ['confirmed', 'inferred', 'unknown'] },
        },
      },
      Entry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          roomId: { type: 'string', nullable: true },
          day: { type: 'string', enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] },
          startTime: { type: 'string', example: '08:15' },
          endTime: { type: 'string', example: '09:05' },
          subject: { type: 'string', nullable: true },
          entryType: { type: 'string', example: 'class' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        description: 'Returns API server status, version, and server timestamp without authentication.',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    version: { type: 'string', example: '1.0.0' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/csrf': {
      get: {
        summary: 'Get CSRF token',
        description: 'Supplies a cryptographic CSRF token for web clients to send in the X-CSRF-Token header.',
        responses: {
          '200': {
            description: 'CSRF token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    csrfToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user',
        description: 'Dual-client login endpoint. Sets cp_session cookie for browsers and returns bearer token for mobile APK clients.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 10 },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', description: 'Bearer token for APK clients' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '429': {
            description: 'Too many attempts (rate limited)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Terminate session',
        description: 'Clears cp_session cookie and deletes the active session record.',
        responses: {
          '200': {
            description: 'Logged out successfully',
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current session user',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          '401': {
            description: 'Unauthenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/campus/blocks': {
      get: {
        summary: 'Get all campus blocks and floors',
        responses: {
          '200': {
            description: 'List of blocks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    blocks: { type: 'array', items: { $ref: '#/components/schemas/Block' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/availability/now': {
      get: {
        summary: 'Live availability status for all campus rooms',
        parameters: [
          { name: 'at', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'day', in: 'query', schema: { type: 'string', example: 'MON' } },
          { name: 'time', in: 'query', schema: { type: 'string', example: '10:05' } },
        ],
        responses: {
          '200': {
            description: 'Live availability matrix',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    day: { type: 'string' },
                    time: { type: 'string' },
                    rooms: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/availability/search': {
      get: {
        summary: 'Search free rooms for custom interval',
        parameters: [
          { name: 'day', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'from', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'to', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'block', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of matching available rooms',
          },
        },
      },
    },
    '/assistant/query': {
      post: {
        summary: 'Deterministic Timetable Assistant',
        description: 'Answers scheduling questions strictly from stored department timetable records. Includes citations.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  day: { type: 'string' },
                  time: { type: 'string' },
                  group: { type: 'string' },
                },
                required: ['question'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Assistant query response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['answered', 'needs_detail', 'no_data'] },
                    answer: { type: 'string' },
                    citations: { type: 'array', items: { type: 'object' } },
                    clarify: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/me/timetable': {
      get: {
        summary: 'Enrolled student timetable',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        responses: {
          '200': { description: 'Weekly student schedule' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/me/export.ics': {
      get: {
        summary: 'Export schedule as iCalendar (.ics)',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        responses: {
          '200': { description: 'RFC-5545 iCalendar data stream' },
        },
      },
    },
    '/admin/disruptions': {
      post: {
        summary: 'Record campus disruption and trigger repair engine',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        responses: {
          '200': { description: 'Disruption recorded with ranked repair proposals' },
          '403': { description: 'Forbidden (requires admin role)' },
        },
      },
    },
    '/auth/signup/student': {
      post: {
        summary: 'Student self-registration',
        description: 'Creates a student account and enrols it in an existing section. Returns the created user.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'rollNumber', 'email', 'password', 'section'],
                properties: {
                  name: { type: 'string' },
                  rollNumber: { type: 'string', example: '211FA04001' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 10 },
                  section: { type: 'string', example: 'II AIML-J' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': { description: 'Validation error or unknown section' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/auth/change-password': {
      post: {
        summary: 'Change the current account password',
        description: 'Rotates the password. Admin-provisioned accounts must call this before any other route is reachable.',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 10 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated' },
          '401': { description: 'Current password incorrect' },
        },
      },
    },
    '/faculty/me/swap-candidates': {
      get: {
        summary: 'Swap targets for one of your periods',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        parameters: [{ name: 'entryId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Same-section periods owned by other faculty' },
          '403': { description: 'Period does not belong to the caller' },
        },
      },
    },
    '/faculty/me/replacement-candidates': {
      get: {
        summary: 'Free same-section faculty for a period',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        parameters: [{ name: 'entryId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Faculty who can take the period' },
        },
      },
    },
    '/faculty/me/requests': {
      get: {
        summary: 'List your incoming and outgoing schedule requests',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        responses: {
          '200': { description: 'Incoming (pending) and outgoing requests' },
        },
      },
    },
    '/faculty/me/requests/swap': {
      post: {
        summary: 'Raise a swap request',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        responses: {
          '201': { description: 'Request created' },
          '403': { description: 'Source period not owned by the caller' },
          '409': { description: 'Swap would create a conflict' },
        },
      },
    },
    '/faculty/me/requests/replace': {
      post: {
        summary: 'Raise a replacement request',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        responses: {
          '201': { description: 'Request created' },
          '400': { description: 'Substitute does not teach the section' },
        },
      },
    },
    '/faculty/me/requests/{id}/{decision}': {
      post: {
        summary: 'Accept or reject a schedule request',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'decision', in: 'path', required: true, schema: { type: 'string', enum: ['accept', 'reject'] } },
        ],
        responses: {
          '200': { description: 'Decision recorded' },
          '403': { description: 'Request is not aimed at the caller' },
          '409': { description: 'Slot is no longer free' },
        },
      },
    },
    '/admin/schedule-requests': {
      get: {
        summary: 'List schedule requests for oversight',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }],
        parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Requests, filtered by status when provided' },
        },
      },
    },
    '/admin/schedule-requests/{id}/override': {
      post: {
        summary: 'Force a decision on a pending request',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Request decided and applied' },
          '409': { description: 'Already decided or slot conflict' },
        },
      },
    },
    '/admin/proposals/{id}/approve': {
      post: {
        summary: 'Approve repair proposal',
        description: 'Re-runs hard constraint checks, applies timetable change, notifies students, and writes to audit log.',
        security: [{ CookieAuth: [] }, { BearerAuth: [] }, { CsrfHeader: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Proposal successfully approved and applied' },
          '409': { description: 'Proposal stale due to subsequent conflicts' },
        },
      },
    },
  },
}
