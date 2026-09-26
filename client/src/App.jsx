import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Locations from './pages/Locations'
import Receipts from './pages/Receipts'
import Deliveries from './pages/Deliveries'
import InternalTransfers from './pages/InternalTransfers'
import Adjustments from './pages/Adjustments'
import MoveHistory from './pages/MoveHistory'
import './App.css'

function GuestRoute({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : children
}

function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Page not found</p>
      <h1>That location isn’t in the inventory.</h1>
      <Link className="text-link" to="/dashboard">Return to dashboard</Link>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/transfers" element={<InternalTransfers />} />
        <Route path="/adjustments" element={<Adjustments />} />
        <Route path="/ledger" element={<MoveHistory />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
