import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import HomeRedirect from './pages/HomeRedirect'
import ManagementBoard from './pages/ManagementBoard'
import SalesBoard from './pages/SalesBoard'
import ProcessBoard from './pages/ProcessBoard'
import AdminUsers from './pages/AdminUsers'
import AdminProducts from './pages/AdminProducts'
import AdminEliteAmbassador from './pages/AdminEliteAmbassador'
import AdminAmbassador from './pages/AdminAmbassador'
import AdminStatuses from './pages/AdminStatuses'
import EliteAmbassadorBoard from './pages/EliteAmbassadorBoard'
import AmbassadorBoard from './pages/AmbassadorBoard'
import AmbassadorsList from './pages/AmbassadorsList'
import Certificate from './pages/Certificate'
import AdminCreative from './pages/AdminCreative'
import { ROLES } from './constants'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/products"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/elite-ambassador"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminEliteAmbassador />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/ambassador"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminAmbassador />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/statuses"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminStatuses />
                </ProtectedRoute>
              }
            />
            <Route
              path="management"
              element={
                <ProtectedRoute roles={[ROLES.MANAGEMENT]}>
                  <ManagementBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales"
              element={
                <ProtectedRoute roles={[ROLES.SALES]}>
                  <SalesBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="process"
              element={
                <ProtectedRoute roles={[ROLES.PROCESS]}>
                  <ProcessBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="elite-ambassador"
              element={
                <ProtectedRoute roles={[ROLES.ELITE_AMBASSADOR]}>
                  <EliteAmbassadorBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="ambassador"
              element={
                <ProtectedRoute roles={[ROLES.AMBASSADOR]}>
                  <AmbassadorBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="ambassadors-list"
              element={
                <ProtectedRoute roles={[ROLES.PROCESS,ROLES.SALES,ROLES.ELITE_AMBASSADOR,ROLES.MANAGEMENT]}>
                  <AmbassadorsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="certificate"
              element={
                <ProtectedRoute roles={[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR]}>
                  <Certificate />
                </ProtectedRoute>
              }
            />
            <Route
              path="creative"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminCreative />
                </ProtectedRoute>
              }
            />
            <Route path="partner" element={<Navigate to="/elite-ambassador" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
