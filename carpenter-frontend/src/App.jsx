import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/layout/PublicLayout'
import Spinner from './components/ui/Spinner'

// Lazy load Pages
const HomePage = lazy(() => import('./pages/public/HomePage'))
const GalleryPage = lazy(() => import('./pages/public/GalleryPage'))
const ProductDetailPage = lazy(() => import('./pages/public/ProductDetailPage'))
const OrderPage = lazy(() => import('./pages/public/OrderPage'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const TrackOrderPage = lazy(() => import('./pages/public/TrackOrderPage'))
const ShippingReturnsPage = lazy(() => import('./pages/public/ShippingReturnsPage'))
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'))
const CustomerLoginPage = lazy(() => import('./pages/public/CustomerLoginPage'))
const CustomerRegisterPage = lazy(() => import('./pages/public/CustomerRegisterPage'))
const CustomerAccountPage = lazy(() => import('./pages/public/CustomerAccountPage'))
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'))

// Lazy load Admin Pages
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'))
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#2a2a2a',
              color: '#F5EDD6',
              border: '1px solid rgba(139,105,20,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
            },
          }}
        />

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
            <Spinner size="lg" />
          </div>
        }>
          <Routes>
            {/* ── PUBLIC ROUTES ───────────────────── */}
            <Route path="/"              element={<PublicLayout><HomePage /></PublicLayout>} />
            <Route path="/gallery"       element={<PublicLayout><GalleryPage /></PublicLayout>} />
            <Route path="/products/:id"  element={<PublicLayout><ProductDetailPage /></PublicLayout>} />
            <Route path="/order"         element={<PublicLayout><OrderPage /></PublicLayout>} />
            <Route path="/contact"       element={<PublicLayout><ContactPage /></PublicLayout>} />
            <Route path="/track-order"   element={<PublicLayout><TrackOrderPage /></PublicLayout>} />
            <Route path="/shipping-returns" element={<PublicLayout><ShippingReturnsPage /></PublicLayout>} />
            <Route path="/privacy"       element={<PublicLayout><PrivacyPage /></PublicLayout>} />
            <Route path="/login"         element={<PublicLayout><CustomerLoginPage /></PublicLayout>} />
            <Route path="/register"      element={<PublicLayout><CustomerRegisterPage /></PublicLayout>} />
            <Route path="/forgot-password" element={<PublicLayout><ForgotPasswordPage /></PublicLayout>} />
            <Route path="/account"       element={<PublicLayout><CustomerAccountPage /></PublicLayout>} />

            {/* ── ADMIN AUTH ──────────────────────── */}
            <Route path="/admin/login"   element={<LoginPage />} />

            {/* ── ADMIN PROTECTED ─────────────────── */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/admin/products" element={
              <ProtectedRoute><ProductsPage /></ProtectedRoute>
            } />
            <Route path="/admin/products/new" element={
              <ProtectedRoute><ProductFormPage /></ProtectedRoute>
            } />
            <Route path="/admin/products/:id/edit" element={
              <ProtectedRoute><ProductFormPage /></ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute><OrdersPage /></ProtectedRoute>
            } />
            <Route path="/admin/orders/:id" element={
              <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            } />

            {/* ── REDIRECTS ───────────────────────── */}
            <Route path="/admin"     element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="*"          element={<Navigate to="/"               replace />} />
          </Routes>
        </Suspense>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
