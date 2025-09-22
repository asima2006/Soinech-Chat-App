// index.js - Soinech Chat Backend (demo)
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
  ssl: process.env.PGHOST?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// Track online users for offline message handling
const onlineUsers = new Map(); // userId -> socketId

// Helper function to check if user is online
function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

// Helper function to get user's socket
function getUserSocket(userId) {
  const socketId = onlineUsers.get(userId.toString());
  return socketId ? io.sockets.sockets.get(socketId) : null;
}

// Function to deliver offline messages to a user
async function deliverOfflineMessages(userId, socket) {
  try {
    console.log(`Checking offline messages for user ${userId}`);
    
    // Get all undelivered messages for this user from chats they're a member of
    const query = `
      SELECT DISTINCT m.* 
      FROM messages m
      JOIN chat_members cm ON m.chat_id = cm.chat_id
      WHERE cm.user_id = $1 
        AND m.sender_id != $1 
        AND (m.delivered = false OR m.delivered IS NULL)
      ORDER BY m.created_at ASC
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    if (rows.length > 0) {
      console.log(`Delivering ${rows.length} offline messages to user ${userId}`);
      
      // Group messages by chat_id for better organization
      const messagesByChat = {};
      rows.forEach(msg => {
        if (!messagesByChat[msg.chat_id]) {
          messagesByChat[msg.chat_id] = [];
        }
        messagesByChat[msg.chat_id].push(msg);
      });
      
      // Send offline messages notification
      socket.emit('offline_messages', {
        totalCount: rows.length,
        messagesByChat
      });
      
      // Mark these messages as delivered
      const messageIds = rows.map(m => m.id);
      if (messageIds.length > 0) {
        await pool.query(
          `UPDATE messages SET delivered = true WHERE id = ANY($1)`,
          [messageIds]
        );
        console.log(`Marked ${messageIds.length} messages as delivered for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error delivering offline messages:', error);
  }
}

// Function to check if a user is online before sending message
async function sendMessageToUser(userId, chatId, message, eventName = 'message') {
  const userSocket = getUserSocket(userId);
  if (userSocket && userSocket.rooms.has(`chat:${chatId}`)) {
    // User is online and in the chat room - send immediately
    userSocket.emit(eventName, message);
    
    // Mark as delivered immediately for online users
    try {
      await pool.query('UPDATE messages SET delivered = true WHERE id = $1', [message.id]);
    } catch (e) {
      console.error('Error marking message as delivered:', e);
    }
    
    return true; // Message delivered
  }
  return false; // Message will remain undelivered (offline)
}

// Simple login stub: returns JWT for a given user id (for demo only)
app.post('/auth/login', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Fetch recent messages for a chat
app.get('/chats/:chatId/messages', async (req, res) => {
  const chatId = Number(req.params.chatId);
  try {
    const q = 'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC LIMIT 200';
    const { rows } = await pool.query(q, [chatId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.userId;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log('user connected', userId);
  
  // Track this user as online
  onlineUsers.set(userId.toString(), socket.id);
  console.log(`User ${userId} is now online. Total online users: ${onlineUsers.size}`);
  
  // Deliver any offline messages immediately when user connects
  deliverOfflineMessages(userId, socket);

  socket.on('join', async ({ chatId }) => {
    socket.join(`chat:${chatId}`);
    console.log(`user ${userId} joined chat:${chatId}`);
    
    // Get all sockets in this room for debugging
    const socketsInRoom = await io.in(`chat:${chatId}`).allSockets();
    console.log(`Total users in chat:${chatId} = ${socketsInRoom.size}`);
    
    socket.to(`chat:${chatId}`).emit('user_joined', { userId });

    // Don't send historical messages via socket - frontend loads them via HTTP API
    // Only send truly undelivered messages if needed (for now, comment this out)
    /*
    try {
      const { rows } = await pool.query(
        'SELECT * FROM messages WHERE chat_id=$1 AND delivered=false ORDER BY created_at ASC',
        [chatId]
      );
      for (const m of rows) {
        socket.emit('message', m);
      }
    } catch (e) {
      console.error('fetch undelivered', e);
    }
    */
  });

  socket.on('leave', ({ chatId }) => {
    socket.leave(`chat:${chatId}`);
    socket.to(`chat:${chatId}`).emit('user_left', { userId });
  });

  socket.on('typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user_typing', { userId });
  });
  socket.on('stop_typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('user_stop_typing', { userId });
  });

  socket.on('send_message', async ({ chatId, body, tempId }) => {
    try {
      const insert = await pool.query(
        'INSERT INTO messages (chat_id, sender_id, body, delivered) VALUES ($1,$2,$3,$4) RETURNING *',
        [chatId, userId, body, false] // Initially set delivered to false
      );
      const message = insert.rows[0];
      
      console.log(`Message sent by user ${userId} to chat ${chatId}: "${body}"`);
      
      // Get all members of this chat
      const { rows: chatMembers } = await pool.query(
        'SELECT user_id FROM chat_members WHERE chat_id = $1 AND user_id != $2',
        [chatId, userId]
      );
      
      let deliveredCount = 0;
      let totalRecipients = chatMembers.length;
      
      // Try to deliver to each chat member
      for (const member of chatMembers) {
        const delivered = await sendMessageToUser(member.user_id, chatId, message);
        if (delivered) {
          deliveredCount++;
        }
      }
      
      console.log(`Message delivered to ${deliveredCount}/${totalRecipients} online recipients`);
      
      // If no one received the message, keep it as undelivered
      if (deliveredCount === 0 && totalRecipients > 0) {
        console.log(`Message ${message.id} stored as offline message`);
      }
      
      // Send confirmation back to sender
      socket.emit('message_sent', { 
        tempId, 
        id: message.id, 
        message,
        deliveredCount,
        totalRecipients
      });
      
      console.log(`Message broadcast complete for chat:${chatId}`);
    } catch (e) {
      console.error('send_message error', e);
      socket.emit('error', { message: 'message_failed' });
    }
  });

  socket.on('ack', async ({ messageId, chatId, type }) => {
    try {
      if (type === 'delivered') {
        await pool.query('UPDATE messages SET delivered=true WHERE id=$1', [messageId]);
      } else if (type === 'read') {
        await pool.query('UPDATE messages SET read=true WHERE id=$1', [messageId]);
      }
    } catch (e) { console.error('ack error', e); }
  });

  socket.on('disconnect', (reason) => {
    console.log('user disconnected', userId, reason);
    
    // Remove user from online users
    onlineUsers.delete(userId.toString());
    console.log(`User ${userId} is now offline. Total online users: ${onlineUsers.size}`);
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log('Server listening on', PORT));
