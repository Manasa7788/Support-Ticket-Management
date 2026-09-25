const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Support Ticket System - API Test Suite', () => {
  let customerToken;
  let customerUser;
  let otherCustomerToken;
  let otherCustomerUser;
  let agentToken;
  let agentUser;
  let createdTicketId;

  beforeAll(async () => {
    // Login as existing seed customer (John Doe)
    const custLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'Password123!'
      });
    expect(custLoginRes.statusCode).toBe(200);
    customerToken = custLoginRes.body.token;
    customerUser = custLoginRes.body.user;

    // Login as existing seed customer (Emily Clark)
    const otherCustLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'emily.clark@example.com',
        password: 'Password123!'
      });
    expect(otherCustLoginRes.statusCode).toBe(200);
    otherCustomerToken = otherCustLoginRes.body.token;
    otherCustomerUser = otherCustLoginRes.body.user;

    // Login as existing seed agent (Sarah Jenkins)
    const agentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'agent.sarah@example.com',
        password: 'Password123!'
      });
    expect(agentLoginRes.statusCode).toBe(200);
    agentToken = agentLoginRes.body.token;
    agentUser = agentLoginRes.body.user;
  });

  afterAll(async () => {
    await pool.end();
  });

  // ==========================================
  // 1. Health Check
  // ==========================================
  describe('GET /api/health', () => {
    it('should return 200 OK and health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  // ==========================================
  // 2. Authentication APIs
  // ==========================================
  describe('Authentication APIs (/api/auth)', () => {
    const testEmail = `newcustomer_${Date.now()}@example.com`;

    it('should register a new customer successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Wonder',
          email: testEmail,
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.email).toBe(testEmail);
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Alice',
          email: testEmail,
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject registration with invalid input (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details).toBeDefined();
    });

    it('should succeed login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('john.doe@example.com');
    });

    it('should reject login with invalid password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'WrongPassword999!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid email or password/i);
    });

    it('should reject login with non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_user@example.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve current authenticated user with /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('john.doe@example.com');
    });
  });

  // ==========================================
  // 3. Ticket Management & Access Control
  // ==========================================
  describe('Ticket Management APIs (/api/tickets)', () => {
    it('should reject ticket retrieval when unauthorized (no token) (401)', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow customer to create a new ticket successfully (201)', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'Payment receipt not generated for subscription renewal',
          description: 'Our annual subscription renewed yesterday but no receipt or tax invoice was sent.',
          priority: 'HIGH'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.status).toBe('OPEN');
      expect(res.body.ticket.priority).toBe('HIGH');
      expect(res.body.ticket.user_id).toBe(customerUser.id);

      createdTicketId = res.body.ticket.id;
    });

    it('should reject ticket creation with missing subject (400)', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          description: 'Description without subject',
          priority: 'LOW'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return only customer\'s own tickets when requested by customer', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);

      // Verify that every returned ticket belongs strictly to John Doe
      res.body.tickets.forEach(ticket => {
        expect(ticket.user_id).toBe(customerUser.id);
      });
    });

    it('should allow customer to view their own ticket details (200)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.id).toBe(createdTicketId);
    });

    it('should forbid customer from accessing another customer\'s ticket (403)', async () => {
      // Emily tries to view John Doe's newly created ticket
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/permission/i);
    });

    it('should return 404 for non-existent ticket ID', async () => {
      const res = await request(app)
        .get('/api/tickets/999999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow support agent to view all tickets across all customers', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tickets.length).toBeGreaterThan(1);

      // Verify tickets from multiple users exist in the list
      const userIds = new Set(res.body.tickets.map(t => t.user_id));
      expect(userIds.size).toBeGreaterThan(1);
    });

    it('should allow support agent to view any customer\'s ticket details', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.id).toBe(createdTicketId);
    });

    it('should allow support agent to update ticket status and assigned agent', async () => {
      const res = await request(app)
        .put(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'IN_PROGRESS',
          assigned_to: agentUser.id
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.status).toBe('IN_PROGRESS');
      expect(res.body.ticket.assigned_to).toBe(agentUser.id);
    });

    it('should forbid customer from updating another customer\'s ticket (403)', async () => {
      const res = await request(app)
        .put(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          subject: 'Unauthorized update attempt'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. Comments & Collaboration
  // ==========================================
  describe('Ticket Comments APIs (/api/tickets/:id/comments)', () => {
    it('should allow customer to add a comment to their own ticket', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          comment: 'Providing additional details: our transaction ID is TXN-44981.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.comment).toMatch(/TXN-44981/);
      expect(res.body.comment.user_id).toBe(customerUser.id);
    });

    it('should allow agent to respond with a comment', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          comment: 'We have located the transaction and re-sent the PDF invoice to your registered email.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.author_role).toBe('agent');
    });

    it('should forbid another customer from commenting on a ticket they do not own (403)', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          comment: 'Intruding comment attempt'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve all comments for an authorized user', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.comments.length).toBe(2);
    });

    it('should forbid customer from retrieving comments on another customer\'s ticket (403)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 5. Agent Dashboard & Metrics
  // ==========================================
  describe('Agent Dashboard & User APIs', () => {
    it('should allow agent to retrieve ticket statistics', async () => {
      const res = await request(app)
        .get('/api/tickets/stats')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.total).toBe('number');
      expect(typeof res.body.stats.open).toBe('number');
    });

    it('should forbid customer from accessing ticket statistics (403)', async () => {
      const res = await request(app)
        .get('/api/tickets/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow agent to fetch list of agents for ticket assignment', async () => {
      const res = await request(app)
        .get('/api/users?role=agent')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      res.body.users.forEach(u => expect(u.role).toBe('agent'));
    });

    it('should forbid customer from fetching users list (403)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
