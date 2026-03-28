import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/connection.js'
import { getConversationResponse } from '../services/claude.js'

export const conversationRouter = Router()

// Send a message and get AI response
conversationRouter.post('/:sessionId/conversation', async (req, res, next) => {
  try {
    const db = getDb()
    const { sessionId } = req.params
    const { message } = req.body

    if (!message) {
      res.status(400).json({ message: 'message is required' })
      return
    }

    // Get opening response
    const opening = db.prepare('SELECT great_day_response FROM opening_responses WHERE session_id = ?').get(sessionId) as any
    if (!opening) {
      res.status(400).json({ message: 'Opening response not found. Complete the opening first.' })
      return
    }

    // Get existing conversation
    const existingMessages = db.prepare(
      'SELECT role, content FROM conversation_messages WHERE session_id = ? ORDER BY sequence_order'
    ).all(sessionId) as Array<{ role: string; content: string }>

    // Get next sequence order
    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sequence_order), 0) as max_order FROM conversation_messages WHERE session_id = ?'
    ).get(sessionId) as any

    // Save user message
    const userMsgId = uuidv4()
    const userOrder = maxOrder.max_order + 1
    db.prepare(
      'INSERT INTO conversation_messages (id, session_id, role, content, sequence_order) VALUES (?, ?, ?, ?, ?)'
    ).run(userMsgId, sessionId, 'user', message, userOrder)

    // Build full conversation history including the just-saved user message.
    // getConversationResponse will prepend the opening as context on first call,
    // and merge consecutive user messages to avoid duplicates.
    const fullHistory = [...existingMessages, { role: 'user', content: message }]

    const { response: archivistResponse, isComplete } = await getConversationResponse(
      opening.great_day_response,
      fullHistory
    )

    // Save archivist response
    const archivistMsgId = uuidv4()
    db.prepare(
      'INSERT INTO conversation_messages (id, session_id, role, content, sequence_order) VALUES (?, ?, ?, ?, ?)'
    ).run(archivistMsgId, sessionId, 'archivist', archivistResponse, userOrder + 1)

    db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId)

    res.json({ archivistResponse, isComplete })
  } catch (err) {
    next(err)
  }
})

// Get full conversation thread
conversationRouter.get('/:sessionId/conversation', (req, res) => {
  const db = getDb()
  const { sessionId } = req.params

  const messages = db.prepare(
    'SELECT id, role, content, sequence_order, created_at FROM conversation_messages WHERE session_id = ? ORDER BY sequence_order'
  ).all(sessionId)

  res.json({ messages })
})
