import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { Button, Form, Card, Alert, Spinner, ListGroup, Badge, Tab, Tabs, Modal, FormControl } from 'react-bootstrap';
import { FaPaperPlane, FaImage, FaTimes, FaUser, FaPlus, FaSearch } from 'react-icons/fa';
import { getAllUsers } from '../../services/firestore';
import './Chat.css';

const AdminChat = () => {
  const { currentUser } = useAuth();
  const { 
    chats, 
    pendingChats,
    currentChat, 
    messages, 
    loading, 
    error, 
    selectChat, 
    assignAdmin,
    sendMessage, 
    sendImage,
    refreshChats,
    startNewChat 
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Refresh chats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshChats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshChats]);
  
  // Load customers for new chat modal
  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const allUsers = await getAllUsers();
      // Filter only customers
      const customerUsers = allUsers.filter(user => user.role === 'customer');
      setCustomers(customerUsers);
    } catch (err) {
      console.error('Error loading customers:', err);
      setLocalError('Failed to load customers. Please try again.');
    } finally {
      setLoadingCustomers(false);
    }
  };
  
  // Open new chat modal
  const openNewChatModal = () => {
    setShowNewChatModal(true);
    loadCustomers();
    setSearchTerm('');
    setSelectedCustomerId(null);
    setLocalError(null);
  };
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Start a new chat with selected customer
  const handleStartNewChat = async () => {
    if (!selectedCustomerId) {
      setLocalError('Please select a customer');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await startNewChat(selectedCustomerId);
      setShowNewChatModal(false);
      setActiveTab('active');
    } catch (err) {
      console.error('Error starting new chat:', err);
      setLocalError(err.message || 'Failed to start new chat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle chat selection
  const handleSelectChat = async (chatId) => {
    try {
      await selectChat(chatId);
    } catch (err) {
      setLocalError('Failed to load chat. Please try again.');
    }
  };

  // Handle admin assignment to chat
  const handleAssignChat = async (chatId) => {
    try {
      setIsSubmitting(true);
      await assignAdmin(chatId);
      setActiveTab('active');
    } catch (err) {
      setLocalError('Failed to assign chat. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!messageText.trim() && !imageFile) || isSubmitting || !currentChat) return;
    
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

  // Format date for chat list
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
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

  // Count unread messages for a chat
  const countUnreadMessages = (chatId) => {
    return messages.filter(m => 
      m.chatId === chatId && 
      m.senderId !== currentUser?.uid && 
      !m.read
    ).length;
  };

  // Render chat list item
  const renderChatItem = (chat, isPending = false) => {
    const isActive = currentChat && chat.id === currentChat.id;
    const unreadCount = countUnreadMessages(chat.id);
    
    return (
      <ListGroup.Item 
        key={chat.id} 
        action 
        active={isActive}
        className="chat-list-item"
        onClick={() => isPending ? handleAssignChat(chat.id) : handleSelectChat(chat.id)}
      >
        <div className="chat-item-avatar">
          <FaUser />
        </div>
        <div className="chat-item-content">
          <div className="chat-item-header">
            <span className="chat-item-name">Customer</span>
            <span className="chat-item-time">{formatDate(chat.updatedAt)}</span>
          </div>
          <div className="chat-item-message">
            {isPending ? (
              <span className="text-primary">New chat request</span>
            ) : (
              <span>{chat.lastMessage || 'No messages yet'}</span>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge pill variant="danger" className="chat-item-badge">
            {unreadCount}
          </Badge>
        )}
      </ListGroup.Item>
    );
  };

  // Render admin chat interface
  return (
    <div className="admin-chat-container">
      <Card className="admin-chat-card">
        <Card.Header className="admin-chat-header">
          <h5 className="mb-0">Customer Support</h5>
        </Card.Header>
        
        <div className="admin-chat-content">
          <div className="chat-sidebar">
            <div className="new-chat-button-container">
              <Button 
                variant="primary" 
                className="new-chat-button" 
                onClick={openNewChatModal}
              >
                <FaPlus className="mr-2" /> New Chat
              </Button>
            </div>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="chat-tabs"
            >
              <Tab eventKey="active" title="Active Chats">
                <ListGroup variant="flush" className="chat-list">
                  {loading && chats.length === 0 ? (
                    <div className="text-center p-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="text-center text-muted p-3">
                      No active chats
                    </div>
                  ) : (
                    chats.map(chat => renderChatItem(chat))
                  )}
                </ListGroup>
              </Tab>
              
              <Tab 
                eventKey="pending" 
                title={
                  <span>
                    Pending
                    {pendingChats.length > 0 && (
                      <Badge pill variant="danger" className="ml-1">
                        {pendingChats.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                <ListGroup variant="flush" className="chat-list">
                  {loading && pendingChats.length === 0 ? (
                    <div className="text-center p-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : pendingChats.length === 0 ? (
                    <div className="text-center text-muted p-3">
                      No pending chat requests
                    </div>
                  ) : (
                    pendingChats.map(chat => renderChatItem(chat, true))
                  )}
                </ListGroup>
              </Tab>
            </Tabs>
          </div>
          
          <div className="chat-main">
            {currentChat ? (
              <>
                <div className="chat-main-header">
                  <div className="chat-main-title">
                    <FaUser className="mr-2" />
                    <span>Customer</span>
                  </div>
                </div>
                
                <div className="chat-messages">
                  {loading && !messages.length ? (
                    <div className="text-center p-3">
                      <Spinner animation="border" />
                    </div>
                  ) : (
                    <div className="messages-container">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted p-3">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map(message => renderMessage(message))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {(error || localError) && (
                  <Alert variant="danger" className="m-2">
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
              </>
            ) : (
              <div className="chat-placeholder">
                <div className="text-center">
                  <FaUser size={48} className="mb-3 text-muted" />
                  <h5>Select a chat to start messaging</h5>
                  <p className="text-muted">
                    Choose an active chat from the sidebar or accept a pending chat request.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {/* New Chat Modal */}
      <Modal show={showNewChatModal} onHide={() => setShowNewChatModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Start New Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {localError && <Alert variant="danger">{localError}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Search Customers</Form.Label>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <FormControl
                type="text"
                placeholder="Search by email or name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Form.Group>
          
          <div className="customer-list">
            {loadingCustomers ? (
              <div className="text-center p-3">
                <Spinner animation="border" size="sm" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center text-muted p-3">
                No customers found
              </div>
            ) : (
              <ListGroup>
                {filteredCustomers.map(customer => (
                  <ListGroup.Item 
                    key={customer.id}
                    action
                    active={selectedCustomerId === customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className="customer-item"
                  >
                    <div className="customer-info">
                      <div className="customer-name">
                        {customer.displayName || 'Customer'}
                      </div>
                      <div className="customer-email">
                        {customer.email}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStartNewChat}
            disabled={!selectedCustomerId || isSubmitting}
          >
            {isSubmitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              'Start Chat'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminChat;