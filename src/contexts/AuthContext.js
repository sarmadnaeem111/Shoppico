import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import { checkLoginRateLimit, resetLoginAttempts, generateCSRFToken, storeCSRFToken, secureStorage } from '../utils/security';
import { secureHttp } from '../services/secureHttpClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [tempUserCredential, setTempUserCredential] = useState(null);

  // Register a new user
  async function signup(email, password, name) {
    try {
      // Generate and store CSRF token for form submissions
      const csrfToken = generateCSRFToken();
      storeCSRFToken(csrfToken);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName: name });
      
      // Create user document in Firestore with additional security fields
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role: 'customer', // Default role is customer
        createdAt: serverTimestamp(),
        status: 'active',
        lastLogin: serverTimestamp(),
        failedLoginAttempts: 0,
        securityQuestions: [],
        twoFactorEnabled: false
      });
      
      // Store minimal user data in secure storage
      secureStorage.setItem('user_session', {
        uid: user.uid,
        lastActivity: Date.now()
      });
      
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Login existing user
  async function login(email, password) {
    try {
      // Check rate limiting for login attempts
      const rateLimit = checkLoginRateLimit(email);
      if (!rateLimit.allowed) {
        throw new Error(rateLimit.message);
      }
      
      // Generate and store CSRF token for form submissions
      const csrfToken = generateCSRFToken();
      storeCSRFToken(csrfToken);
      
      // Attempt login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Reset login attempts on successful login
      resetLoginAttempts(email);
      
      // Get user document to check for 2FA
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
        // Store temporary credential and set 2FA pending state
        setTempUserCredential(userCredential);
        setTwoFactorPending(true);
        
        // Generate and send 2FA code
        await sendTwoFactorCode(userCredential.user.email);
        
        // Return early - user will need to complete 2FA
        return { twoFactorRequired: true };
      }
      
      // Update last login timestamp in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: serverTimestamp(),
        failedLoginAttempts: 0
      }, { merge: true });
      
      // Store minimal user data in secure storage with session timeout
      secureStorage.setItem('user_session', {
        uid: userCredential.user.uid,
        lastActivity: Date.now()
      });
      
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      // Don't reset rate limiting on failed attempts
      throw error;
    }
  }

  // Logout current user
  async function logout() {
    try {
      // Clear secure storage
      secureStorage.removeItem('user_session');
      
      // Clear CSRF token
      storeCSRFToken('');
      
      // Sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get user role from Firestore
  async function getUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        return userData.role;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Update user profile
  async function updateUserProfile(uid, data) {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
      if (data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
    } catch (error) {
      throw error;
    }
  }

  // Session timeout check (30 minutes)
  const checkSessionTimeout = () => {
    const sessionData = secureStorage.getItem('user_session');
    if (sessionData && sessionData.lastActivity) {
      const now = Date.now();
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes
      
      if (now - sessionData.lastActivity > sessionTimeout) {
        // Session expired, log out
        console.log('Session expired due to inactivity');
        logout();
        return true;
      } else {
        // Update last activity
        secureStorage.setItem('user_session', {
          ...sessionData,
          lastActivity: now
        });
      }
    }
    return false;
  };
  
  // Activity tracker to update last activity time
  useEffect(() => {
    const activityHandler = () => {
      const sessionData = secureStorage.getItem('user_session');
      if (sessionData && sessionData.uid) {
        secureStorage.setItem('user_session', {
          ...sessionData,
          lastActivity: Date.now()
        });
      }
    };
    
    // Check for session timeout every minute
    const timeoutInterval = setInterval(() => {
      checkSessionTimeout();
    }, 60 * 1000);
    
    // Track user activity
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keypress', activityHandler);
    window.addEventListener('click', activityHandler);
    window.addEventListener('scroll', activityHandler);
    
    return () => {
      clearInterval(timeoutInterval);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keypress', activityHandler);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('scroll', activityHandler);
    };
  }, []);
  
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Check for session timeout
      if (user && checkSessionTimeout()) {
        // Session expired, don't set current user
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get user role and status from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            
            // Check if user is active
            if (userData.status !== 'active') {
              // User is disabled or suspended, log them out
              console.log(`User account is ${userData.status}. Logging out.`);
              await logout();
              setCurrentUser(null);
              setUserRole(null);
            }
          } else {
            await getUserRole(user.uid);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Check if user has required permissions for an action
  const hasPermission = (requiredPermission) => {
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // For customer-specific permissions
    if (userRole === 'customer' && requiredPermission === 'customer') return true;
    
    // Default deny
    return false;
  };
  
  // Send two-factor authentication code
  async function sendTwoFactorCode(email) {
    try {
      // In a real implementation, this would call your backend API
      // to generate and send a verification code via email or SMS
      const response = await secureHttp.post('/auth/send-2fa-code', { email });
      return response;
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      throw new Error('Failed to send verification code');
    }
  }
  
  // Verify two-factor authentication code
  async function verifyTwoFactorCode(code) {
    if (!twoFactorPending || !tempUserCredential) {
      throw new Error('No two-factor authentication in progress');
    }
    
    try {
      // Verify the code with backend
      const response = await secureHttp.post('/auth/verify-2fa-code', { 
        code,
        uid: tempUserCredential.user.uid 
      });
      
      if (response.verified) {
        // Update last login timestamp in Firestore
        await setDoc(doc(db, 'users', tempUserCredential.user.uid), {
          lastLogin: new Date().toISOString(),
          failedLoginAttempts: 0
        }, { merge: true });
        
        // Store minimal user data in secure storage
        secureStorage.setItem('user_session', {
          uid: tempUserCredential.user.uid,
          lastActivity: Date.now()
        });
        
        // Clear 2FA pending state
        const user = tempUserCredential.user;
        setTwoFactorPending(false);
        setTempUserCredential(null);
        
        return user;
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      throw error;
    }
  }
  
  // Enable two-factor authentication
  async function enableTwoFactorAuth() {
    if (!currentUser) {
      throw new Error('User must be logged in');
    }
    
    try {
      // Update user document to enable 2FA
      await setDoc(doc(db, 'users', currentUser.uid), {
        twoFactorEnabled: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }
  
  // Disable two-factor authentication
  async function disableTwoFactorAuth() {
    if (!currentUser) {
      throw new Error('User must be logged in');
    }
    
    try {
      // Update user document to disable 2FA
      await setDoc(doc(db, 'users', currentUser.uid), {
        twoFactorEnabled: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  // Sign in with Google
  async function signInWithGoogle() {
    try {
      // Generate CSRF token for additional security
      const csrfToken = generateCSRFToken();
      storeCSRFToken(csrfToken);
      
      // Sign in with Google popup
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document if first time login
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName,
          email: userCredential.user.email,
          role: 'customer',
          status: 'active',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          failedLoginAttempts: 0,
          twoFactorEnabled: false,
          securityScore: 70, // Default security score for Google accounts
          provider: 'google'
        });
      } else {
        // Update last login timestamp
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          lastLogin: serverTimestamp(),
          failedLoginAttempts: 0
        }, { merge: true });
      }
      
      // Store minimal user data in secure storage with session timeout
      secureStorage.setItem('user_session', {
        uid: userCredential.user.uid,
        lastActivity: Date.now()
      });
      
      return userCredential.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    signInWithGoogle,
    logout,
    updateUserProfile,
    isAdmin: userRole === 'admin',
    isCustomer: userRole === 'customer',
    hasPermission,
    checkSessionTimeout,
    twoFactorPending,
    sendTwoFactorCode,
    verifyTwoFactorCode,
    enableTwoFactorAuth,
    disableTwoFactorAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}