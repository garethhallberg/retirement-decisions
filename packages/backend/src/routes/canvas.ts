import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/connection.js'
import { generateCanvasCards } from '../services/claude.js'
import { validateSession } from '../middleware/validateSession.js'

export const canvasRouter = Router()

// Generate canvas cards from conversation
canvasRouter.post('/:sessionId/canvas/generate', validateSession, async (req, res, next) => {
  try {
    const db = getDb()
    const { sessionId } = req.params

    // Get opening response
    const opening = db.prepare('SELECT great_day_response FROM opening_responses WHERE session_id = ?').get(sessionId) as any

    // Get conversation messages
    const messages = db.prepare(
      'SELECT role, content FROM conversation_messages WHERE session_id = ? ORDER BY sequence_order'
    ).all(sessionId) as Array<{ role: string; content: string }>

    // Build transcript
    let transcript = `Opening: "${opening?.great_day_response || ''}"\n\n`
    for (const msg of messages) {
      const speaker = msg.role === 'archivist' ? 'The Archivist' : 'The Subject'
      transcript += `${speaker}: ${msg.content}\n\n`
    }

    // Generate cards via Claude
    const cards = await generateCanvasCards(transcript)

    // Clear existing cards for this session
    db.prepare('DELETE FROM canvas_cards WHERE session_id = ?').run(sessionId)

    // Save new cards
    const insertStmt = db.prepare(
      'INSERT INTO canvas_cards (id, session_id, title, description, category, image_query, sequence_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    const savedCards = cards.map((card, index) => {
      const id = uuidv4()
      insertStmt.run(id, sessionId, card.title, card.description, card.category, card.imageQuery, index + 1)
      return { id, ...card, sequenceOrder: index + 1 }
    })

    db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId)

    res.json({ cards: savedCards })
  } catch (err) {
    next(err)
  }
})
