import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { apiGet, apiPost } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender: string;
  sender_id: string;
  sender_username: string;
  timestamp: string;
  group: string;
}

interface User {
  id: string;
  username: string;
  email?: string;
}

interface GroupChatProps {
  groupId: string;
  groupName: string;
  currentUser: User | null;
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthStore();

  // Fetch historical messages when component mounts
  useEffect(() => {
    if (groupId) {
      fetchMessages();
      setupWebSocket();
    }

    return () => {
      // Clean up WebSocket connection when component unmounts
      if (socket) {
        socket.close();
      }
    };
  }, [groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/messages/group/${groupId}/`);
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    // Close existing socket if any
    if (socket) {
      socket.close();
    }

    // Create a new WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${groupId}/?token=${accessToken}`;
    
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
    };

    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        // Use a callback to ensure we're working with the latest state
        setMessages(prevMessages => {
          // Check if the message already exists in our messages array
          const messageExists = prevMessages.some(msg => msg.id === data.message.id);
          if (messageExists) {
            return prevMessages;
          }
          return [...prevMessages, data.message];
        });
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (groupId) {
          setupWebSocket();
        }
      }, 3000);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Trying to reconnect...');
    };

    setSocket(newSocket);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      // Optimistically add the message to the UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: currentUser.id,
        sender_id: currentUser.id,
        sender_username: currentUser.username,
        timestamp: new Date().toISOString(),
        group: groupId
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage('');
      
      // Send message via REST API
      await apiPost('/api/messages/', {
        group: groupId,
        content: newMessage
      });
      
      // The actual message with server-assigned ID will come through the WebSocket
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  return (
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">{groupName} Chat</Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, maxHeight: '60vh' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button variant="outlined" onClick={fetchMessages} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message, index) => {
              const isCurrentUser = currentUser?.id === message.sender_id;
              
              return (
                <Box key={message.id || index}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      textAlign: isCurrentUser ? 'right' : 'left',
                      flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main',
                          ml: isCurrentUser ? 2 : 0,
                          mr: isCurrentUser ? 0 : 2,
                        }}
                      >
                        {message.sender_username?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                          sx={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}
                        >
                          {isCurrentUser ? 'You' : message.sender_username}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1.5,
                              mt: 0.5,
                              mb: 0.5,
                              display: 'inline-block',
                              maxWidth: '70%',
                              bgcolor: isCurrentUser ? 'primary.main' : 'grey.100',
                              color: isCurrentUser ? '#ffffff' : 'text.primary',
                              borderRadius: '10px',
                              wordBreak: 'break-word',
                              textAlign: 'left',
                              fontWeight: isCurrentUser ? 500 : 400
                            }}
                          >
                            {message.content}
                          </Paper>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < messages.length - 1 && (
                    <Divider 
                      variant="middle" 
                      sx={{ 
                        my: 1,
                        opacity: 0.5,
                        display: new Date(messages[index + 1].timestamp).getDate() !== 
                                new Date(message.timestamp).getDate() ? 'block' : 'none'
                      }} 
                    />
                  )}
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
            disabled={!currentUser}
            sx={{
              '& .MuiInputBase-input': {
                color: 'black' // Ensures text in the input field is black
              },
              backgroundColor: 'white'
            }}
          />
          <IconButton 
            color="primary" 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || !currentUser}
            sx={{ ml: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default GroupChat; 