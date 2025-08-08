import cld from './cloudinary';
import { AdvancedImage, responsive, placeholder } from '@cloudinary/react';
import { Resize } from '@cloudinary/url-gen/actions';
import { quality } from '@cloudinary/url-gen/actions/delivery';
import secureHttp from './secureHttpClient';
import { sanitizeInput } from '../utils/security';

// Maximum number of images allowed per product
export const MAX_IMAGES_PER_PRODUCT = 5;

// Function to prepare image for upload (admin only) with optional compression
export const prepareUpload = (file) => {
  // For smaller images, just convert to base64
  if (file.size <= 1024 * 1024) { // 1MB
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
  
  // For larger images, compress before upload
  return compressImage(file);
};

// Compress image to reduce file size
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxDimension = 1200; // Max width/height
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Set canvas dimensions and draw image
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get data URL with reduced quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Error loading image'));
    };
    reader.onerror = () => reject(new Error('Error reading file'));
  });
};

// Function to upload image to Cloudinary (admin only) with enhanced security
export const uploadImage = async (file, progressCallback = () => {}) => {
  // Maximum number of retry attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;
  
  // Validate Cloudinary configuration
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  
  if (!cloudName) {
    throw new Error('Cloudinary configuration missing: REACT_APP_CLOUDINARY_CLOUD_NAME is not defined');
  }
  
  // Validate file type and size before upload
  validateImageFile(file);
  
  // First prepare the file
  const base64Data = await prepareUpload(file);
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Create form data for upload - using unsigned upload with upload preset
      const formData = new FormData();
      formData.append('file', base64Data);
      formData.append('upload_preset', uploadPreset);
      
      // For unsigned uploads, we don't need timestamp and signature
      // This simplifies the CORS requirements
      
      let result;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      try {
        // Log upload attempt for debugging
        console.log(`Attempting Cloudinary upload to ${uploadUrl} with preset ${uploadPreset}`);
        
        // First try with secure HTTP client for upload with progress tracking
        result = await secureHttp.upload(
          uploadUrl,
          formData,
          {
            // Set appropriate headers for Cloudinary API
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            },
            // Increase timeout for large uploads
            timeout: 90000 // 90 seconds
          },
          progressCallback
        );
      } catch (secureUploadError) {
        console.warn('Secure upload failed, trying direct fetch upload:', secureUploadError);
        
        // If secure upload fails, try direct fetch as fallback
        // Create a new FormData for the direct upload - using unsigned upload
        const directFormData = new FormData();
        directFormData.append('file', base64Data);
        directFormData.append('upload_preset', uploadPreset);
        
        // No need for timestamp and API key with unsigned uploads
        
        // Use direct fetch for upload
        const response = await fetch(
          uploadUrl,
          {
            method: 'POST',
            body: directFormData,
            mode: 'cors' // Explicitly set CORS mode
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Could not read error response');
          throw new Error(`Direct upload failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
        }
        
        result = await response.json();
        
        // Simulate progress completion since we can't track progress with direct fetch
        progressCallback(100);
      }
      
      // Validate the response
      if (!result || !result.secure_url) {
        console.error('Invalid Cloudinary response:', result);
        throw new Error('Invalid response from Cloudinary: Missing secure_url');
      }
      
      console.log('Cloudinary upload successful');
      return result.secure_url;
    } catch (error) {
      lastError = error;
      console.error(`Error uploading image (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
      
      // Only retry on network errors, not on validation or other errors
      if ((error.message.includes('Network error') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('CORS')) && 
          retryCount < MAX_RETRIES - 1) {
        retryCount++;
        // Wait before retrying (exponential backoff)
        const waitTime = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For other errors or if we've exhausted retries, throw the error
      throw error;
    }
  }
  
  // This should never be reached due to the throw in the catch block,
  // but just in case
  throw lastError || new Error('Failed to upload image after multiple attempts')
};

// Function to upload multiple images to Cloudinary (admin only)
export const uploadMultipleImages = async (files, progressCallback = () => {}) => {
  try {
    // Validate number of files
    if (!files || !files.length) {
      throw new Error('No files provided for upload');
    }
    
    if (files.length > MAX_IMAGES_PER_PRODUCT) {
      throw new Error(`Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product`);
    }
    
    // Track overall progress
    let totalProgress = 0;
    const progressStep = 100 / files.length;
    
    // Upload each file
    const uploadPromises = files.map((file, index) => {
      return uploadImage(file, (progress) => {
        // Calculate individual file progress contribution to overall progress
        const fileContribution = progress * progressStep / 100;
        const previousFilesContribution = index * progressStep;
        totalProgress = previousFilesContribution + fileContribution;
        
        // Report overall progress
        if (progressCallback) {
          progressCallback(Math.min(Math.round(totalProgress), 99)); // Cap at 99% until all complete
        }
      });
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Report 100% when all uploads are complete
    if (progressCallback) {
      progressCallback(100);
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

// Validate image file before upload
const validateImageFile = (file) => {
  // Check if file exists
  if (!file) {
    throw new Error('No file selected');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }
};

// Function to optimize image URL with Cloudinary transformations and enhanced security
export const optimizeImage = (imageUrl, width = 600) => {
  if (!imageUrl) return '';
  
  // Basic validation to prevent processing invalid URLs
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    console.warn('Invalid image URL detected:', imageUrl);
    return ''; // Return empty string for invalid URLs
  }
  
  // Skip sanitization for Cloudinary URLs to preserve URL structure
  // Only process URLs from Cloudinary
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl; // Return original URL if not a Cloudinary image
  }
  
  try {
    // Add Cloudinary transformations for optimization
    // Format: q_auto (automatic quality), w_600 (width 600px), f_auto (automatic format)
    const parts = imageUrl.split('/upload/');
    
    if (parts.length !== 2) {
      console.warn('Invalid Cloudinary URL format:', imageUrl);
      return imageUrl; // Return original URL if format is unexpected
    }
    
    // Add security measures
    // Prevent hotlinking by adding a watermark or restricting domains
    // This would typically be configured in your Cloudinary account
    
    return `${parts[0]}/upload/q_auto,w_${width},f_auto/${parts[1]}`;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return imageUrl; // Return original URL in case of error
  }
};

// Function to create a responsive image component with Cloudinary
export const createResponsiveImage = (publicId, alt = '') => {
  const image = cld.image(publicId);
  
  // Apply transformations
  image
    .quality('auto') // Automatic quality
    .format('auto'); // Automatic format selection
  
  return (
    <AdvancedImage
      cldImg={image}
      plugins={[responsive(), placeholder()]}
      alt={alt}
    />
  );
};

// Function to create a thumbnail image with Cloudinary
export const createThumbnail = (publicId, width = 200, height = 200, alt = '') => {
  const image = cld.image(publicId);
  
  // Apply transformations
  image
    .resize(Resize.fill().width(width).height(height))
    .delivery(quality().auto());
  
  return (
    <AdvancedImage
      cldImg={image}
      plugins={[placeholder()]}
      alt={alt}
    />
  );
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) {
    return null;
  }
  
  // Extract the public ID from the URL
  const regex = /\/upload\/(?:v\d+\/)?([^\/]+)(?:\.[a-zA-Z]+)?$/;
  const match = url.match(regex);
  
  return match ? match[1] : null;
};