/**
 * Security utilities for protecting the application against common web vulnerabilities
 */

// Sanitize user input to prevent XSS attacks
export const sanitizeInput = (input) => {
  if (!input) return input;
  
  // Convert to string if not already
  const str = typeof input === 'string' ? input : String(input);
  
  // Check if input is a URL
  const isUrl = str.match(/^https?:\/\//i);
  
  // If it's a URL, only sanitize parts that don't break URL functionality
  if (isUrl) {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  // For non-URL strings, replace all potentially dangerous characters
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Generate a CSRF token
export const generateCSRFToken = () => {
  // Create a random string for CSRF protection
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Store CSRF token in session storage
export const storeCSRFToken = (token) => {
  sessionStorage.setItem('csrfToken', token);
};

// Get stored CSRF token
export const getCSRFToken = () => {
  return sessionStorage.getItem('csrfToken');
};

// Validate CSRF token
export const validateCSRFToken = (token) => {
  return token === getCSRFToken();
};

// Content Security Policy (CSP) header generator
export const generateCSPHeader = () => {
  return {
    'Content-Security-Policy': 
      "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' https://cdn.jsdelivr.net; " +
      "img-src 'self' data: https://res.cloudinary.com; " +
      "font-src 'self' https://cdn.jsdelivr.net; " +
      "connect-src 'self' https://firestore.googleapis.com https://api.cloudinary.com; " +
      "frame-src 'none'; " +
      "object-src 'none';"
  };
};

// Password strength checker with more robust criteria
export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: 'Password is required' };
  
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters long');
  } else {
    score += 1;
  }
  
  // Contains uppercase
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }
  
  // Contains lowercase
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 1;
  }
  
  // Contains numbers
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }
  
  // Contains special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Add special characters');
  } else {
    score += 1;
  }
  
  // Prevent common passwords
  const commonPasswords = ['password', 'admin', '123456', 'qwerty', 'welcome'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    feedback.push('This is a commonly used password');
  }
  
  // Calculate final score (0-5)
  return {
    score,
    feedback: feedback.join(', ') || 'Strong password'
  };
};

// Rate limiting for login attempts
const loginAttempts = {};

export const checkLoginRateLimit = (email) => {
  if (!email) return { allowed: true };
  
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  // Initialize if first attempt
  if (!loginAttempts[email]) {
    loginAttempts[email] = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now
    };
    return { allowed: true };
  }
  
  const userAttempts = loginAttempts[email];
  
  // Reset if outside window
  if (now - userAttempts.firstAttempt > windowMs) {
    loginAttempts[email] = {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now
    };
    return { allowed: true };
  }
  
  // Increment attempts
  userAttempts.attempts += 1;
  userAttempts.lastAttempt = now;
  
  // Check if too many attempts
  if (userAttempts.attempts > maxAttempts) {
    const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
    return {
      allowed: false,
      timeLeft,
      message: `Too many login attempts. Please try again in ${timeLeft} minutes.`
    };
  }
  
  return { allowed: true };
};

// Reset login attempts for a user
export const resetLoginAttempts = (email) => {
  if (email && loginAttempts[email]) {
    delete loginAttempts[email];
  }
};

// Secure localStorage wrapper with encryption
export const secureStorage = {
  // Simple encryption (for demonstration - in production use a proper encryption library)
  encrypt: (data, secret = 'default-secret-key') => {
    if (!data) return '';
    try {
      const jsonString = JSON.stringify(data);
      // This is a simple XOR encryption for demonstration
      // In production, use a proper encryption library
      return btoa(jsonString.split('').map((char, i) => {
        return String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length));
      }).join(''));
    } catch (e) {
      console.error('Encryption error:', e);
      return '';
    }
  },
  
  // Simple decryption
  decrypt: (encryptedData, secret = 'default-secret-key') => {
    if (!encryptedData) return null;
    try {
      const decrypted = atob(encryptedData).split('').map((char, i) => {
        return String.fromCharCode(char.charCodeAt(0) ^ secret.charCodeAt(i % secret.length));
      }).join('');
      return JSON.parse(decrypted);
    } catch (e) {
      console.error('Decryption error:', e);
      return null;
    }
  },
  
  // Store data securely
  setItem: (key, value, secret) => {
    const encrypted = secureStorage.encrypt(value, secret);
    localStorage.setItem(key, encrypted);
  },
  
  // Retrieve data securely
  getItem: (key, secret) => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return secureStorage.decrypt(encrypted, secret);
  },
  
  // Remove item
  removeItem: (key) => {
    localStorage.removeItem(key);
  }
};

// Detect suspicious behavior
export const detectSuspiciousBehavior = (event) => {
  // Check for rapid fire events
  if (event.type === 'click' || event.type === 'submit') {
    const now = Date.now();
    const lastEvent = window._securityMonitor?.lastEventTime || 0;
    const timeDiff = now - lastEvent;
    
    // Initialize security monitor if not exists
    if (!window._securityMonitor) {
      window._securityMonitor = {
        lastEventTime: now,
        eventCount: 1,
        suspiciousCount: 0
      };
      return false;
    }
    
    // Update monitor
    window._securityMonitor.lastEventTime = now;
    window._securityMonitor.eventCount += 1;
    
    // Check for suspicious timing (events too close together)
    if (timeDiff < 100 && window._securityMonitor.eventCount > 5) { // 100ms between events
      window._securityMonitor.suspiciousCount += 1;
      if (window._securityMonitor.suspiciousCount > 3) {
        console.warn('Suspicious behavior detected: Rapid fire events');
        return true;
      }
    } else {
      // Reset suspicious count if normal behavior resumes
      window._securityMonitor.suspiciousCount = Math.max(0, window._securityMonitor.suspiciousCount - 1);
    }
  }
  
  return false;
};