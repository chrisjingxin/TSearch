import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  loadCredentials,
  fetchModels,
  createChatSession,
  sendMessage,
  parseSSEStream,
  fetchSessions,
  fetchMessages,
  getConfig,
  setConfig,
  addSession,
  loadSessions as loadLocalSessions,
  setCurrentSessionId,
} from './lib/api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
}

export interface Session {
  chat_session_id: string
  chat_session_title: string
  chat_session_update_time: string
}

export interface TuiState {
  view: 'home' | 'session'
  sessionId: string | null
  sessionTitle: string
  messages: Message[]
  sessions: Session[]
  currentModel: string
  models: any[]
  isLoading: boolean
  error: string | null

  init: () => void
  loadModels: () => Promise<void>
  loadSessions: () => Promise<void>
  createSession: () => Promise<string | null>
  switchSession: (id: string, title?: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  switchModel: (model: string) => void
  setView: (view: 'home' | 'session') => void
  exportCurrentSession: () => Promise<void>
}

const TuiContext = createContext<TuiState | null>(null)

export function TuiProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<'home' | 'session'>('home')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentModel, setCurrentModel] = useState('最佳')
  const [models, setModels] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cookieRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const init = useCallback(() => {
    try {
      const { cookieHeader } = loadCredentials()
      cookieRef.current = cookieHeader
      const model = getConfig('model') || '最佳'
      setCurrentModel(model)
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
    }
  }, [])

  const loadModelsFn = useCallback(async () => {
    if (!cookieRef.current) return
    try {
      const list = await fetchModels(cookieRef.current)
      if (mountedRef.current) setModels(list)
    } catch {
      // ignore
    }
  }, [])

  const loadSessionsFn = useCallback(async () => {
    // Load local sessions first (always available)
    const localSessions = loadLocalSessions()

    // Try to fetch remote sessions
    let remoteSessions: any[] = []
    try {
      remoteSessions = await fetchSessions(1, 50)
    } catch {
      // Remote fetch failed, use local only
    }

    // Merge: remote sessions with real titles, then local sessions with messages
    const sessionMap = new Map<string, any>()

    // Remote sessions: only keep those with a real title
    for (const s of remoteSessions) {
      if (!s.chat_session_title) continue
      sessionMap.set(s.chat_session_id, {
        chat_session_id: s.chat_session_id,
        chat_session_title: s.chat_session_title,
        chat_session_update_time: s.chat_session_update_time,
        source: 'remote',
      })
    }

    // Local sessions: only add if not already in remote, check messages in parallel
    const localToCheck = localSessions.filter((s) => !sessionMap.has(s.id)).slice(0, 10)
    const checkedLocal = await Promise.all(
      localToCheck.map(async (s: any) => {
        try {
          const msgs = await fetchMessages(s.chat_session_id)
          if (msgs.length > 0) {
            return {
              chat_session_id: s.id,
              chat_session_title: s.title || '新会话',
              chat_session_update_time: s.updatedAt,
              source: 'local',
            }
          }
        } catch {}
        return null
      })
    )

    const allSessions = [
      ...Array.from(sessionMap.values()),
      ...checkedLocal.filter(Boolean),
    ].sort((a: any, b: any) => new Date(b.chat_session_update_time).getTime() - new Date(a.chat_session_update_time).getTime())

    if (mountedRef.current) setSessions(allSessions)
  }, [])

  const createSessionFn = useCallback(async () => {
    if (!cookieRef.current) return null
    try {
      const id = await createChatSession(cookieRef.current)
      if (!mountedRef.current) return id
      setSessionId(id)
      setSessionTitle('新会话')
      setMessages([])
      setCurrentSessionId(id)
      addSession({ id, title: '新会话', updatedAt: new Date().toISOString() })
      setView('session')
      return id
    } catch (err: any) {
      if (mountedRef.current) setError(err.message)
      return null
    }
  }, [])

  const switchSessionFn = useCallback(async (id: string, title?: string) => {
    if (!mountedRef.current) return
    setSessionId(id)
    setSessionTitle(title || '会话')
    setCurrentSessionId(id)
    setMessages([])
    setView('session')
    setIsLoading(true)
    setError(null)
    try {
      const msgs = await fetchMessages(id)
      if (mountedRef.current) {
        setMessages(msgs)
        if (title) {
          setSessionTitle(title)
        }
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setMessages([])
        setError(err.message || '加载历史消息失败')
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  const sendMsg = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      let sid = sessionId

      if (!sid) {
        if (!cookieRef.current) return
        sid = await createChatSession(cookieRef.current)
        if (!mountedRef.current) return
        setSessionId(sid)
        setSessionTitle('新会话')
        setCurrentSessionId(sid)
        addSession({ id: sid, title: '新会话', updatedAt: new Date().toISOString() })
        setView('session')
      }

      const userMsg: Message = { role: 'user', content }
      if (mountedRef.current) {
        setMessages((prev) => [...prev, userMsg])
        setIsLoading(true)
        setError(null)
      }

      try {
        // Add placeholder assistant message for streaming updates
        setMessages((prev) => [...prev, { role: 'assistant', content: '', thinking: '' }])

        const response = await sendMessage(sid!, content, cookieRef.current!, currentModel)
        const result = await parseSSEStream(response, (chunk: { type: string; text: string }) => {
          if (!mountedRef.current) return
          if (chunk.type === 'thinking') {
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, thinking: (last.thinking || '') + chunk.text }
              }
              return updated
            })
          } else if (chunk.type === 'content') {
            setMessages((prev) => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last && last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + chunk.text }
              }
              return updated
            })
          }
        })

        if (!mountedRef.current) return
        const raw = typeof result === 'object' ? result.content : String(result ?? '')
        const thinking = typeof result === 'object' ? result.thinking : ''

        // Update final content if needed
        if (raw.trim()) {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: raw, thinking: thinking || last.thinking }
            }
            return updated
          })
        } else {
          setMessages((prev) => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last && last.role === 'assistant' && !last.content) {
              updated[updated.length - 1] = { ...last, content: '(无回复内容)' }
            }
            return updated
          })
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message)
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    },
    [sessionId, currentModel, isLoading],
  )

  const switchModel = useCallback((model: string) => {
    setCurrentModel(model)
    setConfig('model', model)
  }, [])

  const exportCurrentSession = useCallback(async () => {
    // Export is handled via the existing CLI export command
    // For now, just a placeholder
  }, [])

  const value = useMemo(
    () => ({
      view,
      sessionId,
      sessionTitle,
      messages,
      sessions,
      currentModel,
      models,
      isLoading,
      error,
      init,
      loadModels: loadModelsFn,
      loadSessions: loadSessionsFn,
      createSession: createSessionFn,
      switchSession: switchSessionFn,
      sendMessage: sendMsg,
      switchModel,
      setView,
      exportCurrentSession,
    }),
    [
      view,
      sessionId,
      sessionTitle,
      messages,
      sessions,
      currentModel,
      models,
      isLoading,
      error,
      init,
      loadModelsFn,
      loadSessionsFn,
      createSessionFn,
      switchSessionFn,
      sendMsg,
      switchModel,
      exportCurrentSession,
    ],
  )

  return <TuiContext.Provider value={value}>{children}</TuiContext.Provider>
}

export function useTui(): TuiState {
  const ctx = useContext(TuiContext)
  if (!ctx) throw new Error('useTui must be used within TuiProvider')
  return ctx
}
