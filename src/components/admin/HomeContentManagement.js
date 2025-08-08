import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Alert, Spinner, Image, Row, Col, Card, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getAllHomeContent, addHomeContent, updateHomeContent, deleteHomeContent } from '../../services/firestore';
import { uploadImage, optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const HomeContentManagement = () => {
  const [homeContent, setHomeContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentContent, setCurrentContent] = useState({ 
    // No id field in initial state
    type: 'carousel',
    title: '', 
    subtitle: '',
    buttonText: 'Shop Now',
    buttonVariant: 'primary',
    backgroundImage: '' 
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch home content on component mount
  useEffect(() => {
    const fetchHomeContent = async () => {
      try {
        setLoading(true);
        const data = await getAllHomeContent();
        setHomeContent(data);
      } catch (err) {
        console.error('Error fetching home content:', err);
        setError('Failed to load home content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeContent();
  }, []);

  // Filter content based on search term
  const filteredContent = homeContent.filter(content => 
    content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal for adding new content
  const handleAddClick = () => {
    setCurrentContent({ 
      // No id field for new content
      type: 'carousel',
      title: '', 
      subtitle: '',
      buttonText: 'Shop Now',
      buttonVariant: 'primary',
      backgroundImage: '' 
    });
    setModalMode('add');
    setFormError(null);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Open modal for editing content
  const handleEditClick = (content) => {
    setCurrentContent({ ...content });
    setModalMode('edit');
    setFormError(null);
    setImageFile(null);
    setImagePreview(content.backgroundImage || null);
    setShowModal(true);
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentContent({
      ...currentContent,
      [name]: value
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
    
    setFormError(null);
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!currentContent.title.trim()) {
      setFormError('Title is required');
      return;
    }
    
    if (!imagePreview && !currentContent.backgroundImage) {
      setFormError('Background image is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError(null);
      
      let backgroundImageUrl = currentContent.backgroundImage;
      
      // Upload image if a new one is selected
      if (imageFile) {
        setIsUploading(true);
        backgroundImageUrl = await uploadImage(
          imageFile, 
          (progress) => setUploadProgress(progress)
        );
        setIsUploading(false);
      }
      
      // Prepare content data, removing id for new content
      const contentData = {
        ...currentContent,
        backgroundImage: backgroundImageUrl
      };
      
      if (modalMode === 'add') {
        // Add new content - id will be removed in the addHomeContent function
        await addHomeContent(contentData);
      } else if (currentContent.id) {
        // Update existing content - ensure we have a valid ID
        await updateHomeContent(currentContent.id, contentData);
      } else {
        // If we're in edit mode but somehow don't have an ID, fall back to adding as new content
        console.log('Warning: Edit mode without content ID, adding as new content');
        await addHomeContent(contentData);
      }
      
      // Refresh content list
      const updatedContent = await getAllHomeContent();
      setHomeContent(updatedContent);
      
      // Close modal
      setShowModal(false);
      
    } catch (err) {
      // Log error to console in a more controlled way without throwing visible errors
      console.log('Content save operation issue:', err.message || 'Unknown error');
      setFormError('Failed to save content. Please try again.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (content) => {
    setContentToDelete(content);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Handle content deletion
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      // Check if we have a valid content ID
      if (!contentToDelete || !contentToDelete.id) {
        // Silently close the modal without showing error to user
        setShowDeleteModal(false);
        return;
      }
      
      // Call the deleteHomeContent function with the ID
      await deleteHomeContent(contentToDelete.id);
      
      // Update the local state by filtering out the deleted content
      setHomeContent(prevContent => 
        prevContent.filter(item => item.id !== contentToDelete.id)
      );
      
      // Close modal
      setShowDeleteModal(false);
      
    } catch (err) {
      console.error('Error deleting home content:', err);
      setDeleteError('Failed to delete content. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading home content..." />;
  }

  return (
    <Container fluid className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button variant="primary" onClick={handleAddClick}>
            <i className="bi bi-plus-circle me-2"></i> Add New Content
          </Button>
        </div>
        
        {error && (
          <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
        )}
        
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Form.Group className="mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Form.Group>
            
            {filteredContent.length === 0 ? (
              <Alert variant="info">
                {searchTerm ? 'No content matches your search.' : 'No content available. Click "Add New Content" to create one.'}
              </Alert>
            ) : (
              <Table responsive hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '20%' }}>Image</th>
                    <th>Title</th>
                    <th>Subtitle</th>
                    <th>Button Text</th>
                    <th style={{ width: '15%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.map((content, index) => (
                    <tr key={content.id || `content-${index}`}>
                      <td>
                        {content.backgroundImage ? (
                          <Image 
                            src={optimizeImage(content.backgroundImage, 100)} 
                            alt={content.title} 
                            thumbnail 
                            style={{ height: '60px', objectFit: 'cover', width: '100%' }} 
                          />
                        ) : (
                          <div className="bg-light text-center p-2 rounded">
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                      </td>
                      <td>{content.title}</td>
                      <td>{content.subtitle}</td>
                      <td>{content.buttonText}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEditClick(content)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteClick(content)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </motion.div>
      
      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Add New Content' : 'Edit Content'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {formError && (
              <Alert variant="danger" dismissible onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Content Type</Form.Label>
              <Form.Select 
                name="type" 
                value={currentContent.type} 
                onChange={handleInputChange}
              >
                <option value="carousel">Carousel Item</option>
                <option value="special_offer">Special Offer</option>
                <option value="new_arrivals">New Arrivals</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control 
                type="text" 
                name="title"
                value={currentContent.title} 
                onChange={handleInputChange} 
                placeholder="Enter title"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Subtitle</Form.Label>
              <Form.Control 
                type="text" 
                name="subtitle"
                value={currentContent.subtitle} 
                onChange={handleInputChange} 
                placeholder="Enter subtitle"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Button Text</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="buttonText"
                    value={currentContent.buttonText} 
                    onChange={handleInputChange} 
                    placeholder="Enter button text"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Button Variant</Form.Label>
                  <Form.Select 
                    name="buttonVariant" 
                    value={currentContent.buttonVariant} 
                    onChange={handleInputChange}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="success">Success</option>
                    <option value="danger">Danger</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="outline-primary">Outline Primary</option>
                    <option value="outline-secondary">Outline Secondary</option>
                    <option value="outline-success">Outline Success</option>
                    <option value="outline-danger">Outline Danger</option>
                    <option value="outline-warning">Outline Warning</option>
                    <option value="outline-info">Outline Info</option>
                    <option value="outline-light">Outline Light</option>
                    <option value="outline-dark">Outline Dark</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Background Image</Form.Label>
              <Form.Control 
                type="file" 
                onChange={handleImageChange} 
                accept="image/*"
              />
              <Form.Text className="text-muted">
                Recommended size: 1200x500 pixels. Max file size: 5MB.
              </Form.Text>
            </Form.Group>
            
            {(imagePreview || currentContent.backgroundImage) && (
              <div className="mb-3">
                <p className="mb-2">Image Preview:</p>
                <div className="position-relative">
                  <Image 
                    src={imagePreview || currentContent.backgroundImage} 
                    alt="Preview" 
                    thumbnail 
                    style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }} 
                  />
                  {!imageFile && currentContent.backgroundImage && (
                    <div className="mt-2">
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          setCurrentContent({
                            ...currentContent,
                            backgroundImage: ''
                          });
                          setImagePreview(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isUploading && (
              <div className="mb-3">
                <p className="mb-1">Uploading: {uploadProgress}%</p>
                <div className="progress">
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
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
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  {modalMode === 'add' ? 'Adding...' : 'Saving...'}
                </>
              ) : (
                modalMode === 'add' ? 'Add Content' : 'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <Alert variant="danger" className="mb-3">
              {deleteError}
            </Alert>
          )}
          <p>Are you sure you want to delete the content <strong>"{contentToDelete?.title}"</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
            {deleteLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HomeContentManagement;