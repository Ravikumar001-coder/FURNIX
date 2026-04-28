import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import GalleryPage from './pages/public/GalleryPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import CustomerLoginPage from './pages/public/CustomerLoginPage';
import CustomerRegisterPage from './pages/public/CustomerRegisterPage';
import ProjectTrackingPage from './pages/public/ProjectTrackingPage';
import InquiryFlowPage from './pages/public/InquiryFlowPage';
import TrackOrderPage from './pages/public/TrackOrderPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPage from './pages/public/PrivacyPage';
import ShippingReturnsPage from './pages/public/ShippingReturnsPage';
import CustomerAccountPage from './pages/public/CustomerAccountPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import OrderPage from './pages/public/OrderPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProductsPage from './pages/admin/ProductsPage';
import OrdersPage from './pages/admin/OrdersPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminLoginPage from './pages/admin/LoginPage';
import ProductFormPage from './pages/admin/ProductFormPage';

const App = () => {
  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout><Outlet /></PublicLayout>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<CustomerLoginPage />} />
              <Route path="/register" element={<CustomerRegisterPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/track/:id" element={<ProjectTrackingPage />} />
              <Route path="/inquiry" element={<InquiryFlowPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/order" element={<OrderPage />} />
              
              {/* Authenticated Customer Routes */}
              <Route path="/account" element={<CustomerAccountPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            <Route element={
              <ProtectedRoute>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/products/new" element={<ProductFormPage />} />
              <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/order/:id" element={<OrderDetailPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Router>
      </SiteSettingsProvider>
    </AuthProvider>
  );
};

export default App;
