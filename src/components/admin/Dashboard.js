import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllUsers, getAllProducts, getAllCategories, getAllHomeContent, getAllOrders } from '../../services/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/helpers';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    categories: 0,
    homeContent: 0,
    orders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [users, products, categories, homeContent, orders] = await Promise.all([
          getAllUsers(),
          getAllProducts(),
          getAllCategories(),
          getAllHomeContent(),
          getAllOrders()
        ]);
        
        // Sort orders by createdAt in descending order and take the most recent 5
        const sortedOrders = [...orders].sort((a, b) => {
          return new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate());
        }).slice(0, 5);
        
        setRecentOrders(sortedOrders);
        
        setStats({
          users: users.length,
          products: products.length,
          categories: categories.length,
          homeContent: homeContent.length,
          orders: orders.length
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
      </Container>
    );
  }

  // Dashboard card data
  const dashboardCards = [
    {
      title: 'Total Users',
      count: stats.users,
      icon: 'bi-people-fill',
      color: 'primary',
      link: '/admin/users',
      linkText: 'Manage Users'
    },
    {
      title: 'Total Products',
      count: stats.products,
      icon: 'bi-box-seam-fill',
      color: 'success',
      link: '/admin/products',
      linkText: 'Manage Products'
    },
    {
      title: 'Categories',
      count: stats.categories,
      icon: 'bi-tags-fill',
      color: 'info',
      link: '/admin/categories',
      linkText: 'Manage Categories'
    },
    {
      title: 'Home Content',
      count: stats.homeContent,
      icon: 'bi-house-gear',
      color: 'warning',
      link: '/admin/home-content',
      linkText: 'Manage Home Content'
    }
  ];

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button as={Link} to="/admin/products/new" variant="primary" className="me-2">
            <i className="bi bi-plus-circle me-2"></i>
            Add Product
          </Button>
          <Button as={Link} to="/admin/categories/new" variant="outline-primary">
            <i className="bi bi-folder-plus me-2"></i>
            Add Category
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Row>
          {dashboardCards.map((card, index) => (
            <Col md={4} key={index} className="mb-4">
              <motion.div variants={itemVariants}>
                <Card className={`shadow-sm border-${card.color} h-100`}>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="card-title">{card.title}</h5>
                        <h2 className={`text-${card.color} fw-bold mb-0`}>{card.count}</h2>
                      </div>
                      <div className={`bg-${card.color} bg-opacity-10 p-3 rounded-circle`}>
                        <i className={`bi ${card.icon} fs-1 text-${card.color}`}></i>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Button 
                        as={Link} 
                        to={card.link} 
                        variant={`outline-${card.color}`} 
                        className="w-100"
                      >
                        {card.linkText}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      <Row className="mt-4">
        <Col lg={8} className="mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Recent Activity</h5>
              </Card.Header>
              <Card.Body>
                {recentOrders.length > 0 ? (
                  <Table responsive hover className="align-middle">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="text-muted">{order.id.substring(0, 8)}...</td>
                          <td>{order.customerInfo.firstName} {order.customerInfo.lastName}</td>
                          <td>{order.createdAt ? formatDate(order.createdAt.toDate()) : 'N/A'}</td>
                          <td>{formatCurrency(order.total * 100)}</td>
                          <td>
                            <Badge bg={order.status === 'completed' ? 'success' : 
                                    order.status === 'canceled' ? 'danger' : 
                                    order.status === 'on the way' ? 'info' : 'warning'}>
                              {order.status}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              as={Link} 
                              to={`/admin/orders`} 
                              size="sm" 
                              variant="outline-primary"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-bag display-1 text-muted mb-3"></i>
                    <h5>No Recent Orders</h5>
                    <p className="text-muted">
                      New orders will appear here when customers make purchases.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button as={Link} to="/admin/products" variant="outline-secondary">
                    <i className="bi bi-box-seam me-2"></i>
                    View All Products
                  </Button>
                  <Button as={Link} to="/admin/users" variant="outline-secondary">
                    <i className="bi bi-people me-2"></i>
                    View All Users
                  </Button>
                  <Button as={Link} to="/admin/categories" variant="outline-secondary">
                    <i className="bi bi-tags me-2"></i>
                    View All Categories
                  </Button>
                  <Button as={Link} to="/admin/home-content" variant="outline-secondary">
                    <i className="bi bi-house-gear me-2"></i>
                    Manage Home Content
                  </Button>
                  <Button as={Link} to="/admin/orders" variant="outline-secondary">
                    <i className="bi bi-bag-check me-2"></i>
                    Manage Orders
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;