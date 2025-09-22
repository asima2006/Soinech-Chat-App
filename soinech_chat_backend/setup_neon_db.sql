-- Soinech Chat Database Setup for Neon
-- Run this script to create all necessary tables

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_members CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create chats table
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('group', 'private')),
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create chat_members table (junction table for many-to-many relationship)
CREATE TABLE chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_messages_delivered ON messages(delivered);

-- Insert sample users
INSERT INTO users (id, username) VALUES 
(1, 'Test User'),
(2, 'Alice Johnson'),
(3, 'Bob Smith'),
(4, 'Charlie Brown');

-- Insert General Chat
INSERT INTO chats (id, type, name) VALUES 
(1, 'group', 'General Chat');

-- Add all users to General Chat
INSERT INTO chat_members (chat_id, user_id) VALUES 
(1, 1),
(1, 2),
(1, 3),
(1, 4);

-- Reset sequences to start from the next available ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('chats_id_seq', (SELECT MAX(id) FROM chats));

-- Display created tables and data
SELECT 'USERS TABLE:' as info;
SELECT id, username, created_at FROM users ORDER BY id;

SELECT 'CHATS TABLE:' as info;
SELECT id, type, name, created_at FROM chats ORDER BY id;

SELECT 'CHAT MEMBERS:' as info;
SELECT cm.chat_id, c.name as chat_name, cm.user_id, u.username 
FROM chat_members cm 
JOIN chats c ON cm.chat_id = c.id 
JOIN users u ON cm.user_id = u.id 
ORDER BY cm.chat_id, cm.user_id;

SELECT 'SETUP COMPLETE!' as status;