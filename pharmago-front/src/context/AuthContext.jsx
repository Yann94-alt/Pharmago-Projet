import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pharmago_user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('pharmago_token'))
  const [loading, setLoading] = useState(true)

  const persist = (token, user) => {
    if (token) localStorage.setItem('pharmago_token', token)
    if (user) localStorage.setItem('pharmago_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const login = async (email, password) => {
  const { data } = await api.post('/login', { email, password })

  localStorage.setItem('pharmago_token', data.token)
  setToken(data.token)

  const me = await api.get('/me')

  persist(data.token, me.data.user)

  return me.data.user
}

  const register = async (payload) => {
    const { data } = await api.post('/register', payload)
    persist(data.token, data.user)
    return data.user
  }

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch (e) {
      // on nettoie quand même localement
    }
    localStorage.removeItem('pharmago_token')
    localStorage.removeItem('pharmago_user')
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/me')
      setUser(data.user)
      localStorage.setItem('pharmago_user', JSON.stringify(data.user))
    } catch (e) {
      // token invalide -> géré par l'intercepteur axios
    }
  }, [])

  useEffect(() => {
    if (token) {
      refreshMe().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isPatient: user?.role === 'patient',
    isPharmacie: user?.role === 'pharmacie',
    loading,
    login,
    register,
    logout,
    refreshMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
