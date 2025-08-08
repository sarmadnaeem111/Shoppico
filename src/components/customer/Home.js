import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProducts, getAllCategories, getAllHomeContent } from '../../services/firestore';
import { optimizeCloudinaryImage, formatCurrency } from '../../utils/helpers';
import ProductCard from '../common/ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [homeContent, setHomeContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch featured products, categories, and home content
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all products and filter featured ones (limit to 8)
        const allProducts = await getAllProducts();
        const featured = allProducts.filter(product => product.featured).slice(0, 8);
        setFeaturedProducts(featured);
        
        // Fetch all categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
        
        // Fetch home content
        const homeContentData = await getAllHomeContent();
        setHomeContent(homeContentData);
        
      } catch (err) {
        console.error('Error fetching home page data:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hero section with carousel
  const HeroSection = () => {
    // Default carousel items if no content is available from Firestore
    const defaultCarouselItems = [
      {
        id: 'default-carousel-1',
        title: 'Summer Collection 2023',
        subtitle: 'Discover our latest arrivals with up to 40% off',
        buttonText: 'Shop Now',
        buttonVariant: 'primary',
        backgroundImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'default-carousel-2',
        title: 'Premium Quality Products',
        subtitle: 'Handpicked items for your lifestyle',
        buttonText: 'Explore Collection',
        buttonVariant: 'outline-light',
        backgroundImage: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
      },
      {
        id: 'default-carousel-3',
        title: 'Free Shipping Worldwide',
        subtitle: `On all orders over ${formatCurrency(500000)}`,
        buttonText: 'Shop Now',
        buttonVariant: 'primary',
        backgroundImage: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
      }
    ];
    
    // Filter home content to get only carousel items (type: 'carousel')
    const carouselItems = homeContent.filter(item => item.type === 'carousel');
    
    // Use Firestore data if available, otherwise use defaults
    const items = carouselItems.length > 0 ? carouselItems : defaultCarouselItems;
    
    return (
      <div className="hero-section mb-5">
        <Carousel fade interval={3000} className="shadow-sm rounded overflow-hidden">
          {items.map((item, index) => (
            <Carousel.Item key={`${item.id}-${index}`}>
              <div 
                className="d-block w-100 bg-dark carousel-image-container" 
                style={{ 
                  backgroundImage: `url(${item.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '500px'
                }}
              />
              <Carousel.Caption className="text-start p-4 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <h1>{item.title}</h1>
                <p>{item.subtitle}</p>
                <Button 
                  as={Link} 
                  to="/products" 
                  variant={item.buttonVariant || 'primary'} 
                  size="lg" 
                  className="mt-2"
                >
                  {item.buttonText || 'Shop Now'}
                </Button>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    );
  };

  // Featured categories section
  const CategoriesSection = () => (
    <section className="mb-5">
      <h2 className="mb-4">Shop by Category</h2>
      <Row>
        {categories.slice(0, 4).map((category, index) => (
          <Col key={category.id} md={6} lg={3} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                as={Link} 
                to={`/products?category=${category.id}`}
                className="text-decoration-none text-dark h-100 shadow-sm border-0 overflow-hidden"
              >
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  {category.imageUrl ? (
                    <Card.Img 
                      variant="top" 
                      src={optimizeCloudinaryImage(category.imageUrl, 400)}
                      alt={category.name}
                      className="h-100 w-100"
                      style={{ objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                    />
                  ) : (
                    <div 
                      className="bg-light h-100 d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-collection display-4 text-muted"></i>
                    </div>
                  )}
                </div>
                <Card.Body className="text-center">
                  <Card.Title className="mb-0 text-capitalize">{category.name}</Card.Title>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
      {categories.length > 4 && (
        <div className="text-center mt-3">
          <Button as={Link} to="/products" variant="outline-primary">
            View All Categories
          </Button>
        </div>
      )}
    </section>
  );

  // Featured products section
  const FeaturedProductsSection = () => (
    <section className="mb-5">
      <h2 className="mb-4">Featured Products</h2>
      <Row>
        {featuredProducts.map((product, index) => (
          <Col key={product.id} md={6} lg={3} className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          </Col>
        ))}
      </Row>
      <div className="text-center mt-3">
        <Button as={Link} to="/products" variant="primary">
          View All Products
        </Button>
      </div>
    </section>
  );

  // Promotional banners
  const PromotionalBanners = () => {
    // Default promotional banners if no content is available from Firestore
    const defaultPromoBanners = {
      special_offer: {
        id: 'default-special-offer',
        type: 'special_offer',
        title: 'Special Offer',
        subtitle: 'Get 20% off on selected items',
        buttonText: 'Shop Now',
        buttonVariant: 'light',
        backgroundImage: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
      },
      new_arrivals: {
        id: 'default-new-arrivals',
        type: 'new_arrivals',
        title: 'New Arrivals',
        subtitle: 'Check out our latest collection',
        buttonText: 'Discover Now',
        buttonVariant: 'light',
        backgroundImage: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
      }
    };
    
    // Filter home content to get promotional banners
    const specialOfferContent = homeContent.find(item => item.type === 'special_offer') || defaultPromoBanners.special_offer;
    const newArrivalsContent = homeContent.find(item => item.type === 'new_arrivals') || defaultPromoBanners.new_arrivals;
    
    return (
      <section className="mb-5">
        <Row>
          <Col md={6} className="mb-4 mb-md-0">
            <Card className="border-0 shadow-sm overflow-hidden h-100">
              <div className="position-relative">
                <Card.Img 
                  src={specialOfferContent.backgroundImage} 
                  alt={specialOfferContent.title}
                  style={{ height: '250px', objectFit: 'cover', backgroundColor: '#f8f9fa', width: '100%' }}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div className="p-4 text-white">
                    <h3>{specialOfferContent.title}</h3>
                    <p className="mb-3">{specialOfferContent.subtitle}</p>
                    <Button as={Link} to="/products" variant={specialOfferContent.buttonVariant || 'light'}>
                      {specialOfferContent.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="border-0 shadow-sm overflow-hidden h-100">
              <div className="position-relative">
                <Card.Img 
                  src={newArrivalsContent.backgroundImage} 
                  alt={newArrivalsContent.title}
                  style={{ height: '250px', objectFit: 'cover', backgroundColor: '#f8f9fa', width: '100%' }}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <div className="p-4 text-white">
                    <h3>{newArrivalsContent.title}</h3>
                    <p className="mb-3">{newArrivalsContent.subtitle}</p>
                    <Button as={Link} to="/products" variant={newArrivalsContent.buttonVariant || 'light'}>
                      {newArrivalsContent.buttonText}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </section>
    );
  };

  // Features section
  const FeaturesSection = () => (
    <section className="mb-5 py-4 bg-light rounded">
      <Container>
        <Row className="text-center">
          <Col md={3} className="mb-4 mb-md-0">
            <div className="px-3">
              <i className="bi bi-truck display-4 text-primary mb-3"></i>
              <h5>Free Shipping</h5>
              <p className="text-muted small">On orders over {formatCurrency(500000)}</p>
            </div>
          </Col>
          <Col md={3} className="mb-4 mb-md-0">
            <div className="px-3">
              <i className="bi bi-shield-check display-4 text-primary mb-3"></i>
              <h5>Secure Payment</h5>
              <p className="text-muted small">100% secure payment</p>
            </div>
          </Col>
          <Col md={3} className="mb-4 mb-md-0">
            <div className="px-3">
              <i className="bi bi-arrow-repeat display-4 text-primary mb-3"></i>
              <h5>Easy Returns</h5>
              <p className="text-muted small">14 day return policy</p>
            </div>
          </Col>
          <Col md={3}>
            <div className="px-3">
              <i className="bi bi-headset display-4 text-primary mb-3"></i>
              <h5>24/7 Support</h5>
              <p className="text-muted small">Customer support</p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );

  // Newsletter section
  const NewsletterSection = () => (
    <section className="mb-5 py-5 bg-primary text-white rounded">
      <Container className="text-center">
        <h3 className="mb-3">Subscribe to Our Newsletter</h3>
        <p className="mb-4">Get the latest updates on new products and upcoming sales</p>
        <Row className="justify-content-center">
          <Col md={6}>
            <div className="input-group mb-3">
              <input type="email" className="form-control" placeholder="Your email address" />
              <Button variant="light">Subscribe</Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );

  if (loading) {
    return <LoadingSpinner fullPage text="Loading..." />;
  }

  return (
    <Container fluid className="p-0">
      <HeroSection />
      
      <Container>
        {error && (
          <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
        )}
        
        <CategoriesSection />
        
        <PromotionalBanners />
        
        {featuredProducts.length > 0 && <FeaturedProductsSection />}
        
        <FeaturesSection />
        
        <NewsletterSection />
      </Container>
    </Container>
  );
};

export default Home;