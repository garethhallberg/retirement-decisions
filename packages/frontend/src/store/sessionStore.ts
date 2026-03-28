import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionState } from './types'

const initialState = {
  sessionId: null as string | null,
  currentScreen: 3,
  greatDayResponse: '',
  conversationMessages: [],
  isConversationComplete: false,
  activityLevel: null as 'explorer' | 'harmonist' | 'observer' | null,
  canvasCards: [],
  financialData: null,
  scenarios: [],
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setSessionId: (id) => set({ sessionId: id }),
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      setGreatDayResponse: (response) => set({ greatDayResponse: response }),
      addConversationMessage: (message) =>
        set((state) => ({
          conversationMessages: [...state.conversationMessages, message],
        })),
      setConversationComplete: (complete) =>
        set({ isConversationComplete: complete }),
      setActivityLevel: (level) => set({ activityLevel: level }),
      setCanvasCards: (cards) => set({ canvasCards: cards }),
      setFinancialData: (data) => set({ financialData: data }),
      setScenarios: (scenarios) => set({ scenarios }),
      updateScenario: (type, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.type === type ? { ...s, ...updates } : s
          ),
        })),
      reset: () => set(initialState),
    }),
    {
      name: 'archivist-session',
    }
  )
)
