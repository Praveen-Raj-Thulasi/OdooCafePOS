import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import FloorPlan from './components/FloorPlan';
import OrderView from './components/OrderView';
import KDS from './components/KDS';
import ServantPortal from './components/ServantPortal';
import CustomerMenu from './components/CustomerMenu';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SharedLayout from './components/SharedLayout';
import Register from './components/Register';
import Reports from './components/Reports';

function App() {
  return (
    <SocketProvider>
      <NotificationProvider>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/s/:tableToken" element={<CustomerMenu />} />

              {/* Protected Routes inside SharedLayout */}
              <Route element={<SharedLayout />}>
                
                {/* Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/reports" element={<Reports />} />
                </Route>

                {/* Admin + Cashier */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Cashier']} />}>
                  <Route path="/floor" element={<FloorPlan />} />
                  <Route path="/order/:tableId" element={<OrderView />} />
                </Route>

                {/* Admin + Kitchen */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Kitchen']} />}>
                  <Route path="/kds" element={<KDS />} />
                </Route>

                {/* Admin + Servant */}
                <Route element={<ProtectedRoute allowedRoles={['Admin', 'Servant']} />}>
                  <Route path="/servant" element={<ServantPortal />} />
                </Route>

              </Route>

              {/* Catch All Redirect */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default App;
