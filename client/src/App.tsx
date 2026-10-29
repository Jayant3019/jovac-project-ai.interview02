import { Link, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { useAuth } from './auth'
import { Btn, Skeleton } from './ui'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Setup from './pages/Setup'
import Room from './pages/Room'
import Report from './pages/Report'
import History from './pages/History'

export const Logo = () => <Link to="/" className="flex items-center gap-2 text-lg font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-azure"><Mic size={16} /></span>InterviewAI</Link>

function Shell() {
  const { user, loading, logout } = useAuth()
  if (loading) return <div className="mx-auto max-w-4xl space-y-4 p-8"><Skeleton h="h-12" /><Skeleton h="h-64" /></div>
  if (!user) return <Navigate to="/login" replace />
  const link = ({ isActive }: { isActive: boolean }) => `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`
  return <div className="min-h-screen">
    <header className="sticky top-0 z-10 border-b border-white/5 bg-ink/90 backdrop-blur"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
      <Logo /><nav className="flex items-center gap-1"><NavLink to="/dashboard" className={link}>Dashboard</NavLink><NavLink to="/setup" className={link}>New interview</NavLink>
        <NavLink to="/history" className={link}>History</NavLink><Btn variant="ghost" onClick={logout}>Log out</Btn></nav></div></header>
    <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main></div>
}
const NotFound = () => <div className="grid min-h-screen place-items-center text-center"><div><p className="text-6xl font-extrabold">404</p>
  <p className="mt-2 text-slate-400">This page doesn't exist.</p><Link to="/"><Btn className="mt-6">Back to home</Btn></Link></div></div>

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Shell />}>
      <Route path="/dashboard" element={<Dashboard />} /><Route path="/setup" element={<Setup />} />
      <Route path="/interview/:id" element={<Room />} /><Route path="/report/:id" element={<Report />} /><Route path="/history" element={<History />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
}
