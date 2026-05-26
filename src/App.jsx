import { useEffect } from 'react'
import {BrowserRouter,Navigate,Route,Routes,useLocation,useNavigate} from 'react-router-dom'
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
import AmbassadorVisiting from './pages/AmbassadorVisiting'
import AmbassadorCreative from './pages/AmbassadorCreative'
import AdminCategory from './pages/AdminCategory'
import AdminServices from './pages/admin/AdminServices'
import Employees from './pages/Employees'
import Form from './pages/Form'
import { ROLES } from './constants'

function LegacyLeadLoansRedirect() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const raw = location.search.slice(1)
    let id = ''
    if (raw.includes('=')) {
      const params = new URLSearchParams(location.search)
      id = (params.get('uid') || params.get('id') || '').trim()
    } else if (raw) {
      id = raw.split('&')[0].trim()
    }
    if (id) {
      navigate(`/lead/loan/${encodeURIComponent(id)}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [location.search, navigate])
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      Redirecting…
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/lead/loans" element={<LegacyLeadLoansRedirect />} />
          <Route path="/lead/loan/:id" element={<Form />} />

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
                <ProtectedRoute roles={[ROLES.ADMIN]} uid={'thy1xXKWoQXShRv3g31vuE180Uh1'}>
                  <AdminEliteAmbassador />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/ambassador"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]} uid={'thy1xXKWoQXShRv3g31vuE180Uh1'}>
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
              path="admin/category"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/services"
              element={
                <ProtectedRoute roles={[ROLES.ADMIN]}>
                  <AdminServices />
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
                <ProtectedRoute roles={[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES,ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR]}>
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
            <Route
              path="visiting-card"
              element={
                <ProtectedRoute roles={[ROLES.MANAGEMENT,ROLES.PROCESS,ROLES.SALES,ROLES.EMPLOYEES,ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR]}>
                  <AmbassadorVisiting />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales-material"
              element={
                <ProtectedRoute roles={[ROLES.ELITE_AMBASSADOR,ROLES.AMBASSADOR,ROLES.MANAGEMENT,ROLES.SALES,ROLES.PROCESS,ROLES.EMPLOYEES]}>
                  <AmbassadorCreative />
                </ProtectedRoute>
              }
            />
            <Route
              path="employee-dashboard"
              element={
                <ProtectedRoute roles={[ROLES.EMPLOYEES]}>
                  <Employees />
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
