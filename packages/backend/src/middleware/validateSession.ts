import { Request, Response, NextFunction } from 'express'
import { getDb } from '../db/connection.js'

export function validateSession(req: Request, res: Response, next: NextFunction) {
  const { sessionId } = req.params
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId is required' })
    return
  }

  const db = getDb()
  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId)
  if (!session) {
    res.status(404).json({ message: 'Session not found' })
    return
  }

  next()
}
