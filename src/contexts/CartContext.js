import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create context
const CartContext = createContext();

// Initial state
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null
};

// Action types
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const LOAD_CART = 'LOAD_CART';

// Reducer function
const cartReducer = (state, action) => {
  switch (action.type) {
    case LOAD_CART:
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        itemCount: action.payload.itemCount || 0,
        loading: false,
        error: null
      };
    case ADD_TO_CART: {
      const { product, quantity = 1 } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);
      
      let newItems;
      if (existingItemIndex >= 0) {
        // Product already in cart, update quantity
        newItems = state.items.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        // Add new product to cart
        newItems = [...state.items, { ...product, quantity }];
      }
      
      // Calculate new total and item count
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
        loading: false,
        error: null
      };
    }
    case REMOVE_FROM_CART: {
      const productId = action.payload;
      const newItems = state.items.filter(item => item.id !== productId);
      
      // Calculate new total and item count
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
        loading: false,
        error: null
      };
    }
    case UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      // If quantity is 0 or less, remove item from cart
      if (quantity <= 0) {
        return cartReducer(state, { type: REMOVE_FROM_CART, payload: productId });
      }
      
      const newItems = state.items.map(item => 
        item.id === productId ? { ...item, quantity } : item
      );
      
      // Calculate new total and item count
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
        loading: false,
        error: null
      };
    }
    case CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        loading: false,
        error: null
      };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { currentUser } = useAuth();
  
  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    const loadCart = () => {
      try {
        dispatch({ type: SET_LOADING, payload: true });
        
        // Get cart from localStorage
        const userId = currentUser?.uid || 'guest';
        const savedCart = localStorage.getItem(`cart_${userId}`);
        
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: LOAD_CART, payload: parsedCart });
        } else {
          // No saved cart, initialize empty cart
          dispatch({ type: CLEAR_CART });
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        dispatch({ type: SET_ERROR, payload: 'Failed to load cart' });
      }
    };
    
    loadCart();
  }, [currentUser]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!state.loading) {
      try {
        const userId = currentUser?.uid || 'guest';
        localStorage.setItem(`cart_${userId}`, JSON.stringify({
          items: state.items,
          total: state.total,
          itemCount: state.itemCount
        }));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [state.items, state.total, state.itemCount, state.loading, currentUser]);
  
  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    dispatch({ 
      type: ADD_TO_CART, 
      payload: { product, quantity }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId) => {
    dispatch({ 
      type: REMOVE_FROM_CART, 
      payload: productId 
    });
  };
  
  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    dispatch({ 
      type: UPDATE_QUANTITY, 
      payload: { productId, quantity }
    });
  };
  
  // Clear cart
  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };
  
  // Context value
  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};