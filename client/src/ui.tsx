import { ReactNode, ButtonHTMLAttributes } from 'react'
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`rounded-2xl border border-white/5 bg-card p-5 ${className}`}>{children}</div>
export const Btn = ({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) =>
  <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
    variant === 'primary' ? 'bg-gradient-to-r from-violet to-azure hover:brightness-110' : variant === 'danger' ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25' : 'bg-white/5 hover:bg-white/10'} ${className}`} />
export const Field = ({ label, children }: { label: string; children: ReactNode }) =>
  <label className="block text-sm text-slate-400"><span className="mb-1.5 block">{label}</span>{children}</label>
export const inputCls = 'w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:border-violet'
export const ErrorBox = ({ msg }: { msg: string }) => msg ? <p role="alert" className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{msg}</p> : null
export const Skeleton = ({ h = 'h-24' }: { h?: string }) => <div className={`${h} animate-pulse rounded-2xl bg-white/5`} />
export const Stat = ({ label, value }: { label: string; value: string | number }) =>
  <Card><p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></Card>
