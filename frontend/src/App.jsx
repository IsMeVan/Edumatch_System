import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Survey from './pages/Survey'
import Results from './pages/Results'
import History from './pages/History'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import SchoolDetail from './pages/SchoolDetail'
import Schools from './pages/Schools'
import About from './pages/About'
import ChatBubble from './components/ChatBubble'
import ChatHistory from './pages/ChatHistory'
import MyFavorites from './pages/MyFavorites'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSchools from './pages/admin/AdminSchools'
import AdminMajors from './pages/admin/AdminMajors'
import AdminReports from './pages/admin/AdminReports'


function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }
  
  return token ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, token, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }
  
  if (!token) return <Navigate to="/login" />
  if (!user?.is_admin) return <Navigate to="/schools" />
  return children
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/school/:id" element={<SchoolDetail />} />
        <Route path="/schools" element={<Schools />} />
        <Route path="/survey" element={<ProtectedRoute><Survey /></ProtectedRoute>} />
        <Route path="/results/:surveyId" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/chat-history" element={<ProtectedRoute><ChatHistory /></ProtectedRoute>} />
        <Route path="/my-favorites" element={<ProtectedRoute><MyFavorites /></ProtectedRoute>} />
        
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="schools" element={<AdminSchools />} />
          <Route path="majors" element={<AdminMajors />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Routes>

      <ChatBubble />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}