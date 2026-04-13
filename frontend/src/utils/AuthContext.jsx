import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crm_user')) } catch { return null }
  })

  function login(userData, token) {
    localStorage.setItem('crm_user', JSON.stringify(userData))
    localStorage.setItem('crm_token', token)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('crm_user')
    localStorage.removeItem('crm_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.perfil === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
