import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Users Collection
export const usersRef = collection(db, 'users');

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Update user status (active/inactive/suspended)
export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Products Collection
export const productsRef = collection(db, 'products');

// Get all products
export const getAllProducts = async () => {
  try {
    const querySnapshot = await getDocs(productsRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (categoryId) => {
  try {
    const q = query(productsRef, where('category', '==', categoryId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products by category:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, 'products', productId));
    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Add product (admin only)
export const addProduct = async (productData) => {
  try {
    // Ensure backward compatibility with imageUrl
    const processedData = { ...productData };
    
    // If we have imageUrls array but no imageUrl, set imageUrl to the first image
    if (processedData.imageUrls && processedData.imageUrls.length > 0 && !processedData.imageUrl) {
      processedData.imageUrl = processedData.imageUrls[0];
    }
    
    // If we have imageUrl but no imageUrls, create imageUrls array with the single image
    if (processedData.imageUrl && (!processedData.imageUrls || processedData.imageUrls.length === 0)) {
      processedData.imageUrls = [processedData.imageUrl];
    }
    
    const docRef = await addDoc(productsRef, {
      ...processedData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product (admin only)
export const updateProduct = async (productId, productData) => {
  try {
    // Ensure backward compatibility with imageUrl
    const processedData = { ...productData };
    
    // If we have imageUrls array but no imageUrl, set imageUrl to the first image
    if (processedData.imageUrls && processedData.imageUrls.length > 0 && !processedData.imageUrl) {
      processedData.imageUrl = processedData.imageUrls[0];
    }
    
    // If we have imageUrl but no imageUrls, create imageUrls array with the single image
    if (processedData.imageUrl && (!processedData.imageUrls || processedData.imageUrls.length === 0)) {
      processedData.imageUrls = [processedData.imageUrl];
    }
    
    await updateDoc(doc(db, 'products', productId), {
      ...processedData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product (admin only)
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Categories Collection
export const categoriesRef = collection(db, 'categories');

// Get all categories
export const getAllCategories = async () => {
  try {
    const querySnapshot = await getDocs(categoriesRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Get category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
    if (categoryDoc.exists()) {
      return { id: categoryDoc.id, ...categoryDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting category:', error);
    throw error;
  }
};

// Add category (admin only)
export const addCategory = async (categoryData) => {
  try {
    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update category (admin only)
export const updateCategory = async (categoryId, categoryData) => {
  try {
    await updateDoc(doc(db, 'categories', categoryId), {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete category (admin only)
export const deleteCategory = async (categoryId) => {
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Get related products
export const getRelatedProducts = async (categoryId, currentProductId, limitCount = 4) => {
  try {
    const q = query(
      productsRef, 
      where('category', '==', categoryId),
      where('id', '!=', currentProductId),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting related products:', error);
    return [];
  }
};

// Home Content Collection - using the correct collection reference
export const homeContentRef = collection(db, 'homeContent');

// Get all home content sections
export const getAllHomeContent = async () => {
  try {
    const querySnapshot = await getDocs(query(homeContentRef, orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting home content:', error);
    throw error;
  }
};

// Get home content by ID
export const getHomeContentById = async (contentId) => {
  try {
    const contentDoc = await getDoc(doc(db, 'homeContent', contentId));
    if (contentDoc.exists()) {
      return { id: contentDoc.id, ...contentDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting home content:', error);
    throw error;
  }
};

// Add home content (admin only)
export const addHomeContent = async (contentData) => {
  try {
    // Validate contentData
    if (!contentData || typeof contentData !== 'object') {
      throw new Error('Invalid content data');
    }
    
    // Remove any id field to prevent manual ID setting
    const { id, ...dataToAdd } = contentData;
    
    // Create a new document with auto-generated ID in the homeContent collection
    const docRef = await addDoc(collection(db, 'homeContent'), {
      ...dataToAdd,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding home content:', error);
    throw error;
  }
};

// Update home content (admin only)
export const updateHomeContent = async (contentId, contentData) => {
  try {
    await updateDoc(doc(db, 'homeContent', contentId), {
      ...contentData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating home content:', error);
    throw error;
  }
};

// Delete home content (admin only)
export const deleteHomeContent = async (contentId) => {
  try {
    // Use the correct document reference with contentId
    await deleteDoc(doc(db, 'homeContent', contentId));
    return true;
  } catch (error) {
    console.error('Error deleting home content:', error);
    throw error;
  }
};

// Orders Collection
export const ordersRef = collection(db, 'orders');

// Get all orders (admin only)
export const getAllOrders = async () => {
  try {
    const querySnapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

// Get orders by user ID (for customer)
export const getOrdersByUserId = async (userId) => {
  try {
    const q = query(
      ordersRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    // Suppress Firebase index error from console while maintaining functionality
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      // Try without ordering if index is missing
      try {
        const q = query(ordersRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        // Sort client-side as fallback
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (fallbackError) {
        console.error('Error getting user orders:', fallbackError);
        return []; // Return empty array instead of throwing
      }
    }
    console.error('Error getting user orders:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Add order (customer)
export const addOrder = async (orderData) => {
  try {
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      status: 'pending', // Initial status is always 'pending'
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId, status) => {
  try {
    const validStatuses = ['pending', 'on the way', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
