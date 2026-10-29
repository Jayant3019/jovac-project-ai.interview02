import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { api, errMsg } from '../api'
import { useAuth } from '../auth'
import { Btn, Card, ErrorBox, Skeleton, Stat } from '../ui'
export default function Dashboard() {
  const { user } = useAuth(); const [d, setD] = useState<any>(null); const [err, setErr] = useState('')
  useEffect(() => { api.get('/analytics/overview').then(r => setD(r.data)).catch(e => setErr(errMsg(e))) }, [])
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1><Link to="/setup"><Btn>Start interview</Btn></Link></div>
    <ErrorBox msg={err} />{!d && !err && <Skeleton h="h-64" />}
    {d && <>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Interviews completed" value={d.completed} /><Stat label="Average score" value={d.completed ? d.avgScore : '–'} /><Stat label="Practice time (min)" value={d.totalMinutes} /></div>
      {d.completed === 0 ? <Card><p className="text-slate-400">No completed interviews yet. Start your first one to see your score trend and skill breakdown.</p></Card> :
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><h2 className="mb-3 font-semibold">Score trend</h2><div className="h-60"><ResponsiveContainer><LineChart data={d.trend.map((t: any) => ({ ...t, date: new Date(t.date).toLocaleDateString() }))}>
            <CartesianGrid stroke="#ffffff10" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={12} /><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ background: '#11182A', border: 0 }} /><Line dataKey="score" stroke="#8B5CF6" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Card>
          <Card><h2 className="mb-3 font-semibold">Skills</h2><div className="h-60"><ResponsiveContainer><BarChart data={d.skills}><CartesianGrid stroke="#ffffff10" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{ background: '#11182A', border: 0 }} /><Bar dataKey="score" fill="#3B82F6" radius={6} /></BarChart></ResponsiveContainer></div></Card></div>}</>}
  </div>
}
