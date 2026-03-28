'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'

export default function OpeningPage() {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { setSessionId, setGreatDayResponse } = useSessionStore()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!response.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { sessionId } = await api.createSession()
      setSessionId(sessionId)
      await api.saveOpening(sessionId, response.trim())
      setGreatDayResponse(response.trim())
      router.push('/joy-conversation')
    } catch (err) {
      console.error('Failed to create session:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center overflow-hidden">
      <div className="w-full max-w-5xl px-12 md:px-24 flex flex-col items-center justify-center">
        <div className="relative w-full text-center">
          <h1 className="font-headline font-light text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight text-on-surface">
            What does a great day look like for you?
            <span className="inline-block w-[2px] h-[1.1em] bg-primary ml-1 align-middle animate-blink" />
          </h1>

          <form onSubmit={handleSubmit} className="mt-12 opacity-0 focus-within:opacity-100 transition-opacity duration-700">
            <input
              ref={inputRef}
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Begin writing..."
              disabled={isSubmitting}
              className="w-full max-w-lg bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 text-center font-body text-lg py-4 placeholder:text-outline-variant/50 outline-none"
            />
          </form>
        </div>
      </div>

      <footer className="fixed bottom-12 left-0 w-full flex justify-center pointer-events-none">
        <div className="font-label text-[10px] uppercase tracking-[0.4em] text-on-surface/20">
          The Archivist — Vol. I
        </div>
      </footer>
    </main>
  )
}
