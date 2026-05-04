// ESM wrapper for existing CJS modules (Bun handles interop natively)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api = require('../../api')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = require('../../store')

export const loadCredentials: () => { cookieHeader: string; token: string; userId: string } =
  api.loadCredentials
export const fetchModels: (cookieHeader: string) => Promise<any[]> = api.fetchModels
export const createChatSession: (cookieHeader: string) => Promise<string> = api.createChatSession
export const sendMessage: (
  sessionId: string,
  content: string,
  cookieHeader: string,
  model?: string,
) => Promise<any> = api.sendMessage
export const parseSSEStream: (response: any) => Promise<string> = api.parseSSEStream
export const fetchSessions: (page?: number, size?: number) => Promise<any[]> = api.fetchSessions
export const fetchMessages: (sessionId: string) => Promise<any[]> = api.fetchMessages

export const getConfig: (key: string) => any = store.getConfig
export const setConfig: (key: string, value: any) => void = store.setConfig
export const addSession: (session: any) => void = store.addSession
export const loadSessions: () => any[] = store.loadSessions
export const saveSessions: (sessions: any[]) => void = store.saveSessions
export const setCurrentSessionId: (id: string) => void = store.setCurrentSessionId
export const getCurrentSessionId: () => string | null = store.getCurrentSessionId
