import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:4001';

export default function ChatSidebar({ onChatSelect, selectedChatId, token, userId, isMobile, onClose }) {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  const fetchChats = async () => {
    try {
      // For now, we'll create a simple endpoint call
      // Since we don't have a chats endpoint, we'll mock it with known data
      const mockChats = [
        { id: 1, type: 'group', name: 'General Chat', lastMessage: 'Welcome to our group!', lastActivity: new Date() },
      ];
      setChats(mockChats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Mock user data - in a real app, you'd fetch this from the backend
      const mockUsers = {
        1: 'Test User',
        2: 'Alice Johnson', 
        3: 'Bob Smith',
        4: 'Charlie Brown'
      };
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getUserName = (id) => {
    const userNames = {
      1: 'Test User',
      2: 'Alice Johnson',
      3: 'Bob Smith',
      4: 'Charlie Brown'
    };
    return userNames[id] || `User ${id}`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h3>Chats</h3>
        </div>
        <div style={styles.loading}>Loading chats...</div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.sidebar,
      ...(isMobile ? styles.mobileSidebar : {})
    }}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h3>💬 Chat Rooms</h3>
          {isMobile && (
            <button 
              style={styles.closeButton} 
              onClick={onClose}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>
        <div style={styles.onlineIndicator}>
          <span style={styles.onlineDot}></span>
          Online
        </div>
      </div>
      
      <div style={styles.chatList}>
        {chats.map((chat) => {
          const isActive = selectedChatId === chat.id.toString();
          return (
            <div
              key={chat.id}
              className="chat-item"
              style={{
                ...styles.chatItem,
                ...(isActive ? styles.activeChatItem : {})
              }}
              onClick={() => onChatSelect(chat.id.toString())}
            >
              <div style={{
                ...styles.chatIcon,
                ...(isActive ? styles.activeChatIcon : {})
              }}>
                {chat.type === 'group' ? '👥' : '💬'}
              </div>
              <div style={styles.chatInfo}>
                <div style={{
                  ...styles.chatName,
                  color: isActive ? 'white' : '#1f2937'
                }}>
                  {chat.name}
                  {chat.type === 'group' && <span style={styles.groupBadge}>Group</span>}
                </div>
                <div style={{
                  ...styles.lastMessage,
                  ...(isActive ? styles.activeLastMessage : {})
                }}>
                  {chat.lastMessage}
                </div>
              </div>
              <div style={styles.chatMeta}>
                <div style={{
                  ...styles.time,
                  ...(isActive ? styles.activeTime : {})
                }}>
                  {formatTime(chat.lastActivity)}
                </div>
                {/* Add unread badge for demo */}
                {!isActive && chat.id === 2 && (
                  <div style={styles.unreadBadge}>2</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.userInfo}>
        <div style={styles.currentUser}>
          <span style={styles.userAvatar}>👤</span>
          <span>Logged in as {getUserName(userId)}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '320px',
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafe 100%)',
    borderRight: '1px solid #e1e8f0',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    zIndex: 1000
  },
  mobileSidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1001,
    borderRight: 'none'
  },
  header: {
    padding: '25px 20px',
    borderBottom: '1px solid #e1e8f0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  onlineIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#e8f5e8',
    marginTop: '8px'
  },
  onlineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
    marginRight: '6px',
    boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)'
  },
  loading: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '14px'
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0'
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f3f4f6',
    transition: 'all 0.2s ease',
    margin: '2px 8px',
    borderRadius: '12px',
    position: 'relative'
  },
  activeChatItem: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    transform: 'scale(1.02)'
  },
  chatIcon: {
    fontSize: '28px',
    marginRight: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '45px',
    height: '45px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
  },
  activeChatIcon: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white'
  },
  chatInfo: {
    flex: 1,
    minWidth: 0
  },
  chatName: {
    fontWeight: '600',
    fontSize: '15px',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center'
  },
  groupBadge: {
    fontSize: '10px',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '12px',
    marginLeft: '8px',
    fontWeight: '500'
  },
  lastMessage: {
    fontSize: '13px',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  activeLastMessage: {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  chatMeta: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  time: {
    fontSize: '11px',
    color: '#9ca3af',
    marginBottom: '4px'
  },
  activeTime: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
    minWidth: '18px',
    textAlign: 'center'
  },
  userInfo: {
    padding: '20px',
    borderTop: '1px solid #e1e8f0',
    background: 'linear-gradient(135deg, #f8fafe 0%, #ffffff 100%)'
  },
  currentUser: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#6b7280',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
  },
  userAvatar: {
    marginRight: '10px',
    fontSize: '16px',
    padding: '8px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  }
};