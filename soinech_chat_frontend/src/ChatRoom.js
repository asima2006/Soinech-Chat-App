import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:4001';

export default function ChatRoom({ token, chatId, userId, isMobile, onToggleSidebar, showSidebar }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchMessages() {
      try {
        console.log('Fetching messages for chat:', chatId);
        // Clear messages when switching chats
        setMessages([]);
        
        const res = await axios.get(`${API_URL}/chats/${chatId}/messages`);
        console.log('Loaded messages from API:', res.data.length);
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    const s = io(API_URL, { auth: { token } });
    setSocket(s);

    let currentChatId = null;

    s.on('connect', () => {
      console.log('Connected to server, joining chat:', chatId);
      // Leave previous chat if any
      if (currentChatId && currentChatId !== chatId) {
        s.emit('leave', { chatId: currentChatId });
      }
      // Join current chat
      s.emit('join', { chatId });
      currentChatId = chatId;
    });

    s.on('message', (msg) => {
      console.log('Received message:', msg);
      // Add messages from other users (sender won't receive their own messages via this event)
      // Check for duplicates before adding
      setMessages((prev) => {
        const exists = prev.some(existingMsg => existingMsg.id === msg.id);
        if (exists) {
          console.log('Duplicate message detected, ignoring:', msg.id);
          return prev;
        }
        return [...prev, msg];
      });
    });

    // Handle offline messages when user comes online
    s.on('offline_messages', ({ totalCount, messagesByChat }) => {
      console.log(`Received ${totalCount} offline messages`);
      
      if (totalCount > 0) {
        setMessages(prevMessages => {
          let newMessages = [...prevMessages];
          
          // Add offline messages for current chat
          if (messagesByChat[chatId]) {
            messagesByChat[chatId].forEach(message => {
              const exists = newMessages.some(m => m.id === message.id);
              if (!exists) {
                newMessages.push(message);
              }
            });
          }
          
          return newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
        
        console.log(`You have ${totalCount} new messages while you were offline`);
      }
    });

    s.on('user_typing', ({ userId: typingUserId }) => {
      console.log('User typing:', typingUserId);
      // Don't show typing indicator for current user
      if (typingUserId != userId) {
        setTypingUsers((prev) => [...new Set([...prev, typingUserId])]);
      }
    });

    s.on('user_stop_typing', ({ userId: typingUserId }) => {
      console.log('User stopped typing:', typingUserId);
      setTypingUsers((prev) => prev.filter((id) => id !== typingUserId));
    });

    s.on('message_sent', ({ tempId, id, message, deliveredCount, totalRecipients }) => {
      console.log('Message sent confirmation:', { tempId, id, message, deliveredCount, totalRecipients });
      // Update temporary message with real data from server including delivery info
      setMessages((prev) => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...message, tempId: undefined, deliveredCount, totalRecipients } 
          : msg
      ));
    });

    s.on('user_joined', ({ userId: joinedUserId }) => {
      console.log('User joined chat:', joinedUserId);
    });

    s.on('user_left', ({ userId: leftUserId }) => {
      console.log('User left chat:', leftUserId);
    });

    s.on('error', (error) => {
      console.error('Socket error:', error);
    });

    s.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    return () => {
      console.log('Cleaning up socket connection for chat:', chatId);
      if (currentChatId) {
        s.emit('leave', { chatId: currentChatId });
      }
      s.disconnect();
    };
  }, [token, chatId, userId]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      const tempId = Date.now();
      const tempMessage = {
        tempId,
        chat_id: chatId,
        sender_id: userId,
        body: input.trim(),
        created_at: new Date().toISOString(),
        delivered: false,
        read: false
      };

      // Add temporary message immediately for better UX
      setMessages((prev) => [...prev, tempMessage]);

      // Send to server
      socket.emit('send_message', { chatId, body: input.trim(), tempId });
      setInput('');
      // Stop typing when message is sent
      handleStopTyping();
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { chatId });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 3000);
    }
  };
  
  const handleStopTyping = () => {
    if (socket) {
      socket.emit('stop_typing', { chatId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserName = (senderId) => {
    const userNames = {
      1: 'Test User',
      2: 'Alice Johnson',
      3: 'Bob Smith', 
      4: 'Charlie Brown'
    };
    return userNames[senderId] || `User ${senderId}`;
  };

  const getChatName = () => {
    if (chatId === '1') return 'General Chat';
    if (chatId === '2') return 'Private Chat';
    return `Chat Room ${chatId}`;
  };

  // Function to show delivery status for sent messages
  const getDeliveryStatus = (message) => {
    if (message.sender_id === parseInt(userId)) {
      // This is our message, show delivery status
      if (message.deliveredCount !== undefined) {
        if (message.deliveredCount === 0) {
          return ' 📤'; // Sent but not delivered (offline)
        } else if (message.deliveredCount < message.totalRecipients) {
          return ' 📨'; // Partially delivered
        } else {
          return ' ✓'; // Delivered to all
        }
      }
      return message.delivered ? ' ✓' : ' 📤';
    }
    return null;
  };

  return (
    <div style={styles.chatContainer}>
      {/* Chat Header */}
      <div style={styles.chatHeader}>
        <div style={styles.headerLeft}>
          {isMobile && (
            <button 
              style={styles.menuButton} 
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <h3 style={styles.chatTitle}>
            {chatId === '1' ? '👥' : '💬'} {getChatName()}
          </h3>
        </div>
        <div style={styles.onlineStatus}>
          <span style={styles.onlineDot}></span>
          Online
        </div>
      </div>

      {/* Messages Area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <div style={styles.emptyText}>No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id || m.tempId} 
              className={`message-item ${m.sender_id == userId ? 'own-message' : 'other-message'}`}
              style={{
                ...styles.messageItem,
                ...(m.sender_id == userId ? styles.ownMessage : styles.otherMessage),
                ...(m.tempId && !m.id ? styles.pendingMessage : {})
              }}
            >
              <div style={styles.messageHeader}>
                <span style={styles.senderName}>
                  {getUserName(m.sender_id)}
                </span>
                <span style={styles.messageTime}>
                  {formatTime(m.created_at)}
                  {m.tempId && !m.id && <span style={styles.pendingIndicator}> ⏳</span>}
                  {getDeliveryStatus(m) && (
                    <span style={styles.deliveryStatus} title="Delivery status">
                      {getDeliveryStatus(m)}
                    </span>
                  )}
                </span>
              </div>
              <div style={styles.messageBody}>
                {m.body}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div style={styles.typingIndicator}>
          <div style={styles.typingAnimation}>
            <span style={styles.typingDot} className="typing-dot"></span>
            <span style={styles.typingDot} className="typing-dot"></span>
            <span style={styles.typingDot} className="typing-dot"></span>
          </div>
          <span style={styles.typingText}>
            {typingUsers.map(id => getUserName(id)).join(', ')} 
            {typingUsers.length === 1 ? ' is' : ' are'} typing...
          </span>
        </div>
      )}

      {/* Message Input */}
      <div style={styles.inputContainer}>
        <input
          style={styles.messageInput}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Trigger typing event when user starts typing
            if (e.target.value.trim()) {
              handleTyping();
            } else {
              handleStopTyping();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            } else {
              // Trigger typing on any key press
              handleTyping();
            }
          }}
          onBlur={handleStopTyping}
          placeholder="Type a message..."
        />
        <button 
          style={{
            ...styles.sendButton,
            ...(input.trim() ? styles.sendButtonActive : {})
          }}
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          📤
        </button>
      </div>
    </div>
  );
}

const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    flex: 1,
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafe 100%)',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden'
  },
  chatHeader: {
    padding: '20px 25px',
    borderBottom: '1px solid #e1e8f0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(102, 126, 234, 0.15)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  menuButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  chatTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  onlineStatus: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    color: '#e8f5e8',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '6px 12px',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)'
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
    marginRight: '6px',
    boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: 'linear-gradient(180deg, #f8fafe 0%, #ffffff 100%)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6b7280'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500'
  },
  messageItem: {
    marginBottom: '20px',
    padding: '16px 20px',
    borderRadius: '20px',
    maxWidth: '75%',
    wordWrap: 'break-word',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  ownMessage: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    marginLeft: 'auto',
    borderBottomRightRadius: '6px'
  },
  otherMessage: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
    color: '#1f2937',
    marginRight: 'auto',
    borderBottomLeftRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  pendingMessage: {
    opacity: 0.7,
    transform: 'scale(0.98)'
  },
  pendingIndicator: {
    fontSize: '10px',
    opacity: 0.6
  },
  deliveryStatus: {
    marginLeft: '5px',
    fontSize: '12px',
    opacity: 0.7
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px'
  },
  senderName: {
    fontWeight: '600',
    opacity: 0.9
  },
  messageTime: {
    opacity: 0.7,
    fontSize: '11px'
  },
  messageBody: {
    fontSize: '15px',
    lineHeight: '1.5'
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 25px',
    fontSize: '14px',
    color: '#6b7280',
    background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
    borderTop: '1px solid #e1e8f0',
    minHeight: '50px',
    backdropFilter: 'blur(10px)'
  },
  typingAnimation: {
    display: 'flex',
    marginRight: '10px',
    padding: '8px 12px',
    borderRadius: '20px',
    background: 'rgba(102, 126, 234, 0.1)'
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    margin: '0 1px',
    animation: 'typingPulse 1.5s infinite ease-in-out'
  },
  typingText: {
    fontStyle: 'italic',
    fontWeight: '500'
  },
  inputContainer: {
    display: 'flex',
    padding: '20px 25px',
    borderTop: '1px solid #e1e8f0',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafe 100%)',
    gap: '15px',
    '@media (max-width: 768px)': {
      padding: '15px 20px',
      gap: '10px'
    }
  },
  messageInput: {
    flex: 1,
    padding: '14px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '25px',
    fontSize: '15px',
    outline: 'none',
    background: 'white',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    minWidth: 0
  },
  sendButton: {
    padding: '14px 18px',
    border: 'none',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  sendButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  }
};
