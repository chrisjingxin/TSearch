import React, { useEffect } from 'react'
import { useKeyboard, useTerminalDimensions } from '@opentui/react'
import { theme } from '../theme'
import { useTui } from '../state'
import { MessageBubble } from '../components/message'
import { Prompt } from '../components/prompt'
import { Sidebar } from '../components/sidebar'

export function SessionView() {
  const { messages, sessionTitle, isLoading, error, setView, createSession, loadSessions } = useTui()
  const { width } = useTerminalDimensions()
  const showSidebar = width > 120

  useEffect(() => {
    loadSessions()
  }, [])

  useKeyboard((key: any) => {
    if (key.ctrl && key.name === 'n') {
      createSession()
    }
    if (key.ctrl && key.name === 'l') {
      loadSessions()
    }
    if (key.name === 'escape') {
      setView('home')
    }
  })

  return (
    <box flexDirection="row" width="100%" height="100%">
      {/* Main content area */}
      <box flexDirection="column" flexGrow={1}>
        {/* Header - single line */}
        <box
          paddingLeft={2}
          border={['bottom']}
          borderColor={theme.border}
          flexShrink={0}
        >
          <text fg={theme.text} attributes={1}>
            {(sessionTitle || 'Session') + '  — TSearch'}
          </text>
        </box>

        {/* Messages */}
        <scrollbox flexGrow={1} stickyScroll={true} stickyStart="bottom">
          {messages.length === 0 && !isLoading && (
            <box paddingLeft={3} paddingTop={2}>
              <text fg={theme.textMuted}>开始对话吧...</text>
            </box>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={`${msg.role}-${i}`} message={msg} />
          ))}
          {error && (
            <box paddingLeft={3} paddingTop={1}>
              <text fg={theme.error}>✗ {error}</text>
            </box>
          )}
        </scrollbox>

        {/* Prompt area */}
        <box border={['top']} borderColor={theme.border} flexShrink={0}>
          <Prompt view="session" />
        </box>

        {/* Status bar - single line */}
        <box paddingLeft={2} flexShrink={0}>
          <text fg={theme.textMuted}>Ctrl+N 新会话  Esc 返回</text>
        </box>
      </box>

      {/* Sidebar */}
      {showSidebar && <Sidebar />}
    </box>
  )
}
