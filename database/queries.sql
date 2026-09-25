-- ==============================================================
-- Support Ticket Management System
-- Database Queries Reference & Section 8 Assessment Requirements
-- ==============================================================

USE support_ticket_db;

-- ==============================================================
-- SECTION 8 REQUIREMENT:
-- "Write a query that returns all open tickets along with the
--  customer's name and email. The query should demonstrate use
--  of a JOIN and filtering."
-- ==============================================================
SELECT 
    t.id AS ticket_id,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.created_at,
    u.id AS customer_id,
    u.name AS customer_name,
    u.email AS customer_email
FROM tickets t
INNER JOIN users u ON t.user_id = u.id
WHERE t.status = 'OPEN'
ORDER BY t.created_at DESC;

-- ==============================================================
-- ADDITIONAL DEMONSTRATION QUERIES:
-- ==============================================================

-- 1. Query ticket details with customer info, assigned agent info, and comment count
SELECT 
    t.id,
    t.subject,
    t.description,
    t.priority,
    t.status,
    t.created_at,
    t.updated_at,
    customer.id AS customer_id,
    customer.name AS customer_name,
    customer.email AS customer_email,
    agent.id AS agent_id,
    agent.name AS agent_name,
    agent.email AS agent_email,
    COUNT(c.id) AS total_comments
FROM tickets t
INNER JOIN users customer ON t.user_id = customer.id
LEFT JOIN users agent ON t.assigned_to = agent.id
LEFT JOIN ticket_comments c ON t.id = c.ticket_id
GROUP BY t.id, customer.id, agent.id
ORDER BY t.created_at DESC;

-- 2. Agent Dashboard Metrics (Ticket Counts by Status & Priority)
SELECT 
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) AS open_tickets,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_tickets,
    SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_tickets,
    SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) AS closed_tickets,
    SUM(CASE WHEN priority IN ('HIGH', 'URGENT') AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) AS urgent_open_tickets
FROM tickets;

-- 3. Query all comments for a specific ticket with author details
SELECT 
    c.id AS comment_id,
    c.comment,
    c.created_at,
    u.id AS author_id,
    u.name AS author_name,
    u.email AS author_email,
    u.role AS author_role
FROM ticket_comments c
INNER JOIN users u ON c.user_id = u.id
WHERE c.ticket_id = 2
ORDER BY c.created_at ASC;
