import { z } from 'zod'
const st = (status: number, m: string) => Object.assign(new Error(m), { status })
async function llmJson<T>(system: string, user: string, schema: z.ZodType<T>): Promise<T> {
  const { AI_API_KEY, AI_MODEL = 'gpt-4o-mini', AI_BASE_URL = 'https://api.openai.com/v1' } = process.env
  if (!AI_API_KEY) throw st(503, 'AI provider is not configured. Set AI_API_KEY on the server.')
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 30000)
  try {
    const r = await fetch(`${AI_BASE_URL}/chat/completions`, { method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }) })
    if (r.status === 429) throw st(429, 'AI provider rate limit reached. Try again shortly.')
    if (!r.ok) throw st(502, 'AI provider returned an error.')
    const j: any = await r.json()
    return schema.parse(JSON.parse(j.choices[0].message.content))
  } catch (e: any) {
    if (e.status) throw e
    if (e.name === 'AbortError') throw st(504, 'AI provider timed out.')
    throw st(502, 'AI returned an invalid response. Please retry.')
  } finally { clearTimeout(t) }
}
const ctx = (i: any) => `Role: ${i.jobRole}; level: ${i.experienceLevel}; type: ${i.interviewType}; difficulty: ${i.difficulty}; language: ${i.language}.` +
  (i.jobDescription ? `\nJob description: ${i.jobDescription}` : '') + (i.resumeText ? `\nResume: ${i.resumeText.slice(0, 2000)}` : '')
export const genQuestion = (i: any) => {
  const prev = i.qa.map((q: any, n: number) => `${n + 1}. ${q.question} (score ${q.evaluation?.score ?? 'n/a'})`).join('\n') || 'none'
  return llmJson(
    'You are a professional interviewer. Ask ONE question at a time. Never repeat earlier questions. Adapt difficulty to previous scores; ask a follow-up when an earlier answer was weak. If language is Hinglish, write in Roman-script Hindi-English mix. Reply JSON: {"question": string, "topic": string}.',
    `${ctx(i)}\nQuestion ${i.qa.length + 1} of ${i.questionCount}.\nPrevious questions:\n${prev}`,
    z.object({ question: z.string().min(5).max(600), topic: z.string().min(2).max(60) }))
}
const sc = z.number().min(0).max(100)
export const evaluate = (i: any, q: any, answer: string) => llmJson(
  'You are a strict, consistent interview evaluator. Judge relevance, technical correctness, explanation quality, structure, communication clarity and missing concepts from the TEXT only (do not infer emotion, confidence or pronunciation). Reply JSON: {"score":0-100,"technical":0-100,"communication":0-100,"structure":0-100,"strengths":string[],"weaknesses":string[],"missing":string[],"tips":string[],"betterAnswer":string,"followUp":string}.',
  `${ctx(i)}\nQuestion: ${q.question}\nCandidate answer: ${answer}`,
  z.object({ score: sc, technical: sc, communication: sc, structure: sc, strengths: z.array(z.string()), weaknesses: z.array(z.string()),
    missing: z.array(z.string()), tips: z.array(z.string()), betterAnswer: z.string(), followUp: z.string() }))
