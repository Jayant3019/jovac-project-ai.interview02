import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, errMsg } from '../api'
import { Btn, Card, ErrorBox, Skeleton, Stat } from '../ui'
export default function Report() {
  const { id } = useParams(); const nav = useNavigate(); const [iv, setIv] = useState<any>(null); const [err, setErr] = useState('')
  useEffect(() => { api.get(`/interviews/${id}`).then(async r => { let i = r.data.interview
    if (!i.report) i = { ...i, report: (await api.post(`/interviews/${id}/finish`)).data.report }; setIv(i) }).catch(e => setErr(errMsg(e))) }, [id])
  if (err) return <ErrorBox msg={err} />; if (!iv) return <Skeleton h="h-96" />
  const r = iv.report; const answered = iv.qa.filter((q: any) => q.evaluation)
  const weak = r.weakest.map((w: any) => w.topic)
  return <div className="space-y-6"><h1 className="text-2xl font-bold">{iv.jobRole} report</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Overall" value={r.overall} /><Stat label="Technical" value={r.technical} /><Stat label="Communication" value={r.communication} /><Stat label="Structure" value={r.structure} /></div>
    <p className="text-sm text-slate-400">{r.completed} of {r.attempted} questions answered · {r.durationMin} min</p>
    {answered.length > 0 && <Card><h2 className="mb-3 font-semibold">Score by question</h2><div className="h-56"><ResponsiveContainer><BarChart data={answered.map((q: any, i: number) => ({ name: `Q${i + 1}`, score: q.evaluation.score }))}>
      <CartesianGrid stroke="#ffffff10" /><XAxis dataKey="name" stroke="#94a3b8" /><YAxis domain={[0, 100]} stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#11182A', border: 0 }} /><Bar dataKey="score" fill="#8B5CF6" radius={6} /></BarChart></ResponsiveContainer></div></Card>}
    <div className="grid gap-4 md:grid-cols-2"><Card><h2 className="font-semibold">Strongest topics</h2>{r.strongest.map((t: any) => <p key={t.topic} className="mt-1 text-sm text-slate-300">{t.topic}: {t.score}</p>)}</Card>
      <Card><h2 className="font-semibold">Weakest topics</h2>{r.weakest.map((t: any) => <p key={t.topic} className="mt-1 text-sm text-slate-300">{t.topic}: {t.score}</p>)}</Card></div>
    {r.recommendations.length > 0 && <Card><h2 className="font-semibold">Study recommendations</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">{r.recommendations.map((x: string) => <li key={x}>{x}</li>)}</ul></Card>}
    {answered.map((q: any, i: number) => <Card key={q._id} className="space-y-2"><p className="font-semibold">Q{i + 1}. {q.question} <span className="text-violet">({q.evaluation.score})</span></p>
      <p className="text-sm text-slate-400">Your answer: {q.answer}</p><p className="text-sm"><b>Strengths:</b> {q.evaluation.strengths.join('; ')}</p><p className="text-sm"><b>Weaknesses:</b> {q.evaluation.weaknesses.join('; ')}</p>
      <p className="text-sm"><b>Better answer:</b> {q.evaluation.betterAnswer}</p></Card>)}
    <div className="flex flex-wrap gap-3"><Btn onClick={() => nav('/setup', { state: { jobRole: iv.jobRole, experienceLevel: iv.experienceLevel, interviewType: iv.interviewType, difficulty: iv.difficulty, language: iv.language } })}>Retry interview</Btn>
      <Btn variant="ghost" disabled={!weak.length} onClick={() => nav('/setup', { state: { jobRole: iv.jobRole, jobDescription: `Focus on weak topics: ${weak.join(', ')}` } })}>Practice weak topics</Btn>
      <Link to="/history"><Btn variant="ghost">View history</Btn></Link><Link to="/dashboard"><Btn variant="ghost">Dashboard</Btn></Link></div></div>
}
