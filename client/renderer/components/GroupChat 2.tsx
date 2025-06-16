import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  CircularProgress
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender: string;
  sender_username: string;
  group: string;
  timestamp: string;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthStore();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Fetch the current user's ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiGet('/api/users/me/');
        if (response.data && response.data.id) {
          setUserId(response.data.id);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Get initial messages
    fetchMessages();
    
    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : '144.122.71.171';
    
    // Add the access token as a query parameter for WebSocket authentication
    const wsUrl = `${protocol}//${host}/ws/chat/${groupId}/?token=${accessToken}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message') {
        setMessages(prevMessages => [...prevMessages, data.message]);
        // Scroll to bottom on new message
        scrollToBottom();
      } else if (data.type === 'error') {
        setError(data.message);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to chat service. Please try again later.');
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    setWebsocket(ws);
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [groupId, accessToken]);

  // Fetch initial messages from the API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/groups/${groupId}/messages/recent/`);
      
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        setError('Unexpected response format');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    }
  };

  // Send a message via WebSocket
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !websocket) return;
    
    // Send message via WebSocket
    websocket.send(JSON.stringify({
      type: 'chat_message',
      message: newMessage
    }));
    
    // Clear input field
    setNewMessage('');
  };

  // Fallback: Send message via REST API if WebSocket fails
  const sendMessageViaApi = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await apiPost(`/api/groups/${groupId}/messages/`, {
        content: newMessage
      });
      
      // Add the new message to the list
      if (response.data) {
        setMessages(prevMessages => [...prevMessages, response.data]);
        scrollToBottom();
      }
      
      // Clear input field
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <Paper elevation={3} sx={{ height: '500px', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {groupName} Chat
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Messages area */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : messages.length === 0 ? (
          <Typography align="center" color="text.secondary">
            No messages yet. Start the conversation!
          </Typography>
        ) : (
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                alignItems="flex-start"
                sx={{
                  textAlign: message.sender === userId ? 'right' : 'left',
                  flexDirection: 'column',
                  alignItems: message.sender === userId ? 'flex-end' : 'flex-start',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {message.sender_username} • {formatTimestamp(message.timestamp)}
                </Typography>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1,
                    maxWidth: '70%',
                    bgcolor: message.sender === userId ? 'primary.light' : 'grey.100',
                    color: message.sender === userId ? 'white' : 'inherit',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                </Paper>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      
      {/* Message input area */}
      <Box component="form" onSubmit={sendMessage} sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          size="small"
          disabled={!websocket || websocket.readyState !== WebSocket.OPEN}
          sx={{ mr: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          disabled={!newMessage.trim() || !websocket || websocket.readyState !== WebSocket.OPEN}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default GroupChat; 