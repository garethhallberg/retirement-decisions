import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/connection.js'
import { generateThreeScenarios, recalculateSingleScenario } from '../services/scenarioEngine.js'
import { generateScenarioNarratives } from '../services/claude.js'
import { validateSession } from '../middleware/validateSession.js'

export const scenarioRouter = Router()

// Generate scenarios (SSE for progress)
scenarioRouter.post('/:sessionId/scenarios/generate', validateSession, async (req, res) => {
  const db = getDb()
  const { sessionId } = req.params

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendProgress = (phase: number, label: string, progress: number, data?: any) => {
    try {
      res.write(`data: ${JSON.stringify({ phase, label, progress, ...data })}\n\n`)
    } catch {
      // Client disconnected, ignore write errors
    }
  }

  const sendError = (message: string) => {
    try {
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
      res.end()
    } catch {
      // Client disconnected
    }
  }

  try {
    // Phase 1: Gather data
    sendProgress(1, 'Analyzing lifestyle directives', 15)

    const financial = db.prepare('SELECT * FROM financial_data WHERE session_id = ?').get(sessionId) as any
    if (!financial) {
      sendError('Financial data not found')
      return
    }

    const opening = db.prepare('SELECT great_day_response FROM opening_responses WHERE session_id = ?').get(sessionId) as any
    const messages = db.prepare('SELECT role, content FROM conversation_messages WHERE session_id = ? ORDER BY sequence_order').all(sessionId) as any[]
    const cards = db.prepare('SELECT title, description, category FROM canvas_cards WHERE session_id = ? ORDER BY sequence_order').all(sessionId) as any[]

    // Phase 2: Cross-reference
    sendProgress(2, 'Cross-referencing financial data', 40)

    const currentYear = new Date().getFullYear()
    const currentAge = financial.target_retirement_age - (financial.target_retirement_year - currentYear)

    // Phase 3: Run Monte Carlo
    sendProgress(3, 'Running Monte Carlo simulations', 65)

    const scenarios = generateThreeScenarios({
      totalAssets: financial.total_assets,
      annualPension: financial.annual_pension,
      currentAge,
      targetRetirementAge: financial.target_retirement_age,
      fixedAnnualSpend: financial.fixed_annual_spend,
      discretionaryAnnualSpend: financial.discretionary_annual_spend,
    })

    // Phase 4: Generate narratives via Claude
    sendProgress(4, 'Generating scenario narratives', 84)

    const conversationSummary = messages.map((m: any) =>
      `${m.role === 'archivist' ? 'Archivist' : 'Subject'}: ${m.content}`
    ).join('\n')
    const canvasCardsSummary = cards.map((c: any) => `${c.title}: ${c.description}`).join('\n')
    const financialSummary = `Assets: £${financial.total_assets}, Pension: £${financial.annual_pension}/yr, Target retirement: ${financial.target_retirement_age}, Annual spend: £${financial.fixed_annual_spend + financial.discretionary_annual_spend}`

    const narratives = await generateScenarioNarratives(conversationSummary, canvasCardsSummary, financialSummary)

    // Save scenarios to database
    db.prepare('DELETE FROM scenarios WHERE session_id = ?').run(sessionId)
    const insertStmt = db.prepare(`
      INSERT INTO scenarios (id, session_id, scenario_type, retirement_age, annual_spend, success_probability, title, milestone_title, milestone_description, image_query, projection_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const fullScenarios = scenarios.map((scenario) => {
      const narrative = narratives.find((n) => n.type === scenario.type)
      const id = uuidv4()

      insertStmt.run(
        id, sessionId, scenario.type, scenario.retirementAge, scenario.annualSpend,
        scenario.successProbability, narrative?.title || scenario.type,
        narrative?.milestoneTitle || '', narrative?.milestoneDescription || '',
        narrative?.imageQuery || '', JSON.stringify(scenario.projectionData)
      )

      return {
        id,
        type: scenario.type,
        retirementAge: scenario.retirementAge,
        annualSpend: scenario.annualSpend,
        successProbability: scenario.successProbability,
        title: narrative?.title || scenario.type,
        milestoneTitle: narrative?.milestoneTitle || '',
        milestoneDescription: narrative?.milestoneDescription || '',
        imageQuery: narrative?.imageQuery || '',
        projectionData: scenario.projectionData,
      }
    })

    // Phase 5: Complete
    sendProgress(5, 'Complete', 100, { scenarios: fullScenarios })
    res.end()
  } catch (err) {
    console.error('Scenario generation failed:', err)
    sendError('Scenario generation failed. Please try again.')
  }
})

// Recalculate single scenario (for slider changes)
scenarioRouter.post('/:sessionId/scenarios/recalculate', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params
  const { scenarioType, retirementAge, annualSpend } = req.body

  const financial = db.prepare('SELECT * FROM financial_data WHERE session_id = ?').get(sessionId) as any
  if (!financial) {
    res.status(400).json({ message: 'Financial data not found' })
    return
  }

  const currentYear = new Date().getFullYear()
  const currentAge = financial.target_retirement_age - (financial.target_retirement_year - currentYear)

  const result = recalculateSingleScenario(
    financial.total_assets,
    financial.annual_pension,
    currentAge,
    retirementAge,
    annualSpend
  )

  db.prepare(`
    UPDATE scenarios SET retirement_age = ?, annual_spend = ?, success_probability = ?, projection_data = ?
    WHERE session_id = ? AND scenario_type = ?
  `).run(retirementAge, annualSpend, result.successProbability, JSON.stringify(result.projectionData), sessionId, scenarioType)

  res.json({
    scenarioType,
    retirementAge,
    annualSpend,
    successProbability: result.successProbability,
    projectionData: result.projectionData,
  })
})

// Get scenarios
scenarioRouter.get('/:sessionId/scenarios', validateSession, (req, res) => {
  const db = getDb()
  const { sessionId } = req.params

  const scenarios = db.prepare('SELECT * FROM scenarios WHERE session_id = ?').all(sessionId) as any[]

  res.json({
    scenarios: scenarios.map((s) => ({
      id: s.id,
      type: s.scenario_type,
      retirementAge: s.retirement_age,
      annualSpend: s.annual_spend,
      successProbability: s.success_probability,
      title: s.title,
      milestoneTitle: s.milestone_title,
      milestoneDescription: s.milestone_description,
      imageQuery: s.image_query,
      projectionData: JSON.parse(s.projection_data || '[]'),
    })),
  })
})
