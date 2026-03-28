export interface ConversationMessage {
  id: string
  role: 'archivist' | 'user'
  content: string
  sequenceOrder: number
}

export interface CanvasCard {
  id: string
  title: string
  description: string
  category: 'activity' | 'travel' | 'creative' | 'cultural' | 'social'
  imageQuery: string
  sequenceOrder: number
}

export interface FinancialData {
  totalAssets: number
  annualPension: number
  targetRetirementAge: number
  targetRetirementYear: number
  fixedAnnualSpend: number
  discretionaryAnnualSpend: number
}

export interface YearProjection {
  year: number
  median: number
  p10: number
  p90: number
}

export interface Scenario {
  id: string
  type: 'bold_exit' | 'balanced_path' | 'legacy_chapter'
  title: string
  retirementAge: number
  annualSpend: number
  successProbability: number
  milestoneTitle: string
  milestoneDescription: string
  imageQuery: string
  projectionData: YearProjection[]
}

export interface SessionState {
  sessionId: string | null
  currentScreen: number

  greatDayResponse: string
  conversationMessages: ConversationMessage[]
  isConversationComplete: boolean
  activityLevel: 'explorer' | 'harmonist' | 'observer' | null
  canvasCards: CanvasCard[]
  financialData: FinancialData | null
  scenarios: Scenario[]

  setSessionId: (id: string) => void
  setCurrentScreen: (screen: number) => void
  setGreatDayResponse: (response: string) => void
  addConversationMessage: (message: ConversationMessage) => void
  setConversationComplete: (complete: boolean) => void
  setActivityLevel: (level: 'explorer' | 'harmonist' | 'observer') => void
  setCanvasCards: (cards: CanvasCard[]) => void
  setFinancialData: (data: FinancialData) => void
  setScenarios: (scenarios: Scenario[]) => void
  updateScenario: (type: string, updates: Partial<Scenario>) => void
  reset: () => void
}
