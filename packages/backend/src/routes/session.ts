import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/connection.js'
import { validateSession } from '../middleware/validateSession.js'

export const sessionRouter = Router()

// Create a new session
sessionRouter.post('/', (_req, res) => {
  const db = getDb()
  const id = uuidv4()
  db.prepare('INSERT INTO sessions (id) VALUES (?)').run(id)
  res.json({ sessionId: id })
})

// Get full session state
sessionRouter.get('/:sessionId', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params

  const opening = db.prepare('SELECT * FROM opening_responses WHERE session_id = ?').get(sessionId)
  const messages = db.prepare('SELECT * FROM conversation_messages WHERE session_id = ? ORDER BY sequence_order').all(sessionId)
  const health = db.prepare('SELECT * FROM health_selections WHERE session_id = ?').get(sessionId)
  const cards = db.prepare('SELECT * FROM canvas_cards WHERE session_id = ? ORDER BY sequence_order').all(sessionId)
  const financial = db.prepare('SELECT * FROM financial_data WHERE session_id = ?').get(sessionId)
  const scenarios = db.prepare('SELECT * FROM scenarios WHERE session_id = ?').all(sessionId)

  res.json({
    session,
    opening,
    messages,
    health,
    cards,
    financial,
    scenarios,
  })
})

// Save opening response
sessionRouter.post('/:sessionId/opening', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params
  const { greatDayResponse } = req.body

  if (!greatDayResponse) {
    res.status(400).json({ message: 'greatDayResponse is required' })
    return
  }

  const id = uuidv4()
  db.prepare('INSERT INTO opening_responses (id, session_id, great_day_response) VALUES (?, ?, ?)').run(id, sessionId, greatDayResponse)
  db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId)

  res.json({ success: true })
})

// Save health selection
sessionRouter.post('/:sessionId/health', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params
  const { activityLevel } = req.body

  if (!['explorer', 'harmonist', 'observer'].includes(activityLevel)) {
    res.status(400).json({ message: 'activityLevel must be explorer, harmonist, or observer' })
    return
  }

  const id = uuidv4()
  // Replace any existing selection
  db.prepare('DELETE FROM health_selections WHERE session_id = ?').run(sessionId)
  db.prepare('INSERT INTO health_selections (id, session_id, activity_level) VALUES (?, ?, ?)').run(id, sessionId, activityLevel)
  db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId)

  res.json({ success: true })
})

// Save financial data
sessionRouter.post('/:sessionId/financial', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params
  const { totalAssets, annualPension, targetRetirementAge, targetRetirementYear, fixedAnnualSpend, discretionaryAnnualSpend } = req.body

  const id = uuidv4()
  // Replace any existing data
  db.prepare('DELETE FROM financial_data WHERE session_id = ?').run(sessionId)
  db.prepare(`
    INSERT INTO financial_data (id, session_id, total_assets, annual_pension, target_retirement_age, target_retirement_year, fixed_annual_spend, discretionary_annual_spend)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sessionId, totalAssets, annualPension, targetRetirementAge, targetRetirementYear, fixedAnnualSpend, discretionaryAnnualSpend)
  db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId)

  res.json({ success: true })
})
