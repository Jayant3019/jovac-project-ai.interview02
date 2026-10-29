import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api'
import { Btn, Card, ErrorBox, Field, inputCls } from '../ui'
const opt = {
  jobRole: ['Java Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst', 'AI/ML Engineer'],
  experienceLevel: ['Beginner', 'Intermediate', 'Advanced'], interviewType: ['HR', 'Technical', 'Coding', 'Behavioral', 'Mixed'],
  difficulty: ['Easy', 'Medium', 'Hard'], language: ['English', 'Hinglish'], duration: [5, 10, 15, 20, 30] }
const labels: Record<string, string> = { jobRole: 'Job role', experienceLevel: 'Experience level', interviewType: 'Interview type', difficulty: 'Difficulty', language: 'Language', duration: 'Duration (minutes)' }
export default function Setup() {
  const nav = useNavigate(); const pre = (useLocation().state || {}) as any
  const [f, setF] = useState<any>({ jobRole: 'Software Engineer', experienceLevel: 'Beginner', interviewType: 'Mixed', difficulty: 'Medium', language: 'English', duration: 10, questionCount: 5, jobDescription: '', resumeText: '', ...pre })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async (e: FormEvent) => { e.preventDefault(); setErr(''); setBusy(true)
    try { const { data } = await api.post('/interviews', { ...f, duration: +f.duration, questionCount: +f.questionCount }); nav(`/interview/${data.id}`) } catch (x) { setErr(errMsg(x)); setBusy(false) } }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return <form onSubmit={go} className="mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-bold">Set up your interview</h1>
    <Card className="grid gap-4 sm:grid-cols-2">{Object.entries(opt).map(([k, v]) => <Field key={k} label={labels[k]}><select className={inputCls} value={f[k]} onChange={set(k)}>{v.map(o => <option key={o}>{o}</option>)}</select></Field>)}
      <Field label="Number of questions (1–15)"><input type="number" min={1} max={15} required className={inputCls} value={f.questionCount} onChange={set('questionCount')} /></Field></Card>
    <Card className="space-y-4"><Field label="Job description (optional)"><textarea rows={4} maxLength={3000} className={inputCls} value={f.jobDescription} onChange={set('jobDescription')} /></Field>
      <Field label="Resume text (optional, paste plain text)"><textarea rows={4} maxLength={6000} className={inputCls} value={f.resumeText} onChange={set('resumeText')} /></Field>
      <p className="text-xs text-slate-500">Text you enter is sent to the AI provider to personalise questions.</p></Card>
    <ErrorBox msg={err} /><Btn disabled={busy}>{busy ? 'Creating…' : 'Create interview'}</Btn></form>
}
