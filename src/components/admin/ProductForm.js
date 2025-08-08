import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductById, addProduct, updateProduct, getAllCategories } from '../../services/firestore';
import { uploadImage, optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const ProductForm = ({ productId, onBack }) => {
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrls: [],
    stockQuantity: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Import MAX_IMAGES_PER_PRODUCT from cloudinaryService
  const { MAX_IMAGES_PER_PRODUCT } = require('../../services/cloudinaryService');
  
  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
        
        // If in edit mode, fetch product data
        if (isEditMode) {
          const productData = await getProductById(productId);
          if (!productData) {
            throw new Error('Product not found');
          }
          
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            price: productData.price ? productData.price.toString() : '',
            category: productData.category || '',
            imageUrls: productData.imageUrls || (productData.imageUrl ? [productData.imageUrl] : []),
            stockQuantity: productData.stockQuantity ? productData.stockQuantity.toString() : ''
          });
          
          // Handle image previews for multiple images
          if (productData.imageUrls && productData.imageUrls.length > 0) {
            setImagePreviews(productData.imageUrls);
          } else if (productData.imageUrl) {
            // Backward compatibility for products with single imageUrl
            setImagePreviews([productData.imageUrl]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productId, isEditMode]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle image file selection
  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    
    try {
      // Check if adding these files would exceed the maximum
      if (imageFiles.length + selectedFiles.length > MAX_IMAGES_PER_PRODUCT) {
        setError(`You can only upload a maximum of ${MAX_IMAGES_PER_PRODUCT} images per product`);
        return;
      }
      
      // Validate each file
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      // Check for invalid files
      const invalidTypeFile = selectedFiles.find(file => !validTypes.includes(file.type));
      if (invalidTypeFile) {
        setError(`File "${invalidTypeFile.name}" is not a valid image type. Please select only JPEG, PNG, WebP, or GIF files.`);
        return;
      }
      
      const oversizedFile = selectedFiles.find(file => file.size > maxSize);
      if (oversizedFile) {
        setError(`File "${oversizedFile.name}" exceeds the 5MB size limit.`);
        return;
      }
      
      // Clear any previous errors
      setError(null);
      
      // Process each valid file
      const newFiles = [...imageFiles, ...selectedFiles];
      setImageFiles(newFiles);
      
      // Create previews for each file
      const newPreviewPromises = selectedFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      // Update previews when all files are processed
      Promise.all(newPreviewPromises).then(newPreviews => {
        setImagePreviews([...imagePreviews, ...newPreviews]);
      });
    } catch (error) {
      console.error('Error handling image selection:', error);
      setError('Failed to process the selected images');
    }
  };
  
  // Remove an image from the selection
  const handleRemoveImage = (index) => {
    // Create new arrays without the removed image
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Also update the imageUrls in formData to ensure removed images are not included in updates
    const newImageUrls = [...formData.imageUrls];
    if (index < newImageUrls.length) {
      newImageUrls.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        imageUrls: newImageUrls
      }));
    }
    
    // Update state
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Product description is required');
      return;
    }
    
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    
    if (formData.stockQuantity === '' || isNaN(parseInt(formData.stockQuantity)) || parseInt(formData.stockQuantity) < 0) {
      setError('Please enter a valid stock quantity');
      return;
    }
    
    if (!isEditMode && imageFiles.length === 0 && formData.imageUrls.length === 0) {
      setError('Please upload at least one product image');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Upload images if new ones are selected
      let imageUrls = [...formData.imageUrls];
      
      if (imageFiles.length > 0) {
        setIsUploading(true);
        try {
          // Show a more detailed message to the user during upload
          setError('Uploading images to Cloudinary... This may take a moment.');
          
          // Log the upload attempt for debugging
          console.log('Starting image uploads to Cloudinary', {
            fileCount: imageFiles.length,
            totalSize: `${imageFiles.reduce((total, file) => total + file.size, 0) / 1024 / 1024}MB`
          });
          
          // Upload multiple images and get array of URLs
          const uploadedUrls = await Promise.all(
            imageFiles.map(file => 
              uploadImage(file, (progress) => {
                setUploadProgress(progress);
                // Clear the informational message when progress starts
                if (progress > 0) setError('');
                // Update the message for high progress values
                if (progress > 80) {
                  setError('Almost done! Processing images...');
                }
              })
            )
          );
          
          // Verify the returned URLs are valid
          const invalidUrls = uploadedUrls.filter(url => !url || !url.startsWith('http'));
          if (invalidUrls.length > 0) {
            console.error('Invalid image URLs returned:', invalidUrls);
            throw new Error('Invalid image URLs returned from server');
          }
          
          // Add new URLs to existing ones
          imageUrls = [...imageUrls, ...uploadedUrls];
          console.log('Image uploads successful:', imageUrls);
        } catch (uploadError) {
          setIsUploading(false);
          setSubmitting(false);
          
          // Enhanced error handling with more specific messages
          if (uploadError.message.includes('configuration missing')) {
            setError('Server configuration error. Please contact support.');
            console.error('Cloudinary configuration error:', uploadError);
          } else if (uploadError.message.includes('CORS') || uploadError.message.includes('Network error')) {
            setError('Network error: Unable to connect to image server. Please check your internet connection and try again later.');
            console.error('CORS or Network Error:', uploadError);
          } else if (uploadError.message.includes('timeout')) {
            setError('Upload timed out. Please try with smaller images or check your internet connection.');
          } else if (uploadError.message.includes('Invalid file type')) {
            setError('Invalid image format. Please use JPEG, PNG, GIF, or WebP images only.');
          } else if (uploadError.message.includes('file size')) {
            setError('One or more image files are too large. Please use images smaller than 5MB.');
          } else if (uploadError.message.includes('Invalid response from Cloudinary')) {
            setError('Error processing images. Please try different images or try again later.');
            console.error('Cloudinary response error:', uploadError);
          } else if (uploadError.message.includes('maximum')) {
            setError(`Maximum of ${MAX_IMAGES_PER_PRODUCT} images allowed per product.`);
          } else {
            setError(`Error uploading images: ${uploadError.message}. Please try again.`);
          }
          
          console.error('Detailed upload error:', uploadError);
          return; // Exit the function early
        }
        setIsUploading(false);
      }
      
      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrls: imageUrls,
        // For backward compatibility, also set the first image as imageUrl
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        inStock: parseInt(formData.stockQuantity) > 0,
        updatedAt: new Date()
      };
      
      // Add or update product
      if (isEditMode) {
        await updateProduct(productId, productData);
        setSuccess('Product updated successfully!');
      } else {
        productData.createdAt = new Date();
        await addProduct(productData);
        setSuccess('Product added successfully!');
        
        // Reset form in add mode
        setFormData({
          name: '',
          description: '',
          price: '',
          category: '',
          imageUrls: [],
          stockQuantity: ''
        });
        setImageFiles([]);
        setImagePreviews([]);
      }
      
      // Navigate back to product list after a short delay
      setTimeout(() => {
        onBack();
      }, 1500);
      
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  if (loading) {
    return <LoadingSpinner fullPage text={`Loading ${isEditMode ? 'product' : 'form'}...`} />;
  }
  
  return (
    <Container className="py-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
          <Button 
            variant="outline-secondary" 
            onClick={onBack}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Products
          </Button>
        </div>
        
        {error && (
          <ErrorAlert 
            error={error} 
            onClose={() => setError(null)} 
            className="mb-4" 
          />
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            <Alert.Heading>Success!</Alert.Heading>
            <p>{success}</p>
          </Alert>
        )}
        
        <Card className="shadow-sm">
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      disabled={submitting}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter product description"
                      disabled={submitting}
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price</Form.Label>
                        <Form.Control
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          disabled={submitting}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stock Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          name="stockQuantity"
                          value={formData.stockQuantity}
                          onChange={handleChange}
                          placeholder="Enter quantity"
                          min="0"
                          step="1"
                          disabled={submitting}
                        />
                        <Form.Text className="text-muted">
                          Number of items in stock
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category</Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          disabled={submitting}
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Images (Up to {MAX_IMAGES_PER_PRODUCT})</Form.Label>
                    <div className="p-3 border rounded mb-3">
                      {/* Display image previews */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {imagePreviews.length > 0 ? (
                          imagePreviews.map((preview, index) => (
                            <div key={index} className="position-relative" style={{ width: '120px' }}>
                              <Image 
                                src={preview} 
                                alt={`Product preview ${index + 1}`} 
                                fluid 
                                rounded 
                                className="product-image-preview" 
                                style={{ height: '120px', objectFit: 'cover', width: '100%' }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                onClick={() => handleRemoveImage(index)}
                              >
                                ×
                              </Button>
                              {index === 0 && (
                                <span className="position-absolute bottom-0 start-0 bg-primary text-white px-1 py-0 small">
                                  Main
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center p-4 bg-light rounded w-100">
                            <i className="bi bi-images text-muted display-4"></i>
                            <p className="text-muted mb-0">No images selected</p>
                          </div>
                        )}
                      </div>
                      
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={submitting || imagePreviews.length >= MAX_IMAGES_PER_PRODUCT}
                        className="mb-2"
                        multiple
                      />
                      <small className="text-muted d-block text-center">
                        Recommended size: 800x800px. Max size: 5MB per image. Up to {MAX_IMAGES_PER_PRODUCT} images.
                      </small>
                      
                      {isUploading && (
                        <div className="w-100 mt-2">
                          <div className="progress">
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              role="progressbar" 
                              style={{ width: `${uploadProgress}%` }}
                              aria-valuenow={uploadProgress} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            >
                              {uploadProgress}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-3">
                <Button 
                  variant="secondary" 
                  className="me-2" 
                  onClick={() => navigate('/admin/products')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" text="" />
                      <span className="ms-2">
                        {isEditMode ? 'Updating...' : 'Saving...'}
                      </span>
                    </>
                  ) : (
                    isEditMode ? 'Update Product' : 'Add Product'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default ProductForm;