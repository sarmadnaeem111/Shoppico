import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, truncateText } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';
import { useAuth } from '../../contexts/AuthContext';

const ProductCard = ({ product, onAddToCart }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  if (!product) return null;

  const {
    id,
    name,
    price,
    imageUrl,
    imageUrls,
    description,
    category,
    inStock,
    stockQuantity
  } = product;

  // Get the main image URL (either from imageUrls array or fallback to legacy imageUrl)
  const mainImageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : imageUrl;
  
  // Optimize image URL with Cloudinary
  const optimizedImageUrl = optimizeImage(mainImageUrl, 300);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-100 shadow-sm product-card">
        <div className="product-image-container">
          <Card.Img 
            variant="top" 
            src={optimizedImageUrl || '/placeholder-product.jpg'} 
            alt={name}
            className="product-image"
            style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
          />
        </div>
        <Card.Body className="d-flex flex-column">
          <Card.Title className="product-title">{name}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">{category}</Card.Subtitle>
          <Card.Text className="product-description">
            {truncateText(description, 80)}
          </Card.Text>
          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="product-price fw-bold">{formatCurrency(price)}</span>
              {inStock !== undefined && (
                <small className={`badge ${inStock ? 'bg-success' : 'bg-danger'}`}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </small>
              )}
            </div>
            <div className="d-flex justify-content-between">
              <Button 
                as={Link} 
                to={`/products/${id}`} 
                variant="outline-primary" 
                className="me-2 flex-grow-1"
              >
                View Details
              </Button>
              {onAddToCart && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login', { state: { message: 'Login to buy products' } });
                    } else {
                      onAddToCart(product);
                    }
                  }}
                  className="flex-grow-1"
                  disabled={inStock === false}
                >
                  <i className="bi bi-cart-plus"></i> Add to Cart
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default ProductCard;