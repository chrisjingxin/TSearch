import React, { useEffect } from 'react'
import { theme } from '../theme'
import { useTui } from '../state'
import { useKeyboard } from '@opentui/react'

export function Sidebar() {
  const { sessions, sessionId, sessionTitle, currentModel, switchSession, loadSessions } = useTui()

  useEffect(() => {
    loadSessions()
  }, [])

  useKeyboard((key: any) => {
    if (key.name === 'tab') {
      const idx = sessions.findIndex((s) => s.chat_session_id === sessionId)
      const next = (idx + 1) % sessions.length
      if (sessions[next]) {
        switchSession(sessions[next].chat_session_id, sessions[next].chat_session_title)
      }
    }
  })

  return (
    <box
      width={42}
      flexDirection="column"
      backgroundColor={theme.backgroundPanel}
      border={['left']}
      borderColor={theme.border}
    >
      {/* Header */}
      <box paddingLeft={2} paddingTop={1} paddingBottom={1} border={['bottom']} borderColor={theme.border}>
        <text fg={theme.text} attributes={1}>
          {sessionTitle || 'Session'}
        </text>
      </box>

      {/* Model info */}
      <box paddingLeft={2} paddingTop={1} paddingBottom={1}>
        <text fg={theme.textMuted}>模型 </text>
        <text fg={theme.primary}>{String(currentModel)}</text>
      </box>

      {/* Sessions header */}
      <box paddingLeft={2} paddingBottom={0}>
        <text fg={theme.textMuted} attributes={1}>Sessions</text>
      </box>

      {/* Session list */}
      <scrollbox flexGrow={1} paddingLeft={1} paddingTop={0}>
        {sessions.map((s) => {
          const isActive = s.chat_session_id === sessionId
          return (
            <box key={s.chat_session_id} paddingLeft={1} paddingRight={1}>
              <text fg={isActive ? theme.primary : theme.textMuted}>
                {isActive ? '▸ ' : '  '}
                {s.chat_session_title || '未命名会话'}
              </text>
            </box>
          )
        })}
        {sessions.length === 0 && (
          <box paddingLeft={1}>
            <text fg={theme.textMuted}>暂无会话</text>
          </box>
        )}
      </scrollbox>

      {/* Footer */}
      <box paddingLeft={2} paddingBottom={1} border={['top']} borderColor={theme.border}>
        <text fg={theme.textMuted}>Tab 切换会话</text>
      </box>
    </box>
  )
}
