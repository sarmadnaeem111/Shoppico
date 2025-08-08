import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Pagination } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllProducts, getAllCategories } from '../../services/firestore';
import ProductCard from '../common/ProductCard';
import ProductFilter from '../common/ProductFilter';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import FloatingCart from '../common/FloatingCart';
import { useCart } from '../../contexts/CartContext';

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { addToCart } = useCart();
  
  // State for products and filtering
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({
    min: queryParams.get('minPrice') || '',
    max: queryParams.get('maxPrice') || ''
  });
  const [sortOption, setSortOption] = useState(queryParams.get('sort') || 'newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 12;
  
  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all products
        const productsData = await getAllProducts();
        setProducts(productsData);
        
        // Fetch all categories
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Apply filters and update URL
  useEffect(() => {
    // Apply filters
    let filtered = [...products];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      );
    }
    
    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(product => 
        product.price >= parseFloat(priceRange.min)
      );
    }
    
    if (priceRange.max) {
      filtered = filtered.filter(product => 
        product.price <= parseFloat(priceRange.max)
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    // Calculate total pages
    setTotalPages(Math.ceil(filtered.length / productsPerPage));
    
    // Reset to first page if filters change
    if (currentPage > Math.ceil(filtered.length / productsPerPage)) {
      setCurrentPage(1);
    }
    
    // Update filtered products
    setFilteredProducts(filtered);
    
    // Update URL with query parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    navigate(newUrl, { replace: true });
    
  }, [products, searchTerm, selectedCategory, priceRange, sortOption, currentPage, location.pathname, navigate]);
  
  // Handle filter changes
  const handleFilterChange = (filters) => {
    setSearchTerm(filters.searchTerm || '');
    setSelectedCategory(filters.category || '');
    setPriceRange({
      min: filters.minPrice || '',
      max: filters.maxPrice || ''
    });
    setSortOption(filters.sortBy || 'newest');
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when page changes
  };
  
  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };
  
  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;
    
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.First 
          onClick={() => handlePageChange(1)} 
          disabled={currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        />
        
        {startPage > 1 && (
          <>
            <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>
            {startPage > 2 && <Pagination.Ellipsis />}
          </>
        )}
        
        {pages.map(page => (
          <Pagination.Item 
            key={page} 
            active={page === currentPage}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Pagination.Ellipsis />}
            <Pagination.Item onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>
          </>
        )}
        
        <Pagination.Next 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => handlePageChange(totalPages)} 
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };
  
  if (loading) {
    return <LoadingSpinner fullPage text="Loading products..." />;
  }
  
  return (
    <>
      <Container className="py-5">
        <h1 className="mb-4">Products</h1>
        
        {error && (
          <ErrorAlert error={error} onClose={() => setError(null)} className="mb-4" />
        )}
        
        <Row className="mb-4">
          <Col>
            <ProductFilter 
              categories={categories}
              initialFilters={{
                searchTerm,
                category: selectedCategory,
                minPrice: priceRange.min,
                maxPrice: priceRange.max,
                sortBy: sortOption
              }}
              onFilterChange={handleFilterChange}
            />
          </Col>
        </Row>
        
        <Row>
          <Col>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-search display-1 text-muted"></i>
                <h3 className="mt-3">No products found</h3>
                <p className="text-muted">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <>
                <p className="mb-4">
                  Showing {getCurrentPageProducts().length} of {filteredProducts.length} products
                </p>
                
                <Row>
                  {getCurrentPageProducts().map((product, index) => (
                    <Col key={product.id} md={6} lg={4} className="mb-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ProductCard 
                          product={product} 
                          onAddToCart={(product) => {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl,
                              quantity: 1
                            });
                          }}
                        />
                      </motion.div>
                    </Col>
                  ))}
                </Row>
                
                <PaginationComponent />
              </>
            )}
          </Col>
        </Row>
      </Container>
      <FloatingCart />
    </>
  );
};

export default Products;