import { FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { errMsg } from '../api'
import { Btn, Card, ErrorBox, Field, inputCls } from '../ui'
import { Logo } from '../App'
export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth(); const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />
  const go = async (e: FormEvent) => { e.preventDefault(); setErr(''); setBusy(true)
    try { await (mode === 'login' ? login({ email: f.email, password: f.password }) : register(f)); nav('/dashboard') } catch (x) { setErr(errMsg(x)) } finally { setBusy(false) } }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return <div className="grid min-h-screen place-items-center px-4"><div className="w-full max-w-sm space-y-6"><div className="flex justify-center"><Logo /></div>
    <Card><form onSubmit={go} className="space-y-4"><h1 className="text-xl font-bold">{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      {mode === 'register' && <Field label="Name"><input className={inputCls} value={f.name} onChange={set('name')} required minLength={2} /></Field>}
      <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={set('email')} required /></Field>
      <Field label="Password (8+ characters)"><input type="password" className={inputCls} value={f.password} onChange={set('password')} required minLength={8} /></Field>
      <ErrorBox msg={err} /><Btn disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</Btn></form></Card>
    <p className="text-center text-sm text-slate-400">{mode === 'login' ? <>New here? <Link className="text-violet" to="/register">Create an account</Link></> : <>Have an account? <Link className="text-violet" to="/login">Log in</Link></>}</p></div></div>
}
