import { Cloudinary } from '@cloudinary/url-gen';

// Create a Cloudinary instance with enhanced configuration
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  },
  url: {
    secure: true // Force HTTPS
  }
});

// Configure Cloudinary global settings
if (typeof window !== 'undefined') {
  // Add CORS settings to help with cross-origin requests
  window.CLOUDINARY_CORS_CONFIGURATION = {
    max_age: 3600
  };
}

export default cld;