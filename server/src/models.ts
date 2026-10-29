import mongoose, { Schema } from 'mongoose'
const qa = new Schema({ question: String, topic: String, order: Number, skipped: Boolean, answer: String, evaluation: Schema.Types.Mixed })
export const User = mongoose.model('User', new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true } }, { timestamps: true }))
export const Interview = mongoose.model('Interview', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobRole: String, experienceLevel: String, interviewType: String, difficulty: String, language: String,
  duration: Number, questionCount: Number, jobDescription: String, resumeText: String,
  status: { type: String, default: 'active' }, startedAt: Date, completedAt: Date,
  qa: [qa], report: Schema.Types.Mixed }, { timestamps: true }))
