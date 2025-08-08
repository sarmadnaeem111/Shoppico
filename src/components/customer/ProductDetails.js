import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductById, getRelatedProducts } from '../../services/firestore';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, optimizeCloudinaryImage } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import ProductCard from '../common/ProductCard';
import FloatingCart from '../common/FloatingCart';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  
  // Refs for zoom functionality
  const imageContainerRef = useRef(null);
  const zoomRef = useRef(null);
  
  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const productData = await getProductById(productId);
        
        if (!productData) {
          setError('Product not found');
          return;
        }
        
        setProduct(productData);
        
        // Fetch related products
        if (productData.category) {
          const related = await getRelatedProducts(productData.category, productId, 4);
          setRelatedProducts(related);
        }
        
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Handle mouse movement for zoom effect
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current || !zoomRef.current) return;
    
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the image container
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    // Ensure values are within bounds (0 to 1)
    const boundedX = Math.max(0, Math.min(1, x));
    const boundedY = Math.max(0, Math.min(1, y));
    
    setZoomPosition({ x: boundedX, y: boundedY });
  };
  
  // Handle mouse enter for zoom container
  const handleMouseEnter = () => {
    setShowZoom(true);
  };
  
  // Handle mouse leave for zoom container
  const handleMouseLeave = () => {
    setShowZoom(false);
  };
  
  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if user is authenticated
    if (!currentUser) {
      // Redirect to login page with message
      navigate('/login', { state: { message: 'Login to buy products' } });
      return;
    }
    
    try {
      setAddingToCart(true);
      
      // Get the main image URL (either from imageUrls array or fallback to legacy imageUrl)
      const mainImageUrl = product.imageUrls && product.imageUrls.length > 0 
        ? product.imageUrls[0] 
        : product.imageUrl;
      
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: mainImageUrl,
        quantity: quantity
      });
      
      // Show success message or navigate to cart
      // For now, we'll just reset quantity
      setQuantity(1);
      
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading product details..." />;
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
        <Button variant="primary" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <h2>Product Not Found</h2>
        <p className="text-muted mb-4">The product you're looking for doesn't exist or has been removed.</p>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button 
              variant="link" 
              className="text-decoration-none p-0" 
              onClick={() => navigate('/products')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Products
            </Button>
          </div>
          
          <Row>
            {/* Product Images */}
            <Col lg={6} className="mb-4 mb-lg-0">
              {/* Main Image with Zoom */}
              <Card className="border-0 shadow-sm overflow-hidden mb-3">
                <div 
                  className="position-relative product-image-container" 
                  ref={imageContainerRef}
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {product.onSale && (
                    <Badge 
                      bg="danger" 
                      className="position-absolute top-0 start-0 m-3 py-2 px-3 rounded-pill"
                    >
                      SALE
                    </Badge>
                  )}
                  <img 
                    src={optimizeImage(
                      // Use imageUrls array if available, otherwise fall back to legacy imageUrl
                      (product.imageUrls && product.imageUrls.length > 0)
                        ? product.imageUrls[selectedImageIndex]
                        : product.imageUrl,
                      600
                    )}
                    alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                    className="img-fluid w-100"
                    style={{ objectFit: 'contain', height: '400px', backgroundColor: '#f8f9fa', cursor: 'crosshair' }}
                  />
                  
                  {/* Zoom Container */}
                  <div 
                    ref={zoomRef}
                    className="product-image-zoom"
                    style={{
                      display: showZoom ? 'block' : 'none',
                      width: '300px',
                      height: '300px',
                      right: '-320px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundImage: `url(${optimizeImage(
                        (product.imageUrls && product.imageUrls.length > 0)
                          ? product.imageUrls[selectedImageIndex]
                          : product.imageUrl,
                        1200 // Higher resolution for zoom
                      )})`,
                      backgroundPosition: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '250%',
                    }}
                  />
                </div>
              </Card>
              
              {/* Thumbnails */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <Row className="g-2">
                  {product.imageUrls.map((imageUrl, index) => (
                    <Col key={index} xs={3}>
                      <Card 
                        className={`border-0 overflow-hidden cursor-pointer ${selectedImageIndex === index ? 'border border-primary' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{ 
                          cursor: 'pointer',
                          opacity: selectedImageIndex === index ? 1 : 0.7,
                          transition: 'all 0.2s ease-in-out',
                          transform: selectedImageIndex === index ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <img 
                          src={optimizeImage(imageUrl, 150)}
                          alt={`${product.name} - Thumbnail ${index + 1}`}
                          className="img-fluid"
                          style={{ height: '80px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
            
            {/* Product Details */}
            <Col lg={6}>
              <div className="mb-2">
                <Badge bg="secondary" className="text-uppercase">
                  {product.category}
                </Badge>
              </div>
              
              <h1 className="mb-3">{product.name}</h1>
              
              <div className="mb-4">
                <h2 className="text-primary mb-0">
                  {formatCurrency(product.price)}
                </h2>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-muted text-decoration-line-through ms-2">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-muted">{product.description}</p>
              </div>
              
              {/* Stock Status */}
              <div className="mb-4">
                <span className="me-2">Availability:</span>
                {product.inStock ? (
                  <>
                    <Badge bg="success">In Stock</Badge>
                    {product.stockQuantity && (
                      <span className="ms-2 text-muted">({product.stockQuantity} items available)</span>
                    )}
                  </>
                ) : (
                  <Badge bg="danger">Out of Stock</Badge>
                )}
              </div>
              
              {/* Add to Cart */}
              {product.inStock && (
                <div className="d-flex align-items-center mb-4">
                  <Form.Group className="me-3" style={{ width: '100px' }}>
                    <Form.Control
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      disabled={addingToCart}
                    />
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <LoadingSpinner size="sm" text="" />
                        <span className="ms-2">Adding...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cart-plus me-2"></i>
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Additional Details */}
              <Card className="border-0 bg-light mb-4">
                <Card.Body>
                  <h5 className="mb-3">Product Details</h5>
                  <Row>
                    <Col xs={4} className="text-muted">SKU:</Col>
                    <Col xs={8}>{product.sku || product.id.substring(0, 8).toUpperCase()}</Col>
                  </Row>
                  <hr className="my-2" />
                  <Row>
                    <Col xs={4} className="text-muted">Category:</Col>
                    <Col xs={8} className="text-capitalize">{product.category}</Col>
                  </Row>
                  {product.brand && (
                    <>
                      <hr className="my-2" />
                      <Row>
                        <Col xs={4} className="text-muted">Brand:</Col>
                        <Col xs={8}>{product.brand}</Col>
                      </Row>
                    </>
                  )}
                  {product.weight && (
                    <>
                      <hr className="my-2" />
                      <Row>
                        <Col xs={4} className="text-muted">Weight:</Col>
                        <Col xs={8}>{product.weight} kg</Col>
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-4">Related Products</h3>
              <Row>
                {relatedProducts.map(relatedProduct => (
                  <Col key={relatedProduct.id} md={6} lg={3} className="mb-4">
                    <ProductCard product={relatedProduct} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </motion.div>
      </Container>
      <FloatingCart />
    </>
  );
};

export default ProductDetails;