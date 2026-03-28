'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'

export default function JoyConversationPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const {
    sessionId,
    greatDayResponse,
    conversationMessages,
    isConversationComplete,
    addConversationMessage,
    setConversationComplete,
  } = useSessionStore()

  // Get first AI question on mount
  useEffect(() => {
    if (!sessionId || conversationMessages.length > 0) {
      setIsInitializing(false)
      return
    }

    const initConversation = async () => {
      try {
        const { archivistResponse, isComplete } = await api.sendConversationMessage(
          sessionId,
          greatDayResponse
        )
        addConversationMessage({
          id: crypto.randomUUID(),
          role: 'user',
          content: greatDayResponse,
          sequenceOrder: 1,
        })
        addConversationMessage({
          id: crypto.randomUUID(),
          role: 'archivist',
          content: archivistResponse,
          sequenceOrder: 2,
        })
        if (isComplete) setConversationComplete(true)
      } catch (err) {
        console.error('Failed to initialize conversation:', err)
      } finally {
        setIsInitializing(false)
      }
    }

    initConversation()
  }, [sessionId])

  const handleSubmit = async () => {
    if (!input.trim() || !sessionId || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    const nextOrder = conversationMessages.length + 1
    addConversationMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      sequenceOrder: nextOrder,
    })

    try {
      const { archivistResponse, isComplete } = await api.sendConversationMessage(
        sessionId,
        userMessage
      )
      addConversationMessage({
        id: crypto.randomUUID(),
        role: 'archivist',
        content: archivistResponse,
        sequenceOrder: nextOrder + 1,
      })
      if (isComplete) setConversationComplete(true)
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <TopNav activeSection="directives" />
      <main className="pt-24 pb-32 px-6 md:px-24 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-24 mt-12">
          <p className="font-label uppercase tracking-[0.4em] text-[10px] text-primary mb-4">
            Interviewer Series No. 04
          </p>
          <h2 className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-none text-on-surface max-w-3xl">
            The Joy Conversation
          </h2>
          <div className="mt-8 h-[1px] w-24 bg-outline-variant/30" />
        </header>

        {/* Conversation Thread */}
        <div className="space-y-24 max-w-4xl">
          {isInitializing && (
            <div className="text-center py-12">
              <p className="font-body text-secondary animate-pulse">The Archivist is preparing...</p>
            </div>
          )}

          {conversationMessages.map((msg, index) => (
            <section key={msg.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {msg.role === 'archivist' ? (
                <>
                  <div className="md:col-span-3">
                    <span className="font-label uppercase tracking-widest text-[9px] text-outline opacity-60">
                      The Archivist
                    </span>
                  </div>
                  <div className="md:col-span-9">
                    <blockquote className="font-headline text-2xl italic font-light text-on-surface-variant leading-relaxed">
                      &ldquo;{msg.content}&rdquo;
                    </blockquote>
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-3 md:order-2 text-right md:text-left">
                    <span className="font-label uppercase tracking-widest text-[9px] text-primary">
                      Your Directive
                    </span>
                  </div>
                  <div className="md:col-span-9 md:order-1">
                    <p className="font-headline text-3xl font-normal text-on-surface leading-snug">
                      {msg.content}
                    </p>
                  </div>
                </>
              )}
            </section>
          ))}

          {/* Input or Continue CTA */}
          {isConversationComplete ? (
            <section className="text-center py-12">
              <button
                onClick={() => router.push('/health-energy')}
                className="px-12 py-5 bg-primary text-on-primary font-label text-xs uppercase tracking-[0.3em] hover:bg-primary-container transition-all duration-500 shadow-lg"
              >
                Continue to the Next Chapter
              </button>
            </section>
          ) : !isInitializing && (
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-12 pb-24">
              <div className="md:col-span-3">
                <span className="font-label uppercase tracking-widest text-[9px] text-primary">
                  Continuing...
                </span>
              </div>
              <div className="md:col-span-9 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Speak your mind..."
                  disabled={isLoading}
                  className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-3xl placeholder:text-outline/30 min-h-[150px] resize-none pb-4"
                />
                <div className="flex justify-between items-center mt-6">
                  <span className="font-label text-[10px] text-outline-variant">
                    {isLoading ? 'The Archivist is reflecting...' : 'Recording thought thread...'}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className="font-label uppercase tracking-widest text-[11px] text-primary font-bold flex items-center gap-2 group disabled:opacity-40"
                  >
                    Commit Entry
                    <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
