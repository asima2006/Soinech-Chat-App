# 💬 Soinech Chat

A real-time chat application built with React, Node.js, Socket.IO, and PostgreSQL. Features include offline message delivery, responsive design, and modern UI.

## ✨ Features

- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Offline Message Handling** - Messages are delivered when users come back online
- **Delivery Status Indicators** - Visual feedback for message delivery status
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Beautiful gradient design with glassmorphism effects
- **User Authentication** - Simple JWT-based authentication
- **Cloud Database** - Powered by Neon PostgreSQL database
- **TypeScript Ready** - Built with modern JavaScript/React practices

## 📱 Screenshots

### Desktop View
- Clean sidebar with chat rooms
- Real-time messaging interface
- Delivery status indicators (📤 📨 ✓)

### Mobile View
- Responsive hamburger menu
- Full-screen chat experience
- Touch-friendly interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (Neon DB configured)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asima2006/Soinech-Chat-App.git
   cd soinech_chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in `soinech_chat_backend/`:
   ```env
   # Database Configuration (Neon DB)
   PGHOST=your-neon-host
   PGDATABASE=your-database-name
   PGUSER=your-username
   PGPASSWORD=your-password
   PGPORT=5432
   
   # Server Configuration
   PORT=4001
   JWT_SECRET=your-jwt-secret
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:4001`
   - Frontend development server on `http://localhost:3000`

## 🏗️ Project Structure

```
soinech_chat/
├── soinech_chat_backend/          # Node.js backend
│   ├── index.js                   # Main server file
│   ├── setup_neon_db.sql         # Database schema
│   ├── package.json               # Backend dependencies
│   └── .env                       # Environment variables
├── soinech_chat_frontend/         # React frontend
│   ├── src/
│   │   ├── App.js                 # Main app component
│   │   ├── ChatRoom.js            # Chat interface
│   │   ├── ChatSidebar.js         # Sidebar component
│   │   ├── App.css                # Global styles
│   │   └── index.js               # React entry point
│   ├── public/
│   │   └── index.html             # HTML template
│   └── package.json               # Frontend dependencies
├── package.json                   # Root package.json for scripts
└── README.md                      # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **PostgreSQL** - Database (Neon)
- **JWT** - Authentication
- **dotenv** - Environment configuration

### Frontend
- **React** - UI framework
- **Socket.IO Client** - Real-time messaging
- **Axios** - HTTP requests
- **CSS3** - Modern styling with gradients and animations

### Database
- **PostgreSQL** - Primary database
- **Neon** - Cloud PostgreSQL service

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Chats Table
```sql
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('group', 'private')),
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Chat Members Table
```sql
CREATE TABLE chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT FALSE,
    read BOOLEAN DEFAULT FALSE
);
```

## 🧪 Testing

### Manual Testing
1. Open multiple browser tabs
2. Login as different users (1, 2, 3, 4)
3. Join the General Chat
4. Close one tab to simulate offline user
5. Send messages from other users
6. Reopen closed tab - user should receive offline messages

### Test Users
- **User ID 1**: Test User
- **User ID 2**: Alice Johnson
- **User ID 3**: Bob Smith
- **User ID 4**: Charlie Brown

### Delivery Status Icons
- **📤** - Sent but not delivered (recipients offline)
- **📨** - Partially delivered (some recipients online)
- **✓** - Delivered to all recipients
- **⏳** - Message being sent

## 🚀 Deployment

### Backend Deployment
- Configure environment variables for production
- Use PM2 or similar for process management
- Set up SSL/HTTPS
- Configure CORS for production domains

### Frontend Deployment
- Build production version: `npm run build`
- Deploy to Vercel, Netlify, or similar
- Update API endpoints for production

### Database
- Neon database is already configured for production
- Ensure SSL connections are enabled
- Set up database backups

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both frontend and backend in development mode
- `npm run start:backend` - Start only the backend server
- `npm run start:frontend` - Start only the frontend development server

### Backend Directory
- `npm start` - Start backend server
- `npm run dev` - Start backend with nodemon (auto-restart)

### Frontend Directory
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - User login

### Socket.IO Events

#### Client to Server
- `join` - Join a chat room
- `leave` - Leave a chat room
- `send_message` - Send a message
- `typing` - Start typing indicator
- `stop_typing` - Stop typing indicator

#### Server to Client
- `message` - Receive new message
- `offline_messages` - Receive offline messages on reconnect
- `message_sent` - Confirmation of sent message
- `user_typing` - User started typing
- `user_stop_typing` - User stopped typing
- `user_joined` - User joined chat
- `user_left` - User left chat

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions:
- Check the console for error messages
- Ensure all environment variables are set correctly
- Verify database connection
- Check Socket.IO connection status

## 🔄 Updates & Changelog

### Version 1.0.0
- Initial release
- Real-time messaging
- Offline message handling
- Responsive design
- Neon database integration

---

Built with ❤️ using modern web technologies
