import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return admin ? children : <Navigate to="/admin/login" replace />
}

export default ProtectedRoute