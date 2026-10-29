import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, FileText, Mic, Volume2 } from 'lucide-react'
import { Logo } from '../App'
import { Btn, Card } from '../ui'
const features = [[Volume2, 'Spoken questions', 'The interviewer reads each question aloud, one at a time.'], [Mic, 'Live transcription', 'Answer by voice and edit the transcript before you submit.'],
  [FileText, 'Written feedback', 'Every answer gets a score, strengths, gaps and a stronger sample answer.'], [BarChart3, 'Progress tracking', 'See scores by skill and watch your trend across sessions.']] as const
const roles = ['Java Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst', 'AI/ML Engineer']
const faq = [['Does it record my audio?', 'No. Speech is converted to text by your browser. Only the text you submit is saved.'], ['Which browsers work?', 'Chrome and Edge support voice input. In other browsers you can type your answers.'],
  ['Who sees my answers?', 'Your answers are sent to the configured AI provider for evaluation and stored privately in your account.']]
export default function Landing() {
  return <div>
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"><Logo />
      <nav className="flex items-center gap-2"><a href="#features" className="hidden px-3 text-sm text-slate-400 hover:text-white sm:block">Features</a><a href="#faq" className="hidden px-3 text-sm text-slate-400 hover:text-white sm:block">FAQ</a>
        <Link to="/login"><Btn variant="ghost">Log in</Btn></Link></nav></header>
    <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold tracking-tight sm:text-6xl">Practice Smarter. Interview Better.</motion.h1>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">Answer out loud to an AI interviewer that asks one question at a time, listens, and tells you exactly what to improve.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/register"><Btn className="px-6 py-3">Start free interview</Btn></Link><a href="#features"><Btn variant="ghost" className="px-6 py-3">Explore features</Btn></a></div>
      <Card className="mx-auto mt-14 max-w-3xl text-left"><div className="flex items-end gap-1 pb-4">{Array.from({ length: 28 }).map((_, i) =>
        <motion.span key={i} className="w-1.5 rounded bg-violet" animate={{ height: [6, 10 + ((i * 7) % 28), 6] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.04 }} />)}</div>
        <p className="font-semibold">Explain the difference between an interface and an abstract class in Java.</p><p className="mt-2 text-sm text-slate-400">Your spoken answer appears here as you talk.</p></Card></section>
    <section id="features" className="mx-auto max-w-6xl px-4 py-16"><h2 className="text-3xl font-bold">What you get</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(([I, t, d]) => <Card key={t}><I className="text-violet" /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></Card>)}</div></section>
    <section className="mx-auto max-w-6xl px-4 py-16"><h2 className="text-3xl font-bold">How it works</h2>
      <ol className="mt-8 grid gap-4 sm:grid-cols-3">{['Choose a role, level and interview type', 'Listen to each question and answer by voice', 'Review your scored report and practise weak topics'].map((t, i) =>
        <Card key={t}><span className="text-sm text-azure">Step {i + 1}</span><p className="mt-2 font-medium">{t}</p></Card>)}</ol></section>
    <section className="mx-auto max-w-6xl px-4 py-16"><h2 className="text-3xl font-bold">Supported roles</h2><div className="mt-6 flex flex-wrap gap-2">{roles.map(r => <span key={r} className="rounded-full bg-white/5 px-4 py-2 text-sm">{r}</span>)}</div></section>
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16"><h2 className="text-3xl font-bold">Questions</h2>
      <div className="mt-6 space-y-3">{faq.map(([q, a]) => <details key={q} className="rounded-2xl bg-card p-5"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-slate-400">{a}</p></details>)}</div></section>
    <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">© InterviewAI. Your answers are stored privately in your account.</footer></div>
}
