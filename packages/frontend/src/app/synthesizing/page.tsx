'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'

export default function SynthesizingPage() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [heritageNodes, setHeritageNodes] = useState(0)
  const router = useRouter()
  const { sessionId, setScenarios } = useSessionStore()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const es = new EventSource(`/api/sessions/${sessionId}/scenarios/generate`, {
    })

    // We need to use POST, but EventSource only supports GET.
    // Instead, use fetch with a reader.
    const controller = new AbortController()

    fetch(`/api/sessions/${sessionId}/scenarios/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).then(async (response) => {
      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                console.error('SSE error:', data.error)
                return
              }
              setProgress(data.progress)
              setPhase(data.label)
              setHeritageNodes(Math.floor(data.progress * 24.8))

              if (data.progress === 100 && data.scenarios) {
                setScenarios(data.scenarios)
                setTimeout(() => router.push('/dashboard'), 1500)
              }
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        console.error('Synthesis failed:', err)
      }
    })

    // Close the original EventSource since we're using fetch instead
    es.close()

    return () => {
      controller.abort()
    }
  }, [sessionId])

  // Animated bars
  const bars = Array.from({ length: 12 }, (_, i) => {
    const baseHeight = 20 + Math.random() * 60
    const animatedHeight = Math.min(baseHeight, baseHeight * (progress / 100))
    return animatedHeight
  })

  return (
    <main className="min-h-screen flex flex-col justify-center items-center overflow-hidden relative">
      {/* Decorative floating cards */}
      <div className="absolute top-20 left-20 w-48 h-64 bg-surface-container-low rotate-[-8deg] opacity-30 hidden md:block" />
      <div className="absolute bottom-32 right-16 w-40 h-56 bg-surface-container-low rotate-[12deg] opacity-20 hidden md:block" />
      <div className="absolute top-40 right-40 w-32 h-48 bg-surface-container rotate-[5deg] opacity-25 hidden md:block" />

      <div className="text-center mb-16">
        <p className="font-label uppercase tracking-[0.4em] text-[10px] text-primary mb-4">
          The Archivist
        </p>
        <h1 className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-none text-on-surface">
          Synthesizing<br />
          <span className="italic">Your Future</span>
        </h1>
      </div>

      {/* Progress card */}
      <div className="bg-surface-container-low p-12 max-w-lg w-full mx-6 shadow-xl">
        {/* Bar chart visualization */}
        <div className="flex items-end justify-center gap-2 h-32 mb-8">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-4 bg-primary/20 transition-all duration-1000 ease-out"
              style={{ height: `${height}%` }}
            />
          ))}
          <div className="ml-6 text-right">
            <span className="font-headline text-4xl text-on-surface">{progress}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container-highest h-1 mb-6">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase label */}
        <p className="font-body text-sm text-secondary text-center mb-6">{phase}</p>

        {/* Status tickers */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <span className="font-label text-[9px] uppercase tracking-widest text-outline block">Heritage Nodes</span>
            <span className="font-headline text-lg text-on-surface">{Math.floor(heritageNodes).toLocaleString()} verified</span>
          </div>
          <div>
            <span className="font-label text-[9px] uppercase tracking-widest text-outline block">Monte Carlo Runs</span>
            <span className="font-headline text-lg text-on-surface">{Math.floor(progress * 100).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <p className="mt-12 font-body text-[10px] text-outline max-w-sm text-center">
        This process uses your lifestyle directives and financial data to generate three distinct retirement scenarios.
      </p>

      {/* Vertical editorial lines */}
      <div className="fixed left-24 top-0 h-full w-[1px] bg-outline-variant/10 hidden xl:block" />
      <div className="fixed right-24 top-0 h-full w-[1px] bg-outline-variant/10 hidden xl:block" />
    </main>
  )
}
