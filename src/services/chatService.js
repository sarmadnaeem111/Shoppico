import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

// Chat Collections
const chatsRef = collection(db, 'chats');
const messagesRef = collection(db, 'messages');

/**
 * Create a new chat between customer and admin
 * @param {string} customerId - The customer's user ID
 * @param {string} adminId - The admin's user ID (optional, can be assigned later)
 * @returns {Promise<string>} - The chat ID
 */
export const createChat = async (customerId, adminId = null) => {
  try {
    const chatData = {
      customerId,
      adminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: adminId ? 'active' : 'pending', // If admin is assigned, chat is active
      lastMessage: null
    };

    const docRef = await addDoc(chatsRef, chatData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

/**
 * Get all chats for a user (customer or admin)
 * @param {string} userId - The user ID
 * @param {string} role - The user role ('customer' or 'admin')
 * @returns {Promise<Array>} - Array of chat objects
 */
export const getUserChats = async (userId, role) => {
  try {
    const fieldToQuery = role === 'admin' ? 'adminId' : 'customerId';
    
    // Use a simpler query without orderBy to avoid requiring a composite index
    // We'll sort the results in memory instead
    const q = query(
      chatsRef,
      where(fieldToQuery, '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory by updatedAt in descending order
    return chats.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt.seconds * 1000) : new Date(0);
      const timeB = b.updatedAt ? new Date(b.updatedAt.seconds * 1000) : new Date(0);
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

/**
 * Get all pending chats (for admins)
 * @returns {Promise<Array>} - Array of pending chat objects
 */
export const getPendingChats = async () => {
  try {
    // Use a simpler query without orderBy to avoid requiring a composite index
    const q = query(
      chatsRef,
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const pendingChats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory by createdAt in descending order
    return pendingChats.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const timeB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error getting pending chats:', error);
    throw error;
  }
};

/**
 * Assign an admin to a chat
 * @param {string} chatId - The chat ID
 * @param {string} adminId - The admin's user ID
 * @returns {Promise<void>}
 */
export const assignAdminToChat = async (chatId, adminId) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      adminId,
      status: 'active',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning admin to chat:', error);
    throw error;
  }
};

/**
 * Send a text message
 * @param {string} chatId - The chat ID
 * @param {string} senderId - The sender's user ID
 * @param {string} text - The message text
 * @returns {Promise<string>} - The message ID
 */
export const sendTextMessage = async (chatId, senderId, text) => {
  try {
    const messageData = {
      chatId,
      senderId,
      text,
      imageUrl: null,
      createdAt: serverTimestamp(),
      read: false
    };

    const docRef = await addDoc(messagesRef, messageData);
    
    // Update the last message in the chat
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Send an image message
 * @param {string} chatId - The chat ID
 * @param {string} senderId - The sender's user ID
 * @param {File} imageFile - The image file to upload
 * @param {string} text - Optional text to accompany the image
 * @returns {Promise<string>} - The message ID
 */
export const sendImageMessage = async (chatId, senderId, imageFile, text = '') => {
  try {
    if (!imageFile || !imageFile.type || !imageFile.type.startsWith('image/')) {
      throw new Error('Invalid image file');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    // Import the uploadImage function from cloudinaryService
    const { uploadImage } = await import('./cloudinaryService');
    
    // Upload image to Cloudinary
    console.log('Uploading chat image to Cloudinary...');
    const imageUrl = await uploadImage(imageFile, (progress) => {
      console.log(`Upload progress: ${progress}%`);
    });
    
    if (!imageUrl) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    // Create message with image URL
    const messageData = {
      chatId,
      senderId,
      text,
      imageUrl,
      createdAt: serverTimestamp(),
      read: false
    };

    const docRef = await addDoc(messagesRef, messageData);
    
    // Update the last message in the chat
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text || 'Image sent',
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
};

/**
 * Get messages for a chat
 * @param {string} chatId - The chat ID
 * @param {number} messageLimit - The maximum number of messages to retrieve
 * @returns {Promise<Array>} - Array of message objects
 */
export const getChatMessages = async (chatId, messageLimit = 50) => {
  try {
    // Use a simpler query without orderBy to avoid requiring a composite index
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory by createdAt in descending order
    const sortedMessages = messages.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
      const timeB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      return timeB - timeA;
    });
    
    // Apply limit in memory
    const limitedMessages = sortedMessages.slice(0, messageLimit);
    
    // Reverse to get oldest messages first (for chat display)
    return limitedMessages.reverse();
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

/**
 * Subscribe to messages for a chat (real-time updates)
 * @param {string} chatId - The chat ID
 * @param {Function} callback - Callback function to handle new messages
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToMessages = (chatId, callback) => {
  try {
    // Use a simpler query without orderBy to avoid requiring a composite index
    const q = query(
      messagesRef,
      where('chatId', '==', chatId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in memory by createdAt in ascending order
      const sortedMessages = messages.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const timeB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return timeA - timeB;
      });
      
      callback(sortedMessages);
    });
  } catch (error) {
    console.error('Error subscribing to messages:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {string} chatId - The chat ID
 * @param {string} userId - The user ID who is reading the messages
 * @returns {Promise<void>}
 */
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.docs.forEach(document => {
      const messageRef = doc(db, 'messages', document.id);
      batch.push(updateDoc(messageRef, { read: true }));
    });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get chat by ID
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object|null>} - Chat object or null if not found
 */
export const getChatById = async (chatId) => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      return { id: chatDoc.id, ...chatDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};