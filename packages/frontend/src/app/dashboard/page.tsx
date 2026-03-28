'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'
import type { Scenario } from '@/store/types'

const SCENARIO_STYLES: Record<string, { border: string; bg: string; accent: string }> = {
  bold_exit: {
    border: 'border-t-2 border-primary',
    bg: 'bg-surface-container-low',
    accent: 'text-primary',
  },
  balanced_path: {
    border: 'border-t-2 border-primary-container',
    bg: 'bg-surface-container',
    accent: 'text-primary-container',
  },
  legacy_chapter: {
    border: 'border-t-2 border-outline',
    bg: 'bg-surface-container-high',
    accent: 'text-outline',
  },
}

function ScenarioColumn({ scenario, onRecalculate }: { scenario: Scenario; onRecalculate: (type: string, age: number, spend: number) => void }) {
  const style = SCENARIO_STYLES[scenario.type] || SCENARIO_STYLES.balanced_path
  const [localAge, setLocalAge] = useState(scenario.retirementAge)
  const [localSpend, setLocalSpend] = useState(scenario.annualSpend)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalAge(scenario.retirementAge)
    setLocalSpend(scenario.annualSpend)
  }, [scenario.retirementAge, scenario.annualSpend])

  const debouncedRecalculate = useCallback((type: string, age: number, spend: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onRecalculate(type, age, spend), 300)
  }, [onRecalculate])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const handleAgeChange = useCallback((value: number) => {
    setLocalAge(value)
    debouncedRecalculate(scenario.type, value, localSpend)
  }, [scenario.type, localSpend, debouncedRecalculate])

  const handleSpendChange = useCallback((value: number) => {
    setLocalSpend(value)
    debouncedRecalculate(scenario.type, localAge, value)
  }, [scenario.type, localAge, debouncedRecalculate])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className={`${style.bg} ${style.border} p-0 overflow-hidden`}>
      {/* Image card */}
      <div className="aspect-[4/5] bg-surface-container-highest relative overflow-hidden">
        <div className="w-full h-full bg-gradient-to-b from-on-surface/5 to-on-surface/20 flex items-end">
          <div className="p-8 text-white w-full bg-gradient-to-t from-on-surface/60 to-transparent">
            <p className="font-label text-[9px] uppercase tracking-widest opacity-80 mb-2">
              {scenario.milestoneTitle}
            </p>
            <p className="font-body text-sm opacity-90">{scenario.milestoneDescription}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <h3 className="font-headline text-2xl text-on-surface text-center">{scenario.title}</h3>

        {/* Financial snapshot */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline border-b border-outline-variant/30 pb-3">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Freedom Age</span>
            <span className="font-headline text-2xl text-on-surface">{localAge}</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-outline-variant/30 pb-3">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Annual Spend</span>
            <span className="font-headline text-2xl text-on-surface">{formatCurrency(localSpend)}</span>
          </div>
          <div className="flex justify-between items-baseline pb-3">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Success</span>
            <span className={`font-headline text-3xl ${
              scenario.successProbability >= 90 ? 'text-primary' :
              scenario.successProbability >= 75 ? 'text-primary-container' : 'text-error'
            }`}>
              {scenario.successProbability}%
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div>
            <label className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant block mb-2">
              Retirement Age: {localAge}
            </label>
            <input
              type="range"
              min={50}
              max={75}
              value={localAge}
              onChange={(e) => handleAgeChange(parseInt(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>
          <div>
            <label className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant block mb-2">
              Annual Spend: {formatCurrency(localSpend)}
            </label>
            <input
              type="range"
              min={20000}
              max={200000}
              step={5000}
              value={localSpend}
              onChange={(e) => handleSpendChange(parseInt(e.target.value))}
              className="w-full accent-primary h-1"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { sessionId, scenarios, updateScenario } = useSessionStore()
  const [isRecalculating, setIsRecalculating] = useState<string | null>(null)

  const handleRecalculate = useCallback(async (type: string, age: number, spend: number) => {
    if (!sessionId) return
    setIsRecalculating(type)
    try {
      const result = await api.recalculateScenario(sessionId, type, age, spend)
      updateScenario(type, {
        retirementAge: age,
        annualSpend: spend,
        successProbability: result.successProbability,
        projectionData: result.projectionData,
      })
    } catch (err) {
      console.error('Recalculation failed:', err)
    } finally {
      setIsRecalculating(null)
    }
  }, [sessionId, updateScenario])

  const orderedScenarios = ['bold_exit', 'balanced_path', 'legacy_chapter']
    .map((type) => scenarios.find((s) => s.type === type))
    .filter(Boolean) as Scenario[]

  return (
    <>
      <TopNav activeSection="heritage" />
      <main className="pt-24 pb-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <header className="mb-16 mt-12 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
          <div>
            <p className="font-label uppercase tracking-[0.4em] text-[10px] text-primary mb-4">
              Heritage
            </p>
            <h2 className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-none text-on-surface">
              The Archivist Dashboard
            </h2>
          </div>
          <button className="px-8 py-4 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.3em] hover:bg-primary-container transition-all duration-500 self-start md:self-auto">
            Download Monograph
          </button>
        </header>

        {orderedScenarios.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-headline text-2xl italic text-on-surface-variant">
              No scenarios generated yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {orderedScenarios.map((scenario) => (
              <ScenarioColumn
                key={scenario.type}
                scenario={scenario}
                onRecalculate={handleRecalculate}
              />
            ))}
          </div>
        )}

        {/* Methodology footer */}
        <footer className="mt-24 pt-12 border-t border-outline-variant/30 max-w-3xl mx-auto text-center">
          <p className="font-body text-xs text-outline leading-relaxed">
            Projections are based on Monte Carlo simulations using 10,000 iterations with a mean real return of 5.5%,
            standard deviation of 11%, and an inflation rate of 3.2%. Past performance does not predict future results.
            This is not financial advice — consult a qualified adviser for personalised guidance.
          </p>
        </footer>
      </main>
    </>
  )
}
