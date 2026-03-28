const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  createSession: () =>
    request<{ sessionId: string }>('/sessions', { method: 'POST' }),

  getSession: (sessionId: string) =>
    request<any>(`/sessions/${sessionId}`),

  saveOpening: (sessionId: string, greatDayResponse: string) =>
    request(`/sessions/${sessionId}/opening`, {
      method: 'POST',
      body: JSON.stringify({ greatDayResponse }),
    }),

  sendConversationMessage: (sessionId: string, message: string) =>
    request<{ archivistResponse: string; isComplete: boolean }>(
      `/sessions/${sessionId}/conversation`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    ),

  getConversation: (sessionId: string) =>
    request<{ messages: any[] }>(`/sessions/${sessionId}/conversation`),

  saveHealth: (sessionId: string, activityLevel: string) =>
    request(`/sessions/${sessionId}/health`, {
      method: 'POST',
      body: JSON.stringify({ activityLevel }),
    }),

  generateCanvas: (sessionId: string) =>
    request<{ cards: any[] }>(`/sessions/${sessionId}/canvas/generate`, {
      method: 'POST',
    }),

  saveFinancial: (sessionId: string, data: any) =>
    request(`/sessions/${sessionId}/financial`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recalculateScenario: (
    sessionId: string,
    scenarioType: string,
    retirementAge: number,
    annualSpend: number
  ) =>
    request<any>(`/sessions/${sessionId}/scenarios/recalculate`, {
      method: 'POST',
      body: JSON.stringify({ scenarioType, retirementAge, annualSpend }),
    }),
}
