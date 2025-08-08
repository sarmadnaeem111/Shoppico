import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { debounce } from '../../utils/helpers';
import { getAllCategories } from '../../services/firestore';

const ProductFilter = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });
  const [loading, setLoading] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Debounced filter change handler
  const debouncedFilterChange = debounce((newFilters) => {
    onFilterChange(newFilters);
  }, 300);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  // Handle form reset
  const handleReset = () => {
    const resetFilters = {
      searchTerm: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-3 bg-light rounded shadow-sm"
    >
      <Form className="d-flex flex-wrap align-items-end">
        <div className="me-2 mb-2 mb-md-0 flex-grow-1 flex-md-grow-0" style={{ minWidth: '200px', maxWidth: '300px' }}>
          <Form.Group controlId="searchTerm" className="mb-0">
            <Form.Label className="small">Search</Form.Label>
            <InputGroup size="sm">
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search products..."
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleInputChange}
              />
            </InputGroup>
          </Form.Group>
        </div>
        <div className="me-2 mb-2 mb-md-0" style={{ minWidth: '150px' }}>
          <Form.Group controlId="category" className="mb-0">
            <Form.Label className="small">Category</Form.Label>
            <Form.Select
              size="sm"
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              disabled={loading || categories.length === 0}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
        <div className="me-2 mb-2 mb-md-0" style={{ minWidth: '100px' }}>
          <Form.Group controlId="minPrice" className="mb-0">
            <Form.Label className="small">Min Price</Form.Label>
            <Form.Control
              size="sm"
              type="number"
              placeholder="Min"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleInputChange}
              min="0"
            />
          </Form.Group>
        </div>
        <div className="me-2 mb-2 mb-md-0" style={{ minWidth: '100px' }}>
          <Form.Group controlId="maxPrice" className="mb-0">
            <Form.Label className="small">Max Price</Form.Label>
            <Form.Control
              size="sm"
              type="number"
              placeholder="Max"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleInputChange}
              min="0"
            />
          </Form.Group>
        </div>
        <div className="me-2 mb-2 mb-md-0" style={{ minWidth: '150px' }}>
          <Form.Group controlId="sortBy" className="mb-0">
            <Form.Label className="small">Sort By</Form.Label>
            <Form.Select
              size="sm"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleInputChange}
            >
              <option value="newest">Newest First</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="nameAsc">Name: A to Z</option>
              <option value="nameDesc">Name: Z to A</option>
            </Form.Select>
          </Form.Group>
        </div>
        <div className="mb-2 mb-md-0 d-flex align-items-end">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleReset}
            className="ms-2"
          >
            Reset
          </Button>
        </div>
      </Form>
    </motion.div>
  );
};

export default ProductFilter;