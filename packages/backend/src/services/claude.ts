import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const CONVERSATION_SYSTEM_PROMPT = `You are The Archivist, an intelligent interviewer helping someone think clearly about what they want from later life. Your tone is clean and professional — think The Economist, not poetry. You are genuinely curious and direct.

RULES:
- Ask ONE question at a time. Never ask multiple questions.
- Each question should build on what the person just said, showing you paid attention.
- Push for specifics: where exactly, who with, how often, what does a typical week look like.
- Cover these themes across 3-5 exchanges: activities/passions, travel/location, relationships/community, creative pursuits, daily rhythm.
- When you have a clear picture (after 3-5 exchanges), end your response with the exact marker: [CONVERSATION_COMPLETE]
- Keep responses to 1-2 crisp sentences. No metaphors, no flowery language.
- Be direct and engaged. Acknowledge what they said briefly, then ask the next question.
- Reference specific details the user mentioned. Never be generic.`

const CANVAS_SYSTEM_PROMPT = `You are The Archivist. Based on the conversation transcript below, distill the person's aspirations into 3-5 evocative "canvas cards" — each representing a key pillar of their desired later life.

Respond ONLY with valid JSON in this exact format:
{
  "cards": [
    {
      "title": "Short evocative title (2-5 words)",
      "description": "One vivid sentence describing this aspiration",
      "category": "activity|travel|creative|cultural|social",
      "imageQuery": "Unsplash search query for a striking editorial photograph"
    }
  ]
}

RULES:
- Create exactly 3-5 cards based on the richness of the conversation.
- Titles should be poetic but concrete: "Golf in Portugal", "A Month in Italy", "Music."
- Descriptions should be sensory and specific, not generic.
- Image queries should describe cinematic, editorial-style photography.
- Categories must be one of: activity, travel, creative, cultural, social.
- Ensure variety across categories.`

const SCENARIO_SYSTEM_PROMPT = `You are The Archivist. Given three retirement scenarios with their financial projections and the person's life aspirations, create evocative narrative framing for each scenario.

Respond ONLY with valid JSON:
{
  "scenarios": [
    {
      "type": "bold_exit",
      "title": "The Bold Exit",
      "milestoneTitle": "Short evocative milestone name (2-3 words)",
      "milestoneDescription": "One sentence describing the defining experience of this path",
      "imageQuery": "Unsplash search query for editorial photography matching this scenario"
    },
    { "type": "balanced_path", "title": "The Balanced Path", "milestoneTitle": "...", "milestoneDescription": "...", "imageQuery": "..." },
    { "type": "legacy_chapter", "title": "The Legacy Chapter", "milestoneTitle": "...", "milestoneDescription": "...", "imageQuery": "..." }
  ]
}

RULES:
- Milestone titles should be 2-3 poetic words that capture the essence of this path.
- Milestone descriptions should reference specific aspirations from the conversation.
- Image queries should evoke the lifestyle of each scenario.
- The Bold Exit emphasises freedom, adventure, and seizing the moment.
- The Balanced Path emphasises harmony, sustainability, and measured enjoyment.
- The Legacy Chapter emphasises building something lasting, generosity, and deeper engagement.`

export async function getConversationResponse(
  openingResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ response: string; isComplete: boolean }> {
  // Count user exchanges (excluding the opening)
  const userExchanges = conversationHistory.filter((m) => m.role === 'user').length

  // Build messages — the opening response is context, not a duplicate message
  const messages: Anthropic.MessageParam[] = []

  if (conversationHistory.length === 0) {
    // First call: just the opening
    messages.push({ role: 'user', content: `My vision for a great day: "${openingResponse}"` })
  } else {
    // Subsequent calls: opening as first message, then full history
    messages.push({ role: 'user', content: `My vision for a great day: "${openingResponse}"` })
    for (const msg of conversationHistory) {
      const role = msg.role === 'archivist' ? 'assistant' : 'user'
      // Merge consecutive same-role messages (shouldn't happen, but safety)
      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.role === role) {
        lastMsg.content += '\n\n' + msg.content
      } else {
        messages.push({ role, content: msg.content })
      }
    }
  }

  // Force completion after 5 user exchanges
  const systemPrompt = userExchanges >= 5
    ? CONVERSATION_SYSTEM_PROMPT + '\n\nIMPORTANT: This is the final exchange. You MUST end your response with [CONVERSATION_COMPLETE]. Wrap up warmly.'
    : userExchanges >= 3
    ? CONVERSATION_SYSTEM_PROMPT + '\n\nNote: You have covered several themes. If you feel you have a rich picture, end with [CONVERSATION_COMPLETE]. Otherwise, ask one more question.'
    : CONVERSATION_SYSTEM_PROMPT

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const isComplete = text.includes('[CONVERSATION_COMPLETE]') || userExchanges >= 5
  const cleanedText = text.replace('[CONVERSATION_COMPLETE]', '').trim()

  return { response: cleanedText, isComplete }
}

// Extract JSON from Claude's response, handling markdown code fences
function extractJson(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Strip markdown code fences if present
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim())
    }
    throw new Error(`Failed to parse Claude response as JSON: ${text.slice(0, 200)}`)
  }
}

export async function generateCanvasCards(
  conversationTranscript: string
): Promise<Array<{ title: string; description: string; category: string; imageQuery: string }>> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: CANVAS_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: conversationTranscript },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = extractJson(text)
  return parsed.cards || []
}

export async function generateScenarioNarratives(
  conversationSummary: string,
  canvasCards: string,
  financialSummary: string
): Promise<Array<{ type: string; title: string; milestoneTitle: string; milestoneDescription: string; imageQuery: string }>> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SCENARIO_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `CONVERSATION SUMMARY:\n${conversationSummary}\n\nCANVAS CARDS:\n${canvasCards}\n\nFINANCIAL OVERVIEW:\n${financialSummary}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const parsed = extractJson(text)
  return parsed.scenarios || []
}
