import { Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRedirect from './components/RoleRedirect'
import RoleRoute from './components/RoleRoute'
import Dashboard from './pages/Dashboard'
import ApiCatalog from './pages/ApiCatalog'
import ApiDetails from './pages/ApiDetails'
import ApiKeys from './pages/ApiKeys'
import Subscriptions from './pages/Subscriptions'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import ApiTester from './pages/ApiTester'
import Usage from './pages/Usage'
import RequestLogs from './pages/RequestLogs'
import Login from './pages/Login'
import Register from './pages/Register'
import ProviderDashboard from './pages/provider/Dashboard'
import MyApis from './pages/provider/MyApis'
import CreateApi from './pages/provider/CreateApi'
import EditApi from './pages/provider/EditApi'
import ProviderAnalytics from './pages/provider/Analytics'

import ProviderHealth from './pages/provider/Health.jsx'
import UserProfilePage from './pages/UserProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        <Route
          path="dashboard"
          element={
            <RoleRoute role="API_CONSUMER">
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="apis"
          element={
            <RoleRoute role="API_CONSUMER">
              <ApiCatalog />
            </RoleRoute>
          }
        />
        <Route
          path="apis/:slug"
          element={
            <RoleRoute role="API_CONSUMER">
              <ApiDetails />
            </RoleRoute>
          }
        />
        <Route
          path="api-keys"
          element={
            <RoleRoute role="API_CONSUMER">
              <ApiKeys />
            </RoleRoute>
          }
        />
        <Route
          path="tester"
          element={
            <RoleRoute role="API_CONSUMER">
              <ApiTester />
            </RoleRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <RoleRoute role="API_CONSUMER">
              <Subscriptions />
            </RoleRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <RoleRoute role="API_CONSUMER">
              <Analytics />
            </RoleRoute>
          }
        />
        <Route
          path="usage"
          element={
            <RoleRoute role="API_CONSUMER">
              <Usage />
            </RoleRoute>
          }
        />
        <Route
          path="request-logs"
          element={
            <RoleRoute role="API_CONSUMER">
              <RequestLogs />
            </RoleRoute>
          }
        />
        <Route
          path="alerts"
          element={
            <RoleRoute role="API_CONSUMER">
              <Alerts />
            </RoleRoute>
          }
        />

        <Route path="provider/dashboard" element={<ProviderDashboard />} />
        <Route path="/profile/:id" element={<UserProfilePage />} />
        <Route
          path="settings"
          element={
            <RoleRoute role="API_CONSUMER">
              <Settings />
            </RoleRoute>
          }
        />

        <Route
          path="provider/dashboard"
          element={
            <RoleRoute role="API_PROVIDER">
              <ProviderDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="provider/apis"
          element={
            <RoleRoute role="API_PROVIDER">
              <MyApis />
            </RoleRoute>
          }
        />
        <Route
          path="provider/apis/edit/:id"
          element={
            <RoleRoute role="API_PROVIDER">
              <EditApi />
            </RoleRoute>
          }
        />
        <Route
          path="provider/create"
          element={
            <RoleRoute role="API_PROVIDER">
              <CreateApi />
            </RoleRoute>
          }
        />
        <Route
          path="provider/analytics"
          element={
            <RoleRoute role="API_PROVIDER">
              <ProviderAnalytics />
            </RoleRoute>
          }
        />
        <Route
          path="provider/health"
          element={
            <RoleRoute role="API_PROVIDER">
              <ProviderHealth />
            </RoleRoute>
          }
        />

        <Route path="*" element={<RoleRedirect />} />
      </Route>
    </Routes>
  )
}

export default App
