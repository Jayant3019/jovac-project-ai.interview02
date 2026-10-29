import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { z, ZodError } from 'zod'
import { Interview, User } from './models'
import { evaluate, genQuestion } from './ai'

const st = (status: number, m: string) => Object.assign(new Error(m), { status })
const h = (f: (req: any, res: Response) => Promise<any>) => (req: Request, res: Response, n: NextFunction) => f(req, res).catch(n)
const prod = process.env.NODE_ENV === 'production'
const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0)

export const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use('/api', rateLimit({ windowMs: 15 * 60e3, limit: 300 }))
const authLimit = rateLimit({ windowMs: 15 * 60e3, limit: 20 })

const setCookie = (res: Response, id: string) => res.cookie('token', jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' }),
  { httpOnly: true, secure: prod, sameSite: (process.env.COOKIE_SAMESITE as any) || 'lax', maxAge: 7 * 864e5 })
const auth = (req: any, res: Response, next: NextFunction) => {
  try { req.uid = (jwt.verify(req.cookies.token, process.env.JWT_SECRET!) as any).id; next() }
  catch { res.status(401).json({ error: 'Session expired. Please log in again.' }) } }
const pub = (u: any) => ({ id: u._id, name: u.name, email: u.email })

// ---- auth ----
const creds = z.object({ email: z.string().email().max(120), password: z.string().min(8).max(100) })
app.post('/api/auth/register', authLimit, h(async (req, res) => {
  const b = creds.extend({ name: z.string().trim().min(2).max(60) }).parse(req.body)
  if (await User.findOne({ email: b.email.toLowerCase() })) throw st(409, 'An account with this email already exists.')
  const u = await User.create({ name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 12) })
  setCookie(res, String(u._id)); res.status(201).json({ user: pub(u) })
}))
app.post('/api/auth/login', authLimit, h(async (req, res) => {
  const b = creds.parse(req.body); const u = await User.findOne({ email: b.email.toLowerCase() })
  if (!u || !(await bcrypt.compare(b.password, u.passwordHash))) throw st(401, 'Invalid email or password.')
  setCookie(res, String(u._id)); res.json({ user: pub(u) })
}))
app.post('/api/auth/logout', (_q, res) => { res.clearCookie('token'); res.json({ ok: true }) })
const me = h(async (req, res) => { const u = await User.findById(req.uid); if (!u) throw st(401, 'Account not found.'); res.json({ user: pub(u) }) })
app.get('/api/auth/me', auth, me); app.get('/api/users/me', auth, me)
app.patch('/api/users/me', auth, h(async (req, res) => {
  const b = z.object({ name: z.string().trim().min(2).max(60) }).parse(req.body)
  res.json({ user: pub(await User.findByIdAndUpdate(req.uid, b, { new: true })) })
}))

// ---- interviews ----
const load = async (req: any) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw st(400, 'Invalid interview id.')
  const i = await Interview.findOne({ _id: req.params.id, userId: req.uid }); if (!i) throw st(404, 'Interview not found.'); return i }
const setup = z.object({
  jobRole: z.enum(['Java Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst', 'AI/ML Engineer']),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']), interviewType: z.enum(['HR', 'Technical', 'Coding', 'Behavioral', 'Mixed']),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']), language: z.enum(['English', 'Hinglish']),
  duration: z.number().refine(n => [5, 10, 15, 20, 30].includes(n), 'must be 5, 10, 15, 20 or 30'),
  questionCount: z.number().int().min(1).max(15), jobDescription: z.string().max(3000).optional(), resumeText: z.string().max(6000).optional() })
app.post('/api/interviews', auth, h(async (req, res) => {
  const i = await Interview.create({ ...setup.parse(req.body), userId: req.uid, startedAt: new Date() }); res.status(201).json({ id: i._id })
}))
app.get('/api/interviews', auth, h(async (req, res) => {
  const l = await Interview.find({ userId: req.uid }).sort({ createdAt: -1 }).limit(100)
  res.json({ interviews: l.map(i => ({ id: i._id, jobRole: i.jobRole, interviewType: i.interviewType, difficulty: i.difficulty, status: i.status,
    startedAt: i.startedAt, questions: i.qa.length, score: i.report?.overall ?? null })) })
}))
app.get('/api/interviews/:id', auth, h(async (req, res) => res.json({ interview: await load(req) })))
app.get('/api/reports/:id', auth, h(async (req, res) => {
  const i = await load(req); if (!i.report) throw st(404, 'Report not available yet.'); res.json({ report: i.report })
}))
app.post('/api/interviews/:id/next-question', auth, h(async (req, res) => {
  const i = await load(req); if (i.status !== 'active') throw st(409, 'Interview already finished.')
  const last: any = i.qa[i.qa.length - 1]
  if (last && !last.evaluation && !last.skipped) return res.json({ index: i.qa.length - 1, question: last.question, topic: last.topic, total: i.questionCount })
  if (i.qa.length >= i.questionCount!) return res.json({ done: true })
  const q = await genQuestion(i); i.qa.push({ question: q.question, topic: q.topic, order: i.qa.length + 1 } as any); await i.save()
  res.json({ index: i.qa.length - 1, question: q.question, topic: q.topic, total: i.questionCount })
}))
app.post('/api/interviews/:id/answers', auth, h(async (req, res) => {
  const b = z.object({ index: z.number().int().min(0), answer: z.string().max(5000).default(''), skip: z.boolean().optional() }).parse(req.body)
  const i = await load(req); const q: any = i.qa[b.index]
  if (i.status !== 'active') throw st(409, 'Interview already finished.')
  if (!q) throw st(404, 'Question not found.'); if (q.evaluation || q.skipped) throw st(409, 'Question already answered.')
  if (b.skip) { q.skipped = true; await i.save(); return res.json({ skipped: true }) }
  if (!b.answer.trim()) throw st(400, 'Answer is empty. Speak or type an answer first.')
  const ev = await evaluate(i, q, b.answer.trim()); q.answer = b.answer.trim(); q.evaluation = ev
  i.markModified('qa'); await i.save(); res.json({ evaluation: ev })
}))
app.post('/api/interviews/:id/finish', auth, h(async (req, res) => {
  const i = await load(req); if (i.report) return res.json({ report: i.report })
  const ev = i.qa.filter((q: any) => q.evaluation).map((q: any) => ({ topic: q.topic, ...q.evaluation }))
  const byTopic: Record<string, number[]> = {}; ev.forEach((e: any) => (byTopic[e.topic] ||= []).push(e.score))
  const topics = Object.entries(byTopic).map(([topic, s]) => ({ topic, score: avg(s) })).sort((a, b) => b.score - a.score)
  const uniq = (k: string) => [...new Set(ev.flatMap((e: any) => e[k] as string[]))].slice(0, 8)
  i.completedAt = new Date(); i.status = 'completed'
  i.report = { overall: avg(ev.map((e: any) => e.score)), technical: avg(ev.map((e: any) => e.technical)), communication: avg(ev.map((e: any) => e.communication)),
    structure: avg(ev.map((e: any) => e.structure)), attempted: i.qa.length, completed: ev.length, durationMin: Math.max(1, Math.round((+i.completedAt - +i.startedAt!) / 60000)),
    strongest: topics.slice(0, 2), weakest: topics.slice(-2).reverse(), recommendations: [...uniq('missing').map(m => `Study: ${m}`), ...uniq('tips')].slice(0, 10) }
  i.markModified('report'); await i.save(); res.json({ report: i.report })
}))

// ---- analytics ----
const overview = h(async (req, res) => {
  const l = await Interview.find({ userId: req.uid, status: 'completed' }).sort({ completedAt: 1 })
  res.json({ completed: l.length, avgScore: avg(l.map(i => i.report.overall)), totalMinutes: l.reduce((s, i) => s + i.report.durationMin, 0),
    skills: [['Technical', 'technical'], ['Communication', 'communication'], ['Structure', 'structure']].map(([name, k]) => ({ name, score: avg(l.map(i => i.report[k])) })),
    trend: l.slice(-12).map(i => ({ date: i.completedAt, score: i.report.overall, role: i.jobRole, id: i._id })) })
})
app.get('/api/analytics/overview', auth, overview); app.get('/api/analytics/progress', auth, overview)

app.use('/api', (_q, res) => res.status(404).json({ error: 'Not found' }))
app.use((e: any, _q: Request, res: Response, _n: NextFunction) => {
  if (e instanceof ZodError) return res.status(400).json({ error: e.issues.map(x => `${x.path.join('.') || 'input'}: ${x.message}`).join('; ') })
  if (e.status) return res.status(e.status).json({ error: e.message })
  console.error('Unhandled:', e.message); res.status(500).json({ error: 'Server error. Please try again.' })
})
