/**
 * Secure HTTP client for making API requests with proper security headers
 * and standardized error handling
 */

import { getCSRFToken } from '../utils/security';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Base API URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Creates an AbortController with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} - AbortController and signal
 */
const createAbortController = (timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return {
    controller,
    signal: controller.signal,
    timeoutId
  };
};

/**
 * Adds security headers to fetch requests
 * @param {Object} headers - Existing headers
 * @returns {Object} - Headers with security additions
 */
const addSecurityHeaders = (headers = {}) => {
  // Get CSRF token from session storage
  const csrfToken = getCSRFToken();
  
  return {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken || '',
    'X-Requested-With': 'XMLHttpRequest', // Helps prevent CSRF
    'X-Content-Type-Options': 'nosniff', // Prevents MIME type sniffing
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // HSTS
    ...headers
  };
};

/**
 * Handles API response with error checking
 * @param {Response} response - Fetch Response object
 * @returns {Promise} - Resolved with response data or rejected with error
 */
const handleResponse = async (response) => {
  // Clear timeout to prevent memory leaks
  if (response.timeoutId) {
    clearTimeout(response.timeoutId);
  }
  
  // Check if response is OK (status 200-299)
  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error: ${response.status} ${response.statusText}`;
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    throw error;
  }
  
  // Check if response is empty
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

/**
 * Makes a secure HTTP request
 * @param {string} url - Request URL (will be prefixed with API_BASE_URL if relative)
 * @param {Object} options - Request options
 * @returns {Promise} - Resolved with response data
 */
const secureRequest = async (url, options = {}) => {
  try {
    // Set up abort controller with timeout
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const { signal, timeoutId } = createAbortController(timeout);
    
    // Prepare full URL (add base URL for relative paths)
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    
    // Add security headers
    const headers = addSecurityHeaders(options.headers);
    
    // Make request
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal,
      credentials: 'include', // Include cookies for session management
    });
    
    // Attach timeout ID to response for cleanup
    response.timeoutId = timeoutId;
    
    return handleResponse(response);
  } catch (error) {
    // Handle abort errors (timeout)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${options.timeout || DEFAULT_TIMEOUT}ms`);
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Export convenience methods for different HTTP methods
export const secureHttp = {
  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolved with response data
   */
  get: (url, options = {}) => secureRequest(url, { ...options, method: 'GET' }),
  
  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolved with response data
   */
  post: (url, data, options = {}) => secureRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  /**
   * Make a PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolved with response data
   */
  put: (url, data, options = {}) => secureRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  /**
   * Make a PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolved with response data
   */
  patch: (url, data, options = {}) => secureRequest(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  
  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Additional options
   * @returns {Promise} - Resolved with response data
   */
  delete: (url, options = {}) => secureRequest(url, { ...options, method: 'DELETE' }),
  
  /**
   * Upload a file securely
   * @param {string} url - Upload URL
   * @param {FormData} formData - Form data with file
   * @param {Object} options - Additional options
   * @param {Function} onProgress - Progress callback (if supported)
   * @returns {Promise} - Resolved with response data
   */
  upload: (url, formData, options = {}, onProgress) => {
    // Don't set Content-Type header for multipart/form-data
    // Browser will set it with boundary parameter
    const customHeaders = { ...options.headers };
    delete customHeaders['Content-Type'];
    
    // Check if this is a Cloudinary upload
    const isCloudinaryUpload = url.includes('cloudinary.com');
    
    // Add CSRF token to form data for non-Cloudinary uploads
    if (!isCloudinaryUpload) {
      formData.append('csrfToken', getCSRFToken() || '');
    }
    
    // Use XMLHttpRequest for upload progress support
    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete, event);
          }
        });
        
        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
              response = JSON.parse(xhr.responseText);
            } catch (e) {
              response = xhr.responseText;
            }
            resolve(response);
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };
        
        // Handle errors with more detailed information
        xhr.onerror = (event) => {
          console.error('XHR error details:', {
            readyState: xhr.readyState,
            status: xhr.status,
            statusText: xhr.statusText,
            responseURL: xhr.responseURL || fullUrl,
            corsHeaders: xhr.getAllResponseHeaders ? xhr.getAllResponseHeaders() : 'Not available'
          });
          
          // Check if it's a CORS issue
          if (xhr.status === 0) {
            // Log additional debugging information
            console.warn('CORS debugging info:', {
              url: fullUrl,
              origin: window.location.origin,
              hasCredentials: xhr.withCredentials,
              contentType: 'multipart/form-data' // Standard content type for form uploads
            });
            
            if (isCloudinaryUpload) {
              console.warn('Cloudinary upload failed. This may be due to CORS restrictions or network issues.');
              reject(new Error('Network error during Cloudinary upload. Please check your internet connection and try again.'));
            } else {
              reject(new Error('Network error during upload: Possible CORS issue or server unreachable'));
            }
          } else {
            reject(new Error(`Network error during upload: ${xhr.statusText || 'Unknown error'}`));
          }
        };
        
        xhr.ontimeout = () => reject(new Error(`Upload timeout after ${options.timeout || DEFAULT_TIMEOUT}ms`));
        
        // Open connection and set timeout
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
        xhr.open('POST', fullUrl, true);
        
        // Set longer timeout for Cloudinary uploads
        xhr.timeout = isCloudinaryUpload ? 90000 : (options.timeout || DEFAULT_TIMEOUT);
        
        // Set headers based on the request type
        let headers;
        
        if (isCloudinaryUpload) {
          // For Cloudinary, only use minimal headers
          headers = {
            'X-Requested-With': 'XMLHttpRequest'
          };
        } else {
          // For regular API requests, use security headers
          headers = addSecurityHeaders(customHeaders);
        }
        
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
        
        // Include credentials (cookies) - but not for Cloudinary
        xhr.withCredentials = !isCloudinaryUpload;
        
        // Send the form data
        xhr.send(formData);
      });
    }
    
    // Fall back to regular fetch for uploads without progress tracking
    return secureRequest(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: customHeaders
    });
  }
};

export default secureHttp;