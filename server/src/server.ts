import 'dotenv/config'
import mongoose from 'mongoose'
import { app } from './app'
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is required'); process.exit(1) }
if ((process.env.JWT_SECRET || '').length < 32) { console.error('JWT_SECRET must be at least 32 characters'); process.exit(1) }
if (!process.env.AI_API_KEY) console.warn('AI_API_KEY not set: interviews cannot generate questions or evaluations.')
mongoose.connect(process.env.MONGODB_URI).then(() => {
  const p = Number(process.env.PORT) || 4000; app.listen(p, () => console.log(`API on :${p}`))
}).catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1) })
