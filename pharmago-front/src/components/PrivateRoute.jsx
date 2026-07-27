import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function PrivateRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <Loader label="Vérification de la session…" />

  if (!isAuthenticated) return <Navigate to="/connexion" replace />

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}
