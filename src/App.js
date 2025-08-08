import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ChatProvider } from './contexts/ChatContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import CustomerChat from './components/chat/CustomerChat';

// Auth Components
import { PrivateRoute, AdminRoute, CustomerRoute, PublicRoute } from './components/auth/ProtectedRoutes';
import TwoFactorAuthPage from './pages/auth/TwoFactorAuthPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ProductsPage from './pages/customer/ProductsPage';
import ProductDetailsPage from './pages/customer/ProductDetailsPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import ProfilePage from './pages/customer/ProfilePage';
import SecuritySettings from './components/profile/SecuritySettings';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import HomeContentManagementPage from './pages/admin/HomeContentManagementPage';
import OrderManagementPage from './pages/admin/OrderManagementPage';
import ChatManagementPage from './pages/admin/ChatManagementPage';

// Common Pages
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductDetailsPage />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            } />
            <Route path="/verify-email" element={
              <PublicRoute>
                <VerifyEmailPage />
              </PublicRoute>
            } />
            <Route path="/two-factor-auth" element={
              <PublicRoute>
                <TwoFactorAuthPage />
              </PublicRoute>
            } />
            
            {/* Customer Routes */}
            <Route path="/cart" element={
              <CustomerRoute>
                <CartPage />
              </CustomerRoute>
            } />
            <Route path="/checkout" element={
              <CustomerRoute>
                <CheckoutPage />
              </CustomerRoute>
            } />
            <Route path="/orders" element={
              <CustomerRoute>
                <OrdersPage />
              </CustomerRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />
            <Route path="/security-settings" element={
              <CustomerRoute>
                <SecuritySettings />
              </CustomerRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminRoute>
            } />
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <ProductManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/products/new" element={
              <AdminRoute>
                <ProductFormPage />
              </AdminRoute>
            } />
            <Route path="/admin/products/edit/:productId" element={
              <AdminRoute>
                <ProductFormPage />
              </AdminRoute>
            } />
            <Route path="/admin/categories" element={
              <AdminRoute>
                <CategoryManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/home-content" element={
              <AdminRoute>
                <HomeContentManagementPage />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <OrderManagementPage />
              </AdminRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
            {/* Admin Chat Management */}
            <Route path="/admin/chats" element={
              <AdminRoute>
                <ChatManagementPage />
              </AdminRoute>
            } />
          </Routes>
          
          {/* Customer Chat Widget (available on all pages for logged in customers) */}
          <CustomerChat />
        </ChatProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
