import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProducts, deleteProduct, getAllCategories } from '../../services/firestore';
import { formatCurrency, truncateText } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? product.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // Handle product deletion
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError('Failed to delete product. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading products..." />;
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button as={Link} to="/admin/products/new" variant="primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add New Product
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
            <Col md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} lg={3}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={5} className="d-flex align-items-center mt-3 mt-lg-0">
              <span className="ms-auto">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </span>
            </Col>
          </Row>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search display-1 text-muted mb-3"></i>
              <h5>No products found</h5>
              <p className="text-muted">
                Try adjusting your search or filter to find what you're looking for.
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
                    <th style={{ width: '80px' }}></th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    // Find category name
                    const category = categories.find(c => c.id === product.category);
                    const categoryName = category ? category.name : 'Unknown';
                    
                    return (
                      <tr key={product.id}>
                        <td>
                          <img
                            src={optimizeImage(product.imageUrl, 60) || '/placeholder-product.jpg'}
                            alt={product.name}
                            width="60"
                            height="60"
                            className="rounded"
                            style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold">{product.name}</div>
                          <small className="text-muted">
                            {truncateText(product.description, 60)}
                          </small>
                        </td>
                        <td>
                          <Badge bg="secondary" pill>
                            {categoryName}
                          </Badge>
                        </td>
                        <td className="fw-bold">{formatCurrency(product.price)}</td>
                        <td>
                          <Button
                            as={Link}
                            to={`/admin/products/edit/${product.id}`}
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </motion.div>
          )}
        </Card.Body>
      </Card>

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
          <p>Are you sure you want to delete the product <strong>{productToDelete?.name}</strong>?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <LoadingSpinner size="sm" text="" /> : 'Delete Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductManagement;