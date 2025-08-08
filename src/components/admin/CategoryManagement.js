import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Image, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../../services/firestore';
import { uploadImage, optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '', imageUrl: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => 
    category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal for adding a new category
  const handleAddClick = () => {
    setCurrentCategory({ id: '', name: '', imageUrl: '' });
    setModalMode('add');
    setFormError(null);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Open modal for editing a category
  const handleEditClick = (category) => {
    setCurrentCategory({ ...category });
    setModalMode('edit');
    setFormError(null);
    setImageFile(null);
    setImagePreview(category.imageUrl || null);
    setShowModal(true);
  };

  // Handle category name change
  const handleCategoryChange = (e) => {
    setCurrentCategory({
      ...currentCategory,
      name: e.target.value
    });
  };
  
  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setFormError('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError(null);
  };

  // Handle category form submission
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    // Validate form
    if (!currentCategory.name.trim()) {
      setFormError('Category name is required');
      return;
    }
    
    // Check for duplicate category name
    const isDuplicate = categories.some(
      cat => cat.name.toLowerCase() === currentCategory.name.toLowerCase() && 
             cat.id !== currentCategory.id
    );
    
    if (isDuplicate) {
      setFormError('A category with this name already exists');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Upload image if a new one is selected
      let imageUrl = currentCategory.imageUrl;
      if (imageFile) {
        setIsUploading(true);
        try {
          // Show a more detailed message to the user during upload
          setFormError('Uploading image... This may take a moment.');
          
          // Log the upload attempt for debugging
          console.log('Starting image upload to Cloudinary', {
            fileName: imageFile.name,
            fileSize: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
            fileType: imageFile.type
          });
          
          imageUrl = await uploadImage(imageFile, (progress) => {
            setUploadProgress(progress);
            // Clear the informational message when progress starts
            if (progress > 0) setFormError('');
            // Update the message for high progress values
            if (progress > 80) {
              setFormError('Almost done! Processing image...');
            }
          });
          
          // Verify the returned URL is valid
          if (!imageUrl || !imageUrl.startsWith('http')) {
            console.error('Invalid image URL returned:', imageUrl);
            throw new Error('Invalid image URL returned from server');
          }
          
          console.log('Image upload successful:', imageUrl);
        } catch (uploadError) {
          setIsUploading(false);
          setSubmitting(false);
          
          // Enhanced error handling with more specific messages
          if (uploadError.message.includes('configuration missing')) {
            setFormError('Server configuration error. Please contact support.');
          } else if (uploadError.message.includes('CORS') || uploadError.message.includes('Network error')) {
            setFormError('Network error: Unable to connect to image server. Please check your internet connection.');
          } else if (uploadError.message.includes('timeout')) {
            setFormError('Upload timed out. Please try with a smaller image or check your internet connection.');
          } else if (uploadError.message.includes('Invalid file type')) {
            setFormError('Invalid image format. Please use JPEG, PNG, GIF, or WebP images only.');
          } else if (uploadError.message.includes('file size')) {
            setFormError('Image file is too large. Please use an image smaller than 5MB.');
          } else {
            setFormError(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
          }
          return;
        } finally {
          setIsUploading(false);
        }
      }
      
      if (modalMode === 'add') {
        // Add new category
        const newCategory = {
          name: currentCategory.name.trim(),
          imageUrl: imageUrl || '',
          createdAt: new Date()
        };
        
        const addedCategory = await addCategory(newCategory);
        setCategories([...categories, addedCategory]);
      } else {
        // Update existing category
        const updatedCategory = {
          ...currentCategory,
          name: currentCategory.name.trim(),
          imageUrl: imageUrl || '',
          updatedAt: new Date()
        };
        
        await updateCategory(currentCategory.id, updatedCategory);
        setCategories(categories.map(cat => 
          cat.id === currentCategory.id ? updatedCategory : cat
        ));
      }
      
      // Close modal and reset form
      setShowModal(false);
      setCurrentCategory({ id: '', name: '', imageUrl: '' });
      
    } catch (err) {
      console.error('Error saving category:', err);
      setFormError(err.message || 'Failed to save category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  // Handle category deletion
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteCategory(categoryToDelete.id);
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting category:', err);
      setDeleteError('Failed to delete category. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading categories..." />;
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="primary" onClick={handleAddClick}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Category
        </Button>
      </div>

      {error && (
        <ErrorAlert 
          error={error} 
          onClose={() => setError(null)} 
          className="mb-4" 
        />
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex align-items-center mt-3 mt-md-0">
              <span className="ms-auto">
                {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} found
              </span>
            </Col>
          </Row>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tag display-1 text-muted mb-3"></i>
              <h5>No categories found</h5>
              <p className="text-muted">
                {searchTerm ? 'Try adjusting your search to find what you\'re looking for.' : 'Click the "Add New Category" button to create your first category.'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category Name</th>
                    <th>Products</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(category => (
                    <tr key={category.id}>
                      <td className="text-center" style={{ width: '100px' }}>
                        {category.imageUrl ? (
                          <Image 
                            src={category.imageUrl} 
                            alt={category.name} 
                            thumbnail 
                            style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain', backgroundColor: '#f8f9fa' }} 
                          />
                        ) : (
                          <div className="text-muted small">No image</div>
                        )}
                      </td>
                      <td className="fw-bold">{category.name}</td>
                      <td>
                        {/* This would ideally show the count of products in this category */}
                        <span className="badge bg-secondary rounded-pill">0</span>
                      </td>
                      <td>
                        {category.createdAt ? new Date(category.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditClick(category)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </motion.div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Add New Category' : 'Edit Category'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCategorySubmit}>
          <Modal.Body>
            {formError && (
              <ErrorAlert 
                error={formError} 
                onClose={() => setFormError(null)} 
                className="mb-3" 
              />
            )}
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                value={currentCategory.name}
                onChange={handleCategoryChange}
                disabled={submitting}
                autoFocus
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                disabled={submitting || isUploading}
              />
              <Form.Text className="text-muted">
                Upload an image for this category (max 5MB). Supported formats: JPEG, PNG, WebP, GIF.
              </Form.Text>
            </Form.Group>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 text-center">
                <p className="mb-2">Image Preview:</p>
                <div className="position-relative d-inline-block">
                  <Image 
                    src={imagePreview} 
                    alt="Category preview" 
                    thumbnail 
                    style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain', backgroundColor: '#f8f9fa' }} 
                  />
                </div>
              </div>
            )}
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-3">
                <Form.Label>Upload Progress: {uploadProgress}%</Form.Label>
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    role="progressbar" 
                    style={{ width: `${uploadProgress}%` }} 
                    aria-valuenow={uploadProgress} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting || isUploading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting || isUploading}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  <span className="ms-2">Saving...</span>
                </>
              ) : (
                modalMode === 'add' ? 'Add Category' : 'Update Category'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <ErrorAlert 
              error={deleteError} 
              onClose={() => setDeleteError(null)} 
              className="mb-3" 
            />
          )}
          <p>Are you sure you want to delete the category <strong>{categoryToDelete?.name}</strong>?</p>
          <p className="text-danger">This action cannot be undone and may affect products assigned to this category.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <LoadingSpinner size="sm" text="" /> : 'Delete Category'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryManagement;