import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/store'

import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ReportIssue from './pages/ReportIssue'
import IssueDetails from './pages/IssueDetails'
import MapView from './pages/MapView'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore()
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// Citizens only — admins are redirected to their dashboard
const CitizenRoute = ({ children }) => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  const { user } = useAuthStore()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {user && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

          {/* Root: logged-out → landing, logged-in → dashboard */}
          <Route path="/" element={user ? <PrivateRoute><Dashboard /></PrivateRoute> : <LandingPage />} />

          {/* Citizen only — admin redirected to /admin */}
          <Route path="/report" element={<CitizenRoute><ReportIssue /></CitizenRoute>} />

          {/* Any authenticated user */}
          <Route path="/issues/:id" element={<PrivateRoute><IssueDetails /></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />

          {/* Admin only */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      {user && <Footer />}
    </div>
  )
}