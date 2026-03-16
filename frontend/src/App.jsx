import { Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import Dashboard from './pages/Dashboard'
import ApiCatalog from './pages/ApiCatalog'
import ApiDetails from './pages/ApiDetails'
import ApiKeys from './pages/ApiKeys'
import Subscriptions from './pages/Subscriptions'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="apis" element={<ApiCatalog />} />
        <Route path="apis/:slug" element={<ApiDetails />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App
