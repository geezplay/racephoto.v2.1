import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';

// Public Pages
import Home from './pages/Home';
import Event from './pages/Event';
import ClassCatalog from './pages/ClassCatalog';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Success from './pages/Success';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './pages/auth/AuthCallback';

// Buyer Pages
import Account from './pages/account/Account';
import AccountOrders from './pages/account/Orders';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import EventForm from './pages/admin/EventForm';
import PhotoForm from './pages/admin/PhotoForm';
import Transactions from './pages/admin/Transactions';
import AdminManagement from './pages/admin/AdminManagement';
import PendingEvents from './pages/admin/PendingEvents';
import SponsorManagement from './pages/admin/SponsorManagement';
import PhotographerManagement from './pages/admin/PhotographerManagement';
import Settings from './pages/admin/Settings';
import Balance from './pages/admin/Balance';
import WithdrawalRequests from './pages/admin/WithdrawalRequests';
import RecapList from './pages/admin/RecapList';
import RecapUpload from './pages/admin/RecapUpload';
import UpcomingEventList from './pages/admin/UpcomingEventList';
import UpcomingEventForm from './pages/admin/UpcomingEventForm';
import DiscountManager from './pages/admin/DiscountManager';
import EventManager from './pages/admin/EventManager';

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const ProtectedRoute = ({ children, requireSuperAdmin = false }: { children: ReactNode; requireSuperAdmin?: boolean }) => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user || !isAdmin()) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && !isSuperAdmin()) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

const BuyerRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/event/:id" element={<Event />} />
      <Route path="/event/:eventId/class/:className" element={<ClassCatalog />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/success" element={<Success />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Buyer Routes */}
      <Route
        path="/account"
        element={
          <BuyerRoute>
            <Account />
          </BuyerRoute>
        }
      />
      <Route
        path="/account/orders"
        element={
          <BuyerRoute>
            <AccountOrders />
          </BuyerRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/event-manager" element={<ProtectedRoute><EventManager /></ProtectedRoute>} />
      <Route path="/admin/events/create" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
      <Route path="/admin/events/:id/edit" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
      <Route path="/admin/photos/create" element={<ProtectedRoute><PhotoForm /></ProtectedRoute>} />
      <Route path="/admin/photos/:id/edit" element={<ProtectedRoute><PhotoForm /></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
      <Route path="/admin/balance" element={<ProtectedRoute><Balance /></ProtectedRoute>} />

      {/* Super Admin Only Routes */}
      <Route path="/admin/recap" element={<ProtectedRoute requireSuperAdmin><RecapList /></ProtectedRoute>} />
      <Route path="/admin/recap/:id" element={<ProtectedRoute requireSuperAdmin><RecapUpload /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requireSuperAdmin><AdminManagement /></ProtectedRoute>} />
      <Route path="/admin/pending-events" element={<ProtectedRoute requireSuperAdmin><PendingEvents /></ProtectedRoute>} />
      <Route path="/admin/sponsors" element={<ProtectedRoute requireSuperAdmin><SponsorManagement /></ProtectedRoute>} />
      <Route path="/admin/photographers" element={<ProtectedRoute requireSuperAdmin><PhotographerManagement /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requireSuperAdmin><Settings /></ProtectedRoute>} />
      <Route path="/admin/withdrawals" element={<ProtectedRoute requireSuperAdmin><WithdrawalRequests /></ProtectedRoute>} />
      <Route path="/admin/upcoming-events" element={<ProtectedRoute requireSuperAdmin><UpcomingEventList /></ProtectedRoute>} />
      <Route path="/admin/upcoming-events/new" element={<ProtectedRoute requireSuperAdmin><UpcomingEventForm /></ProtectedRoute>} />
      <Route path="/admin/upcoming-events/:id/edit" element={<ProtectedRoute requireSuperAdmin><UpcomingEventForm /></ProtectedRoute>} />
      <Route path="/admin/discounts" element={<ProtectedRoute requireSuperAdmin><DiscountManager /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
