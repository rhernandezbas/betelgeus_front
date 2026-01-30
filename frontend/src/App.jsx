import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import OperatorLayout from './components/OperatorLayout'
import Dashboard from './pages/Dashboard'
import OperatorsManagement from './pages/OperatorsManagement'
import Configuration from './pages/Configuration'
import AuditLogs from './pages/AuditLogs'
import ReassignmentHistory from './pages/ReassignmentHistory'
import AuditTickets from './pages/AuditTickets'
import Messages from './pages/Messages'
import Metrics from './pages/Metrics'
import Users from './pages/Users'
import LogsViewer from './pages/LogsViewer'
import OperatorView from './pages/OperatorView'
import DeviceAnalysis from './pages/DeviceAnalysis'
import Login from './pages/Login'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { PermissionRoute } from './components/PermissionRoute'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Rutas protegidas para admin */}
        <Route path="/" element={
          <ProtectedRoute requiredRole="admin">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="operators-management" element={<OperatorsManagement />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="messages" element={<Messages />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="logs" element={<LogsViewer />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="audit-tickets" element={<AuditTickets />} />
          <Route path="reassignment-history" element={<ReassignmentHistory />} />
          <Route path="device-analysis" element={
            <PermissionRoute requiredPermission="can_access_device_analysis">
              <DeviceAnalysis />
            </PermissionRoute>
          } />
        </Route>

        {/* Rutas protegidas para operadores */}
        <Route path="/operator-view" element={
          <ProtectedRoute requiredRole="operator">
            <OperatorLayout />
          </ProtectedRoute>
        }>
          <Route index element={
            <PermissionRoute requiredPermission="can_access_operator_view">
              <OperatorView />
            </PermissionRoute>
          } />
          <Route path="device-analysis" element={
            <PermissionRoute requiredPermission="can_access_device_analysis">
              <DeviceAnalysis />
            </PermissionRoute>
          } />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App
