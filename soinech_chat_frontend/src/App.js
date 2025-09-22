import React, { useState, useEffect } from 'react';
import ChatRoom from './ChatRoom';
import ChatSidebar from './ChatSidebar';
import axios from 'axios';

const API_URL = 'http://localhost:4001';

export default function App() {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState('');
  const [chatId, setChatId] = useState('1');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const login = async () => {
    if (!userId.trim()) {
      alert('Please enter a valid user ID');
      return;
    }
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { userId });
      setToken(res.data.token);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleChatSelect = (selectedChatId) => {
    setChatId(selectedChatId);
    if (isMobile) {
      setShowSidebar(false); // Hide sidebar on mobile when chat is selected
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (!token) {
    return (
      <div style={styles.loginContainer}>
        <div className="login-box" style={styles.loginBox}>
          <h2 className="login-title" style={styles.loginTitle}>💬 Soinech Chat</h2>
          <p style={styles.loginSubtitle}>Welcome! Please login to continue</p>
          
          <div style={styles.loginForm}>
            <input
              className="login-input"
              style={styles.loginInput}
              placeholder="Enter your User ID (1, 2, 3, or 4)"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />
            <button 
              style={styles.loginButton}
              onClick={login}
              disabled={!userId.trim()}
            >
              Login
            </button>
          </div>
          
          <div style={styles.helpText}>
            <p>💡 <strong>Available Users:</strong></p>
            <p>• User ID 1: Test User</p>
            <p>• User ID 2: Alice Johnson</p>
            <p>• User ID 3: Bob Smith</p>
            <p>• User ID 4: Charlie Brown</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={styles.appContainer}>
      {(showSidebar || !isMobile) && (
        <ChatSidebar 
          onChatSelect={handleChatSelect}
          selectedChatId={chatId}
          token={token}
          userId={userId}
          isMobile={isMobile}
          onClose={() => setShowSidebar(false)}
        />
      )}
      <ChatRoom 
        token={token} 
        chatId={chatId}
        userId={userId}
        isMobile={isMobile}
        onToggleSidebar={toggleSidebar}
        showSidebar={showSidebar}
      />
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    margin: 0,
    padding: 0,
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    position: 'relative'
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  loginBox: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    padding: '50px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    maxWidth: '450px',
    width: '100%',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    animation: 'fadeIn 0.6s ease-out'
  },
  loginTitle: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '10px',
    fontSize: '32px',
    fontWeight: '700'
  },
  loginSubtitle: {
    color: '#6b7280',
    marginBottom: '35px',
    fontSize: '16px'
  },
  loginForm: {
    marginBottom: '35px'
  },
  loginInput: {
    width: '100%',
    padding: '16px 20px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '15px',
    marginBottom: '20px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)'
  },
  loginButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
  },
  helpText: {
    textAlign: 'left',
    fontSize: '13px',
    color: '#6b7280',
    background: 'linear-gradient(135deg, #f8fafe 0%, #ffffff 100%)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    lineHeight: '1.6'
  }
};
