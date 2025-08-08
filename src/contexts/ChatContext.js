import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserChats,
  getPendingChats,
  getChatById,
  createChat,
  assignAdminToChat,
  sendTextMessage,
  sendImageMessage,
  getChatMessages,
  subscribeToMessages,
  markMessagesAsRead
} from '../services/chatService';

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const { currentUser, userRole } = useAuth();
  const [chats, setChats] = useState([]);
  const [pendingChats, setPendingChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Unsubscribe function for real-time messages
  const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);

  // Load user's chats
  useEffect(() => {
    async function loadChats() {
      if (!currentUser) {
        setChats([]);
        setPendingChats([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's chats
        const userChats = await getUserChats(currentUser.uid, userRole);
        setChats(userChats);

        // If user is admin, also get pending chats
        if (userRole === 'admin') {
          const adminPendingChats = await getPendingChats();
          setPendingChats(adminPendingChats);
        }
      } catch (err) {
        console.error('Error loading chats:', err);
        setError('Failed to load chats. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadChats();
  }, [currentUser, userRole]);

  // Subscribe to messages when current chat changes
  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeMessages) {
      unsubscribeMessages();
      setUnsubscribeMessages(null);
    }

    if (!currentChat) {
      setMessages([]);
      return;
    }

    // Subscribe to messages for the current chat
    const unsubscribe = subscribeToMessages(currentChat.id, (newMessages) => {
      setMessages(newMessages);
      
      // Mark messages as read if the user is viewing this chat
      if (currentUser) {
        markMessagesAsRead(currentChat.id, currentUser.uid).catch(err => {
          console.error('Error marking messages as read:', err);
        });
      }
    });

    setUnsubscribeMessages(() => unsubscribe);

    // Clean up subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentChat, currentUser]);

  // Start a new chat (for customers and admins)
  const startNewChat = async (customerId = null) => {
    if (!currentUser) {
      throw new Error('User must be logged in to start chats');
    }

    try {
      setLoading(true);
      setError(null);

      // For admin starting a chat with a specific customer
      if (userRole === 'admin') {
        // If customerId is provided, start a chat with that customer
        if (customerId) {
          // Check if admin already has an active chat with this customer
          const adminChats = await getUserChats(currentUser.uid, 'admin');
          const existingChatWithCustomer = adminChats.find(chat => 
            chat.customerId === customerId && 
            (chat.status === 'active' || chat.status === 'pending')
          );

          if (existingChatWithCustomer) {
            // Use existing chat
            const chatData = await getChatById(existingChatWithCustomer.id);
            setCurrentChat(chatData);
            return chatData;
          } else {
            // Create new chat with admin already assigned
            const chatId = await createChat(customerId, currentUser.uid);
            const chatData = await getChatById(chatId);
            
            // Update chats list
            setChats(prevChats => [chatData, ...prevChats]);
            setCurrentChat(chatData);
            
            return chatData;
          }
        } else {
          // Admin is opening the chat interface without selecting a customer
          // Just return the first active chat or null if none exists
          if (chats.length > 0) {
            const chatData = await getChatById(chats[0].id);
            setCurrentChat(chatData);
            return chatData;
          }
          return null;
        }
      }
      // For customers starting a chat
      else if (userRole === 'customer') {
        // Check if user already has an active chat
        const existingChats = await getUserChats(currentUser.uid, 'customer');
        const activeChat = existingChats.find(chat => 
          chat.status === 'active' || chat.status === 'pending'
        );

        if (activeChat) {
          // Use existing chat
          const chatData = await getChatById(activeChat.id);
          setCurrentChat(chatData);
          return chatData;
        } else {
          // Create new chat
          const chatId = await createChat(currentUser.uid);
          const chatData = await getChatById(chatId);
          
          // Update chats list
          setChats(prevChats => [chatData, ...prevChats]);
          setCurrentChat(chatData);
          
          return chatData;
        }
      } else {
        throw new Error('Invalid user role for starting chat');
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
      setError('Failed to start new chat. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Select a chat to view
  const selectChat = async (chatId) => {
    try {
      setLoading(true);
      setError(null);

      const chatData = await getChatById(chatId);
      if (!chatData) {
        throw new Error('Chat not found');
      }

      setCurrentChat(chatData);
      return chatData;
    } catch (err) {
      console.error('Error selecting chat:', err);
      setError('Failed to load chat. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign admin to a pending chat
  const assignAdmin = async (chatId) => {
    if (!currentUser || userRole !== 'admin') {
      throw new Error('Only admins can be assigned to chats');
    }

    try {
      setLoading(true);
      setError(null);

      await assignAdminToChat(chatId, currentUser.uid);
      
      // Update pending chats list
      setPendingChats(prevPendingChats => 
        prevPendingChats.filter(chat => chat.id !== chatId)
      );

      // Refresh chat data
      const chatData = await getChatById(chatId);
      
      // Add to admin's chats list
      setChats(prevChats => [chatData, ...prevChats]);
      
      // Set as current chat
      setCurrentChat(chatData);
      
      return chatData;
    } catch (err) {
      console.error('Error assigning admin to chat:', err);
      setError('Failed to assign admin to chat. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send a text message
  const sendMessage = async (text) => {
    if (!currentUser || !currentChat) {
      throw new Error('User must be logged in and a chat must be selected');
    }

    try {
      setError(null);
      await sendTextMessage(currentChat.id, currentUser.uid, text);
      
      // No need to update messages state as the subscription will handle it
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      throw err;
    }
  };

  // Send an image message
  const sendImage = async (imageFile, text = '') => {
    if (!currentUser || !currentChat) {
      throw new Error('User must be logged in and a chat must be selected');
    }

    try {
      setError(null);
      await sendImageMessage(currentChat.id, currentUser.uid, imageFile, text);
      
      // No need to update messages state as the subscription will handle it
      return true;
    } catch (err) {
      console.error('Error sending image:', err);
      setError('Failed to send image. Please try again.');
      throw err;
    }
  };

  // Refresh chats list
  const refreshChats = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's chats
      const userChats = await getUserChats(currentUser.uid, userRole);
      setChats(userChats);

      // If user is admin, also get pending chats
      if (userRole === 'admin') {
        const adminPendingChats = await getPendingChats();
        setPendingChats(adminPendingChats);
      }
    } catch (err) {
      console.error('Error refreshing chats:', err);
      setError('Failed to refresh chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    chats,
    pendingChats,
    currentChat,
    messages,
    loading,
    error,
    startNewChat,
    selectChat,
    assignAdmin,
    sendMessage,
    sendImage,
    refreshChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}