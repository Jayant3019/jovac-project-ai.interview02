import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api'
import { Btn, Card, ErrorBox, Skeleton } from '../ui'
export default function History() {
  const [l, setL] = useState<any[] | null>(null); const [err, setErr] = useState('')
  useEffect(() => { api.get('/interviews').then(r => setL(r.data.interviews)).catch(e => setErr(errMsg(e))) }, [])
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Interview history</h1><ErrorBox msg={err} />{!l && !err && <Skeleton h="h-40" />}
    {l?.length === 0 && <Card><p className="text-slate-400">No interviews yet.</p><Link to="/setup"><Btn className="mt-3">Start one</Btn></Link></Card>}
    {l?.map(i => <Card key={i.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{i.jobRole}</p>
      <p className="text-sm text-slate-400">{i.interviewType} · {i.difficulty} · {new Date(i.startedAt).toLocaleString()}</p></div>
      <div className="flex items-center gap-3"><span className="rounded-full bg-white/5 px-3 py-1 text-sm">{i.status === 'completed' ? `Score ${i.score}` : 'In progress'}</span>
        <Link to={i.status === 'completed' ? `/report/${i.id}` : `/interview/${i.id}`}><Btn variant="ghost">{i.status === 'completed' ? 'View report' : 'Resume'}</Btn></Link></div></Card>)}</div>
}
