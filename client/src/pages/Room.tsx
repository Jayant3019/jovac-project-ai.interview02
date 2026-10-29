import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, MicOff, RotateCcw, SkipForward, Square, Volume2 } from 'lucide-react'
import { api, errMsg } from '../api'
import { Btn, Card, ErrorBox, Skeleton } from '../ui'
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
type Phase = 'ready' | 'speaking' | 'listening' | 'evaluating' | 'feedback' | 'next' | 'done'
const label: Record<Phase, string> = { ready: 'Ready', speaking: 'AI speaking', listening: 'Listening', evaluating: 'Evaluating answer', feedback: 'Feedback ready', next: 'Next question', done: 'Interview completed' }
const recErr: Record<string, string> = { 'not-allowed': 'Microphone permission was denied. Allow microphone access in your browser, or type your answer.', 'service-not-allowed': 'Speech recognition is blocked in this browser. Type your answer instead.',
  'no-speech': 'No speech detected. Try again or type your answer.', 'audio-capture': 'No microphone found.', network: 'Speech recognition needs an internet connection.' }
export default function Room() {
  const { id } = useParams(); const nav = useNavigate()
  const [iv, setIv] = useState<any>(null); const [q, setQ] = useState<any>(null); const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('ready'); const [answer, setAnswer] = useState(''); const [interim, setInterim] = useState('')
  const [fb, setFb] = useState<any>(null); const [err, setErr] = useState(''); const [left, setLeft] = useState(0)
  const rec = useRef<any>(null); const finishing = useRef(false)
  const lang = iv?.language === 'Hinglish' ? 'en-IN' : 'en-US'

  useEffect(() => { api.get(`/interviews/${id}`).then(r => { if (r.data.interview.status === 'completed') nav(`/report/${id}`, { replace: true }); else setIv(r.data.interview) }).catch(e => setErr(errMsg(e))) }, [id])
  useEffect(() => () => { rec.current?.abort?.(); window.speechSynthesis?.cancel() }, [])
  useEffect(() => { if (!iv || !started) return
    const t = setInterval(() => { const s = iv.duration * 60 - Math.floor((Date.now() - new Date(iv.startedAt).getTime()) / 1000); setLeft(Math.max(0, s)); if (s <= 0) { clearInterval(t); finish() } }, 1000); return () => clearInterval(t) }, [iv, started])

  const stopListen = () => { rec.current?.stop?.(); rec.current = null }
  const stopSpeak = () => { window.speechSynthesis?.cancel(); setPhase(p => p === 'speaking' ? 'ready' : p) }
  const speak = (t: string) => { stopListen(); const s = window.speechSynthesis
    if (!s) { setErr('Speech output is not supported here. Read the question on screen.'); return }
    s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang
    u.onstart = () => setPhase('speaking'); u.onend = () => setPhase(p => p === 'speaking' ? 'ready' : p)
    u.onerror = () => setPhase(p => p === 'speaking' ? 'ready' : p); s.speak(u) }
  const startListen = () => { setErr('')
    if (!SR) { setErr('Voice input is not supported in this browser. Use Chrome or Edge, or type your answer below.'); return }
    window.speechSynthesis?.cancel(); const r = new SR(); r.lang = lang; r.continuous = true; r.interimResults = true
    r.onresult = (e: any) => { let fin = '', tmp = ''; for (let k = e.resultIndex; k < e.results.length; k++) { const t = e.results[k][0].transcript; if (e.results[k].isFinal) fin += t; else tmp += t }
      if (fin) setAnswer(a => (a + ' ' + fin).trim()); setInterim(tmp) }
    r.onerror = (e: any) => setErr(recErr[e.error] || `Recognition error: ${e.error}`)
    r.onend = () => { setInterim(''); setPhase(p => p === 'listening' ? 'ready' : p) }
    try { r.start(); rec.current = r; setPhase('listening') } catch { setErr('Could not start the microphone. Try again.') } }

  const loadNext = async () => { setErr(''); setFb(null); setAnswer(''); setInterim(''); setPhase('next')
    try { const { data } = await api.post(`/interviews/${id}/next-question`); if (data.done) return finish(); setQ(data); setPhase('ready'); speak(data.question) }
    catch (e) { setErr(errMsg(e)); setPhase('ready') } }
  const submit = async (skip = false) => { if (!q) return; stopListen(); window.speechSynthesis?.cancel(); setErr('')
    if (!skip && !answer.trim()) { setErr('Your answer is empty. Speak or type something first.'); return }
    setPhase('evaluating')
    try { const { data } = await api.post(`/interviews/${id}/answers`, { index: q.index, answer, skip }); if (skip) return loadNext(); setFb(data.evaluation); setPhase('feedback') }
    catch (e) { setErr(errMsg(e)); setPhase('ready') } }
  const finish = async () => { if (finishing.current) return; finishing.current = true; stopListen(); window.speechSynthesis?.cancel(); setPhase('done')
    try { await api.post(`/interviews/${id}/finish`); nav(`/report/${id}`) } catch (e) { setErr(errMsg(e)); finishing.current = false } }

  if (!iv) return err ? <ErrorBox msg={err} /> : <Skeleton h="h-96" />
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  if (!started) return <Card className="mx-auto max-w-lg space-y-4 text-center"><h1 className="text-xl font-bold">{iv.jobRole} interview</h1>
    <p className="text-sm text-slate-400">{iv.questionCount} questions · {iv.duration} min. Speech is converted to text by your browser's speech service; no audio is saved by InterviewAI.</p>
    <ErrorBox msg={err} /><Btn className="w-full" onClick={() => { setStarted(true); loadNext() }}>Start interview</Btn></Card>
  const busy = phase === 'evaluating' || phase === 'next' || phase === 'done'
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-violet/20 px-3 py-1 text-sm text-violet" aria-live="polite">{label[phase]}</span>
      <span className="text-sm text-slate-400">Time left {mm}</span><Btn variant="danger" onClick={finish} disabled={phase === 'done'}>End interview</Btn></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4"><div className="h-2 overflow-hidden rounded bg-white/10"><div className="h-full bg-gradient-to-r from-violet to-azure transition-all" style={{ width: `${q ? ((q.index + (fb ? 1 : 0)) / iv.questionCount) * 100 : 0}%` }} /></div>
        <p className="text-sm text-slate-400">Question {q ? q.index + 1 : '–'} of {iv.questionCount}{q ? ` · ${q.topic}` : ''}</p>
        <p className="min-h-[5rem] text-xl font-semibold">{q?.question ?? 'Preparing your first question…'}</p>
        <div className="flex h-10 items-end gap-1" aria-hidden>{Array.from({ length: 24 }).map((_, i) => <motion.span key={i} className="w-1.5 rounded bg-azure" animate={{ height: phase === 'speaking' ? [4, 8 + ((i * 11) % 30), 4] : 4 }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.03 }} />)}</div>
        <div className="flex flex-wrap gap-2"><Btn variant="ghost" disabled={!q || busy} onClick={() => q && speak(q.question)}><Volume2 size={16} />Replay</Btn>
          <Btn variant="ghost" disabled={phase !== 'speaking'} onClick={stopSpeak}><Square size={16} />Stop speaking</Btn>
          <Btn variant="ghost" disabled={!q || busy || !!fb} onClick={() => submit(true)}><SkipForward size={16} />Skip</Btn></div></Card>
      <Card className="space-y-3">
        {fb ? <div className="space-y-2 text-sm"><p className="text-2xl font-bold">Score {fb.score}</p><p><b>Strengths:</b> {fb.strengths.join('; ')}</p><p><b>Weaknesses:</b> {fb.weaknesses.join('; ')}</p>
          <p><b>Missing:</b> {fb.missing.join('; ') || 'Nothing major'}</p><p><b>Tips:</b> {fb.tips.join('; ')}</p>
          <Btn className="mt-2" onClick={loadNext}>{q.index + 1 >= iv.questionCount ? 'Finish and view report' : 'Next question'}</Btn></div> : <>
          <div className="flex flex-wrap gap-2">{phase === 'listening' ? <Btn variant="danger" onClick={stopListen}><MicOff size={16} />Stop listening</Btn> : <Btn disabled={!q || busy} onClick={startListen}><Mic size={16} />Start listening</Btn>}
            <Btn variant="ghost" disabled={busy} onClick={() => { stopListen(); setAnswer(''); setInterim('') }}><RotateCcw size={16} />Retry</Btn></div>
          <textarea aria-label="Your answer" rows={8} className="w-full rounded-xl border border-white/10 bg-panel p-3.5 text-white placeholder:text-slate-500" placeholder="Speak, or type your answer here…" value={answer} disabled={busy} onChange={e => setAnswer(e.target.value)} />
          {interim && <p className="text-sm italic text-slate-400">…{interim}</p>}
          <Btn className="w-full" disabled={busy || !q} onClick={() => submit()}>{phase === 'evaluating' ? 'Evaluating…' : 'Submit answer'}</Btn></>}
        <ErrorBox msg={err} /></Card></div></div>
}
