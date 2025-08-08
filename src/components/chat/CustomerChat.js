import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Button, Form, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPaperPlane, FaImage, FaTimes, FaComments } from 'react-icons/fa';
import './Chat.css';

// Alert is properly imported from react-bootstrap

const CustomerChat = () => {
  const { currentUser } = useAuth();
  const { 
    chats, 
    currentChat, 
    messages, 
    loading, 
    error, 
    startNewChat, 
    selectChat, 
    sendMessage, 
    sendImage 
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle chat open/close
  const toggleChat = async () => {
    if (!isChatOpen) {
      try {
        // Check if user is logged in
        if (!currentUser) {
          setLocalError('Please log in to use the chat feature.');
          return;
        }
        
        // Clear any previous errors
        setLocalError(null);
        
        // Only attempt to start a new chat if we don't have one already
        // and this component is being used by a customer
        if (!currentChat) {
          // This component is only for customers to start chats
          // The startNewChat() without parameters is only for customers
          await startNewChat();
        }
        
        // Ensure we set chat to open even if there's an existing chat
        setIsChatOpen(true);
      } catch (err) {
        console.error('Chat error:', err);
        setLocalError(err.message || 'Failed to open chat. Please try again.');
      }
    } else {
      setIsChatOpen(false);
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !imageFile) || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setLocalError(null);
      
      if (imageFile) {
        try {
          await sendImage(imageFile, messageText);
          setImageFile(null);
          setImagePreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (imageError) {
          console.error('Error sending image:', imageError);
          throw new Error(imageError.message || 'Failed to upload image. Please try again.');
        }
      } else {
        await sendMessage(messageText);
      }
      
      setMessageText('');
    } catch (err) {
      console.error('Message submission error:', err);
      setLocalError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setLocalError('Please select an image file.');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setLocalError('Image size should be less than 5MB.');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        setLocalError('Failed to preview image. Please try again.');
        setImageFile(null);
      };
      reader.readAsDataURL(file);
      
      setLocalError(null);
    } catch (err) {
      console.error('Error handling image selection:', err);
      setLocalError('Failed to process image. Please try again.');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render chat bubble
  const renderMessage = (message) => {
    const isCurrentUser = message.senderId === currentUser?.uid;
    
    return (
      <div 
        key={message.id} 
        className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
      >
        {message.imageUrl && (
          <div className="message-image-container">
            <img 
              src={message.imageUrl} 
              alt="Shared" 
              className="message-image" 
              onClick={() => window.open(message.imageUrl, '_blank')}
            />
          </div>
        )}
        
        {message.text && <div className="message-text">{message.text}</div>}
        
        <div className="message-time">
          {formatTime(message.createdAt)}
          {isCurrentUser && (
            <span className="message-status">
              {message.read ? ' ✓✓' : ' ✓'}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render chat interface
  return (
    <div className="customer-chat-container">
      {/* Error Alert (outside of chat window) */}
      {localError && !isChatOpen && (
        <Alert 
          variant="danger" 
          className="chat-error-alert"
          onClose={() => setLocalError(null)} 
          dismissible
        >
          {localError}
        </Alert>
      )}
      
      {/* Chat Button */}
      <Button 
        className="chat-toggle-button" 
        onClick={toggleChat}
        variant="primary"
      >
        <FaComments />
        {!isChatOpen && currentUser && chats.some(chat => {
          const unreadMessages = messages.filter(m => 
            m.chatId === chat.id && 
            m.senderId !== currentUser?.uid && 
            !m.read
          );
          return unreadMessages.length > 0;
        }) && (
          <Badge pill variant="danger" className="chat-notification">!</Badge>
        )}
      </Button>

      {/* Chat Window */}
      {isChatOpen && (
        <Card className="chat-window">
          <Card.Header className="chat-header">
            <div>Customer Support</div>
            <Button 
              variant="link" 
              className="close-button" 
              onClick={toggleChat}
            >
              <FaTimes />
            </Button>
          </Card.Header>
          
          <Card.Body className="chat-body">
            {loading && !messages.length ? (
              <div className="text-center p-3">
                <Spinner animation="border" />
              </div>
            ) : (
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="text-center text-muted p-3">
                    Start a conversation with our support team.
                  </div>
                ) : (
                  messages.map(message => renderMessage(message))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            {(error || localError) && (
              <Alert variant="danger" className="mt-2 mb-2">
                {error || localError}
              </Alert>
            )}
            
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="remove-image-button" 
                  onClick={removeImage}
                >
                  <FaTimes />
                </Button>
              </div>
            )}
            
            <Form onSubmit={handleSubmit} className="chat-form">
              <div className="chat-input-container">
                <Form.Control
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSubmitting}
                />
                
                <div className="chat-buttons">
                  <Button 
                    variant="link" 
                    className="image-button" 
                    onClick={() => fileInputRef.current.click()}
                    disabled={isSubmitting}
                  >
                    <FaImage />
                  </Button>
                  
                  <Form.Control
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="d-none"
                  />
                  
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="send-button" 
                    disabled={(!messageText.trim() && !imageFile) || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FaPaperPlane />
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CustomerChat;