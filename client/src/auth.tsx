import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from './api'
type U = { id: string; name: string; email: string } | null
const Ctx = createContext<any>(null)
export const useAuth = () => useContext(Ctx)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<U>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const submit = async (path: string, body: any) => { const { data } = await api.post(path, body); setUser(data.user) }
  const logout = async () => { await api.post('/auth/logout').catch(() => {}); setUser(null) }
  return <Ctx.Provider value={{ user, loading, login: (b: any) => submit('/auth/login', b), register: (b: any) => submit('/auth/register', b), logout }}>{children}</Ctx.Provider>
}
