import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sessionRouter } from './routes/session.js'
import { conversationRouter } from './routes/conversation.js'
import { canvasRouter } from './routes/canvas.js'
import { scenarioRouter } from './routes/scenarios.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

app.use('/api/sessions', sessionRouter)
app.use('/api/sessions', conversationRouter)
app.use('/api/sessions', canvasRouter)
app.use('/api/sessions', scenarioRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`The Archivist backend running on port ${PORT}`)
})
