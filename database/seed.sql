-- ==============================================================
-- Support Ticket Management System
-- Seed / Sample Data Script
-- ==============================================================

USE support_ticket_db;

-- Clear previous data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ticket_comments;
TRUNCATE TABLE tickets;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------------
-- 1. Insert Users (Password for all seed users is: Password123!)
-- Bcrypt Hash: $2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua
-- --------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES
(1, 'System Administrator', 'admin@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'admin', NOW() - INTERVAL 10 DAY),
(2, 'Sarah Jenkins', 'agent.sarah@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'agent', NOW() - INTERVAL 9 DAY),
(3, 'Alex Rivera', 'agent.alex@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'agent', NOW() - INTERVAL 9 DAY),
(4, 'John Doe', 'john.doe@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'customer', NOW() - INTERVAL 8 DAY),
(5, 'Emily Clark', 'emily.clark@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'customer', NOW() - INTERVAL 7 DAY),
(6, 'Michael Brown', 'michael.brown@example.com', '$2a$10$3W.4jJLK5E5hwwzn8Het6eVX58NKnED690Sq7Ab2Dvd2gFK/G4sua', 'customer', NOW() - INTERVAL 6 DAY);

-- --------------------------------------------------------------
-- 2. Insert Support Tickets
-- --------------------------------------------------------------
INSERT INTO tickets (id, user_id, subject, description, priority, status, assigned_to, created_at, updated_at) VALUES
(1, 4, 'Unable to access billing invoice PDF', 'Whenever I click the Download Invoice button on the billing portal, it loads an empty page with a 404 error code. Please help me retrieve our May 2026 invoice.', 'HIGH', 'OPEN', NULL, NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),

(2, 4, 'Integration webhook returning 500 error', 'Our production webhook endpoint received HTTP 500 responses repeatedly between 10:00 AM and 11:30 AM today. Payload schema appears valid. Requesting server log inspection.', 'URGENT', 'IN_PROGRESS', 2, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY),

(3, 4, 'Feature Request: Dark mode on mobile dashboard', 'The mobile dashboard is very bright when checking incident alerts during night shifts. Having a native dark theme toggle would be greatly appreciated.', 'LOW', 'CLOSED', 3, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 5 DAY),

(4, 5, 'Cannot reset password via email link', 'I requested a password reset link twice, but clicking the token URL says expired token immediately. Can you please reissue a fresh reset link or verify my account status?', 'HIGH', 'OPEN', NULL, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),

(5, 5, 'API rate limit reached prematurely', 'Our plan specifies 10,000 requests per minute, but our system started throttling at approximately 4,200 requests/min. Could you please verify the quota configuration on our account?', 'MEDIUM', 'RESOLVED', 2, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 DAY),

(6, 6, 'Assistance updating organization tax ID and legal name', 'Our organization recently transitioned corporate entity structure. We need to update our legal business name and European VAT number in the invoice generator.', 'MEDIUM', 'OPEN', 3, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY);

-- --------------------------------------------------------------
-- 3. Insert Ticket Comments
-- --------------------------------------------------------------
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at) VALUES
-- Comments on Ticket 2 (Webhook 500 error)
(1, 2, 2, 'Hi John, thank you for reaching out. I have taken ownership of this ticket and am analyzing our ingress API gateway logs around that timestamp.', NOW() - INTERVAL 2 DAY),
(2, 2, 4, 'Thank you Sarah! Here is one of the failed request trace IDs: req_98124_x1.', NOW() - INTERVAL 2 DAY + INTERVAL 3 HOUR),
(3, 2, 2, 'Found the root cause! A momentary Redis connection pool exhaustion during a database failover caused transient 500s. We have patched the connection timeout.', NOW() - INTERVAL 1 DAY),

-- Comments on Ticket 3 (Dark mode feature request)
(4, 3, 3, 'Hi John, thank you for the suggestion! Our mobile product team has officially added dark mode to the Q4 roadmap. Closing this ticket for now.', NOW() - INTERVAL 5 DAY),

-- Comments on Ticket 5 (Rate limit)
(5, 5, 2, 'Hi Emily, we inspected your account tier and noticed an old cache value in our API gateway. We refreshed the cluster quota cache, and you now have the full 10,000 req/min.', NOW() - INTERVAL 2 DAY),
(6, 5, 5, 'Tested with our load test suite and confirmed no throttling at 8,000 req/min. Thanks a lot for the quick fix!', NOW() - INTERVAL 1 DAY);
