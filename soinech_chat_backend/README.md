# Soinech Chat Backend (Demo)
## Quickstart (local)
1. Install Postgres and create database:
   - psql -U postgres
   - CREATE DATABASE soinech_chat;
   - \c soinech_chat
   - Run the SQL in db.sql to create tables.
2. Install dependencies:
   - npm install
3. Start server:
   - npm start
4. Use POST /auth/login with {"userId": 1} to get a token for testing.
5. Socket.IO client should connect with auth: { token } and can emit `join`, `send_message`, `typing`, etc.
